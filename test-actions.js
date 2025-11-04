import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

console.log('🔍 开始测试GitHub Actions配置...');

// 检查环境变量
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_MAIN_PAGE_ID = process.env.NOTION_MAIN_PAGE_ID;

console.log('📋 环境变量检查:');
console.log(`NOTION_TOKEN: ${NOTION_TOKEN ? '✅ 已设置' : '❌ 未设置'}`);
console.log(`NOTION_DATABASE_ID: ${NOTION_DATABASE_ID ? '✅ 已设置' : '❌ 未设置'}`);
console.log(`NOTION_MAIN_PAGE_ID: ${NOTION_MAIN_PAGE_ID ? '✅ 已设置' : '❌ 未设置'}`);

// 检查必要文件
const requiredFiles = [
  'merge-notion-pages-optimized.js',
  'update-sidebar-merged.js',
  'docs/.vitepress/config.mjs',
  '.github/workflows/notion-sync.yml'
];

console.log('\n📁 文件检查:');
for (const file of requiredFiles) {
  const exists = fs.existsSync(file);
  console.log(`${file}: ${exists ? '✅ 存在' : '❌ 缺失'}`);
}

// 测试Notion连接（如果环境变量都设置了）
if (NOTION_TOKEN && NOTION_DATABASE_ID && NOTION_MAIN_PAGE_ID) {
  console.log('\n🔗 测试Notion连接...');

  import('./test-notion-connection.js')
    .then(module => {
      // 如果test-notion-connection.js是可执行的
      console.log('✅ Notion连接测试脚本已准备就绪');
    })
    .catch(error => {
      console.log('⚠️ Notion连接测试脚本加载失败:', error.message);
    });
} else {
  console.log('\n❌ 环境变量未完全设置，跳过Notion连接测试');
}

console.log('\n📝 建议的GitHub Actions配置步骤:');
console.log('1. 进入GitHub仓库 → Settings → Secrets and variables → Actions');
console.log('2. 添加以下Repository secrets:');
console.log('   - NOTION_TOKEN');
console.log('   - NOTION_DATABASE_ID');
console.log('   - NOTION_MAIN_PAGE_ID');
console.log('3. 推送代码后会自动触发GitHub Actions');
console.log('4. 或者在Actions页面手动触发workflow');

export default function testConfig() {
  return {
    envVars: {
      notionToken: !!NOTION_TOKEN,
      notionDatabaseId: !!NOTION_DATABASE_ID,
      notionMainPageId: !!NOTION_MAIN_PAGE_ID
    },
    files: requiredFiles.map(file => ({
      name: file,
      exists: fs.existsSync(file)
    }))
  };
}