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
import { exportTopologyJson, exportTopologyRepl } from '../../utils/exportUtils'; // 确保正确导入

const TopologyEditor: React.FC<{ lang?: 'zh' | 'en' }> = ({ lang = 'zh' }) => {
  const { cpuList, deviceList } = useConfigContext();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // 节点拖动逻辑
  const handleNodeChange = useCallback((id: string, key: string, value: any) => {
    setNodes(ns =>
      ns.map(n => (n.id === id ? { ...n, data: { ...n.data, [key]: value } } : n))
    );
  }, []);

  // 连线处理逻辑
  const handleConnect = useCallback((params: Connection | FlowEdge) => {
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
    setNodes(ns => ns.filter(n => n.id !== nodeId));
    setEdges(es => es.filter(e => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }, [selectedNodeId]);

  // 重命名节点逻辑
  const handleRenameNode = useCallback((nodeId: string) => {
    const newLabel = prompt('请输入新名称:');
    if (newLabel) {
      setNodes(ns =>
        ns.map(n => (n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n))
      );
    }
  }, []);

  // 切换外设所连 CPU 时，同步更新 edges
  const handleCpuChange = useCallback((peripheralId: string, cpuId: string) => {
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

    const data = event.dataTransfer.getData('application/json');
    if (!data) return;

    const item = JSON.parse(data);

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const id = `${item.type}_${Date.now()}`;
    setNodes(ns => [
      ...ns,
      {
        id,
        type: 'default',
        position,
        data: {
          label: item.label || item.name,
          // 节点类型：'cpu' 或 'device'
          type: item.type,
          // 模型名称
          name: item.name,
          // 接口定义数组
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

  // 导出 REPL
  const handleExportRepl = useCallback(() => {
    exportTopologyRepl(nodes, edges);
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
      {/* 工具栏固定高度 */}
      <div className="toolbar">
        <button onClick={handleExportJson}>导出 JSON</button>
        <button onClick={handleExportRepl}>导出 REPL</button>
      </div>
      {/* 主体内容，撑满剩余空间 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ComponentPalette
          cpuList={cpuList.map(cpu => ({ ...cpu, type: 'cpu' }))}
          deviceList={deviceList.map(device => ({ ...device, type: 'device' }))}
          onDragStart={handlePaletteDragStart}
        />
        {/* 画布区域，自适应伸缩 */}
        <div
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
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
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
        {/* 属性面板，超出时滚动 */}
        <div style={{ width: '320px', borderLeft: '1px solid #eee', overflowY: 'auto' }}>
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
    </div>
  );
};

export default TopologyEditor;