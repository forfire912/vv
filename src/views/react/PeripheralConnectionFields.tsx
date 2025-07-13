import React from 'react';
import type { Node, Edge } from 'reactflow';
// import type { PeripheralNodeData } from '../../types/nodes';

interface PeripheralConnectionFieldsProps {
  selectedNode: Node | null;
  nodes: Node[];
  edges: Edge[];
  onChange: (id: string, key: string, value: any) => void;
  data: any; // 临时用 any，避免类型报错
  lang: 'zh' | 'en';
}

const PeripheralConnectionFields: React.FC<PeripheralConnectionFieldsProps> = ({
  selectedNode, nodes, edges, onChange, data, lang
}) => {
  // ...你可以在这里实现具体内容...
  return <div>Peripheral Connection Fields</div>;
};

export default PeripheralConnectionFields;
