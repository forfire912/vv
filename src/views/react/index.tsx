import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// React Flow 默认样式
import 'reactflow/dist/style.css';

// 全局通用样式
import '../../styles/global.css';

// 自定义覆盖样式
import '../../styles/reactflow-custom.css';

const root = createRoot(document.getElementById('app')!);
if (root) {
    root.render(<App />);
}