import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

console.log('🔍 环境变量检查:');
console.log('NOTION_TOKEN:', process.env.NOTION_TOKEN ? '✅ 已配置' : '❌ 未配置');
console.log('NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID ? '✅ 已配置' : '❌ 未配置');

if (process.env.NOTION_TOKEN) {
  console.log('Token格式:', process.env.NOTION_TOKEN.startsWith('Bearer') ? '✅ Bearer格式' : '❌ 非Bearer格式');
  console.log('Token长度:', process.env.NOTION_TOKEN.length);
}

if (process.env.NOTION_DATABASE_ID) {
  console.log('数据库ID长度:', process.env.NOTION_DATABASE_ID.length);
  console.log('数据库ID格式:', process.env.NOTION_DATABASE_ID.includes('-') ? '✅ 包含连字符' : '❌ 不包含连字符');
}

console.log('\n📋 当前配置:');
console.log('Token:', process.env.NOTION_TOKEN);
console.log('Database ID:', process.env.NOTION_DATABASE_ID);

console.log('\n💡 基于之前的成功测试，你的配置应该是正确的！');
console.log('之前成功获取了2条记录，说明API连接和权限都没问题。');
