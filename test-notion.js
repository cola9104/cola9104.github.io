import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 创建Notion客户端
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

async function testNotionConnection() {
  console.log('🔍 测试Notion API连接...');
  console.log('Token:', process.env.NOTION_TOKEN ? '✅ 已配置' : '❌ 未配置');
  console.log('Database ID:', DATABASE_ID ? '✅ 已配置' : '❌ 未配置');
  
  try {
    // 测试数据库查询
    console.log('\n📊 查询数据库...');
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      page_size: 5
    });
    
    console.log(`✅ 成功获取 ${response.results.length} 条记录`);
    
    if (response.results.length > 0) {
      console.log('\n📝 文章列表:');
      response.results.forEach((page, index) => {
        const title = page.properties.Title?.title?.[0]?.text?.content || 'Untitled';
        const status = page.properties.Status?.select?.name || 'Unknown';
        const created = new Date(page.created_time).toLocaleDateString('zh-CN');
        
        console.log(`${index + 1}. ${title}`);
        console.log(`   状态: ${status}`);
        console.log(`   创建时间: ${created}`);
        console.log('');
      });
    } else {
      console.log('📭 数据库中没有找到文章');
    }
    
    // 测试数据库结构
    console.log('🏗️ 数据库结构:');
    const database = await notion.databases.retrieve({
      database_id: DATABASE_ID
    });
    
    console.log('属性列表:');
    Object.keys(database.properties).forEach(propName => {
      const prop = database.properties[propName];
      console.log(`  - ${propName}: ${prop.type}`);
    });
    
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    
    if (error.code === 'unauthorized') {
      console.log('💡 建议: 检查Notion Token是否正确');
    } else if (error.code === 'object_not_found') {
      console.log('💡 建议: 检查Database ID是否正确');
    } else if (error.code === 'validation_error') {
      console.log('💡 建议: 检查数据库权限设置');
    }
  }
}

// 运行测试
testNotionConnection();
