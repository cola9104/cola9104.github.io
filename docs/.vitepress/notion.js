import { Client } from '@notionhq/client';

// Notion API配置
const notion = new Client({
  auth: process.env.NOTION_TOKEN, // 需要在环境变量中设置
});

// 数据库ID - 需要替换为你的Notion数据库ID
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

/**
 * 从Notion获取博客文章列表
 */
export async function getBlogPosts() {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Status',
        select: {
          equals: 'Published'
        }
      },
      sorts: [
        {
          property: 'Created',
          direction: 'descending'
        }
      ]
    });

    return response.results.map(page => ({
      id: page.id,
      title: page.properties.Title?.title?.[0]?.text?.content || 'Untitled',
      slug: page.properties.Slug?.rich_text?.[0]?.text?.content || '',
      excerpt: page.properties.Excerpt?.rich_text?.[0]?.text?.content || '',
      tags: page.properties.Tags?.multi_select?.map(tag => tag.name) || [],
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
      cover: page.cover?.external?.url || page.cover?.file?.url || null
    }));
  } catch (error) {
    console.error('Error fetching blog posts from Notion:', error);
    return [];
  }
}

/**
 * 根据slug获取特定博客文章
 */
export async function getBlogPostBySlug(slug) {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Slug',
        rich_text: {
          equals: slug
        }
      }
    });

    if (response.results.length === 0) {
      return null;
    }

    const page = response.results[0];
    
    // 获取页面内容
    const blocks = await notion.blocks.children.list({
      block_id: page.id
    });

    return {
      id: page.id,
      title: page.properties.Title?.title?.[0]?.text?.content || 'Untitled',
      slug: page.properties.Slug?.rich_text?.[0]?.text?.content || '',
      excerpt: page.properties.Excerpt?.rich_text?.[0]?.text?.content || '',
      tags: page.properties.Tags?.multi_select?.map(tag => tag.name) || [],
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
      cover: page.cover?.external?.url || page.cover?.file?.url || null,
      content: blocks.results
    };
  } catch (error) {
    console.error('Error fetching blog post from Notion:', error);
    return null;
  }
}

/**
 * 获取网络安全相关的文章
 */
export async function getCybersecurityPosts() {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        and: [
          {
            property: 'Status',
            select: {
              equals: 'Published'
            }
          },
          {
            property: 'Category',
            select: {
              equals: 'Cybersecurity'
            }
          }
        ]
      },
      sorts: [
        {
          property: 'Created',
          direction: 'descending'
        }
      ]
    });

    return response.results.map(page => ({
      id: page.id,
      title: page.properties.Title?.title?.[0]?.text?.content || 'Untitled',
      slug: page.properties.Slug?.rich_text?.[0]?.text?.content || '',
      excerpt: page.properties.Excerpt?.rich_text?.[0]?.text?.content || '',
      tags: page.properties.Tags?.multi_select?.map(tag => tag.name) || [],
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
      cover: page.cover?.external?.url || page.cover?.file?.url || null
    }));
  } catch (error) {
    console.error('Error fetching cybersecurity posts from Notion:', error);
    return [];
  }
}
