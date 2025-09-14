import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

async function getEnhancedNotionData() {
  console.log('🔍 获取增强的Notion数据...');
  
  try {
    // 1. 获取数据库结构和属性
    console.log('\n📊 步骤1: 获取数据库结构...');
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}`, {
      headers: {
        'Authorization': NOTION_TOKEN,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    const dbData = await dbResponse.json();
    console.log('✅ 数据库标题:', dbData.title[0]?.text?.content || 'Untitled');
    
    // 显示所有可用属性
    console.log('\n🏗️ 数据库属性结构:');
    const properties = {};
    Object.keys(dbData.properties).forEach(propName => {
      const prop = dbData.properties[propName];
      properties[propName] = prop.type;
      console.log(`  📝 ${propName}: ${prop.type}`);
    });

    // 2. 获取数据库中的所有页面
    console.log('\n📄 步骤2: 获取所有页面...');
    const pagesResponse = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
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

    const pagesData = await pagesResponse.json();
    console.log(`✅ 找到 ${pagesData.results.length} 个页面`);

    // 3. 获取每个页面的详细内容（包括子页面）
    console.log('\n📖 步骤3: 获取页面详细内容...');
    const enhancedPages = [];

    for (const page of pagesData.results) {
      console.log(`\n🔍 处理页面: ${page.id}`);
      
      // 获取页面属性
      const pageTitle = page.properties['名称']?.title?.[0]?.text?.content || 
                       page.properties['Title']?.title?.[0]?.text?.content || 
                       'Untitled';
      
      const pageContent = page.properties['文本']?.rich_text?.[0]?.text?.content || 
                         page.properties['Excerpt']?.rich_text?.[0]?.text?.content || 
                         '';

      // 获取页面的所有块内容（包括子页面）
      const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${page.id}/children`, {
        headers: {
          'Authorization': NOTION_TOKEN,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        }
      });

      let blocksContent = [];
      if (blocksResponse.ok) {
        const blocksData = await blocksResponse.json();
        blocksContent = blocksData.results.map(block => {
          // 提取文本内容
          if (block.type === 'paragraph' && block.paragraph?.rich_text) {
            return block.paragraph.rich_text.map(text => text.plain_text).join('');
          } else if (block.type === 'heading_1' && block.heading_1?.rich_text) {
            return `# ${block.heading_1.rich_text.map(text => text.plain_text).join('')}`;
          } else if (block.type === 'heading_2' && block.heading_2?.rich_text) {
            return `## ${block.heading_2.rich_text.map(text => text.plain_text).join('')}`;
          } else if (block.type === 'heading_3' && block.heading_3?.rich_text) {
            return `### ${block.heading_3.rich_text.map(text => text.plain_text).join('')}`;
          } else if (block.type === 'bulleted_list_item' && block.bulleted_list_item?.rich_text) {
            return `- ${block.bulleted_list_item.rich_text.map(text => text.plain_text).join('')}`;
          } else if (block.type === 'numbered_list_item' && block.numbered_list_item?.rich_text) {
            return `1. ${block.numbered_list_item.rich_text.map(text => text.plain_text).join('')}`;
          } else if (block.type === 'code' && block.code?.rich_text) {
            return `\`\`\`${block.code.language || ''}\n${block.code.rich_text.map(text => text.plain_text).join('')}\n\`\`\``;
          }
          return '';
        }).filter(content => content.trim());
      }

      // 构建增强的页面数据
      const enhancedPage = {
        id: page.id,
        title: pageTitle,
        content: pageContent,
        fullContent: blocksContent.join('\n\n'),
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
        url: page.url,
        cover: page.cover?.external?.url || page.cover?.file?.url || null,
        properties: page.properties
      };

      enhancedPages.push(enhancedPage);
      console.log(`  ✅ ${pageTitle} - 内容长度: ${blocksContent.length} 个块`);
    }

    // 4. 生成智能的表头映射
    console.log('\n🎯 步骤4: 生成智能表头映射...');
    const smartMapping = generateSmartMapping(properties, enhancedPages);
    console.log('智能映射结果:', smartMapping);

    // 5. 输出结果
    console.log('\n📋 最终结果:');
    console.log(`数据库: ${dbData.title[0]?.text?.content || 'Untitled'}`);
    console.log(`页面数量: ${enhancedPages.length}`);
    console.log(`属性数量: ${Object.keys(properties).length}`);
    
    return {
      database: {
        title: dbData.title[0]?.text?.content || 'Untitled',
        properties: properties
      },
      pages: enhancedPages,
      smartMapping: smartMapping
    };

  } catch (error) {
    console.error('❌ 获取数据失败:', error.message);
    return null;
  }
}

function generateSmartMapping(properties, pages) {
  const mapping = {
    title: null,
    content: null,
    excerpt: null,
    tags: null,
    category: null,
    status: null,
    cover: null
  };

  // 智能匹配属性
  Object.keys(properties).forEach(propName => {
    const propType = properties[propName];
    
    // 标题匹配
    if (propType === 'title' || propName.toLowerCase().includes('title') || propName.toLowerCase().includes('名称')) {
      mapping.title = propName;
    }
    
    // 内容匹配
    if (propType === 'rich_text' && (propName.toLowerCase().includes('content') || propName.toLowerCase().includes('文本'))) {
      mapping.content = propName;
    }
    
    // 摘要匹配
    if (propType === 'rich_text' && (propName.toLowerCase().includes('excerpt') || propName.toLowerCase().includes('摘要'))) {
      mapping.excerpt = propName;
    }
    
    // 标签匹配
    if (propType === 'multi_select' && (propName.toLowerCase().includes('tag') || propName.toLowerCase().includes('标签'))) {
      mapping.tags = propName;
    }
    
    // 分类匹配
    if (propType === 'select' && (propName.toLowerCase().includes('category') || propName.toLowerCase().includes('分类'))) {
      mapping.category = propName;
    }
    
    // 状态匹配
    if (propType === 'select' && (propName.toLowerCase().includes('status') || propName.toLowerCase().includes('状态'))) {
      mapping.status = propName;
    }
  });

  return mapping;
}

// 运行测试
getEnhancedNotionData();
