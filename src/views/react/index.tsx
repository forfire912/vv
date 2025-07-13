import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// React Flow 默认样式，必须引入
import 'reactflow/dist/style.css';
import '../../styles/reactflow-custom.css';

const root = createRoot(document.getElementById('app')!);
if (root) {
    root.render(<App />);
}