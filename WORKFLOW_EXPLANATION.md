# 🔄 GitHub Actions 工作流程详解

## 🎉 好消息：网站已经成功部署！

你的网站 https://cola9104.github.io/ **已经正常显示**，不是空白页！

网站内容：
- ✅ 标题：Cola的网络安全博客
- ✅ 导航栏：首页、网络安全、渗透测试、漏洞分析、嵌入式安全、CTF竞赛、Notion 内容、关于
- ✅ 功能：深色/浅色主题切换、本地搜索

---

## 📊 当前工作流架构

### 工作流 1: `deploy.yml` - 主要部署工作流 ✅

**触发时机**：
- 每次推送到 `main` 分支
- 手动触发

**执行流程**：
```
1. Checkout 代码
2. 安装 Node.js (v18)
3. 安装依赖 (npm install)
4. 构建网站 (npm run docs:build)
   └─ 这一步会执行 VitePress 构建
   └─ config.mjs 中的代码会在构建时运行
   └─ update-homepage-features.js 会自动执行
5. 上传构建产物
6. 部署到 GitHub Pages
```

**特点**：
- ✅ 可以在 GitHub 上运行 JavaScript 代码
- ✅ `update-homepage-features.js` 会在每次构建时自动执行
- ✅ 所有 Node.js 脚本都可以正常运行

---

### 工作流 2: `notion-sync.yml` - Notion 数据同步 ⚠️

**触发时机**：
- 每天上午 9 点（定时任务）
- 仅当 `docs/notion-content.md` 文件改变时
- 手动触发

**执行流程**：
```
1. Checkout 代码
2. 安装 Node.js
3. 创建 .env 文件（从 GitHub Secrets）
4. 验证环境变量
5. 运行 Notion 同步脚本
6. 更新侧边栏配置
7. 提交更改
8. 推送到仓库
   └─ 这会触发 deploy.yml 重新部署
```

**当前状态**：⚠️ 需要配置 GitHub Secrets
- `NOTION_TOKEN`
- `NOTION_DATABASE_ID`
- `NOTION_MAIN_PAGE_ID`

---

## 🤔 你提到的问题："不能在GitHub上运行定期执行js更新吗"

### 答案：**可以！而且已经配置好了**

GitHub Actions **完全支持**运行 JavaScript 代码，包括：

### 1️⃣ 构建时自动运行的 JS（已工作 ✅）

**文件**：`update-homepage-features.js`

**何时运行**：每次 `npm run docs:build` 时

**在哪里运行**：
- ✅ 本地构建时运行
- ✅ GitHub Actions 中构建时运行

**代码位置**：`docs/.vitepress/config.mjs`
```javascript
// 在构建时更新首页特性（开发环境下不执行）
if (runUpdate && process.env.NODE_ENV !== 'development') {
  console.log('🚀 正在更新首页特性数据...')
  await runUpdate()
}
```

**日志证明**：
```
🚀 正在更新首页特性数据...
🚀 开始更新首页特性部分...
🔍 正在尝试从主页获取子页面数据...
✅ 找到 6 个子页面作为特性
🎉 成功更新首页特性，添加了 5 个特性
```

### 2️⃣ 定时执行的 Notion 同步（需要配置 Secrets ⚠️）

**文件**：`sync-notion.js`（在工作流中动态创建）

**何时运行**：
- 每天上午 9 点（cron: '0 9 * * *'）
- 手动触发

**当前问题**：缺少环境变量配置

**需要的配置**：
```bash
NOTION_TOKEN=Bearer ntn_Z91829129697EenwSBwmKQB1xdPOEjLK2i46iTzr9gf572
NOTION_DATABASE_ID=26e2235821c9800dbbf6f034c98479f8
NOTION_MAIN_PAGE_ID=2682235821c980f5b1d1cc8fedd541b6
```

---

## 🔧 如何让 Notion 自动同步工作

### 步骤 1: 配置 GitHub Secrets

访问：https://github.com/cola9104/cola9104.github.io/settings/secrets/actions

添加 3 个 secrets：

1. **NOTION_TOKEN**
   ```
   Bearer ntn_Z91829129697EenwSBwmKQB1xdPOEjLK2i46iTzr9gf572
   ```

2. **NOTION_DATABASE_ID**
   ```
   26e2235821c9800dbbf6f034c98479f8
   ```

3. **NOTION_MAIN_PAGE_ID**
   ```
   2682235821c980f5b1d1cc8fedd541b6
   ```

### 步骤 2: 测试自动同步

配置完成后，可以手动触发测试：

1. 访问：https://github.com/cola9104/cola9104.github.io/actions/workflows/notion-sync.yml
2. 点击 "Run workflow"
3. 选择 `main` 分支
4. 点击 "Run workflow"

### 步骤 3: 验证定时任务

配置完成后，工作流会在每天上午 9 点自动运行：
- 同步 Notion 数据
- 更新网站内容
- 自动提交并推送
- 触发 deploy.yml 重新部署

---

## 📝 工作流能做什么 vs 不能做什么

### ✅ 可以做的事情

1. **运行任何 Node.js 代码**
   - 读写文件
   - 调用 API（包括 Notion API）
   - 处理数据
   - 生成内容

2. **定时执行任务**
   - cron 定时任务
   - 每天、每周、每月等

3. **访问外部 API**
   - Notion API ✅
   - GitHub API ✅
   - 其他公开 API ✅

4. **自动提交和推送**
   - 同步的内容可以自动提交到仓库
   - 提交后自动触发重新部署

### ❌ 不能做的事情（或需要注意）

1. **不能在客户端（浏览器）动态加载**
   - VitePress 是静态站点生成器
   - 所有内容在构建时生成
   - 用户访问时不会重新获取 Notion 数据

2. **需要凭证的操作需要配置 Secrets**
   - Notion Token 必须配置为 Secret
   - 不能直接硬编码在代码中

3. **定时任务有延迟**
   - cron 可能延迟几分钟
   - 不保证精确时间

---

## 🎯 当前状态总结

### ✅ 已完成并正常工作

1. **网站部署** - https://cola9104.github.io/ 正常显示
2. **构建时 JS 执行** - `update-homepage-features.js` 每次构建时运行
3. **Notion 数据同步（本地）** - `sync-notion-simple.js` 已创建并测试
4. **VitePress 配置** - 导航栏已包含 Notion 内容
5. **工作流配置** - deploy.yml 和 notion-sync.yml 已配置

### ⚠️ 需要配置才能工作

1. **GitHub Secrets** - 需要添加 Notion 凭证
2. **自动 Notion 同步** - 配置 Secrets 后即可启用

---

## 🚀 完整的自动化流程（配置 Secrets 后）

### 每天的自动流程

```
上午 9:00
  ↓
notion-sync.yml 触发
  ↓
从 Notion 获取最新数据
  ↓
生成/更新 Markdown 文件
  ↓
更新 notion-sync.json
  ↓
git commit & push
  ↓
deploy.yml 自动触发
  ↓
构建网站（运行 update-homepage-features.js）
  ↓
部署到 GitHub Pages
  ↓
网站更新完成！
```

### 手动推送时的流程

```
git push
  ↓
deploy.yml 触发
  ↓
构建网站（运行 update-homepage-features.js）
  ↓
部署到 GitHub Pages
  ↓
网站更新完成！
```

---

## 📚 相关文档

- `CONFIGURE_GITHUB_SECRETS.md` - GitHub Secrets 配置指南
- `GITHUB_PAGES_SETUP.md` - GitHub Pages 设置说明
- `sync-notion-simple.js` - Notion 同步脚本
- `.github/workflows/deploy.yml` - 部署工作流
- `.github/workflows/notion-sync.yml` - Notion 同步工作流

---

## ❓ 常见问题

### Q: 为什么网站不会实时显示 Notion 最新内容？

A: VitePress 是静态站点生成器，内容在构建时生成。要更新内容需要：
1. 运行 Notion 同步脚本（手动或定时）
2. 触发重新构建和部署

### Q: 可以让网站每小时自动同步一次吗？

A: 可以！修改 `notion-sync.yml` 中的 cron 表达式：
```yaml
schedule:
  - cron: '0 * * * *'  # 每小时运行一次
```

### Q: 构建时的 JS 代码可以访问环境变量吗？

A: 可以！在 `deploy.yml` 中添加：
```yaml
- name: Build with VitePress
  env:
    NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
  run: npm run docs:build
```

然后在代码中使用 `process.env.NOTION_TOKEN`

---

## 🎊 总结

**你的担心是多余的！** GitHub Actions 完全支持运行 JavaScript 代码，包括：
- ✅ 定时任务
- ✅ 调用 API
- ✅ 生成内容
- ✅ 自动部署

唯一需要的是配置 GitHub Secrets，然后一切都会自动工作！
