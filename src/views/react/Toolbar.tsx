import React from 'react';
import '@vscode/codicons/dist/codicon.css';

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
  <div className="toolbar">
    <div className="toolbar-section">
      <select
        value={currentName}
        onChange={e => onSelect(e.target.value)}
        className="topology-select"
      >
        <option value="">--拓扑列表--</option>
        {savedList.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
      <div className="toolbar-button-group" style={{ display: 'flex', gap: '8px' }}>
        <button className="toolbar-button" onClick={onNew}>
          <i className="codicon codicon-add"></i>
          <span style={{ textAlign: 'center' }}>新建</span>
        </button>
        <button className="toolbar-button" onClick={onSave}>
          <i className="codicon codicon-save"></i>
          <span style={{ textAlign: 'center' }}>保存</span>
        </button>
        <button className="toolbar-button" onClick={onDeleteSaved}>
          <i className="codicon codicon-trash"></i>
          <span style={{ textAlign: 'center' }}>删除</span>
        </button>
        <button className="toolbar-button" onClick={onExportJson}>
          <i className="toolbar-icon">⤓</i>
          <span style={{ textAlign: 'center' }}>导出</span>
        </button>
      </div>
    </div>
    <div className="theme-selector">
      <select
        value={theme}
        onChange={e => onThemeChange(e.target.value as any)}
        className="theme-select"
      >
        <option value="light">浅色主题</option>
        <option value="dark">深色主题</option>
        <option value="colorful">多彩主题</option>
      </select>
    </div>
  </div>
);