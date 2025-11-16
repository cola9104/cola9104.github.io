import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';

dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const MAIN_PAGE_ID = process.env.NOTION_MAIN_PAGE_ID;

async function syncNotionData() {
  try {
    console.log('🔄 开始同步Notion数据...\n');

    // 1. 获取数据库结构
    console.log('📊 获取数据库结构...');
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}`, {
      headers: {
        'Authorization': NOTION_TOKEN,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (!dbResponse.ok) {
      throw new Error(`数据库查询失败: ${dbResponse.status} ${dbResponse.statusText}`);
    }

    const dbData = await dbResponse.json();
    console.log(`✅ 数据库: ${dbData.title[0]?.text?.content || 'Untitled'}`);
    console.log(`📋 可用属性:`, Object.keys(dbData.properties).join(', '));
    console.log('');

    // 2. 查询所有页面（不使用过滤器）
    console.log('📝 查询数据库中的所有页面...');
    const queryResponse = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': NOTION_TOKEN,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        page_size: 100
      })
    });

    if (!queryResponse.ok) {
      const errorText = await queryResponse.text();
      throw new Error(`页面查询失败: ${queryResponse.status} - ${errorText}`);
    }

    const queryData = await queryResponse.json();
    console.log(`✅ 找到 ${queryData.results.length} 个页面\n`);

    // 3. 提取页面信息
    const pages = queryData.results.map(page => {
      // 尝试从不同可能的属性中提取标题
      let title = 'Untitled';

      // 常见的标题属性名称
      const titleProps = ['Title', 'Name', '标题', '名称', 'title', 'name'];
      for (const prop of titleProps) {
        if (page.properties[prop]?.title?.[0]?.text?.content) {
          title = page.properties[prop].title[0].text.content;
          break;
        }
      }

      return {
        id: page.id,
        title: title,
        created_time: page.created_time,
        last_edited_time: page.last_edited_time,
        url: page.url,
        properties: Object.keys(page.properties)
      };
    });

    // 显示前5个页面
    console.log('📄 页面列表（前5个）:');
    pages.slice(0, 5).forEach((page, index) => {
      console.log(`  ${index + 1}. ${page.title}`);
      console.log(`     ID: ${page.id}`);
      console.log(`     属性: ${page.properties.join(', ')}`);
      console.log('');
    });

    // 4. 获取主页面的子页面
    if (MAIN_PAGE_ID) {
      console.log('📑 获取主页面的子页面...');
      const childrenResponse = await fetch(`https://api.notion.com/v1/blocks/${MAIN_PAGE_ID}/children`, {
        headers: {
          'Authorization': NOTION_TOKEN,
          'Notion-Version': '2022-06-28'
        }
      });

      if (childrenResponse.ok) {
        const childrenData = await childrenResponse.json();
        const childPages = childrenData.results.filter(block => block.type === 'child_page');
        console.log(`✅ 找到 ${childPages.length} 个子页面`);

        childPages.forEach((child, index) => {
          console.log(`  ${index + 1}. ${child.child_page?.title || 'Untitled'}`);
        });
        console.log('');
      }
    }

    // 5. 保存同步数据
    const syncData = {
      lastSync: new Date().toISOString(),
      database: {
        id: DATABASE_ID,
        title: dbData.title[0]?.text?.content || 'Untitled',
        properties: Object.keys(dbData.properties)
      },
      pages: pages,
      totalPages: pages.length
    };

    // 确保目录存在
    if (!fs.existsSync('docs/.vitepress')) {
      fs.mkdirSync('docs/.vitepress', { recursive: true });
    }

    fs.writeFileSync('docs/.vitepress/notion-sync.json', JSON.stringify(syncData, null, 2));
    console.log('✅ 同步数据已保存到 docs/.vitepress/notion-sync.json');
    console.log('');

    // 6. 生成 markdown 文件
    console.log('📝 生成页面 markdown 文件...');

    for (const page of pages) {
      const fileName = page.title
        .replace(/[^\w\u4e00-\u9fa5]/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase();

      const content = `---
title: ${page.title}
notionId: ${page.id}
lastSync: ${new Date().toISOString()}
---

# ${page.title}

> 本页面同步自 Notion
>
> 最后更新: ${new Date(page.last_edited_time).toLocaleString('zh-CN')}
>
> [在 Notion 中查看](${page.url})

<!-- Notion 内容将在这里显示 -->

<script setup>
import { ref, onMounted } from 'vue'

const notionContent = ref('')

onMounted(async () => {
  // 这里可以添加加载 Notion 内容的逻辑
  notionContent.value = '正在加载 Notion 内容...'
})
</script>
`;

      const dirPath = 'docs/notion-pages';
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(`${dirPath}/${fileName}.md`, content);
    }

    console.log(`✅ 已生成 ${pages.length} 个页面文件到 docs/notion-pages/`);
    console.log('');
    console.log('🎉 Notion 数据同步完成！');

  } catch (error) {
    console.error('❌ 同步失败:', error.message);
    process.exit(1);
  }
}

syncNotionData();
