// 配置模型定义
export interface VlabInterface {
  id: string;
  type: string;
  props?: Record<string, any>;
}

export interface CpuConfig {
  name: string;
  type: 'cpu';
  interfaces: VlabInterface[];
  [key: string]: any;
}

export interface PeripheralConfig {
  name: string;
  type: string; // 如 'io', 'peripheral', ...
  interfaces: VlabInterface[];
  [key: string]: any;
}

// 运行时读取 config 目录下所有 JSON 文件
export function loadConfigFiles(): { cpuList: CpuConfig[]; peripheralList: PeripheralConfig[] } {
  // 注意：require.context 只能在 webpack 环境下使用
  const ctx = (require as any).context('../../config', false, /\.json$/);
  const files = ctx.keys();
  const cpuList: CpuConfig[] = [];
  const peripheralList: PeripheralConfig[] = [];
  for (const file of files) {
    const data = ctx(file);
    if (data.type === 'cpu') cpuList.push(data as CpuConfig);
    else peripheralList.push(data as PeripheralConfig);
  }
  return { cpuList, peripheralList };
}
