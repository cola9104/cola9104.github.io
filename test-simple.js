import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

console.log('🔍 环境变量测试:');
console.log('NOTION_TOKEN:', process.env.NOTION_TOKEN ? '✅ 已配置' : '❌ 未配置');
console.log('NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID ? '✅ 已配置' : '❌ 未配置');

if (process.env.NOTION_TOKEN) {
  console.log('Token 前缀:', process.env.NOTION_TOKEN.startsWith('Bearer') ? '✅ Bearer格式' : '❌ 非Bearer格式');
}

console.log('\n📋 完整配置:');
console.log('Token:', process.env.NOTION_TOKEN);
console.log('Database ID:', process.env.NOTION_DATABASE_ID);
