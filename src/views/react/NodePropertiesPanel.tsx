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
    console.log('NodePropertiesPanel useEffect 触发:', { 
      selectedNodeId: selectedNode?.id, 
      selectedNodeType: selectedNode?.data?.type 
    });
    
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
      console.log('外设接口信息:', { nodeId: selectedNode.id, perIfaces });
      
      const allowedSet = new Set<string>();
      perIfaces.forEach((iface: any) => {
        // 检查多种可能的属性名和位置
        const allowed = iface.allowed_type || iface.props?.allowed_type || iface.props?.["allowed_type"] || iface.props?.allowed_types || iface["allowed_type"];
        console.log('接口配置解析:', { iface, allowed });
        
        if (Array.isArray(allowed)) {
          allowed.forEach((t: string) => allowedSet.add(t));
        } else if (typeof allowed === "string") {
          allowedSet.add(allowed);
        }
      });
      const allowedArr = Array.from(allowedSet);
      console.log('外设允许的接口类型:', allowedArr);

      const common: string[] = [];
      if (cpuNode && Array.isArray(cpuNode.data.interfaces)) {
        // 找到匹配的接口ID（而不是接口类型）
        cpuNode.data.interfaces.forEach((cpuInterface: any) => {
          const isMatched = allowedArr.some(allowedType => {
            const cpuTypeLower = cpuInterface.type.toLowerCase();
            const allowedTypeLower = allowedType.toLowerCase();
            
            console.log('匹配调试:', { cpuTypeLower, allowedTypeLower, interfaceId: cpuInterface.id });
            
            // 精确匹配
            if (cpuTypeLower === allowedTypeLower) return true;
            
            // 前缀匹配：外设要求 "GPIOPort"，CPU提供 "GPIOPort.MAX32650_GPIO"
            if (cpuTypeLower.startsWith(allowedTypeLower + ".")) return true;
            
            // 反向匹配：外设要求 "GPIOPort.MAX32650_GPIO"，CPU提供 "GPIOPort.MAX32650_GPIO" 
            if (allowedTypeLower.startsWith(cpuTypeLower + ".")) return true;
            
            // 通用类型匹配：外设要求 "GPIOPort"，CPU提供 "GPIOPort.任何实现"
            const cpuBaseType = cpuTypeLower.split('.')[0];
            const allowedBaseType = allowedTypeLower.split('.')[0];
            if (cpuBaseType === allowedBaseType) return true;
            
            return false;
          });
          
          if (isMatched && !common.includes(cpuInterface.id)) {
            common.push(cpuInterface.id); // 存储接口ID而不是接口类型
          }
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
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <input
              className="properties-input"
              type="text"
              value={selectedNode.data.displayName || ""}
              onChange={e => onChange(selectedNode.id, "displayName", e.target.value)}
              placeholder="输入自定义名称"
              style={{ 
                borderColor: nodes.some(node => 
                  node.id !== selectedNode.id && 
                  (node.data.displayName === selectedNode.data.displayName || 
                   node.data.label === selectedNode.data.displayName)
                ) ? 'red' : undefined 
              }}
            />
            {nodes.some(node => 
              node.id !== selectedNode.id && 
              (node.data.displayName === selectedNode.data.displayName || 
               node.data.label === selectedNode.data.displayName)
            ) && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>
                警告：该名称已被其他节点使用
              </div>
            )}
          </div>
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
                  <b>{i.type}</b>：{i.props?.pin_nums
                    ? `1 - ${i.props.pin_nums}`
                    : Array.isArray(i.props?.pin_sels)
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
                value={selectedNode.data.config?.selectedInterfaceId || ""}
                onChange={e => {
                  const cfg = {
                    ...selectedNode.data.config,
                    selectedInterfaceId: e.target.value,
                    pinNumber: undefined,
                    pinSelection: undefined
                  };
                  onChange(selectedNode.id, "config", cfg);
                }}
              >
                <option value="">请选择接口</option>
                {allowedInterfaces.map(ifaceId => {
                  const ifaceDef = cpuNode?.data.interfaces.find((i: any) => i.id === ifaceId);
                  return (
                    <option key={ifaceId} value={ifaceId}>
                      {ifaceId} ({ifaceDef?.type})
                    </option>
                  );
                })}
              </select>
            </div>
            {selectedNode.data.config?.selectedInterfaceId && cpuNode && (
              (() => {
                const ifaceDef = cpuNode.data.interfaces.find((i: any) => i.id === selectedNode.data.config.selectedInterfaceId);
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
