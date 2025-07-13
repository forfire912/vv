import React from 'react';
import PeripheralConnectionFields from './PeripheralConnectionFields';
import NodeConfigFields from './NodeConfigFields';
import type { Node, Edge } from 'reactflow';
// import type { PeripheralNodeData } from '../../types/nodes';
import { t } from '../../i18n/i18n';

interface NodePropertiesPanelProps {
  selectedNode: Node | null;
  nodes: Node[];
  edges: Edge[];
  onChange: (id: string, key: string, value: any) => void;
  data: any; // 临时用 any，避免类型报错
  lang: 'zh' | 'en';
}

const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  selectedNode, nodes, edges, onChange, data, lang = 'zh'
}) => {
  const typeStr = typeof data.type === 'string' ? data.type.toLowerCase() : '';
  const isCpu = typeStr === 'cpu';
  const isPeripheral = !isCpu;

  // 配置参数变更处理
  const handleConfigChange = (key: string, value: any) => {
    if (selectedNode) {
      const newConfig = { ...data.config, [key]: value };
      onChange(selectedNode.id, 'config', newConfig);
    }
  };

  // 基础属性变更处理
  const handleBaseChange = (key: string, value: any) => {
    if (selectedNode) {
      onChange(selectedNode.id, key, value);
    }
  };

  return (
    <div>
      {/* 基础属性 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>基础属性</div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 8 }}>名称:</label>
          <input
            style={{ width: '70%' }}
            type="text"
            value={data.label || ''}
            onChange={e => handleBaseChange('label', e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 8 }}>类型:</label>
          <span>{data.type}</span>
        </div>
      </div>
      {/* 外设连接属性 */}
      {isPeripheral && (
        <PeripheralConnectionFields 
          selectedNode={selectedNode}
          nodes={nodes}
          edges={edges}
          onChange={onChange}
          data={data}
          lang={lang}
        />
      )}
      {/* 配置参数编辑 */}
      {data.config && (
        <NodeConfigFields config={data.config} onChange={handleConfigChange} lang={lang} />
      )}
    </div>
  );
};

export default NodePropertiesPanel;