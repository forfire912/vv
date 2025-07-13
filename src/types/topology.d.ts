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