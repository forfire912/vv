import React from 'react';
import { loadCpuConfigs, loadDeviceConfigs } from '../../utils/configLoader';
import { ConfigProvider } from '../../context/ConfigContext';
import { ReactFlowProvider } from 'reactflow';
import TopologyEditor from './TopologyEditor';

const cpuList = loadCpuConfigs();
const deviceList = loadDeviceConfigs();

const App: React.FC = () => {
  return (
    <ConfigProvider cpuList={cpuList} deviceList={deviceList}>
      <ReactFlowProvider>
        <div className="app-container" style={{ display: 'flex', height: '100vh' }}>
          {/* 主拓扑编辑器 - 现在包含测试管理标签页 */}
          <div className="topology-container" style={{ 
            flex: '1 1 100%'
          }}>
            <TopologyEditor />
          </div>
        </div>
      </ReactFlowProvider>
    </ConfigProvider>
  );
};

export default App;