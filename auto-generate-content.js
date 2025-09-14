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

// 生成页面内容
function generatePageContent(title, blocks, category = '') {
  const content = blocks
    .map(block => extractBlockContent(block))
    .filter(content => content.trim())
    .join('\n\n');

  const frontmatter = `---
layout: page
title: ${title}
description: ${title}相关技术文章和教程
category: ${category}
---\n\n`;

  return frontmatter + content;
}

// 生成栏目首页内容
function generateCategoryIndex(title, description, links) {
  const frontmatter = `---
layout: page
title: ${title}
description: ${description}
---

# ${title}

${description}

## 📖 学习路径

`;

  const content = links.map(link => {
    return `- [${link.title}](${link.slug}) - ${link.description}`;
  }).join('\n');

  return frontmatter + content + `

## 🔥 热门文章

::: tip 最新更新
- 更多精彩内容即将更新...
:::

## 📚 推荐资源

### 相关链接
- [技术文档]()
- [学习资源]()
- [工具推荐]()

---

::: info 贡献指南
如果你有${title}相关的文章想要分享，欢迎提交PR或联系我。让我们一起学习进步！
:::
`;
}

// 主函数
async function autoGenerateContent() {
  console.log('🚀 开始自动生成内容...');
  
  try {
    // 1. 获取父页面的所有子页面
    const parentBlocks = await getPageBlocks(PARENT_PAGE_ID);
    const childPages = parentBlocks.filter(block => block.type === 'child_page');
    
    console.log(`📄 找到 ${childPages.length} 个子页面`);
    
    // 2. 为每个子页面生成内容
    for (const childPage of childPages) {
      const title = childPage.child_page.title;
      const pageId = childPage.id;
      
      console.log(`\n📝 处理页面: ${title}`);
      
      // 获取页面内容
      const pageBlocks = await getPageBlocks(pageId);
      const pageContent = generatePageContent(title, pageBlocks, title);
      
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
      
      // 确保目录存在
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // 写入文件
      fs.writeFileSync(filePath, pageContent, 'utf8');
      console.log(`✅ 已生成: ${filePath}`);
    }
    
    // 3. 生成特殊页面
    console.log('\n🎨 生成特殊页面...');
    
    // 生成博客页面（如果不存在）
    const blogPath = 'docs/博客/index.md';
    if (!fs.existsSync(blogPath)) {
      const blogContent = generateCategoryIndex(
        '网络安全博客',
        '专业的网络安全技术博客，分享实战经验和深度分析',
        [
          { title: '最新文章', slug: '#', description: '查看最新的技术文章' },
          { title: '技术分类', slug: '#', description: '按技术分类浏览文章' },
          { title: '热门标签', slug: '#', description: '热门技术标签' }
        ]
      );
      fs.writeFileSync(blogPath, blogContent, 'utf8');
      console.log(`✅ 已生成: ${blogPath}`);
    }
    
    console.log('\n🎉 内容生成完成！');
    
  } catch (error) {
    console.error('❌ 生成失败:', error.message);
  }
}

// 运行生成
autoGenerateContent();
