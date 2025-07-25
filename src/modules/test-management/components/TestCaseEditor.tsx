/**
 * 测试用例编辑器 - 支持完整的CRUD操作和激励关联
 */

import React, { useState, useEffect } from 'react';
import { TestCase as FullTestCase, StimulusReference, TestExecutionStatus } from '../types';
import StimulusSelector from './StimulusSelector';

// 简化接口用于编辑器状态管理
interface TestCaseFormData {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  steps: TestStep[];
  expectedResults: string;
  associatedNodes: string[];
  functionTreePath: string;
  requirements: string[];
  stimuli: StimulusReference[];  // 关联的激励
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
  testCase?: FullTestCase;
  isOpen: boolean;
  onSave: (testCase: FullTestCase) => void;
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
  const [formData, setFormData] = useState<Partial<TestCaseFormData>>({
    name: '',
    description: '',
    category: 'functional',
    tags: [],
    steps: [],
    expectedResults: '',
    associatedNodes: [],
    functionTreePath: '',
    requirements: [],
    stimuli: []
  });

  const [currentStep, setCurrentStep] = useState<Partial<TestStep>>({
    description: '',
    action: 'click',
    target: '',
    value: '',
    expected: ''
  });

  const [newTag, setNewTag] = useState('');
  const [showStimulusSelector, setShowStimulusSelector] = useState(false);

  useEffect(() => {
    if (testCase) {
      setFormData({
        id: testCase.id,
        name: testCase.name,
        description: testCase.description,
        category: testCase.category,
        tags: testCase.tags,
        steps: [], // 暂时简化，后续可以从testConfiguration中提取
        expectedResults: '', // 暂时简化
        associatedNodes: testCase.associatedNodes,
        functionTreePath: testCase.functionTreePath,
        requirements: testCase.requirements,
        stimuli: testCase.testConfiguration.stimuli
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'functional',
        tags: [],
        steps: [],
        expectedResults: '',
        associatedNodes: [],
        functionTreePath: '',
        requirements: [],
        stimuli: []
      });
    }
  }, [testCase]);

  const handleInputChange = (field: keyof TestCaseFormData, value: any) => {
    setFormData((prev: Partial<TestCaseFormData>) => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData((prev: Partial<TestCaseFormData>) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev: Partial<TestCaseFormData>) => ({
      ...prev,
      tags: prev.tags?.filter((tag: string) => tag !== tagToRemove) || []
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
      
      setFormData((prev: Partial<TestCaseFormData>) => ({
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
    setFormData((prev: Partial<TestCaseFormData>) => ({
      ...prev,
      steps: prev.steps?.filter((step: TestStep) => step.id !== stepId) || []
    }));
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      alert('请输入测试用例名称');
      return;
    }

    const now = new Date();
    const savedTestCase: FullTestCase = {
      id: testCase?.id || Date.now().toString(),
      name: formData.name!,
      description: formData.description || '',
      category: formData.category || 'functional',
      tags: formData.tags || [],
      associatedNodes: formData.associatedNodes || [],
      functionTreePath: formData.functionTreePath || '',
      requirements: formData.requirements || [],
      
      // 测试配置
      testConfiguration: {
        topology: {
          nodeIds: formData.associatedNodes || [],
          connectionIds: [],
          dynamicCapture: true
        },
        stimuli: formData.stimuli || [],
        environment: {
          name: 'default',
          version: '1.0.0',
          variables: {},
          constraints: []
        },
        expectedResults: {
          outputs: [],
          behaviors: [],
          performance: {}
        }
      },
      
      // 执行信息
      execution: {
        status: 'pending' as TestExecutionStatus,
        attempts: 0
      },
      
      // 元数据
      metadata: {
        createdAt: testCase?.metadata?.createdAt || now,
        createdBy: testCase?.metadata?.createdBy || 'user',
        updatedAt: now,
        updatedBy: 'user',
        version: '1.0.0'
      }
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
    <div className="test-modal-overlay">
      <div className="test-modal-content" style={{ maxWidth: '1000px', width: '90%' }}>
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>
            {testCase ? '编辑测试用例' : '新建测试用例'}
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
                名称 *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="test-input"
                style={{ width: '100%' }}
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
                className="test-input"
                style={{ width: '100%' }}
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
                className="test-input"
                style={{
                  width: '100%',
                  height: '80px',
                  resize: 'vertical'
                }}
                placeholder="输入测试用例描述"
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                功能树路径
              </label>
              <input
                type="text"
                value={formData.functionTreePath || ''}
                onChange={(e) => handleInputChange('functionTreePath', e.target.value)}
                className="test-input"
                style={{ width: '100%' }}
                placeholder="例如: /系统功能/用户管理/登录验证"
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
                  className="test-input"
                  style={{ flex: 1 }}
                  placeholder="输入标签"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <button
                  onClick={addTag}
                  className="test-button"
                >
                  添加
                </button>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {formData.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: 'var(--node-selected)',
                      color: 'white',
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
                  className="test-input"
                  placeholder="输入步骤描述"
                />
                <select
                  value={currentStep.action || 'click'}
                  onChange={(e) => setCurrentStep(prev => ({ ...prev, action: e.target.value as any }))}
                  className="test-input"
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
                  className="test-input"
                  placeholder="目标对象"
                />
                <input
                  type="text"
                  value={currentStep.value || ''}
                  onChange={(e) => setCurrentStep(prev => ({ ...prev, value: e.target.value }))}
                  className="test-input"
                  placeholder="输入值"
                />
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={currentStep.expected || ''}
                  onChange={(e) => setCurrentStep(prev => ({ ...prev, expected: e.target.value }))}
                  className="test-input"
                  style={{ flex: 1 }}
                  placeholder="期望结果"
                />
                <button
                  onClick={addStep}
                  className="test-button"
                >
                  添加步骤
                </button>
              </div>
            </div>

            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              {formData.steps?.map((step: TestStep, index: number) => (
                <div
                  key={step.id}
                  style={{
                    padding: '8px',
                    marginBottom: '4px',
                    backgroundColor: 'var(--palette-bg)',
                    border: '1px solid var(--divider)',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                        {index + 1}. {step.description}
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        {step.action} {step.target && `→ ${step.target}`} {step.value && `(${step.value})`}
                      </div>
                      {step.expected && (
                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          期望: {step.expected}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeStep(step.id)}
                      className="test-button-danger"
                      style={{ fontSize: '12px', padding: '2px 6px' }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 激励配置区域 */}
        <div style={{ marginTop: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h3 style={{ margin: 0 }}>测试激励配置</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                已选择 {formData.stimuli?.length || 0} 个激励
              </span>
              <button
                onClick={() => setShowStimulusSelector(!showStimulusSelector)}
                className="test-button-secondary"
              >
                {showStimulusSelector ? '隐藏选择器' : '选择激励'}
              </button>
            </div>
          </div>

          {/* 已选择的激励预览 */}
          {formData.stimuli && formData.stimuli.length > 0 && (
            <div style={{
              marginBottom: '12px',
              padding: '8px',
              backgroundColor: 'var(--palette-bg)',
              border: '1px solid var(--divider)',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
                已配置的激励:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {formData.stimuli.map((stimulusRef: StimulusReference, index: number) => (
                  <span
                    key={`${stimulusRef.stimulusId}-${index}`}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: stimulusRef.enabled ? 'var(--node-selected)' : 'var(--text-muted)',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {stimulusRef.stimulusId}
                    {!stimulusRef.enabled && ' (禁用)'}
                    <button
                      onClick={() => {
                        const updatedStimuli = formData.stimuli?.filter((_, i) => i !== index) || [];
                        handleInputChange('stimuli', updatedStimuli);
                      }}
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
          )}

          {/* 激励选择器 */}
          {showStimulusSelector && (
            <StimulusSelector
              selectedStimuli={formData.stimuli || []}
              onStimuliChange={(stimuli) => handleInputChange('stimuli', stimuli)}
              associatedComponents={formData.associatedNodes || []}
            />
          )}
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
