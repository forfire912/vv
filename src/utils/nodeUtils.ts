import type { Node, Edge } from 'reactflow';
import type { CpuNodeData, PeripheralNodeData, InterfaceItem } from '../types/nodes';

// 查找所有CPU节点
export function getAllCpuNodes(nodes: Node[]): Node<CpuNodeData>[] {
  return nodes.filter(
    n => typeof n.data?.type === 'string' && n.data.type.toLowerCase() === 'cpu'
  ) as Node<CpuNodeData>[];
}

// 查找与指定外设节点相连的CPU节点
export function getConnectedCpuNode(selectedNodeId: string, edges: Edge[], cpuNodes: Node<CpuNodeData>[]): Node<CpuNodeData> | undefined {
  const edge = edges.find(
    e =>
      (e.source === selectedNodeId && cpuNodes.some(n => n.id === e.target)) ||
      (e.target === selectedNodeId && cpuNodes.some(n => n.id === e.source))
  );
  if (!edge) return undefined;
  const cpuId = cpuNodes.some(n => n.id === edge.source) ? edge.source : edge.target;
  return cpuNodes.find(n => n.id === cpuId);
}

// 获取 allowed-types 与处理器接口交集
export function getAllowedPeripheralOptions(
  cpuNode: Node<CpuNodeData>,
  peripheralData: PeripheralNodeData
): string[] {
  const cpuIfaces = Array.isArray(cpuNode.data?.interfaces) ? cpuNode.data.interfaces : [];
  let allowedTypes: string[] = [];
  if (Array.isArray(peripheralData.interfaces)) {
    for (const iface of peripheralData.interfaces) {
      let at = iface.props?.allowed_type || iface.props?.allowed_types;
      if (Array.isArray(at)) allowedTypes.push(...at);
      else if (typeof at === 'string') allowedTypes.push(at);
    }
  }
  allowedTypes = Array.from(new Set(allowedTypes));
  return cpuIfaces.filter((iface: InterfaceItem) => allowedTypes.includes(iface.type)).map((iface: InterfaceItem) => iface.id || iface.type);
}