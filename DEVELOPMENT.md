# VlabViewer 开发文档

本文档提供了 VlabViewer 扩展的技术细节和开发指南，适用于想要理解或贡献代码的开发者。

## 项目结构

```
vlabviewer/
├── dist/               # 编译后的文件
├── src/
│   ├── config/         # 组件配置定义
│   │   ├── cpus/       # 处理器定义
│   │   └── devices/    # 外设定义
│   ├── context/        # React上下文
│   ├── data/           # 数据处理相关
│   ├── hooks/          # 自定义React钩子
│   ├── i18n/           # 国际化支持
│   ├── scripts/        # 构建与辅助脚本
│   ├── styles/         # CSS样式
│   ├── types/          # TypeScript类型定义
│   ├── utils/          # 工具函数
│   ├── views/          # UI视图
│   │   └── react/      # React组件
│   └── extension.ts    # 扩展入口点
├── package.json        # 项目配置
├── webpack.config.js   # webpack配置
└── tsconfig.json       # TypeScript配置
```

## 核心模块

### 1. 扩展激活 (extension.ts)

扩展入口点，负责：
- 注册VS Code命令
- 处理扩展激活和停用
- 管理许可证验证

### 2. Webview面板 (views/VlabViewerPanel.ts)

创建和管理VS Code的WebView面板，负责：
- 构建WebView HTML内容
- 处理VS Code和WebView之间的通信
- 管理WebView生命周期

### 3. React应用 (views/react/)

WebView中运行的React应用，包含：
- 组件库面板 (ComponentPalette.tsx)
- 拓扑编辑器 (TopologyEditor.tsx)
- 属性面板 (NodePropertiesPanel.tsx)
- 工具栏 (Toolbar.tsx)

### 4. 配置管理 (utils/configLoader.ts)

负责加载和处理各类配置：
- 处理器和外设定义
- 拓扑配置的导入导出
- 配置验证和转换

### 5. 许可证管理

通过以下文件实现许可证验证：
- extension.ts: 许可证验证逻辑
- scripts/gen-machineid.ts: 生成机器ID
- scripts/gen-license.js: 生成许可证

## 数据流

1. 用户触发"vlabviewer.start"命令
2. extension.ts创建WebView面板
3. WebView加载React应用
4. 用户通过React UI创建和编辑拓扑
5. 数据通过WebView消息传递回VS Code扩展
6. VS Code扩展处理导出和其他与系统相关的操作

## 开发工作流

### 设置开发环境

1. 克隆仓库
2. 安装依赖：`npm install`
3. 构建扩展：`npm run build:all`

### 调试扩展

1. 在VS Code中打开项目
2. 按F5启动调试会话
3. 在新的VS Code窗口中测试扩展

### 添加新功能

#### 添加新的组件类型

1. 在`src/config/cpus/`或`src/config/devices/`中添加JSON定义
2. 更新`src/data/peripheralTemplates.ts`（如有必要）
3. 重新构建扩展

#### 修改UI

1. 编辑`src/views/react/`中的相应文件
2. 运行`npm run build:react`重新构建WebView

#### 添加新命令

1. 在`package.json`的`contributes.commands`中添加命令定义
2. 在`extension.ts`中注册命令处理函数

## 发布流程

1. 更新`package.json`中的版本号
2. 运行测试：`npm test`（如果有）
3. 构建扩展：`npm run build:all`
4. 打包扩展：`npm run package:vsix`
5. 测试VSIX安装包
6. 发布到市场（如果适用）：`vsce publish`

## 最佳实践

### 代码风格

- 使用TypeScript类型系统确保类型安全
- 使用明确的命名，避免缩写
- 为复杂功能添加注释

### 错误处理

- 使用try/catch块捕获预期的异常
- 使用日志记录错误信息
- 通过VS Code API向用户显示有用的错误消息

### 性能优化

- 避免在主线程中进行长时间运行的操作
- 使用懒加载技术减少初始加载时间
- 避免不必要的WebView重新加载

## 故障排除

### 调试日志

启用更详细的日志：
1. 在命令面板中运行"Developer: Set Log Level..."
2. 选择"Trace"级别
3. 在输出面板中选择"VlabViewer"通道

### 已知问题

- **WebView通信延迟**：处理大型拓扑时可能出现
  - 解决方案：分批发送数据或使用压缩

- **许可证验证**：在某些虚拟环境中可能无法正确获取硬件ID
  - 解决方案：提供手动输入选项

## 未来计划

- 增加更多处理器和外设模型
- 支持导出为其他模拟器格式
- 提供更丰富的模拟集成
- 改进UI响应性和用户体验

## 技术债务

- 需要改进WebView状态管理
- 配置验证逻辑需要重构
- 某些UI组件可以提取为独立的可复用模块
