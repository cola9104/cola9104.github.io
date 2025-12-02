import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const MAIN_PAGE_ID = process.env.NOTION_MAIN_PAGE_ID;

if (!NOTION_TOKEN) {
  console.error('❌ 错误: 未找到 NOTION_TOKEN 环境变量');
  process.exit(1);
}

if (!MAIN_PAGE_ID) {
  console.error('❌ 错误: 未找到 NOTION_MAIN_PAGE_ID 环境变量');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN.replace('Bearer ', '') });
const n2m = new NotionToMarkdown({ notionClient: notion });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 1;
        console.warn(`⚠️ Rate limited. Waiting ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(1000 * (i + 1));
    }
  }
}

async function getPageDetails(pageId) {
  const response = await fetchWithRetry(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      'Authorization': NOTION_TOKEN,
      'Notion-Version': '2022-06-28'
    }
  });
  return await response.json();
}

async function getPageChildren(pageId) {
  const response = await fetchWithRetry(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
    headers: {
      'Authorization': NOTION_TOKEN,
      'Notion-Version': '2022-06-28'
    }
  });
  const data = await response.json();
  return data.results.filter(block => block.type === 'child_page');
}

async function getPageMarkdown(pageId) {
  try {
    let mdblocks = await n2m.pageToMarkdown(pageId);
    // 只保留当前页面内容，过滤掉子页面引用
    mdblocks = mdblocks.filter(b => b.type !== 'child_page');
    const mdString = n2m.toMarkdownString(mdblocks);
    return mdString.parent;
  } catch (err) {
    console.error(`❌ Error converting page ${pageId} to markdown: ${err.message}`);
    return '';
  }
}

async function buildPageTree(pageId, depth = 0) {
  if (depth > 3) return []; // Prevent infinite recursion or too deep

  console.log(`${'  '.repeat(depth)}📂 Scanning page children: ${pageId}`);
  
  const children = await getPageChildren(pageId);
  const nodes = [];
  
  for (const child of children) {
    await sleep(200); // Be nice to API
    
    try {
      const details = await getPageDetails(child.id);
      const title = child.child_page.title;
      
      console.log(`${'  '.repeat(depth + 1)}📄 Found: ${title}`);
      
      // Fetch markdown content for the page
      const markdownContent = await getPageMarkdown(child.id);

      const node = {
        id: child.id,
        title: title,
        created_time: details.created_time,
        last_edited_time: details.last_edited_time,
        url: details.url,
        content: markdownContent, // Store markdown content
        items: await buildPageTree(child.id, depth + 1)
      };
      
      nodes.push(node);
    } catch (err) {
      console.error(`${'  '.repeat(depth + 1)}❌ Error processing ${child.id}: ${err.message}`);
    }
  }
  
  return nodes;
}

function flattenPages(nodes, list = []) {
  for (const node of nodes) {
    list.push(node);
    if (node.items && node.items.length > 0) {
      flattenPages(node.items, list);
    }
  }
  return list;
}

async function syncNotionData() {
  try {
    console.log('🔄 开始同步Notion数据 (递归模式)...\n');

    // 1. Get Main Page Info
    const mainPageDetails = await getPageDetails(MAIN_PAGE_ID);
    const mainPageTitle = mainPageDetails.properties?.title?.title?.[0]?.text?.content || 'Notion Blog';
    console.log(`✅ 主页面: ${mainPageTitle} (${MAIN_PAGE_ID})\n`);

    // 2. Build Tree
    console.log('🌳 构建页面树结构...');
    const pageTree = await buildPageTree(MAIN_PAGE_ID);
    
    // 3. Save Sync Data
    const syncData = {
      lastSync: new Date().toISOString(),
      source: {
        type: 'page_tree',
        mainPageId: MAIN_PAGE_ID,
        title: mainPageTitle
      },
      pages: pageTree, // This is the nested structure
      stats: {
        topLevel: pageTree.length,
        total: flattenPages(pageTree).length
      }
    };

    const vitepressDir = 'docs/.vitepress';
    if (!fs.existsSync(vitepressDir)) {
      fs.mkdirSync(vitepressDir, { recursive: true });
    }

    fs.writeFileSync(path.join(vitepressDir, 'notion-sync.json'), JSON.stringify(syncData, null, 2));
    console.log(`\n✅ 结构数据已保存 (Total pages: ${syncData.stats.total})`);

    // 4. Generate Markdown Files (Flat list for now, but unique filenames might be needed if titles clash)
    console.log('\n📝 生成 Markdown 文件...');
    const dirPath = 'docs/notion-pages';
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const allPages = flattenPages(pageTree);
    
    for (const page of allPages) {
      const safeTitle = page.title
        .replace(/[^\w\u4e00-\u9fa5]/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase();
        
      // Use ID suffix if needed to avoid collision, but for now keep simple
      const fileName = safeTitle; 
      
        // Fetch page content
        const pageContent = await getPageMarkdown(page.id);

        const content = `---
title: ${page.title}
notionId: ${page.id}
lastSync: ${new Date().toISOString()}
layout: doc
---

${pageContent}
`;

      fs.writeFileSync(path.join(dirPath, `${fileName}.md`), content);
    }
    console.log(`✅ 已生成 ${allPages.length} 个页面文件`);

    // 5. Update Homepage Features (SKIPPED)
    // console.log('\n🏠 更新首页特性...');
    // ... skipping features generation ...

    const homepagePath = 'docs/index.md';
    if (fs.existsSync(homepagePath)) {
        // 6. Update Homepage Body with Notion Main Page Content and Sitemap
        console.log('📝 更新首页正文...');
        
        // Fetch Main Page Content (Markdown)
        const mainPageMarkdown = await getPageMarkdown(MAIN_PAGE_ID);

        const newBodyContent = `
${mainPageMarkdown}
`;
        
        // Create clean homepage content with Hero section
        const newContent = `---
layout: home

hero:
  name: "${mainPageTitle}"
  tagline: "分享实战经验，探索安全技术"
  actions:
    - theme: brand
      text: 开始阅读
      link: /notion-pages/网络安全
    - theme: alt
      text: 关于我
      link: /notion-pages/关于
---
${newBodyContent}`;

        fs.writeFileSync(homepagePath, newContent);
        console.log('✅ 首页正文已更新（仅保留 Notion 内容）');

      } else {
        console.warn('⚠️ 首页 docs/index.md 不存在，跳过更新');
      }

    console.log('\n🎉 同步完成！');

  } catch (error) {
    console.error('\n❌ 致命错误:', error);
    process.exit(1);
  }
}

syncNotionData();
