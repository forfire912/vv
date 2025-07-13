import * as vscode from 'vscode';
import { startVlabViewer } from './views/VlabViewerPanel';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('vlabviewer.start', () => {
    startVlabViewer(context);
  });

  context.subscriptions.push(disposable);
}