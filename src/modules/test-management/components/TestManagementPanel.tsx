/**
 * 测试管理面板主组件
 */

import React from 'react';
import TestManagementPanelSimple from './TestManagementPanelSimple';

interface TestManagementPanelProps {
  isVisible?: boolean;
  className?: string;
  onClose?: () => void;
}

export const TestManagementPanel: React.FC<TestManagementPanelProps> = ({
  isVisible = true,
  onClose,
  ...props
}) => {
  return <TestManagementPanelSimple isVisible={isVisible} onClose={onClose || (() => {})} />;
};

export default TestManagementPanel;
