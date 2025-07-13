import React, { createContext, useContext } from 'react';
import type { CpuConfig, DeviceConfig } from '../types/config';

interface ConfigContextProps {
  cpuList: CpuConfig[];
  deviceList: DeviceConfig[];
}

const ConfigContext = createContext<ConfigContextProps>({ cpuList: [], deviceList: [] });

export const useConfigContext = () => useContext(ConfigContext);

export const ConfigProvider: React.FC<{ children: React.ReactNode, cpuList: CpuConfig[], deviceList: DeviceConfig[] }> = ({
  children, cpuList, deviceList
}) => (
  <ConfigContext.Provider value={{ cpuList, deviceList }}>
    {children}
  </ConfigContext.Provider>
);