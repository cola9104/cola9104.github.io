#!/bin/bash

echo "🔄 开始同步Notion内容..."

# 运行同步脚本
node auto-sync-generator.js

# 检查是否有变更
if git diff --quiet; then
    echo "✅ 没有内容变更"
else
    echo "📝 检测到内容变更，正在提交..."
    
    # 添加变更
    git add .
    
    # 提交变更
    git commit -m "feat: 自动同步Notion内容 - $(date '+%Y-%m-%d %H:%M:%S')"
    
    # 推送到远程仓库
    git push origin main
    
    echo "🚀 内容已同步并推送到远程仓库"
fi

echo "✅ 同步完成！"

