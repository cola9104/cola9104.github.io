import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

async function syncNotionToPublic() {
  try {
    console.log('🔄 开始同步Notion数据到public目录...\n');

    // 1. 查询数据库中的所有页面
    console.log('📝 查询数据库中的所有页面...');
    const queryResponse = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': NOTION_TOKEN,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        page_size: 100,
        sorts: [
          {
            timestamp: 'last_edited_time',
            direction: 'descending'
          }
        ]
      })
    });

    if (!queryResponse.ok) {
      const errorText = await queryResponse.text();
      throw new Error(`页面查询失败: ${queryResponse.status} - ${errorText}`);
    }

    const queryData = await queryResponse.json();
    console.log(`✅ 找到 ${queryData.results.length} 个页面\n`);

    // 2. 转换数据格式为API响应格式
    const results = queryData.results.map(page => {
      // 提取标题
      const title = page.properties['名称']?.title?.[0]?.text?.content ||
                   page.properties['Title']?.title?.[0]?.text?.content ||
                   'Untitled';

      // 提取内容/摘要
      const content = page.properties['文本']?.rich_text?.[0]?.text?.content ||
                     page.properties['Excerpt']?.rich_text?.[0]?.text?.content ||
                     page.properties['Content']?.rich_text?.[0]?.text?.content ||
                     '';

      // 提取标签
      const tags = page.properties['Tags']?.multi_select?.map(tag => tag.name) ||
                  page.properties['标签']?.multi_select?.map(tag => tag.name) ||
                  ['未分类'];

      return {
        id: page.id,
        title: title,
        slug: `post-${page.id}`,
        excerpt: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        tags: tags,
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
        cover: page.cover?.external?.url || page.cover?.file?.url || null,
        url: page.url,
        // 保留原始属性数据以供调试
        properties: page.properties
      };
    });

    // 3. 保存到public目录
    const outputData = {
      success: true,
      results: results,
      posts: results, // 兼容性：同时提供 results 和 posts 字段
      total: results.length,
      syncTime: new Date().toISOString(),
      message: 'Notion data synced successfully'
    };

    // 确保目录存在
    const publicDir = path.join(process.cwd(), 'docs', 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const outputPath = path.join(publicDir, 'notion-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

    console.log('✅ 同步数据已保存到 docs/public/notion-data.json');
    console.log(`📊 共同步 ${results.length} 篇文章`);
    console.log('');

    // 显示前3篇文章
    console.log('📄 最新文章（前3篇）:');
    results.slice(0, 3).forEach((post, index) => {
      console.log(`  ${index + 1}. ${post.title}`);
      console.log(`     标签: ${post.tags.join(', ')}`);
      console.log(`     最后编辑: ${new Date(post.lastEditedTime).toLocaleString('zh-CN')}`);
      console.log('');
    });

    console.log('🎉 Notion 数据同步完成！');

  } catch (error) {
    console.error('❌ 同步失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

syncNotionToPublic();
