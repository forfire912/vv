const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');

// 确保构建脚本使用 UTF-8 编码
if (process.stdout.isTTY) {
  if (process.platform === 'win32') {
    process.stdout.setEncoding('utf8');
    process.stderr.setEncoding('utf8');
  }
}

module.exports = [
  // 扩展主进程代码（Node.js环境）
  {
  // 扩展主进程代码（Node.js环境）
    name: 'extension',
    target: 'node',
    entry: './src/extension.ts',
    externals: {
      vscode: 'commonjs vscode', // vscode模块不应该被打包
      'node-machine-id': 'commonjs node-machine-id' // 动态加载，避免打包问题
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'extension.js',
      libraryTarget: 'commonjs2',
      charset: true // 确保输出文件使用UTF-8编码
    },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      }
    ],
  },

  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/config', to: path.resolve(__dirname, 'dist', 'webview', 'config') }
        // 如果有如下行，直接删除或注释
        // { from: 'resources', to: 'resources' }
      ]
    })
  ],

  performance: {
    maxAssetSize: 500000,  // 设置较大的文件大小限制（例如 500 KiB）
    maxEntrypointSize: 500000,  // 设置入口文件大小限制
    hints: 'warning'  // 将警告级别设置为 "warning" 或 "none"
  }
  },
  // Webview 前端代码（浏览器环境）
  {
    name: 'webview',
    target: 'web',
    entry: './src/views/react/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist', 'webview'),
      filename: 'main.js',
      charset: true // 确保输出文件使用UTF-8编码
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js']
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        }
      ]
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: 'src/styles', to: path.resolve(__dirname, 'dist', 'webview', 'styles') },
          { from: 'src/modules/test-management/styles', to: path.resolve(__dirname, 'dist', 'webview', 'styles', 'test-management') }
        ]
      })
    ]
  }
];