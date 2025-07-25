/**
 * 简化版测试数据初始化工具
 * 为测试管理面板提供模拟数据
 */

import { useTestStore } from './core/stateManager';

/**
 * 初始化测试数据（简化版）
 */
export const initializeTestData = () => {
  console.log('简化版测试数据初始化 - 暂时跳过复杂接口');
  // TODO: 等接口稳定后重新实现
  
  const testStore = useTestStore.getState();
  console.log('测试存储已初始化:', testStore);
};
