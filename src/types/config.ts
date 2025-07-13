export interface CpuConfig {
  name: string;
  label?: string;
  interfaces: { id: string; type: string }[];
  [key: string]: any;
}

export interface DeviceConfig {
  name: string;
  label?: string;
  interfaces?: any[];
  [key: string]: any;
}