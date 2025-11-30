import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_MAIN_PAGE_ID = process.env.NOTION_MAIN_PAGE_ID;

// 获取页面块内容
async function getPageBlocks(pageId) {
  try {
    const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HTTP ${response.status}: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`获取页面块失败 ${pageId}:`, error.message);
    return [];
  }
}

// 生成URL友好的别名
function generateSlug(title) {
  return title
    .replace(/[^\w\s\u4e00-\u9fff-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
    || 'untitled';
}

// 提取块内容为Markdown
function extractBlockContent(block) {
  switch (block.type) {
    case 'paragraph':
      return block.paragraph?.rich_text?.map(text => text.plain_text).join('') || '';

    case 'heading_1':
      return `# ${block.heading_1?.rich_text?.map(text => text.plain_text).join('') || ''}`;

    case 'heading_2':
      return `## ${block.heading_2?.rich_text?.map(text => text.plain_text).join('') || ''}`;

    case 'heading_3':
      return `### ${block.heading_3?.rich_text?.map(text => text.plain_text).join('') || ''}`;

    case 'bulleted_list_item':
      return `- ${block.bulleted_list_item?.rich_text?.map(text => text.plain_text).join('') || ''}`;

    case 'numbered_list_item':
      return `1. ${block.numbered_list_item?.rich_text?.map(text => text.plain_text).join('') || ''}`;

    case 'code':
      const code = block.code?.rich_text?.map(text => text.plain_text).join('') || '';
      const language = block.code?.language || '';
      return `\`\`\`${language}\n${code}\n\`\`\``;

    case 'quote':
      return `> ${block.quote?.rich_text?.map(text => text.plain_text).join('') || ''}`;

    default:
      return '';
  }
}

// 递归创建页面及其子页面
async function createNestedPages(pageId, parentPath, depth = 0) {
  const indent = '  '.repeat(depth);

  try {
    // 获取页面块
    const blocks = await getPageBlocks(pageId);

    // 分离子页面和内容块
    const childPages = blocks.filter(block => block.type === 'child_page');
    const contentBlocks = blocks.filter(block => block.type !== 'child_page');

    // 提取内容
    let content = '';
    for (const block of contentBlocks) {
      const blockContent = extractBlockContent(block);
      if (blockContent) {
        content += blockContent + '\n\n';
      }
    }

    // 如果当前路径是docs目录，创建index.md
    const indexPath = path.join(parentPath, 'index.md');
    if (!fs.existsSync(parentPath)) {
      fs.mkdirSync(parentPath, { recursive: true });
    }

    // 生成index.md内容
    const pageName = path.basename(parentPath);
    const frontmatter = `---
layout: page
title: ${pageName}
---

`;

    const indexContent = frontmatter + (content || `# ${pageName}\n\n欢迎访问${pageName}。\n`);
    fs.writeFileSync(indexPath, indexContent, 'utf-8');
    console.log(`${indent}✅ 创建: ${indexPath}`);

    // 递归处理子页面
    for (const childPage of childPages) {
      const childTitle = childPage.child_page.title;
      const childSlug = generateSlug(childTitle);
      const childPath = path.join(parentPath, childSlug);

      console.log(`${indent}📁 处理子页面: ${childTitle}`);
      await createNestedPages(childPage.id, childPath, depth + 1);
    }

  } catch (error) {
    console.error(`${indent}❌ 创建页面失败:`, error.message);
  }
}

// 主函数
async function main() {
  console.log('🚀 开始创建多级子页面...\n');

  try {
    // 获取主页面的子页面
    const mainBlocks = await getPageBlocks(NOTION_MAIN_PAGE_ID);
    const topLevelPages = mainBlocks.filter(block => block.type === 'child_page');

    console.log(`📄 找到 ${topLevelPages.length} 个顶级分类\n`);

    // 处理每个顶级分类
    for (const page of topLevelPages) {
      const title = page.child_page.title;

      // 跳过关于页面
      if (title === '关于' || title === '首页') {
        continue;
      }

      console.log(`\n📂 处理顶级分类: ${title}`);

      // 创建顶级目录
      const topLevelPath = path.join('docs', title);
      await createNestedPages(page.id, topLevelPath, 1);
    }

    console.log('\n\n🎉 多级子页面创建完成！');

  } catch (error) {
    console.error('❌ 创建失败:', error.message);
    process.exit(1);
  }
}

// 运行
if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  main();
}
