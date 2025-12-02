<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  notionId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  lastUpdated: {
    type: String,
    default: ''
  },
  notionUrl: {
    type: String,
    default: ''
  }
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="notion-page-container">
    <div class="notion-header">
      <h1>{{ title }}</h1>
      <div class="notion-meta">
        <span v-if="lastUpdated" class="meta-item">
          <i class="icon-calendar"></i> 更新于: {{ formatDate(lastUpdated) }}
        </span>
        <a v-if="notionUrl" :href="notionUrl" target="_blank" rel="noopener noreferrer" class="meta-item notion-link">
          <i class="icon-external-link"></i> 在 Notion 中查看
        </a>
      </div>
    </div>

    <div class="notion-content">
      <div class="content-body">
        <!-- Content will be injected here by VitePress Markdown rendering -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.notion-page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 0;
}

.notion-header {
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 1rem;
}

.notion-header h1 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 2.2rem;
  line-height: 1.3;
}

.notion-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin-top: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.notion-link {
  color: var(--vp-c-brand);
  text-decoration: none;
  transition: color 0.2s;
}

.notion-link:hover {
  color: var(--vp-c-brand-dark);
  text-decoration: underline;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  color: var(--vp-c-text-2);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-btn:hover {
  background-color: var(--vp-c-brand-dark);
}
</style>
