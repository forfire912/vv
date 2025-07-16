const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  devtool: process.env.NODE_ENV === 'production' ? 'hidden-source-map' : 'source-map', // 生产态隐藏源码映射
  entry: './src/views/react/index.tsx',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist', 'webview'), // 输出到 webview 子目录，保持与扩展调用一致
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
};