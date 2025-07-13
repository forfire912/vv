export type InterfaceItem = {
  id: string;
  type: string;
  [key: string]: any;
};

export interface CpuNodeData {
  id: string;
  name: string;
  label?: string;
  type: 'cpu';
  interfaces: InterfaceItem[];
  connection?: { connectedPeripherals?: string[] };
  [key: string]: any;
}

export interface PeripheralNodeData {
  id: string;
  name: string;
  label?: string;
  type: string;
  interfaces?: InterfaceItem[];
  connection?: { cpuId?: string; cpuName?: string; onChipPeripheral?: string };
  [key: string]: any;
}