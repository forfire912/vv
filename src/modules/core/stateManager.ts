/**
 * VlabViewer 全局状态管理系统
 * 基于 Zustand 的轻量级状态管理，支持模块化和持久化
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { globalEventBus } from './eventBus';
import type { 
  Topology, 
  TopologyNode, 
  TopologyConnection,
  TestCase,
  TestSuite,
  TestResult,
  Stimulus
} from './interfaces';

// ===== 状态接口定义 =====

/**
 * 拓扑状态
 */
export interface TopologyState {
  // 当前拓扑
  currentTopology: Topology | null;
  
  // 节点状态
  nodes: TopologyNode[];
  selectedNodes: string[];
  
  // 连接状态
  connections: TopologyConnection[];
  
  // 快照历史
  snapshots: Array<{
    id: string;
    timestamp: Date;
    topology: Topology;
    description: string;
  }>;
  
  // 验证状态
  validationResult: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null;
  
  // 操作状态
  isDirty: boolean;
  isLoading: boolean;
  lastSaved: Date | null;
}

/**
 * 测试管理状态
 */
export interface TestState {
  // 测试用例
  testCases: TestCase[];
  selectedTestCases: string[];
  
  // 测试套件
  testSuites: TestSuite[];
  selectedTestSuite: string | null;
  
  // 执行状态
  runningTests: string[];
  testResults: TestResult[];
  
  // 覆盖率数据
  coverageData: Record<string, any> | null;
  
  // UI状态
  activePanel: 'test-cases' | 'test-suites' | 'results' | 'coverage';
  filters: {
    status: string[];
    category: string[];
    tags: string[];
  };
  
  // 操作状态
  isExecuting: boolean;
  isLoading: boolean;
  error: string | null;
  lastExecution: Date | null;
}

/**
 * 激励状态
 */
export interface StimulusState {
  // 激励列表
  stimuli: Stimulus[];
  selectedStimulus: string | null;
  
  // 模板
  templates: Array<{
    id: string;
    name: string;
    category: string;
    template: any;
  }>;
  
  // 执行状态
  runningStimuli: string[];
  executionResults: Record<string, any>;
  
  // UI状态
  activePanel: 'stimuli' | 'templates' | 'execution';
  isEditing: boolean;
}

/**
 * UI状态
 */
export interface UIState {
  // 面板状态
  panels: {
    left: { visible: boolean; width: number; activeTab: string };
    right: { visible: boolean; width: number; activeTab: string };
    bottom: { visible: boolean; height: number; activeTab: string };
  };
  
  // 模态框状态
  modals: {
    [key: string]: {
      visible: boolean;
      data?: any;
    };
  };
  
  // 通知状态
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: Date;
    autoClose?: boolean;
  }>;
  
  // 主题和设置
  theme: 'light' | 'dark';
  settings: Record<string, any>;
  
  // 加载状态
  loading: {
    global: boolean;
    operations: Record<string, boolean>;
  };
}

/**
 * 应用全局状态
 */
export interface AppState {
  // 项目信息
  project: {
    id: string | null;
    name: string | null;
    path: string | null;
    metadata: Record<string, any>;
  };
  
  // 用户信息
  user: {
    id: string | null;
    name: string | null;
    preferences: Record<string, any>;
  };
  
  // 应用状态
  initialized: boolean;
  version: string;
  
  // 错误状态
  errors: Array<{
    id: string;
    message: string;
    timestamp: Date;
    stack?: string;
  }>;
}

// ===== Store 创建 =====

/**
 * 拓扑状态Store
 */
export const useTopologyStore = create<TopologyState & {
  // Actions
  setTopology: (topology: Topology) => void;
  addNode: (node: TopologyNode) => void;
  updateNode: (id: string, updates: Partial<TopologyNode>) => void;
  removeNode: (id: string) => void;
  selectNodes: (nodeIds: string[]) => void;
  addConnection: (connection: TopologyConnection) => void;
  removeConnection: (id: string) => void;
  createSnapshot: (description: string) => void;
  restoreSnapshot: (snapshotId: string) => void;
  validateTopology: () => void;
  markDirty: () => void;
  markSaved: () => void;
  setLoading: (loading: boolean) => void;
}>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        currentTopology: null,
        nodes: [],
        selectedNodes: [],
        connections: [],
        snapshots: [],
        validationResult: null,
        isDirty: false,
        isLoading: false,
        lastSaved: null,
        
        // Actions
        setTopology: (topology) => {
          set({ currentTopology: topology, nodes: topology.nodes, connections: topology.connections });
          globalEventBus.emit('topology:loaded', { topology });
        },
        
        addNode: (node) => {
          set((state) => ({
            nodes: [...state.nodes, node],
            isDirty: true
          }));
          globalEventBus.emit('node:added', { node });
        },
        
        updateNode: (id, updates) => {
          set((state) => ({
            nodes: state.nodes.map(node => 
              node.id === id ? { ...node, ...updates } : node
            ),
            isDirty: true
          }));
          globalEventBus.emit('node:updated', { node: { id, ...updates }, changes: updates });
        },
        
        removeNode: (id) => {
          set((state) => ({
            nodes: state.nodes.filter(node => node.id !== id),
            selectedNodes: state.selectedNodes.filter(nodeId => nodeId !== id),
            isDirty: true
          }));
          globalEventBus.emit('node:removed', { nodeId: id });
        },
        
        selectNodes: (nodeIds) => {
          set({ selectedNodes: nodeIds });
          nodeIds.forEach(nodeId => {
            globalEventBus.emit('node:selected', { nodeId });
          });
        },
        
        addConnection: (connection) => {
          set((state) => ({
            connections: [...state.connections, connection],
            isDirty: true
          }));
          globalEventBus.emit('connection:added', { connection });
        },
        
        removeConnection: (id) => {
          set((state) => ({
            connections: state.connections.filter(conn => conn.id !== id),
            isDirty: true
          }));
          globalEventBus.emit('connection:removed', { connectionId: id });
        },
        
        createSnapshot: (description) => {
          const state = get();
          if (state.currentTopology) {
            const snapshot = {
              id: `snapshot_${Date.now()}`,
              timestamp: new Date(),
              topology: state.currentTopology,
              description
            };
            set((state) => ({
              snapshots: [...state.snapshots, snapshot]
            }));
            globalEventBus.emit('snapshot:created', { snapshot });
          }
        },
        
        restoreSnapshot: (snapshotId) => {
          const state = get();
          const snapshot = state.snapshots.find(s => s.id === snapshotId);
          if (snapshot) {
            set({
              currentTopology: snapshot.topology,
              nodes: snapshot.topology.nodes,
              connections: snapshot.topology.connections,
              isDirty: true
            });
            globalEventBus.emit('snapshot:restored', { snapshot });
          }
        },
        
        validateTopology: () => {
          const state = get();
          // TODO: 实现拓扑验证逻辑
          const result = {
            valid: true,
            errors: [],
            warnings: []
          };
          set({ validationResult: result });
          globalEventBus.emit('topology:validated', { topology: state.currentTopology, result });
        },
        
        markDirty: () => set({ isDirty: true }),
        markSaved: () => set({ isDirty: false, lastSaved: new Date() }),
        setLoading: (loading) => set({ isLoading: loading })
      }),
      {
        name: 'vlabviewer-topology-state',
        partialize: (state) => ({
          snapshots: state.snapshots,
          lastSaved: state.lastSaved
        })
      }
    )
  )
);

/**
 * 测试状态Store
 */
export const useTestStore = create<TestState & {
  // Actions
  addTestCase: (testCase: TestCase) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  removeTestCase: (id: string) => void;
  selectTestCases: (ids: string[]) => void;
  addTestSuite: (testSuite: TestSuite) => void;
  updateTestSuite: (id: string, updates: Partial<TestSuite>) => void;
  removeTestSuite: (id: string) => void;
  selectTestSuite: (id: string | null) => void;
  startTestExecution: (testCaseId: string) => void;
  completeTestExecution: (result: TestResult) => void;
  setActivePanel: (panel: TestState['activePanel']) => void;
  updateFilters: (filters: Partial<TestState['filters']>) => void;
  setCoverageData: (coverage: any) => void;
}>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        testCases: [],
        selectedTestCases: [],
        testSuites: [],
        selectedTestSuite: null,
        runningTests: [],
        testResults: [],
        coverageData: null,
        activePanel: 'test-cases',
        filters: {
          status: [],
          category: [],
          tags: []
        },
        isExecuting: false,
        isLoading: false,
        error: null,
        lastExecution: null,
        
        // Actions
        addTestCase: (testCase) => {
          set((state) => ({
            testCases: [...state.testCases, testCase]
          }));
          globalEventBus.emit('test:created', { testCase });
        },
        
        updateTestCase: (id, updates) => {
          set((state) => ({
            testCases: state.testCases.map(tc => 
              tc.id === id ? { ...tc, ...updates } : tc
            )
          }));
          globalEventBus.emit('test:updated', { testCase: { id, ...updates }, changes: updates });
        },
        
        removeTestCase: (id) => {
          set((state) => ({
            testCases: state.testCases.filter(tc => tc.id !== id),
            selectedTestCases: state.selectedTestCases.filter(tcId => tcId !== id)
          }));
          globalEventBus.emit('test:deleted', { testCaseId: id });
        },
        
        selectTestCases: (ids) => set({ selectedTestCases: ids }),
        
        addTestSuite: (testSuite) => {
          set((state) => ({
            testSuites: [...state.testSuites, testSuite]
          }));
          globalEventBus.emit('suite:created', { testSuite });
        },
        
        updateTestSuite: (id, updates) => {
          set((state) => ({
            testSuites: state.testSuites.map(ts => 
              ts.id === id ? { ...ts, ...updates } : ts
            )
          }));
          globalEventBus.emit('suite:updated', { testSuite: { id, ...updates }, changes: updates });
        },
        
        removeTestSuite: (id) => {
          set((state) => ({
            testSuites: state.testSuites.filter(ts => ts.id !== id),
            selectedTestSuite: state.selectedTestSuite === id ? null : state.selectedTestSuite
          }));
          globalEventBus.emit('suite:deleted', { testSuiteId: id });
        },
        
        selectTestSuite: (id) => set({ selectedTestSuite: id }),
        
        startTestExecution: (testCaseId) => {
          set((state) => ({
            runningTests: [...state.runningTests, testCaseId],
            isExecuting: true
          }));
          const testCase = get().testCases.find(tc => tc.id === testCaseId);
          if (testCase) {
            globalEventBus.emit('test:started', { testCase, executionId: `exec_${Date.now()}` });
          }
        },
        
        completeTestExecution: (result) => {
          set((state) => ({
            runningTests: state.runningTests.filter(id => id !== result.testCaseId),
            testResults: [...state.testResults, result],
            isExecuting: state.runningTests.length <= 1,
            lastExecution: new Date()
          }));
          globalEventBus.emit('test:completed', { result });
        },
        
        setActivePanel: (panel) => set({ activePanel: panel }),
        updateFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
        setCoverageData: (coverage) => {
          set({ coverageData: coverage });
          globalEventBus.emit('coverage:generated', { coverage });
        }
      }),
      {
        name: 'vlabviewer-test-state',
        partialize: (state) => ({
          testCases: state.testCases,
          testSuites: state.testSuites,
          testResults: state.testResults,
          filters: state.filters
        })
      }
    )
  )
);

/**
 * UI状态Store
 */
export const useUIStore = create<UIState & {
  // Actions
  togglePanel: (panel: keyof UIState['panels']) => void;
  resizePanel: (panel: keyof UIState['panels'], size: { width?: number; height?: number }) => void;
  setActiveTab: (panel: keyof UIState['panels'], tab: string) => void;
  showModal: (modalId: string, data?: any) => void;
  hideModal: (modalId: string) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  setTheme: (theme: UIState['theme']) => void;
  updateSettings: (settings: Partial<UIState['settings']>) => void;
  setGlobalLoading: (loading: boolean) => void;
  setOperationLoading: (operation: string, loading: boolean) => void;
}>()(
  persist(
    (set, get) => ({
      // Initial state
      panels: {
        left: { visible: true, width: 300, activeTab: 'function-tree' },
        right: { visible: true, width: 350, activeTab: 'properties' },
        bottom: { visible: false, height: 200, activeTab: 'results' }
      },
      modals: {},
      notifications: [],
      theme: 'light',
      settings: {},
      loading: {
        global: false,
        operations: {}
      },
      
      // Actions
      togglePanel: (panel) => {
        set((state) => ({
          panels: {
            ...state.panels,
            [panel]: {
              ...state.panels[panel],
              visible: !state.panels[panel].visible
            }
          }
        }));
      },
      
      resizePanel: (panel, size) => {
        set((state) => ({
          panels: {
            ...state.panels,
            [panel]: {
              ...state.panels[panel],
              ...size
            }
          }
        }));
      },
      
      setActiveTab: (panel, tab) => {
        set((state) => ({
          panels: {
            ...state.panels,
            [panel]: {
              ...state.panels[panel],
              activeTab: tab
            }
          }
        }));
      },
      
      showModal: (modalId, data) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [modalId]: { visible: true, data }
          }
        }));
        globalEventBus.emit('ui:modal-opened', { modalId });
      },
      
      hideModal: (modalId) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [modalId]: { visible: false }
          }
        }));
        globalEventBus.emit('ui:modal-closed', { modalId });
      },
      
      addNotification: (notification) => {
        const id = `notification_${Date.now()}`;
        const newNotification = {
          ...notification,
          id,
          timestamp: new Date()
        };
        
        set((state) => ({
          notifications: [...state.notifications, newNotification]
        }));
        
        // 自动移除通知
        if (notification.autoClose !== false) {
          setTimeout(() => {
            get().removeNotification(id);
          }, 5000);
        }
        
        globalEventBus.emit('ui:notification', { type: notification.type, message: notification.message });
      },
      
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },
      
      setTheme: (theme) => set({ theme }),
      updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
      setGlobalLoading: (loading) => set((state) => ({ loading: { ...state.loading, global: loading } })),
      setOperationLoading: (operation, loading) => {
        set((state) => ({
          loading: {
            ...state.loading,
            operations: {
              ...state.loading.operations,
              [operation]: loading
            }
          }
        }));
      }
    }),
    {
      name: 'vlabviewer-ui-state',
      partialize: (state) => ({
        panels: state.panels,
        theme: state.theme,
        settings: state.settings
      })
    }
  )
);

// ===== 状态选择器和工具函数 =====

/**
 * 获取选中的测试用例
 */
export const useSelectedTestCases = () => {
  return useTestStore((state) => 
    state.testCases.filter(tc => state.selectedTestCases.includes(tc.id))
  );
};

/**
 * 获取选中的节点
 */
export const useSelectedNodes = () => {
  return useTopologyStore((state) => 
    state.nodes.filter(node => state.selectedNodes.includes(node.id))
  );
};

/**
 * 获取过滤后的测试用例
 */
export const useFilteredTestCases = () => {
  return useTestStore((state) => {
    let filtered = state.testCases;
    
    if (state.filters.status.length > 0) {
      filtered = filtered.filter(tc => 
        state.filters.status.includes(tc.execution.status)
      );
    }
    
    if (state.filters.category.length > 0) {
      filtered = filtered.filter(tc => 
        state.filters.category.includes(tc.category)
      );
    }
    
    if (state.filters.tags.length > 0) {
      filtered = filtered.filter(tc => 
        tc.tags.some(tag => state.filters.tags.includes(tag))
      );
    }
    
    return filtered;
  });
};
