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
  margin-bottom: 0.5rem;
}

.blog-header p {
  font-size: 1.1rem;
  color: #666;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.post-card {
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  padding: 1.5rem;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.post-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.post-excerpt {
  color: #666;
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
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.post-date {
  color: #94a3b8;
  font-size: 0.9rem;
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