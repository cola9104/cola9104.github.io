#!/usr/bin/env node
/**
 * 递归同步 Notion 页面 - 支持无限层级嵌套
 * 只更新有变化的页面
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
 * 获取页面的所有块（支持分页）
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
  // Notion API 使用 rich_text 字段
  if (!block.rich_text || block.rich_text.length === 0) return '';

  return block.rich_text.map(text => {
    let formatted = text.plain_text || '';

    if (text.annotations?.bold) {
      formatted = `**${formatted}**`;
    }
    if (text.annotations?.italic) {
      formatted = `*${formatted}*`;
    }
    if (text.annotations?.underline) {
      formatted = `<u>${formatted}</u>`;
    }
    if (text.annotations?.code) {
      formatted = `\`${formatted}\``;
    }
    if (text.annotations?.strikethrough) {
      formatted = `~~${formatted}~~`;
    }
    if (text.href) {
      formatted = `[${formatted}](${text.href})`;
    }

    return formatted;
  }).join('');
}

/**
 * 智能写入文件（只在内容变化时写入）
 */
function smartWriteFile(filePath, content) {
  const contentHash = calculateHash(content);

  // 检查文件是否存在且内容是否相同
  if (fs.existsSync(filePath)) {
    const existingContent = fs.readFileSync(filePath, 'utf-8');
    const existingHash = calculateHash(existingContent);

    // 内容没有变化，跳过
    if (existingHash === contentHash) {
      return 'unchanged';
    }
  }

  // 确保目录存在
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 写入文件
  fs.writeFileSync(filePath, content, 'utf-8');

  return 'updated';
}

/**
 * 递归生成页面和子页面
 * @param {string} pageId - Notion 页面 ID
 * @param {string} pageTitle - 页面标题
 * @param {string} outputDir - 输出目录
 * @param {number} depth - 当前深度（用于缩进）
 */
async function generatePageRecursive(pageId, pageTitle, outputDir, depth = 0) {
  try {
    const indent = '  '.repeat(depth);
    console.log(`${indent}📄 处理: ${pageTitle}`);

    // 获取页面的所有块
    const blocks = await getPageBlocks(pageId);
    const childPages = blocks.filter(block => block.type === 'child_page');

    console.log(`${indent}   找到 ${childPages.length} 个子页面`);

    // 生成页面内容
    let pageContent = `---
title: ${pageTitle}
description: ${pageTitle}
---

# ${pageTitle}

`;

    // 添加子页面链接
    if (childPages.length > 0) {
      pageContent += `## 📑 内容目录\n\n`;
      for (const childPage of childPages) {
        const childTitle = childPage.child_page.title;
        const slug = childTitle.replace(/[^\w\u4e00-\u9fff]/g, '-').toLowerCase();
        pageContent += `- [${childTitle}](./${slug}/)\n`;
      }
      pageContent += '\n';
    }

    // 获取页面自身的内容（排除子页面）
    const mainContent = await blocksToMarkdown(blocks.filter(b => b.type !== 'child_page'));
    if (mainContent.trim()) {
      pageContent += mainContent;
    }

    // 写入页面文件
    const pagePath = path.join(outputDir, 'index.md');
    const pageStatus = smartWriteFile(pagePath, pageContent);

    if (pageStatus === 'updated') {
      console.log(`${indent}   ✅ 已更新: ${pagePath}`);
    } else {
      console.log(`${indent}   ✓ 未变化: ${pagePath}`);
    }

    // 递归处理所有子页面
    let updatedCount = pageStatus === 'updated' ? 1 : 0;
    for (const childPage of childPages) {
      const childTitle = childPage.child_page.title;
      const slug = childTitle.replace(/[^\w\u4e00-\u9fff]/g, '-').toLowerCase();
      const childDir = path.join(outputDir, slug);

      const childStats = await generatePageRecursive(
        childPage.id,
        childTitle,
        childDir,
        depth + 1
      );

      updatedCount += childStats.updated;
    }

    return {
      total: 1 + childPages.length,
      updated: updatedCount
    };
  } catch (error) {
    console.error(`${indent}   ❌ 处理失败 ${pageTitle}:`, error.message);
    return { total: 0, updated: 0 };
  }
}

/**
 * 主函数 - 递归同步所有页面
 */
async function syncAllPages() {
  try {
    console.log('🚀 开始递归同步 Notion 页面（支持无限层级嵌套）...\n');

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
        console.log(`⏭️  跳过: ${categoryTitle}\n`);
        continue;
      }

      const outputDir = path.join('docs', categoryTitle);
      const stats = await generatePageRecursive(mainPage.id, categoryTitle, outputDir);

      totalStats.total += stats.total;
      totalStats.updated += stats.updated;

      categories.push({
        title: categoryTitle,
        path: `/${categoryTitle}/`,
        pageCount: stats.total,
        updatedCount: stats.updated
      });

      console.log('');
    }

    // 生成同步报告
    const report = {
      syncTime: new Date().toISOString(),
      syncType: 'recursive',
      totalCategories: categories.length,
      totalPages: totalStats.total,
      updatedPages: totalStats.updated,
      unchangedPages: totalStats.total - totalStats.updated,
      categories: categories
    };

    const reportPath = 'docs/.vitepress/notion-sync-report.json';
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('='.repeat(60));
    console.log('🎉 递归同步完成!');
    console.log('='.repeat(60));
    console.log(`📊 总计: ${categories.length} 个分类`);
    console.log(`📄 页面: ${totalStats.total} 个总数, ${totalStats.updated} 个已更新, ${totalStats.total - totalStats.updated} 个未变化`);
    console.log(`📄 同步报告: ${reportPath}`);
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
