#!/usr/bin/env node
/**
 * 增量同步 Notion 页面
 * 只更新有变化的页面，保留本地修改
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// 加载环境变量
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_MAIN_PAGE_ID = process.env.NOTION_MAIN_PAGE_ID;

// 验证环境变量
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

console.log('✅ 环境变量验证通过\n');

/**
 * 延迟函数（避免 API 限流）
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 计算内容的哈希值（用于检测变化）
 */
function calculateHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * 读取本地文件的哈希记录
 */
function getLocalHashes() {
  const hashFile = 'docs/.vitepress/page-hashes.json';
  try {
    if (fs.existsSync(hashFile)) {
      return JSON.parse(fs.readFileSync(hashFile, 'utf-8'));
    }
  } catch (error) {
    console.warn('⚠️  读取哈希记录失败:', error.message);
  }
  return {};
}

/**
 * 保存本地文件哈希记录
 */
function saveLocalHashes(hashes) {
  const hashFile = 'docs/.vitepress/page-hashes.json';
  try {
    fs.writeFileSync(hashFile, JSON.stringify(hashes, null, 2), 'utf-8');
  } catch (error) {
    console.warn('⚠️  保存哈希记录失败:', error.message);
  }
}

/**
 * 获取页面的所有块
 */
async function getPageBlocks(pageId) {
  const blocks = [];
  let startCursor = undefined;
  let hasMore = true;

  while (hasMore) {
    const url = `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100${startCursor ? `&start_cursor=${startCursor}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': NOTION_TOKEN,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (!response.ok) {
      throw new Error(`获取页面块失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    blocks.push(...data.results);

    hasMore = data.has_more;
    startCursor = data.next_cursor;

    // 避免达到 API 限流
    if (hasMore) {
      await delay(200);
    }
  }

  return blocks;
}

/**
 * 将 Notion 块转换为 Markdown
 */
async function blocksToMarkdown(blocks, indent = 0) {
  let markdown = '';
  const prefix = '  '.repeat(indent);

  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
        const text = extractText(block.paragraph);
        if (text.trim()) {
          markdown += `${prefix}${text}\n\n`;
        }
        break;

      case 'heading_1':
        markdown += `${prefix}# ${extractText(block.heading_1)}\n\n`;
        break;

      case 'heading_2':
        markdown += `${prefix}## ${extractText(block.heading_2)}\n\n`;
        break;

      case 'heading_3':
        markdown += `${prefix}### ${extractText(block.heading_3)}\n\n`;
        break;

      case 'bulleted_list_item':
        markdown += `${prefix}- ${extractText(block.bulleted_list_item)}\n`;
        break;

      case 'numbered_list_item':
        markdown += `${prefix}1. ${extractText(block.numbered_list_item)}\n`;
        break;

      case 'to_do':
        const checked = block.to_do.checked ? 'x' : ' ';
        markdown += `${prefix}- [${checked}] ${extractText(block.to_do)}\n`;
        break;

      case 'quote':
        markdown += `${prefix}> ${extractText(block.quote)}\n\n`;
        break;

      case 'code':
        const code = block.code.code;
        const language = block.code.language || '';
        markdown += `${prefix}\`\`\`${language}\n${code}\n${prefix}\`\`\`\n\n`;
        break;

      case 'divider':
        markdown += `${prefix}---\n\n`;
        break;

      case 'callout':
        const emoji = block.callout.icon?.emoji || '💡';
        markdown += `${prefix}> ${emoji} ${extractText(block.callout)}\n\n`;
        break;

      case 'child_page':
        // 子页面在递归处理中单独生成
        break;

      default:
        // 未知类型，跳过
        break;
    }
  }

  return markdown;
}

/**
 * 提取文本内容并应用格式
 */
function extractText(block) {
  if (!block.text || block.text.length === 0) return '';

  return block.text.map(text => {
    let formatted = text.plain_text;

    if (text.annotations.bold) {
      formatted = `**${formatted}**`;
    }
    if (text.annotations.italic) {
      formatted = `*${formatted}*`;
    }
    if (text.annotations.underline) {
      formatted = `<u>${formatted}</u>`;
    }
    if (text.annotations.code) {
      formatted = `\`${formatted}\``;
    }
    if (text.annotations.strikethrough) {
      formatted = `~~${formatted}~~`;
    }
    if (text.href) {
      formatted = `[${formatted}](${text.href})`;
    }

    return formatted;
  }).join('');
}

/**
 * 获取页面的完整内容
 */
async function getPageContent(pageId, pageTitle) {
  try {
    const blocks = await getPageBlocks(pageId);
    const markdown = await blocksToMarkdown(blocks);
    return markdown;
  } catch (error) {
    console.error(`❌ 获取页面内容失败 ${pageTitle}:`, error.message);
    return '';
  }
}

/**
 * 检查文件是否被本地修改过
 * 注意：如果只在 Notion 上做更改，这个检测可以禁用
 */
function isLocallyModified(filePath, notionHash) {
  // 如果确定只在 Notion 上做更改，直接返回 false
  // 这样可以避免误判，确保 Notion 的更改总是会被同步
  return false;

  /* 如果需要本地修改保护，可以取消下面的注释
  const hashes = getLocalHashes();
  const record = hashes[filePath];

  if (!record) {
    return false; // 新文件，不算本地修改
  }

  // 检查本地文件哈希是否与上次同步的 Notion 哈希不同
  if (record.localHash !== record.notionHash) {
    return true; // 本地已修改
  }

  return false;
  */
}

/**
 * 智能写入文件（只在内容变化时写入）
 */
function smartWriteFile(filePath, content, notionHash) {
  const hashes = getLocalHashes();

  // 检查文件是否存在
  if (fs.existsSync(filePath)) {
    const existingContent = fs.readFileSync(filePath, 'utf-8');
    const existingHash = calculateHash(existingContent);

    // 内容没有变化，跳过
    if (existingHash === notionHash) {
      return 'unchanged';
    }

    // 检查是否被本地修改
    if (isLocallyModified(filePath, hashes[filePath]?.notionHash)) {
      console.log(`  ⚠️  本地已修改，跳过: ${filePath}`);
      return 'skipped';
    }
  }

  // 确保目录存在
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 写入文件
  fs.writeFileSync(filePath, content, 'utf-8');

  // 更新哈希记录
  const localHash = calculateHash(content);
  hashes[filePath] = {
    notionHash,
    localHash,
    lastSync: new Date().toISOString()
  };
  saveLocalHashes(hashes);

  return 'updated';
}

/**
 * 生成单个分类的页面（增量版本）
 */
async function generateCategoryPage(categoryId, categoryTitle, outputDir) {
  try {
    console.log(`\n📚 处理分类: ${categoryTitle}`);

    // 获取分类的子页面
    const blocks = await getPageBlocks(categoryId);
    const childPages = blocks.filter(block => block.type === 'child_page');

    console.log(`  找到 ${childPages.length} 个子页面`);

    // 生成分类首页内容
    let categoryContent = `---
title: ${categoryTitle}
description: ${categoryTitle}相关内容
---

# ${categoryTitle}

`;

    // 添加子页面链接
    if (childPages.length > 0) {
      categoryContent += `## 📑 内容目录\n\n`;
      for (const childPage of childPages) {
        const pageTitle = childPage.child_page.title;
        const slug = pageTitle.replace(/[^\w\u4e00-\u9fff]/g, '-').toLowerCase();
        categoryContent += `- [${pageTitle}](./${slug}/)\n`;
      }
      categoryContent += '\n';
    }

    // 获取分类页面自身的内容
    const categoryMainContent = await blocksToMarkdown(blocks.filter(b => b.type !== 'child_page'));
    if (categoryMainContent.trim()) {
      categoryContent += categoryMainContent;
    }

    // 计算哈希
    const categoryHash = calculateHash(categoryContent);
    const categoryPath = path.join(outputDir, 'index.md');

    // 智能写入分类首页
    const categoryStatus = smartWriteFile(categoryPath, categoryContent, categoryHash);

    if (categoryStatus === 'updated') {
      console.log(`  ✅ 已更新分类首页: ${categoryPath}`);
    } else if (categoryStatus === 'unchanged') {
      console.log(`  ✓ 分类首页未变化: ${categoryPath}`);
    }

    // 生成每个子页面
    let updatedCount = 0;
    for (const childPage of childPages) {
      const pageTitle = childPage.child_page.title;
      const slug = pageTitle.replace(/[^\w\u4e00-\u9fff]/g, '-').toLowerCase();
      const pageDir = path.join(outputDir, slug);

      // 获取子页面内容
      const pageContent = await getPageContent(childPage.id, pageTitle);

      // 生成子页面文件
      const pageMarkdown = `---
title: ${pageTitle}
description: ${pageTitle}
---

# ${pageTitle}

${pageContent}

---

*本页面从 Notion 同步，最后更新: ${new Date().toLocaleString('zh-CN')}*
`;

      const pageHash = calculateHash(pageMarkdown);
      const pagePath = path.join(pageDir, 'index.md');

      // 智能写入子页面
      const pageStatus = smartWriteFile(pagePath, pageMarkdown, pageHash);

      if (pageStatus === 'updated') {
        console.log(`  ✅ 已更新子页面: ${pageTitle}`);
        updatedCount++;
      } else if (pageStatus === 'unchanged') {
        console.log(`  ✓ 子页面未变化: ${pageTitle}`);
      } else if (pageStatus === 'skipped') {
        console.log(`  ⏭️  跳过本地修改的页面: ${pageTitle}`);
      }
    }

    return { total: childPages.length, updated: updatedCount };
  } catch (error) {
    console.error(`❌ 生成分类页面失败 ${categoryTitle}:`, error.message);
    return { total: 0, updated: 0 };
  }
}

/**
 * 主函数 - 增量同步所有页面
 */
async function syncAllPages() {
  try {
    console.log('🚀 开始增量同步 Notion 页面...\n');

    // 获取主页面的所有子页面
    const mainBlocks = await getPageBlocks(NOTION_MAIN_PAGE_ID);
    const mainPages = mainBlocks.filter(block => block.type === 'child_page');

    console.log(`📊 找到 ${mainPages.length} 个顶级分类\n`);

    let totalStats = { total: 0, updated: 0 };
    const categories = [];

    // 处理每个分类
    for (const mainPage of mainPages) {
      const categoryTitle = mainPage.child_page.title;

      // 跳过"关于"页面
      if (categoryTitle === '关于') {
        console.log(`⏭️  跳过: ${categoryTitle}`);
        continue;
      }

      const outputDir = path.join('docs', categoryTitle);
      const stats = await generateCategoryPage(mainPage.id, categoryTitle, outputDir);

      totalStats.total += stats.total;
      totalStats.updated += stats.updated;

      categories.push({
        title: categoryTitle,
        path: `/${categoryTitle}/`,
        pageCount: stats.total,
        updatedCount: stats.updated
      });
    }

    // 生成同步报告
    const report = {
      syncTime: new Date().toISOString(),
      syncType: 'incremental',
      totalCategories: categories.length,
      totalPages: totalStats.total,
      updatedPages: totalStats.updated,
      unchangedPages: totalStats.total - totalStats.updated,
      categories: categories
    };

    fs.writeFileSync('docs/.vitepress/notion-sync-report.json', JSON.stringify(report, null, 2));

    console.log('\n' + '='.repeat(50));
    console.log('🎉 增量同步完成!');
    console.log('='.repeat(50));
    console.log(`📊 总计: ${categories.length} 个分类`);
    console.log(`📄 页面: ${totalStats.total} 个总数, ${totalStats.updated} 个已更新, ${totalStats.total - totalStats.updated} 个未变化`);
    console.log('📄 同步报告: docs/.vitepress/notion-sync-report.json');
    console.log('');

    return true;
  } catch (error) {
    console.error('❌ 同步失败:', error.message);
    console.error(error.stack);
    return false;
  }
}

// 运行同步
if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  syncAllPages().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default syncAllPages;
