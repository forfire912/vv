import React, { useState } from 'react';

interface TestExecution {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
}

const TestExecutionPanelSimple: React.FC = () => {
  const [executions] = useState<TestExecution[]>([
    { 
      id: '1', 
      name: '基础功能测试套件执行', 
      status: 'completed',
      progress: 100,
      currentStep: '已完成'
    },
    { 
      id: '2', 
      name: '按钮响应测试执行', 
      status: 'running',
      progress: 60,
      currentStep: '执行中：验证按钮响应'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'running': return '#2196F3';
      case 'failed': return '#f44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'running': return '运行中';
      case 'failed': return '失败';
      case 'pending': return '等待中';
      default: return '未知';
    }
  };

  return (
    <div style={{
      padding: '8px',
      backgroundColor: 'var(--vscode-editor-background)',
      color: 'var(--vscode-foreground)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{ margin: 0 }}>测试执行</h3>
        <button style={{
          padding: '4px 8px',
          backgroundColor: 'var(--vscode-errorBackground)',
          color: 'var(--vscode-errorForeground)',
          border: '1px solid var(--vscode-button-border)',
          borderRadius: '2px',
          cursor: 'pointer'
        }}>
          停止所有测试
        </button>
      </div>
      
      <div>
        {executions.map(execution => (
          <div key={execution.id} style={{
            padding: '8px',
            marginBottom: '8px',
            border: '1px solid var(--vscode-panel-border)',
            borderRadius: '2px',
            backgroundColor: 'var(--vscode-input-background)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '8px'
            }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{execution.name}</h4>
                <p style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: '12px',
                  color: getStatusColor(execution.status)
                }}>
                  状态: {getStatusText(execution.status)}
                </p>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>
                  进度: {execution.progress}%
                </p>
                {execution.currentStep && (
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--vscode-descriptionForeground)', fontStyle: 'italic' }}>
                    {execution.currentStep}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button style={{
                  padding: '2px 6px',
                  fontSize: '11px',
                  backgroundColor: 'var(--vscode-button-secondaryBackground)',
                  color: 'var(--vscode-button-secondaryForeground)',
                  border: '1px solid var(--vscode-button-border)',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}>
                  查看详情
                </button>
                {execution.status === 'running' && (
                  <button style={{
                    padding: '2px 6px',
                    fontSize: '11px',
                    backgroundColor: 'var(--vscode-errorBackground)',
                    color: 'var(--vscode-errorForeground)',
                    border: '1px solid var(--vscode-button-border)',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}>
                    停止
                  </button>
                )}
              </div>
            </div>
            
            {/* Progress bar */}
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
        ))}
      </div>
    </div>
  );
};

export default TestExecutionPanelSimple;
