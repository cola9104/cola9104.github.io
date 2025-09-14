import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

async function testNotionAPI() {
  console.log('🔍 测试Notion API连接...');
  
  try {
    // 测试数据库查询
    const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': NOTION_TOKEN,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        page_size: 5
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ 成功获取 ${data.results.length} 条记录`);
    
    if (data.results.length > 0) {
      console.log('\n📝 文章列表:');
      data.results.forEach((page, index) => {
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
    
    // 测试数据库信息
    console.log('🏗️ 获取数据库信息...');
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': NOTION_TOKEN,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (dbResponse.ok) {
      const dbData = await dbResponse.json();
      console.log('数据库标题:', dbData.title[0]?.text?.content || 'Untitled');
      console.log('属性列表:');
      Object.keys(dbData.properties).forEach(propName => {
        const prop = dbData.properties[propName];
        console.log(`  - ${propName}: ${prop.type}`);
      });
    }
    
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
testNotionAPI();
