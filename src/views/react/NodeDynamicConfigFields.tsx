import React, { useState, useEffect } from 'react';
import { peripheralTemplates, ParameterField } from '../../data/peripheralTemplates';

interface Props {
  nodeType: string;
  config: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

const NodeDynamicConfigFields: React.FC<Props> = ({ nodeType, config, onChange }) => {
  const template = peripheralTemplates.find(t => t.type === nodeType);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // 初始化时自动校验
    if (template) {
      const newErrors: { [key: string]: string } = {};
      template.fields.forEach(field => {
        const err = validateField(field, config[field.key]);
        if (err) newErrors[field.key] = err;
      });
      setErrors(newErrors);
    }
    // eslint-disable-next-line
  }, [template, config]);

  function validateField(field: ParameterField, value: any) {
    if (field.required && (value === undefined || value === '')) {
      return `${field.label} 必填`;
    }
    if (field.type === 'number') {
      const n = Number(value);
      if (isNaN(n)) return `${field.label} 需为数字`;
      if (field.min !== undefined && n < field.min) return `不能小于${field.min}`;
      if (field.max !== undefined && n > field.max) return `不能大于${field.max}`;
    }
    if (field.pattern && typeof value === 'string' && !new RegExp(field.pattern).test(value)) {
      return `${field.label} 格式错误`;
    }
    return '';
  }

  function handleInputChange(field: ParameterField, value: any) {
    const err = validateField(field, value);
    setErrors(prev => ({ ...prev, [field.key]: err }));
    onChange(field.key, value);
  }

  if (!template) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>参数配置</div>
      {template.fields.map(field => (
        <div key={field.key} style={{ marginTop: 8 }}>
          <label>{field.label}</label>
          {field.type === 'enum' ? (
            <select
              value={config[field.key] ?? ''}
              onChange={e => handleInputChange(field, e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">请选择</option>
              {field.enumValues!.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type === 'number' ? 'number' : field.type === 'boolean' ? 'checkbox' : 'text'}
              checked={field.type === 'boolean' ? !!config[field.key] : undefined}
              value={field.type !== 'boolean' ? config[field.key] ?? '' : undefined}
              onChange={e => handleInputChange(
                field,
                field.type === 'boolean' ? (e.target as HTMLInputElement).checked : e.target.value
              )}
              style={{ width: '100%' }}
            />
          )}
          {errors[field.key] && (
            <div style={{ color: 'red', fontSize: 12 }}>{errors[field.key]}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NodeDynamicConfigFields;