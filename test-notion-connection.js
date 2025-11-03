import dotenv from 'dotenv';
import fetch from 'node-fetch';

// 加载环境变量
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_MAIN_PAGE_ID = process.env.NOTION_MAIN_PAGE_ID;

console.log('🔍 开始测试Notion连接...');

// 验证环境变量
if (!NOTION_TOKEN) {
  console.error('❌ NOTION_TOKEN 未设置');
  process.exit(1);
}

if (!NOTION_DATABASE_ID) {
  console.error('❌ NOTION_DATABASE_ID 未设置');
  process.exit(1);
}

if (!NOTION_MAIN_PAGE_ID) {
  console.log('⚠️ NOTION_MAIN_PAGE_ID 未设置，将使用默认值');
}

async function testNotionConnection() {
  try {
    // 测试数据库连接
    console.log('📊 测试数据库连接...');
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}`, {
      headers: {
        'Authorization': NOTION_TOKEN,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (!dbResponse.ok) {
      throw new Error(`数据库连接失败: ${dbResponse.status} ${dbResponse.statusText}`);
    }

    const dbData = await dbResponse.json();
    console.log(`✅ 数据库连接成功: ${dbData.title[0]?.text?.content || 'Untitled'}`);

    // 测试主页面连接
    if (NOTION_MAIN_PAGE_ID) {
      console.log('📄 测试主页面连接...');
      const pageResponse = await fetch(`https://api.notion.com/v1/pages/${NOTION_MAIN_PAGE_ID}`, {
        headers: {
          'Authorization': NOTION_TOKEN,
          'Notion-Version': '2022-06-28'
        }
      });

      if (!pageResponse.ok) {
        throw new Error(`主页面连接失败: ${pageResponse.status} ${pageResponse.statusText}`);
      }

      const pageData = await pageResponse.json();
      console.log(`✅ 主页面连接成功`);
    }

    // 测试数据库查询
    console.log('🔍 测试数据库查询...');
    const queryResponse = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': NOTION_TOKEN,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filter: {
          property: 'Status',
          select: {
            equals: 'Published'
          }
        },
        sorts: [
          {
            property: 'Created',
            direction: 'descending'
          }
        ],
        page_size: 5
      })
    });

    if (!queryResponse.ok) {
      throw new Error(`数据库查询失败: ${queryResponse.status} ${queryResponse.statusText}`);
    }

    const queryData = await queryResponse.json();
    console.log(`✅ 数据库查询成功，找到 ${queryData.results.length} 篇已发布文章`);

    if (queryData.results.length > 0) {
      console.log('📝 示例文章:');
      queryData.results.forEach((page, index) => {
        const title = page.properties.Title?.title?.[0]?.text?.content || 'Untitled';
        const status = page.properties.Status?.select?.name || 'Unknown';
        console.log(`  ${index + 1}. ${title} (${status})`);
      });
    }

    console.log('🎉 所有测试通过！Notion连接正常。');
    return true;

  } catch (error) {
    console.error('❌ 连接测试失败:', error.message);

    // 提供详细的错误信息
    if (error.message.includes('401')) {
      console.error('💡 提示: 请检查NOTION_TOKEN是否正确');
    } else if (error.message.includes('404')) {
      console.error('💡 提示: 请检查NOTION_DATABASE_ID或NOTION_MAIN_PAGE_ID是否正确');
    } else if (error.message.includes('403')) {
      console.error('💡 提示: 请检查Notion集成权限设置');
    }

    return false;
  }
}

// 运行测试
testNotionConnection().then(success => {
  process.exit(success ? 0 : 1);
});