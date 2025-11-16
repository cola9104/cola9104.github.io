import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN || 'ntn_Z91829129697EenwSBwmKQB1xdPOEjLK2i46iTzr9gf572';
const PAGE_ID = '2682235821c980f5b1d1cc8fedd541b6'; // 去除连字符

async function getNotionInfo() {
  try {
    console.log('🔍 正在查询 Notion 信息...\n');

    // 1. 获取页面信息
    console.log('📄 获取页面信息...');
    const pageResponse = await fetch(`https://api.notion.com/v1/pages/${PAGE_ID}`, {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (!pageResponse.ok) {
      const error = await pageResponse.text();
      console.error(`❌ 页面查询失败: ${pageResponse.status}`, error);
    } else {
      const pageData = await pageResponse.json();
      console.log('✅ 页面信息:');
      console.log(`  - ID: ${pageData.id}`);
      console.log(`  - 对象类型: ${pageData.object}`);
      if (pageData.parent) {
        console.log(`  - 父级类型: ${pageData.parent.type}`);
        if (pageData.parent.database_id) {
          console.log(`  - 📊 所属数据库ID: ${pageData.parent.database_id}`);
          console.log(`  - 📊 格式化的数据库ID: ${pageData.parent.database_id.replace(/-/g, '')}`);
        }
      }
      console.log('');
    }

    // 2. 尝试搜索数据库
    console.log('🔍 搜索可用的数据库...');
    const searchResponse = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filter: {
          property: 'object',
          value: 'database'
        }
      })
    });

    if (!searchResponse.ok) {
      const error = await searchResponse.text();
      console.error(`❌ 搜索失败: ${searchResponse.status}`, error);
    } else {
      const searchData = await searchResponse.json();
      console.log(`✅ 找到 ${searchData.results.length} 个数据库:\n`);

      searchData.results.forEach((db, index) => {
        console.log(`数据库 ${index + 1}:`);
        console.log(`  - 标题: ${db.title?.[0]?.text?.content || '(无标题)'}`);
        console.log(`  - ID: ${db.id}`);
        console.log(`  - 格式化ID: ${db.id.replace(/-/g, '')}`);
        console.log('');
      });

      if (searchData.results.length > 0) {
        console.log('\n📋 配置建议:');
        console.log('在 .env 文件中使用以下配置:\n');
        const firstDb = searchData.results[0];
        console.log(`NOTION_DATABASE_ID=${firstDb.id.replace(/-/g, '')}`);
        console.log(`NOTION_MAIN_PAGE_ID=${PAGE_ID}`);
      }
    }

  } catch (error) {
    console.error('❌ 发生错误:', error.message);
  }
}

getNotionInfo();
