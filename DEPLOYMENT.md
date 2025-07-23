# VlabViewer 跨平台部署指南

## 概述
VlabViewer v0.3.0 现已支持跨平台部署，包括 Windows、Linux 和 macOS。本版本修复了在 Linux 系统上的兼容性问题。

## 主要修复内容

### 1. 硬件识别兼容性
- **问题**: `node-machine-id` 包在 Linux 系统上可能无法正常工作
- **解决方案**: 
  - 将 `node-machine-id` 改为可选依赖
  - 实现了多级硬件识别策略：
    1. CPU 序列号（优先）
    2. 网卡 MAC 地址
    3. node-machine-id（如果可用）
    4. 系统信息生成的唯一标识（备用）

### 2. 平台特定实现
- **Windows**: 使用 `wmic cpu get ProcessorId` 获取 CPU 序列号
- **Linux**: 读取 `/proc/cpuinfo` 获取 CPU 信息，如无序列号则使用 CPU 模型信息生成 MD5 标识
- **macOS**: 使用 `system_profiler` 获取硬件 UUID

### 3. 错误处理增强
- 添加了环境检查功能
- 提供详细的调试信息
- 优雅降级：如果某种方法失败，自动尝试下一种方法

## 部署说明

### 在 Linux 上部署

1. **安装扩展**:
   ```bash
   code --install-extension vlabviewer-0.3.0.vsix
   ```

2. **检查权限**:
   确保 VS Code 有权限读取系统信息：
   ```bash
   # 检查 /proc/cpuinfo 是否可读
   cat /proc/cpuinfo | grep -E "(processor|model name|Serial)"
   
   # 检查网络接口
   ip link show
   ```

3. **调试信息**:
   启动扩展后，查看输出面板的 "VlabViewer" 频道：
   - Windows: `Ctrl+Shift+U` → 选择 "VlabViewer"
   - Linux: `Ctrl+Shift+U` → 选择 "VlabViewer"

### 在 Windows 上部署

1. **安装扩展**:
   ```bash
   code --install-extension vlabviewer-0.3.0.vsix
   ```

2. **权限要求**: 通常无需额外配置

### 在 macOS 上部署

1. **安装扩展**:
   ```bash
   code --install-extension vlabviewer-0.3.0.vsix
   ```

2. **可能需要的权限**: 
   - 如果遇到权限问题，可能需要在"系统偏好设置" → "安全性与隐私"中允许 VS Code 访问系统信息

## 故障排除

### 扩展无法启动
1. **查看输出面板**: 
   - `Ctrl+Shift+U` (Windows/Linux) 或 `Cmd+Shift+U` (macOS)
   - 选择 "VlabViewer" 频道

2. **常见问题**:
   - **Linux**: 如果提示权限问题，检查 `/proc/cpuinfo` 是否可读
   - **网络问题**: 确保至少有一个非本地网络接口
   - **Node.js 版本**: 确保 VS Code 使用的 Node.js 版本 >= 14

### 硬件识别失败
如果所有硬件识别方法都失败，扩展会：
1. 显示警告信息
2. 使用系统信息生成备用标识
3. 最后使用随机标识（不推荐用于生产环境）

### 调试模式
启用详细日志：
1. 打开 VS Code 开发者工具：`Help` → `Toggle Developer Tools`
2. 在控制台中查看 `[VlabViewer]` 开头的日志
3. 或者查看输出面板的 VlabViewer 频道

## 技术详细信息

### 依赖更改
```json
{
  "dependencies": {
    // 其他依赖...
  },
  "optionalDependencies": {
    "node-machine-id": "^1.1.12"
  }
}
```

### 新增文件
- `src/utils/platform-utils.ts`: 跨平台工具函数
- 增强的错误处理和环境检查

### Webpack 配置更改
```javascript
externals: {
  vscode: 'commonjs vscode',
  'node-machine-id': 'commonjs node-machine-id' // 动态加载
}
```

## 版本兼容性
- **VS Code**: >= 1.80.0
- **Node.js**: >= 14.0.0 (VS Code 内置)
- **操作系统**: Windows 10+, Ubuntu 18.04+, macOS 10.15+

## 支持
如果在 Linux 或其他平台上遇到问题，请提供以下信息：
1. 操作系统版本
2. VS Code 版本
3. VlabViewer 输出面板的完整日志
4. `/proc/cpuinfo` 的前几行（Linux）或相应的系统信息

## 更新日志
- v0.3.0: 修复跨平台兼容性问题，增强错误处理
- 支持 Windows、Linux、macOS 三大平台
- 改进硬件识别算法
- 添加环境检查和调试功能
