import React, { useState, useEffect } from 'react';
import { getConnectedCpuNode } from '../../utils/topology';
import type { Node, Edge } from 'reactflow';

interface NodePropertiesPanelProps {
  selectedNode: Node<any> | null;
  nodes: Node[];
  edges: Edge[];
  onChange: (id: string, key: string, value: any) => void;
  onCpuChange: (peripheralId: string, cpuId: string) => void;
  lang: 'zh' | 'en';
}

const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  selectedNode, nodes, edges, onChange, onCpuChange, lang = 'zh'
}) => {
  const [connectedCpuId, setConnectedCpuId] = useState<string>('');
  const [allowedInterfaces, setAllowedInterfaces] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedNode) {
      setConnectedCpuId('');
      setAllowedInterfaces([]);
      return;
    }

    // 处理器：只清理状态，不提前 return，保证渲染下面的接口属性
    if (selectedNode.data.type === 'cpu') {
      setConnectedCpuId('');
      setAllowedInterfaces([]);
    }

    // 外设节点
    if (selectedNode.data.type === 'device') {
      // 查找已连接的 CPU
      const cpuNodes = nodes.filter(n => n.data.type === 'cpu');
      const cpuNode = getConnectedCpuNode(selectedNode.id, edges, cpuNodes);

      if (cpuNode) {
        setConnectedCpuId(cpuNode.id);
      } else {
        setConnectedCpuId('');
      }

      // 计算接口交集
      const perIfaces = Array.isArray(selectedNode.data.interfaces) ? selectedNode.data.interfaces : [];
      const allowedSet = new Set<string>();
      perIfaces.forEach((iface: any) => {
        const allowed = iface.props?.['allowed _type'] || iface.props?.allowed_type || iface.props?.allowed_types;
        if (Array.isArray(allowed)) {
          allowed.forEach((t: string) => allowedSet.add(t));
        } else if (typeof allowed === 'string') {
          allowedSet.add(allowed);
        }
      });
      const allowedArr = Array.from(allowedSet);

      const common: string[] = [];
      if (cpuNode && Array.isArray(cpuNode.data.interfaces)) {
        const cpuTypes = cpuNode.data.interfaces.map((i: any) => i.type);
        allowedArr.forEach(t => {
          if (cpuTypes.includes(t)) common.push(t);
        });
      }
      setAllowedInterfaces(common);
    }
  }, [selectedNode, nodes, edges]);

  if (!selectedNode) return null;

  const cpuNodes = nodes.filter(n => n.data.type === 'cpu');
  const cpuNode = cpuNodes.find(n => n.id === connectedCpuId) 
                || (selectedNode.data.type === 'cpu' ? selectedNode : undefined);

  return (
    <div style={{ padding: 16 }}>
      <h4>节点信息</h4>
      <p>ID: {selectedNode.id}</p>
      <p>模型: {selectedNode.data.name || selectedNode.data.label}</p>
      <p>类型: {selectedNode.data.type === 'cpu' ? '处理器' : '外设'}</p>
      {/* 新增 用户自定义“名称” - 移动到此处 */}
      <div style={{ marginBottom: 12 }}>
        <label>名称</label>
        <input
          type="text"
          value={selectedNode.data.displayName || ''}
          onChange={e => onChange(selectedNode.id, 'displayName', e.target.value)}
          style={{ width: '100%', marginTop: 4 }}
        />
      </div>

      {selectedNode.data.type === 'cpu' && cpuNode && (
        <>
          <h4>接口属性</h4>
          <div style={{ marginBottom: 12 }}>
            <label>接口列表</label>
            <p style={{ marginTop: 4 }}>
              {cpuNode.data.interfaces.map((i: any) => i.type).join(', ')}
            </p>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>接口参数范围</label>
            {cpuNode.data.interfaces.map((i: any) => (
              <p key={i.id || i.type} style={{ marginTop: 4 }}>
                {i.type}：{i.props.pin_nums
                  ? `1 - ${i.props.pin_nums}`
                  : Array.isArray(i.props.pin_sels)
                  ? `[${i.props.pin_sels.join(', ')}]`
                  : ''}
              </p>
            ))}
          </div>
        </>
      )}

      {selectedNode.data.type === 'device' && (
        <>
          <h4>外设连接</h4>
          <div style={{ marginBottom: 12 }}>
            <label>处理器</label>
            <select
              value={connectedCpuId}
              onChange={e => {
                const cpuId = e.target.value;
                setConnectedCpuId(cpuId);
                onCpuChange(selectedNode.id, cpuId);
              }}
              style={{ width: '100%', marginTop: 4 }}
            >
              <option value="">未连接</option>
              {cpuNodes.map(cpu => (
                <option key={cpu.id} value={cpu.id}>
                  {cpu.data.label || cpu.data.name || cpu.id}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>接口</label>
            <select
              value={selectedNode.data.config?.selectedInterface || ''}
              onChange={e => {
                const cfg = {
                  ...selectedNode.data.config,
                  selectedInterface: e.target.value,
                  pinNumber: undefined,
                  pinSelection: undefined
                };
                onChange(selectedNode.id, 'config', cfg);
              }}
              style={{ width: '100%', marginTop: 4 }}
            >
              <option value="">请选择接口</option>
              {allowedInterfaces.map(ifaceType => (
                <option key={ifaceType} value={ifaceType}>{ifaceType}</option>
              ))}
            </select>
          </div>

          {selectedNode.data.config?.selectedInterface && cpuNode && (
            (() => {
              const ifaceDef = cpuNode.data.interfaces.find((i: any) => i.type === selectedNode.data.config.selectedInterface);
              if (!ifaceDef?.props) return null;
              return (
                <div style={{ marginTop: 16 }}>
                  {ifaceDef.props.pin_nums && (
                    <div style={{ marginBottom: 8 }}>
                      <label>引脚编号 (1 - {ifaceDef.props.pin_nums})</label>
                      <input
                        type="number"
                        min={1}
                        max={ifaceDef.props.pin_nums}
                        value={selectedNode.data.config?.pinNumber || ''}
                        onChange={e => {
                          const cfg = { ...selectedNode.data.config, pinNumber: Number(e.target.value) };
                          onChange(selectedNode.id, 'config', cfg);
                        }}
                        style={{ width: '100%', marginTop: 4 }}
                      />
                    </div>
                  )}
                  {Array.isArray(ifaceDef.props.pin_sels) && (
                    <div style={{ marginBottom: 8 }}>
                      <label>引脚选项</label>
                      <select
                        value={selectedNode.data.config?.pinSelection || ''}
                        onChange={e => {
                          const cfg = { ...selectedNode.data.config, pinSelection: e.target.value };
                          onChange(selectedNode.id, 'config', cfg);
                        }}
                        style={{ width: '100%', marginTop: 4 }}
                      >
                        <option value="">请选择</option>
                        {ifaceDef.props.pin_sels.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </>
      )}
    </div>
  );
};

export default NodePropertiesPanel;