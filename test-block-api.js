import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const BLOCK_ID = '26822358-21c9-80f5-b1d1-cc8fedd541b6';

async function testBlockAPI() {
  console.log('🔍 测试Notion块API...');
  console.log(`块ID: ${BLOCK_ID}`);
  
  try {
    const response = await fetch(`https://api.notion.com/v1/blocks/${BLOCK_ID}/children`, {
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
    
    console.log('✅ API调用成功');
    console.log(`📊 找到 ${data.results?.length || 0} 个块`);
    
    if (data.results && data.results.length > 0) {
      console.log('\n📝 块内容:');
      data.results.forEach((block, index) => {
        console.log(`\n块 ${index + 1}:`);
        console.log(`  类型: ${block.type}`);
        console.log(`  ID: ${block.id}`);
        
        // 根据不同类型提取内容
        switch (block.type) {
          case 'paragraph':
            const paragraphText = block.paragraph?.rich_text?.map(text => text.plain_text).join('') || '';
            console.log(`  内容: ${paragraphText}`);
            break;
          case 'heading_1':
            const h1Text = block.heading_1?.rich_text?.map(text => text.plain_text).join('') || '';
            console.log(`  标题1: ${h1Text}`);
            break;
          case 'heading_2':
            const h2Text = block.heading_2?.rich_text?.map(text => text.plain_text).join('') || '';
            console.log(`  标题2: ${h2Text}`);
            break;
          case 'heading_3':
            const h3Text = block.heading_3?.rich_text?.map(text => text.plain_text).join('') || '';
            console.log(`  标题3: ${h3Text}`);
            break;
          case 'bulleted_list_item':
            const bulletText = block.bulleted_list_item?.rich_text?.map(text => text.plain_text).join('') || '';
            console.log(`  列表项: ${bulletText}`);
            break;
          case 'numbered_list_item':
            const numberedText = block.numbered_list_item?.rich_text?.map(text => text.plain_text).join('') || '';
            console.log(`  编号项: ${numberedText}`);
            break;
          case 'code':
            const codeText = block.code?.rich_text?.map(text => text.plain_text).join('') || '';
            const language = block.code?.language || '';
            console.log(`  代码 (${language}): ${codeText}`);
            break;
          case 'quote':
            const quoteText = block.quote?.rich_text?.map(text => text.plain_text).join('') || '';
            console.log(`  引用: ${quoteText}`);
            break;
          default:
            console.log(`  其他类型: ${JSON.stringify(block, null, 2)}`);
        }
      });
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return null;
  }
}

// 运行测试
testBlockAPI();
