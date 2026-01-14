import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

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
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 获取页面块内容(递归获取所有内容,带重试机制)
 */
async function getPageBlocks(pageId, maxDepth = 10, retries = 3) {
  if (maxDepth <= 0) return [];

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
        headers: {
          'Authorization': NOTION_TOKEN,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const blocks = data.results || [];

      // 递归获取嵌套块的内容
      for (const block of blocks) {
        if (block.has_children && block.type !== 'child_page') {
          await delay(100); // 避免请求过快
          const childBlocks = await getPageBlocks(block.id, maxDepth - 1, retries);
          block.children = childBlocks;
        }
      }

      return blocks;
    } catch (error) {
      if (attempt === retries) {
        console.error(`❌ 获取页面块失败 ${pageId} (已重试${retries}次):`, error.message);
        return [];
      }
      console.log(`⚠️  重试 ${attempt}/${retries}: ${pageId}`);
      await delay(1000 * attempt); // 指数退避
    }
  }

  return [];
}

/**
 * 将Notion块转换为Markdown
 */
async function blocksToMarkdown(blocks, level = 0) {
  let markdown = '';

  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
        const paragraph = block.paragraph.rich_text || [];
        const paragraphText = paragraph.map(text => formatRichText(text)).join('');
        if (paragraphText.trim()) {
          markdown += paragraphText + '\n\n';
        }
        break;

      case 'heading_1':
        const h1 = block.heading_1.rich_text || [];
        markdown += '# ' + h1.map(text => text.plain_text).join('') + '\n\n';
        break;

      case 'heading_2':
        const h2 = block.heading_2.rich_text || [];
        markdown += '## ' + h2.map(text => text.plain_text).join('') + '\n\n';
        break;

      case 'heading_3':
        const h3 = block.heading_3.rich_text || [];
        markdown += '### ' + h3.map(text => text.plain_text).join('') + '\n\n';
        break;

      case 'bulleted_list_item':
        const bullet = block.bulleted_list_item.rich_text || [];
        markdown += '- ' + bullet.map(text => formatRichText(text)).join('') + '\n';
        if (block.children && block.children.length > 0) {
          const childMarkdown = await blocksToMarkdown(block.children, level + 1);
          markdown += childMarkdown.split('\n').map(line => '  ' + line).join('\n') + '\n';
        }
        break;

      case 'numbered_list_item':
        const numbered = block.numbered_list_item.rich_text || [];
        markdown += '1. ' + numbered.map(text => formatRichText(text)).join('') + '\n';
        if (block.children && block.children.length > 0) {
          const childMarkdown = await blocksToMarkdown(block.children, level + 1);
          markdown += childMarkdown.split('\n').map(line => '   ' + line).join('\n') + '\n';
        }
        break;

      case 'to_do':
        const todo = block.to_do.rich_text || [];
        const checked = block.to_do.checked ? '[x]' : '[ ]';
        markdown += `- ${checked} ` + todo.map(text => formatRichText(text)).join('') + '\n';
        break;

      case 'toggle':
        const toggle = block.toggle.rich_text || [];
        markdown += '<details>\n<summary>' + toggle.map(text => text.plain_text).join('') + '</summary>\n\n';
        if (block.children && block.children.length > 0) {
          markdown += await blocksToMarkdown(block.children, level);
        }
        markdown += '\n</details>\n\n';
        break;

      case 'quote':
        const quote = block.quote.rich_text || [];
        markdown += '> ' + quote.map(text => formatRichText(text)).join('') + '\n\n';
        break;

      case 'divider':
        markdown += '---\n\n';
        break;

      case 'code':
        const code = block.code.rich_text || [];
        const language = block.code.language || '';
        markdown += '```' + language + '\n' + code.map(text => text.plain_text).join('') + '\n```\n\n';
        break;

      case 'image':
        const imageUrl = block.image.file?.url || block.image.external?.url;
        if (imageUrl) {
          markdown += `![image](${imageUrl})\n\n`;
        }
        break;

      case 'callout':
        const callout = block.callout.rich_text || [];
        const icon = block.callout.icon?.emoji || '💡';
        markdown += `> ${icon} ` + callout.map(text => formatRichText(text)).join('') + '\n\n';
        break;

      case 'child_page':
        // 子页面标题作为链接
        markdown += `\n### 📄 ${block.child_page.title}\n\n`;
        break;

      default:
        // 其他类型暂时忽略
        break;
    }
  }

  return markdown;
}

/**
 * 格式化富文本
 */
function formatRichText(text) {
  let formatted = text.plain_text;

  if (text.annotations.bold) {
    formatted = `**${formatted}**`;
  }
  if (text.annotations.italic) {
    formatted = `*${formatted}*`;
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
}

/**
 * 获取页面的完整内容
 */
async function getPageContent(pageId, pageTitle) {
  try {
    console.log(`  📄 正在获取: ${pageTitle}`);
    const blocks = await getPageBlocks(pageId);
    const markdown = await blocksToMarkdown(blocks);
    return markdown;
  } catch (error) {
    console.error(`❌ 获取页面内容失败 ${pageTitle}:`, error.message);
    return '';
  }
}

/**
 * 生成单个分类的页面
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

    // 创建目录
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 写入分类首页
    fs.writeFileSync(path.join(outputDir, 'index.md'), categoryContent, 'utf-8');
    console.log(`  ✅ 已生成分类首页: ${outputDir}/index.md`);

    // 生成每个子页面
    for (const childPage of childPages) {
      const pageTitle = childPage.child_page.title;
      const slug = pageTitle.replace(/[^\w\u4e00-\u9fff]/g, '-').toLowerCase();
      const pageDir = path.join(outputDir, slug);

      // 创建子页面目录
      if (!fs.existsSync(pageDir)) {
        fs.mkdirSync(pageDir, { recursive: true });
      }

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

      fs.writeFileSync(path.join(pageDir, 'index.md'), pageMarkdown, 'utf-8');
      console.log(`  ✅ 已生成子页面: ${pageDir}/index.md`);
    }

    return childPages.length;
  } catch (error) {
    console.error(`❌ 生成分类页面失败 ${categoryTitle}:`, error.message);
    return 0;
  }
}

/**
 * 主函数 - 同步所有页面
 */
async function syncAllPages() {
  try {
    console.log('🚀 开始从 Notion 同步所有页面...\n');

    // 获取主页面的所有子页面
    const mainBlocks = await getPageBlocks(NOTION_MAIN_PAGE_ID);
    const mainPages = mainBlocks.filter(block => block.type === 'child_page');

    console.log(`📊 找到 ${mainPages.length} 个顶级分类\n`);

    let totalPages = 0;
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
      const pageCount = await generateCategoryPage(mainPage.id, categoryTitle, outputDir);
      totalPages += pageCount;

      categories.push({
        title: categoryTitle,
        path: `/${categoryTitle}/`,
        pageCount: pageCount
      });
    }

    // 生成同步报告
    const report = {
      syncTime: new Date().toISOString(),
      totalCategories: categories.length,
      totalPages: totalPages,
      categories: categories
    };

    fs.writeFileSync('docs/.vitepress/notion-sync-report.json', JSON.stringify(report, null, 2));

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Notion 页面同步完成!');
    console.log('='.repeat(50));
    console.log(`📊 总计: ${categories.length} 个分类, ${totalPages} 个页面`);
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
