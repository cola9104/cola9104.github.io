import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件 - 配置CORS以允许VitePress开发服务器访问
app.use(cors({
  origin: 'http://localhost:5173', // VitePress开发服务器地址
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Notion API配置
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// API路由：获取博客文章
app.get('/api/notion/posts', async (req, res) => {
  try {
    console.log('📊 获取Notion文章...');
    
    const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': NOTION_TOKEN,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        page_size: 10
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Notion API Error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    // 转换数据格式
    const posts = data.results.map(page => {
      const title = page.properties['名称']?.title?.[0]?.text?.content || 
                   page.properties['Title']?.title?.[0]?.text?.content || 
                   'Untitled';
      
      const content = page.properties['文本']?.rich_text?.[0]?.text?.content || 
                     page.properties['Excerpt']?.rich_text?.[0]?.text?.content || 
                     '';
      
      return {
        id: page.id,
        title: title,
        slug: `post-${page.id}`,
        excerpt: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        tags: page.properties['Tags']?.multi_select?.map(tag => tag.name) || ['未分类'],
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
        cover: page.cover?.external?.url || page.cover?.file?.url || null
      };
    });

    res.json({
      success: true,
      posts: posts,
      total: data.results.length
    });

  } catch (error) {
    console.error('❌ 获取文章失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      posts: []
    });
  }
});

// API路由：获取数据库信息
app.get('/api/notion/database', async (req, res) => {
  try {
    console.log('🏗️ 获取数据库信息...');
    
    const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': NOTION_TOKEN,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Notion API Error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    res.json({
      success: true,
      database: {
        title: data.title[0]?.text?.content || 'Untitled',
        properties: Object.keys(data.properties).map(propName => ({
          name: propName,
          type: data.properties[propName].type
        }))
      }
    });

  } catch (error) {
    console.error('❌ 获取数据库信息失败:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    notion_configured: !!(NOTION_TOKEN && DATABASE_ID)
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 API服务器运行在 http://localhost:${PORT}`);
  console.log(`📊 Notion配置状态: ${NOTION_TOKEN && DATABASE_ID ? '✅ 已配置' : '❌ 未配置'}`);
});

export default app;
