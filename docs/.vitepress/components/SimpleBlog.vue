<template>
  <div class="notion-blog">
    <div class="blog-header">
      <h2>📝 最新博客文章</h2>
      <p>从Notion获取的最新网络安全文章</p>
    </div>
    
    <div class="posts-grid">
      <article v-for="post in posts" :key="post.id" class="post-card">
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
              {{ post.date }}
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'SimpleBlog',
  setup() {
    const posts = ref([])

    const loadPosts = () => {
      // 使用静态数据替代API调用
      posts.value = [
        {
          id: '1',
          title: '网络安全基础：常见威胁与防护策略',
          excerpt: '本文介绍了当前网络环境中常见的安全威胁类型，以及相应的防护策略和最佳实践。',
          tags: ['网络安全', '防护策略'],
          date: '2024-01-15'
        },
        {
          id: '2',
          title: '渗透测试实战：从信息收集到漏洞利用',
          excerpt: '详细讲解渗透测试的完整流程，包括信息收集、漏洞扫描、漏洞验证和报告编写。',
          tags: ['渗透测试', '实战经验'],
          date: '2024-01-10'
        },
        {
          id: '3',
          title: 'CTF竞赛解析：Web安全题目解题思路',
          excerpt: '分析近期CTF竞赛中的Web安全题目，分享解题思路和技巧。',
          tags: ['CTF竞赛', 'Web安全'],
          date: '2024-01-05'
        }
      ]
    }

    onMounted(() => {
      loadPosts()
    })

    return {
      posts
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
  padding: 2rem;
}

.post-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
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
  
  .post-card {
    padding: 1.5rem;
  }
}
</style>