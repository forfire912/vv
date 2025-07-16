import * as vscode from 'vscode';
import * as path from 'path';

export function startVlabViewer(context: vscode.ExtensionContext): vscode.WebviewPanel {
  const panel = vscode.window.createWebviewPanel(
    'vlabviewer',
    'VlabViewer',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'dist'))] //', 'webview'))]
    }
  );

  panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);
  return panel;
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  // const runtimeUri = webview.asWebviewUri(
  //   vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'runtime.js')
  // );
  const mainUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'main.js')
  );
  const configUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'config')
  );
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>VlabViewer</title>
    <meta http-equiv="Content-Security-Policy" content="
      default-src 'none';
      script-src 'unsafe-eval' ${webview.cspSource};
      style-src ${webview.cspSource} 'unsafe-inline';
    ">
    <style>html,body,#app{height:100%;margin:0;padding:0;}body{overflow:hidden;}</style>
  </head>
  <body>
    <div id="app"></div>
    <script src="${mainUri}"></script>
  </body>
  </html>
  `;
}