import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactFlow, { Node, Edge, ReactFlowInstance, Connection, Edge as FlowEdge } from 'reactflow';
import NodePropertiesPanel from './NodePropertiesPanel';
import NodeDynamicConfigFields from './NodeDynamicConfigFields';
import NodeContextMenu from './NodeContextMenu';
import { saveTopologyToLocalStorage, exportTopologyJson, exportTopologyRepl } from '../../utils/exportUtils';
import { UndoRedoManager } from '../../utils/undoRedo';
import { useConfigContext } from '../../context/ConfigContext';
import { t } from '../../i18n/i18n';
import useTopologyShortcuts from '../../hooks/useTopologyShortcuts';
import '../../styles/reactflow-custom.css';
import ComponentPalette from './ComponentPalette';
import type { PaletteItem } from './ComponentPalette';

const undoRedo = new UndoRedoManager();

const TopologyEditor: React.FC<{ lang?: 'zh' | 'en' }> = ({ lang = 'zh' }) => {
  const { cpuList, deviceList } = useConfigContext();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // 转换 cpuList 和 deviceList 为 PaletteItem[]
  const paletteCpuList: PaletteItem[] = cpuList.map((cpu: any) => ({
    ...cpu,
    type: cpu.type || 'cpu',
  }));
  const paletteDeviceList: PaletteItem[] = deviceList.map((device: any) => ({
    ...device,
    type: device.type || 'device',
  }));

  // 快捷键支持
  useTopologyShortcuts({
    onDelete: () => selectedNodeId && handleDeleteNode(selectedNodeId),
    onUndo: handleUndo,
    onRedo: handleRedo,
  });

  useEffect(() => {
    undoRedo.addState(nodes, edges);
    // eslint-disable-next-line
  }, [nodes, edges]);

  // 节点操作
  function handleDeleteNode(nodeId: string) {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setEdges(edges.filter(e => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }
  function handleRenameNode(nodeId: string) {
    const newLabel = prompt('请输入新名称:');
    if (newLabel) {
      setNodes(nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n));
    }
  }
  // 撤销/重做
  function handleUndo() {
    const prev = undoRedo.undo();
    if (prev) {
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setSelectedNodeId(null);
    }
  }
  function handleRedo() {
    const next = undoRedo.redo();
    if (next) {
      setNodes(next.nodes);
      setEdges(next.edges);
      setSelectedNodeId(null);
    }
  }
  // 拖拽添加
  const handlePaletteDragStart = (item: PaletteItem, event: React.DragEvent) => {
    event.dataTransfer.setData('application/json', JSON.stringify(item));
  };
  // 属性变更
  function handleNodeChange(id: string, key: string, value: any) {
    setNodes(ns => ns.map(n => n.id === id ? { ...n, data: { ...n.data, [key]: value } } : n));
  }
  function handleNodeConfigChange(id: string, key: string, value: any) {
    setNodes(ns => ns.map(n => n.id === id ? { ...n, data: { ...n.data.config, [key]: value } } : n));
  }

  // 保存等
  function handleSave() {
    saveTopologyToLocalStorage(nodes, edges);
    setMessage(lang === 'zh' ? '已保存到 localStorage' : 'Saved to localStorage');
  }
  function handleExportJson() {
    exportTopologyJson(nodes, edges);
  }
  function handleExportRepl() {
    exportTopologyRepl(nodes, edges);
  }

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // onNodeContextMenu 需要三个参数
  const handleNodeContextMenu: import('@reactflow/core').NodeMouseHandler = (event, node) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
  };

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
          type: item.type,
          config: {},
        }
      }
    ]);
  }, [reactFlowInstance]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // 连线处理
  const handleConnect = useCallback((params: Connection | FlowEdge) => {
    setEdges(eds => [
      ...eds,
      {
        ...params,
        id: `e${params.source}-${params.target}`,
      } as Edge,
    ]);
  }, []);

  return (
    <div>
      <div className="toolbar">
        <button onClick={handleSave}>{t('save', lang)}</button>
        <button onClick={handleExportJson}>{t('exportJson', lang)}</button>
        <button onClick={handleExportRepl}>{t('exportRepl', lang)}</button>
        <button onClick={handleUndo} disabled={!undoRedo.canUndo}>{t('undo', lang)}</button>
        <button onClick={handleRedo} disabled={!undoRedo.canRedo}>{t('redo', lang)}</button>
      </div>
      <div className="main-content" style={{ display: 'flex', flexDirection: 'row' }}>
        <ComponentPalette
          cpuList={paletteCpuList}
          deviceList={paletteDeviceList}
          onDragStart={handlePaletteDragStart}
        />
        <div
          ref={reactFlowWrapper}
          style={{ flex: 1, position: 'relative', height: '80vh', minHeight: 400 }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onConnect={handleConnect}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            defaultEdgeOptions={{ type: 'default' }}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
            onNodeMouseLeave={() => setHoveredNodeId(null)}
            onNodeContextMenu={handleNodeContextMenu}
            fitView
            onInit={setReactFlowInstance}
          />
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
        <div style={{ width: '320px', borderLeft: '1px solid #eee' }}>
          {selectedNode && (
            <>
              <NodePropertiesPanel
                selectedNode={selectedNode}
                nodes={nodes}
                edges={edges}
                onChange={handleNodeChange}
                data={selectedNode.data || {}}
                lang={lang}
              />
              <NodeDynamicConfigFields
                nodeType={selectedNode.data?.type}
                config={selectedNode.data?.config || {}}
                onChange={(k, v) => handleNodeConfigChange(selectedNode.id, k, v)}
              />
            </>
          )}
        </div>
      </div>
      {message && <div className="message">{message}</div>}
    </div>
  );
};
export default TopologyEditor;