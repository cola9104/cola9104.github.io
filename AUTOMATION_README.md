# Notion 页面自动化合并系统

## 概述

这个系统自动从 Notion 数据库获取内容，并将网络安全相关的页面合并为一个统一的页面，同时保持其他分类的页面结构。

## 工作流程

### 1. Notion 数据同步
- **脚本**: `sync-notion.js` (在 GitHub Actions 中动态创建)
- **功能**: 从 Notion 数据库获取文章列表和基本信息
- **输出**: `docs/.vitepress/notion-sync.json`

### 2. 页面合并
- **脚本**: `merge-notion-pages-optimized.js`
- **功能**:
  - 自动识别网络安全相关页面
  - 获取页面内容并转换为 Markdown
  - 去重和内容清理
  - 生成合并后的页面
- **输出**: `docs/网络安全/index.md`

### 3. 侧边栏配置更新
- **脚本**: `update-sidebar-merged.js`
- **功能**:
  - 从 Notion 获取页面结构
  - 合并网络安全相关页面到单一分类
  - 保持其他分类的独立结构
- **输出**: 更新 `docs/.vitepress/config.mjs`

### 4. 构建和部署
- **功能**: 构建 VitePress 站点并部署到 GitHub Pages
- **触发**: GitHub Actions 自动运行

## 自动化触发条件

1. **手动触发**: 通过 GitHub Actions 界面手动运行
2. **定时触发**: 每天上午 9 点 (UTC)
3. **推送触发**: 当 `docs/notion-content.md` 文件有变更时

## 环境变量配置

在 GitHub 仓库设置中配置以下 secrets：

- `NOTION_TOKEN`: Notion 集成令牌
- `NOTION_DATABASE_ID`: Notion 数据库 ID
- `NOTION_MAIN_PAGE_ID`: Notion 主页面 ID

## 脚本说明

### merge-notion-pages-optimized.js

**主要功能**:
- 递归获取 Notion 页面内容和子页面
- 识别网络安全相关页面（基于关键词匹配）
- 将 Notion 块转换为 Markdown 格式
- 去重和内容清理
- 按预定义顺序组织内容

**识别关键词**:
- 网络安全、安全、攻击、防护、漏洞、渗透、威胁
- 零信任、威胁情报、安全运营、SOC、XSS、SQL注入
- DDoS、恶意软件、防火墙、加密、认证、授权

**输出结构**:
```markdown
# 网络安全

## 📚 内容目录
- [网络安全概述](#网络安全概述)
- [常见攻击类型](#常见攻击类型)
- ...

## 网络安全概述
[内容...]

## 常见攻击类型
[内容...]
```

### update-sidebar-merged.js

**主要功能**:
- 从 Notion 获取页面层次结构
- 将网络安全相关页面合并到单一分类
- 保持其他分类的独立结构
- 更新 VitePress 侧边栏配置

**合并逻辑**:
- 检测包含网络安全关键词的页面
- 将这些页面合并到 `/网络安全/` 路径下
- 保持其他页面（如渗透测试、漏洞分析等）的独立路径

## 本地开发

### 运行页面合并
```bash
node merge-notion-pages-optimized.js
```

### 更新侧边栏配置
```bash
node update-sidebar-merged.js
```

### 测试连接
```bash
node test-notion-connection.js
```

### 构建站点
```bash
npm run docs:build
```

## 注意事项

1. **页面去重**: 脚本会自动避免重复处理同一页面
2. **内容顺序**: 页面按预定义的逻辑顺序排列
3. **错误处理**: 即使部分步骤失败，流程也会继续执行
4. **备份**: 重要的配置文件会自动备份
5. **日志**: 详细的日志输出帮助调试问题

## 故障排除

### 常见问题

1. **NOTION_TOKEN 未设置**
   - 检查 GitHub secrets 配置
   - 确认令牌格式正确（以 "Bearer secret_" 开头）

2. **页面获取失败**
   - 检查 Notion 集成权限
   - 确认页面 ID 正确

3. **构建失败**
   - 检查配置文件语法
   - 查看构建日志中的错误信息

4. **重复内容**
   - 脚本已包含去重逻辑
   - 检查 Notion 中的页面结构是否有循环引用

## 维护

### 定期检查
- 监控 GitHub Actions 运行状态
- 检查生成的内容质量
- 更新关键词匹配规则

### 更新流程
- 修改相应的脚本文件
- 测试本地运行效果
- 提交更改并推送到 GitHub
- GitHub Actions 会自动应用新配置

---

*此自动化系统确保 Notion 内容与网站保持同步，同时提供良好的用户体验和内容组织结构。*