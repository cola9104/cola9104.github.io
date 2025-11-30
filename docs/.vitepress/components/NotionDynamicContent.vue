<template>
  <div class="notion-dynamic-content">
    <div class="content-header">
      <h3>🔄 动态内容更新</h3>
      <p>从Notion自动同步的最新内容</p>
    </div>
    
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在从Notion获取最新数据...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <p>❌ 获取数据失败: {{ error }}</p>
      <button @click="refreshData('home')" class="retry-btn">重试</button>
    </div>
    
    <div v-else-if="data && data.length > 0" class="content-list">
      <div class="content-summary">
        <p>📝 共获取到 {{ data.length }} 个内容块</p>
        <p>⏱️ 更新时间: {{ formatDate(store.lastUpdate) }}</p>
      </div>
      
      <div class="blocks-preview">
        <h4>📋 内容预览</h4>
        <div 
          v-for="(block, index) in previewBlocks" 
          :key="block.id || index"
          class="block-item"
        >
          <div class="block-type">{{ getBlockType(block) }}</div>
          <div class="block-content">{{ getBlockContent(block) }}</div>
        </div>
        
        <div v-if="data.length > previewLimit" class="more-blocks">
          <p>... 还有 {{ data.length - previewLimit }} 个内容块未显示</p>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <p>📭 暂无动态内容</p>
    </div>
    
    <div class="content-actions">
      <button @click="refreshData('home')" class="refresh-btn" :disabled="loading">
        {{ loading ? '刷新中...' : '🔄 刷新数据' }}
      </button>
      <button @click="navigateToNotion" class="notion-btn">
        📝 前往Notion编辑
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useNotion } from '../plugins/notionPlugin.js'

// 使用Notion组合式函数
const { data, loading, error, fetchHomepageData, refreshData, store } = useNotion()

// 预览限制
const previewLimit = 3

// 计算预览块
const previewBlocks = computed(() => {
  if (!data.value) return []
  return data.value.slice(0, previewLimit)
})

// 获取块类型
const getBlockType = (block) => {
  const typeMap = {
    'paragraph': '📝 段落',
    'heading_1': '🔤 一级标题',
    'heading_2': '🔤 二级标题',
    'heading_3': '🔤 三级标题',
    'bulleted_list_item': '• 列表项',
    'numbered_list_item': '1. 有序列表',
    'toggle': '▶️ 折叠块',
    'callout': '💬 提示框',
    'code': '💻 代码块',
    'image': '🖼️ 图片',
    'divider': '--- 分隔线',
    'table': '📊 表格',
    'child_page': '📄 子页面',
    'embed': '🔗 嵌入内容'
  }
  
  const type = block.type
  return typeMap[type] || `📌 ${type}`
}

// 获取块内容文本
const getBlockContent = (block) => {
  const type = block.type
  
  // 处理不同类型的块
  switch (type) {
    case 'paragraph':
    case 'heading_1':
    case 'heading_2':
    case 'heading_3':
    case 'callout':
      return block[type]?.rich_text?.map(t => t.text?.content || '').join('') || '无内容'
    case 'bulleted_list_item':
    case 'numbered_list_item':
      return block[type]?.rich_text?.map(t => t.text?.content || '').join('') || '无内容'
    case 'code':
      const code = block[type]?.rich_text?.map(t => t.text?.content || '').join('') || '无内容'
      const language = block[type]?.language || 'plaintext'
      return `${language}: ${code.substring(0, 50)}${code.length > 50 ? '...' : ''}`
    case 'child_page':
      return block[type]?.title || '无标题子页面'
    case 'divider':
      return '--- 分隔线 ---'
    default:
      return `[${type}类型内容]`
  }
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '未更新'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 导航到Notion
const navigateToNotion = () => {
  window.open('https://www.notion.so', '_blank')
}

// 页面加载时获取数据
onMounted(() => {
  fetchHomepageData()
  
  // 定期自动刷新 (每30秒)
  const interval = setInterval(() => {
    if (!loading.value) {
      refreshData('home')
    }
  }, 30000)
  
  // 清理函数
  return () => clearInterval(interval)
})
</script>

<style>
/* 使用全局CSS变量，确保与其他页面样式一致 */
.notion-dynamic-content {
  background: var(--bg-primary);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  padding: 2rem;
  margin: 1rem 0;
  border: 1px solid var(--border-color);
  transition: var(--transition);
}

.notion-dynamic-content:hover {
  box-shadow: var(--shadow-lg);
}

.content-header {
  text-align: center;
  margin-bottom: 2rem;
}

.content-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.content-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 1rem;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.content-summary {
  background: var(--bg-secondary);
  padding: 1.25rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  font-size: 0.95rem;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.content-summary p {
  margin: 0.5rem 0;
  font-weight: 500;
}

.blocks-preview {
  margin-bottom: 2rem;
}

.blocks-preview h4 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  position: relative;
  padding-bottom: 0.75rem;
}

.blocks-preview h4::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 3px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border-radius: 3px;
}

.block-item {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 4px solid var(--primary-color);
  transition: var(--transition);
  border: 1px solid var(--border-color);
}

.block-item:hover {
  transform: translateX(5px);
  box-shadow: var(--shadow-md);
}

.block-type {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.block-content {
  font-size: 1rem;
  color: var(--text-primary);
  line-height: 1.7;
}

.more-blocks {
  text-align: center;
  font-size: 0.95rem;
  color: var(--text-muted);
  font-style: italic;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.content-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.refresh-btn,
.notion-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.refresh-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.refresh-btn:disabled {
  background: var(--text-muted);
  cursor: not-allowed;
  transform: none;
}

.notion-btn {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.notion-btn:hover {
  background: var(--bg-secondary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--primary-color);
}

.retry-btn {
  background: linear-gradient(135deg, var(--warning-color), #d97706);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  margin-top: 1rem;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.retry-btn:hover {
  background: #d97706;
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
</style>