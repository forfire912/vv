/**
 * 跨平台工具函数
 * 提供在不同操作系统上的兼容性支持
 */

import * as os from 'os';
import * as fs from 'fs';
import { execSync } from 'child_process';
import * as crypto from 'crypto';

export interface PlatformInfo {
  platform: string;
  arch: string;
  release: string;
  hostname: string;
  username: string;
  isLinux: boolean;
  isWindows: boolean;
  isMacOS: boolean;
}

/**
 * 获取平台信息
 */
export function getPlatformInfo(): PlatformInfo {
  const platform = process.platform;
  return {
    platform,
    arch: process.arch,
    release: os.release(),
    hostname: os.hostname(),
    username: os.userInfo().username,
    isLinux: platform === 'linux',
    isWindows: platform === 'win32',
    isMacOS: platform === 'darwin'
  };
}

/**
 * 检查命令是否可用
 */
export function isCommandAvailable(command: string): boolean {
  try {
    if (process.platform === 'win32') {
      execSync(`where ${command}`, { stdio: 'ignore' });
    } else {
      execSync(`which ${command}`, { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * 安全执行命令
 */
export function safeExecSync(command: string): string | null {
  try {
    return execSync(command, { encoding: 'utf8', timeout: 5000 });
  } catch (error) {
    console.debug(`命令执行失败: ${command}, 错误: ${error}`);
    return null;
  }
}

/**
 * 检查文件是否可读
 */
export function isFileReadable(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * 生成系统指纹
 */
export function generateSystemFingerprint(): string {
  const info = getPlatformInfo();
  const data = {
    platform: info.platform,
    arch: info.arch,
    hostname: info.hostname,
    username: info.username,
    cpuCount: os.cpus().length,
    totalMemory: os.totalmem(),
    release: info.release
  };
  
  return crypto.createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
}

/**
 * 检查 VS Code 扩展运行环境
 */
export function checkExtensionEnvironment(): {
  isValid: boolean;
  issues: string[];
  info: PlatformInfo;
} {
  const issues: string[] = [];
  const info = getPlatformInfo();
  
  // 检查 Node.js 版本
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 14) {
    issues.push(`Node.js 版本过低 (${nodeVersion}), 建议使用 14.0.0 或更高版本`);
  }
  
  // 检查必要的系统调用
  if (info.isLinux) {
    if (!isFileReadable('/proc/cpuinfo')) {
      issues.push('无法读取 /proc/cpuinfo，可能影响硬件识别');
    }
    if (!isCommandAvailable('uname')) {
      issues.push('uname 命令不可用');
    }
  }
  
  if (info.isWindows) {
    if (!isCommandAvailable('wmic')) {
      issues.push('wmic 命令不可用，可能影响硬件识别');
    }
  }
  
  if (info.isMacOS) {
    if (!isCommandAvailable('system_profiler')) {
      issues.push('system_profiler 命令不可用');
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    info
  };
}
