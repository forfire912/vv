const fs = require('fs');
const path = require('path');

// 读取CSS文件
const cssPath = 'd:\\projects\\forfire\\tryit-3\\src\\modules\\test-management\\styles\\test-management.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

// 定义变量映射
const replacements = {
  // Font size variables
  'var(--test-font-size-sm)': '12px',
  'var(--test-font-size-md)': '13px',
  'var(--test-font-size-lg)': '14px',
  
  // Border variables
  'var(--test-border-color)': 'var(--divider)',
  'var(--test-border-radius)': '2px',
  
  // Background variables
  'var(--test-bg-primary)': 'var(--bg)',
  'var(--test-bg-secondary)': 'var(--palette-bg)',
  'var(--test-bg-tertiary)': 'var(--section-header-bg)',
  
  // Text variables
  'var(--test-text-primary)': 'var(--text)',
  'var(--test-text-secondary)': 'var(--secondary-text, var(--text))',
  'var(--test-text-label)': 'var(--label-text, var(--text))',
  
  // Color variables
  'var(--test-primary-color)': 'var(--node-selected)',
  'var(--test-info-color)': 'var(--node-selected)',
};

// 执行替换
Object.entries(replacements).forEach(([oldVar, newVar]) => {
  cssContent = cssContent.replace(new RegExp(oldVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newVar);
});

// 写回文件
fs.writeFileSync(cssPath, cssContent, 'utf8');

console.log('✅ CSS变量替换完成');
console.log('已处理的变量:');
Object.keys(replacements).forEach(key => console.log(`  ${key}`));
