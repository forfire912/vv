/**
 * 测试套件面板组件
 * 显示和管理测试套件的层次结构
 */

import React, { useState, useCallback, useMemo } from 'react';
// import { TestSuiteService } from '../services/testManagementService';

// 临时占位符服务
const TestSuiteService = {
  deleteTestSuite: (id: string) => console.log('删除测试套件', id),
  createTestSuite: (data: any): TestSuite => ({
    id: 'suite-' + Date.now(),
    name: data.name || '新套件',
    description: data.description || '',
    testCases: data.testCases || [],
    subSuites: [],
    associatedTopologyNodes: data.associatedTopologyNodes || [],
    executionConfig: data.executionConfig || {
      parallel: false,
      timeout: 10000,
      continueOnFailure: false
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user',
      updatedBy: 'user'
    },
    parentId: data.parentId
  }),
  updateTestSuite: (id: string, data: any) => console.log('更新测试套件', id, data)
};
import { useTestStore } from '../../core/stateManager';
import type { TestCase, TestSuite } from '../../core/interfaces';

interface TestSuitePanelProps {
  testSuites: TestSuite[];
  testCases: TestCase[];
  selectedTestSuite: string | null;
  onTestSuiteSelect: (testSuiteId: string | null) => void;
  onTabChange: (tab: string) => void;
}

export const TestSuitePanel: React.FC<TestSuitePanelProps> = ({
  testSuites,
  testCases,
  selectedTestSuite,
  onTestSuiteSelect,
  onTabChange
}) => {
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | undefined>();
  
  // 获取根级测试套件
  const rootSuites = useMemo(() => {
    return testSuites.filter(suite => !suite.parentId);
  }, [testSuites]);
  
  // 获取子套件
  const getChildSuites = useCallback((parentId: string) => {
    return testSuites.filter(suite => suite.parentId === parentId);
  }, [testSuites]);
  
  // 获取套件中的测试用例
  const getSuiteTestCases = useCallback((suiteId: string) => {
    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return [];
    
    return testCases.filter(tc => suite.testCases.includes(tc.id));
  }, [testSuites, testCases]);
  
  // 计算套件统计信息
  const getSuiteStats = useCallback((suiteId: string): { totalTests: number; passedTests: number; failedTests: number; subSuites: number } => {
    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return { totalTests: 0, passedTests: 0, failedTests: 0, subSuites: 0 };
    
    const directTests = suite.testCases.length;
    const childSuites = getChildSuites(suiteId);
    const indirectTests = childSuites.reduce((sum, child) => 
      sum + getSuiteStats(child.id).totalTests, 0);
    
    return {
      totalTests: directTests + indirectTests,
      passedTests: 0, // TODO: 计算通过的测试
      failedTests: 0, // TODO: 计算失败的测试
      subSuites: childSuites.length
    };
  }, [testSuites, getChildSuites]);
  
  const toggleSuiteExpansion = useCallback((suiteId: string) => {
    setExpandedSuites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suiteId)) {
        newSet.delete(suiteId);
      } else {
        newSet.add(suiteId);
      }
      return newSet;
    });
  }, []);
  
  const handleCreateSuite = useCallback((parentId?: string) => {
    setCreateParentId(parentId);
    setShowCreateForm(true);
  }, []);
  
  const handleDeleteSuite = useCallback((suiteId: string) => {
    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return;
    
    const stats = getSuiteStats(suiteId);
    const confirmMessage = stats.totalTests > 0 || stats.subSuites > 0
      ? `确定要删除测试套件 "${suite.name}" 吗？这将同时删除 ${stats.subSuites} 个子套件和 ${stats.totalTests} 个测试用例。`
      : `确定要删除测试套件 "${suite.name}" 吗？`;
    
    if (confirm(confirmMessage)) {
      TestSuiteService.deleteTestSuite(suiteId);
      if (selectedTestSuite === suiteId) {
        onTestSuiteSelect(null);
      }
    }
  }, [testSuites, getSuiteStats, selectedTestSuite, onTestSuiteSelect]);
  
  const handleExecuteSuite = useCallback((suiteId: string) => {
    onTestSuiteSelect(suiteId);
    onTabChange('execution');
  }, [onTestSuiteSelect, onTabChange]);
  
  // 渲染测试套件树节点
  const renderSuiteNode = useCallback((suite: TestSuite, level: number = 0) => {
    const isExpanded = expandedSuites.has(suite.id);
    const isSelected = selectedTestSuite === suite.id;
    const childSuites = getChildSuites(suite.id);
    const suiteTestCases = getSuiteTestCases(suite.id);
    const stats = getSuiteStats(suite.id);
    const hasChildren = childSuites.length > 0;
    
    return (
      <div key={suite.id} className="suite-node">
        <div
          className={`suite-item ${isSelected ? 'selected' : ''}`}
          style={{ marginLeft: `${level * 20}px` }}
          onClick={() => onTestSuiteSelect(suite.id)}
        >
          <div className="suite-header">
            <div className="suite-expand">
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSuiteExpansion(suite.id);
                  }}
                  className="expand-button"
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              )}
              {!hasChildren && <span className="no-expand">•</span>}
            </div>
            
            <div className="suite-info">
              <h4 className="suite-name">{suite.name}</h4>
              <span className="suite-stats">
                {stats.totalTests} 测试用例
                {stats.subSuites > 0 && `, ${stats.subSuites} 子套件`}
              </span>
            </div>
            
            <div className="suite-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExecuteSuite(suite.id);
                }}
                className="btn btn-sm btn-primary"
                title="执行套件"
                disabled={stats.totalTests === 0}
              >
                ▶
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateSuite(suite.id);
                }}
                className="btn btn-sm"
                title="创建子套件"
              >
                +
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSuite(suite.id);
                }}
                className="btn btn-sm btn-danger"
                title="删除套件"
              >
                🗑️
              </button>
            </div>
          </div>
          
          {suite.description && (
            <p className="suite-description">{suite.description}</p>
          )}
        </div>
        
        {/* 展开时显示子内容 */}
        {isExpanded && (
          <div className="suite-children">
            {/* 子套件 */}
            {childSuites.map(childSuite => 
              renderSuiteNode(childSuite, level + 1)
            )}
            
            {/* 直接测试用例 */}
            {suiteTestCases.map(testCase => (
              <div
                key={testCase.id}
                className="test-case-in-suite"
                style={{ marginLeft: `${(level + 1) * 20 + 20}px` }}
              >
                <span className="test-case-icon">📝</span>
                <span className="test-case-name">{testCase.name}</span>
                <span className="test-case-category">{testCase.category}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }, [
    expandedSuites,
    selectedTestSuite,
    getChildSuites,
    getSuiteTestCases,
    getSuiteStats,
    onTestSuiteSelect,
    toggleSuiteExpansion,
    handleExecuteSuite,
    handleCreateSuite,
    handleDeleteSuite
  ]);
  
  return (
    <div className="test-suite-panel">
      {/* 工具栏 */}
      <div className="toolbar">
        <div className="toolbar-left">
          <h3>测试套件</h3>
          <span className="suite-count">({testSuites.length} 个套件)</span>
        </div>
        
        <div className="toolbar-right">
          <button
            onClick={() => handleCreateSuite()}
            className="btn btn-primary"
          >
            + 创建套件
          </button>
          
          <button
            onClick={() => {
              setExpandedSuites(new Set(testSuites.map(s => s.id)));
            }}
            className="btn btn-secondary"
          >
            展开全部
          </button>
          
          <button
            onClick={() => {
              setExpandedSuites(new Set());
            }}
            className="btn btn-secondary"
          >
            折叠全部
          </button>
        </div>
      </div>
      
      {/* 套件树 */}
      <div className="suite-tree">
        {rootSuites.length === 0 ? (
          <div className="empty-state">
            <p>还没有测试套件</p>
            <button
              onClick={() => handleCreateSuite()}
              className="btn btn-primary"
            >
              创建第一个测试套件
            </button>
          </div>
        ) : (
          rootSuites.map(suite => renderSuiteNode(suite, 0))
        )}
      </div>
      
      {/* 选中套件的详细信息 */}
      {selectedTestSuite && (
        <TestSuiteDetails
          testSuiteId={selectedTestSuite}
          onClose={() => onTestSuiteSelect(null)}
          onTabChange={onTabChange}
        />
      )}
      
      {/* 创建套件表单 */}
      {showCreateForm && (
        <CreateTestSuiteForm
          parentId={createParentId}
          onClose={() => {
            setShowCreateForm(false);
            setCreateParentId(undefined);
          }}
          onCreated={(suite) => {
            setShowCreateForm(false);
            setCreateParentId(undefined);
            onTestSuiteSelect(suite.id);
          }}
        />
      )}
    </div>
  );
};

/**
 * 测试套件详细信息组件
 */
const TestSuiteDetails: React.FC<{
  testSuiteId: string;
  onClose: () => void;
  onTabChange: (tab: string) => void;
}> = ({ testSuiteId, onClose, onTabChange }) => {
  const { testSuite, testCases } = useTestStore(state => {
    const suite = state.testSuites.find((ts: TestSuite) => ts.id === testSuiteId);
    const cases = suite ? state.testCases.filter((tc: TestCase) => 
      suite.testCases.includes(tc.id)
    ) : [];
    
    return {
      testSuite: suite,
      testCases: cases
    };
  });
  
  if (!testSuite) {
    return <div>测试套件未找到</div>;
  }
  
  return (
    <div className="test-suite-details-modal">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{testSuite.name}</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        
        <div className="modal-body">
          <div className="detail-section">
            <h4>基本信息</h4>
            <p><strong>描述:</strong> {testSuite.description}</p>
            <p><strong>创建者:</strong> {testSuite.metadata.createdBy}</p>
            <p><strong>创建时间:</strong> {new Date(testSuite.metadata.createdAt).toLocaleString()}</p>
          </div>
          
          <div className="detail-section">
            <h4>执行配置</h4>
            <p><strong>并行执行:</strong> {testSuite.executionConfig.parallel ? '是' : '否'}</p>
            <p><strong>超时时间:</strong> {testSuite.executionConfig.timeout} 秒</p>
            <p><strong>失败后继续:</strong> {testSuite.executionConfig.continueOnFailure ? '是' : '否'}</p>
          </div>
          
          <div className="detail-section">
            <h4>包含的测试用例 ({testCases.length})</h4>
            {testCases.length > 0 ? (
              <ul className="test-case-list">
                {testCases.map(testCase => (
                  <li key={testCase.id} className="test-case-item">
                    <span className="test-case-name">{testCase.name}</span>
                    <span className="test-case-category">{testCase.category}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>此套件中没有测试用例</p>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            onClick={() => {
              onTabChange('execution');
              onClose();
            }}
            className="btn btn-primary"
            disabled={testCases.length === 0}
          >
            执行套件
          </button>
          
          <button onClick={onClose} className="btn btn-secondary">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 创建测试套件表单组件
 */
const CreateTestSuiteForm: React.FC<{
  parentId?: string;
  onClose: () => void;
  onCreated: (suite: TestSuite) => void;
}> = ({ parentId, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parallel: false,
    timeout: 300,
    continueOnFailure: true
  });
  
  const parentSuite = useTestStore(state => 
    parentId ? state.testSuites.find((s: TestSuite) => s.id === parentId) : null
  );
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const suite = TestSuiteService.createTestSuite({
      name: formData.name,
      description: formData.description,
      parentId
    });
    
    // 更新执行配置
    TestSuiteService.updateTestSuite(suite.id, {
      executionConfig: {
        parallel: formData.parallel,
        timeout: formData.timeout,
        continueOnFailure: formData.continueOnFailure
      }
    });
    
    onCreated(suite);
  };
  
  return (
    <div className="create-test-suite-modal">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h3>
            {parentId ? '创建子测试套件' : '创建测试套件'}
          </h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          {parentSuite && (
            <div className="parent-info">
              <p><strong>父套件:</strong> {parentSuite.name}</p>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="name">套件名称 *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="输入测试套件名称"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">描述</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述测试套件的目的和范围"
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <h4>执行配置</h4>
            
            <label>
              <input
                type="checkbox"
                checked={formData.parallel}
                onChange={(e) => setFormData({ ...formData, parallel: e.target.checked })}
              />
              并行执行测试用例
            </label>
            
            <label>
              <input
                type="checkbox"
                checked={formData.continueOnFailure}
                onChange={(e) => setFormData({ ...formData, continueOnFailure: e.target.checked })}
              />
              测试失败后继续执行
            </label>
            
            <div className="form-row">
              <label htmlFor="timeout">超时时间 (秒)</label>
              <input
                type="number"
                id="timeout"
                value={formData.timeout}
                onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) || 300 })}
                min={10}
                max={3600}
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="submit" className="btn btn-primary">
              创建
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
