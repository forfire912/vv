import * as vscode from 'vscode';
import { startVlabViewer } from './views/VlabViewerPanel';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('vlabviewer.start', () => {
    const panel = startVlabViewer(context);

    // 监听来自 Webview 的消息
    panel.webview.onDidReceiveMessage(async msg => {
      if (msg.type === 'prompt') {
        const val = await vscode.window.showInputBox({ prompt: msg.text });
        panel.webview.postMessage({ type: 'promptResponse', value: val, action: msg.action });
      } else if (msg.type === 'confirm') {
        const pick = await vscode.window.showInformationMessage(msg.text, 'Yes', 'No');
        panel.webview.postMessage({
          type: 'confirmResponse',
          confirmed: pick === 'Yes',
          action: msg.action,
          name: msg.name
        });
      }
    });
  });

  context.subscriptions.push(disposable);
}