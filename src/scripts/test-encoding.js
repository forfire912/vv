/**
 * 字符编码测试工具
 * 用于检查项目中的关键文件是否正确使用UTF-8编码
 * 以确保中文字符在VSIX插件中正确显示
 * 
 * 更新日期: 2025年7月16日
 */
const fs = require('fs');
const path = require('path');

// 需要测试的关键文件列表
const filesToTest = [
  { 
    path: path.join(__dirname, '..', '..', 'package.json'), 
    name: 'package.json',
    check: (content) => {
      try {
        const pkg = JSON.parse(content);
        console.log(`  📦 名称: ${pkg.name}`);
        console.log(`  📝 描述: "${pkg.description}"`);
        return !pkg.description.includes('�');
      } catch (e) {
        console.error(`  ❌ JSON解析失败: ${e.message}`);
        return false;
      }
    }
  },
  { 
    path: path.join(__dirname, '..', '..', 'README.md'), 
    name: 'README.md',
    check: (content) => {
      console.log(`  📄 前50个字符: "${content.substring(0, 50)}..."`);
      return !content.includes('�');
    }
  },
  { 
    path: path.join(__dirname, '..', 'views', 'VlabViewerPanel.ts'), 
    name: 'VlabViewerPanel.ts',
    check: (content) => {
      const hasCharsetMeta = content.includes('<meta charset="UTF-8">') || 
                            content.includes('<meta charset="utf-8">');
      console.log(`  🌐 HTML模板${hasCharsetMeta ? '包含' : '不包含'}charset meta标签`);
      return hasCharsetMeta && !content.includes('�');
    }
  },
  { 
    path: path.join(__dirname, '..', '..', 'webpack.config.js'), 
    name: 'webpack.config.js',
    check: (content) => {
      const hasCharsetConfig = content.includes('charset') && 
                              content.match(/charset\s*:\s*(true|'utf-?8')/i);
      console.log(`  🔧 webpack${hasCharsetConfig ? '包含' : '不包含'}charset配置`);
      return hasCharsetConfig;
    }
  }
];

// 包含中文字符的测试字符串
const testChars = '测试中文字符显示 - 验证编码';

// 写入并读取测试文件，验证编码一致性
function runFileWriteTest() {
  console.log('\n=== 文件写入测试 ===');
  
  try {
    // 确保dist目录存在
    const distDir = path.join(__dirname, '..', '..', 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    
    // 写入测试文件
    const testPath = path.join(distDir, 'encoding-test.txt');
    fs.writeFileSync(testPath, testChars, 'utf8');
    console.log(`✅ 测试文件已写入: ${testPath}`);
    
    // 读取测试文件
    const readContent = fs.readFileSync(testPath, 'utf8');
    console.log(`📄 读取内容: "${readContent}"`);
    
    // 验证内容一致
    const isMatch = testChars === readContent;
    console.log(`${isMatch ? '✅ 通过' : '❌ 失败'}: 写入与读取内容${isMatch ? '一致' : '不一致'}`);
    
    return isMatch;
  } catch (error) {
    console.error(`❌ 文件测试失败: ${error.message}`);
    return false;
  }
}

// 测试单个文件的编码
function testFile(fileInfo) {
  console.log(`\n测试文件: ${fileInfo.name}`);
  
  try {
    if (!fs.existsSync(fileInfo.path)) {
      console.error(`  ❌ 文件不存在: ${fileInfo.path}`);
      return false;
    }
    
    // 读取文件内容
    const content = fs.readFileSync(fileInfo.path, 'utf8');
    
    // 执行特定的文件检查
    const passed = fileInfo.check(content);
    
    console.log(`  ${passed ? '✅ 通过' : '❌ 失败'}: 编码检查${passed ? '正常' : '可能有问题'}`);
    return passed;
  } catch (error) {
    console.error(`  ❌ 检查失败: ${error.message}`);
    return false;
  }
}

// 运行所有测试
function runAllTests() {
  console.log('=== 字符编码测试工具 ===');
  console.log(`测试中文字符串: "${testChars}"`);
  
  let allPassed = true;
  let results = [];
  
  // 测试所有关键文件
  filesToTest.forEach(fileInfo => {
    const passed = testFile(fileInfo);
    results.push({ name: fileInfo.name, passed });
    if (!passed) allPassed = false;
  });
  
  // 运行文件写入测试
  const writeTestPassed = runFileWriteTest();
  if (!writeTestPassed) allPassed = false;
  
  // 打印测试结果摘要
  console.log('\n=== 测试结果摘要 ===');
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
  });
  console.log(`${writeTestPassed ? '✅' : '❌'} 文件写入测试`);
  
  console.log('\n=== 最终结果 ===');
  if (allPassed) {
    console.log('✅ 所有测试通过！字符编码配置正确。');
    return 0;
  } else {
    console.error('❌ 测试失败！请修复上述问题以确保正确的字符编码。');
    console.log('提示: 运行 "node src/scripts/ensure-encoding.js convert" 可能能够修复这些问题。');
    return 1;
  }
}

// 执行测试并设置退出码
process.exit(runAllTests());
