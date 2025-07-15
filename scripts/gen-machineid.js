#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_machine_id_1 = require("node-machine-id");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const args = process.argv.slice(2);
if (args.length < 1) {
    console.error('Usage: ts-node scripts/gen-machineid.ts <outputDir>');
    process.exit(1);
}
const [outputDir] = args;
// 确保目录存在
fs.mkdirSync(outputDir, { recursive: true });
// 生成 ID 并写文件
const id = (0, node_machine_id_1.machineIdSync)();
const filePath = path.join(outputDir, 'machine.id');
fs.writeFileSync(filePath, id, 'utf8');
console.log(`machine.id generated at ${filePath}`);
//# sourceMappingURL=gen-machineid.js.map