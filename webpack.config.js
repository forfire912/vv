const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development', // 或 'production'，根据你的需求选择
  devtool: 'source-map', // 生成 source map，便于调试
  entry: './src/views/react/index.tsx', // 你的 React 入口文件
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
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
        { from: 'src/config', to: 'config' }
      ]
    })
  ],

  performance: {
    maxAssetSize: 500000,  // 设置较大的文件大小限制（例如 500 KiB）
    maxEntrypointSize: 500000,  // 设置入口文件大小限制
    hints: 'warning'  // 将警告级别设置为 "warning" 或 "none"
  }
};