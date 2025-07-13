import * as vscode from 'vscode';
import * as path from 'path';

export function startVlabViewer(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'vlabviewer',
    'VlabViewer',
    vscode.ViewColumn.One, // 可选 One / Two / Three 或 vscode.ViewColumn.Active
    {
      enableScripts: true,
      retainContextWhenHidden: true, // 保持状态
      localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'dist'))]
    }
  );

  panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {

  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'dist', 'main.js')
  );
  console.log("test:" + scriptUri.toString()); // 输出路径确认是否正确

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>VlabViewer</title>
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-eval' ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline';">
        <style>
          html, body, #app {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            overflow: hidden;
          }
        </style>    
      </head>
    <body>
      <div id="app"></div>
      <script src="${scriptUri}"></script>  
    </body>
    </html>
  `;
}