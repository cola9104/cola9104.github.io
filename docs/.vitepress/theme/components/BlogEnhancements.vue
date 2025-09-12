<template>
  <div class="blog-enhancements">
    <!-- 搜索功能 -->
    <div class="search-functionality" v-if="showSearch">
      <input 
        v-model="searchQuery" 
        @input="handleSearch"
        type="text" 
        placeholder="搜索文章..." 
        class="search-input-enhanced" 
      />
      <div class="search-results" v-if="searchResults.length > 0">
        <div 
          v-for="result in searchResults" 
          :key="result.id"
          class="search-result-item"
          @click="navigateToArticle(result)"
        >
          <h4>{{ result.title }}</h4>
          <p>{{ result.excerpt }}</p>
          <span class="result-category">{{ result.category }}</span>
        </div>
      </div>
    </div>

    <!-- 标签筛选 -->
    <div class="tag-filtering" v-if="showTagFilter">
      <div class="selected-tags">
        <span 
          v-for="tag in selectedTags" 
          :key="tag"
          class="selected-tag"
          @click="removeTag(tag)"
        >
          {{ tag }} ×
        </span>
      </div>
    </div>

    <!-- 文章统计 -->
    <div class="article-stats" v-if="showStats">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <span class="stat-number">{{ totalArticles }}</span>
          <span class="stat-label">总文章数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-info">
          <span class="stat-number">{{ totalViews }}</span>
          <span class="stat-label">总阅读量</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-info">
          <span class="stat-number">{{ avgRating }}</span>
          <span class="stat-label">平均评分</span>
        </div>
      </div>
    </div>

    <!-- 阅读进度条 -->
    <div class="reading-progress" v-if="showProgress">
      <div class="progress-bar" :style="{ width: readingProgress + '%' }"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BlogEnhancements',
  data() {
    return {
      searchQuery: '',
      searchResults: [],
      selectedTags: [],
      totalArticles: 50,
      totalViews: 12500,
      avgRating: 4.8,
      readingProgress: 0,
      showSearch: true,
      showTagFilter: true,
      showStats: true,
      showProgress: true,
      articles: [
        {
          id: 1,
          title: '零信任架构在网络安全中的应用实践',
          excerpt: '深入探讨零信任安全模型的核心原理...',
          category: '网络安全',
          tags: ['零信任', '安全架构', '最佳实践']
        },
        {
          id: 2,
          title: 'Web应用渗透测试完整指南',
          excerpt: '从信息收集到漏洞利用，全面介绍...',
          category: '渗透测试',
          tags: ['Web安全', '渗透测试', 'OWASP']
        },
        {
          id: 3,
          title: 'CVE-2024-1234 漏洞深度分析',
          excerpt: '详细分析最新发现的CVE漏洞...',
          category: '漏洞分析',
          tags: ['CVE', '漏洞分析', '安全研究']
        }
      ]
    }
  },
  methods: {
    handleSearch() {
      if (this.searchQuery.length < 2) {
        this.searchResults = []
        return
      }
      
      this.searchResults = this.articles.filter(article => 
        article.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(this.searchQuery.toLowerCase()))
      )
    },
    
    navigateToArticle(article) {
      // 这里可以添加导航到具体文章的逻辑
      console.log('Navigate to:', article.title)
    },
    
    removeTag(tag) {
      this.selectedTags = this.selectedTags.filter(t => t !== tag)
    },
    
    updateReadingProgress() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      this.readingProgress = (scrollTop / scrollHeight) * 100
    }
  },
  
  mounted() {
    window.addEventListener('scroll', this.updateReadingProgress)
  },
  
  beforeUnmount() {
    window.removeEventListener('scroll', this.updateReadingProgress)
  }
}
</script>

<style scoped>
.blog-enhancements {
  position: relative;
}

.search-functionality {
  position: relative;
  margin-bottom: 2rem;
}

.search-input-enhanced {
  width: 100%;
  padding: 1rem 1.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 25px;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
}

.search-input-enhanced:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
}

.search-result-item {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.3s ease;
}

.search-result-item:hover {
  background: #f9fafb;
}

.search-result-item h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.search-result-item p {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.result-category {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.tag-filtering {
  margin-bottom: 2rem;
}

.selected-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.selected-tag {
  background: #667eea;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.selected-tag:hover {
  background: #5a67d8;
}

.article-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 0.9rem;
  color: #6b7280;
}

.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: rgba(0,0,0,0.1);
  z-index: 1000;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

@media (max-width: 768px) {
  .article-stats {
    grid-template-columns: 1fr;
  }
  
  .search-results {
    position: relative;
    margin-top: 1rem;
  }
}
</style>
