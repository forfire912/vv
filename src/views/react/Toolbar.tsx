import React from 'react';

interface ToolbarProps {
  onAutoLayout: () => void;
  onExportJson: () => void;
  onExportRepl: () => void;
  onSave: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAutoLayout,
  onExportJson,
  onExportRepl,
  onSave,
  onToggleFullscreen,
  isFullscreen
}) => {
  return (
    <div style={{ display: 'flex', padding: '8px', borderBottom: '1px solid #ccc', background: '#f0f0f0' }}>
      <button onClick={onAutoLayout} style={{ marginRight: 10 }}>自动布局</button>
      <button onClick={onSave} style={{ marginRight: 10 }}>保存拓扑</button>
      <button onClick={onExportJson} style={{ marginRight: 10 }}>导出 JSON</button>
      <button onClick={onExportRepl} style={{ marginRight: 10 }}>导出 REPL</button>
      <button onClick={onToggleFullscreen}>{isFullscreen ? '退出全屏' : '全屏'}</button>
    </div>
  );
};