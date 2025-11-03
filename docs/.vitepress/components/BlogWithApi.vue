<template>
  <div class="api-blog">
    <div class="blog-header">
      <h2>📝 最新博客文章</h2>
      <p>从Notion API获取的最新网络安全文章</p>
      
      <!-- API状态信息 -->
      <div class="api-status" :class="apiStatus.includes('成功') ? 'success' : apiStatus.includes('失败') ? 'failure' : 'loading'">
        📊 数据来源: {{ apiStatus }}
      </div>
    </div>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>正在加载文章...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <p>❌ 加载失败: {{ error }}</p>
      <p class="error-detail">已自动切换到模拟数据显示</p>
      <button @click="fetchPosts" class="retry-btn">重试</button>
    </div>
    
    <div v-else-if="posts.length === 0" class="empty">
      <p>📭 暂无文章</p>
    </div>
    
    <div v-else class="posts-grid">
      <article v-for="post in posts" :key="post.id" class="post-card">
        <div v-if="post.cover" class="post-cover">
          <img :src="post.cover" :alt="post.title" />  
        </div>
        
        <div class="post-content">
          <h3 class="post-title">{{ post.title }}</h3>
          <p class="post-excerpt">{{ post.excerpt }}</p>
          
          <div class="post-meta">
            <div class="post-tags">
              <span v-for="tag in post.tags" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
            <div class="post-date">
              {{ formatDate(post.createdTime) }}
            </div>
          </div>
        </div>
      </article>
    </div>
    
    <!-- 最后更新时间 -->
    <div class="last-updated" v-if="lastUpdated">
      ⏱️ 最后更新: {{ lastUpdated }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'BlogWithApi',
  setup() {
    const posts = ref([])
    const loading = ref(false)
    const error = ref(null)
    const apiStatus = ref('未开始')
    const lastUpdated = ref('')
    
    // 日志函数，用于调试 - 增强版
    const log = (message, data = null, level = 'info') => {
      const timestamp = new Date().toISOString()
      const prefix = `[BlogWithApi] [${timestamp}] [${level.toUpperCase()}]`
      if (level === 'error') {
        console.error(`${prefix} ${message}`, data ? data : '')
      } else if (level === 'warn') {
        console.warn(`${prefix} ${message}`, data ? data : '')
      } else {
        console.log(`${prefix} ${message}`, data ? data : '')
      }
    }
    
    // 模拟数据（作为后备）
    const mockPosts = [
      {
        id: '1',
        title: '网络安全基础：常见威胁与防护策略',
        excerpt: '本文介绍了当前网络环境中常见的安全威胁类型，以及相应的防护策略和最佳实践。通过学习这些知识，您可以更好地保护您的系统和数据安全。',
        tags: ['网络安全', '防护策略'],
        createdTime: new Date().toISOString(),
        cover: null
      },
      {
        id: '2',
        title: '渗透测试实战：从信息收集到漏洞利用',
        excerpt: '详细讲解渗透测试的完整流程，包括信息收集、漏洞扫描、漏洞验证和报告编写。通过实际案例分析，帮助读者掌握渗透测试的核心技能。',
        tags: ['渗透测试', '实战经验'],
        createdTime: new Date(Date.now() - 86400000).toISOString(),
        cover: null
      },
      {
        id: '3',
        title: 'CTF竞赛解析：Web安全题目解题思路',
        excerpt: '分析近期CTF竞赛中的Web安全题目，分享解题思路和技巧。本文涵盖了常见的Web安全漏洞，如XSS、CSRF、SQL注入等。',
        tags: ['CTF竞赛', 'Web安全'],
        createdTime: new Date(Date.now() - 172800000).toISOString(),
        cover: null
      }
    ]
    
    // 增加直接使用模拟数据的选项，便于调试 - 默认启用模拟数据
     const useMockDataOnly = ref(true)
    
    // 从API获取文章数据 - 增强版，添加更详细的错误处理和超时设置
    const fetchPosts = async () => {
      loading.value = true
      error.value = null
      apiStatus.value = '正在准备请求'
      log('开始获取文章数据')
      
      try {
        // 如果选择只使用模拟数据，则跳过API调用
        if (useMockDataOnly.value) {
          log('使用模拟数据，跳过API调用', null, 'warn')
          apiStatus.value = '使用模拟数据'
          posts.value = [...mockPosts]
          lastUpdated.value = new Date().toLocaleString('zh-CN')
          return
        }
        
        apiStatus.value = '正在发送请求'
        log('准备发送API请求到 http://localhost:3000/api/notion/posts')
        
        // 添加超时设置
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时
        
        const startTime = performance.now()
        log('发送请求中...')
        
        const response = await fetch('http://localhost:3000/api/notion/posts', {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include' // 包含cookies
        })
        
        const endTime = performance.now()
        clearTimeout(timeoutId)
        log(`请求完成，状态码: ${response.status}, 响应时间: ${(endTime - startTime).toFixed(2)}ms`)
        
        if (!response.ok) {
          apiStatus.value = `请求失败: ${response.status}`
          const errorData = await response.json().catch(() => ({}))
          log(`API响应错误: ${response.status}`, errorData, 'error')
          throw new Error(`API响应错误: ${response.status} ${errorData.message || ''}`.trim())
        }
        
        apiStatus.value = '处理响应数据'
        const data = await response.json()
        log('成功获取API响应', data)
        
        if (data.success && Array.isArray(data.posts)) {
          posts.value = data.posts
          apiStatus.value = '数据加载成功'
          log(`成功加载 ${data.posts.length} 篇文章`)
        } else {
          apiStatus.value = '数据格式错误'
          log('API返回的数据格式不正确', data, 'error')
          throw new Error('API返回的数据格式不正确')
        }
        
        lastUpdated.value = new Date().toLocaleString('zh-CN')
        
        // 如果API返回空数据，则使用模拟数据
        if (posts.value.length === 0) {
          log('API返回空数据，使用模拟数据', null, 'warn')
          posts.value = [...mockPosts]
        }
      } catch (err) {
        apiStatus.value = `请求失败: ${err.name}`
        const errorMessage = err.name === 'AbortError' ? '请求超时' : err.message
        error.value = errorMessage
        log(`获取数据失败: ${errorMessage}`, err, 'error')
        
        // 如果API调用失败，使用模拟数据作为后备
        log('使用模拟数据作为后备')
        posts.value = [...mockPosts]
        lastUpdated.value = new Date().toLocaleString('zh-CN')
      } finally {
        loading.value = false
        log('数据加载完成')
      }
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      } catch (err) {
        log('日期格式化错误', err.message, 'error')
        return '日期未知'
      }
    }
    
    // 组件挂载时加载数据
    onMounted(() => {
      log('组件挂载，开始加载数据')
      fetchPosts()
    })
    
    return {
      posts,
      loading,
      error,
      fetchPosts,
      formatDate,
      apiStatus,
      lastUpdated
    }
  }
}
</script>

<style scoped>
.api-blog {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.blog-header {
  text-align: center;
  margin-bottom: 2rem;
}

.blog-header h2 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.blog-header p {
  font-size: 1rem;
  color: #666;
}

/* API状态指示器样式 */
.api-status {
  margin: 1rem auto;
  padding: 0.8rem;
  border-radius: 8px;
  font-size: 0.95rem;
  text-align: center;
  max-width: 500px;
  font-weight: 500;
  border: 1px solid transparent;
}

.api-status.success {
  background-color: #d1fae5;
  color: #065f46;
  border-color: #a7f3d0;
}

.api-status.failure {
  background-color: #fee2e2;
  color: #991b1b;
  border-color: #fecaca;
}

.api-status.loading {
  background-color: #dbeafe;
  color: #1e40af;
  border-color: #bfdbfe;
}

/* 错误详情样式 */
.error-detail {
  font-size: 0.85rem;
  margin: 0.5rem 0;
  opacity: 0.8;
}

/* 最后更新时间样式 */
.last-updated {
  text-align: center;
  margin-top: 2rem;
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
}

.loading, .error, .empty {
  text-align: center;
  padding: 2rem;
  margin: 1rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #ef4444;
  background-color: #fef2f2;
  border-radius: 8px;
}

.retry-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background-color: #2563eb;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin: 1rem 0;
}

.post-card {
  background: #f9fafb;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.post-cover {
  height: 180px;
  overflow: hidden;
}

.post-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-content {
  padding: 1.2rem;
}

.post-title {
  font-size: 1.2rem;
  margin-bottom: 0.8rem;
  line-height: 1.4;
}

.post-excerpt {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.post-date {
  color: #94a3b8;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .api-blog {
    padding: 1rem;
  }
  
  .posts-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .blog-header h2 {
    font-size: 1.5rem;
  }
}
</style>