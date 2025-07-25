export interface CpuNodeData {
  id: string;
  name: string;
  label?: string;
  interfaces: { id: string; type: string }[];
  type: 'cpu';
  connection?: { connectedPeripherals?: string[] };
}

export interface PeripheralNodeData {
  id: string;
  name: string;
  label?: string;
  interfaces?: any[];
  type: string;
  connection?: { cpuId?: string; cpuName?: string; onChipPeripheral?: string };
}

export interface TopologyNode {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  data: CpuNodeData | PeripheralNodeData;
  selected?: boolean;
}

export interface TopologyConnection {
  id: string;
  source: string;
  target: string;
  type: string;
  data?: any;
}