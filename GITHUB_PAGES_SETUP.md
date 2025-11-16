# GitHub Pages 空白页问题修复指南

## 问题描述

网站 https://cola9104.github.io/ 显示空白页

## 问题原因

GitHub Pages 当前配置为从 `gh-pages` 分支部署，该分支包含旧内容（标题：cola_Blog）。
而新的部署工作流使用 GitHub Actions 直接部署，但 GitHub Pages 设置尚未更新。

## 解决方案

### 步骤 1: 更改 GitHub Pages 源设置

1. 访问 GitHub Pages 设置页面：
   ```
   https://github.com/cola9104/cola9104.github.io/settings/pages
   ```

2. 在 "Build and deployment" 部分找到 "Source" 设置

3. 当前可能显示为：
   ```
   Source: Deploy from a branch
   Branch: gh-pages / (root)
   ```

4. **更改为**：
   ```
   Source: GitHub Actions
   ```

5. 点击保存（如果有保存按钮）

### 步骤 2: 触发新的部署

更改设置后，有几种方式触发新部署：

**方式 1: 手动触发工作流**
1. 访问：https://github.com/cola9104/cola9104.github.io/actions/workflows/deploy.yml
2. 点击右侧的 "Run workflow" 按钮
3. 选择 `main` 分支
4. 点击绿色的 "Run workflow" 按钮

**方式 2: 推送一个小更改**
```bash
git commit --allow-empty -m "trigger: 重新部署"
git push
```

### 步骤 3: 等待部署完成

1. 访问 Actions 页面查看进度：
   https://github.com/cola9104/cola9104.github.io/actions

2. 等待工作流完成（通常需要 1-3 分钟）

3. 刷新网站：https://cola9104.github.io/

## 验证部署内容

正确部署后，你应该看到：
- 标题：**Cola的网络安全博客**
- 导航栏包含：首页、网络安全、渗透测试、漏洞分析、嵌入式安全、CTF竞赛、Notion 内容、关于

如果仍然看到旧内容：
- 标题：cola_Blog
- 说明 GitHub Pages 设置尚未更新为 GitHub Actions

## 当前工作流状态

我们有以下工作流：

1. **deploy.yml** (主要部署工作流)
   - 触发条件：推送到 main 分支
   - 功能：构建并部署到 GitHub Pages
   - 使用：GitHub Actions (actions/deploy-pages@v4)

2. **notion-sync.yml** (Notion 同步)
   - 触发条件：定时任务或手动触发
   - 功能：同步 Notion 数据
   - 不直接部署，提交后由 deploy.yml 处理

3. **build-deploy.yml** (备用)
   - 触发条件：仅手动触发
   - 功能：备用部署方式

## 检查部署分支的内容

### gh-pages 分支（旧内容）
```bash
git show origin/gh-pages:index.html | head -5
```
显示：`<title>cola_Blog</title>` - 这是旧内容

### main 分支（新内容）
```bash
cat docs/.vitepress/dist/index.html | head -5
```
显示：`<title>Cola的网络安全博客</title>` - 这是新内容

## 常见问题

### Q: 为什么显示空白页？

A: 可能的原因：
1. GitHub Pages 设置仍然指向 gh-pages 分支
2. 浏览器缓存了旧内容
3. DNS 传播延迟（刚更改设置时）

### Q: 如何清除浏览器缓存？

A:
- Chrome: Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)
- Firefox: Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac)
- 或者使用无痕/隐私模式访问

### Q: 更改后多久生效？

A:
- GitHub Actions 部署：1-3 分钟
- GitHub Pages 设置更改：立即生效（但可能需要清除缓存）

## 下一步

1. ✅ 更改 GitHub Pages 设置为 "GitHub Actions"
2. ✅ 触发新的部署
3. ✅ 等待部署完成
4. ✅ 访问 https://cola9104.github.io/ 验证

如果按照以上步骤操作后仍然有问题，请检查：
- GitHub Actions 工作流是否成功完成
- 是否有任何错误日志
- GitHub Pages 设置页面是否显示最新的部署时间
