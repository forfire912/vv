import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Node, Edge, ReactFlowInstance, Connection, Edge as FlowEdge, NodeMouseHandler,
  MiniMap, Controls, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange
} from 'reactflow';
import StimulusPanel from './StimulusPanel';
import StimulusEditPanel from './StimulusEditPanel';
import NodePropertiesPanel from './NodePropertiesPanel';
import { Tabs, Button } from 'antd';
import ComponentPalette from './ComponentPalette';
import NodeContextMenu from './NodeContextMenu'; // 确保正确导入
import { useConfigContext } from '../../context/ConfigContext';
import '../../styles/reactflow-custom.css';
import { exportTopologyJson, saveTopologyByName, loadTopologyByName, getSavedTopologyNames, deleteTopologyByName } from '../../utils/exportUtils'; // 确保正确导入
import { Toolbar } from './Toolbar'; // 确保正确导入
import { TestManagementPanelComplete } from '../../modules/test-management/components/TestManagementPanelComplete';
import type { Stimulus } from './StimulusPanel';

const TopologyEditor: React.FC<{ 
  lang?: 'zh' | 'en';
}> = ({ lang = 'zh' }) => {
  // 补全缺失的 hooks 和 state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  // 运行时获取 VS Code Webview API
  const vscode = (window as any).vscodeApi;
  
  const {cpuList, deviceList } = useConfigContext();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [stimulusList, setStimulusList] = useState<Stimulus[]>([]);
  const [currentName, setCurrentName] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  // 保存拓扑，支持输入名称
  const handleSave = useCallback(() => {
    // 检查节点名称是否唯一
    const nodeNames = new Map();
    let hasDuplicates = false;
    
    nodes.forEach(node => {
      const displayName = node.data.displayName || node.data.label;
      if (nodeNames.has(displayName)) {
        hasDuplicates = true;
        nodeNames.set(displayName, nodeNames.get(displayName) + 1);
      } else {
        nodeNames.set(displayName, 1);
      }
    });
    
    // 如果存在重复名称，提示用户并阻止保存
    if (hasDuplicates) {
      // 生成重复名称列表
      const duplicates = Array.from(nodeNames.entries())
        .filter(([_, count]) => count > 1)
        .map(([name, _]) => name)
        .join(', ');
      
      setToastMsg(`保存失败：存在重复的节点名称 (${duplicates})，请修改后再保存`);
      setTimeout(() => setToastMsg(null), 4000);
      return;
    }
    
    // 名称检查通过，正常保存
    if (currentName) {
      saveTopologyByName(currentName, nodes, edges, stimulusList); // 保存 nodes、edges 和 stimulusList
      setIsDirty(false);
      setToastMsg('保存成功');
      setTimeout(() => setToastMsg(null), 2000);
    } else {
      vscode.postMessage({ type: 'prompt', text: '请输入保存名称:' });
    }
  }, [currentName, nodes, edges, stimulusList, vscode]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'colorful'>('light');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedList, setSavedList] = useState<string[]>([]);
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(320); // 右侧面板宽度 - VS Code 标准侧边栏宽度
  const [isResizing, setIsResizing] = useState<boolean>(false); // 是否正在拖拽调整
  const dividerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // 新增：上下分割拖拽
  const [splitRatio, setSplitRatio] = useState(0.6); // 画布占比
  const [isVResizing, setIsVResizing] = useState(false);
  const vDividerRef = useRef<HTMLDivElement>(null);

  // 本地提示
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 激励相关状态
  const [editStimulus, setEditStimulus] = useState<Stimulus | null>(null);
  // 激励列表筛选相关状态
  const [stimulusTargetFilter, setStimulusTargetFilter] = useState<string | undefined>(undefined);
  // 新增：右侧面板Tab状态 - 添加测试管理
  const [rightTab, setRightTab] = useState<'props' | 'stimulus' | 'testing'>('props');

  // Tab切换时自动清理激励编辑状态
  useEffect(() => {
    setEditStimulus(null);
  }, [rightTab]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    setSavedList(getSavedTopologyNames());
  }, []);

  // 处理扩展宿主返回的输入（包括 deletePrompt）
  useEffect(() => {
    function onPrompt(e: any) {
      const { value: name, action } = e.detail;
      if (!name) return;
      if (action === 'open') {
        const data = loadTopologyByName(name);
        console.log('加载拓扑:', name, data);
        if (data) {
          setNodes(data.nodes);
          setEdges(data.edges);
          // 如果有激励数据则加载，否则初始化为空数组
          setStimulusList(data.stimulusList || []); 
          setCurrentName(name);
          setIsDirty(false);
        }
      } else if (action === 'deletePrompt') {
        vscode.postMessage({
          type: 'confirm',
          text: `确认删除拓扑 "${name}" 吗？`,
          action: 'delete',
          name
        });
      } else {
        // 默认当作保存
        setCurrentName(name);
        console.log('保存拓扑:', name, nodes, edges, stimulusList);
        saveTopologyByName(name, nodes, edges, stimulusList); // 保存 nodes、edges 和 stimulusList
        setIsDirty(false);
      }
      setSavedList(getSavedTopologyNames());
    }
    window.addEventListener('vscode-prompt-response', onPrompt);
    return () => window.removeEventListener('vscode-prompt-response', onPrompt);
  }, [nodes, edges, stimulusList, savedList]);

  // 处理扩展宿主返回的确认（包括 delete、select）
  useEffect(() => {
    function onConfirm(e: any) {
      const { confirmed, action, name } = e.detail;
      if (!action) return;

      if (action === 'delete') {
        if (confirmed) {
          deleteTopologyByName(name);
          setSavedList(getSavedTopologyNames());
          setCurrentName('');
          setNodes([]);
          setEdges([]);
          setStimulusList([]); // 删除拓扑时也清空激励列表
        }
        return;
      }
      else if (action === 'select') {
        // 用户选择要打开的新拓扑
        // 如果确认保存，则先保存当前
        if (confirmed && currentName) {
          saveTopologyByName(currentName, nodes, edges, stimulusList); // 保存 nodes、edges 和 stimulusList
          setIsDirty(false);
        }
        // 打开选中的拓扑
        const data = loadTopologyByName(name);
        if (data) {
          setNodes(data.nodes);
          setEdges(data.edges);
          setStimulusList(data.stimulusList || []); // 加载保存的激励列表或初始化为空数组
          setCurrentName(name);
          setIsDirty(false);
        }
        setSavedList(getSavedTopologyNames());
      }
      else if (action === 'new') {
        if (confirmed && currentName) {
          saveTopologyByName(currentName, nodes, edges, stimulusList); // 保存 nodes、edges 和 stimulusList
          setIsDirty(false);
          setToastMsg('保存成功'); // 提示保存成功
          setTimeout(() => setToastMsg(null), 2000);
        }
        setNodes([]); setEdges([]); setStimulusList([]); setCurrentName(''); setIsDirty(false);
      }
      else {
        // 用户确认保存当前（action 可省略）
        if (confirmed) {
          if (currentName) {
            saveTopologyByName(currentName, nodes, edges, stimulusList); // 保存 nodes、edges 和 stimulusList
            setIsDirty(false);
          } else {
            vscode.postMessage({ type: 'prompt', text: '请输入保存名称:' });
          }
        }
      }
    }
    window.addEventListener('vscode-confirm-response', onConfirm);
    return () => window.removeEventListener('vscode-confirm-response', onConfirm);
  }, [currentName, nodes, edges, stimulusList]);

  // 点击列表时：如果名称改变，先弹确认；否则直接打开
  const handleSelectTopology = useCallback((name: string) => {
    if (!name) return;
    if (currentName && currentName !== name && isDirty) {
      vscode.postMessage({
        type: 'confirm',
        text: '是否保存当前拓扑？',
        action: 'select',
        name
      });
    } else {
      const data = loadTopologyByName(name);
      if (data) {
        console.log('直接切换加载拓扑:', name, data);
        console.log('加载的激励列表:', data.stimulusList);
        
        // 确保激励列表是一个数组且数据完整
        let stimuli = Array.isArray(data.stimulusList) ? [...data.stimulusList] : [];
        
        // 确保每个激励项都有唯一的 key 字段
        stimuli = stimuli.map(item => {
          if (!item.key) {
            return { ...item, key: `stim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
          }
          return item;
        });
        
        console.log('处理后的激励列表:', stimuli);
        
        // 检查并修复可能的节点名称重复问题
        const loadedNodes = [...data.nodes];
        const nodeNameMap = new Map();
        const fixedNodes = loadedNodes.map((node, index) => {
          const displayName = node.data.displayName || node.data.label;
          
          // 如果名称已存在，添加后缀编号
          if (nodeNameMap.has(displayName)) {
            const counter = nodeNameMap.get(displayName) + 1;
            nodeNameMap.set(displayName, counter);
            const newName = `${displayName}_${counter}`;
            
            // 提示用户节点名称已被修改
            if (index === 0) { // 只显示一次提示，避免大量提示扰乱用户
              console.log(`检测到重复节点名称 "${displayName}"，已自动重命名为 "${newName}"`);
            }
            
            // 返回带有修正名称的节点
            return {
              ...node,
              data: {
                ...node.data,
                displayName: newName,
                label: newName
              }
            };
          } else {
            // 记录该名称已存在
            nodeNameMap.set(displayName, 0);
            return node;
          }
        });
        
        setNodes(fixedNodes);
        setEdges(data.edges);
        setStimulusList(stimuli); // 加载处理后的激励列表
        setCurrentName(name);
        
        // 重置激励作用目标过滤器为未选中状态
        // 这样激励列表会显示所有激励，不会因为上一个拓扑的过滤条件而看不到部分激励
        setStimulusTargetFilter(undefined);
        
        // 显示加载提示
        const message = nodeNameMap.size === fixedNodes.length 
          ? `已加载拓扑 "${name}"，包含 ${stimuli.length} 个激励项`
          : `已加载拓扑 "${name}"，包含 ${stimuli.length} 个激励项（已修复重复的节点名称）`;
          
        setToastMsg(message);
        setTimeout(() => setToastMsg(null), 2000);
      }
      setIsDirty(false);
    }
  }, [currentName, isDirty]);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(f => !f);
  }, []);

const handleNew = useCallback(() => {
    if (isDirty) {
        vscode.postMessage({ type: 'confirm', text: '是否保存当前拓扑？', action: 'new', name: currentName });
    } else {
        setNodes([]); // 清空拓扑面板
        setEdges([]);
        setStimulusList([]);
        setCurrentName('');
        setIsDirty(false);
        // 重置激励作用目标过滤器
        setStimulusTargetFilter(undefined);
        setToastMsg('新建成功'); // 提示新建成功
        setTimeout(() => setToastMsg(null), 2000);
    }
}, [isDirty, currentName, vscode]);
  const handleDeleteSaved = useCallback(() => {
    if (currentName) {
      vscode.postMessage({
        type: 'confirm',
        text: `确认删除当前拓扑 "${currentName}" 吗？`,
        action: 'delete',
        name: currentName
      });
    } else {
      vscode.postMessage({
        type: 'prompt',
        text: '请选择要删除的拓扑:\n' + savedList.join('\n'),
        action: 'deletePrompt'
      });
    }
  }, [currentName, savedList]);

  // 节点拖动和属性更新逻辑
  const handleNodeChange = useCallback((id: string, key: string, value: any) => {
    // 如果是修改节点名称，检查名称是否重复
    if (key === 'displayName') {
      // 检查是否有其他节点使用相同的名称
      const isDuplicate = nodes.some(node => 
        node.id !== id && 
        (node.data.displayName === value || node.data.label === value)
      );
      
      if (isDuplicate) {
        setToastMsg('节点名称不能重复，请使用其他名称');
        setTimeout(() => setToastMsg(null), 2000);
        return; // 不更新节点名称
      }
    }
    
    setIsDirty(true);
    setNodes(ns =>
      ns.map(n => {
        if (n.id !== id) return n;
        const newData: any = { ...n.data };
        if (key === 'displayName') {
          newData.displayName = value;
          newData.label = value;
        } else {
          newData[key] = value;
        }
        return { ...n, data: newData };
      })
    );
  }, [nodes]);

  // 连线处理逻辑
  const handleConnect = useCallback((params: Connection | FlowEdge) => {
    setIsDirty(true);
    setEdges(eds => [
      ...eds,
      { ...params, id: `e${params.source}-${params.target}` } as Edge,
    ]);
  }, []);

  // 节点选中逻辑
  const handleNodeClick: NodeMouseHandler = useCallback((_, node) => {
    // 如果正在编辑激励，询问用户是否要切换节点（这会取消当前编辑）
    if (editStimulus && rightTab === 'stimulus') {
      // 暂时简化处理：直接切换，不弹确认框
      // 未来可以添加确认对话框
      setEditStimulus(null);
    }
    
    setSelectedNodeId(node.id);
    // 选中节点后，将节点名称作为激励列表作用目标筛选值
    const nodeName = node.data.displayName || node.data.label || node.data.name || node.id;
    setStimulusTargetFilter(nodeName);
    
    // 默认切到节点属性标签
    setRightTab('props');
  }, [editStimulus, rightTab]);

  // 右键菜单逻辑
  const handleNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault();
    if (reactFlowWrapper.current) {
      const canvasBounds = reactFlowWrapper.current.getBoundingClientRect();
      const x = event.clientX - canvasBounds.left;
      const y = event.clientY - canvasBounds.top;
      setContextMenu({ x, y, nodeId: node.id });
    }
  }, []);

  // 删除节点逻辑
  const handleDeleteNode = useCallback((nodeId: string) => {
    setIsDirty(true);
    setNodes(ns => ns.filter(n => n.id !== nodeId));
    setEdges(es => es.filter(e => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }, [selectedNodeId]);

  // 重命名节点逻辑
  const handleRenameNode = useCallback((nodeId: string) => {
    setIsDirty(true);
    const newLabel = prompt('请输入新名称:');
    if (newLabel) {
      setNodes(ns => {
        const updatedNodes = ns.map(n => (
          n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel, displayName: newLabel } } : n
        ));
        return [...updatedNodes];
      });
    }
  }, []);

  // 切换外设所连 CPU 时，同步更新 edges
  const handleCpuChange = useCallback((peripheralId: string, cpuId: string) => {
    setIsDirty(true);
    setEdges(es => {
      // 移除该外设已有的所有连线
      const filtered = es.filter(e => !(e.source === peripheralId || e.target === peripheralId));
      // 如果选中 CPU，则新建一条 CPU->外设 的连线
      if (cpuId) {
        filtered.push({
          id: `e${cpuId}-${peripheralId}`,
          source: cpuId,
          target: peripheralId
        });
      }
      return filtered;
    });
  }, []);

  // 拖拽调整右侧面板宽度的处理函数
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = rightPanelWidth;

    const handleMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;

        // 获取容器总宽度
        const containerRect = containerRef.current.getBoundingClientRect();
        const totalWidth = containerRect.width;
        
        // 计算新的右侧面板宽度
        const newRightPanelWidth = containerRect.right - e.clientX;
        
        // 设置最小和最大宽度限制
        const minWidth = 300;
        const maxWidth = totalWidth * 0.7;

        // 应用新的宽度，确保在合理范围内
        if (newRightPanelWidth >= minWidth && newRightPanelWidth <= maxWidth) {
            setRightPanelWidth(newRightPanelWidth);
        }
    };

    const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [rightPanelWidth, containerRef]);

  // 拖拽开始逻辑
  const handlePaletteDragStart = useCallback((item: any, event: React.DragEvent) => {
    event.dataTransfer.setData('application/json', JSON.stringify(item));
  }, []);

  // 拖拽到画布时添加节点
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!reactFlowInstance) return;

    setIsDirty(true);
    const data = event.dataTransfer.getData('application/json');
    if (!data) return;

    const item = JSON.parse(data);

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const id = `${item.type}_${Date.now()}`;
    let initName = item.label || item.name;
    
    // 检查名称是否重复，如果重复则自动添加后缀编号
    setNodes(ns => {
      // 检查是否有同名节点
      const existingNames = ns.map(node => node.data.displayName || node.data.label);
      
      // 如果名称重复，添加后缀编号
      if (existingNames.includes(initName)) {
        let counter = 1;
        let newName = `${initName}_${counter}`;
        
        // 循环递增计数器，直到找到一个不重复的名称
        while (existingNames.includes(newName)) {
          counter++;
          newName = `${initName}_${counter}`;
        }
        
        initName = newName;
      }
      
      return [
        ...ns,
        {
          id,
          type: 'default',
          position,
          data: {
            label: initName,
            displayName: initName,
            type: item.type,
            name: item.name,
            interfaces: item.interfaces,
            config: {},
          },
        },
      ];
    });
  }, [reactFlowInstance]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // 导出 JSON
  const handleExportJson = useCallback(() => {
    exportTopologyJson(nodes, edges);
  }, [nodes, edges]);

  // 拖拽/删除节点时应用变更
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(ns => applyNodeChanges(changes, ns));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(es => applyEdgeChanges(changes, es));
  }, []);

  // 新增激励
  const handleAddStimulus = () => {
    // 先设置为null
    setEditStimulus(null);
    
    // 切换到激励编辑Tab
    setRightTab('stimulus');
    
    // 延迟设置激励对象，确保组件已更新
    setTimeout(() => {
      const enhancedStimulus = {
        _timestamp: Date.now(), // 添加时间戳，强制组件认为是新数据
        _key: Math.random().toString(36).substring(2), // 增加随机键
        isNew: true // 标记为新增
      };
      console.log('新增激励:', enhancedStimulus);
      setEditStimulus(enhancedStimulus);
    }, 100);
  };
  // 编辑激励
  const handleEditStimulus = (stimulus: Stimulus) => {
    console.log('编辑激励, 原始数据:', stimulus);
    
    // 创建带有唯一标记的激励数据副本
    const enhancedStimulus = {
      ...stimulus,
      _timestamp: Date.now(), // 添加时间戳，强制组件认为是新数据
      _key: Math.random().toString(36).substring(2) // 增加随机键，进一步确保数据变化
    };
    
    // 立即切换到激励Tab
    setRightTab('stimulus');
    
    // 先设置为null，然后再设置为新值，强制组件重新挂载
    setEditStimulus(null);
    
    // 添加一个较长延迟，确保状态更新完成且组件已卸载
    setTimeout(() => {
      console.log('设置编辑激励数据:', enhancedStimulus);
      
      // 保存要编辑的激励数据
      setEditStimulus(enhancedStimulus);
      
      // 如果编辑激励前没有选中节点，记录一下状态，方便后续恢复
      if (!selectedNodeId) {
        console.log('无选中节点，编辑激励:', enhancedStimulus);
      }
    }, 100); // 增加延迟时间，给足够的时间让React更新DOM
  };
  // 删除激励
  const handleDeleteStimulus = (key: string) => {
    setIsDirty(true); // 标记修改状态，以便提示保存
    setStimulusList(list => list.filter(item => item.key !== key));
    // 如果正在编辑被删除项，则清理编辑状态
    if (editStimulus && editStimulus.key === key) setEditStimulus(null);
  };
  // 保存激励
  const handleSaveStimulus = (values: any) => {
    console.log('开始保存激励:', values);
    console.log('当前激励列表:', stimulusList);
    
    // 验证输入数据的完整性
    if (!values || !values.name || !values.targetName) {
      setToastMsg('激励数据不完整，请检查必填字段');
      setTimeout(() => setToastMsg(null), 2000);
      return;
    }
    
    // 校验激励名称不能重复（除当前编辑项外）
    const nameExists = stimulusList.some(item => item.name === values.name && (!editStimulus || item.key !== editStimulus.key));
    if (nameExists) {
      setToastMsg('激励名称不能重复');
      setTimeout(() => setToastMsg(null), 2000);
      return;
    }
    
    // 标记修改状态，以便提示保存
    setIsDirty(true);
    
    // 保证作用对象字段正确，并绑定当前拓扑名
    const newStimulus = {
        ...values,
        target: values.targetName, // 修正为表单的 targetName 字段
        targetName: values.targetName, // 确保两个字段保持一致
        key: editStimulus ? editStimulus.key : `stim_${Date.now()}`,
        topologyName: currentName, // 新增字段，绑定当前拓扑
        timestamp: Date.now() // 添加时间戳，便于排序和调试
    };
    
    // 创建更新后的激励列表
    let updatedStimulusList: Stimulus[];
    if (editStimulus) {
        updatedStimulusList = stimulusList.map(item => 
            item.key === editStimulus.key ? newStimulus : item
        );
    } else {
        updatedStimulusList = [...stimulusList, newStimulus];
    }
    
    // 更新状态
    setStimulusList(updatedStimulusList);
    
    // 先清空激励编辑状态
    setEditStimulus(null);
    
    // 保存完成后立即显示激励列表Tab，而非继续停留在编辑Tab
    // 这样用户可以看到刚保存的激励已经出现在列表中
    setRightTab('stimulus');
    
    // 自动保存拓扑（如果有名称）
    if (currentName) {
        // 使用更新后的激励列表直接保存，而不是等待状态更新
        console.log('保存激励到拓扑, 更新后的激励列表:', updatedStimulusList);
        saveTopologyByName(currentName, nodes, edges, updatedStimulusList);
        setToastMsg('激励已保存并更新拓扑');
        setIsDirty(false);
    } else {
        setToastMsg('激励已添加，请保存拓扑以持久化');
    }
    setTimeout(() => setToastMsg(null), 2000);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        savedList={savedList}
        currentName={currentName}
        onSelect={handleSelectTopology}
        onNew={handleNew}
        onSave={handleSave}
        onDeleteSaved={handleDeleteSaved}
        onExportJson={handleExportJson}
        theme={theme}
        onThemeChange={(theme) => {
          if (['light', 'dark', 'colorful'].includes(theme)) {
            setTheme(theme as 'light' | 'dark' | 'colorful');
          }
        }}
      />
      <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0 }}>
        {/* 左侧主面板 */}
        <div 
          className="main-content"
          style={{ 
            flex: 1, 
            display: 'flex', 
            overflow: 'hidden', 
            height: '100%',
            minWidth: 0 // 允许收缩
          }}
        >
            <ComponentPalette
              cpuList={cpuList.map(cpu => ({ ...cpu, type: 'cpu' }))}
              deviceList={deviceList.map(device => ({ ...device, type: 'device' }))}
              onDragStart={handlePaletteDragStart}
            />
            {/* 中间区域：上下分割 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {/* 上半部分：拓扑画布 */}
              <div
                style={{ flex: splitRatio, minHeight: 120, position: 'relative', overflow: 'hidden' }}
              >
                <div
                  className="canvas-panel"
                  ref={reactFlowWrapper}
                  style={{ width: '100%', height: '100%' }}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={handleConnect}
                    onNodeClick={handleNodeClick}
                    onNodeContextMenu={handleNodeContextMenu}
                    onInit={setReactFlowInstance}
                    nodesDraggable
                    nodesConnectable
                    elementsSelectable
                    fitView
                  >
                    <MiniMap position="bottom-right" />
                    <Controls position="bottom-left" />
                  </ReactFlow>
                  {contextMenu && (
                    <NodeContextMenu
                      x={contextMenu.x}
                      y={contextMenu.y}
                      onRename={() => {
                        setSelectedNodeId(contextMenu.nodeId);
                        setRightTab('props');
                      }}
                      onDelete={() => handleDeleteNode(contextMenu.nodeId)}
                      onAddStimulus={() => {
                        const node = nodes.find(n => n.id === contextMenu.nodeId);
                        const nodeName = node?.data?.displayName || node?.data?.label || node?.data?.name || node?.id;
                        
                        // 先设置为null，然后切换Tab
                        setEditStimulus(null);
                        
                        // 切换到激励编辑面板
                        setRightTab('stimulus');
                        
                        // 设置激励目标过滤器，确保在保存后能看到该节点的所有激励
                        setStimulusTargetFilter(nodeName);
                        
                        // 延迟设置激励编辑状态，确保组件已更新
                        setTimeout(() => {
                          // 创建带有唯一标记的激励数据
                          const enhancedStimulus = { 
                            targetName: nodeName,
                            target: nodeName, // 同时设置两个字段，确保一致性
                            isNew: true, // 标记为新增激励
                            _timestamp: Date.now(), // 添加时间戳，强制组件认为是新数据
                            _key: Math.random().toString(36).substring(2) // 增加随机键
                          };
                          
                          console.log('右键菜单新增激励:', enhancedStimulus);
                          setEditStimulus(enhancedStimulus);
                        }, 100);
                      }}
                      onClose={() => setContextMenu(null)}
                    />
                  )}
                </div>
              </div>
              {/* 拖拽分割条 */}
              <div
                ref={vDividerRef}
                style={{ height: 8, cursor: 'row-resize', background: isVResizing ? '#1976d2' : '#e0e0e0' }}
                onMouseDown={e => {
                  setIsVResizing(true);
                  const startY = e.clientY;
                  const startRatio = splitRatio;
                  const container = containerRef.current;
                  const handleMove = (ev: MouseEvent) => {
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    const delta = ev.clientY - startY;
                    const total = rect.height;
                    let newRatio = startRatio + delta / total;
                    newRatio = Math.max(0.2, Math.min(0.8, newRatio));
                    setSplitRatio(newRatio);
                  };
                  const handleUp = () => {
                    setIsVResizing(false);
                    document.removeEventListener('mousemove', handleMove);
                    document.removeEventListener('mouseup', handleUp);
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                  };
                  document.addEventListener('mousemove', handleMove);
                  document.addEventListener('mouseup', handleUp);
                  document.body.style.cursor = 'row-resize';
                  document.body.style.userSelect = 'none';
                }}
              />
              {/* 下半部分：激励展示框 */}
              <div style={{ flex: 1 - splitRatio, minHeight: 80, overflow: 'auto', background: '#fafafa', borderTop: '1px solid #eee' }}>
                <StimulusPanel
                  data={stimulusList}
                  nodeNames={nodes.filter(n => n.data?.type === 'cpu' || n.data?.type === 'device').map(n => n.data.displayName || n.data.label || n.data.name || n.id)}
                  onAdd={handleAddStimulus}
                  onEdit={handleEditStimulus}
                  onDelete={handleDeleteStimulus}
                  targetFilter={stimulusTargetFilter}
                  onTargetFilterChange={setStimulusTargetFilter}
                  theme={theme}
                />
              </div>
            </div>
        </div>
        
        {/* 可拖动的分割器 */}
        <div
          ref={dividerRef}
          className={`resizable-divider ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleMouseDown}
          style={{
            backgroundColor: isResizing ? '#1976d2' : '#e0e0e0',
            borderLeft: '1px solid #ccc',
            borderRight: '1px solid #ccc',
            minWidth: '8px',
            height: '100%',
            cursor: 'col-resize',
            zIndex: 10,
            position: 'relative'
          }}
        >
          <div className="resizable-divider-handle" style={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            height: '30px',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}>⋮⋮</div>
        </div>
        
        {/* 右侧属性面板 */}
        <div
          className="properties-panel"
          style={{
            width: rightPanelWidth,
            borderLeft: 'none',
            overflowY: 'auto',
            minWidth: '250px', // VS Code 最小侧边栏宽度
            maxWidth: '50%', // 合理的最大宽度
            transition: 'width 0.1s ease',
            flexShrink: 0,
          }}
        >
          {/* 测试管理标签页始终显示，其他标签页需要选中节点或编辑激励时显示 */}
          <Tabs
            activeKey={rightTab}
            onChange={key => {
              // 当从激励编辑切换到其他标签页时，如果没有选中节点，清空激励编辑状态
              if (key !== 'stimulus' && !selectedNodeId && editStimulus) {
                setEditStimulus(null);
              }
              setRightTab(key as 'props' | 'stimulus' | 'testing');
              }}
              items={[
                {
                  key: 'props',
                  label: '节点属性',
                  disabled: !selectedNodeId, // 没有选中节点时禁用节点属性Tab
                  children: selectedNodeId ? (
                    <NodePropertiesPanel
                      selectedNode={nodes.find(n => n.id === selectedNodeId) || null}
                      nodes={nodes}
                      edges={edges}
                      onChange={handleNodeChange}
                      onCpuChange={handleCpuChange}
                      lang={lang}
                    />
                  ) : <div className="empty-panel">请先选择一个节点</div>
                },
                {
                  key: 'stimulus',
                  label: '激励编辑',
                  children: editStimulus ? (
                    <StimulusEditPanel
                      key={`stimulus-edit-${editStimulus._timestamp || Date.now()}`}
                      stimulus={editStimulus}
                      initialValues={editStimulus}
                      onSave={handleSaveStimulus}
                      onCancel={() => setEditStimulus(null)}
                      nodeNames={nodes.filter(n => n.data?.type === 'cpu' || n.data?.type === 'device').map(n => n.data.displayName || n.data.label || n.data.name || n.id)}
                      theme={theme}
                    />
                  ) : (
                    <div style={{ padding: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div>正在准备编辑面板，请稍候...</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        (如果长时间未显示，请尝试再次点击激励列表中的"编辑"按钮)
                      </div>
                      <Button
                        size="small" 
                        type="link"
                        onClick={() => {
                          // 强制重新创建编辑面板
                          setEditStimulus(null);
                          setTimeout(() => {
                            const forceStimulus = {
                              _timestamp: Date.now(),
                              _key: Math.random().toString(36).substring(2),
                              _forceRefresh: true
                            };
                            setEditStimulus(forceStimulus);
                          }, 100);
                        }}
                      >
                        点击这里刷新
                      </Button>
                    </div>
                  ),
                },
                {
                  key: 'testing',
                  label: '测试管理',
                  children: (
                    <TestManagementPanelComplete />
                  ),
                }
              ]}
            />
        </div>
      </div>
      {/* toast 提示 */}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  );
}


export default TopologyEditor;
