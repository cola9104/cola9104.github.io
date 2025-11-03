import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 加载环境变量
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const PARENT_PAGE_ID = '26822358-21c9-80f5-b1d1-cc8fedd541b6';

// 获取页面块内容
async function getPageBlocks(pageId) {
  try {
    const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      headers: {
        'Authorization': NOTION_TOKEN,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`获取页面块失败 ${pageId}:`, error.message);
    return [];
  }
}

// 获取页面属性
async function getPageProperties(pageId) {
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: {
        'Authorization': NOTION_TOKEN,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`获取页面属性失败 ${pageId}:`, error.message);
    return null;
  }
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
    
    case 'toggle':
      const toggleText = block.toggle?.rich_text?.map(text => text.plain_text).join('') || '';
      return `<details>\n<summary>${toggleText}</summary>\n\n</details>`;
    
    case 'callout':
      const calloutText = block.callout?.rich_text?.map(text => text.plain_text).join('') || '';
      const icon = block.callout?.icon?.emoji || '💡';
      return `::: tip ${icon}\n${calloutText}\n:::`;
    
    case 'child_page':
      return `[${block.child_page?.title || 'Untitled'}](${generateSlug(block.child_page?.title || '')})`;
    
    case 'child_database':
      return `\n::: tip 数据库\n${block.child_database?.title || '数据库'}\n:::\n`;
    
    default:
      console.log(`未处理的块类型: ${block.type}`);
      return '';
  }
}

// 生成URL友好的别名
function generateSlug(title) {
  const slug = title
    .replace(/[^\w\s\u4e00-\u9fff-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
  
  return slug || 'untitled';
}

// 处理单个页面内容（递归）
async function processPageContent(pageId, pageTitle, depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}🔍 处理页面: ${pageTitle} (${pageId})`);
  
  try {
    const blocks = await getPageBlocks(pageId);
    const content = [];
    const childPages = [];
    
    // 处理每个块
    for (const block of blocks) {
      if (block.type === 'child_page') {
        childPages.push({
          id: block.id,
          title: block.child_page.title
        });
      } else {
        const blockContent = extractBlockContent(block);
        if (blockContent.trim()) {
          content.push(blockContent);
        }
      }
    }
    
    // 递归处理子页面
    const childContents = [];
    for (const childPage of childPages) {
      const childData = await processPageContent(childPage.id, childPage.title, depth + 1);
      childContents.push({
        title: childPage.title,
        content: childData.content || '',
        childPages: childData.childPages || []
      });
    }
    
    return {
      content: content.join('\n\n'),
      childPages: childContents
    };
    
  } catch (error) {
    console.error(`${indent}❌ 处理页面失败 ${pageTitle}:`, error.message);
    return { content: '', childPages: [] };
  }
}

// 生成页面文件
function generatePageFile(title, content, filePath, category = '') {
  const frontmatter = `---
layout: page
title: ${title}
description: ${title}相关技术文章和教程
category: ${category || title}
lastUpdated: ${new Date().toISOString()}
---

`;

  const fullContent = frontmatter + content;
  
  // 确保目录存在
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // 写入文件
  fs.writeFileSync(filePath, fullContent, 'utf8');
}

// 主函数
async function autoSyncGenerator() {
  console.log('🚀 开始自动同步Notion内容...');
  console.log(`📅 同步时间: ${new Date().toLocaleString()}`);
  
  try {
    // 获取父页面的所有子页面
    const parentBlocks = await getPageBlocks(PARENT_PAGE_ID);
    const childPages = parentBlocks.filter(block => block.type === 'child_page');
    
    console.log(`📄 找到 ${childPages.length} 个顶级子页面`);
    
    // 处理每个顶级子页面
    for (const childPage of childPages) {
      const title = childPage.child_page.title;
      const pageId = childPage.id;
      
      console.log(`\n📝 开始处理顶级页面: ${title}`);
      
      // 获取页面内容
      const pageData = await processPageContent(pageId, title, 0);
      
      // 生成主页面内容
      let mainContent = pageData.content;
      
      // 如果有子页面，添加到内容中
      if (pageData.childPages.length > 0) {
        mainContent += '\n\n## 📄 子页面\n\n';
        
        for (const child of pageData.childPages) {
          const childSlug = generateSlug(child.title);
          mainContent += `### [${child.title}](./${childSlug}/)\n\n`;
          
          if (child.content && child.content.trim()) {
            // 显示内容预览
            const preview = child.content.length > 200 ? 
              child.content.substring(0, 200) + '...' : 
              child.content;
            mainContent += preview + '\n\n';
          } else {
            mainContent += `*${child.title}相关内容即将更新...*\n\n`;
          }
          
          // 为子页面创建独立目录和文件
          let childFilePath;
          switch (title) {
            case '网络安全':
              childFilePath = `docs/网络安全/${childSlug}/index.md`;
              break;
            case '渗透测试':
              childFilePath = `docs/渗透测试/${childSlug}/index.md`;
              break;
            case '漏洞分析':
              childFilePath = `docs/漏洞分析/${childSlug}/index.md`;
              break;
            case '嵌入式安全':
              childFilePath = `docs/嵌入式安全/${childSlug}/index.md`;
              break;
            case 'CTF':
              childFilePath = `docs/CTF竞赛/${childSlug}/index.md`;
              break;
            case '关于':
              childFilePath = `docs/关于/${childSlug}/index.md`;
              break;
            default:
              childFilePath = `docs/${title}/${childSlug}/index.md`;
          }
          
          // 生成子页面文件
          generatePageFile(child.title, child.content, childFilePath, title);
          console.log(`  ✅ 已生成子页面: ${childFilePath}`);
        }
      }
      
      // 确定主文件路径
      let mainFilePath;
      switch (title) {
        case '网络安全':
          mainFilePath = 'docs/网络安全/index.md';
          break;
        case '渗透测试':
          mainFilePath = 'docs/渗透测试/index.md';
          break;
        case '漏洞分析':
          mainFilePath = 'docs/漏洞分析/index.md';
          break;
        case '嵌入式安全':
          mainFilePath = 'docs/嵌入式安全/index.md';
          break;
        case 'CTF':
          mainFilePath = 'docs/CTF竞赛/index.md';
          break;
        case '关于':
          mainFilePath = 'docs/关于/index.md';
          break;
        default:
          mainFilePath = `docs/${title}/index.md`;
      }
      
      // 生成主文件
      generatePageFile(title, mainContent, mainFilePath, title);
      console.log(`✅ 已生成主页面: ${mainFilePath}`);
    }
    
    // 生成同步日志
    const logContent = `# Notion自动同步日志

## 同步信息
- **同步时间**: ${new Date().toLocaleString()}
- **同步页面数**: ${childPages.length}
- **父页面ID**: ${PARENT_PAGE_ID}

## 同步的页面
${childPages.map(page => `- ${page.child_page.title}`).join('\n')}

## 说明
此文件由Notion自动同步系统生成，记录了最新的内容同步情况。

::: tip 自动更新
当你更新Notion中的内容时，重新运行此脚本即可同步最新内容到博客。
:::
`;
    
    fs.writeFileSync('docs/notion-sync-log.md', logContent, 'utf8');
    console.log('📋 已生成同步日志: docs/notion-sync-log.md');
    
    console.log('\n🎉 自动同步完成！');
    console.log('💡 提示: 当你在Notion中更新内容后，重新运行此脚本即可同步最新内容');
    
  } catch (error) {
    console.error('❌ 同步失败:', error.message);
  }
}

// 运行同步
autoSyncGenerator();

