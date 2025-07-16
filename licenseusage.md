# VlabViewer 使用手册（用户版）

## 一、预备工作
1. 安装 Node.js（≥12）  
2. 在项目根目录执行 `npm install`，安装依赖  

## 二、命令行工具（CLI）
我们提供两款 CLI：
- `vlab-machineid`：快速生成 `machine.id`  
- `vlab-gen-license`：根据 `machine.id` 生成 `license.key`

**脚本位置**  
打包后，CLI 脚本位于 `dist/scripts/` 目录：  
- dist/scripts/gen-machineid.js  
- dist/scripts/gen-license.js  

您可以：

1. 通过 `node` 直接运行：
   ```bash
   # 生成 machine.id
   node dist/scripts/gen-machineid.js <输出目录>
   # 生成 license.key
   node dist/scripts/gen-license.js <machineId> [YYYY-MM-DD]
   ```

2. 或全局安装后直接使用二进制命令：
   ```bash
   npm install -g .
   # 之后可执行
   vlab-machineid <输出目录>
   vlab-gen-license <machineId> [YYYY-MM-DD]
   ```

### 1. 安装 CLI
```bash
npm install -g <your-package-name>
```

### 2. 生成 machine.id
```bash
# 将硬件特征写入指定目录
vlab-machineid <输出目录>
# 例：
vlab-machineid d:/projects/forfire/vv/.vscode/globalStorage
```

### 3. 生成 license.key
```bash
# 使用 machine.id 生成许可证，可选到期日
vlab-gen-license <machineId> [YYYY-MM-DD]
# 例：
vlab-gen-license $(cat d:/projects/forfire/vv/.vscode/globalStorage/machine.id) 2024-12-31
```

## 三、VS Code 插件

1. 打包生成 VSIX 文件  
   ```bash
   npm run package:vsix
   # 根目录会生成 vlabviewer-<version>.vsix
   ```

2. 安装 VSIX 插件  
   ```bash
   code --install-extension vlabviewer-<version>.vsix
   ```

> 注意：不要使用 `cli-dist/*.tgz`（那是 CLI 包），VS Code 只能识别 `.vsix` 格式的插件包。

## 四、试用与注册
- **免费试用 30 天**：首次启动会记录试用开始时间  
- 试用期内无需任何操作，VS Code 启动时自动提示剩余天数  
- 试用到期后，会弹出输入框，请将生成的 `license.key` 文件复制到插件存储目录，或直接粘贴证书内容并确认  

存储路径（Windows 示例）
