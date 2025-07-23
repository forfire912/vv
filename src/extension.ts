import * as vscode from 'vscode';
import * as os from 'os';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { startVlabViewer } from './views/VlabViewerPanel';
import { checkExtensionEnvironment, getPlatformInfo, safeExecSync, isFileReadable } from './utils/platform-utils';

// 动态导入 node-machine-id，避免在不支持的平台上出错
let machineIdSync: any;
try {
  machineIdSync = require('node-machine-id').machineIdSync;
} catch (err) {
  console.warn('[VlabViewer] node-machine-id 包加载失败，将使用备用方案');
  machineIdSync = null;
}

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

/**
 * 获取硬件标识
 * 优先使用 CPU 序列号，其次是网卡 MAC 地址，最后回退到 machineId。
 * @returns 硬件标识字符串
 */
function getHardwareId(): string {
  log.debug('获取硬件标识...');
  const platformInfo = getPlatformInfo();
  log.debug(`运行平台: ${platformInfo.platform} ${platformInfo.arch}`);
  
  // 1. 尝试获取 CPU 序列号
  try {
    if (platformInfo.isWindows) {
      log.debug('Windows 系统，尝试获取 CPU 序列号...');
      const out = safeExecSync('wmic cpu get ProcessorId /value');
      if (out) {
        const match = out.match(/ProcessorId=(.+)/i);
        if (match && match[1].trim()) {
          const id = match[1].trim();
          log.debug(`已获取 CPU 序列号: ${id.substring(0, 4)}...`);
          return id;
        }
      }
    } else if (platformInfo.isLinux) {
      log.debug('Linux 系统，尝试获取 CPU 信息...');
      if (isFileReadable('/proc/cpuinfo')) {
        try {
          const cpuInfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
          const serialMatch = cpuInfo.match(/Serial\s*:\s*([a-f0-9]+)/i);
          if (serialMatch && serialMatch[1]) {
            log.debug(`已获取 CPU 序列号: ${serialMatch[1]}`);
            return serialMatch[1];
          }
          
          // 如果没有序列号，尝试使用 processor 信息创建唯一标识
          const processorMatch = cpuInfo.match(/processor\s*:\s*(\d+)/);
          const modelMatch = cpuInfo.match(/model name\s*:\s*(.+)/);
          if (processorMatch && modelMatch) {
            const uniqueId = crypto.createHash('md5')
              .update(modelMatch[1] + processorMatch[1])
              .digest('hex');
            log.debug(`使用 CPU 模型信息生成标识: ${uniqueId.substring(0, 8)}...`);
            return uniqueId;
          }
        } catch (err) {
          log.debug(`读取 /proc/cpuinfo 失败: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } else if (platformInfo.isMacOS) {
      log.debug('macOS 系统，尝试获取硬件 UUID...');
      const hwUuid = safeExecSync('system_profiler SPHardwareDataType | grep "Hardware UUID"');
      if (hwUuid) {
        const match = hwUuid.match(/Hardware UUID:\s*([A-F0-9-]+)/);
        if (match && match[1]) {
          log.debug(`已获取硬件 UUID: ${match[1].substring(0, 8)}...`);
          return match[1];
        }
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

  // 3. 使用 node-machine-id（如果可用）
  if (machineIdSync) {
    log.debug('尝试使用 node-machine-id...');
    try {
      const id = machineIdSync();
      log.debug('已获取 machineId');
      return id;
    } catch (err) {
      log.debug(`node-machine-id 获取失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 4. 最后的备用方案：使用系统信息生成唯一标识
  log.debug('使用系统信息生成备用标识...');
  try {
    const systemInfo = {
      platform: platformInfo.platform,
      arch: platformInfo.arch,
      hostname: platformInfo.hostname,
      userInfo: platformInfo.username,
      release: platformInfo.release
    };
    
    const fallbackId = crypto.createHash('md5')
      .update(JSON.stringify(systemInfo))
      .digest('hex');
    
    log.debug(`生成备用标识: ${fallbackId.substring(0, 8)}...`);
    return fallbackId;
  } catch (err) {
    log.error('生成备用标识失败', err);
    // 如果所有方法都失败，使用随机标识
    const randomId = crypto.randomBytes(16).toString('hex');
    log.warn(`使用随机标识: ${randomId.substring(0, 8)}...`);
    return randomId;
  }
}

/**
 * 验证许可证有效性
 * 使用 HMAC 签名校验许可证的有效性，并检查硬件 ID 和到期日。
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
 * 注册命令、验证许可证并初始化 WebView 面板。
 * @param context 扩展上下文
 */
export async function activate(context: vscode.ExtensionContext) {
  // 确保日志在控制台和开发者工具中都可见
  function logToConsole(message: string) {
    console.log(message);
    // 如果在开发模式，也输出到输出面板
    const channel = vscode.window.createOutputChannel('VlabViewer');
    channel.appendLine(message);
    channel.show();
  }

  logToConsole('🔄 VlabViewer 扩展激活中...');
  
  // 环境检查
  try {
    const envCheck = checkExtensionEnvironment();
    if (!envCheck.isValid) {
      log.warn('环境检查发现问题:');
      envCheck.issues.forEach(issue => log.warn(`  - ${issue}`));
      logToConsole(`⚠️ 环境问题: ${envCheck.issues.join(', ')}`);
      vscode.window.showWarningMessage(
        `VlabViewer: 检测到环境问题，可能影响部分功能。详情请查看输出面板。`,
        '查看详情'
      ).then(selection => {
        if (selection === '查看详情') {
          vscode.commands.executeCommand('workbench.action.output.toggleOutput');
        }
      });
    } else {
      log.info(`环境检查通过 - 平台: ${envCheck.info.platform} ${envCheck.info.arch}`);
      logToConsole(`✅ 环境检查通过 - 平台: ${envCheck.info.platform} ${envCheck.info.arch}`);
    }
  } catch (err) {
    logToConsole(`❌ 环境检查失败: ${err}`);
  }
  
  try {
    // 简化命令注册 - 直接方式
    const disposable = vscode.commands.registerCommand('vlabviewer.start', () => {
      logToConsole('✅ 命令 vlabviewer.start 被执行');
      try {
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
          } catch (err) {
            log.error('处理消息时发生错误', err);
          }
        });
        
        log.info('VlabViewer 面板已成功创建');
      } catch (err) {
        logToConsole(`❌ 执行命令错误: ${err}`);
        vscode.window.showErrorMessage(`执行命令错误: ${err}`);
      }
    });
    
    context.subscriptions.push(disposable);
    
    // 确认命令注册
    setTimeout(async () => {
      const commands = await vscode.commands.getCommands();
      if (commands.includes('vlabviewer.start')) {
        logToConsole('✅ 命令已成功注册: vlabviewer.start');
      } else {
        logToConsole('❌ 命令注册失败: vlabviewer.start');
        // 尝试再次注册
        const fallbackCmd = vscode.commands.registerCommand('vlabviewer.start', 
          () => vscode.window.showInformationMessage('VlabViewer backup command executed'));
        context.subscriptions.push(fallbackCmd);
      }
    }, 1000);
    
    // 许可证验证和其他逻辑
    setImmediate(async () => {
      try {
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

        // 验证许可证
        if (licenseKey) {
          if (!verifyLicense(licenseKey, id)) {
            vscode.window.showErrorMessage('无效或已过期的许可证，请联系供应商');
            return;
          }
        }
        
        log.info('许可证验证完成');
      } catch (e) {
        log.error('许可证验证失败', e);
      }
    });

    logToConsole('✅ VlabViewer 扩展激活成功');
  } catch (e) {
    logToConsole(`❌ VlabViewer 扩展激活失败: ${e}`);
    vscode.window.showErrorMessage(`VlabViewer 扩展激活失败: ${e}`);
  }
}

/**
 * 扩展停用入口点
 * 清理资源。
 */
export function deactivate() {}
