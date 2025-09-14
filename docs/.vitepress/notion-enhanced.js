import { Client } from '@notionhq/client';

// Notion API配置
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

/**
 * 智能属性映射
 */
const SMART_MAPPING = {
  title: '名称',        // 标题字段
  content: '文本',      // 内容字段
  excerpt: null,       // 摘要字段（如果有）
  tags: null,          // 标签字段（如果有）
  category: null,      // 分类字段（如果有）
  status: null,        // 状态字段（如果有）
  cover: null          // 封面字段（如果有）
};

/**
 * 从Notion获取增强的博客文章数据
 */
export async function getEnhancedBlogPosts() {
  try {
    console.log('🔄 获取增强的Notion博客数据...');
    
    // 获取数据库信息
    const database = await notion.databases.retrieve({
      database_id: DATABASE_ID
    });
    
    // 获取所有页面
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      page_size: 100
    });

    const enhancedPosts = [];

    for (const page of response.results) {
      // 获取页面的详细内容（包括所有块）
      const blocks = await notion.blocks.children.list({
        block_id: page.id
      });

      // 提取标题
      const title = page.properties[SMART_MAPPING.title]?.title?.[0]?.text?.content || 
                   page.properties['名称']?.title?.[0]?.text?.content || 
                   'Untitled';

      // 提取内容
      const content = page.properties[SMART_MAPPING.content]?.rich_text?.[0]?.text?.content || 
                     page.properties['文本']?.rich_text?.[0]?.text?.content || 
                     '';

      // 处理块内容
      const fullContent = blocks.results.map(block => {
        return extractBlockContent(block);
      }).filter(content => content.trim()).join('\n\n');

      // 生成智能摘要
      const excerpt = generateExcerpt(content || fullContent);

      // 生成智能标签
      const tags = generateSmartTags(title, content || fullContent);

      // 生成智能分类
      const category = generateSmartCategory(title, content || fullContent);

      const enhancedPost = {
        id: page.id,
        title: title,
        slug: generateSlug(title),
        excerpt: excerpt,
        content: content,
        fullContent: fullContent,
        tags: tags,
        category: category,
        status: 'Published', // 默认状态
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
        cover: page.cover?.external?.url || page.cover?.file?.url || generateDefaultCover(category),
        url: page.url,
        wordCount: (content || fullContent).length,
        readingTime: calculateReadingTime(content || fullContent)
      };

      enhancedPosts.push(enhancedPost);
    }

    console.log(`✅ 成功处理 ${enhancedPosts.length} 篇文章`);
    return enhancedPosts;

  } catch (error) {
    console.error('❌ 获取增强博客数据失败:', error);
    return [];
  }
}

/**
 * 提取块内容
 */
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
    
    default:
      return '';
  }
}

/**
 * 生成智能摘要
 */
function generateExcerpt(content, maxLength = 200) {
  if (!content) return '';
  
  // 清理Markdown标记
  const cleanContent = content
    .replace(/#{1,6}\s+/g, '') // 移除标题标记
    .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
    .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
    .replace(/`(.*?)`/g, '$1') // 移除代码标记
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除链接标记
    .trim();
  
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }
  
  return cleanContent.substring(0, maxLength) + '...';
}

/**
 * 生成智能标签
 */
function generateSmartTags(title, content) {
  const tags = [];
  const text = (title + ' ' + content).toLowerCase();
  
  // 网络安全相关标签
  if (text.includes('网络安全') || text.includes('cybersecurity')) tags.push('网络安全');
  if (text.includes('渗透测试') || text.includes('penetration')) tags.push('渗透测试');
  if (text.includes('漏洞') || text.includes('vulnerability')) tags.push('漏洞分析');
  if (text.includes('ctf') || text.includes('竞赛')) tags.push('CTF竞赛');
  if (text.includes('python') || text.includes('编程')) tags.push('编程技术');
  if (text.includes('web') || text.includes('web应用')) tags.push('Web安全');
  if (text.includes('加密') || text.includes('crypto')) tags.push('密码学');
  if (text.includes('工具') || text.includes('tool')) tags.push('安全工具');
  
  // 如果没有匹配到标签，使用默认标签
  if (tags.length === 0) {
    tags.push('技术分享');
  }
  
  return tags;
}

/**
 * 生成智能分类
 */
function generateSmartCategory(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  
  if (text.includes('网络安全') || text.includes('cybersecurity')) return '网络安全';
  if (text.includes('渗透测试') || text.includes('penetration')) return '渗透测试';
  if (text.includes('漏洞') || text.includes('vulnerability')) return '漏洞分析';
  if (text.includes('ctf') || text.includes('竞赛')) return 'CTF竞赛';
  if (text.includes('python') || text.includes('编程')) return '编程技术';
  
  return '技术分享';
}

/**
 * 生成URL友好的别名
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-') // 空格替换为连字符
    .trim();
}

/**
 * 生成默认封面
 */
function generateDefaultCover(category) {
  const coverMap = {
    '网络安全': '🛡️',
    '渗透测试': '🎯',
    '漏洞分析': '🔍',
    'CTF竞赛': '🏆',
    '编程技术': '💻',
    '技术分享': '📝'
  };
  
  return coverMap[category] || '📄';
}

/**
 * 计算阅读时间
 */
function calculateReadingTime(content) {
  const wordsPerMinute = 200; // 中文阅读速度
  const wordCount = content.length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes}分钟阅读`;
}

/**
 * 获取数据库统计信息
 */
export async function getDatabaseStats() {
  try {
    const posts = await getEnhancedBlogPosts();
    
    const stats = {
      totalPosts: posts.length,
      totalWords: posts.reduce((sum, post) => sum + post.wordCount, 0),
      categories: [...new Set(posts.map(post => post.category))],
      tags: [...new Set(posts.flatMap(post => post.tags))],
      lastUpdate: posts.length > 0 ? Math.max(...posts.map(post => new Date(post.lastEditedTime).getTime())) : null
    };
    
    return stats;
  } catch (error) {
    console.error('❌ 获取数据库统计失败:', error);
    return null;
  }
}
