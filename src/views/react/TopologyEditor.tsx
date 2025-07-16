import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Node, Edge, ReactFlowInstance, Connection, Edge as FlowEdge, NodeMouseHandler,
  MiniMap, Controls, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange
} from 'reactflow';
import NodePropertiesPanel from './NodePropertiesPanel';
import ComponentPalette from './ComponentPalette';
import NodeContextMenu from './NodeContextMenu'; // 确保正确导入
import { useConfigContext } from '../../context/ConfigContext';
import '../../styles/reactflow-custom.css';
import { exportTopologyJson, saveTopologyByName, loadTopologyByName, getSavedTopologyNames, deleteTopologyByName } from '../../utils/exportUtils'; // 确保正确导入
import { Toolbar } from './Toolbar'; // 确保正确导入

const TopologyEditor: React.FC<{ lang?: 'zh' | 'en' }> = ({ lang = 'zh' }) => {
  // 运行时获取 VS Code Webview API
  const vscode = (window as any).vscodeApi;
  
  const { cpuList, deviceList } = useConfigContext();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'colorful'>('light');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedList, setSavedList] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);

  // 本地提示
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
        if (data) {
          setNodes(data.nodes);
          setEdges(data.edges);
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
        saveTopologyByName(name, nodes, edges);
        setIsDirty(false);
      }
      setSavedList(getSavedTopologyNames());
    }
    window.addEventListener('vscode-prompt-response', onPrompt);
    return () => window.removeEventListener('vscode-prompt-response', onPrompt);
  }, [nodes, edges, savedList]);

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
        }
        return;
      }
      else if (action === 'select') {
        // 用户选择要打开的新拓扑
        // 如果确认保存，则先保存当前
        if (confirmed && currentName) {
          saveTopologyByName(currentName, nodes, edges);
          setIsDirty(false);
        }
        // 打开选中的拓扑
        const data = loadTopologyByName(name);
        if (data) {
          setNodes(data.nodes);
          setEdges(data.edges);
          setCurrentName(name);
          setIsDirty(false);
        }
        setSavedList(getSavedTopologyNames());
      }
      else if (action === 'new') {
        if (confirmed && currentName) {
          saveTopologyByName(currentName, nodes, edges);
          setIsDirty(false);
        }
        setNodes([]); setEdges([]); setCurrentName(''); setIsDirty(false);
      }
      else {
        // 用户确认保存当前（action 可省略）
        if (confirmed) {
          if (currentName) {
            saveTopologyByName(currentName, nodes, edges);
            setIsDirty(false);
          } else {
            vscode.postMessage({ type: 'prompt', text: '请输入保存名称:' });
          }
        }
      }
    }
    window.addEventListener('vscode-confirm-response', onConfirm);
    return () => window.removeEventListener('vscode-confirm-response', onConfirm);
  }, [currentName, nodes, edges]);

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
        setNodes(data.nodes);
        setEdges(data.edges);
        setCurrentName(name);
      }
      setIsDirty(false);
    }
  }, [currentName, isDirty]);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(f => !f);
  }, []);

  const handleNew = useCallback(() => {
    if (isDirty && currentName) {
      vscode.postMessage({ type: 'confirm', text: '是否保存当前拓扑？', action: 'new', name: currentName });
    } else {
      setNodes([]); setEdges([]); setCurrentName(''); setIsDirty(false);
    }
  }, [isDirty, currentName]);

  const handleSave = useCallback(() => {
    if (!currentName) {
      vscode.postMessage({ type: 'prompt', text: '请输入保存名称:', action: 'save' });
      return;
    }
    saveTopologyByName(currentName, nodes, edges);
    setSavedList(getSavedTopologyNames());
    setIsDirty(false);
    // 显示本地 toast
    setToastMsg('保存成功');
    setTimeout(() => setToastMsg(null), 2000);
  }, [currentName, nodes, edges]);

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
  }, []);

  // 右键菜单逻辑
  const handleNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
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
      setNodes(ns =>
        ns.map(n => (n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n))
      );
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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        savedList={savedList}
        currentName={currentName}   // ← 传入
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

      {/* 主体内容，撑满剩余空间 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ComponentPalette
          cpuList={cpuList.map(cpu => ({ ...cpu, type: 'cpu' }))}
          deviceList={deviceList.map(device => ({ ...device, type: 'device' }))}
          onDragStart={handlePaletteDragStart}
        />
        {/* 画布区域 */}
        <div
          className="canvas-panel"
          ref={reactFlowWrapper}
          style={{ flex: 1, position: 'relative' }}
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
              onRename={() => handleRenameNode(contextMenu.nodeId)}
              onDelete={() => handleDeleteNode(contextMenu.nodeId)}
              onClose={() => setContextMenu(null)}
            />
          )}
        </div>

        {/* 属性面板 */}
        <div
          className="properties-panel"
          style={{ width: '320px', borderLeft: '1px solid #eee', overflowY: 'auto' }}
        >
          {selectedNodeId && (
            <NodePropertiesPanel
              selectedNode={nodes.find(n => n.id === selectedNodeId) || null}
              nodes={nodes}
              edges={edges}
              onChange={handleNodeChange}
              onCpuChange={handleCpuChange}
              lang={lang}
            />
          )}
        </div>
      </div>
      {/* toast 提示 */}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  );
};

export default TopologyEditor;