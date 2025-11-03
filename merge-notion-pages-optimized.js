import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// 加载环境变量
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_MAIN_PAGE_ID = process.env.NOTION_MAIN_PAGE_ID;

// 验证环境变量
if (!NOTION_TOKEN) {
  console.error('❌ NOTION_TOKEN 未设置');
  process.exit(1);
}

if (!NOTION_MAIN_PAGE_ID) {
  console.error('❌ NOTION_MAIN_PAGE_ID 未设置');
  process.exit(1);
}

// 用于跟踪已处理过的页面内容，避免重复
const processedPages = new Set();

/**
 * 获取页面块内容（递归获取所有内容）
 */
async function getPageBlocks(pageId, maxDepth = 10) {
  if (maxDepth <= 0) return [];

  try {
    const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
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
    const blocks = data.results || [];

    // 递归获取嵌套块的内容
    for (const block of blocks) {
      if (block.has_children) {
        const childBlocks = await getPageBlocks(block.id, maxDepth - 1);
        block.children = childBlocks;
      }
    }

    return blocks;
  } catch (error) {
    console.error(`获取页面块失败 ${pageId}:`, error.message);
    return [];
  }
}

/**
 * 获取页面基本信息
 */
async function getPageInfo(pageId) {
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: {
        'Authorization': NOTION_TOKEN,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!response.ok) {
      throw new Error(`获取页面信息失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`获取页面信息失败 ${pageId}:`, error.message);
    return null;
  }
}

/**
 * 将Notion块转换为Markdown
 */
async function blocksToMarkdown(blocks, level = 0, parentTitle = '') {
  let markdown = '';

  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
        const paragraph = block.paragraph.rich_text || [];
        const paragraphText = paragraph.map(text => text.plain_text).join('');
        if (paragraphText.trim()) {
          markdown += paragraphText + '\n\n';
        }
        break;

      case 'heading_1':
        const h1 = block.heading_1.rich_text || [];
        const h1Text = h1.map(text => text.plain_text).join('');
        if (h1Text.trim()) {
          markdown += '# ' + h1Text + '\n\n';
        }
        break;

      case 'heading_2':
        const h2 = block.heading_2.rich_text || [];
        const h2Text = h2.map(text => text.plain_text).join('');
        if (h2Text.trim()) {
          markdown += '## ' + h2Text + '\n\n';
        }
        break;

      case 'heading_3':
        const h3 = block.heading_3.rich_text || [];
        const h3Text = h3.map(text => text.plain_text).join('');
        if (h3Text.trim()) {
          markdown += '### ' + h3Text + '\n\n';
        }
        break;

      case 'bulleted_list_item':
        const bullet = block.bulleted_list_item.rich_text || [];
        const bulletText = bullet.map(text => text.plain_text).join('');
        if (bulletText.trim()) {
          markdown += '- ' + bulletText + '\n';
        }
        break;

      case 'numbered_list_item':
        const numbered = block.numbered_list_item.rich_text || [];
        const numberedText = numbered.map(text => text.plain_text).join('');
        if (numberedText.trim()) {
          markdown += '1. ' + numberedText + '\n';
        }
        break;

      case 'to_do':
        const todo = block.to_do.rich_text || [];
        const todoText = todo.map(text => text.plain_text).join('');
        const checked = block.to_do.checked ? '[x]' : '[ ]';
        if (todoText.trim()) {
          markdown += `- ${checked} ` + todoText + '\n';
        }
        break;

      case 'toggle':
        const toggle = block.toggle.rich_text || [];
        const toggleText = toggle.map(text => text.plain_text).join('');
        if (toggleText.trim()) {
          markdown += '<details>\n<summary>' + toggleText + '</summary>\n\n';
          if (block.children && block.children.length > 0) {
            markdown += await blocksToMarkdown(block.children, level + 1, parentTitle);
          }
          markdown += '\n</details>\n\n';
        }
        break;

      case 'quote':
        const quote = block.quote.rich_text || [];
        const quoteText = quote.map(text => text.plain_text).join('');
        if (quoteText.trim()) {
          markdown += '> ' + quoteText + '\n\n';
        }
        break;

      case 'divider':
        markdown += '---\n\n';
        break;

      case 'code':
        const code = block.code.rich_text || [];
        const codeText = code.map(text => text.plain_text).join('');
        const language = block.code.language || '';
        if (codeText.trim()) {
          markdown += '```' + language + '\n' + codeText + '\n```\n\n';
        }
        break;

      case 'child_page':
        // 跳过子页面处理，因为我们单独处理
        console.log(`📄 跳过子页面处理: ${block.child_page.title} (将在主流程中处理)`);
        break;

      default:
        // 其他类型暂时忽略
        console.log(`⚠️ 暂不支持的块类型: ${block.type}`);
        break;
    }

    // 处理子块（除了toggle和child_page）
    if (block.children && block.children.length > 0 && block.type !== 'toggle' && block.type !== 'child_page') {
      markdown += await blocksToMarkdown(block.children, level + 1, parentTitle);
    }
  }

  return markdown;
}

/**
 * 获取页面的完整内容（去重）
 */
async function getPageContent(pageId, pageTitle) {
  try {
    // 检查是否已经处理过这个页面
    if (processedPages.has(pageId)) {
      console.log(`⚠️ 页面已处理过，跳过: ${pageTitle}`);
      return '';
    }

    processedPages.add(pageId);

    const pageInfo = await getPageInfo(pageId);
    if (!pageInfo) {
      console.error(`❌ 无法获取页面信息: ${pageId}`);
      return '';
    }

    const blocks = await getPageBlocks(pageId);
    const markdown = await blocksToMarkdown(blocks, 0, pageTitle);

    return markdown;
  } catch (error) {
    console.error(`❌ 获取页面内容失败 ${pageTitle}:`, error.message);
    return '';
  }
}

/**
 * 查找网络安全相关的页面
 */
async function findSecurityPages() {
  try {
    console.log('🔍 正在查找网络安全相关的页面...');

    // 定义网络安全相关的关键词
    const securityKeywords = [
      '网络安全', '安全', '攻击', '防护', '漏洞', '渗透', '威胁',
      '零信任', '威胁情报', '安全运营', 'SOC', 'XSS', 'SQL注入',
      'DDoS', '恶意软件', '防火墙', '加密', '认证', '授权'
    ];

    // 获取主页的子页面
    const mainBlocks = await getPageBlocks(NOTION_MAIN_PAGE_ID);
    const mainPages = mainBlocks.filter(block => block.type === 'child_page');

    const securityPages = [];

    // 检查每个主页面是否与网络安全相关
    for (const mainPage of mainPages) {
      const title = mainPage.child_page.title;
      const isSecurityRelated = securityKeywords.some(keyword =>
        title.includes(keyword) || keyword.includes(title)
      );

      if (isSecurityRelated) {
        console.log(`🔒 找到网络安全相关页面: ${title}`);
        securityPages.push({
          id: mainPage.id,
          title: title,
          type: 'main',
          order: getPageOrder(title)
        });

        // 递归查找子页面，但不获取内容（避免重复）
        const subPages = await findSubPagesOnly(mainPage.id, securityKeywords);
        securityPages.push(...subPages);
      }
    }

    // 按照预定义的顺序排序
    securityPages.sort((a, b) => a.order - b.order);

    return securityPages;
  } catch (error) {
    console.error('❌ 查找网络安全页面失败:', error.message);
    return [];
  }
}

/**
 * 根据标题获取排序序号
 */
function getPageOrder(title) {
  const orderMap = {
    '网络安全概述': 1,
    '常见攻击类型': 2,
    '防护策略': 3,
    '零信任架构': 4,
    '威胁情报': 5,
    '安全运营中心': 6,
    '网络安全': 7,
    '渗透测试': 8,
    '渗透测试基础': 9,
    '渗透测试流程': 10,
    '信息收集': 11,
    '漏洞扫描': 12,
    '漏洞分析': 13,
    '嵌入式安全': 14
  };

  return orderMap[title] || 999;
}

/**
 * 递归查找子页面（只查找，不获取内容）
 */
async function findSubPagesOnly(parentPageId, securityKeywords) {
  try {
    const blocks = await getPageBlocks(parentPageId);
    const childPages = blocks.filter(block => block.type === 'child_page');

    const subPages = [];

    for (const childPage of childPages) {
      const title = childPage.child_page.title;
      const isSecurityRelated = securityKeywords.some(keyword =>
        title.includes(keyword) || keyword.includes(title)
      );

      if (isSecurityRelated) {
        console.log(`📄 找到网络安全子页面: ${title}`);
        subPages.push({
          id: childPage.id,
          title: title,
          type: 'sub',
          order: getPageOrder(title)
        });
      }
    }

    return subPages;
  } catch (error) {
    console.error('❌ 查找子页面失败:', error.message);
    return [];
  }
}

/**
 * 清理重复的内容
 */
function cleanDuplicateContent(content) {
  // 移除连续的空行
  content = content.replace(/\n{3,}/g, '\n\n');

  // 移除连续的分隔符
  content = content.replace(/(-\s*\n){2,}/g, '---\n\n');

  // 移除重复的标题
  const lines = content.split('\n');
  const uniqueLines = [];
  const seenTitles = new Set();

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 检查是否为标题行
    if (trimmedLine.startsWith('#')) {
      const title = trimmedLine;
      if (!seenTitles.has(title)) {
        uniqueLines.push(line);
        seenTitles.add(title);
      }
    } else {
      uniqueLines.push(line);
    }
  }

  return uniqueLines.join('\n');
}

/**
 * 生成合并后的网络安全页面
 */
async function generateMergedSecurityPage() {
  try {
    console.log('🚀 开始生成合并后的网络安全页面...');

    // 重置已处理页面集合
    processedPages.clear();

    // 1. 查找所有网络安全相关页面
    const securityPages = await findSecurityPages();

    if (securityPages.length === 0) {
      console.log('⚠️ 未找到网络安全相关页面');
      return false;
    }

    console.log(`📊 找到 ${securityPages.length} 个网络安全相关页面`);

    // 2. 生成合并后的内容
    let mergedContent = `---
title: 网络安全
description: 全面的网络安全知识体系，包括基础概念、常见攻击类型、防护策略和高级主题
---

# 网络安全

本文档整合了所有网络安全相关的内容，提供完整的安全知识体系。

## 📚 内容目录

`;

    // 3. 添加目录（按顺序）
    for (const page of securityPages) {
      const anchor = page.title.toLowerCase()
        .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
        .replace(/\s+/g, '-');
      mergedContent += `- [${page.title}](#${anchor})\n`;
    }

    mergedContent += '\n---\n\n';

    // 4. 添加各个页面的内容
    for (const page of securityPages) {
      console.log(`📝 正在处理页面: ${page.title}`);

      const pageContent = await getPageContent(page.id, page.title);
      if (pageContent && pageContent.trim()) {
        mergedContent += `## ${page.title}\n\n`;
        mergedContent += pageContent;
        mergedContent += '\n---\n\n';
      }
    }

    // 5. 清理重复内容
    mergedContent = cleanDuplicateContent(mergedContent);

    // 6. 添加结尾
    mergedContent += `*本页面由自动化脚本从Notion数据库合并生成，最后更新时间: ${new Date().toLocaleString('zh-CN')}*`;

    // 7. 确保目录存在
    const dirPath = 'docs/网络安全';
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // 8. 写入文件
    const filePath = path.join(dirPath, 'index.md');
    fs.writeFileSync(filePath, mergedContent, 'utf-8');

    console.log(`✅ 成功生成合并后的网络安全页面: ${filePath}`);
    console.log(`📊 合并了 ${securityPages.length} 个页面的内容`);
    console.log(`🔄 处理了 ${processedPages.size} 个唯一页面`);

    return true;

  } catch (error) {
    console.error('❌ 生成合并页面失败:', error.message);
    return false;
  }
}

// 运行脚本
async function main() {
  console.log('🔄 开始网络安全页面合并流程...');

  const success = await generateMergedSecurityPage();

  if (success) {
    console.log('🎉 网络安全页面合并完成！');
  } else {
    console.log('❌ 网络安全页面合并失败');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  main();
}