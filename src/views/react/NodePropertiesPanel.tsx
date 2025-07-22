import React, { useState, useEffect } from "react";
// ...existing code...
import { getConnectedCpuNode } from "../../utils/topology";
import type { Node, Edge } from "reactflow";

interface NodePropertiesPanelProps {
  selectedNode: Node<any> | null;
  nodes: Node[];
  edges: Edge[];
  onChange: (id: string, key: string, value: any) => void;
  onCpuChange: (peripheralId: string, cpuId: string) => void;
  lang: "zh" | "en";
}

const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  selectedNode, nodes, edges, onChange, onCpuChange, lang = "zh"
}) => {
  const [connectedCpuId, setConnectedCpuId] = useState<string>("");
  const [allowedInterfaces, setAllowedInterfaces] = useState<string[]>([]);
  // ...existing code...

  useEffect(() => {
    if (!selectedNode) {
      setConnectedCpuId("");
      setAllowedInterfaces([]);
      return;
    }

    // 处理器：只清理状态，不提前 return，保证渲染下面的接口属性
    if (selectedNode.data.type === "cpu") {
      setConnectedCpuId("");
      setAllowedInterfaces([]);
    }

    // 外设节点
    if (selectedNode.data.type === "device") {
      // 查找已连接的 CPU
      const cpuNodes = nodes.filter(n => n.data.type === "cpu");
      const cpuNode = getConnectedCpuNode(selectedNode.id, edges, cpuNodes);

      if (cpuNode) {
        setConnectedCpuId(cpuNode.id);
      } else {
        setConnectedCpuId("");
      }

      // 计算接口交集
      const perIfaces = Array.isArray(selectedNode.data.interfaces) ? selectedNode.data.interfaces : [];
      const allowedSet = new Set<string>();
      perIfaces.forEach((iface: any) => {
        const allowed = iface.props?.["allowed _type"] || iface.props?.allowed_type || iface.props?.allowed_types;
        if (Array.isArray(allowed)) {
          allowed.forEach((t: string) => allowedSet.add(t));
        } else if (typeof allowed === "string") {
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

  // ...existing code...

  if (!selectedNode) return null;

  const cpuNodes = nodes.filter(n => n.data.type === "cpu");
  const cpuNode = cpuNodes.find(n => n.id === connectedCpuId)
    || (selectedNode.data.type === "cpu" ? selectedNode : undefined);

  return (
    <div className="properties-panel">
      <div className="properties-header">
        <h3>节点属性</h3>
      </div>
      <div className="properties-section">
        <div className="property-group">
          <div className="property-label">标识</div>
          <div className="property-value">{selectedNode.id}</div>
        </div>
        <div className="property-group">
          <div className="property-label">模型</div>
          <div className="property-value">{selectedNode.data.name || selectedNode.data.label}</div>
        </div>
        <div className="property-group">
          <div className="property-label">类型</div>
          <div className="property-value property-tag">
            {selectedNode.data.type === "cpu" ? "处理器" : "外设"}
          </div>
        </div>
        <div className="property-group">
          <div className="property-label">名称</div>
          <input
            className="properties-input"
            type="text"
            value={selectedNode.data.displayName || ""}
            onChange={e => onChange(selectedNode.id, "displayName", e.target.value)}
            placeholder="输入自定义名称"
          />
        </div>
        {selectedNode.data.type === "cpu" && cpuNode && (
          <>
            <h4 className="section-title">接口属性</h4>
            <div className="property-group">
              <div className="property-label">接口列表</div>
              <div className="property-value">
                {cpuNode.data.interfaces.map((i: any, index: number) => (
                  <span key={i.type || index} className="property-tag" style={{ margin: "2px 4px 2px 0" }}>
                    {i.type}
                  </span>
                ))}
              </div>
            </div>
            <div className="property-group">
              <div className="property-label">接口参数范围</div>
              {cpuNode.data.interfaces.map((i: any) => (
                <div key={i.id || i.type} className="property-value" style={{ marginTop: 4 }}>
                  <b>{i.type}</b>：{i.props.pin_nums
                    ? `1 - ${i.props.pin_nums}`
                    : Array.isArray(i.props.pin_sels)
                    ? `[${i.props.pin_sels.join(", ")}]`
                    : ""}
                </div>
              ))}
            </div>
          </>
        )}
        {selectedNode.data.type === "device" && (
          <>
            <h4 className="section-title">外设连接</h4>
            <div className="property-group">
              <div className="property-label">处理器</div>
              <select
                className="properties-select"
                value={connectedCpuId}
                onChange={e => {
                  const cpuId = e.target.value;
                  setConnectedCpuId(cpuId);
                  onCpuChange(selectedNode.id, cpuId);
                }}
              >
                <option value="">未连接</option>
                {cpuNodes.map(cpu => (
                  <option key={cpu.id} value={cpu.id}>
                    {cpu.data.label || cpu.data.name || cpu.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="property-group">
              <div className="property-label">接口</div>
              <select
                className="properties-select"
                value={selectedNode.data.config?.selectedInterface || ""}
                onChange={e => {
                  const cfg = {
                    ...selectedNode.data.config,
                    selectedInterface: e.target.value,
                    pinNumber: undefined,
                    pinSelection: undefined
                  };
                  onChange(selectedNode.id, "config", cfg);
                }}
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
                  <div className="property-group">
                    {ifaceDef.props.pin_nums && (
                      <>
                        <div className="property-label">引脚编号 (1 - {ifaceDef.props.pin_nums})</div>
                        <input
                          className="properties-input"
                          type="number"
                          min={1}
                          max={ifaceDef.props.pin_nums}
                          value={selectedNode.data.config?.pinNumber || ""}
                          onChange={e => {
                            const cfg = { ...selectedNode.data.config, pinNumber: Number(e.target.value) };
                            onChange(selectedNode.id, "config", cfg);
                          }}
                        />
                      </>
                    )}
                    {Array.isArray(ifaceDef.props.pin_sels) && (
                      <>
                        <div className="property-label">引脚选项</div>
                        <select
                          className="properties-select"
                          value={selectedNode.data.config?.pinSelection || ""}
                          onChange={e => {
                            const cfg = { ...selectedNode.data.config, pinSelection: e.target.value };
                            onChange(selectedNode.id, "config", cfg);
                          }}
                        >
                          <option value="">请选择</option>
                          {ifaceDef.props.pin_sels.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                );
              })()
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default NodePropertiesPanel;
