import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_MAIN_PAGE_ID = process.env.NOTION_MAIN_PAGE_ID;

async function checkNestedPages() {
  // 1. 获取主页面
  const mainResponse = await fetch(`https://api.notion.com/v1/blocks/${NOTION_MAIN_PAGE_ID}/children`, {
    headers: {
      'Authorization': NOTION_TOKEN,
      'Notion-Version': '2022-06-28'
    }
  });

  const mainData = await mainResponse.json();

  // 2. 找到"网络安全"分类的ID
  const networkSecPage = mainData.results.find(block =>
    block.type === 'child_page' && block.child_page.title === '网络安全'
  );

  if (!networkSecPage) {
    console.log('❌ 找不到"网络安全"分类');
    return;
  }

  console.log('✅ 找到"网络安全"分类');

  // 3. 获取"网络安全"下的所有子页面
  const catResponse = await fetch(`https://api.notion.com/v1/blocks/${networkSecPage.id}/children`, {
    headers: {
      'Authorization': NOTION_TOKEN,
      'Notion-Version': '2022-06-28'
    }
  });

  const catData = await catResponse.json();

  // 4. 找到"企业安全建设与人员需求规划书"的ID
  const enterprisePage = catData.results.find(block =>
    block.type === 'child_page' && block.child_page.title === '企业安全建设与人员需求规划书'
  );

  if (!enterprisePage) {
    console.log('❌ 找不到"企业安全建设与人员需求规划书"');
    return;
  }

  console.log('✅ 找到"企业安全建设与人员需求规划书", ID:', enterprisePage.id);

  // 5. 获取该页面的子页面
  const entResponse = await fetch(`https://api.notion.com/v1/blocks/${enterprisePage.id}/children`, {
    headers: {
      'Authorization': NOTION_TOKEN,
      'Notion-Version': '2022-06-28'
    }
  });

  const entData = await entResponse.json();

  console.log('\n📚 "企业安全建设与人员需求规划书"的子页面:\n');

  entData.results.forEach((block, index) => {
    if (block.type === 'child_page') {
      console.log(`${index + 1}. ✅ ${block.child_page.title}`);
    } else {
      console.log(`${index + 1}. ❓ ${block.type}`);
    }
  });

  console.log(`\n总计: ${entData.results.length} 个块`);
}

checkNestedPages();
