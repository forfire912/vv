export interface PeripheralMeta {
  type: string;
  label: string;
  renodeClass: string;
  requiredProps: {
    key: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'enum';
    enumValues?: string[];
    default?: any;
    desc?: string;
  }[];
}

export const renodePeripheralMeta: PeripheralMeta[] = [
  {
    type: 'UART',
    label: '串口 (UART)',
    renodeClass: 'uart.UART',
    requiredProps: [
      { key: 'baudRate', label: '波特率', type: 'number', default: 115200 },
      { key: 'dataBits', label: '数据位', type: 'number', default: 8 },
      { key: 'parity', label: '校验位', type: 'enum', enumValues: ['None', 'Even', 'Odd'], default: 'None' },
      { key: 'stopBits', label: '停止位', type: 'number', default: 1 }
    ]
  },
  {
    type: 'SPI',
    label: '串行外设接口 (SPI)',
    renodeClass: 'spi.SPIMaster',
    requiredProps: [
      { key: 'mode', label: '模式', type: 'number', default: 0 },
      { key: 'clockPolarity', label: '时钟极性', type: 'number', default: 0 },
      { key: 'clockPhase', label: '时钟相位', type: 'number', default: 0 },
      { key: 'dataOrder', label: '数据顺序', type: 'enum', enumValues: ['MSB', 'LSB'], default: 'MSB' }
    ]
  },
  {
    type: 'GPIO',
    label: '通用输入输出 (GPIO)',
    renodeClass: 'gpio.GPIOPort',
    requiredProps: [
      { key: 'pinCount', label: '引脚数', type: 'number', default: 16 }
    ]
  },
  {
    type: 'ETH',
    label: '以太网 (Ethernet)',
    renodeClass: 'network.EthernetMAC',
    requiredProps: [
      { key: 'speed', label: '速率', type: 'enum', enumValues: ['10M', '100M', '1G'], default: '100M' }
    ]
  },
  {
    type: 'I2C',
    label: 'I2C 总线',
    renodeClass: 'i2c.I2CMaster',
    requiredProps: [
      { key: 'address', label: '地址', type: 'number', default: 0x50 },
      { key: 'speed', label: '速率', type: 'number', default: 100000 },
      { key: 'mode', label: '模式', type: 'enum', enumValues: ['master', 'slave'], default: 'master' }
    ]
  },
  {
    type: 'Timer',
    label: '定时器 (Timer)',
    renodeClass: 'timer.Timer',
    requiredProps: [
      { key: 'mode', label: '模式', type: 'enum', enumValues: ['periodic', 'one-shot'], default: 'periodic' },
      { key: 'intervalMs', label: '周期(ms)', type: 'number', default: 1000 },
      { key: 'autoReload', label: '自动重载', type: 'boolean', default: true }
    ]
  }
  // 可继续扩展其他 Renode 支持的外设类型
];
