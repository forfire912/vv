#!/usr/bin/env node
import { machineIdSync } from 'node-machine-id';
import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: ts-node scripts/gen-machineid.ts <outputDir>');
  process.exit(1);
}
const [outputDir] = args;
// 确保目录存在
fs.mkdirSync(outputDir, { recursive: true });
// 生成 ID 并写文件
const id = machineIdSync();
const filePath = path.join(outputDir, 'machine.id');
fs.writeFileSync(filePath, id, 'utf8');
console.log(`machine.id generated at ${filePath}`);
