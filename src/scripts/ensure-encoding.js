/**
 * 在构建过程中确保正确的字符集编码
 * 更新日期: 2025年7月16日
 * 功能: 检查和修复文件编码，解决乱码问题
 */
const fs = require('fs');
const path = require('path');

// 获取命令行参数
const args = process.argv.slice(2);
const command = args[0] || 'check';

// 要处理的目录和文件
const DIRS_TO_PROCESS = [
  path.join(__dirname, '..', 'dist'),  // 构建输出目录
  path.join(__dirname, '..', '..'),    // 项目根目录
];

// 需要特别关注的文件
const CRITICAL_FILES = [
  path.join(__dirname, '..', '..', 'package.json'),
  path.join(__dirname, '..', '..', 'README.md'),
  path.join(__dirname, '..', 'views', 'VlabViewerPanel.ts')
];

// 文件扩展名过滤
const FILE_EXTENSIONS = /\.(js|json|html|css|md|ts|tsx|json)$/i;

// 忽略的目录
const IGNORE_DIRS = ['node_modules', '.git', '.vscode'];

// 确保目录存在
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`创建目录: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 递归处理目录中的所有文件
function processDirectory(dir, stats) {
  // 跳过忽略的目录
  const baseName = path.basename(dir);
  if (IGNORE_DIRS.includes(baseName)) {
    return;
  }

  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        processDirectory(filePath, stats);
      } else {
        // 只处理文本文件
        if (FILE_EXTENSIONS.test(file.name)) {
          try {
            if (command === 'check') {
              checkEncoding(filePath, stats);
            } else if (command === 'convert') {
              convertToUtf8(filePath, stats);
            }
          } catch (err) {
            console.error(`处理文件 ${filePath} 时出错:`, err);
            stats.errors++;
          }
        }
      }
    }
  } catch (err) {
    console.error(`读取目录 ${dir} 时出错:`, err);
  }
}

// 检查文件编码
function checkEncoding(filePath, stats) {
  try {
    // 尝试以UTF-8读取
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否包含乱码字符 (替换字符U+FFFD)
    const hasNonUtf8Chars = /[\uFFFD]/.test(content);
    
    if (hasNonUtf8Chars) {
      console.warn(`⚠️ 警告: 文件 ${filePath} 可能包含非UTF-8字符`);
      stats.warnings++;
    } else {
      stats.checked++;
    }

    // 检查文件是否包含BOM
    const hasBOM = content.charCodeAt(0) === 0xFEFF;
    if (!hasBOM && isCriticalFile(filePath)) {
      console.warn(`⚠️ 警告: 关键文件 ${filePath} 不包含BOM标记`);
      stats.noBom++;
    }
  } catch (err) {
    console.error(`❌ 无法以UTF-8编码读取文件 ${filePath}:`, err);
    stats.errors++;
  }
}

// 将文件转换为UTF-8编码
function convertToUtf8(filePath, stats) {
  try {
    // 尝试以二进制读取
    const buffer = fs.readFileSync(filePath);
    let content = buffer.toString();
    
    // 检查是否需要添加BOM (对于关键文件)
    const hasBOM = buffer.length >= 3 && 
                   buffer[0] === 0xEF && 
                   buffer[1] === 0xBB && 
                   buffer[2] === 0xBF;
                   
    // 处理关键文件
    if (isCriticalFile(filePath)) {
      // 如果是VlabViewerPanel.ts，确保HTML模板包含charset=utf-8
      if (filePath.includes('VlabViewerPanel.ts')) {
        fixVlabViewerEncoding(filePath, content, stats);
      } else {
        // 对其他关键文件，确保使用UTF-8编码
        fs.writeFileSync(filePath, content, { encoding: 'utf8' });
        stats.converted++;
        console.log(`✅ 已将关键文件 ${filePath} 转换为UTF-8编码`);
      }
    } else {
      // 普通文件直接以UTF-8写入
      fs.writeFileSync(filePath, content, { encoding: 'utf8' });
      stats.converted++;
    }
  } catch (err) {
    console.error(`❌ 转换文件 ${filePath} 编码失败:`, err);
    stats.errors++;
  }
}

// 修复VlabViewerPanel.ts文件的编码和meta标签
function fixVlabViewerEncoding(filePath, content, stats) {
  try {
    // 检查并添加meta charset标签
    if (!content.includes('<meta charset="utf-8">') && content.includes('<head>')) {
      content = content.replace(/<head>/g, '<head>\n\t\t<meta charset="utf-8">');
      console.log(`✅ 已向 ${filePath} 添加 UTF-8 meta标签`);
    }
    
    // 确保HTML模板中的中文字符正确显示
    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    stats.converted++;
    console.log(`✅ 已修复 ${filePath} 的编码和meta标签`);
  } catch (err) {
    console.error(`❌ 修复文件 ${filePath} 失败:`, err);
    stats.errors++;
  }
}

// 检查是否为关键文件
function isCriticalFile(filePath) {
  return CRITICAL_FILES.includes(filePath) || 
         CRITICAL_FILES.some(criticalPath => filePath.endsWith(path.basename(criticalPath)));
}

// 打印使用帮助
function printHelp() {
  console.log(`
使用方法:
  node ensure-encoding.js check     - 检查文件编码问题
  node ensure-encoding.js convert   - 转换文件到UTF-8编码
  node ensure-encoding.js help      - 显示此帮助信息
  `);
}

// 主函数
function main() {
  // 初始化统计
  const stats = {
    checked: 0,
    warnings: 0,
    errors: 0,
    noBom: 0,
    converted: 0
  };

  if (command === 'help') {
    printHelp();
    return;
  }

  console.log(`\n=== 开始${command === 'check' ? '检查' : '转换'}文件编码 (${new Date().toLocaleString()}) ===\n`);
  
  // 处理所有目录
  DIRS_TO_PROCESS.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`处理目录: ${dir}`);
      ensureDirExists(dir);
      processDirectory(dir, stats);
    }
  });
  
  // 额外处理关键文件
  if (command === 'convert') {
    console.log('\n处理关键文件...');
    CRITICAL_FILES.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        convertToUtf8(filePath, stats);
      }
    });
  }

  // 打印统计
  console.log('\n=== 处理完成 ===');
  if (command === 'check') {
    console.log(`✓ 已检查文件: ${stats.checked}`);
    console.log(`⚠️ 警告: ${stats.warnings}`);
    console.log(`❌ 错误: ${stats.errors}`);
    console.log(`⚠️ 缺少BOM的关键文件: ${stats.noBom}`);
    
    if (stats.warnings > 0 || stats.noBom > 0) {
      console.log('\n建议运行 "node ensure-encoding.js convert" 修复这些问题');
    }
  } else if (command === 'convert') {
    console.log(`✅ 已转换文件: ${stats.converted}`);
    console.log(`❌ 错误: ${stats.errors}`);
  }
}

// 执行主函数
main();
