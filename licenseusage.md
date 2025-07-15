# VlabViewer 使用手册（用户版）

## 一、预备工作
1. 安装 Node.js（≥12）  
2. 在项目根目录执行 `npm install`，安装依赖  

## 二、命令行工具（CLI）
我们提供两款 CLI：
- `vlab-machineid`：快速生成 `machine.id`  
- `vlab-gen-license`：根据 `machine.id` 生成 `license.key`

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
1. 安装插件（.vsix 包）  
   ```bash
   code --install-extension vlabviewer-0.2.0.vsix
   ```
2. 启动插件  
   在 VS Code 中按 `Ctrl+Shift+P`，执行 “Start VlabViewer”  

## 四、试用与注册
- **免费试用 30 天**：首次启动会记录试用开始时间  
- 试用期内无需任何操作，VS Code 启动时自动提示剩余天数  
- 试用到期后，会弹出输入框，请将生成的 `license.key` 文件复制到插件存储目录，或直接粘贴证书内容并确认  

存储路径（Windows 示例）：
````
<userPrompt>
Provide the fully rewritten file, incorporating the suggested code change. You must produce the complete file.
</userPrompt>

The resulting document:
<copilot-edited-file>
# VlabViewer 使用手册（用户版）

## 一、预备工作
1. 安装 Node.js（≥12）  
2. 在项目根目录执行 `npm install`，安装依赖  

## 二、命令行工具（CLI）
我们提供两款 CLI：
- `vlab-machineid`：快速生成 `machine.id`  
- `vlab-gen-license`：根据 `machine.id` 生成 `license.key`

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
1. 安装插件（.vsix 包）  
   ```bash
   code --install-extension vlabviewer-0.2.0.vsix
   ```
2. 启动插件  
   在 VS Code 中按 `Ctrl+Shift+P`，执行 “Start VlabViewer”  

## 四、试用与注册
- **免费试用 30 天**：首次启动会记录试用开始时间  
- 试用期内无需任何操作，VS Code 启动时自动提示剩余天数  
- 试用到期后，会弹出输入框，请将生成的 `license.key` 文件复制到插件存储目录，或直接粘贴证书内容并确认  

存储路径（Windows 示例）：
````
