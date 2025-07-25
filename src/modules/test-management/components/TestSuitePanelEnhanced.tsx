/**
 * 增强版测试套件面板 - 支持完整的CRUD操作和套件执行
 */

import React, { useState, useEffect } from 'react';
import { testExecutionEngine, TestExecution, TestCase } from '../core/executionEngine';

interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCases: string[];
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number; // 分钟
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

interface TestSuiteEditorProps {
  testSuite?: TestSuite;
  isOpen: boolean;
  onSave: (testSuite: TestSuite) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  availableTestCases: TestCase[];
}

const TestSuiteEditor: React.FC<TestSuiteEditorProps> = ({
  testSuite,
  isOpen,
  onSave,
  onCancel,
  onDelete,
  availableTestCases
}) => {
  const [formData, setFormData] = useState<Partial<TestSuite>>({
    name: '',
    description: '',
    testCases: [],
    tags: [],
    priority: 'medium',
    estimatedDuration: 30
  });

  const [newTag, setNewTag] = useState('');
  const [selectedTestCaseId, setSelectedTestCaseId] = useState('');

  useEffect(() => {
    if (testSuite) {
      setFormData(testSuite);
    } else {
      setFormData({
        name: '',
        description: '',
        testCases: [],
        tags: [],
        priority: 'medium',
        estimatedDuration: 30
      });
    }
  }, [testSuite]);

  const handleInputChange = (field: keyof TestSuite, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const addTestCase = () => {
    if (selectedTestCaseId && !formData.testCases?.includes(selectedTestCaseId)) {
      setFormData(prev => ({
        ...prev,
        testCases: [...(prev.testCases || []), selectedTestCaseId]
      }));
      setSelectedTestCaseId('');
    }
  };

  const removeTestCase = (testCaseId: string) => {
    setFormData(prev => ({
      ...prev,
      testCases: prev.testCases?.filter(id => id !== testCaseId) || []
    }));
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      alert('请输入测试套件名称');
      return;
    }

    const now = new Date();
    const savedTestSuite: TestSuite = {
      id: testSuite?.id || Date.now().toString(),
      name: formData.name!,
      description: formData.description || '',
      testCases: formData.testCases || [],
      tags: formData.tags || [],
      priority: formData.priority || 'medium',
      estimatedDuration: formData.estimatedDuration || 30,
      createdAt: testSuite?.createdAt || now,
      updatedAt: now,
      createdBy: formData.createdBy || 'User'
    };

    onSave(savedTestSuite);
  };

  const handleDelete = () => {
    if (testSuite?.id && onDelete) {
      if (confirm(`确定要删除测试套件 "${testSuite.name}" 吗？`)) {
        onDelete(testSuite.id);
      }
    }
  };

  const getTestCaseName = (testCaseId: string) => {
    return availableTestCases.find(tc => tc.id === testCaseId)?.name || '未知测试用例';
  };

  const availableTestCasesFiltered = availableTestCases.filter(tc => 
    !formData.testCases?.includes(tc.id)
  );

  if (!isOpen) return null;

  return (
    <div className="test-modal-overlay">
      <div className="test-modal-content">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid var(--divider)',
          paddingBottom: '10px'
        }}>
          <h2 style={{ margin: 0, color: 'var(--text)' }}>
            {testSuite ? '编辑测试套件' : '新建测试套件'}
          </h2>
          <button 
            onClick={onCancel}
            className="close-button"
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* 基本信息 */}
          <div>
            <h3>基本信息</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                套件名称 *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="test-input"
                style={{ width: '100%' }}
                placeholder="输入测试套件名称"
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                优先级
              </label>
              <select
                value={formData.priority || 'medium'}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="test-input"
                style={{ width: '100%' }}
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="critical">紧急</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                预估执行时间（分钟）
              </label>
              <input
                type="number"
                value={formData.estimatedDuration || 30}
                onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value) || 30)}
                style={{
                  width: '100%',
                  padding: '6px',
                  backgroundColor: 'var(--vscode-input-background)',
                  color: 'var(--vscode-input-foreground)',
                  border: '1px solid var(--vscode-input-border)',
                  borderRadius: '2px'
                }}
                min="1"
                max="999"
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                描述
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                style={{
                  width: '100%',
                  height: '80px',
                  padding: '6px',
                  backgroundColor: 'var(--vscode-input-background)',
                  color: 'var(--vscode-input-foreground)',
                  border: '1px solid var(--vscode-input-border)',
                  borderRadius: '2px',
                  resize: 'vertical'
                }}
                placeholder="输入测试套件描述"
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                标签
              </label>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    backgroundColor: 'var(--vscode-input-background)',
                    color: 'var(--vscode-input-foreground)',
                    border: '1px solid var(--vscode-input-border)',
                    borderRadius: '2px'
                  }}
                  placeholder="输入标签"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <button
                  onClick={addTag}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'var(--vscode-button-background)',
                    color: 'var(--vscode-button-foreground)',
                    border: '1px solid var(--vscode-button-border)',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                >
                  添加
                </button>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {formData.tags?.map(tag => (
                  <span
                    key={tag}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: 'var(--vscode-badge-background)',
                      color: 'var(--vscode-badge-foreground)',
                      borderRadius: '10px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 测试用例管理 */}
          <div>
            <h3>测试用例管理</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                添加测试用例
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <select
                  value={selectedTestCaseId}
                  onChange={(e) => setSelectedTestCaseId(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    backgroundColor: 'var(--vscode-input-background)',
                    color: 'var(--vscode-input-foreground)',
                    border: '1px solid var(--vscode-input-border)',
                    borderRadius: '2px'
                  }}
                >
                  <option value="">选择测试用例</option>
                  {availableTestCasesFiltered.map(tc => (
                    <option key={tc.id} value={tc.id}>{tc.name}</option>
                  ))}
                </select>
                <button
                  onClick={addTestCase}
                  disabled={!selectedTestCaseId}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: selectedTestCaseId 
                      ? 'var(--vscode-button-background)' 
                      : 'var(--vscode-button-secondaryBackground)',
                    color: selectedTestCaseId 
                      ? 'var(--vscode-button-foreground)' 
                      : 'var(--vscode-button-secondaryForeground)',
                    border: '1px solid var(--vscode-button-border)',
                    borderRadius: '2px',
                    cursor: selectedTestCaseId ? 'pointer' : 'not-allowed'
                  }}
                >
                  添加
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                已选择的测试用例 ({formData.testCases?.length || 0})
              </label>
              <div style={{ 
                maxHeight: '300px', 
                overflow: 'auto',
                border: '1px solid var(--vscode-input-border)',
                borderRadius: '2px',
                backgroundColor: 'var(--vscode-input-background)'
              }}>
                {formData.testCases && formData.testCases.length > 0 ? (
                  formData.testCases.map((testCaseId, index) => (
                    <div
                      key={testCaseId}
                      style={{
                        padding: '8px',
                        borderBottom: index < formData.testCases!.length - 1 
                          ? '1px solid var(--vscode-panel-border)' 
                          : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                          {index + 1}. {getTestCaseName(testCaseId)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--vscode-descriptionForeground)' }}>
                          ID: {testCaseId}
                        </div>
                      </div>
                      <button
                        onClick={() => removeTestCase(testCaseId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--vscode-errorForeground)',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        删除
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: 'var(--vscode-descriptionForeground)',
                    fontSize: '12px'
                  }}>
                    暂无测试用例
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid var(--vscode-panel-border)'
        }}>
          <div>
            {testSuite && onDelete && (
              <button
                onClick={handleDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--vscode-errorBackground)',
                  color: 'var(--vscode-errorForeground)',
                  border: '1px solid var(--vscode-button-border)',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
              >
                删除测试套件
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--vscode-button-secondaryBackground)',
                color: 'var(--vscode-button-secondaryForeground)',
                border: '1px solid var(--vscode-button-border)',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--vscode-button-background)',
                color: 'var(--vscode-button-foreground)',
                border: '1px solid var(--vscode-button-border)',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              {testSuite ? '保存更改' : '创建测试套件'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TestSuitePanelEnhancedProps {
  onTestSuiteUpdate?: (testSuites: TestSuite[]) => void;
  onExecutionStart?: (execution: TestExecution) => void;
  availableTestCases?: TestCase[];
}

const TestSuitePanelEnhanced: React.FC<TestSuitePanelEnhancedProps> = ({ 
  onTestSuiteUpdate, 
  onExecutionStart,
  availableTestCases = []
}) => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      id: '1',
      name: '基础功能测试套件',
      description: '包含基础功能的完整测试流程，确保核心功能正常工作',
      testCases: ['1', '2'],
      tags: ['smoke', 'basic', 'core'],
      priority: 'high',
      estimatedDuration: 45,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      createdBy: 'Admin'
    },
    {
      id: '2',
      name: '用户交互测试套件',
      description: '专注于用户界面交互和响应性测试',
      testCases: ['2', '3'],
      tags: ['ui', 'interaction', 'ux'],
      priority: 'medium',
      estimatedDuration: 30,
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16'),
      createdBy: 'User'
    },
    {
      id: '3',
      name: '性能压力测试套件',
      description: '测试系统在高负载情况下的稳定性和性能表现',
      testCases: ['1', '3'],
      tags: ['performance', 'stress', 'load'],
      priority: 'critical',
      estimatedDuration: 120,
      createdAt: new Date('2024-01-17'),
      updatedAt: new Date('2024-01-17'),
      createdBy: 'QA Team'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'priority' | 'updatedAt' | 'estimatedDuration'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTestSuite, setEditingTestSuite] = useState<TestSuite | undefined>();
  
  const [selectedTestSuites, setSelectedTestSuites] = useState<Set<string>>(new Set());

  // 获取所有优先级
  const priorities = ['all', 'low', 'medium', 'high', 'critical'];
  
  // 获取所有标签
  const allTags = Array.from(new Set(testSuites.flatMap(ts => ts.tags)));

  // 过滤和排序测试套件
  const filteredAndSortedTestSuites = testSuites
    .filter(testSuite => {
      const matchesSearch = testSuite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           testSuite.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = selectedPriority === 'all' || testSuite.priority === selectedPriority;
      const matchesTag = !selectedTag || testSuite.tags.includes(selectedTag);
      
      return matchesSearch && matchesPriority && matchesTag;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'priority':
          const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'estimatedDuration':
          comparison = a.estimatedDuration - b.estimatedDuration;
          break;
        case 'updatedAt':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // 更新父组件
  useEffect(() => {
    if (onTestSuiteUpdate) {
      onTestSuiteUpdate(testSuites);
    }
  }, [testSuites, onTestSuiteUpdate]);

  // 新建测试套件
  const handleNewTestSuite = () => {
    setEditingTestSuite(undefined);
    setEditorOpen(true);
  };

  // 编辑测试套件
  const handleEditTestSuite = (testSuite: TestSuite) => {
    setEditingTestSuite(testSuite);
    setEditorOpen(true);
  };

  // 保存测试套件
  const handleSaveTestSuite = (testSuite: TestSuite) => {
    if (editingTestSuite) {
      // 更新现有测试套件
      setTestSuites(prev => prev.map(ts => ts.id === testSuite.id ? testSuite : ts));
    } else {
      // 添加新测试套件
      setTestSuites(prev => [...prev, testSuite]);
    }
    setEditorOpen(false);
    setEditingTestSuite(undefined);
  };

  // 删除测试套件
  const handleDeleteTestSuite = (id: string) => {
    setTestSuites(prev => prev.filter(ts => ts.id !== id));
    setEditorOpen(false);
    setEditingTestSuite(undefined);
  };

  // 运行测试套件
  const handleRunTestSuite = async (testSuite: TestSuite) => {
    try {
      const execution = await testExecutionEngine.executeTestSuite(testSuite, availableTestCases);
      if (onExecutionStart) {
        onExecutionStart(execution);
      }
      alert(`测试套件 "${testSuite.name}" 已开始执行`);
    } catch (error) {
      alert(`启动测试套件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 批量操作
  const handleSelectTestSuite = (id: string, selected: boolean) => {
    setSelectedTestSuites(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedTestSuites(new Set(filteredAndSortedTestSuites.map(ts => ts.id)));
    } else {
      setSelectedTestSuites(new Set());
    }
  };

  const handleBatchRun = async () => {
    if (selectedTestSuites.size > 0) {
      const selectedSuites = testSuites.filter(ts => selectedTestSuites.has(ts.id));
      
      try {
        for (const testSuite of selectedSuites) {
          const execution = await testExecutionEngine.executeTestSuite(testSuite, availableTestCases);
          if (onExecutionStart) {
            onExecutionStart(execution);
          }
        }
        alert(`已启动 ${selectedSuites.length} 个测试套件的执行`);
      } catch (error) {
        alert(`批量运行失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  };

  const handleBatchDelete = () => {
    if (selectedTestSuites.size > 0) {
      if (confirm(`确定要删除选中的 ${selectedTestSuites.size} 个测试套件吗？`)) {
        setTestSuites(prev => prev.filter(ts => !selectedTestSuites.has(ts.id)));
        setSelectedTestSuites(new Set());
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#2196F3';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'critical': return '紧急';
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return priority;
    }
  };

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
        <h3 style={{ margin: 0 }}>测试套件管理</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {selectedTestSuites.size > 0 && (
            <>
              <button
                onClick={handleBatchRun}
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
                批量运行 ({selectedTestSuites.size})
              </button>
              <button
                onClick={handleBatchDelete}
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
                批量删除 ({selectedTestSuites.size})
              </button>
            </>
          )}
          <button
            onClick={handleNewTestSuite}
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
            新建测试套件
          </button>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '8px',
        marginBottom: '12px',
        padding: '8px',
        backgroundColor: 'var(--vscode-input-background)',
        borderRadius: '2px'
      }}>
        <input
          type="text"
          placeholder="搜索测试套件..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '4px 8px',
            backgroundColor: 'var(--vscode-editor-background)',
            color: 'var(--vscode-foreground)',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: '2px',
            fontSize: '12px'
          }}
        />
        
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          style={{
            padding: '4px 8px',
            backgroundColor: 'var(--vscode-editor-background)',
            color: 'var(--vscode-foreground)',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: '2px',
            fontSize: '12px'
          }}
        >
          {priorities.map(priority => (
            <option key={priority} value={priority}>
              {priority === 'all' ? '所有优先级' : getPriorityText(priority)}
            </option>
          ))}
        </select>

        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          style={{
            padding: '4px 8px',
            backgroundColor: 'var(--vscode-editor-background)',
            color: 'var(--vscode-foreground)',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: '2px',
            fontSize: '12px'
          }}
        >
          <option value="">所有标签</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortBy(field as any);
            setSortOrder(order as any);
          }}
          style={{
            padding: '4px 8px',
            backgroundColor: 'var(--vscode-editor-background)',
            color: 'var(--vscode-foreground)',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: '2px',
            fontSize: '12px'
          }}
        >
          <option value="updatedAt-desc">最近更新</option>
          <option value="updatedAt-asc">最早更新</option>
          <option value="name-asc">名称A-Z</option>
          <option value="name-desc">名称Z-A</option>
          <option value="priority-desc">优先级高-低</option>
          <option value="priority-asc">优先级低-高</option>
          <option value="estimatedDuration-asc">预估时间短-长</option>
          <option value="estimatedDuration-desc">预估时间长-短</option>
        </select>
      </div>

      {/* 批量操作栏 */}
      {filteredAndSortedTestSuites.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
          padding: '4px 8px',
          fontSize: '12px',
          backgroundColor: 'var(--vscode-input-background)',
          borderRadius: '2px'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={selectedTestSuites.size === filteredAndSortedTestSuites.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            全选 ({filteredAndSortedTestSuites.length})
          </label>
          {selectedTestSuites.size > 0 && (
            <span style={{ color: 'var(--vscode-descriptionForeground)' }}>
              已选择 {selectedTestSuites.size} 项
            </span>
          )}
        </div>
      )}

      {/* 测试套件列表 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filteredAndSortedTestSuites.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--vscode-descriptionForeground)'
          }}>
            {testSuites.length === 0 ? '暂无测试套件，点击"新建测试套件"开始创建' : '没有找到匹配的测试套件'}
          </div>
        ) : (
          filteredAndSortedTestSuites.map(testSuite => (
            <div
              key={testSuite.id}
              style={{
                padding: '12px',
                marginBottom: '8px',
                border: '1px solid var(--vscode-panel-border)',
                borderRadius: '2px',
                backgroundColor: selectedTestSuites.has(testSuite.id) 
                  ? 'var(--vscode-list-hoverBackground)' 
                  : 'var(--vscode-input-background)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <input
                  type="checkbox"
                  checked={selectedTestSuites.has(testSuite.id)}
                  onChange={(e) => handleSelectTestSuite(testSuite.id, e.target.checked)}
                  style={{ marginTop: '2px' }}
                />
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '4px'
                  }}>
                    <h4 style={{ margin: 0, fontSize: '14px' }}>{testSuite.name}</h4>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => handleRunTestSuite(testSuite)}
                        style={{
                          padding: '2px 6px',
                          fontSize: '11px',
                          backgroundColor: 'var(--vscode-button-background)',
                          color: 'var(--vscode-button-foreground)',
                          border: '1px solid var(--vscode-button-border)',
                          borderRadius: '2px',
                          cursor: 'pointer'
                        }}
                      >
                        运行套件
                      </button>
                      <button
                        onClick={() => handleEditTestSuite(testSuite)}
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
                        编辑
                      </button>
                    </div>
                  </div>
                  
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '12px', 
                    color: 'var(--vscode-descriptionForeground)' 
                  }}>
                    {testSuite.description}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      padding: '2px 6px',
                      backgroundColor: getPriorityColor(testSuite.priority),
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '10px'
                    }}>
                      {getPriorityText(testSuite.priority)}
                    </span>
                    
                    <span style={{
                      padding: '2px 6px',
                      backgroundColor: 'var(--vscode-badge-background)',
                      color: 'var(--vscode-badge-foreground)',
                      borderRadius: '10px',
                      fontSize: '10px'
                    }}>
                      {testSuite.estimatedDuration}分钟
                    </span>
                    
                    {testSuite.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '2px 6px',
                          backgroundColor: 'var(--vscode-button-secondaryBackground)',
                          color: 'var(--vscode-button-secondaryForeground)',
                          borderRadius: '10px',
                          fontSize: '10px'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                    color: 'var(--vscode-descriptionForeground)'
                  }}>
                    <span>{testSuite.testCases.length} 个测试用例</span>
                    <span>更新于 {testSuite.updatedAt.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 测试套件编辑器 */}
      <TestSuiteEditor
        testSuite={editingTestSuite}
        isOpen={editorOpen}
        onSave={handleSaveTestSuite}
        onCancel={() => {
          setEditorOpen(false);
          setEditingTestSuite(undefined);
        }}
        onDelete={editingTestSuite ? handleDeleteTestSuite : undefined}
        availableTestCases={availableTestCases}
      />
    </div>
  );
};

export default TestSuitePanelEnhanced;
