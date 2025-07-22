import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Node, Edge, ReactFlowInstance, Connection, Edge as FlowEdge, NodeMouseHandler,
  MiniMap, Controls, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange
} from 'reactflow';
import StimulusPanel from './StimulusPanel';
import StimulusEditPanel from './StimulusEditPanel';
import NodePropertiesPanel from './NodePropertiesPanel';
import { Tabs } from 'antd';
import ComponentPalette from './ComponentPalette';
import NodeContextMenu from './NodeContextMenu'; // 确保正确导入
import { useConfigContext } from '../../context/ConfigContext';
import '../../styles/reactflow-custom.css';
import { exportTopologyJson, saveTopologyByName, loadTopologyByName, getSavedTopologyNames, deleteTopologyByName } from '../../utils/exportUtils'; // 确保正确导入
import { Toolbar } from './Toolbar'; // 确保正确导入
import type { Stimulus } from './StimulusPanel';

const TopologyEditor: React.FC<{ lang?: 'zh' | 'en' }> = ({ lang = 'zh' }) => {
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
    if (currentName) {
      saveTopologyByName(currentName, nodes, edges); // 只保存 nodes 和 edges
      setIsDirty(false);
      setToastMsg('保存成功');
      setTimeout(() => setToastMsg(null), 2000);
    } else {
      vscode.postMessage({ type: 'prompt', text: '请输入保存名称:' });
    }
  }, [currentName, nodes, edges, vscode]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'colorful'>('light');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedList, setSavedList] = useState<string[]>([]);
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(400); // 右侧面板宽度
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
  // 新增：右侧面板Tab状态
  const [rightTab, setRightTab] = useState<'props' | 'stimulus'>('props');

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
          setStimulusList([]); // 切换拓扑时清空激励列表
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
        console.log('保存拓扑:', name, nodes, edges);
        saveTopologyByName(name, nodes, edges); // 只保存 nodes 和 edges
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
          saveTopologyByName(currentName, nodes, edges); // 只保存 nodes 和 edges
          setIsDirty(false);
        }
        // 打开选中的拓扑
        const data = loadTopologyByName(name);
        if (data) {
          setNodes(data.nodes);
          setEdges(data.edges);
          setStimulusList([]); // 切换拓扑时清空激励列表
          setCurrentName(name);
          setIsDirty(false);
        }
        setSavedList(getSavedTopologyNames());
      }
      else if (action === 'new') {
        if (confirmed && currentName) {
          saveTopologyByName(currentName, nodes, edges); // 只保存 nodes 和 edges
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
            saveTopologyByName(currentName, nodes, edges); // 只保存 nodes 和 edges
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
        setNodes(data.nodes);
        setEdges(data.edges);
        setStimulusList([]); // 切换拓扑时清空激励列表
        setCurrentName(name);
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

  // 节点拖动逻辑
  const handleNodeChange = useCallback((id: string, key: string, value: any) => {
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
  }, []);

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
    setSelectedNodeId(node.id);
    // 选中节点后，将节点名称作为激励列表作用目标筛选值
    const nodeName = node.data.displayName || node.data.label || node.data.name || node.id;
    setStimulusTargetFilter(nodeName);
  }, []);

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
    const initName = item.label || item.name;
    setNodes(ns => [
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
    ]);
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
    setEditStimulus({}); // 传递空对象，弹出编辑面板
    setRightTab('stimulus'); // 新增时自动切到激励编辑Tab
  };
  // 编辑激励
  const handleEditStimulus = (stimulus: Stimulus) => {
    setEditStimulus(stimulus);
    setRightTab('stimulus'); // 编辑时自动切到激励编辑Tab
  };
  // 删除激励
  const handleDeleteStimulus = (key: string) => {
    setStimulusList(list => list.filter(item => item.key !== key));
    // 如果正在编辑被删除项，则清理编辑状态
    if (editStimulus && editStimulus.key === key) setEditStimulus(null);
  };
  // 保存激励
  const handleSaveStimulus = (values: any) => {
    // 校验激励名称不能重复（除当前编辑项外）
    const nameExists = stimulusList.some(item => item.name === values.name && (!editStimulus || item.key !== editStimulus.key));
    if (nameExists) {
        setToastMsg('激励名称不能重复');
        setTimeout(() => setToastMsg(null), 2000);
        return;
    }
    // 保证作用对象字段正确，并绑定当前拓扑名
    const newStimulus = {
        ...values,
        target: values.targetName, // 修正为表单的 targetName 字段
        key: editStimulus ? editStimulus.key : `${Date.now()}`,
        topologyName: currentName // 新增字段，绑定当前拓扑
    };
    if (editStimulus) {
        setStimulusList(list => list.map(item => item.key === editStimulus.key ? newStimulus : item));
    } else {
        setStimulusList(list => [...list, newStimulus]); // 确保新增激励正确添加到列表
    }
    setEditStimulus(null); // 清空激励编辑表单
    setRightTab('stimulus'); // 保存后自动切回激励编辑Tab
    setToastMsg('激励保存成功');
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
                        setEditStimulus({ targetName: nodeName });
                        setRightTab('stimulus');
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
            minWidth: '300px',
            maxWidth: '60%', // 限制最大宽度
            transition: 'width 0.1s',
            flexShrink: 0, // 防止属性面板被压缩
          }}
        >
          {selectedNodeId && (
            <Tabs
              activeKey={rightTab}
              onChange={key => setRightTab(key as 'props' | 'stimulus')}
              items={[
                {
                  key: 'props',
                  label: '节点属性',
                  children: (
                    <NodePropertiesPanel
                      selectedNode={nodes.find(n => n.id === selectedNodeId) || null}
                      nodes={nodes}
                      edges={edges}
                      onChange={handleNodeChange}
                      onCpuChange={handleCpuChange}
                      lang={lang}
                    />
                  ),
                },
                {
                  key: 'stimulus',
                  label: '激励编辑',
                  children: (
                    <StimulusEditPanel
                      initialValues={editStimulus}
                      onSave={handleSaveStimulus}
                      onCancel={() => setEditStimulus(null)}
                      nodeNames={nodes.filter(n => n.data?.type === 'cpu' || n.data?.type === 'device').map(n => n.data.displayName || n.data.label || n.data.name || n.id)}
                      theme={theme}
                    />
                  ),
                }
              ]}
            />
          )}
        </div>
      </div>
      {/* toast 提示 */}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  );
}


export default TopologyEditor;
