/**
 * 增强版测试执行面板 - 支持实际的测试执行和监控
 */

import React, { useState, useEffect, useCallback } from 'react';

interface TestExecution {
  id: string;
  name: string;
  type: 'single' | 'suite';
  testCaseId?: string;
  testSuiteId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentStep?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  results?: TestStepResult[];
  logs?: ExecutionLog[];
  error?: string;
}

interface TestStepResult {
  stepId: string;
  stepName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
  actualResult?: string;
  expectedResult?: string;
}

interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details?: any;
}

interface TestExecutionPanelEnhancedProps {
  onExecutionStart?: (execution: TestExecution) => void;
  onExecutionComplete?: (execution: TestExecution) => void;
}

const TestExecutionPanelEnhanced: React.FC<TestExecutionPanelEnhancedProps> = ({
  onExecutionStart,
  onExecutionComplete
}) => {
  const [executions, setExecutions] = useState<TestExecution[]>([
    {
      id: '1',
      name: '基础功能测试套件执行',
      type: 'suite',
      testSuiteId: 'suite-1',
      status: 'completed',
      progress: 100,
      currentStep: '已完成',
      startTime: new Date(Date.now() - 5 * 60 * 1000),
      endTime: new Date(Date.now() - 1 * 60 * 1000),
      duration: 4 * 60 * 1000,
      results: [
        {
          stepId: 'step-1',
          stepName: '启动设备',
          status: 'passed',
          duration: 1500,
          actualResult: '设备成功启动',
          expectedResult: '设备正常启动'
        },
        {
          stepId: 'step-2',
          stepName: '检查连接状态',
          status: 'passed',
          duration: 800,
          actualResult: '连接状态正常',
          expectedResult: '显示连接成功'
        }
      ],
      logs: [
        {
          timestamp: new Date(Date.now() - 4 * 60 * 1000),
          level: 'info',
          message: '开始执行测试套件'
        },
        {
          timestamp: new Date(Date.now() - 3 * 60 * 1000),
          level: 'info',
          message: '步骤1执行成功'
        },
        {
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          level: 'info',
          message: '步骤2执行成功'
        },
        {
          timestamp: new Date(Date.now() - 1 * 60 * 1000),
          level: 'info',
          message: '测试套件执行完成'
        }
      ]
    },
    {
      id: '2',
      name: '按钮响应测试执行',
      type: 'single',
      testCaseId: 'test-2',
      status: 'running',
      progress: 60,
      currentStep: '执行中：验证按钮响应',
      startTime: new Date(Date.now() - 2 * 60 * 1000),
      results: [
        {
          stepId: 'step-1',
          stepName: '点击按钮',
          status: 'passed',
          duration: 1200,
          actualResult: '按钮状态已改变',
          expectedResult: '按钮状态改变'
        }
      ],
      logs: [
        {
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          level: 'info',
          message: '开始执行测试用例'
        },
        {
          timestamp: new Date(Date.now() - 1 * 60 * 1000),
          level: 'info',
          message: '步骤1执行成功'
        },
        {
          timestamp: new Date(Date.now() - 30 * 1000),
          level: 'info',
          message: '正在执行步骤2...'
        }
      ]
    }
  ]);

  const [selectedExecution, setSelectedExecution] = useState<TestExecution | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 模拟测试执行
  const simulateTestExecution = useCallback((execution: TestExecution) => {
    const updateInterval = setInterval(() => {
      setExecutions(prev => prev.map(exec => {
        if (exec.id === execution.id && exec.status === 'running') {
          const newProgress = Math.min(exec.progress + Math.random() * 15, 100);
          const isComplete = newProgress >= 100;
          
          const updatedExecution = {
            ...exec,
            progress: newProgress,
            currentStep: isComplete ? '已完成' : `执行中：步骤 ${Math.ceil(newProgress / 25)}`,
            status: isComplete ? 'completed' as const : exec.status,
            endTime: isComplete ? new Date() : exec.endTime,
            duration: isComplete && exec.startTime ? Date.now() - exec.startTime.getTime() : exec.duration
          };

          if (isComplete && onExecutionComplete) {
            onExecutionComplete(updatedExecution);
          }

          return updatedExecution;
        }
        return exec;
      }));
    }, 2000);

    // 10秒后清除定时器
    setTimeout(() => clearInterval(updateInterval), 10000);
  }, [onExecutionComplete]);

  // 开始新的测试执行
  const startNewExecution = (name: string, type: 'single' | 'suite') => {
    const newExecution: TestExecution = {
      id: Date.now().toString(),
      name,
      type,
      status: 'running',
      progress: 5,
      currentStep: '初始化测试环境...',
      startTime: new Date(),
      logs: [
        {
          timestamp: new Date(),
          level: 'info',
          message: `开始执行${type === 'single' ? '测试用例' : '测试套件'}: ${name}`
        }
      ]
    };

    setExecutions(prev => [newExecution, ...prev]);
    
    if (onExecutionStart) {
      onExecutionStart(newExecution);
    }

    // 开始模拟执行
    simulateTestExecution(newExecution);
  };

  // 停止测试执行
  const stopExecution = (executionId: string) => {
    setExecutions(prev => prev.map(exec => 
      exec.id === executionId && exec.status === 'running'
        ? {
            ...exec,
            status: 'cancelled' as const,
            endTime: new Date(),
            currentStep: '已取消',
            duration: exec.startTime ? Date.now() - exec.startTime.getTime() : 0
          }
        : exec
    ));
  };

  // 停止所有测试
  const stopAllExecutions = () => {
    const runningExecutions = executions.filter(exec => exec.status === 'running');
    runningExecutions.forEach(exec => stopExecution(exec.id));
  };

  // 删除执行记录
  const deleteExecution = (executionId: string) => {
    setExecutions(prev => prev.filter(exec => exec.id !== executionId));
    if (selectedExecution?.id === executionId) {
      setSelectedExecution(null);
      setShowDetails(false);
    }
  };

  // 清除所有已完成的执行记录
  const clearCompletedExecutions = () => {
    setExecutions(prev => prev.filter(exec => 
      exec.status === 'running' || exec.status === 'pending'
    ));
    if (selectedExecution && selectedExecution.status !== 'running' && selectedExecution.status !== 'pending') {
      setSelectedExecution(null);
      setShowDetails(false);
    }
  };

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      const hasRunningTests = executions.some(exec => exec.status === 'running');
      if (hasRunningTests) {
        // 这里可以实现实际的状态更新逻辑
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, executions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'running': return '#2196F3';
      case 'failed': return '#f44336';
      case 'cancelled': return '#ff9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'running': return '运行中';
      case 'failed': return '失败';
      case 'cancelled': return '已取消';
      case 'pending': return '等待中';
      default: return '未知';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '-';
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const runningCount = executions.filter(exec => exec.status === 'running').length;
  const completedCount = executions.filter(exec => exec.status === 'completed').length;
  const failedCount = executions.filter(exec => exec.status === 'failed').length;

  return (
    <div style={{
      padding: '8px',
      backgroundColor: 'var(--vscode-editor-background)',
      color: 'var(--vscode-foreground)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        padding: '8px',
        backgroundColor: 'var(--vscode-input-background)',
        borderRadius: '2px'
      }}>
        <div>
          <h3 style={{ margin: 0 }}>测试执行监控</h3>
          <div style={{ fontSize: '11px', color: 'var(--vscode-descriptionForeground)', marginTop: '2px' }}>
            运行中: {runningCount} | 已完成: {completedCount} | 失败: {failedCount}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            自动刷新
          </label>
          
          <button
            onClick={() => startNewExecution('快速测试', 'single')}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: 'var(--vscode-button-background)',
              color: 'var(--vscode-button-foreground)',
              border: '1px solid var(--vscode-button-border)',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            运行测试
          </button>
          
          {runningCount > 0 && (
            <button
              onClick={stopAllExecutions}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: 'var(--vscode-errorBackground)',
                color: 'var(--vscode-errorForeground)',
                border: '1px solid var(--vscode-button-border)',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              停止所有测试
            </button>
          )}
          
          <button
            onClick={clearCompletedExecutions}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: 'var(--vscode-button-secondaryBackground)',
              color: 'var(--vscode-button-secondaryForeground)',
              border: '1px solid var(--vscode-button-border)',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            清除已完成
          </button>
        </div>
      </div>

      {/* 执行列表 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {executions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--vscode-descriptionForeground)'
          }}>
            暂无测试执行记录
          </div>
        ) : (
          executions.map(execution => (
            <div
              key={execution.id}
              style={{
                padding: '12px',
                marginBottom: '8px',
                border: '1px solid var(--vscode-panel-border)',
                borderRadius: '2px',
                backgroundColor: selectedExecution?.id === execution.id 
                  ? 'var(--vscode-list-hoverBackground)' 
                  : 'var(--vscode-input-background)',
                cursor: 'pointer'
              }}
              onClick={() => {
                setSelectedExecution(execution);
                setShowDetails(true);
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px' }}>{execution.name}</h4>
                    <span style={{
                      padding: '2px 6px',
                      backgroundColor: 'var(--vscode-badge-background)',
                      color: 'var(--vscode-badge-foreground)',
                      borderRadius: '10px',
                      fontSize: '10px'
                    }}>
                      {execution.type === 'single' ? '单个测试' : '测试套件'}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '8px',
                    fontSize: '12px',
                    color: 'var(--vscode-descriptionForeground)'
                  }}>
                    <div>
                      状态: <span style={{ color: getStatusColor(execution.status) }}>
                        {getStatusText(execution.status)}
                      </span>
                    </div>
                    <div>进度: {execution.progress.toFixed(0)}%</div>
                    {execution.duration && (
                      <div>耗时: {formatDuration(execution.duration)}</div>
                    )}
                    {execution.startTime && (
                      <div>开始: {execution.startTime.toLocaleTimeString()}</div>
                    )}
                  </div>
                  
                  {execution.currentStep && (
                    <p style={{ 
                      margin: '4px 0 0 0', 
                      fontSize: '11px', 
                      color: 'var(--vscode-descriptionForeground)', 
                      fontStyle: 'italic' 
                    }}>
                      {execution.currentStep}
                    </p>
                  )}
                  
                  {execution.error && (
                    <p style={{ 
                      margin: '4px 0 0 0', 
                      fontSize: '11px', 
                      color: 'var(--vscode-errorForeground)' 
                    }}>
                      错误: {execution.error}
                    </p>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '4px' }}>
                  {execution.status === 'running' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        stopExecution(execution.id);
                      }}
                      style={{
                        padding: '2px 6px',
                        fontSize: '11px',
                        backgroundColor: 'var(--vscode-errorBackground)',
                        color: 'var(--vscode-errorForeground)',
                        border: '1px solid var(--vscode-button-border)',
                        borderRadius: '2px',
                        cursor: 'pointer'
                      }}
                    >
                      停止
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteExecution(execution.id);
                    }}
                    style={{
                      padding: '2px 6px',
                      fontSize: '11px',
                      backgroundColor: 'var(--vscode-button-secondaryBackground)',
                      color: 'var(--vscode-button-secondaryForeground)',
                      border: '1px solid var(--vscode-button-border)',
                      borderRadius: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
              
              {/* 进度条 */}
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'var(--vscode-progressBar-background)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${execution.progress}%`,
                  height: '100%',
                  backgroundColor: getStatusColor(execution.status),
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* 详情面板 */}
      {showDetails && selectedExecution && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'var(--vscode-editor-background)',
            border: '1px solid var(--vscode-panel-border)',
            borderRadius: '4px',
            width: '80%',
            maxWidth: '1000px',
            maxHeight: '80%',
            overflow: 'auto',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid var(--vscode-panel-border)',
              paddingBottom: '10px'
            }}>
              <h2 style={{ margin: 0 }}>执行详情: {selectedExecution.name}</h2>
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--vscode-foreground)',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* 执行结果 */}
              <div>
                <h3>执行结果</h3>
                {selectedExecution.results && selectedExecution.results.length > 0 ? (
                  selectedExecution.results.map((result, index) => (
                    <div
                      key={result.stepId}
                      style={{
                        padding: '8px',
                        marginBottom: '8px',
                        border: '1px solid var(--vscode-panel-border)',
                        borderRadius: '2px',
                        backgroundColor: 'var(--vscode-input-background)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <span style={{ fontWeight: 'bold', fontSize: '12px' }}>
                          步骤 {index + 1}: {result.stepName}
                        </span>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '10px',
                          fontSize: '10px',
                          backgroundColor: result.status === 'passed' ? '#4CAF50' : 
                                         result.status === 'failed' ? '#f44336' : '#9E9E9E',
                          color: 'white'
                        }}>
                          {result.status}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '11px', color: 'var(--vscode-descriptionForeground)' }}>
                        <div>耗时: {formatDuration(result.duration)}</div>
                        {result.expectedResult && (
                          <div>期望: {result.expectedResult}</div>
                        )}
                        {result.actualResult && (
                          <div>实际: {result.actualResult}</div>
                        )}
                        {result.error && (
                          <div style={{ color: 'var(--vscode-errorForeground)' }}>
                            错误: {result.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--vscode-descriptionForeground)' }}>
                    暂无执行结果
                  </div>
                )}
              </div>

              {/* 执行日志 */}
              <div>
                <h3>执行日志</h3>
                <div style={{ 
                  maxHeight: '300px', 
                  overflow: 'auto',
                  backgroundColor: 'var(--vscode-terminal-background)',
                  padding: '8px',
                  borderRadius: '2px',
                  fontFamily: 'Consolas, monospace'
                }}>
                  {selectedExecution.logs && selectedExecution.logs.length > 0 ? (
                    selectedExecution.logs.map((log, index) => (
                      <div
                        key={index}
                        style={{
                          fontSize: '11px',
                          marginBottom: '2px',
                          color: log.level === 'error' ? '#f44336' :
                                 log.level === 'warn' ? '#ff9800' :
                                 log.level === 'info' ? '#4CAF50' : 'var(--vscode-foreground)'
                        }}
                      >
                        <span style={{ opacity: 0.7 }}>
                          [{log.timestamp.toLocaleTimeString()}]
                        </span>{' '}
                        <span style={{ fontWeight: 'bold' }}>
                          [{log.level.toUpperCase()}]
                        </span>{' '}
                        {log.message}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--vscode-descriptionForeground)' }}>
                      暂无日志
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestExecutionPanelEnhanced;
