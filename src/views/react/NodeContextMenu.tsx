import React from "react";

interface Props {
  x: number;
  y: number;
  onRename: () => void;
  onDelete: () => void;
  onAddStimulus?: () => void;
  onClose: () => void;
}

const NodeContextMenu: React.FC<Props> = ({ x, y, onRename, onDelete, onAddStimulus, onClose }) => (
  <div
    style={{
      position: "absolute",
      top: y + window.scrollY, // 考虑页面滚动
      left: x + window.scrollX, // 考虑页面滚动
      background: "#fff",
      border: "1px solid #ccc",
      zIndex: 1000,
      boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
    }}
    onMouseLeave={onClose}
  >
    <div style={{ padding: 8, cursor: "pointer" }} onClick={() => { onRename(); onClose(); }}>节点属性</div>
    <div style={{ padding: 8, cursor: "pointer" }} onClick={() => { onDelete(); onClose(); }}>删除</div>
    <div style={{ padding: 8, cursor: "pointer" }} onClick={() => { onAddStimulus && onAddStimulus(); onClose(); }}>新增激励</div>
  </div>
);

export default NodeContextMenu;