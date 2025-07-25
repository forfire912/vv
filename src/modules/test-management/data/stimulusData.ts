/**
 * 激励数据管理 - 提供激励选择和管理功能
 */

export interface Stimulus {
  id: string;
  name: string;
  description: string;
  category: string;
  associatedComponents: string[];  // 关联的组件ID
  parameters: StimulusParameter[];
  defaultValue?: any;
  metadata: {
    createdAt: Date;
    createdBy: string;
    version: string;
  };
}

export interface StimulusParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'range';
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];  // 用于select类型
  min?: number;       // 用于number/range类型
  max?: number;       // 用于number/range类型
}

// 模拟激励数据
export const mockStimuli: Stimulus[] = [
  {
    id: 'stimulus-1',
    name: '按钮点击激励',
    description: '模拟用户点击按钮的操作',
    category: '用户交互',
    associatedComponents: ['button', 'clickable-element'],
    parameters: [
      {
        name: 'clickCount',
        type: 'number',
        description: '点击次数',
        required: true,
        defaultValue: 1,
        min: 1,
        max: 10
      },
      {
        name: 'interval',
        type: 'number',
        description: '点击间隔(ms)',
        required: false,
        defaultValue: 100,
        min: 50,
        max: 5000
      }
    ],
    metadata: {
      createdAt: new Date('2024-01-10'),
      createdBy: 'system',
      version: '1.0.0'
    }
  },
  {
    id: 'stimulus-2',
    name: '数据输入激励',
    description: '向输入框或表单字段输入数据',
    category: '数据输入',
    associatedComponents: ['input', 'textarea', 'form-field'],
    parameters: [
      {
        name: 'inputValue',
        type: 'string',
        description: '输入的数据内容',
        required: true,
        defaultValue: ''
      },
      {
        name: 'inputType',
        type: 'select',
        description: '输入类型',
        required: true,
        defaultValue: 'text',
        options: ['text', 'number', 'email', 'password']
      },
      {
        name: 'clearBefore',
        type: 'boolean',
        description: '输入前是否清空',
        required: false,
        defaultValue: true
      }
    ],
    metadata: {
      createdAt: new Date('2024-01-10'),
      createdBy: 'system',
      version: '1.0.0'
    }
  },
  {
    id: 'stimulus-3',
    name: '网络请求激励',
    description: '模拟网络请求和响应',
    category: '网络通信',
    associatedComponents: ['api-client', 'http-service', 'websocket'],
    parameters: [
      {
        name: 'method',
        type: 'select',
        description: 'HTTP方法',
        required: true,
        defaultValue: 'GET',
        options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      },
      {
        name: 'endpoint',
        type: 'string',
        description: 'API端点',
        required: true,
        defaultValue: '/api/test'
      },
      {
        name: 'payload',
        type: 'string',
        description: '请求体(JSON)',
        required: false,
        defaultValue: '{}'
      },
      {
        name: 'timeout',
        type: 'number',
        description: '超时时间(ms)',
        required: false,
        defaultValue: 5000,
        min: 1000,
        max: 30000
      }
    ],
    metadata: {
      createdAt: new Date('2024-01-10'),
      createdBy: 'system',
      version: '1.0.0'
    }
  },
  {
    id: 'stimulus-4',
    name: '定时器激励',
    description: '基于时间的定时触发激励',
    category: '时间控制',
    associatedComponents: ['timer', 'scheduler', 'cron-job'],
    parameters: [
      {
        name: 'interval',
        type: 'number',
        description: '触发间隔(ms)',
        required: true,
        defaultValue: 1000,
        min: 100,
        max: 60000
      },
      {
        name: 'repeat',
        type: 'number',
        description: '重复次数',
        required: true,
        defaultValue: 1,
        min: 1,
        max: 100
      },
      {
        name: 'delay',
        type: 'number',
        description: '初始延迟(ms)',
        required: false,
        defaultValue: 0,
        min: 0,
        max: 10000
      }
    ],
    metadata: {
      createdAt: new Date('2024-01-10'),
      createdBy: 'system',
      version: '1.0.0'
    }
  },
  {
    id: 'stimulus-5',
    name: '状态变更激励',
    description: '改变组件或系统状态',
    category: '状态管理',
    associatedComponents: ['state-manager', 'redux-store', 'context-provider'],
    parameters: [
      {
        name: 'statePath',
        type: 'string',
        description: '状态路径',
        required: true,
        defaultValue: 'app.user.isLoggedIn'
      },
      {
        name: 'newValue',
        type: 'string',
        description: '新值(JSON格式)',
        required: true,
        defaultValue: 'true'
      },
      {
        name: 'merge',
        type: 'boolean',
        description: '是否合并状态',
        required: false,
        defaultValue: false
      }
    ],
    metadata: {
      createdAt: new Date('2024-01-10'),
      createdBy: 'system',
      version: '1.0.0'
    }
  },
  {
    id: 'stimulus-6',
    name: 'GPIO信号激励',
    description: '硬件GPIO引脚信号控制',
    category: '硬件控制',
    associatedComponents: ['gpio-controller', 'pin-interface', 'hardware-driver'],
    parameters: [
      {
        name: 'pinNumber',
        type: 'number',
        description: '引脚号',
        required: true,
        defaultValue: 1,
        min: 1,
        max: 40
      },
      {
        name: 'signalType',
        type: 'select',
        description: '信号类型',
        required: true,
        defaultValue: 'digital',
        options: ['digital', 'analog', 'pwm']
      },
      {
        name: 'value',
        type: 'number',
        description: '信号值',
        required: true,
        defaultValue: 1,
        min: 0,
        max: 1023
      },
      {
        name: 'duration',
        type: 'number',
        description: '持续时间(ms)',
        required: false,
        defaultValue: 1000,
        min: 1,
        max: 10000
      }
    ],
    metadata: {
      createdAt: new Date('2024-01-10'),
      createdBy: 'system',
      version: '1.0.0'
    }
  }
];

// 组件类型定义
export const componentTypes = [
  'button',
  'input', 
  'textarea',
  'form-field',
  'clickable-element',
  'api-client',
  'http-service',
  'websocket',
  'timer',
  'scheduler',
  'cron-job',
  'state-manager',
  'redux-store',
  'context-provider',
  'gpio-controller',
  'pin-interface',
  'hardware-driver'
];

// 激励分类
export const stimulusCategories = [
  '用户交互',
  '数据输入', 
  '网络通信',
  '时间控制',
  '状态管理',
  '硬件控制'
];

/**
 * 根据组件类型过滤激励
 */
export const filterStimulusByComponent = (componentType: string): Stimulus[] => {
  return mockStimuli.filter(stimulus => 
    stimulus.associatedComponents.includes(componentType)
  );
};

/**
 * 根据分类过滤激励
 */
export const filterStimulusByCategory = (category: string): Stimulus[] => {
  return mockStimuli.filter(stimulus => stimulus.category === category);
};

/**
 * 搜索激励
 */
export const searchStimuli = (searchTerm: string): Stimulus[] => {
  const term = searchTerm.toLowerCase();
  return mockStimuli.filter(stimulus =>
    stimulus.name.toLowerCase().includes(term) ||
    stimulus.description.toLowerCase().includes(term) ||
    stimulus.category.toLowerCase().includes(term)
  );
};
