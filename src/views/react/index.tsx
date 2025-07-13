import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '../../styles/reactflow-custom.css';

const root = createRoot(document.getElementById('app')!);
if (root) {
    root.render(<App />);
}