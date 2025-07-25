# VlabViewer

VlabViewer 是一个用于嵌入式系统的可视化 Renode 配置生成器插件。该插件提供了直观的拖拽式界面，帮助开发者快速构建和配置嵌入式系统拓扑。

## 功能特性

- **可视化拓扑编辑**：拖拽式界面，直观构建处理器与外设连接关系
- **丰富的组件库**：支持多种处理器和外设模型，可灵活配置参数
- **多格式导出**：支持导出为 JSON 和 Renode REPL 脚本格式
- **版本控制友好**：生成的配置文件适合纳入版本管理
- **集成式体验**：在 VS Code 内无缝运行，不需要切换工具

## 系统要求

- Visual Studio Code 1.80.0 或更高版本
- Node.js 14.0 或更高版本 (仅用于开发)

## 安装方法

### 从 VSIX 安装

1. 下载最新的 `.vsix` 文件
2. 在 VS Code 中选择扩展视图
3. 点击 "..." 菜单，选择 "从 VSIX 安装..."
4. 选择下载的 `.vsix` 文件

### 从源代码构建

1. 克隆代码仓库:
   ```bash
   git clone https://github.com/forfire912/vvr.git
   cd vvr
   ```

2. 安装依赖:
   ```bash
   npm install
   ```

3. 构建和打包扩展:
   ```bash
   npm run package:all
   ```

4. 安装生成的 VSIX 文件:
   ```bash
   code --install-extension vlabviewer-<version>.vsix
   ```

## 使用方法

1. 打开 VS Code
2. 按下 `Ctrl+Alt+V` 或在命令面板中输入 `Start VlabViewer`
3. 在可视化界面中:
   - 从左侧组件库拖拽处理器和外设到画布
   - 连接组件以建立通信关系
   - 配置组件参数
   - 使用工具栏导出配置

> **注意**：本插件完全支持中文界面和中文配置文件。如果您发现中文显示为乱码，请参考故障排除部分。

## 自定义组件

可以通过以下方式添加自定义组件:

1. 在 `src/config/cpus/` 目录中添加自定义处理器定义
2. 在 `src/config/devices/` 目录中添加自定义外设定义
3. 重新构建扩展

组件定义使用 JSON 格式，示例:

```json
{
  "name": "STM32F4",
  "description": "STM32F4系列处理器",
  "pins": ["UART1_TX", "UART1_RX", "SPI1_SCK", "SPI1_MOSI", "SPI1_MISO"],
  "defaultProperties": {
    "frequency": "168MHz"
  }
}
```

## 故障排除

### 常见问题

- **命令找不到**: 确保扩展正确安装且未被禁用
- **无法启动界面**: 检查 VS Code 输出面板中的错误日志
- **导出失败**: 确保已配置了至少一个处理器组件
- **中文显示乱码**: 这可能是由于字符编码问题导致。请尝试以下解决方案：
  1. 确保您的系统和编辑器使用 UTF-8 编码
  2. 如果您是开发者，运行 `npm run build:encoding` 命令修复编码问题
  3. 如需检查编码状态，可运行 `npm run test:encoding` 命令

### 日志查看

如需详细诊断信息，可以:

1. 在命令面板中打开 `Developer: Toggle Developer Tools`
2. 在控制台中筛选 `[VlabViewer]` 前缀的日志

## 版本历史

### v0.3.0 (当前版本)
- 修复命令注册问题
- 增强错误处理和日志记录
- 修复中文字符编码显示问题
- 添加编码自动修复脚本
- 优化插件界面交互

### v0.2.6
- 添加自定义配置项功能
- 优化导出格式

### v0.2.0
- 初始公开发布版本
- 实现基础拖拽界面功能

## 许可证

此插件使用 MIT License。详细许可证条款见 `LICENSE.md` 文件。

如需了解使用的第三方组件，请参见 `licenseusage.md`。

## 贡献代码

欢迎通过 Pull Request 或 Issue 方式参与到项目开发。
