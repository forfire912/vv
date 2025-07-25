/**
 * 测试管理模块导出文件
 * 统一导出测试管理相关的组件、服务和类型
 */

// 核心接口和类型
export * from './core/interfaces';

// 状态管理
export { useTestStore, useTopologyStore, useUIStore } from './core/stateManager';

// 事件总线
export { globalEventBus } from './core/eventBus';

// 服务层 - 暂时禁用以便测试
// export {
//   TestCaseService,
//   TestSuiteService,
//   TopologyIntegrationService
// } from './test-management/services/testManagementService';

// export { 
//   TestExecutionEngine,
//   globalTestExecutionEngine 
// } from './test-management/services/testExecutionEngine';

// 组件
export { TestManagementPanel } from './test-management/components/TestManagementPanel';
// 暂时禁用有编译错误的组件
// export { TestCasePanel } from './test-management/components/TestCasePanel';
// export { TestSuitePanel } from './test-management/components/TestSuitePanel';
// export { TestExecutionPanel } from './test-management/components/TestExecutionPanel';
export { TestResultsPanel } from './test-management/components/TestResultsPanel';

// 模块版本信息
export const VERSION = '1.0.0';
export const MODULE_NAME = 'test-management';
