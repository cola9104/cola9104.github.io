import { Client } from '@notionhq/client';

// Notion API配置
const notion = new Client({
  auth: process.env.NOTION_TOKEN, // 需要在环境变量中设置
});

// 数据库ID - 需要替换为你的Notion数据库ID
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// 重试配置
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1秒
  maxDelay: 10000, // 10秒
  backoffMultiplier: 2
};

// 缓存配置
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 带重试的API调用封装
 */
async function withRetry(fn, retries = RETRY_CONFIG.maxRetries) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 如果是最后一次尝试，直接抛出错误
      if (attempt === retries) {
        break;
      }

      // 根据错误类型决定是否重试
      const shouldRetry =
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        (error.status >= 500 && error.status < 600) ||
        error.status === 429; // Rate limit

      if (!shouldRetry) {
        throw error;
      }

      // 计算延迟时间（指数退避）
      const delayTime = Math.min(
        RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
        RETRY_CONFIG.maxDelay
      );

      console.warn(`Notion API调用失败 (尝试 ${attempt + 1}/${retries + 1}), ${delayTime}ms后重试...`, error.message);
      await delay(delayTime);
    }
  }

  throw lastError;
}

/**
 * 获取缓存或执行函数
 */
async function getCached(key, fn) {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    console.log(`使用缓存数据: ${key}`);
    return cached.data;
  }

  const data = await fn();
  cache.set(key, { data, timestamp: now });
  return data;
}

/**
 * 从Notion获取博客文章列表
 */
export async function getBlogPosts() {
  return getCached('blog-posts', async () => {
    try {
      const response = await withRetry(() =>
        notion.databases.query({
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
        })
      );

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
      // 返回空数组而不是抛出错误，保持应用稳定性
      return [];
    }
  });
}

/**
 * 根据slug获取特定博客文章
 */
export async function getBlogPostBySlug(slug) {
  return getCached(`blog-post-${slug}`, async () => {
    try {
      const response = await withRetry(() =>
        notion.databases.query({
          database_id: DATABASE_ID,
          filter: {
            property: 'Slug',
            rich_text: {
              equals: slug
            }
          }
        })
      );

      if (response.results.length === 0) {
        return null;
      }

      const page = response.results[0];

      // 获取页面内容（也使用重试机制）
      const blocks = await withRetry(() =>
        notion.blocks.children.list({
          block_id: page.id
        })
      );

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
  });
}

/**
 * 获取网络安全相关的文章
 */
export async function getCybersecurityPosts() {
  return getCached('cybersecurity-posts', async () => {
    try {
      const response = await withRetry(() =>
        notion.databases.query({
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
        })
      );

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
  });
}

/**
 * 清除所有缓存（用于强制刷新）
 */
export function clearCache() {
  cache.clear();
  console.log('Notion数据缓存已清除');
}

/**
 * 清除特定键的缓存
 */
export function clearCacheByKey(key) {
  cache.delete(key);
  console.log(`Notion数据缓存已清除: ${key}`);
}
