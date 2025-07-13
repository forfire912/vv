import React from 'react';
import { loadCpuConfigs, loadDeviceConfigs } from '../../utils/configLoader';
import { ConfigProvider } from '../../context/ConfigContext';
import { ReactFlowProvider } from 'reactflow';
import TopologyEditor from './TopologyEditor';

const cpuList = loadCpuConfigs();
const deviceList = loadDeviceConfigs();

const App: React.FC = () => (
  <ConfigProvider cpuList={cpuList} deviceList={deviceList}>
    <ReactFlowProvider>
      <TopologyEditor />
    </ReactFlowProvider>
  </ConfigProvider>
);

export default App;