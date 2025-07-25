/**
 * 测试用例编辑器 - 支持完整的CRUD操作
 */

import React, { useState, useEffect } from 'react';

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

interface TestCaseEditorProps {
  testCase?: TestCase;
  isOpen: boolean;
  onSave: (testCase: TestCase) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

const TestCaseEditor: React.FC<TestCaseEditorProps> = ({
  testCase,
  isOpen,
  onSave,
  onCancel,
  onDelete
}) => {
  const [formData, setFormData] = useState<Partial<TestCase>>({
    name: '',
    description: '',
    category: 'functional',
    tags: [],
    steps: [],
    expectedResults: '',
    associatedNodes: []
  });

  const [currentStep, setCurrentStep] = useState<Partial<TestStep>>({
    description: '',
    action: 'click',
    target: '',
    value: '',
    expected: ''
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (testCase) {
      setFormData(testCase);
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'functional',
        tags: [],
        steps: [],
        expectedResults: '',
        associatedNodes: []
      });
    }
  }, [testCase]);

  const handleInputChange = (field: keyof TestCase, value: any) => {
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

  const addStep = () => {
    if (currentStep.description?.trim()) {
      const newStep: TestStep = {
        id: Date.now().toString(),
        description: currentStep.description,
        action: currentStep.action || 'click',
        target: currentStep.target,
        value: currentStep.value,
        expected: currentStep.expected
      };
      
      setFormData(prev => ({
        ...prev,
        steps: [...(prev.steps || []), newStep]
      }));
      
      setCurrentStep({
        description: '',
        action: 'click',
        target: '',
        value: '',
        expected: ''
      });
    }
  };

  const removeStep = (stepId: string) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.filter(step => step.id !== stepId) || []
    }));
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      alert('请输入测试用例名称');
      return;
    }

    const now = new Date();
    const savedTestCase: TestCase = {
      id: testCase?.id || Date.now().toString(),
      name: formData.name!,
      description: formData.description || '',
      category: formData.category || 'functional',
      tags: formData.tags || [],
      steps: formData.steps || [],
      expectedResults: formData.expectedResults || '',
      associatedNodes: formData.associatedNodes || [],
      topologySnapshot: formData.topologySnapshot,
      createdAt: testCase?.createdAt || now,
      updatedAt: now
    };

    onSave(savedTestCase);
  };

  const handleDelete = () => {
    if (testCase?.id && onDelete) {
      if (confirm(`确定要删除测试用例 "${testCase.name}" 吗？`)) {
        onDelete(testCase.id);
      }
    }
  };

  if (!isOpen) return null;

  return (
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
        maxWidth: '800px',
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
          <h2 style={{ margin: 0, color: 'var(--vscode-foreground)' }}>
            {testCase ? '编辑测试用例' : '新建测试用例'}
          </h2>
          <button 
            onClick={onCancel}
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
          {/* 基本信息 */}
          <div>
            <h3>基本信息</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                名称 *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px',
                  backgroundColor: 'var(--vscode-input-background)',
                  color: 'var(--vscode-input-foreground)',
                  border: '1px solid var(--vscode-input-border)',
                  borderRadius: '2px'
                }}
                placeholder="输入测试用例名称"
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                分类
              </label>
              <select
                value={formData.category || 'functional'}
                onChange={(e) => handleInputChange('category', e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px',
                  backgroundColor: 'var(--vscode-input-background)',
                  color: 'var(--vscode-input-foreground)',
                  border: '1px solid var(--vscode-input-border)',
                  borderRadius: '2px'
                }}
              >
                <option value="functional">功能测试</option>
                <option value="integration">集成测试</option>
                <option value="performance">性能测试</option>
                <option value="security">安全测试</option>
                <option value="usability">可用性测试</option>
              </select>
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
                placeholder="输入测试用例描述"
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

          {/* 测试步骤 */}
          <div>
            <h3>测试步骤</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={currentStep.description || ''}
                  onChange={(e) => setCurrentStep(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    padding: '6px',
                    backgroundColor: 'var(--vscode-input-background)',
                    color: 'var(--vscode-input-foreground)',
                    border: '1px solid var(--vscode-input-border)',
                    borderRadius: '2px'
                  }}
                  placeholder="输入步骤描述"
                />
                <select
                  value={currentStep.action || 'click'}
                  onChange={(e) => setCurrentStep(prev => ({ ...prev, action: e.target.value as any }))}
                  style={{
                    padding: '6px',
                    backgroundColor: 'var(--vscode-input-background)',
                    color: 'var(--vscode-input-foreground)',
                    border: '1px solid var(--vscode-input-border)',
                    borderRadius: '2px'
                  }}
                >
                  <option value="click">点击</option>
                  <option value="input">输入</option>
                  <option value="verify">验证</option>
                  <option value="wait">等待</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={currentStep.target || ''}
                  onChange={(e) => setCurrentStep(prev => ({ ...prev, target: e.target.value }))}
                  style={{
                    padding: '6px',
                    backgroundColor: 'var(--vscode-input-background)',
                    color: 'var(--vscode-input-foreground)',
                    border: '1px solid var(--vscode-input-border)',
                    borderRadius: '2px'
                  }}
                  placeholder="目标对象"
                />
                <input
                  type="text"
                  value={currentStep.value || ''}
                  onChange={(e) => setCurrentStep(prev => ({ ...prev, value: e.target.value }))}
                  style={{
                    padding: '6px',
                    backgroundColor: 'var(--vscode-input-background)',
                    color: 'var(--vscode-input-foreground)',
                    border: '1px solid var(--vscode-input-border)',
                    borderRadius: '2px'
                  }}
                  placeholder="输入值"
                />
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={currentStep.expected || ''}
                  onChange={(e) => setCurrentStep(prev => ({ ...prev, expected: e.target.value }))}
                  style={{
                    flex: 1,
                    padding: '6px',
                    backgroundColor: 'var(--vscode-input-background)',
                    color: 'var(--vscode-input-foreground)',
                    border: '1px solid var(--vscode-input-border)',
                    borderRadius: '2px'
                  }}
                  placeholder="期望结果"
                />
                <button
                  onClick={addStep}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'var(--vscode-button-background)',
                    color: 'var(--vscode-button-foreground)',
                    border: '1px solid var(--vscode-button-border)',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                >
                  添加步骤
                </button>
              </div>
            </div>

            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              {formData.steps?.map((step, index) => (
                <div
                  key={step.id}
                  style={{
                    padding: '8px',
                    marginBottom: '4px',
                    backgroundColor: 'var(--vscode-input-background)',
                    border: '1px solid var(--vscode-input-border)',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                        {index + 1}. {step.description}
                      </div>
                      <div style={{ color: 'var(--vscode-descriptionForeground)' }}>
                        {step.action} {step.target && `→ ${step.target}`} {step.value && `(${step.value})`}
                      </div>
                      {step.expected && (
                        <div style={{ color: 'var(--vscode-descriptionForeground)', fontStyle: 'italic' }}>
                          期望: {step.expected}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeStep(step.id)}
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
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 预期结果 */}
        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            整体预期结果
          </label>
          <textarea
            value={formData.expectedResults || ''}
            onChange={(e) => handleInputChange('expectedResults', e.target.value)}
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
            placeholder="描述测试用例的整体预期结果"
          />
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
            {testCase && onDelete && (
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
                删除测试用例
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
              {testCase ? '保存更改' : '创建测试用例'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCaseEditor;
