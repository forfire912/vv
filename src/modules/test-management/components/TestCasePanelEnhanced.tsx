/**
 * 增强版测试用例面板 - 支持完整的CRUD操作
 */

import React, { useState, useEffect } from 'react';
import TestCaseEditor from './TestCaseEditor';
import { testExecutionEngine, TestExecution } from '../core/executionEngine';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  steps: TestStep[];
  expectedResults: string;
  associatedNodes: string[];
  topologySnapshot?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TestStep {
  id: string;
  description: string;
  action: 'click' | 'input' | 'verify' | 'wait' | 'custom';
  target?: string;
  value?: string;
  expected?: string;
}

interface TestCasePanelEnhancedProps {
  onTestCaseUpdate?: (testCases: TestCase[]) => void;
  onExecutionStart?: (execution: TestExecution) => void;
}

const TestCasePanelEnhanced: React.FC<TestCasePanelEnhancedProps> = ({ 
  onTestCaseUpdate, 
  onExecutionStart 
}) => {
  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      id: '1',
      name: '基础连接测试',
      description: '测试基本的连接功能，确保设备能够正常连接',
      category: 'functional',
      tags: ['connection', 'basic'],
      steps: [
        {
          id: '1-1',
          description: '启动设备',
          action: 'click',
          target: 'power-button',
          expected: '设备正常启动'
        },
        {
          id: '1-2',
          description: '检查连接状态',
          action: 'verify',
          target: 'connection-indicator',
          expected: '显示连接成功'
        }
      ],
      expectedResults: '设备成功连接并显示正常状态',
      associatedNodes: ['device-1', 'connector-1'],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: '按钮响应测试',
      description: '测试按钮交互响应是否及时准确',
      category: 'usability',
      tags: ['button', 'interaction', 'ui'],
      steps: [
        {
          id: '2-1',
          description: '点击按钮',
          action: 'click',
          target: 'test-button',
          expected: '按钮状态改变'
        },
        {
          id: '2-2',
          description: '验证响应时间',
          action: 'verify',
          target: 'response-time',
          expected: '响应时间<100ms'
        }
      ],
      expectedResults: '按钮响应及时，状态正确',
      associatedNodes: ['button-1'],
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16')
    },
    {
      id: '3',
      name: '数据传输测试',
      description: '测试数据传输功能的准确性和完整性',
      category: 'integration',
      tags: ['data', 'transmission', 'integrity'],
      steps: [
        {
          id: '3-1',
          description: '发送测试数据',
          action: 'input',
          target: 'data-input',
          value: 'test-data-123',
          expected: '数据成功发送'
        },
        {
          id: '3-2',
          description: '验证接收数据',
          action: 'verify',
          target: 'data-output',
          expected: '接收数据与发送数据一致'
        }
      ],
      expectedResults: '数据传输准确无误',
      associatedNodes: ['transmitter-1', 'receiver-1'],
      createdAt: new Date('2024-01-17'),
      updatedAt: new Date('2024-01-17')
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'updatedAt'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | undefined>();
  
  const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(new Set());

  // 获取所有分类
  const categories = ['all', ...Array.from(new Set(testCases.map(tc => tc.category)))];
  
  // 获取所有标签
  const allTags = Array.from(new Set(testCases.flatMap(tc => tc.tags)));

  // 过滤和排序测试用例
  const filteredAndSortedTestCases = testCases
    .filter(testCase => {
      const matchesSearch = testCase.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           testCase.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || testCase.category === selectedCategory;
      const matchesTag = !selectedTag || testCase.tags.includes(selectedTag);
      
      return matchesSearch && matchesCategory && matchesTag;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'updatedAt':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // 更新父组件
  useEffect(() => {
    if (onTestCaseUpdate) {
      onTestCaseUpdate(testCases);
    }
  }, [testCases, onTestCaseUpdate]);

  // 新建测试用例
  const handleNewTestCase = () => {
    setEditingTestCase(undefined);
    setEditorOpen(true);
  };

  // 编辑测试用例
  const handleEditTestCase = (testCase: TestCase) => {
    setEditingTestCase(testCase);
    setEditorOpen(true);
  };

  // 保存测试用例
  const handleSaveTestCase = (testCase: TestCase) => {
    if (editingTestCase) {
      // 更新现有测试用例
      setTestCases(prev => prev.map(tc => tc.id === testCase.id ? testCase : tc));
    } else {
      // 添加新测试用例
      setTestCases(prev => [...prev, testCase]);
    }
    setEditorOpen(false);
    setEditingTestCase(undefined);
  };

  // 删除测试用例
  const handleDeleteTestCase = (id: string) => {
    setTestCases(prev => prev.filter(tc => tc.id !== id));
    setEditorOpen(false);
    setEditingTestCase(undefined);
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedTestCases.size > 0) {
      if (confirm(`确定要删除选中的 ${selectedTestCases.size} 个测试用例吗？`)) {
        setTestCases(prev => prev.filter(tc => !selectedTestCases.has(tc.id)));
        setSelectedTestCases(new Set());
      }
    }
  };

  // 选择/取消选择测试用例
  const handleSelectTestCase = (id: string, selected: boolean) => {
    setSelectedTestCases(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  // 全选/全不选
  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedTestCases(new Set(filteredAndSortedTestCases.map(tc => tc.id)));
    } else {
      setSelectedTestCases(new Set());
    }
  };

  // 运行测试用例
  const handleRunTestCase = async (testCase: TestCase) => {
    try {
      const execution = await testExecutionEngine.executeTestCase(testCase);
      if (onExecutionStart) {
        onExecutionStart(execution);
      }
      // 显示成功消息
      alert(`测试用例 "${testCase.name}" 已开始执行`);
    } catch (error) {
      alert(`启动测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 批量运行
  const handleBatchRun = async () => {
    if (selectedTestCases.size > 0) {
      const selectedTests = testCases.filter(tc => selectedTestCases.has(tc.id));
      
      try {
        for (const testCase of selectedTests) {
          const execution = await testExecutionEngine.executeTestCase(testCase);
          if (onExecutionStart) {
            onExecutionStart(execution);
          }
        }
        alert(`已启动 ${selectedTests.length} 个测试用例的执行`);
      } catch (error) {
        alert(`批量运行失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  };

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: Record<string, string> = {
      'functional': '功能测试',
      'integration': '集成测试',
      'performance': '性能测试',
      'security': '安全测试',
      'usability': '可用性测试'
    };
    return categoryMap[category] || category;
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
        <h3 style={{ margin: 0 }}>测试用例管理</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {selectedTestCases.size > 0 && (
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
                批量运行 ({selectedTestCases.size})
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
                批量删除 ({selectedTestCases.size})
              </button>
            </>
          )}
          <button
            onClick={handleNewTestCase}
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
            新建测试用例
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
          placeholder="搜索测试用例..."
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
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '4px 8px',
            backgroundColor: 'var(--vscode-editor-background)',
            color: 'var(--vscode-foreground)',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: '2px',
            fontSize: '12px'
          }}
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? '所有分类' : getCategoryDisplayName(category)}
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
          <option value="category-asc">分类A-Z</option>
          <option value="category-desc">分类Z-A</option>
        </select>
      </div>

      {/* 批量操作栏 */}
      {filteredAndSortedTestCases.length > 0 && (
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
              checked={selectedTestCases.size === filteredAndSortedTestCases.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            全选 ({filteredAndSortedTestCases.length})
          </label>
          {selectedTestCases.size > 0 && (
            <span style={{ color: 'var(--vscode-descriptionForeground)' }}>
              已选择 {selectedTestCases.size} 项
            </span>
          )}
        </div>
      )}

      {/* 测试用例列表 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filteredAndSortedTestCases.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--vscode-descriptionForeground)'
          }}>
            {testCases.length === 0 ? '暂无测试用例，点击"新建测试用例"开始创建' : '没有找到匹配的测试用例'}
          </div>
        ) : (
          filteredAndSortedTestCases.map(testCase => (
            <div
              key={testCase.id}
              style={{
                padding: '12px',
                marginBottom: '8px',
                border: '1px solid var(--vscode-panel-border)',
                borderRadius: '2px',
                backgroundColor: selectedTestCases.has(testCase.id) 
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
                  checked={selectedTestCases.has(testCase.id)}
                  onChange={(e) => handleSelectTestCase(testCase.id, e.target.checked)}
                  style={{ marginTop: '2px' }}
                />
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '4px'
                  }}>
                    <h4 style={{ margin: 0, fontSize: '14px' }}>{testCase.name}</h4>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => handleRunTestCase(testCase)}
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
                        运行
                      </button>
                      <button
                        onClick={() => handleEditTestCase(testCase)}
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
                    {testCase.description}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      padding: '2px 6px',
                      backgroundColor: 'var(--vscode-badge-background)',
                      color: 'var(--vscode-badge-foreground)',
                      borderRadius: '10px',
                      fontSize: '10px'
                    }}>
                      {getCategoryDisplayName(testCase.category)}
                    </span>
                    
                    {testCase.tags.map(tag => (
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
                    <span>{testCase.steps.length} 个步骤</span>
                    <span>更新于 {testCase.updatedAt.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 测试用例编辑器 */}
      <TestCaseEditor
        testCase={editingTestCase}
        isOpen={editorOpen}
        onSave={handleSaveTestCase}
        onCancel={() => {
          setEditorOpen(false);
          setEditingTestCase(undefined);
        }}
        onDelete={editingTestCase ? handleDeleteTestCase : undefined}
      />
    </div>
  );
};

export default TestCasePanelEnhanced;
