import React, { useState } from 'react';

interface TestCase {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

const TestCasePanelSimple: React.FC = () => {
  const [testCases] = useState<TestCase[]>([
    { id: '1', name: '基础连接测试', description: '测试基本的连接功能' },
    { id: '2', name: '按钮响应测试', description: '测试按钮交互响应' },
    { id: '3', name: '数据传输测试', description: '测试数据传输功能' }
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
        <h3 style={{ margin: 0 }}>测试用例</h3>
        <button style={{
          padding: '4px 8px',
          backgroundColor: 'var(--vscode-button-background)',
          color: 'var(--vscode-button-foreground)',
          border: '1px solid var(--vscode-button-border)',
          borderRadius: '2px',
          cursor: 'pointer'
        }}>
          新建测试用例
        </button>
      </div>
      
      <div>
        {testCases.map(testCase => (
          <div key={testCase.id} style={{
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
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{testCase.name}</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>
                  {testCase.description}
                </p>
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
                  运行
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

export default TestCasePanelSimple;
