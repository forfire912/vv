import type { Node, Edge } from 'reactflow';

// 查找与节点相连的CPU节点
export function getConnectedCpuNode(selectedNodeId: string, edges: Edge[], cpuNodes: Node[]): Node | undefined {
  const edge = edges.find(
    e =>
      (e.source === selectedNodeId && cpuNodes.some(n => n.id === e.target)) ||
      (e.target === selectedNodeId && cpuNodes.some(n => n.id === e.source))
  );
  if (!edge) return undefined;
  const cpuId = cpuNodes.some(n => n.id === edge.source) ? edge.source : edge.target;
  return cpuNodes.find(n => n.id === cpuId);
}

/**
 * 计算 CPU 和外设支持的接口类型交集
 * 根据 CPU 节点和外设数据，计算允许的接口类型。
 * @param cpuNode CPU 节点
 * @param peripheralData 外设数据
 * @returns 允许的接口类型数组
 */
export function getAllowedPeripheralOptions(cpuNode: Node, peripheralData: any): string[] {
  const cpuIfaces = Array.isArray(cpuNode.data?.interfaces) ? cpuNode.data.interfaces : [];
  let allowedTypes: string[] = [];
  if (Array.isArray(peripheralData.interfaces)) {
    for (const iface of peripheralData.interfaces) {
      const allowed = iface.props?.allowed_type || iface.props?.allowed_types;
      if (Array.isArray(allowed)) {
        allowedTypes.push(...allowed);
      } else if (typeof allowed === 'string') {
        allowedTypes.push(allowed);
      }
    }
  }
  allowedTypes = Array.from(new Set(allowedTypes));
  return cpuIfaces.filter((iface: any) => allowedTypes.includes(iface.type)).map((iface: any) => iface.id || iface.type);
}