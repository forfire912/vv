/**
 * 激励选择器组件 - 支持按组件过滤和多选激励
 */

import React, { useState, useMemo } from 'react';
import { 
  Stimulus, 
  StimulusParameter,
  mockStimuli, 
  componentTypes, 
  stimulusCategories,
  filterStimulusByComponent,
  filterStimulusByCategory,
  searchStimuli 
} from '../data/stimulusData';
import { StimulusReference } from '../types';

interface StimulusSelectorProps {
  selectedStimuli: StimulusReference[];
  onStimuliChange: (stimuli: StimulusReference[]) => void;
  associatedComponents?: string[];  // 关联的组件，用于过滤
}

const StimulusSelector: React.FC<StimulusSelectorProps> = ({
  selectedStimuli,
  onStimuliChange,
  associatedComponents = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('');
  const [showParameterEditor, setShowParameterEditor] = useState<string | null>(null);

  // 过滤激励
  const filteredStimuli = useMemo(() => {
    let stimuli = mockStimuli;

    // 按组件过滤
    if (selectedComponent) {
      stimuli = filterStimulusByComponent(selectedComponent);
    } else if (associatedComponents.length > 0) {
      // 如果有关联组件，显示所有相关激励
      stimuli = mockStimuli.filter(stimulus =>
        stimulus.associatedComponents.some(comp =>
          associatedComponents.includes(comp)
        )
      );
    }

    // 按分类过滤
    if (selectedCategory) {
      stimuli = stimuli.filter(stimulus => stimulus.category === selectedCategory);
    }

    // 按搜索词过滤
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      stimuli = stimuli.filter(stimulus =>
        stimulus.name.toLowerCase().includes(term) ||
        stimulus.description.toLowerCase().includes(term)
      );
    }

    return stimuli;
  }, [searchTerm, selectedCategory, selectedComponent, associatedComponents]);

  // 检查激励是否被选中
  const isStimulusSelected = (stimulusId: string): boolean => {
    return selectedStimuli.some(ref => ref.stimulusId === stimulusId);
  };

  // 获取选中的激励引用
  const getStimulusReference = (stimulusId: string): StimulusReference | undefined => {
    return selectedStimuli.find(ref => ref.stimulusId === stimulusId);
  };

  // 切换激励选择
  const toggleStimulus = (stimulus: Stimulus) => {
    const isSelected = isStimulusSelected(stimulus.id);
    
    if (isSelected) {
      // 移除激励
      const updatedStimuli = selectedStimuli.filter(ref => ref.stimulusId !== stimulus.id);
      onStimuliChange(updatedStimuli);
    } else {
      // 添加激励
      const newReference: StimulusReference = {
        stimulusId: stimulus.id,
        enabled: true,
        parameters: {}
      };
      onStimuliChange([...selectedStimuli, newReference]);
    }
  };

  // 更新激励参数
  const updateStimulusParameters = (stimulusId: string, parameters: Record<string, any>) => {
    const updatedStimuli = selectedStimuli.map(ref =>
      ref.stimulusId === stimulusId
        ? { ...ref, parameters }
        : ref
    );
    onStimuliChange(updatedStimuli);
  };

  // 切换激励启用状态
  const toggleStimulusEnabled = (stimulusId: string) => {
    const updatedStimuli = selectedStimuli.map(ref =>
      ref.stimulusId === stimulusId
        ? { ...ref, enabled: !ref.enabled }
        : ref
    );
    onStimuliChange(updatedStimuli);
  };

  return (
    <div className="stimulus-selector">
      {/* 过滤控件 */}
      <div style={{
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: 'var(--bg)',
        border: '1px solid var(--divider)',
        borderRadius: '4px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <input
            type="text"
            placeholder="搜索激励..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '6px 8px',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--divider)',
              borderRadius: '2px',
              fontSize: '13px'
            }}
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '6px 8px',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--divider)',
              borderRadius: '2px',
              fontSize: '13px'
            }}
          >
            <option value="">所有分类</option>
            {stimulusCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={selectedComponent}
            onChange={(e) => setSelectedComponent(e.target.value)}
            style={{
              padding: '6px 8px',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--divider)',
              borderRadius: '2px',
              fontSize: '13px'
            }}
          >
            <option value="">所有组件</option>
            {componentTypes.map(component => (
              <option key={component} value={component}>{component}</option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          找到 {filteredStimuli.length} 个激励，已选择 {selectedStimuli.length} 个
        </div>
      </div>

      {/* 激励列表 */}
      <div style={{
        maxHeight: '400px',
        overflow: 'auto',
        border: '1px solid var(--divider)',
        borderRadius: '4px'
      }}>
        {filteredStimuli.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            没有找到匹配的激励
          </div>
        ) : (
          filteredStimuli.map(stimulus => {
            const isSelected = isStimulusSelected(stimulus.id);
            const stimulusRef = getStimulusReference(stimulus.id);
            
            return (
              <div
                key={stimulus.id}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid var(--divider)',
                  backgroundColor: isSelected ? 'var(--hover-bg)' : 'var(--bg)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div style={{ flex: 1 }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleStimulus(stimulus)}
                      />
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                          {stimulus.name}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-muted)',
                          marginTop: '2px'
                        }}>
                          {stimulus.description}
                        </div>
                      </div>
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span style={{
                      padding: '2px 6px',
                      backgroundColor: 'var(--node-selected)',
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '10px'
                    }}>
                      {stimulus.category}
                    </span>
                    
                    {isSelected && (
                      <>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px'
                        }}>
                          <input
                            type="checkbox"
                            checked={stimulusRef?.enabled || true}
                            onChange={() => toggleStimulusEnabled(stimulus.id)}
                          />
                          启用
                        </label>
                        
                        {stimulus.parameters.length > 0 && (
                          <button
                            onClick={() => setShowParameterEditor(
                              showParameterEditor === stimulus.id ? null : stimulus.id
                            )}
                            style={{
                              padding: '2px 6px',
                              fontSize: '11px',
                              backgroundColor: 'var(--btn-bg)',
                              color: 'var(--btn-text)',
                              border: '1px solid var(--divider)',
                              borderRadius: '2px',
                              cursor: 'pointer'
                            }}
                          >
                            {showParameterEditor === stimulus.id ? '隐藏' : '参数'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* 关联组件显示 */}
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    关联组件: 
                  </span>
                  {stimulus.associatedComponents.map(comp => (
                    <span
                      key={comp}
                      style={{
                        marginLeft: '4px',
                        padding: '1px 4px',
                        backgroundColor: 'var(--palette-bg)',
                        color: 'var(--text)',
                        borderRadius: '2px',
                        fontSize: '11px'
                      }}
                    >
                      {comp}
                    </span>
                  ))}
                </div>

                {/* 参数编辑器 */}
                {isSelected && showParameterEditor === stimulus.id && stimulus.parameters.length > 0 && (
                  <StimulusParameterEditor
                    stimulus={stimulus}
                    parameters={stimulusRef?.parameters || {}}
                    onParametersChange={(params) => updateStimulusParameters(stimulus.id, params)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// 参数编辑器组件
interface StimulusParameterEditorProps {
  stimulus: Stimulus;
  parameters: Record<string, any>;
  onParametersChange: (parameters: Record<string, any>) => void;
}

const StimulusParameterEditor: React.FC<StimulusParameterEditorProps> = ({
  stimulus,
  parameters,
  onParametersChange
}) => {
  const updateParameter = (paramName: string, value: any) => {
    onParametersChange({
      ...parameters,
      [paramName]: value
    });
  };

  const renderParameterInput = (param: StimulusParameter) => {
    const currentValue = parameters[param.name] ?? param.defaultValue;

    switch (param.type) {
      case 'string':
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => updateParameter(param.name, e.target.value)}
            placeholder={param.defaultValue}
            style={{
              width: '100%',
              padding: '4px 6px',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--divider)',
              borderRadius: '2px',
              fontSize: '12px'
            }}
          />
        );

      case 'number':
      case 'range':
        return (
          <input
            type="number"
            value={currentValue ?? ''}
            onChange={(e) => updateParameter(param.name, parseFloat(e.target.value) || param.defaultValue)}
            min={param.min}
            max={param.max}
            placeholder={param.defaultValue?.toString()}
            style={{
              width: '100%',
              padding: '4px 6px',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--divider)',
              borderRadius: '2px',
              fontSize: '12px'
            }}
          />
        );

      case 'boolean':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={currentValue ?? param.defaultValue}
              onChange={(e) => updateParameter(param.name, e.target.checked)}
            />
            <span style={{ fontSize: '12px' }}>
              {currentValue ? '是' : '否'}
            </span>
          </label>
        );

      case 'select':
        return (
          <select
            value={currentValue || param.defaultValue}
            onChange={(e) => updateParameter(param.name, e.target.value)}
            style={{
              width: '100%',
              padding: '4px 6px',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--divider)',
              borderRadius: '2px',
              fontSize: '12px'
            }}
          >
            {param.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      marginTop: '12px',
      padding: '12px',
      backgroundColor: 'var(--palette-bg)',
      border: '1px solid var(--divider)',
      borderRadius: '4px'
    }}>
      <h4 style={{ 
        margin: '0 0 8px 0', 
        fontSize: '13px',
        color: 'var(--text)'
      }}>
        参数配置
      </h4>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '8px'
      }}>
        {stimulus.parameters.map(param => (
          <div key={param.name}>
            <label style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '12px',
              fontWeight: '500',
              color: 'var(--text)'
            }}>
              {param.name}
              {param.required && <span style={{ color: 'red' }}>*</span>}
            </label>
            {renderParameterInput(param)}
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginTop: '2px'
            }}>
              {param.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StimulusSelector;
