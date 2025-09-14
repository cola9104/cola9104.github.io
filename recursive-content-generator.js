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

// 获取数据库内容
async function getDatabaseContent(databaseId) {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`获取数据库内容失败 ${databaseId}:`, error.message);
    return [];
  }
}

// 获取数据库结构
async function getDatabaseInfo(databaseId) {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
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
    console.error(`获取数据库信息失败 ${databaseId}:`, error.message);
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
    
    case 'child_page':
      return `[${block.child_page?.title || 'Untitled'}](./${generateSlug(block.child_page?.title || '')})`;
    
    case 'child_database':
      return `\n::: tip 数据库\n${block.child_database?.title || '数据库'}\n:::\n`;
    
    default:
      return '';
  }
}

// 生成URL友好的别名
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

// 递归处理页面内容
async function processPageRecursively(pageId, pageTitle, depth = 0, basePath = '') {
  const indent = '  '.repeat(depth);
  console.log(`${indent}🔍 处理页面: ${pageTitle} (深度: ${depth})`);
  
  try {
    // 获取页面块
    const blocks = await getPageBlocks(pageId);
    let content = '';
    const childPages = [];
    const databases = [];
    
    // 处理每个块
    for (const block of blocks) {
      if (block.type === 'child_page') {
        childPages.push({
          id: block.id,
          title: block.child_page.title
        });
      } else if (block.type === 'child_database') {
        databases.push({
          id: block.id,
          title: block.child_database.title
        });
      } else {
        content += extractBlockContent(block) + '\n\n';
      }
    }
    
    // 处理数据库内容
    for (const db of databases) {
      console.log(`${indent}  📊 处理数据库: ${db.title}`);
      
      const dbInfo = await getDatabaseInfo(db.id);
      const dbContent = await getDatabaseContent(db.id);
      
      if (dbInfo) {
        content += `\n## 📊 ${db.title}\n\n`;
        content += `数据库标题: ${dbInfo.title?.[0]?.text?.content || db.title}\n\n`;
        
        // 显示数据库属性
        if (dbInfo.properties) {
          content += `### 数据库属性\n\n`;
          Object.keys(dbInfo.properties).forEach(propName => {
            const prop = dbInfo.properties[propName];
            content += `- **${propName}**: ${prop.type}\n`;
          });
          content += '\n';
        }
        
        // 显示数据库内容
        if (dbContent.length > 0) {
          content += `### 数据库内容 (${dbContent.length} 条记录)\n\n`;
          
          dbContent.forEach((item, index) => {
            content += `#### 记录 ${index + 1}\n\n`;
            
            // 提取页面属性
            if (item.properties) {
              Object.keys(item.properties).forEach(propName => {
                const prop = item.properties[propName];
                let value = '';
                
                switch (prop.type) {
                  case 'title':
                    value = prop.title?.[0]?.text?.content || '';
                    break;
                  case 'rich_text':
                    value = prop.rich_text?.[0]?.text?.content || '';
                    break;
                  case 'select':
                    value = prop.select?.name || '';
                    break;
                  case 'multi_select':
                    value = prop.multi_select?.map(item => item.name).join(', ') || '';
                    break;
                  case 'date':
                    value = prop.date?.start || '';
                    break;
                  case 'checkbox':
                    value = prop.checkbox ? '是' : '否';
                    break;
                  case 'number':
                    value = prop.number || '';
                    break;
                  case 'url':
                    value = prop.url || '';
                    break;
                  case 'email':
                    value = prop.email || '';
                    break;
                  case 'phone_number':
                    value = prop.phone_number || '';
                    break;
                  default:
                    value = JSON.stringify(prop);
                }
                
                if (value) {
                  content += `- **${propName}**: ${value}\n`;
                }
              });
            }
            
            content += `\n[查看详情](${item.url})\n\n`;
          });
        }
      }
    }
    
    // 递归处理子页面
    for (const childPage of childPages) {
      const childPath = basePath ? `${basePath}/${generateSlug(childPage.title)}` : generateSlug(childPage.title);
      const childContent = await processPageRecursively(childPage.id, childPage.title, depth + 1, childPath);
      
      // 如果子页面有内容，添加到当前页面
      if (childContent.trim()) {
        content += `\n## 📄 ${childPage.title}\n\n`;
        content += childContent + '\n\n';
      }
    }
    
    return content.trim();
    
  } catch (error) {
    console.error(`${indent}❌ 处理页面失败 ${pageTitle}:`, error.message);
    return '';
  }
}

// 生成页面文件
function generatePageFile(title, content, filePath) {
  const frontmatter = `---
layout: page
title: ${title}
description: ${title}相关技术文章和教程
category: ${title}
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
async function recursiveContentGenerator() {
  console.log('🚀 开始递归内容生成...');
  
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
      
      // 递归获取所有内容
      const content = await processPageRecursively(pageId, title, 0, '');
      
      // 确定文件路径
      let filePath;
      switch (title) {
        case '网络安全':
          filePath = 'docs/网络安全/index.md';
          break;
        case '渗透测试':
          filePath = 'docs/渗透测试/index.md';
          break;
        case '漏洞分析':
          filePath = 'docs/漏洞分析/index.md';
          break;
        case '嵌入式安全':
          filePath = 'docs/嵌入式安全/index.md';
          break;
        case 'CTF':
          filePath = 'docs/CTF竞赛/index.md';
          break;
        case '关于':
          filePath = 'docs/关于/index.md';
          break;
        default:
          filePath = `docs/${title}/index.md`;
      }
      
      // 生成文件
      generatePageFile(title, content, filePath);
      console.log(`✅ 已生成: ${filePath}`);
    }
    
    console.log('\n🎉 递归内容生成完成！');
    
  } catch (error) {
    console.error('❌ 生成失败:', error.message);
  }
}

// 运行生成
recursiveContentGenerator();
