/**
 * 简化版测试管理面板 - 用于快速测试
 */

import React, { useState } from 'react';
import TestCasePanelSimple from './TestCasePanelSimple';
import TestSuitePanelSimple from './TestSuitePanelSimple';
import TestExecutionPanelSimple from './TestExecutionPanelSimple';

interface TestManagementPanelSimpleProps {
  isVisible: boolean;
  onClose: () => void;
}

export const TestManagementPanelSimple: React.FC<TestManagementPanelSimpleProps> = ({
  isVisible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'suites' | 'results'>('tests');

  if (!isVisible) return null;

  return (
    <div className="test-management-panel" style={{
      position: 'fixed',
      top: '60px',
      right: '10px',
      width: '400px',
      height: '600px',
      backgroundColor: 'var(--vscode-editor-background)',
      border: '1px solid var(--vscode-panel-border)',
      borderRadius: '4px',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px',
        borderBottom: '1px solid var(--vscode-panel-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--vscode-titleBar-activeBackground)'
      }}>
        <h3 style={{ margin: 0, color: 'var(--vscode-titleBar-activeForeground)' }}>
          测试管理
        </h3>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--vscode-titleBar-activeForeground)',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--vscode-panel-border)',
        backgroundColor: 'var(--vscode-tab-inactiveBackground)'
      }}>
        {(['tests', 'suites', 'results'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              backgroundColor: activeTab === tab 
                ? 'var(--vscode-tab-activeBackground)' 
                : 'var(--vscode-tab-inactiveBackground)',
              color: activeTab === tab 
                ? 'var(--vscode-tab-activeForeground)' 
                : 'var(--vscode-tab-inactiveForeground)',
              cursor: 'pointer'
            }}
          >
            {tab === 'tests' ? '测试用例' : 
             tab === 'suites' ? '测试套件' : '执行结果'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '12px'
      }}>
        {activeTab === 'tests' && <TestCasePanelSimple />}
        {activeTab === 'suites' && <TestSuitePanelSimple />}
        {activeTab === 'results' && <TestExecutionPanelSimple />}
      </div>
    </div>
  );
};

export default TestManagementPanelSimple;
