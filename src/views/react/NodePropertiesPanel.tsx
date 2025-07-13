import React, { useState, useEffect } from 'react';
import { getAllowedPeripheralOptions } from '../../utils/nodeUtils';
import { getConnectedCpuNode } from '../../utils/topology';
import type { Node, Edge } from 'reactflow';

interface NodePropertiesPanelProps {
  selectedNode: Node | null;
  nodes: Node[];
  edges: Edge[];
  onChange: (id: string, key: string, value: any) => void;
  data: any;
  lang: 'zh' | 'en';
}

const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  selectedNode, nodes, edges, onChange, data, lang = 'zh'
}) => {
  const [allowedInterfaces, setAllowedInterfaces] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedNode || !data?.type) {
      setAllowedInterfaces([]);
      setErrors([]);
      return;
    }

    if (data.type === 'peripheral') {
      const connectedCpuNode = getConnectedCpuNode(selectedNode.id, edges, nodes.filter(n => n.data?.type === 'cpu'));
      if (connectedCpuNode) {
        const options = getAllowedPeripheralOptions(connectedCpuNode, data) as unknown as {
          allowedInterfaces: string[];
          errors: string[];
        };
        setAllowedInterfaces(options.allowedInterfaces || []);
        setErrors(options.errors || []);
      } else {
        setAllowedInterfaces([]);
        setErrors(['未连接到处理器']);
      }
    } else {
      setAllowedInterfaces([]);
      setErrors([]);
    }
  }, [selectedNode, nodes, edges, data]);

  return (
    <div>
      <h4>属性</h4>
      {errors.length > 0 && (
        <div style={{ color: 'red' }}>
          {errors.map((err, index) => <p key={index}>{err}</p>)}
        </div>
      )}
      <div>
        <p>允许的接口: {allowedInterfaces.length > 0 ? allowedInterfaces.join(', ') : '无'}</p>
      </div>
    </div>
  );
};

export default NodePropertiesPanel;