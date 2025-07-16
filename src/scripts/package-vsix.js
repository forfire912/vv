const { execSync } = require('child_process');
const { version } = require('../../package.json');
const fs = require('fs');
const path = require('path');

// 1. 清理并编译扩展
execSync('npm run clean && npm run build:extension', { stdio: 'inherit' });

// 2. 检查 dist/extension.js 是否存在
const extPath = path.resolve(__dirname, '../../dist/extension.js');
if (!fs.existsSync(extPath)) {
  console.error('打包失败: dist/extension.js 不存在，请检查 TypeScript 编译是否正常！');
  process.exit(1);
}

// 3. 检查 dist/webview 是否存在
const webviewPath = path.resolve(__dirname, '../../dist/webview');
if (!fs.existsSync(webviewPath)) {
  console.error('打包失败: dist/webview 不存在，请检查 Webpack 编译是否正常！');
  process.exit(1);
}

// 4. 调用 vsce 打包，并利用 package.json 中的 version
execSync(`vsce package --out vlabviewer-${version}.vsix`, { stdio: 'inherit' });
