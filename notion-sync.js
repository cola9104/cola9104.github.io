import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_MAIN_PAGE_ID = process.env.NOTION_MAIN_PAGE_ID;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// ✅ 改进：环境变量验证
if (!NOTION_TOKEN) {
  console.error('❌ 错误: NOTION_TOKEN 未设置');
  console.error('📝 请在 .env 文件中配置 NOTION_TOKEN');
  console.error('💡 获取方式: https://www.notion.so/my-integrations\n');
  process.exit(1);
}

if (!NOTION_MAIN_PAGE_ID) {
  console.error('❌ 错误: NOTION_MAIN_PAGE_ID 未设置');
  console.error('📝 请在 .env 文件中配置 NOTION_MAIN_PAGE_ID');
  console.error('💡 这是你的 Notion 主页面 ID\n');
  process.exit(1);
}

console.log('✅ 环境变量验证通过');

const CACHE_DIR = path.join(process.cwd(), '.notion-cache');
const PUBLIC_DIR = path.join(process.cwd(), 'docs', 'public');
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

for (const dir of [CACHE_DIR, PUBLIC_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

async function getCache(key) {
  const cacheFile = path.join(CACHE_DIR, `${key}.json`);
  if (fs.existsSync(cacheFile)) {
    const stats = fs.statSync(cacheFile);
    if (Date.now() - stats.mtime.getTime() < CACHE_DURATION) {
      console.log(`[Cache] Using cached data for ${key}`);
      return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    }
  }
  return null;
}

async function setCache(key, data) {
  const cacheFile = path.join(CACHE_DIR, `${key}.json`);
  fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
  console.log(`[Cache] Cached data for ${key}`);
}

async function fetchNotion(url, options = {}) {
  // 确保Token格式正确（自动添加Bearer前缀如果缺失）
  const token = NOTION_TOKEN.startsWith('Bearer ') ? NOTION_TOKEN : `Bearer ${NOTION_TOKEN}`;

  const defaultOptions = {
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    }
  };
  const response = await fetch(url, { ...defaultOptions, ...options });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Notion API error: ${error.message || error.code}`);
  }
  return response.json();
}

async function getDatabasePages() {
  // Skip database sync if NOTION_DATABASE_ID is not configured
  if (!NOTION_DATABASE_ID) {
    console.log('[Skip] NOTION_DATABASE_ID not configured, skipping database sync');
    return [];
  }

  const cacheKey = `database_${NOTION_DATABASE_ID}`;
  const cachedPages = await getCache(cacheKey);
  if (cachedPages) return cachedPages;

  let pages = [], hasMore = true, startCursor;
  while (hasMore) {
    const data = await fetchNotion(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      body: JSON.stringify({ start_cursor: startCursor })
    });
    pages.push(...data.results);
    hasMore = data.has_more;
    startCursor = data.next_cursor;
  }

  await setCache(cacheKey, pages);
  return pages;
}

async function getPageBlocks(pageId) {
  const cacheKey = `blocks_${pageId}`;
  const cachedBlocks = await getCache(cacheKey);
  if (cachedBlocks) return cachedBlocks;

  let blocks = [], hasMore = true, startCursor;
  while (hasMore) {
    const url = `https://api.notion.com/v1/blocks/${pageId}/children` + (startCursor ? `?start_cursor=${startCursor}` : '');
    const data = await fetchNotion(url);
    blocks.push(...data.results);
    hasMore = data.has_more;
    startCursor = data.next_cursor;
  }

  await setCache(cacheKey, blocks);
  return blocks;
}

function getCorrectLink(title) {
  const linkMap = {
    '网络安全': '/网络安全/',
    '渗透测试': '/渗透测试/',
    '漏洞分析': '/漏洞分析/',
    '嵌入式安全': '/嵌入式安全/',
    '编程技术': '/编程技术/',
    'CTF': '/CTF竞赛/'
  };
  return linkMap[title] || `/${title.replace(/\s+/g, '-')}/`;
}

function generateSlug(title) {
  return title
    .replace(/[^\w\s\u4e00-\u9fff-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
    || 'untitled';
}

async function getSubPages(pageId, parentLink) {
    const blocks = await getPageBlocks(pageId);
    const childPages = blocks.filter(block => block.type === 'child_page' && block.child_page?.title);

    const subPages = [];
    for (const childPage of childPages) {
        const title = childPage.child_page.title;
        const link = `${parentLink}${generateSlug(title)}/`;

        // 递归获取子页面的子页面
        const nestedSubPages = await getSubPages(childPage.id, link);

        // 创建子页面数据对象，使用 text 字段以匹配 VitePress 配置
        const subPageData = {
            text: title,
            link,
            collapsible: true  // 添加可折叠属性
        };

        // 如果有嵌套的子页面，添加到 items 字段
        if (nestedSubPages.length > 0) {
            subPageData.items = nestedSubPages;
        }

        subPages.push(subPageData);
    }
    return subPages;
}

async function getNavigation() {
  const cacheKey = 'navigation';
  const cachedNav = await getCache(cacheKey);
  if (cachedNav) return cachedNav;

  const blocks = await getPageBlocks(NOTION_MAIN_PAGE_ID);
  const childPages = blocks.filter(block => block.type === 'child_page' && block.child_page?.title);
  
  const nav = [];
  for (const page of childPages) {
    const title = page.child_page.title;
    const link = getCorrectLink(title);
    const subPages = await getSubPages(page.id, link);
    const navItem = { text: title, link };
    if (subPages.length > 0) {
        navItem.items = subPages;
    }
    nav.push(navItem);
  }

  await setCache(cacheKey, nav);
  return nav;
}

function transformDatabasePages(pages) {
  return pages.map(page => {
    const title = page.properties['名称']?.title?.[0]?.text?.content || 'Untitled';
    const content = page.properties['文本']?.rich_text?.[0]?.text?.content || '';
    const tags = page.properties['Tags']?.multi_select?.map(tag => tag.name) || ['未分类'];
    return {
      id: page.id,
      title,
      excerpt: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
      tags,
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
      url: page.url,
    };
  });
}

async function updateHomepage(nav) {
  const homepagePath = path.join(process.cwd(), 'docs', 'index.md');
  let homepageContent = fs.readFileSync(homepagePath, 'utf-8');

  const features = nav.map(item => ({
    title: item.text,
    details: `探索${item.text}的相关内容和技术分享`,
    link: item.link
  }));

  const featuresMarkdown = features.map(f => `  - title: ${f.title}\n    details: ${f.details}\n    link: ${f.link}`).join('\n');
  const yamlFeaturesRegex = /features:\s*\n(?:  - title: .+\n    details: .+\n    link: .+\n?)+/;
  homepageContent = homepageContent.replace(yamlFeaturesRegex, `features:\n${featuresMarkdown}`);

  fs.writeFileSync(homepagePath, homepageContent, 'utf-8');
  console.log('✅ Homepage updated with new features.');
}

async function main() {
  try {
    console.log('🚀 Starting Notion synchronization...');

    const navigation = await getNavigation();
    const dbPages = await getDatabasePages();

    const transformedPages = transformDatabasePages(dbPages);
    const notionData = {
      success: true,
      posts: transformedPages,
      total: transformedPages.length,
      syncTime: new Date().toISOString(),
    };

    fs.writeFileSync(path.join(PUBLIC_DIR, 'notion-data.json'), JSON.stringify(notionData, null, 2));
    console.log(`✅ Synced ${transformedPages.length} pages to notion-data.json`);

    fs.writeFileSync(path.join(CACHE_DIR, 'navigation.json'), JSON.stringify(navigation, null, 2));
    console.log(`✅ Synced navigation structure.`);

    await updateHomepage(navigation);

    // ✅ 新增：真正获取 Notion 页面内容
    console.log('\n📄 开始获取页面内容...');
    try {
      const syncAllPages = await import('./sync-all-notion-pages.js');
      await syncAllPages.default();
      console.log('✅ 页面内容同步完成');
    } catch (error) {
      console.warn('⚠️  页面内容同步失败:', error.message);
      console.warn('💡 提示: 这可能是因为 sync-all-notion-pages.js 执行失败，但不影响主流程');
    }

    console.log('\n🎉 Notion synchronization complete!');
  } catch (error) {
    console.error('❌ Notion synchronization failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  main();
}