export interface ParameterField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'enum' | 'boolean';
  enumValues?: string[];
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface PeripheralTemplate {
  type: string;
  label: string;
  fields: ParameterField[];
}

export const peripheralTemplates: PeripheralTemplate[] = [
  {
    type: 'UART',
    label: '串口 (UART)',
    fields: [
      { key: 'baudRate', label: '波特率', type: 'number', min: 1200, max: 3000000, required: true },
      { key: 'parity', label: '校验位', type: 'enum', enumValues: ['None', 'Even', 'Odd'], required: true },
      { key: 'stopBits', label: '停止位', type: 'number', min: 1, max: 2, required: true },
      { key: 'dataBits', label: '数据位', type: 'number', min: 5, max: 9, required: true }
    ]
  },
  {
    type: 'SPI',
    label: '串行外设接口 (SPI)',
    fields: [
      { key: 'mode', label: '模式', type: 'number', min: 0, max: 3, required: true },
      { key: 'clockPolarity', label: '时钟极性', type: 'number', min: 0, max: 1 },
      { key: 'clockPhase', label: '时钟相位', type: 'number', min: 0, max: 1 },
      { key: 'dataOrder', label: '数据顺序', type: 'enum', enumValues: ['MSB', 'LSB'], required: true }
    ]
  }
  // 可继续扩展其它外设类型
];