import type { CpuConfig, DeviceConfig } from '../types/config';

// 假设通过webpack require.context导入
export function loadCpuConfigs(): CpuConfig[] {
  const cpuCtx = (require as any).context('../config/cpus', false, /\.json$/);
  return cpuCtx.keys().map((file: string) => cpuCtx(file));
}

export function loadDeviceConfigs(): DeviceConfig[] {
  const devCtx = (require as any).context('../config/devices', false, /\.json$/);
  return devCtx.keys().map((file: string) => devCtx(file));
}