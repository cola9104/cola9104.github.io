<template>
  <div class="notion-blog">
    <div class="blog-header">
      <h2>📝 最新博客文章</h2>
      <p>从Notion获取的最新网络安全文章</p>
    </div>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>正在加载文章...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <p>❌ 加载失败: {{ error }}</p>
      <button @click="loadPosts" class="retry-btn">重试</button>
    </div>
    
    <div v-else-if="posts.length === 0" class="empty">
      <p>📭 暂无文章</p>
    </div>
    
    <div v-else class="posts-grid">
      <article 
        v-for="post in posts" 
        :key="post.id" 
        class="post-card"
        @click="navigateToPost(post.slug)"
      >
        <div v-if="post.cover" class="post-cover">
          <img :src="post.cover" :alt="post.title" />
        </div>
        
        <div class="post-content">
          <h3 class="post-title">{{ post.title }}</h3>
          <p class="post-excerpt">{{ post.excerpt }}</p>
          
          <div class="post-meta">
            <div class="post-tags">
              <span 
                v-for="tag in post.tags" 
                :key="tag" 
                class="tag"
              >
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
    
    <div v-if="posts.length > 0" class="load-more">
      <button @click="loadMore" class="load-more-btn" :disabled="loading">
        {{ loading ? '加载中...' : '加载更多' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'NotionBlog',
  setup() {
    const router = useRouter()
    const posts = ref([])
    const loading = ref(false)
    const error = ref(null)
    const hasMore = ref(true)
    const currentPage = ref(1)

    const loadPosts = async () => {
      loading.value = true
      error.value = null

      try {
        // 使用本地API服务器（开发环境）或从构建时生成的数据文件（生产环境）
        const isDev = import.meta.env.DEV
        let data

        if (isDev) {
          // 开发环境：调用本地API服务器
          const response = await fetch('http://localhost:3000/api/posts', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          })

          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`)
          }

          data = await response.json()
        } else {
          // 生产环境：从构建时生成的静态数据文件读取
          try {
            const response = await fetch('/notion-data.json')
            if (response.ok) {
              data = await response.json()
            } else {
              // 降级：使用空数据
              data = { results: [] }
            }
          } catch (err) {
            console.warn('无法加载Notion数据文件，使用空数据', err)
            data = { results: [] }
          }
        }

        // 处理Notion数据
        posts.value = data.results.map(page => {
          const title = page.properties['名称']?.title?.[0]?.text?.content || 'Untitled'
          const content = page.properties['文本']?.rich_text?.[0]?.text?.content || ''
          
          // 生成智能摘要
          const excerpt = content.length > 200 ? content.substring(0, 200) + '...' : content
          
          // 生成智能标签
          const tags = []
          const text = (title + ' ' + content).toLowerCase()
          if (text.includes('网络安全')) tags.push('网络安全')
          if (text.includes('渗透测试')) tags.push('渗透测试')
          if (text.includes('漏洞')) tags.push('漏洞分析')
          if (text.includes('ctf')) tags.push('CTF竞赛')
          if (text.includes('python') || text.includes('编程')) tags.push('编程技术')
          if (tags.length === 0) tags.push('技术分享')
          
          // 生成智能分类
          let category = '技术分享'
          if (text.includes('网络安全')) category = '网络安全'
          else if (text.includes('渗透测试')) category = '渗透测试'
          else if (text.includes('漏洞')) category = '漏洞分析'
          else if (text.includes('ctf')) category = 'CTF竞赛'
          else if (text.includes('python') || text.includes('编程')) category = '编程技术'
          
          // 生成封面图标
          const coverMap = {
            '网络安全': '🛡️',
            '渗透测试': '🎯',
            '漏洞分析': '🔍',
            'CTF竞赛': '🏆',
            '编程技术': '💻',
            '技术分享': '📝'
          }
          
          return {
            id: page.id,
            title: title,
            slug: title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
            excerpt: excerpt,
            tags: tags,
            category: category,
            createdTime: page.created_time,
            lastEditedTime: page.last_edited_time,
            cover: coverMap[category] || '📄',
            readingTime: `${Math.ceil(content.length / 200)}分钟阅读`,
            wordCount: content.length
          }
        })
        
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        hasMore.value = false
      } catch (err) {
        error.value = err.message || '加载文章失败'
      } finally {
        loading.value = false
      }
    }

    const loadMore = async () => {
      if (loading.value || !hasMore.value) return
      
      currentPage.value++
      // 这里可以加载更多文章
      // 实际实现中应该调用分页API
    }

    const navigateToPost = (slug) => {
      router.push(`/blog/${slug}`)
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    onMounted(() => {
      loadPosts()
    })

    return {
      posts,
      loading,
      error,
      hasMore,
      loadPosts,
      loadMore,
      navigateToPost,
      formatDate
    }
  }
}
</script>

<style>
/* 使用全局CSS变量，确保与其他页面样式一致 */
.notion-blog {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.blog-header {
  text-align: center;
  margin-bottom: 3rem;
}

.blog-header h2 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.blog-header p {
  font-size: 1.1rem;
  color: var(--text-secondary);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 2rem;
  color: var(--accent-color);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.retry-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.retry-btn:hover {
  background: var(--primary-dark);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

/* 使用与其他页面相同的文章网格样式 */
.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 2.5rem;
  margin: 1rem 0;
}

/* 使用与其他页面相同的文章卡片样式 */
.post-card {
  background: var(--bg-primary);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: var(--transition);
  cursor: pointer;
  border: 1px solid var(--border-color);
}

.post-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
}

.post-cover {
  width: 100%;
  height: 220px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.post-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-content {
  padding: 2rem;
}

.post-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-primary);
  line-height: 1.4;
  transition: var(--transition);
}

.post-card:hover .post-title {
  color: var(--primary-color);
}

.post-excerpt {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1.5rem;
  font-size: 1rem;
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
  gap: 0.75rem;
}

/* 使用与其他页面相同的标签样式 */
.tag {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  padding: 0.35rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  transition: var(--transition);
}

.tag:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-2px);
}

.post-date {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.load-more {
  text-align: center;
  margin-top: 2rem;
}

.load-more-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.load-more-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.load-more-btn:disabled {
  background: var(--text-muted);
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 响应式设计，与其他页面保持一致 */
@media (max-width: 1024px) {
  .posts-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }
}

@media (max-width: 768px) {
  .notion-blog {
    padding: 1rem;
  }
  
  .posts-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .blog-header h2 {
    font-size: 2rem;
  }
  
  .post-cover {
    height: 180px;
  }
  
  .post-content {
    padding: 1.5rem;
  }
}
</style>
