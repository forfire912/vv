import React, { useState } from 'react';

export interface PaletteItem {
  name: string;
  label?: string;
  type: string;
}

interface Props {
  cpuList: PaletteItem[];
  deviceList: PaletteItem[];
  onDragStart: (item: PaletteItem, event: React.DragEvent) => void;
}

const ComponentPalette: React.FC<Props> = ({ cpuList, deviceList, onDragStart }) => {
  const [cpuExpanded, setCpuExpanded] = useState(true);
  const [deviceExpanded, setDeviceExpanded] = useState(true);
  
  return (
    <div
      className="component-palette"
      onDragOver={e => e.preventDefault()}
    >
      <div className="palette-header">
        <h3>组件库</h3>
      </div>
      
      <div className="palette-section">
        <div 
          className="palette-section-header" 
          onClick={() => setCpuExpanded(!cpuExpanded)}
        >
          <h4>处理器</h4>
          <span className="section-toggle">{cpuExpanded ? '−' : '+'}</span>
        </div>
        
        {cpuExpanded && (
          <div className="palette-items">
            {cpuList.map(cpu => (
              <div
                key={cpu.name}
                className="palette-item"
                draggable
                onDragStart={e => onDragStart(cpu, e)}
              >
                <span className="item-icon">⚙️</span>
                <span className="item-label">{cpu.label || cpu.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="palette-section">
        <div 
          className="palette-section-header" 
          onClick={() => setDeviceExpanded(!deviceExpanded)}
        >
          <h4>外设</h4>
          <span className="section-toggle">{deviceExpanded ? '−' : '+'}</span>
        </div>
        
        {deviceExpanded && (
          <div className="palette-items">
            {deviceList.map(dev => (
              <div
                key={dev.name}
                className="palette-item"
                draggable
                onDragStart={e => onDragStart(dev, e)}
              >
                <span className="item-icon">🔌</span>
                <span className="item-label">{dev.label || dev.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentPalette;