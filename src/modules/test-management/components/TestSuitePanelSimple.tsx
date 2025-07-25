import React, { useState } from 'react';

interface TestSuite {
  id: string;
  name: string;
  description?: string;
  testCases?: string[];
}

const TestSuitePanelSimple: React.FC = () => {
  const [testSuites] = useState<TestSuite[]>([
    { id: '1', name: '基础功能测试套件', description: '包含基础功能的测试用例', testCases: ['1', '2'] },
    { id: '2', name: '交互测试套件', description: '包含用户交互的测试用例', testCases: ['2', '3'] }
  ]);

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
        <h3 style={{ margin: 0 }}>测试套件</h3>
        <button style={{
          padding: '4px 8px',
          backgroundColor: 'var(--vscode-button-background)',
          color: 'var(--vscode-button-foreground)',
          border: '1px solid var(--vscode-button-border)',
          borderRadius: '2px',
          cursor: 'pointer'
        }}>
          新建测试套件
        </button>
      </div>
      
      <div>
        {testSuites.map(suite => (
          <div key={suite.id} style={{
            padding: '8px',
            marginBottom: '8px',
            border: '1px solid var(--vscode-panel-border)',
            borderRadius: '2px',
            backgroundColor: 'var(--vscode-input-background)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{suite.name}</h4>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>
                  {suite.description}
                </p>
                <span style={{ 
                  fontSize: '11px', 
                  color: 'var(--vscode-descriptionForeground)',
                  fontStyle: 'italic'
                }}>
                  {suite.testCases?.length || 0} 个测试用例
                </span>
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
                  编辑
                </button>
                <button style={{
                  padding: '2px 6px',
                  fontSize: '11px',
                  backgroundColor: 'var(--vscode-button-background)',
                  color: 'var(--vscode-button-foreground)',
                  border: '1px solid var(--vscode-button-border)',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}>
                  运行套件
                </button>
                <button style={{
                  padding: '2px 6px',
                  fontSize: '11px',
                  backgroundColor: 'var(--vscode-errorBackground)',
                  color: 'var(--vscode-errorForeground)',
                  border: '1px solid var(--vscode-button-border)',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}>
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestSuitePanelSimple;
