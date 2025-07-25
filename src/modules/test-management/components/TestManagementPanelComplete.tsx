/**
 * 测试管理面板主组件 - 集成所有测试管理功能
 */

import React, { useState, useEffect } from 'react';
import TestCasePanelEnhanced from './TestCasePanelEnhanced';
import TestSuitePanelEnhanced from './TestSuitePanelEnhanced';
import TestExecutionPanelEnhanced from './TestExecutionPanelEnhanced';
import TestReportPanelEnhanced from './TestReportPanelEnhanced';
import { TestExecution, TestCase, testExecutionEngine } from '../core/executionEngine';

// CSS通过HTML直接加载，不在组件中导入

interface TestManagementPanelProps {
  isVisible?: boolean;
  className?: string;
  onClose?: () => void;
}

export const TestManagementPanelComplete: React.FC<TestManagementPanelProps> = ({
  isVisible = true,
  onClose,
  ...props
}) => {
  const [activeTab, setActiveTab] = useState<'testcases' | 'testsuites' | 'execution' | 'reports'>('testcases');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [lastExecutionUpdate, setLastExecutionUpdate] = useState(Date.now());

  // 获取执行记录
  useEffect(() => {
    const interval = setInterval(() => {
      const currentExecutions = testExecutionEngine.getAllExecutions();
      setExecutions(currentExecutions);
      setLastExecutionUpdate(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 处理新的测试执行
  const handleExecutionStart = (execution: TestExecution) => {
    setActiveTab('execution');
  };

  // 处理从测试用例执行单个测试
  const handleTestCaseExecution = async (testCase: TestCase) => {
    try {
      const execution = await testExecutionEngine.executeTestCase(testCase);
      handleExecutionStart(execution);
    } catch (error) {
      console.error('Failed to start test case execution:', error);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="test-management-panel">
      {/* 标题栏 */}
      <div className="panel-header">
        <h2 className="panel-title">
          VlabViewer 测试管理 - 完整版
        </h2>
        {onClose && (
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {/* 标签页导航 */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'testcases' ? 'active' : ''}`}
          onClick={() => setActiveTab('testcases')}
        >
          测试用例
        </button>
        <button
          className={`tab-button ${activeTab === 'testsuites' ? 'active' : ''}`}
          onClick={() => setActiveTab('testsuites')}
        >
          测试套件
        </button>
        <button
          className={`tab-button ${activeTab === 'execution' ? 'active' : ''}`}
          onClick={() => setActiveTab('execution')}
        >
          执行监控
          {executions.filter(e => e.status === 'running').length > 0 && (
            <span className="execution-badge">
              {executions.filter(e => e.status === 'running').length}
            </span>
          )}
        </button>
        <button
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          测试报告
        </button>
      </div>

      {/* 内容区域 */}
      <div className="tab-content">
        {activeTab === 'testcases' && (
          <TestCasePanelEnhanced
            onTestCaseUpdate={setTestCases}
            onExecutionStart={handleExecutionStart}
          />
        )}
        
        {activeTab === 'testsuites' && (
          <TestSuitePanelEnhanced
            onExecutionStart={handleExecutionStart}
            availableTestCases={testCases}
          />
        )}
        
        {activeTab === 'execution' && (
          <TestExecutionPanelEnhanced
            onExecutionStart={handleExecutionStart}
          />
        )}
        
        {activeTab === 'reports' && (
          <TestReportPanelEnhanced
            executions={executions}
            testCases={testCases}
          />
        )}
      </div>

      {/* 状态栏 */}
      <div className="status-bar">
        <div className="status-info">
          <span>测试用例: {testCases.length}</span>
          <span>执行记录: {executions.length}</span>
          <span>运行中: {executions.filter(e => e.status === 'running').length}</span>
        </div>
        <div className="last-update">
          最后更新: {new Date(lastExecutionUpdate).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default TestManagementPanelComplete;
