import { createApp } from 'vue'

// 导出客户端增强函数
export default function enhanceClient(app, router) {
  
  // 全局数据存储
  const globalStore = {
    lastUpdate: null,
    notionData: {},
    loading: false
  }
  
  // 添加全局属性
  app.config.globalProperties.$notion = {
    store: globalStore,
    
    // 获取首页数据
    async getHomepageData() {
      try {
        globalStore.loading = true
        
        console.log('🔍 开始获取首页数据...')
        console.log('🔑 Token:', (import.meta.env.NOTION_TOKEN || 'Bearer ntn_Z91829129697EenwSBwmKQB1xdPOEjLK2i46iTzr9gf572').substring(0, 10) + '...')
        
        // 调用Notion API获取首页数据
        const databaseId = '2682235821c980debf43cf8e6ff838d5'; // 移除连字符的32位ID
        const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
          method: 'POST',
          headers: {
            'Authorization': (import.meta.env.NOTION_TOKEN || 'Bearer ntn_Z91829129697EenwSBwmKQB1xdPOEjLK2i46iTzr9gf572'),
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28'
          },
          body: JSON.stringify({
            page_size: 10
          })
        })
        
        console.log('📊 API响应状态:', response.status)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`Notion API Error: ${response.status} - ${errorData.message || 'Unknown error'}`)
        }
        
        const data = await response.json()
        console.log('📋 获取到的数据数量:', data.results?.length || 0)
        
        globalStore.notionData['home'] = data.results
        globalStore.lastUpdate = new Date()
        
        console.log('✅ 首页数据更新成功')
        return data.results
      } catch (error) {
        console.error('❌ 获取首页数据失败:', error)
        return null
      } finally {
        globalStore.loading = false
      }
    },
    
    // 根据页面路径获取对应数据
    async getPageData(path) {
      try {
        globalStore.loading = true
        
        // 从路径提取页面标题
        const pageTitle = path.split('/').filter(Boolean).pop()
        
        // 调用Notion API查询对应页面
        const databaseId = '2682235821c980debf43cf8e6ff838d5'; // 移除连字符的32位ID
        const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
          method: 'POST',
          headers: {
            'Authorization': (import.meta.env.NOTION_TOKEN || 'Bearer ntn_Z91829129697EenwSBwmKQB1xdPOEjLK2i46iTzr9gf572'),
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28'
          },
          body: JSON.stringify({
            filter: {
              property: '名称',
              title: {
                contains: pageTitle
              }
            }
          })
        })
        
        if (!response.ok) {
          throw new Error(`Notion API Error: ${response.status}`)
        }
        
        const data = await response.json()
        globalStore.notionData[path] = data.results
        globalStore.lastUpdate = new Date()
        
        console.log(`✅ 页面数据更新成功: ${path}`)
        return data.results
      } catch (error) {
        console.error(`❌ 获取页面数据失败: ${path}`, error)
        return null
      } finally {
        globalStore.loading = false
      }
    },
    
    // 获取分类下的所有文章
    async getCategoryData(category) {
      try {
        globalStore.loading = true
        
        const databaseId = '2682235821c980debf43cf8e6ff838d5'; // 移除连字符的32位ID
        const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
          method: 'POST',
          headers: {
            'Authorization': (import.meta.env.NOTION_TOKEN || 'Bearer ntn_Z91829129697EenwSBwmKQB1xdPOEjLK2i46iTzr9gf572'),
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28'
          },
          body: JSON.stringify({
            filter: {
              or: [
                {
                  property: '名称',
                  title: {
                    contains: category
                  }
                },
                {
                  property: '文本',
                  rich_text: {
                    contains: category
                  }
                }
              ]
            }
          })
        })
        
        if (!response.ok) {
          throw new Error(`Notion API Error: ${response.status}`)
        }
        
        const data = await response.json()
        globalStore.notionData['category_' + category] = data.results
        globalStore.lastUpdate = new Date()
        
        console.log(`✅ 分类数据更新成功: ${category}`)
        return data.results
      } catch (error) {
        console.error(`❌ 获取分类数据失败: ${category}`, error)
        return null
      } finally {
        globalStore.loading = false
      }
    }
  }
  
  // 为了防止在构建时报错，我们只在客户端环境中添加路由逻辑
  if (typeof window !== 'undefined') {
    // 使用传入的router实例或VitePress提供的router实例
    const currentRouter = router || window.__VP_ROUTER__;
    
    // 添加路由变更监听
    if (currentRouter) {
      // 检查router API类型并适配
      if (typeof currentRouter.on === 'function') {
        // VitePress 1.6+ 的路由API可能使用事件监听
        currentRouter.on('routeChangeStart', async (to) => {
          console.log(`🔄 页面切换: 到 ${to.path}`)
          
          try {
            // 设置加载状态
            globalStore.loading = true;
            
            // 根据路径类型获取不同的数据
            if (to.path === '/') {
              // 首页 - 获取首页数据
              await app.config.globalProperties.$notion.getHomepageData();
            } else if (['/网络安全/', '/渗透测试/', '/漏洞分析/', '/嵌入式安全/', '/CTF竞赛/'].includes(to.path)) {
              // 分类页面
              const category = to.path.split('/')[1]; // 提取分类名称
              await app.config.globalProperties.$notion.getCategoryData(category);
            } else if (to.path.includes('/')) {
              // 其他页面
              await app.config.globalProperties.$notion.getPageData(to.path);
            }
          } catch (error) {
            console.error('Failed to fetch Notion data:', error);
          } finally {
            // 完成加载
            globalStore.loading = false;
          }
        });
        
        // 监听路由变化完成事件
        currentRouter.on('routeChangeEnd', (to) => {
          // 给页面元素一点时间渲染
          setTimeout(() => {
            const pageElement = document.querySelector('.content')
            if (pageElement && globalStore.notionData[to.path]) {
              // 这里可以根据需要更新页面内容
              console.log(`📄 页面 ${to.path} 加载完成，数据已就绪`)
            }
          }, 500)
        });
      } else if (typeof currentRouter.beforeEach === 'function') {
        // 兼容旧版router API
        currentRouter.beforeEach(async (to, from) => {
          console.log(`🔄 页面切换: 从 ${from?.path || 'unknown'} 到 ${to.path}`)
          
          try {
            globalStore.loading = true;
            
            if (to.path === '/') {
              await app.config.globalProperties.$notion.getHomepageData();
            } else if (['/网络安全/', '/渗透测试/', '/漏洞分析/', '/嵌入式安全/', '/CTF竞赛/'].includes(to.path)) {
              const category = to.path.split('/')[1];
              await app.config.globalProperties.$notion.getCategoryData(category);
            } else if (to.path.includes('/')) {
              await app.config.globalProperties.$notion.getPageData(to.path);
            }
          } catch (error) {
            console.error('Failed to fetch Notion data:', error);
          } finally {
            globalStore.loading = false;
          }
        });
        
        currentRouter.afterEach(async (to) => {
          setTimeout(() => {
            const pageElement = document.querySelector('.content')
            if (pageElement && globalStore.notionData[to.path]) {
              console.log(`📄 页面 ${to.path} 加载完成，数据已就绪`)
            }
          }, 500)
        });
      }
    }
    
    // 添加全局的刷新数据函数，供组件调用
    window.refreshNotionData = async (path) => {
      if (path === '/') {
        return await app.config.globalProperties.$notion.getHomepageData()
      } else {
        return await app.config.globalProperties.$notion.getPageData(path)
      }
    }
  }
}