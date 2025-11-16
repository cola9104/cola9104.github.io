# 🔐 GitHub Secrets 快速配置指南

## ✅ 配置信息已准备完毕

你需要在 GitHub 上配置以下 3 个 Secrets：

### 1️⃣ NOTION_TOKEN
```
Bearer ntn_Z91829129697EenwSBwmKQB1xdPOEjLK2i46iTzr9gf572
```

### 2️⃣ NOTION_DATABASE_ID
```
26e2235821c9800dbbf6f034c98479f8
```

### 3️⃣ NOTION_MAIN_PAGE_ID
```
2682235821c980f5b1d1cc8fedd541b6
```

---

## 📝 配置步骤

### 方法 1: 通过 GitHub 网页界面（推荐）

1. **打开仓库设置页面**

   直接访问: https://github.com/cola9104/cola9104.github.io/settings/secrets/actions

2. **添加 Secret - NOTION_TOKEN**
   - 点击 `New repository secret` 按钮
   - Name: `NOTION_TOKEN`
   - Secret: `Bearer ntn_Z91829129697EenwSBwmKQB1xdPOEjLK2i46iTzr9gf572`
   - 点击 `Add secret`

3. **添加 Secret - NOTION_DATABASE_ID**
   - 点击 `New repository secret` 按钮
   - Name: `NOTION_DATABASE_ID`
   - Secret: `26e2235821c9800dbbf6f034c98479f8`
   - 点击 `Add secret`

4. **添加 Secret - NOTION_MAIN_PAGE_ID**
   - 点击 `New repository secret` 按钮
   - Name: `NOTION_DATABASE_ID`
   - Secret: `2682235821c980f5b1d1cc8fedd541b6`
   - 点击 `Add secret`

---

### 方法 2: 使用 GitHub CLI（如果已安装）

```bash
# 安装 gh CLI (如果未安装)
# Ubuntu/Debian: sudo apt install gh
# macOS: brew install gh

# 登录
gh auth login

# 添加 secrets
gh secret set NOTION_TOKEN -b"Bearer ntn_Z91829129697EenwSBwmKQB1xdPOEjLK2i46iTzr9gf572"
gh secret set NOTION_DATABASE_ID -b"26e2235821c9800dbbf6f034c98479f8"
gh secret set NOTION_MAIN_PAGE_ID -b"2682235821c980f5b1d1cc8fedd541b6"
```

---

## ✅ 验证配置

配置完成后，执行以下步骤验证：

### 1. 手动触发工作流

1. 访问: https://github.com/cola9104/cola9104.github.io/actions
2. 选择左侧的 `Notion Content Sync` 工作流
3. 点击右上角的 `Run workflow` 按钮
4. 选择 `main` 分支
5. 点击绿色的 `Run workflow` 按钮

### 2. 或者推送一个测试提交

```bash
# 在本地仓库执行
git add .
git commit -m "test: 验证GitHub Actions配置"
git push
```

### 3. 查看工作流运行状态

访问: https://github.com/cola9104/cola9104.github.io/actions

查看最新的工作流运行记录，应该看到：
- ✅ 绿色对勾 = 成功
- ❌ 红色叉号 = 失败（需要检查日志）

---

## 📊 当前状态

### 本地环境 ✅
- ✅ `.env` 文件已创建并配置
- ✅ `NOTION_TOKEN` 已设置
- ✅ `NOTION_DATABASE_ID` 已设置 (首页数据库)
- ✅ `NOTION_MAIN_PAGE_ID` 已设置
- ✅ 本地构建测试通过

### GitHub Secrets ⚠️
需要你手动配置（按照上述步骤）

---

## 🎯 Notion 数据库信息

你的 Notion 集成可以访问以下数据库：

1. **首页数据库** (推荐使用)
   - 标题: 首页数据库
   - Database ID: `26e2235821c9800dbbf6f034c98479f8`
   - ✅ 已配置为 NOTION_DATABASE_ID

2. **任务管理**
   - 标题: 任务管理
   - Database ID: `2682235821c9809695a2ff33aa16e419`
   - 备用选项（如需切换数据库）

---

## 🔒 安全提示

- ✅ `.env` 文件不会被提交到 Git（已在 .gitignore 中）
- ✅ GitHub Secrets 加密存储，任何人都无法查看
- ⚠️ 不要在代码中硬编码 Token
- ⚠️ 不要在公开的 Issue 或 PR 中分享 Token

---

## 🆘 故障排除

### 如果工作流仍然失败：

1. **检查 Secret 名称**
   - 必须完全匹配（区分大小写）
   - ✅ `NOTION_TOKEN`
   - ❌ `notion_token`

2. **检查 Token 格式**
   - ✅ `Bearer ntn_Z91829129697EenwSBwmKQB1xdPOEjLK2i46iTzr9gf572`
   - ❌ `ntn_Z91829129697EenwSBwmKQB1xdPOEjLK2i46iTzr9gf572` (缺少 "Bearer ")

3. **检查 Notion 权限**
   - 在 Notion 中打开你的数据库
   - 点击右上角 `...` -> `Connections`
   - 确保你的 Integration 已添加

4. **查看工作流日志**
   - 访问: https://github.com/cola9104/cola9104.github.io/actions
   - 点击失败的工作流查看详细错误信息

---

## 📞 需要帮助？

如果遇到问题：

1. 查看工作流日志获取详细错误信息
2. 检查本地环境是否能正常构建：`npm run docs:build`
3. 验证 Notion API 连接：`node test-notion-connection.js`

---

配置完成后，你的博客将能够：
- 🔄 自动同步 Notion 内容
- 📝 自动更新侧边栏
- 🚀 自动构建并部署到 GitHub Pages
