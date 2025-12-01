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
    // 确保Token格式正确（自动添加Bearer前缀如果缺失）
    const token = NOTION_TOKEN.startsWith('Bearer ') ? NOTION_TOKEN : `Bearer ${NOTION_TOKEN}`;

    const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      headers: {
        'Authorization': token,
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

// 提取富文本内容，保留格式
function extractRichText(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return '';

  return richTextArray.map(text => {
    let content = text.plain_text;

    // 应用文本格式
    if (text.annotations) {
      if (text.annotations.bold) content = `**${content}**`;
      if (text.annotations.italic) content = `*${content}*`;
      if (text.annotations.code) content = `\`${content}\``;
      if (text.annotations.strikethrough) content = `~~${content}~~`;
    }

    // 处理链接
    if (text.href) {
      content = `[${content}](${text.href})`;
    }

    return content;
  }).join('');
}

// 提取块内容为Markdown
function extractBlockContent(block) {
  switch (block.type) {
    case 'paragraph':
      return extractRichText(block.paragraph?.rich_text);

    case 'heading_1':
      return `# ${extractRichText(block.heading_1?.rich_text)}`;

    case 'heading_2':
      return `## ${extractRichText(block.heading_2?.rich_text)}`;

    case 'heading_3':
      return `### ${extractRichText(block.heading_3?.rich_text)}`;

    case 'bulleted_list_item':
      return `- ${extractRichText(block.bulleted_list_item?.rich_text)}`;

    case 'numbered_list_item':
      return `1. ${extractRichText(block.numbered_list_item?.rich_text)}`;

    case 'code':
      const code = extractRichText(block.code?.rich_text);
      const language = block.code?.language || '';
      return `\`\`\`${language}\n${code}\n\`\`\``;

    case 'quote':
      return `> ${extractRichText(block.quote?.rich_text)}`;

    case 'callout':
      const icon = block.callout?.icon?.emoji || '💡';
      const calloutText = extractRichText(block.callout?.rich_text);
      return `> ${icon} ${calloutText}`;

    case 'divider':
      return '---';

    case 'table_of_contents':
      return '[[toc]]';

    case 'toggle':
      const toggleText = extractRichText(block.toggle?.rich_text);
      return `<details>\n<summary>${toggleText}</summary>\n\n</details>`;

    default:
      return '';
  }
}

// 为标题添加表情符号
function addEmojiToHeading(headingText, level) {
  // 如果标题已经有表情符号，直接返回
  if (/[\u{1F300}-\u{1F9FF}]/u.test(headingText)) {
    return headingText;
  }

  // 根据常见关键词添加表情符号
  const emojiMap = {
    '什么是': '🔍',
    '为什么': '🔍',
    '概述': '🔍',
    '介绍': '🔍',
    '重要性': '📊',
    '应用': '📊',
    '分析': '📊',
    '威胁': '⚠️',
    '攻击': '⚠️',
    '风险': '⚠️',
    '挑战': '⚠️',
    '防护': '🛡️',
    '安全': '🛡️',
    '防御': '🛡️',
    '保护': '🛡️',
    '发展': '🚀',
    '趋势': '🚀',
    '未来': '🚀',
    '法律': '📜',
    '法规': '📜',
    '规范': '📜',
    '标准': '📜',
    '职业': '💼',
    '就业': '💼',
    '工作': '💼',
    '总结': '📝',
    '小结': '📝',
    '建议': '💡',
    '工具': '🔧',
    '技术': '🔧',
    '方法': '🔧'
  };

  for (const [keyword, emoji] of Object.entries(emojiMap)) {
    if (headingText.includes(keyword)) {
      return `${emoji} ${headingText}`;
    }
  }

  return headingText;
}

// 提取纯文本（不带格式标记）
function extractPlainText(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return '';
  return richTextArray.map(text => text.plain_text).join('');
}

// 格式化内容，统一样式
function formatContent(blocks) {
  let content = '';
  let firstParagraph = true;

  for (const block of blocks) {
    // 跳过子页面块
    if (block.type === 'child_page') continue;

    // 处理标题，添加表情符号
    if (block.type.startsWith('heading')) {
      const level = block.type === 'heading_1' ? 1 : block.type === 'heading_2' ? 2 : 3;
      // 获取纯文本，避免重复的格式标记
      const headingText = extractPlainText(block[block.type]?.rich_text);

      if (!headingText || !headingText.trim()) continue;

      const prefix = '#'.repeat(level);

      // 为一级和二级标题添加表情符号和加粗
      if (level === 1 || level === 2) {
        const emojiText = addEmojiToHeading(headingText, level);
        content += `${prefix} **${emojiText}**\n\n`;
      } else {
        content += `${prefix} **${headingText}**\n\n`;
      }

      firstParagraph = false;
      continue;
    }

    // 提取块内容（保留格式）
    const blockContent = extractBlockContent(block);
    if (!blockContent || !blockContent.trim()) continue;

    // 处理第一个段落作为简介（如果不是标题）
    if (firstParagraph && block.type === 'paragraph') {
      // 简介段落直接添加
      content += blockContent + '\n\n';
      firstParagraph = false;
      continue;
    }

    // 其他内容正常添加
    content += blockContent + '\n\n';
  }

  return content;
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

    // 格式化内容
    const content = formatContent(contentBlocks);

    // 如果当前路径是docs目录，创建index.md
    const indexPath = path.join(parentPath, 'index.md');
    if (!fs.existsSync(parentPath)) {
      fs.mkdirSync(parentPath, { recursive: true });
    }

    // 生成index.md内容
    const pageName = path.basename(parentPath);
    const frontmatter = `---
layout: doc
title: ${pageName}
outline: deep
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
