#!/usr/bin/env node
const crypto = require('crypto');
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node scripts/gen-license.js <machineId> [expirationDate]');
  process.exit(1);
}
const [machineId, expirationDate = ''] = args;
// 构造 payload
const payload = JSON.stringify({ hardwareId: machineId, exp: expirationDate });
// TODO: 把下面的 SECRET 更换为你的私钥
const SECRET = 'replace_with_your_secret';
// 计算 HMAC
const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
// 最终 license 格式：base64(payload) + '.' + hmac
const license = Buffer.from(payload).toString('base64') + '.' + hmac;
console.log(license);
