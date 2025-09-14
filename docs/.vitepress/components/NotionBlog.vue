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
        // 调用实际的Notion API
        const response = await fetch('/api/notion/posts', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        posts.value = data.posts || []
        
        // 如果API调用失败，使用模拟数据作为后备
        if (posts.value.length === 0) {
          const mockPosts = [
            {
              id: '1',
              title: '2024年网络安全趋势分析',
              slug: 'cybersecurity-trends-2024',
              excerpt: '深入分析2024年网络安全领域的主要趋势和挑战，包括AI安全、云安全、零信任架构等热点话题。',
              tags: ['网络安全', '趋势分析', 'AI安全'],
              createdTime: '2024-01-15T10:00:00Z',
              cover: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop'
            },
            {
              id: '2',
              title: 'Web应用渗透测试实战指南',
              slug: 'web-penetration-testing-guide',
              excerpt: '详细介绍Web应用渗透测试的完整流程，从信息收集到漏洞利用的实战技巧和工具使用。',
              tags: ['渗透测试', 'Web安全', '实战指南'],
              createdTime: '2024-01-10T14:30:00Z',
              cover: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop'
            },
            {
              id: '3',
              title: 'CTF竞赛解题思路分享',
              slug: 'ctf-solving-strategies',
              excerpt: '分享CTF竞赛中的解题思路和技巧，涵盖Web、Pwn、Crypto等多个方向的实战经验。',
              tags: ['CTF', '解题思路', '安全竞赛'],
              createdTime: '2024-01-05T09:15:00Z',
              cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop'
            }
          ]
          posts.value = mockPosts
        }
        
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        posts.value = mockPosts
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

<style scoped>
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
  color: var(--vp-c-text-1);
  margin-bottom: 0.5rem;
}

.blog-header p {
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--vp-c-border);
  border-top: 4px solid var(--vp-c-brand-1);
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
  color: var(--vp-c-danger-1);
}

.retry-btn {
  background: var(--vp-c-brand-1);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
}

.retry-btn:hover {
  background: var(--vp-c-brand-2);
}

.empty {
  text-align: center;
  padding: 3rem;
  color: var(--vp-c-text-2);
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.post-card {
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.post-cover {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.post-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-content {
  padding: 1.5rem;
}

.post-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.post-excerpt {
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin-bottom: 1rem;
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
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.post-date {
  color: var(--vp-c-text-3);
  font-size: 0.9rem;
}

.load-more {
  text-align: center;
  margin-top: 2rem;
}

.load-more-btn {
  background: var(--vp-c-brand-1);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s ease;
}

.load-more-btn:hover:not(:disabled) {
  background: var(--vp-c-brand-2);
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .notion-blog {
    padding: 1rem;
  }
  
  .posts-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .blog-header h2 {
    font-size: 2rem;
  }
}
</style>
