/**
 * 测试用例面板组件
 * 显示和管理测试用例列表
 */

import React, { useState, useCallback, useMemo } from 'react';
// import { TestCaseService, TopologyIntegrationService } from '../services/testManagementService';

// 临时占位符服务
const TestCaseService = {
  deleteTestCase: (id: string) => console.log('删除测试用例', id),
  duplicateTestCase: (id: string) => ({ id: 'new-' + id, name: '复制的测试' }),
  createTestCase: (data: any): TestCase => ({
    id: 'test-' + Date.now(),
    name: data.name || '新测试',
    description: data.description || '',
    category: data.category || 'general',
    tags: data.tags || [],
    associatedNodes: data.associatedNodes || [],
    functionTreePath: '/tests/new',
    testConfiguration: {
      topology: {
        nodeIds: data.associatedNodes || [],
        connectionIds: [],
        dynamicCapture: data.captureTopologySnapshot || false
      },
      stimuli: [],
      environment: {
        name: 'default',
        version: '1.0.0',
        variables: {},
        constraints: []
      },
      expectedResults: {
        outputs: [],
        behaviors: [],
        performance: {
          maxExecutionTime: 10000,
          maxMemoryUsage: 1024,
          maxCpuUsage: 80
        }
      }
    },
    execution: {
      status: 'pending' as const,
      attempts: 0
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user',
      updatedBy: 'user',
      version: '1.0.0'
    }
  })
};

const TopologyIntegrationService = {
  createTestCaseFromSelectedNodes: () => ({ id: 'topology-test', name: '拓扑测试' })
};
import { useTestStore, useTopologyStore } from '../../core/stateManager';
import type { TestCase } from '../../core/interfaces';

interface TestCasePanelProps {
  testCases: TestCase[];
  selectedTestCase: string | null;
  onTestCaseSelect: (testCaseId: string | null) => void;
  onTabChange: (tab: string) => void;
}

export const TestCasePanel: React.FC<TestCasePanelProps> = ({
  testCases,
  selectedTestCase,
  onTestCaseSelect,
  onTabChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'category'>('name');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const { selectedNodes } = useTopologyStore(state => ({
    selectedNodes: state.selectedNodes
  }));
  
  // 过滤和排序测试用例
  const filteredAndSortedTestCases = useMemo(() => {
    let filtered = testCases;
    
    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter(tc =>
        tc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // 按类别过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tc => tc.category === selectedCategory);
    }
    
    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime();
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [testCases, searchTerm, selectedCategory, sortBy]);
  
  // 获取所有类别
  const categories = useMemo(() => {
    const categorySet = new Set(testCases.map(tc => tc.category));
    return Array.from(categorySet);
  }, [testCases]);
  
  const handleCreateTestCase = useCallback(() => {
    setShowCreateForm(true);
  }, []);
  
  const handleCreateFromNodes = useCallback(() => {
    if (selectedNodes.length === 0) {
      alert('请先在拓扑编辑器中选择节点');
      return;
    }
    
    const testCase = TopologyIntegrationService.createTestCaseFromSelectedNodes();
    if (testCase) {
      onTestCaseSelect(testCase.id);
      alert('已成功创建测试用例');
    }
  }, [selectedNodes, onTestCaseSelect]);
  
  const handleDeleteTestCase = useCallback((testCaseId: string) => {
    if (confirm('确定要删除这个测试用例吗？')) {
      TestCaseService.deleteTestCase(testCaseId);
      if (selectedTestCase === testCaseId) {
        onTestCaseSelect(null);
      }
    }
  }, [selectedTestCase, onTestCaseSelect]);
  
  const handleDuplicateTestCase = useCallback((testCaseId: string) => {
    const duplicated = TestCaseService.duplicateTestCase(testCaseId);
    onTestCaseSelect(duplicated.id);
  }, [onTestCaseSelect]);
  
  const getExecutionStatusIcon = (testCase: TestCase) => {
    switch (testCase.execution.status) {
      case 'passed':
        return '✅';
      case 'failed':
        return '❌';
      case 'running':
        return '🔄';
      case 'pending':
        return '⏳';
      default:
        return '⚪';
    }
  };
  
  return (
    <div className="test-case-panel">
      {/* 工具栏 */}
      <div className="toolbar">
        <div className="search-filter-group">
          <input
            type="text"
            placeholder="搜索测试用例..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            <option value="all">所有类别</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="name">按名称排序</option>
            <option value="created">按创建时间排序</option>
            <option value="category">按类别排序</option>
          </select>
        </div>
        
        <div className="action-buttons">
          <button
            onClick={handleCreateTestCase}
            className="btn btn-primary"
            title="创建新测试用例"
          >
            + 新建
          </button>
          
          <button
            onClick={handleCreateFromNodes}
            className="btn btn-secondary"
            disabled={selectedNodes.length === 0}
            title={selectedNodes.length === 0 ? '请先选择节点' : '从选中节点创建测试用例'}
          >
            从节点创建
          </button>
        </div>
      </div>
      
      {/* 测试用例列表 */}
      <div className="test-case-list">
        {filteredAndSortedTestCases.length === 0 ? (
          <div className="empty-state">
            <p>没有找到匹配的测试用例</p>
            <button onClick={handleCreateTestCase} className="btn btn-primary">
              创建第一个测试用例
            </button>
          </div>
        ) : (
          filteredAndSortedTestCases.map(testCase => (
            <div
              key={testCase.id}
              className={`test-case-item ${selectedTestCase === testCase.id ? 'selected' : ''}`}
              onClick={() => onTestCaseSelect(testCase.id)}
            >
              <div className="test-case-header">
                <div className="test-case-title">
                  <span className="execution-status">
                    {getExecutionStatusIcon(testCase)}
                  </span>
                  <h4>{testCase.name}</h4>
                  <span className="category-badge">{testCase.category}</span>
                </div>
                
                <div className="test-case-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateTestCase(testCase.id);
                    }}
                    className="btn btn-sm"
                    title="复制"
                  >
                    📋
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTestCase(testCase.id);
                    }}
                    className="btn btn-sm btn-danger"
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="test-case-content">
                <p className="description">{testCase.description}</p>
                
                <div className="test-case-meta">
                  <div className="meta-item">
                    <span className="label">关联节点:</span>
                    <span className="value">{testCase.associatedNodes.length}</span>
                  </div>
                  
                  <div className="meta-item">
                    <span className="label">创建时间:</span>
                    <span className="value">
                      {new Date(testCase.metadata.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {testCase.execution.lastExecuted && (
                    <div className="meta-item">
                      <span className="label">最后执行:</span>
                      <span className="value">
                        {new Date(testCase.execution.lastExecuted).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                
                {testCase.tags.length > 0 && (
                  <div className="tags">
                    {testCase.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* 选中测试用例的详细信息 */}
      {selectedTestCase && (
        <TestCaseDetails
          testCaseId={selectedTestCase}
          onClose={() => onTestCaseSelect(null)}
          onTabChange={onTabChange}
        />
      )}
      
      {/* 创建测试用例表单 */}
      {showCreateForm && (
        <CreateTestCaseForm
          onClose={() => setShowCreateForm(false)}
          onCreated={(testCase) => {
            setShowCreateForm(false);
            onTestCaseSelect(testCase.id);
          }}
        />
      )}
    </div>
  );
};

/**
 * 测试用例详细信息组件
 */
const TestCaseDetails: React.FC<{
  testCaseId: string;
  onClose: () => void;
  onTabChange: (tab: string) => void;
}> = ({ testCaseId, onClose, onTabChange }) => {
  const testCase = useTestStore(state => 
    state.testCases.find((tc: TestCase) => tc.id === testCaseId)
  );
  
  if (!testCase) {
    return <div>测试用例未找到</div>;
  }
  
  return (
    <div className="test-case-details-modal">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{testCase.name}</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        
        <div className="modal-body">
          <div className="detail-section">
            <h4>基本信息</h4>
            <p><strong>描述:</strong> {testCase.description}</p>
            <p><strong>类别:</strong> {testCase.category}</p>
            <p><strong>创建者:</strong> {testCase.metadata.createdBy}</p>
            <p><strong>创建时间:</strong> {new Date(testCase.metadata.createdAt).toLocaleString()}</p>
          </div>
          
          <div className="detail-section">
            <h4>关联节点 ({testCase.associatedNodes.length})</h4>
            {testCase.associatedNodes.length > 0 ? (
              <ul>
                {testCase.associatedNodes.map(nodeId => (
                  <li key={nodeId}>{nodeId}</li>
                ))}
              </ul>
            ) : (
              <p>无关联节点</p>
            )}
          </div>
          
          <div className="detail-section">
            <h4>执行状态</h4>
            <p><strong>状态:</strong> {testCase.execution.status}</p>
            <p><strong>执行次数:</strong> {testCase.execution.attempts}</p>
            {testCase.execution.lastExecuted && (
              <p><strong>最后执行:</strong> {new Date(testCase.execution.lastExecuted).toLocaleString()}</p>
            )}
          </div>
          
          <div className="detail-section">
            <h4>标签</h4>
            <div className="tags">
              {testCase.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            onClick={() => {
              onTabChange('execution');
              onClose();
            }}
            className="btn btn-primary"
          >
            执行测试
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
 * 创建测试用例表单组件
 */
const CreateTestCaseForm: React.FC<{
  onClose: () => void;
  onCreated: (testCase: TestCase) => void;
}> = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    tags: '',
    captureTopology: true
  });
  
  const { selectedNodes } = useTopologyStore(state => ({
    selectedNodes: state.selectedNodes
  }));
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const testCase = TestCaseService.createTestCase({
      name: formData.name,
      description: formData.description,
      category: formData.category || 'general',
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      associatedNodes: selectedNodes,
      captureTopologySnapshot: formData.captureTopology
    });
    
    onCreated(testCase);
  };
  
  return (
    <div className="create-test-case-modal">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h3>创建测试用例</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="name">测试用例名称 *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="输入测试用例名称"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">描述</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述测试用例的目的和预期结果"
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="category">类别</label>
            <input
              type="text"
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="例如: unit, integration, system"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="tags">标签</label>
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="用逗号分隔多个标签"
            />
          </div>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.captureTopology}
                onChange={(e) => setFormData({ ...formData, captureTopology: e.target.checked })}
              />
              捕获当前拓扑快照
            </label>
          </div>
          
          {selectedNodes.length > 0 && (
            <div className="form-group">
              <label>关联节点 ({selectedNodes.length})</label>
              <div className="selected-nodes">
                {selectedNodes.map(nodeId => (
                  <span key={nodeId} className="node-tag">{nodeId}</span>
                ))}
              </div>
            </div>
          )}
          
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
