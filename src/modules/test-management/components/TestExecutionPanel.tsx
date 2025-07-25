/**
 * 测试执行面板组件
 * 控制测试用例和测试套件的执行
 */

import React, { useState, useCallback, useEffect } from 'react';
// import { globalTestExecutionEngine } from '../services/testExecutionEngine';

// 定义执行状态接口
interface ActiveExecution {
  id: string;
  type: 'testCase' | 'testSuite';
  name: string;
  progress: number;
  currentStep: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
}

// 临时占位符执行引擎
const globalTestExecutionEngine = {
  getActiveExecutions: (): ActiveExecution[] => [],
  executeTestCase: async (id: string, config: any) => console.log('执行测试用例', id),
  executeTestSuite: async (id: string, config: any) => console.log('执行测试套件', id),
  cancelExecution: (id: string) => console.log('取消执行', id)
};
import { globalEventBus } from '../../core/eventBus';
import { useTestStore } from '../../core/stateManager';
import type { TestCase, TestSuite, TestResult } from '../../core/interfaces';

interface TestExecutionPanelProps {
  testCases: TestCase[];
  testSuites: TestSuite[];
  onTabChange: (tab: string) => void;
}

interface ExecutionState {
  isRunning: boolean;
  currentExecution: string | null;
  currentType: 'testCase' | 'testSuite' | null;
  currentProgress: number;
  currentStep: string;
  results: TestResult[];
  errors: string[];
}

export const TestExecutionPanel: React.FC<TestExecutionPanelProps> = ({
  testCases,
  testSuites,
  onTabChange
}) => {
  const [selectedItems, setSelectedItems] = useState<{
    testCases: Set<string>;
    testSuites: Set<string>;
  }>({
    testCases: new Set(),
    testSuites: new Set()
  });
  
  const [executionState, setExecutionState] = useState<ExecutionState>({
    isRunning: false,
    currentExecution: null,
    currentType: null,
    currentProgress: 0,
    currentStep: '',
    results: [],
    errors: []
  });
  
  const [executionOptions, setExecutionOptions] = useState({
    parallel: false,
    continueOnFailure: true,
    timeout: 300,
    generateReport: true
  });
  
  const [activeExecutions, setActiveExecutions] = useState<ActiveExecution[]>([]);
  
  // 监听执行事件
  useEffect(() => {
    const handleExecutionStarted = (event: any) => {
      setExecutionState(prev => ({
        ...prev,
        isRunning: true,
        currentExecution: event.executionId,
        currentType: event.testCaseId ? 'testCase' : 'testSuite',
        currentProgress: 0,
        currentStep: 'Starting execution...'
      }));
    };
    
    const handleExecutionCompleted = (event: any) => {
      setExecutionState(prev => ({
        ...prev,
        isRunning: false,
        currentExecution: null,
        currentType: null,
        currentProgress: 100,
        currentStep: 'Completed',
        results: event.testResult ? [event.testResult] : event.testResults || []
      }));
    };
    
    const handleExecutionFailed = (event: any) => {
      setExecutionState(prev => ({
        ...prev,
        isRunning: false,
        currentExecution: null,
        currentType: null,
        errors: [...prev.errors, event.error]
      }));
    };
    
    globalEventBus.subscribe('test:execution:started', handleExecutionStarted);
    globalEventBus.subscribe('test:execution:completed', handleExecutionCompleted);
    globalEventBus.subscribe('test:execution:failed', handleExecutionFailed);
    globalEventBus.subscribe('test:suite:execution:started', handleExecutionStarted);
    globalEventBus.subscribe('test:suite:execution:completed', handleExecutionCompleted);
    globalEventBus.subscribe('test:suite:execution:failed', handleExecutionFailed);
    
    return () => {
      globalEventBus.unsubscribe('test:execution:started', handleExecutionStarted);
      globalEventBus.unsubscribe('test:execution:completed', handleExecutionCompleted);
      globalEventBus.unsubscribe('test:execution:failed', handleExecutionFailed);
      globalEventBus.unsubscribe('test:suite:execution:started', handleExecutionStarted);
      globalEventBus.unsubscribe('test:suite:execution:completed', handleExecutionCompleted);
      globalEventBus.unsubscribe('test:suite:execution:failed', handleExecutionFailed);
    };
  }, []);
  
  // 定期更新活动执行状态
  useEffect(() => {
    const interval = setInterval(() => {
      const executions = globalTestExecutionEngine.getActiveExecutions();
      setActiveExecutions(executions);
      
      if (executions.length > 0 && executionState.currentExecution) {
        const currentExec = executions.find(e => e.id === executionState.currentExecution);
        if (currentExec) {
          setExecutionState(prev => ({
            ...prev,
            currentProgress: currentExec.progress,
            currentStep: currentExec.currentStep
          }));
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [executionState.currentExecution]);
  
  const handleTestCaseSelection = useCallback((testCaseId: string, selected: boolean) => {
    setSelectedItems(prev => {
      const newTestCases = new Set(prev.testCases);
      if (selected) {
        newTestCases.add(testCaseId);
      } else {
        newTestCases.delete(testCaseId);
      }
      return { ...prev, testCases: newTestCases };
    });
  }, []);
  
  const handleTestSuiteSelection = useCallback((testSuiteId: string, selected: boolean) => {
    setSelectedItems(prev => {
      const newTestSuites = new Set(prev.testSuites);
      if (selected) {
        newTestSuites.add(testSuiteId);
      } else {
        newTestSuites.delete(testSuiteId);
      }
      return { ...prev, testSuites: newTestSuites };
    });
  }, []);
  
  const handleSelectAllTestCases = useCallback(() => {
    setSelectedItems(prev => ({
      ...prev,
      testCases: new Set(testCases.map(tc => tc.id))
    }));
  }, [testCases]);
  
  const handleDeselectAllTestCases = useCallback(() => {
    setSelectedItems(prev => ({ ...prev, testCases: new Set() }));
  }, []);
  
  const handleExecuteSelected = useCallback(async () => {
    if (executionState.isRunning) return;
    
    const selectedTestCaseIds = Array.from(selectedItems.testCases);
    const selectedTestSuiteIds = Array.from(selectedItems.testSuites);
    
    if (selectedTestCaseIds.length === 0 && selectedTestSuiteIds.length === 0) {
      alert('请先选择要执行的测试用例或测试套件');
      return;
    }
    
    try {
      setExecutionState(prev => ({ ...prev, errors: [] }));
      
      // 执行选中的测试用例
      for (const testCaseId of selectedTestCaseIds) {
        await globalTestExecutionEngine.executeTestCase(testCaseId, {
          timeout: executionOptions.timeout,
          generateReport: executionOptions.generateReport
        });
      }
      
      // 执行选中的测试套件
      for (const testSuiteId of selectedTestSuiteIds) {
        await globalTestExecutionEngine.executeTestSuite(testSuiteId, {
          parallel: executionOptions.parallel,
          continueOnFailure: executionOptions.continueOnFailure,
          timeout: executionOptions.timeout,
          generateReport: executionOptions.generateReport
        });
      }
      
    } catch (error) {
      console.error('Execution failed:', error);
    }
  }, [executionState.isRunning, selectedItems, executionOptions]);
  
  const handleCancelExecution = useCallback(() => {
    if (executionState.currentExecution) {
      globalTestExecutionEngine.cancelExecution(executionState.currentExecution);
    }
  }, [executionState.currentExecution]);
  
  const selectedTestCaseCount = selectedItems.testCases.size;
  const selectedTestSuiteCount = selectedItems.testSuites.size;
  const hasSelections = selectedTestCaseCount > 0 || selectedTestSuiteCount > 0;
  
  return (
    <div className="test-execution-panel">
      {/* 执行控制区域 */}
      <div className="execution-control">
        <div className="control-header">
          <h3>测试执行控制</h3>
          <div className="execution-status">
            {executionState.isRunning && (
              <div className="status-indicator running">
                <span className="spinner"></span>
                正在执行
              </div>
            )}
          </div>
        </div>
        
        {/* 执行选项 */}
        <div className="execution-options">
          <h4>执行选项</h4>
          <div className="options-grid">
            <label>
              <input
                type="checkbox"
                checked={executionOptions.parallel}
                onChange={(e) => setExecutionOptions(prev => 
                  ({ ...prev, parallel: e.target.checked })
                )}
                disabled={executionState.isRunning}
              />
              并行执行
            </label>
            
            <label>
              <input
                type="checkbox"
                checked={executionOptions.continueOnFailure}
                onChange={(e) => setExecutionOptions(prev => 
                  ({ ...prev, continueOnFailure: e.target.checked })
                )}
                disabled={executionState.isRunning}
              />
              失败后继续
            </label>
            
            <label>
              <input
                type="checkbox"
                checked={executionOptions.generateReport}
                onChange={(e) => setExecutionOptions(prev => 
                  ({ ...prev, generateReport: e.target.checked })
                )}
                disabled={executionState.isRunning}
              />
              生成报告
            </label>
            
            <div className="timeout-setting">
              <label htmlFor="timeout">超时时间 (秒)</label>
              <input
                type="number"
                id="timeout"
                value={executionOptions.timeout}
                onChange={(e) => setExecutionOptions(prev => 
                  ({ ...prev, timeout: parseInt(e.target.value) || 300 })
                )}
                min={10}
                max={3600}
                disabled={executionState.isRunning}
              />
            </div>
          </div>
        </div>
        
        {/* 执行按钮 */}
        <div className="execution-buttons">
          <button
            onClick={handleExecuteSelected}
            disabled={!hasSelections || executionState.isRunning}
            className="btn btn-primary btn-large"
          >
            {executionState.isRunning ? '执行中...' : `执行选中项 (${selectedTestCaseCount + selectedTestSuiteCount})`}
          </button>
          
          {executionState.isRunning && (
            <button
              onClick={handleCancelExecution}
              className="btn btn-danger btn-large"
            >
              取消执行
            </button>
          )}
        </div>
        
        {/* 执行进度 */}
        {executionState.isRunning && (
          <div className="execution-progress">
            <div className="progress-info">
              <span className="current-step">{executionState.currentStep}</span>
              <span className="progress-percentage">{executionState.currentProgress.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${executionState.currentProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* 错误信息 */}
        {executionState.errors.length > 0 && (
          <div className="execution-errors">
            <h4>执行错误</h4>
            <ul>
              {executionState.errors.map((error, index) => (
                <li key={index} className="error-item">{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* 测试用例选择区域 */}
      <div className="test-selection">
        <div className="selection-section">
          <div className="section-header">
            <h4>测试用例 ({testCases.length})</h4>
            <div className="selection-actions">
              <button
                onClick={handleSelectAllTestCases}
                className="btn btn-sm"
                disabled={executionState.isRunning}
              >
                全选
              </button>
              <button
                onClick={handleDeselectAllTestCases}
                className="btn btn-sm"
                disabled={executionState.isRunning}
              >
                取消全选
              </button>
            </div>
          </div>
          
          <div className="test-case-list">
            {testCases.map(testCase => (
              <div key={testCase.id} className="selectable-item">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedItems.testCases.has(testCase.id)}
                    onChange={(e) => handleTestCaseSelection(testCase.id, e.target.checked)}
                    disabled={executionState.isRunning}
                  />
                  <div className="item-info">
                    <span className="item-name">{testCase.name}</span>
                    <span className="item-category">{testCase.category}</span>
                    <span className="item-meta">
                      {testCase.associatedNodes.length} 节点
                    </span>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* 测试套件选择区域 */}
        <div className="selection-section">
          <div className="section-header">
            <h4>测试套件 ({testSuites.length})</h4>
          </div>
          
          <div className="test-suite-list">
            {testSuites.map(testSuite => (
              <div key={testSuite.id} className="selectable-item">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedItems.testSuites.has(testSuite.id)}
                    onChange={(e) => handleTestSuiteSelection(testSuite.id, e.target.checked)}
                    disabled={executionState.isRunning}
                  />
                  <div className="item-info">
                    <span className="item-name">{testSuite.name}</span>
                    <span className="item-meta">
                      {testSuite.testCases.length} 测试用例
                    </span>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 活动执行监控 */}
      {activeExecutions.length > 0 && (
        <div className="active-executions">
          <h4>活动执行</h4>
          <div className="execution-list">
            {activeExecutions.map(execution => (
              <div key={execution.id} className="execution-item">
                <div className="execution-info">
                  <span className="execution-type">
                    {execution.type === 'testCase' ? '测试用例' : '测试套件'}
                  </span>
                  <span className="execution-step">{execution.currentStep}</span>
                </div>
                <div className="execution-progress-mini">
                  <div 
                    className="progress-mini-fill"
                    style={{ width: `${execution.progress}%` }}
                  ></div>
                </div>
                <button
                  onClick={() => globalTestExecutionEngine.cancelExecution(execution.id)}
                  className="btn btn-sm btn-danger"
                >
                  取消
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 快速结果预览 */}
      {executionState.results.length > 0 && (
        <div className="quick-results">
          <h4>最近执行结果</h4>
          <div className="results-summary">
            <div className="summary-stats">
              <span className="stat passed">
                通过: {executionState.results.filter(r => r.status === 'passed').length}
              </span>
              <span className="stat failed">
                失败: {executionState.results.filter(r => r.status === 'failed').length}
              </span>
            </div>
            <button
              onClick={() => onTabChange('results')}
              className="btn btn-secondary"
            >
              查看详细结果
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
