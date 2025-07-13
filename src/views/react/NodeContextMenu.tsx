import React from "react";

interface Props {
  x: number;
  y: number;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const NodeContextMenu: React.FC<Props> = ({ x, y, onRename, onDelete, onClose }) => (
  <div
    style={{
      position: "absolute",
      top: y,
      left: x,
      background: "#fff",
      border: "1px solid #ccc",
      zIndex: 1000,
      boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
    }}
    onMouseLeave={onClose}
  >
    <div style={{ padding: 8, cursor: "pointer" }} onClick={() => { onRename(); onClose(); }}>重命名</div>
    <div style={{ padding: 8, cursor: "pointer" }} onClick={() => { onDelete(); onClose(); }}>删除</div>
  </div>
);

export default NodeContextMenu;