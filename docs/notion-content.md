---
layout: page
title: 动态内容
description: 从Notion获取的动态内容展示
---

# 📊 动态内容展示

这里展示从Notion数据库获取的实时内容。

## 🔄 实时数据

<NotionBlog />

## 📈 数据统计

<div class="data-stats">
  <div class="stat-card">
    <div class="stat-icon">📝</div>
    <div class="stat-info">
      <span class="stat-number" id="total-posts">加载中...</span>
      <span class="stat-label">总文章数</span>
    </div>
  </div>
  
  <div class="stat-card">
    <div class="stat-icon">📅</div>
    <div class="stat-info">
      <span class="stat-number" id="latest-update">加载中...</span>
      <span class="stat-label">最后更新</span>
    </div>
  </div>
  
  <div class="stat-card">
    <div class="stat-icon">🏷️</div>
    <div class="stat-info">
      <span class="stat-number" id="total-tags">加载中...</span>
      <span class="stat-label">标签数量</span>
    </div>
  </div>
</div>

## 🔍 数据详情

<div class="data-details">
  <h3>📋 数据库信息</h3>
  <div id="database-info">
    <p>正在加载数据库信息...</p>
  </div>
  
  <h3>📊 属性结构</h3>
  <div id="properties-info">
    <p>正在加载属性信息...</p>
  </div>
</div>

<style>
.data-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
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

.data-details {
  margin-top: 3rem;
}

.data-details h3 {
  color: #1f2937;
  margin-bottom: 1rem;
}

#database-info,
#properties-info {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .data-stats {
    grid-template-columns: 1fr;
  }
}
</style>
