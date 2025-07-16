import * as vscode from 'vscode';
import { machineIdSync } from 'node-machine-id';
import * as os from 'os';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { startVlabViewer } from './views/VlabViewerPanel';

// 日志工具函数
const LOG_PREFIX = '[VlabViewer]';
const log = {
  info: (message: string) => console.log(`${LOG_PREFIX} INFO: ${message}`),
  warn: (message: string) => console.warn(`${LOG_PREFIX} WARN: ${message}`),
  error: (message: string, error?: any) => {
    console.error(`${LOG_PREFIX} ERROR: ${message}`);
    if (error) console.error(error);
  },
  debug: (message: string) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

// 自定义硬件特征获取：优先 CPU 序列号，其次取第一个非内部网卡的 MAC，最后回退到 machineId
function getHardwareId(): string {
  log.debug('获取硬件标识...');
  try {
    if (process.platform === 'win32') {
      log.debug('尝试获取 CPU 序列号...');
      const out = execSync('wmic cpu get ProcessorId /value').toString();
      const match = out.match(/ProcessorId=(.+)/i);
      if (match && match[1].trim()) {
        const id = match[1].trim();
        log.debug(`已获取 CPU 序列号: ${id.substring(0, 4)}...`);
        return id;
      }
    }
  } catch (err) {
    log.debug(`获取 CPU 序列号失败: ${err instanceof Error ? err.message : String(err)}`);
  }
  
  try {
    log.debug('尝试获取网卡 MAC 地址...');
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const ni of nets[name]!) {
        if (!ni.internal && ni.mac && ni.mac !== '00:00:00:00:00:00') {
          log.debug(`已获取网卡 MAC 地址: ${ni.mac}`);
          return ni.mac;
        }
      }
    }
  } catch (err) {
    log.debug(`获取网卡 MAC 地址失败: ${err instanceof Error ? err.message : String(err)}`);
  }
  
  // 最后回退到 machineId
  log.debug('回退到 machineId...');
  try {
    const id = machineIdSync();
    log.debug('已获取 machineId');
    return id;
  } catch (err) {
    log.error('获取所有硬件标识均失败', err);
    throw new Error('无法获取可用的硬件标识');
  }
}

// 使用 HMAC 签名校验 license
/**
 * 验证许可证有效性
 * @param token 许可证字符串
 * @param id 硬件ID
 * @returns 许可证是否有效
 */
function verifyLicense(token: string, id: string): boolean {
  if (!token) {
    log.warn('许可证为空');
    return false;
  }
  
  // 解析许可证格式
  const [data, sig] = token.split('.');
  if (!data || !sig) {
    log.warn('许可证格式不正确');
    return false;
  }
  
  // 与生成脚本中一致的 SECRET，请替换为你的私钥
  const SECRET = 'replace_with_your_secret';
  
  try {
    // 校验签名
    log.debug('校验许可证签名...');
    const payload = Buffer.from(data, 'base64').toString('utf8');
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    
    if (sig !== expected) {
      log.warn('许可证签名无效');
      return false;
    }
    
    const info = JSON.parse(payload);
    
    // 校验硬件 ID
    if (info.hardwareId !== id) {
      log.warn(`许可证硬件ID不匹配 (期望: ${info.hardwareId.substring(0, 4)}..., 实际: ${id.substring(0, 4)}...)`);
      return false;
    }
    
    // 校验到期日（可选）
    if (info.exp) {
      const expire = new Date(info.exp);
      const now = new Date();
      if (expire < now) {
        log.warn(`许可证已过期 (${expire.toLocaleDateString()})`);
        return false;
      }
      log.info(`许可证有效期至: ${expire.toLocaleDateString()}`);
    } else {
      log.info('永久有效的许可证');
    }
    
    log.info('许可证验证通过');
    return true;
  } catch (err) {
    log.error('许可证验证过程出错', err);
    return false;
  }
}

/**
 * 扩展激活入口点
 * @param context 扩展上下文
 */
export async function activate(context: vscode.ExtensionContext) {
  try {
    log.info('正在激活 VlabViewer 扩展...');
    
    // 确保命令始终注册，无论打包环境如何
    const commandId = 'vlabviewer.start'; // 命令ID必须与package.json中的完全一致
    
    // 直接在全局范围注册命令，确保在打包环境中可用
    const commandHandler = () => {
      try {
        log.info(`命令 ${commandId} 被执行`);
        const panel = startVlabViewer(context);
        
        panel.webview.onDidReceiveMessage(async msg => {
          try {
            if (msg.type === 'prompt') {
              const val = await vscode.window.showInputBox({ prompt: msg.text });
              panel.webview.postMessage({ type: 'promptResponse', value: val, action: msg.action });
            } else if (msg.type === 'confirm') {
              const pick = await vscode.window.showInformationMessage(msg.text, 'Yes', 'No');
              panel.webview.postMessage({
                type: 'confirmResponse',
                confirmed: pick === 'Yes',
                action: msg.action,
                name: msg.name
              });
            }
            //else if (msg.type === 'info') {
            //  // 模态信息提示，仅带"OK"按钮
            //  await vscode.window.showInformationMessage(msg.text, { modal: true }, 'OK');
            //}
          } catch (err) {
            console.error('Error handling message:', err);
          }
        });
      } catch (err) {
        console.error('Error executing command:', err);
        vscode.window.showErrorMessage(`Error executing command: ${err}`);
      }
    };
    
    // 注册多个命令 - 使用不同的注册方式，确保至少有一个可以工作
    // 方式1: 直接使用字符串常量
    const cmd1 = vscode.commands.registerCommand('vlabviewer.start', commandHandler);
    context.subscriptions.push(cmd1);
    console.log(`Command 'vlabviewer.start' registered (method 1).`);

    // 方式2: 使用替代命令名称
    const cmd2 = vscode.commands.registerCommand('extension.startVlabViewer', commandHandler);
    context.subscriptions.push(cmd2);
    console.log(`Command 'extension.startVlabViewer' registered (method 2).`);

    // 方式3: 使用 vscode.commands.executeCommand 确保命令可执行
    vscode.commands.executeCommand('setContext', 'vlabviewer.enabled', true);
    console.log(`Command context set.`);

    // 后续存储与许可逻辑包裹在 try-catch，不影响命令注册
    try {
      // 1. 准备本地存储目录（兼容 globalStorageUri 与 globalStoragePath）
      const storagePath = context.globalStorageUri?.fsPath || context.globalStoragePath;
      fs.mkdirSync(storagePath, { recursive: true });

      // 2. Machine ID 文件：读取或生成
      const machineIdFile = path.join(storagePath, 'machine.id');
      let id: string;
      if (fs.existsSync(machineIdFile)) {
        id = fs.readFileSync(machineIdFile, 'utf8').trim();
      } else {
        id = getHardwareId();
        fs.writeFileSync(machineIdFile, id, 'utf8');
      }

      // 3. License 文件：读取或输入
      const licenseFile = path.join(storagePath, 'license.key');
      let licenseKey: string | undefined;
      if (fs.existsSync(licenseFile)) {
        try { licenseKey = fs.readFileSync(licenseFile, 'utf8').trim(); }
        catch { /* ignore */ }
      }

      // 新增：试用期逻辑（30 天）
      const trialFile = path.join(storagePath, 'trial.start');
      if (!licenseKey) {
        let start = fs.existsSync(trialFile)
          ? new Date(fs.readFileSync(trialFile, 'utf8'))
          : (fs.writeFileSync(trialFile, new Date().toISOString(), 'utf8'), new Date());
        const days = Math.floor((Date.now() - start.getTime()) / (1000*60*60*24));
        const trialDays = 30;
        if (days < trialDays) {
          vscode.window.showInformationMessage(`试用版剩余 ${trialDays - days} 天`);
        } else {
          // 试用到期，强制输入 license
          licenseKey = await vscode.window.showInputBox({ prompt: `试用已结束，请输入许可证 (机器ID: ${id})` });
          if (!licenseKey) {
            vscode.window.showErrorMessage('许可证为必填，插件已禁用');
            return;
          }
          fs.writeFileSync(licenseFile, licenseKey, 'utf8');
        }
      }

      // 5. 验证不通过则报错并退出
      if (licenseKey) {
        if (!verifyLicense(licenseKey, id)) {
          vscode.window.showErrorMessage('无效或已过期的许可证，请联系供应商');
          return;
        }
      }
    } catch (e) {
      console.error('VlabViewer license verification error:', e);
      // 许可校验失败不影响命令注册
    }

    // 打印扩展激活成功的日志
    console.log('VlabViewer extension activated successfully.');
  } catch (e) {
    // 捕获整个激活过程的异常
    console.error('VlabViewer extension activation error:', e);
    vscode.window.showErrorMessage(`VlabViewer extension activation error: ${e}`);
  }
}
