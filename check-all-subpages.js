import dotenv from 'dotenv';

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

// 递归检查所有页面
async function checkAllPages(pageId, pageTitle, depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}🔍 检查页面: ${pageTitle} (${pageId})`);
  
  try {
    const blocks = await getPageBlocks(pageId);
    const childPages = blocks.filter(block => block.type === 'child_page');
    const databases = blocks.filter(block => block.type === 'child_database');
    
    if (childPages.length > 0) {
      console.log(`${indent}  📄 找到 ${childPages.length} 个子页面:`);
      for (const child of childPages) {
        console.log(`${indent}    - ${child.child_page.title} (${child.id})`);
      }
    }
    
    if (databases.length > 0) {
      console.log(`${indent}  📊 找到 ${databases.length} 个数据库:`);
      for (const db of databases) {
        console.log(`${indent}    - ${db.child_database.title} (${db.id})`);
      }
    }
    
    // 递归检查子页面
    for (const childPage of childPages) {
      await checkAllPages(childPage.id, childPage.child_page.title, depth + 1);
    }
    
  } catch (error) {
    console.error(`${indent}❌ 检查失败 ${pageTitle}:`, error.message);
  }
}

// 主函数
async function checkAllSubpages() {
  console.log('🔍 开始检查所有页面的子页面结构...');
  
  try {
    // 获取父页面的所有子页面
    const parentBlocks = await getPageBlocks(PARENT_PAGE_ID);
    const childPages = parentBlocks.filter(block => block.type === 'child_page');
    
    console.log(`📄 找到 ${childPages.length} 个顶级子页面`);
    
    // 检查每个顶级子页面
    for (const childPage of childPages) {
      const title = childPage.child_page.title;
      const pageId = childPage.id;
      
      console.log(`\n📝 检查顶级页面: ${title}`);
      await checkAllPages(pageId, title, 0);
    }
    
    console.log('\n🎉 检查完成！');
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

// 运行检查
checkAllSubpages();

