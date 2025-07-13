import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import 'reactflow/dist/style.css';
import '../../styles/global.css';
import '../../styles/reactflow-custom.css';

// VS Code API 获取并挂载
declare const acquireVsCodeApi: any;
const vscodeApi = acquireVsCodeApi();
;(window as any).vscodeApi = vscodeApi;

// 转发 Webview 消息到自定义事件
window.addEventListener('message', event => {
  const msg = event.data;
  if (msg.type === 'promptResponse') {
    window.dispatchEvent(new CustomEvent('vscode-prompt-response', {
      detail: { value: msg.value, action: msg.action }
    }));
  } else if (msg.type === 'confirmResponse') {
    window.dispatchEvent(new CustomEvent('vscode-confirm-response', {
      detail: { confirmed: msg.confirmed, action: msg.action, name: msg.name }
    }));
  }
});

const root = createRoot(document.getElementById('app')!);
root.render(<App />);