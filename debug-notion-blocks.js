import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;

async function debugNotionBlocks() {
  // 测试页面 ID（渗透测试合规与资质指南）
  const pageId = '2e322358-21c9-801b-bf0c-caaf323c20a1';

  const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
    headers: {
      'Authorization': NOTION_TOKEN,
      'Notion-Version': '2022-06-28'
    }
  });

  const data = await response.json();

  console.log('📊 页面块结构:\n');
  console.log(JSON.stringify(data.results[0], null, 2));
}

debugNotionBlocks();
