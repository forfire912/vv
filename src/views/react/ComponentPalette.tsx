import React from 'react';

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

const ComponentPalette: React.FC<Props> = ({ cpuList, deviceList, onDragStart }) => (
  <div
    className="component-palette"
    onDragOver={e => e.preventDefault()}
  >
    <div className="palette-section">
      <h4>处理器</h4>
      {cpuList.map(cpu => (
        <div
          key={cpu.name}
          className="palette-item"
          draggable
          onDragStart={e => onDragStart(cpu, e)}
        >
          {cpu.label || cpu.name}
        </div>
      ))}
    </div>
    <div className="palette-section">
      <h4>外设</h4>
      {deviceList.map(dev => (
        <div
          key={dev.name}
          className="palette-item"
          draggable
          onDragStart={e => onDragStart(dev, e)}
        >
          {dev.label || dev.name}
        </div>
      ))}
    </div>
  </div>
);

export default ComponentPalette;