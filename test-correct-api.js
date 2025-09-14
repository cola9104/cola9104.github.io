import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = '26822358-21c9-80de-bf43-cf8e6ff838d5';

async function testCorrectAPI() {
  console.log('🔍 测试正确的Notion API连接...');
  console.log('API端点:', `https://api.notion.com/v1/databases/${DATABASE_ID}`);
  console.log('Token:', NOTION_TOKEN ? '✅ 已配置' : '❌ 未配置');
  
  try {
    // 测试数据库信息
    console.log('\n🏗️ 获取数据库信息...');
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': NOTION_TOKEN,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (!dbResponse.ok) {
      const errorData = await dbResponse.json();
      throw new Error(`数据库查询失败: ${errorData.message || dbResponse.statusText}`);
    }

    const dbData = await dbResponse.json();
    console.log('✅ 数据库连接成功！');
    console.log('数据库标题:', dbData.title[0]?.text?.content || 'Untitled');
    console.log('属性列表:');
    Object.keys(dbData.properties).forEach(propName => {
      const prop = dbData.properties[propName];
      console.log(`  - ${propName}: ${prop.type}`);
    });
    
    // 测试数据查询
    console.log('\n📊 查询数据库内容...');
    const queryResponse = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': NOTION_TOKEN,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        page_size: 10
      })
    });

    if (!queryResponse.ok) {
      const errorData = await queryResponse.json();
      throw new Error(`数据查询失败: ${errorData.message || queryResponse.statusText}`);
    }

    const queryData = await queryResponse.json();
    console.log(`✅ 成功获取 ${queryData.results.length} 条记录`);
    
    if (queryData.results.length > 0) {
      console.log('\n📝 内容列表:');
      queryData.results.forEach((page, index) => {
        const title = page.properties['名称']?.title?.[0]?.text?.content || 
                     page.properties['Title']?.title?.[0]?.text?.content || 
                     'Untitled';
        const content = page.properties['文本']?.rich_text?.[0]?.text?.content || 
                       page.properties['Excerpt']?.rich_text?.[0]?.text?.content || 
                       '';
        const created = new Date(page.created_time).toLocaleDateString('zh-CN');
        
        console.log(`${index + 1}. ${title}`);
        console.log(`   内容: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
        console.log(`   创建时间: ${created}`);
        console.log('');
      });
    }
    
    console.log('🎉 Notion API连接完全正常！可以开始设置自动同步了。');
    
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    
    if (error.message.includes('401')) {
      console.log('💡 建议: 检查Notion Token是否正确');
    } else if (error.message.includes('404')) {
      console.log('💡 建议: 检查Database ID是否正确');
    } else if (error.message.includes('403')) {
      console.log('💡 建议: 检查数据库权限设置');
    }
  }
}

// 运行测试
testCorrectAPI();
