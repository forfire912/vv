import * as vscode from 'vscode';
import * as path from 'path';

/**
 * VlabViewer WebView 面板管理器
 * 负责创建和配置扩展的主要 WebView 界面
 */

/**
 * 启动 VlabViewer WebView 面板
 * @param context 扩展上下文
 * @returns 创建的 WebView 面板对象
 */
export function startVlabViewer(context: vscode.ExtensionContext): vscode.WebviewPanel {
  // 创建 WebView 面板
  const panel = vscode.window.createWebviewPanel(
    'vlabviewer',            // 唯一标识符
    'VlabViewer',            // 面板标题
    vscode.ViewColumn.One,   // 显示在编辑器的第一列
    {
      enableScripts: true,              // 允许在 WebView 中运行脚本
      retainContextWhenHidden: true,    // 隐藏时保留内容，避免重新加载
      localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'dist'))] // 限制加载资源的路径
    }
  );

  // 设置 WebView HTML 内容
  panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);
  return panel;
}

/**
 * 生成 WebView HTML 内容
 * @param webview WebView 对象
 * @param extensionUri 扩展 URI
 * @returns HTML 字符串
 */
function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  // 获取 WebView 中使用的资源 URI
  const mainUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'main.js')
  );
  const configUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'config')
  );
  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
		<meta charset="utf-8">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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