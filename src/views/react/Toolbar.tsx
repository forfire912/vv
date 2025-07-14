import React from 'react';

interface ToolbarProps {
  savedList: string[];
  currentName: string;
  onSelect: (name: string) => void;
  onNew: () => void;
  onSave: () => void;
  onDeleteSaved: () => void;
  onExportJson: () => void;
  theme: 'light' | 'dark' | 'colorful';
  onThemeChange: (theme: 'light' | 'dark' | 'colorful') => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  savedList,
  currentName,
  onSelect,
  onNew,
  onSave,
  onDeleteSaved,
  onExportJson,
  theme,
  onThemeChange
}) => (
  <div style={{ display: 'flex', padding: '8px', borderBottom: '1px solid #ccc', background: '#f0f0f0' }}>
    <select
      value={currentName}
      onChange={e => onSelect(e.target.value)}
      style={{ marginRight: 10, width: '15cm' }}
    >
      <option value="">--拓扑列表--</option>
      {savedList.map(name => (
        <option key={name} value={name}>{name}</option>
      ))}
    </select>
    <button onClick={onNew} style={{ marginRight: 10 }}>新建</button>
    <button onClick={onSave} style={{ marginRight: 10 }}>保存</button>
    <button onClick={onDeleteSaved} style={{ marginRight: 10 }}>删除</button>
    <button onClick={onExportJson} style={{ marginRight: 10 }}>导出 JSON</button>
    <div style={{ marginLeft: 'auto' }}>
      <select
        value={theme}
        onChange={e => onThemeChange(e.target.value as any)}
        style={{ padding: 4, borderRadius: 4 }}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="colorful">Colorful</option>
      </select>
    </div>
  </div>
);