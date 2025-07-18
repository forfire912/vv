import type { CpuConfig, DeviceConfig } from '../types/config';

/**
 * 加载 CPU 配置文件
 * 使用 Webpack 的 require.context 动态导入 JSON 文件。
 * @returns CPU 配置数组
 */
export function loadCpuConfigs(): CpuConfig[] {
  const cpuCtx = (require as any).context('../config/cpus', false, /\.json$/);
  return cpuCtx.keys().map((file: string) => cpuCtx(file));
}

/**
 * 加载设备配置文件
 * 使用 Webpack 的 require.context 动态导入 JSON 文件。
 * @returns 设备配置数组
 */
export function loadDeviceConfigs(): DeviceConfig[] {
  const devCtx = (require as any).context('../config/devices', false, /\.json$/);
  return devCtx.keys().map((file: string) => devCtx(file));
}