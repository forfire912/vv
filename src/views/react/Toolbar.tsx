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
        title="选择拓扑配置"
      >
        <option value="">选择拓扑配置...</option>
        {savedList.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
      <div className="toolbar-button-group">
        <button className="toolbar-button" onClick={onNew} title="新建拓扑">
          <i className="codicon codicon-add"></i>
          <span>新建</span>
        </button>
        <button className="toolbar-button" onClick={onSave} title="保存当前拓扑">
          <i className="codicon codicon-save"></i>
          <span>保存</span>
        </button>
        <button className="toolbar-button" onClick={onDeleteSaved} title="删除选中的拓扑">
          <i className="codicon codicon-trash"></i>
          <span>删除</span>
        </button>
        <button className="toolbar-button" onClick={onExportJson} title="导出为JSON文件">
          <i className="codicon codicon-export"></i>
          <span>导出</span>
        </button>
      </div>
    </div>
    <div className="toolbar-section">
      <label style={{ fontSize: '13px', marginRight: '6px' }}>主题:</label>
      <select
        value={theme}
        onChange={e => onThemeChange(e.target.value as any)}
        className="theme-select"
        title="选择界面主题"
      >
        <option value="light">浅色</option>
        <option value="dark">深色</option>
        <option value="colorful">高对比度</option>
      </select>
    </div>
  </div>
);