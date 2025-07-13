import React from 'react';
import { t } from '../../i18n/i18n';

interface ConfigFieldProps {
  config: Record<string, any>;
  onChange: (key: string, value: any) => void;
  lang?: 'zh' | 'en';
}

const COMMON_FIELDS = ['baudRate', 'parity', 'stopBits', 'dataBits', 'mode', 'frequency', 'speed'];

const NodeConfigFields: React.FC<ConfigFieldProps> = ({ config, onChange, lang = 'zh' }) => {
  if (!config) return null;

  // 只渲染 COMMON_FIELDS，如果没有则渲染所有字段
  const keys = Object.keys(config).filter(key => COMMON_FIELDS.includes(key));
  const renderKeys = keys.length > 0 ? keys : Object.keys(config);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{t('commParams', lang)}</div>
      {renderKeys.map(key => {
        const value = config[key];
        // enum类型
        if (Array.isArray(value?.enumValues)) {
          return (
            <div key={key} style={{ marginTop: 8 }}>
              <label>{key}</label>
              <select
                style={{ width: '100%' }}
                value={value.value ?? value}
                onChange={e => onChange(key, e.target.value)}
              >
                {value.enumValues.map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );
        }
        // 数字/字符串
        return (
          <div key={key} style={{ marginTop: 8 }}>
            <label>{key}</label>
            <input
              style={{ width: '100%' }}
              type="text"
              value={typeof value === 'object' && value !== null && value.value !== undefined ? value.value : value ?? ''}
              onChange={e => onChange(key, e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default NodeConfigFields;