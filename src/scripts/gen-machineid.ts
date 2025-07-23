#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

// 动态导入 node-machine-id，避免在不支持的平台上出错
let machineIdSync: any;
try {
  machineIdSync = require('node-machine-id').machineIdSync;
} catch (err) {
  console.warn('node-machine-id 包加载失败，将使用备用方案');
  machineIdSync = null;
}

/**
 * 跨平台获取机器标识
 */
function getCrossPlatformMachineId(): string {
  // 1. 尝试获取 CPU 序列号
  try {
    if (process.platform === 'win32') {
      const out = execSync('wmic cpu get ProcessorId /value').toString();
      const match = out.match(/ProcessorId=(.+)/i);
      if (match && match[1].trim()) {
        return match[1].trim();
      }
    } else if (process.platform === 'linux') {
      try {
        const cpuInfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
        const serialMatch = cpuInfo.match(/Serial\s*:\s*([a-f0-9]+)/i);
        if (serialMatch && serialMatch[1]) {
          return serialMatch[1];
        }
        
        // 使用 CPU 模型信息创建唯一标识
        const processorMatch = cpuInfo.match(/processor\s*:\s*(\d+)/);
        const modelMatch = cpuInfo.match(/model name\s*:\s*(.+)/);
        if (processorMatch && modelMatch) {
          return crypto.createHash('md5')
            .update(modelMatch[1] + processorMatch[1])
            .digest('hex');
        }
      } catch (err) {
        console.debug(`读取 /proc/cpuinfo 失败: ${err}`);
      }
    } else if (process.platform === 'darwin') {
      const hwUuid = execSync('system_profiler SPHardwareDataType | grep "Hardware UUID"', { encoding: 'utf8' });
      const match = hwUuid.match(/Hardware UUID:\s*([A-F0-9-]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch (err) {
    console.debug(`获取 CPU 序列号失败: ${err}`);
  }

  // 2. 尝试获取网卡 MAC 地址
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const ni of nets[name]!) {
        if (!ni.internal && ni.mac && ni.mac !== '00:00:00:00:00:00') {
          return ni.mac;
        }
      }
    }
  } catch (err) {
    console.debug(`获取网卡 MAC 地址失败: ${err}`);
  }

  // 3. 使用 node-machine-id（如果可用）
  if (machineIdSync) {
    try {
      return machineIdSync();
    } catch (err) {
      console.debug(`node-machine-id 获取失败: ${err}`);
    }
  }

  // 4. 备用方案：使用系统信息生成唯一标识
  try {
    const systemInfo = {
      platform: process.platform,
      arch: process.arch,
      hostname: os.hostname(),
      userInfo: os.userInfo().username,
      release: os.release()
    };
    
    return crypto.createHash('md5')
      .update(JSON.stringify(systemInfo))
      .digest('hex');
  } catch (err) {
    console.error('生成备用标识失败', err);
    // 最后使用随机标识
    return crypto.randomBytes(16).toString('hex');
  }
}

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: ts-node scripts/gen-machineid.ts <outputDir>');
  process.exit(1);
}

const [outputDir] = args;
// 确保目录存在
fs.mkdirSync(outputDir, { recursive: true });
// 生成 ID 并写文件
const id = getCrossPlatformMachineId();
const filePath = path.join(outputDir, 'machine.id');
fs.writeFileSync(filePath, id, 'utf8');
console.log(`machine.id generated at ${filePath} (${id.substring(0, 8)}...)`);
console.log(`Platform: ${process.platform}, Architecture: ${process.arch}`);
