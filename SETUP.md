# 项目配置指南

## 快速开始

### 1. 克隆仓库
```bash
git clone https://github.com/cola9104/cola9104.github.io.git
cd cola9104.github.io
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量

复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

```bash
# Notion API Token
# 获取方式：https://www.notion.so/my-integrations
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Notion 数据库 ID
# 从数据库 URL 中提取（去除连字符）
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 可选配置
NOTION_MAIN_PAGE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_PARENT_PAGE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=3000
```

### 4. 本地开发

启动 API 服务器（终端1）：
```bash
npm run api:dev
```

启动 VitePress 开发服务器（终端2）：
```bash
npm run docs:dev
```

访问：http://localhost:5173

### 5. 构建生产版本
```bash
npm run docs:build
```

构建产物在 `docs/.vitepress/dist/` 目录

---

## GitHub Pages 部署配置

### 配置 GitHub Secrets

1. 进入仓库设置：`Settings` → `Secrets and variables` → `Actions`

2. 点击 `New repository secret`，添加以下 secrets：

| Secret 名称 | 说明 | 必需 |
|------------|------|------|
| `NOTION_TOKEN` | Notion API Token | ✅ 是 |
| `NOTION_DATABASE_ID` | Notion 数据库 ID | ✅ 是 |
| `NOTION_MAIN_PAGE_ID` | 主页面 ID | ⚠️ 可选 |

### 获取 Notion API Token

1. 访问 [Notion Integrations](https://www.notion.so/my-integrations)
2. 点击 `+ New integration`
3. 填写集成信息：
   - Name: 例如 "Blog Integration"
   - Associated workspace: 选择你的工作区
   - Capabilities: 勾选 `Read content`
4. 点击 `Submit` 创建
5. 复制 `Internal Integration Token`（格式：`secret_xxx...`）

### 获取 Notion 数据库 ID

1. 在 Notion 中打开你的数据库
2. 点击右上角 `Share`
3. 点击 `Copy link`
4. URL 格式示例：
   ```
   https://www.notion.so/workspace/1234567890abcdef1234567890abcdef?v=...
   ```
5. 提取 32 位 ID（去除连字符）：`1234567890abcdef1234567890abcdef`

### 连接数据库到集成

⚠️ **重要步骤**：必须将数据库共享给集成

1. 在 Notion 数据库页面，点击右上角 `⋯` (三个点)
2. 选择 `Add connections`
3. 搜索并选择你创建的集成（例如 "Blog Integration"）
4. 点击 `Confirm`

### 启用 GitHub Pages

1. 进入仓库设置：`Settings` → `Pages`
2. Source: 选择 `GitHub Actions`
3. 保存配置

### 触发部署

部署会在以下情况自动触发：
- 推送代码到 `main` 分支
- 每天上午 9 点自动同步（定时任务）
- 手动触发：`Actions` → `Notion Content Sync` → `Run workflow`

---

## Notion 数据库结构要求

为了确保博客正常工作，你的 Notion 数据库需要包含以下属性：

### 必需属性

| 属性名 | 类型 | 说明 |
|--------|------|------|
| Title | 标题 | 文章标题 |
| Status | 选择 | 发布状态，包含 "Published" 选项 |

### 推荐属性

| 属性名 | 类型 | 说明 |
|--------|------|------|
| Slug | 富文本 | URL 别名（如 "my-article"） |
| Excerpt | 富文本 | 文章摘要 |
| Tags | 多选 | 文章标签 |
| Category | 选择 | 分类（如 "Cybersecurity", "Penetration Testing"） |
| Created | 日期 | 创建时间 |
| Cover | 文件 | 封面图片 |

### 示例配置

在 Notion 数据库中创建页面时：
```
Title: 网络安全基础知识
Status: Published
Slug: cybersecurity-basics
Category: Cybersecurity
Tags: 网络安全, 基础
Excerpt: 本文介绍网络安全的基本概念...
Created: 2025-01-15
```

---

## 开发脚本说明

| 脚本 | 说明 |
|------|------|
| `npm run docs:dev` | 启动开发服务器 |
| `npm run docs:build` | 构建生产版本 |
| `npm run docs:preview` | 预览构建结果 |
| `npm run api:dev` | 启动本地 API 服务器 |
| `npm run lint` | 运行 ESLint 检查 |
| `npm run lint:fix` | 自动修复 ESLint 问题 |
| `npm run format` | 格式化代码（Prettier） |

---

## 常见问题

### 1. 本地开发时无法获取 Notion 数据

**原因**：API 服务器未启动或环境变量未配置

**解决**：
1. 确保 `.env` 文件存在并配置正确
2. 启动 API 服务器：`npm run api:dev`
3. 检查 API 服务器是否运行在 http://localhost:3000

### 2. GitHub Actions 部署失败

**原因**：未配置 GitHub Secrets

**解决**：
1. 检查 Secrets 是否已添加
2. 查看 Actions 日志中的具体错误
3. 确认 Notion 数据库已连接到集成

### 3. 页面显示空白或没有文章

**原因**：
- Notion 数据库中没有 Status 为 "Published" 的文章
- 数据库结构不符合要求

**解决**：
1. 在 Notion 中创建测试文章
2. 确保 Status 设置为 "Published"
3. 检查数据库属性是否包含必需字段

### 4. API 返回 401 Unauthorized

**原因**：
- Token 无效或过期
- 数据库未共享给集成

**解决**：
1. 重新生成 Notion Token
2. 确保数据库已添加连接到你的集成

### 5. 依赖安装失败

**原因**：网络问题或 Node.js 版本不兼容

**解决**：
```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

---

## 项目结构

```
cola9104.github.io/
├── .github/
│   └── workflows/          # GitHub Actions 工作流
│       ├── deploy.yml      # 主部署流程
│       └── notion-sync.yml # Notion 同步流程
├── docs/
│   ├── .vitepress/
│   │   ├── config.mjs      # VitePress 配置
│   │   ├── notion.js       # Notion API 封装
│   │   ├── client.js       # 客户端增强
│   │   ├── components/     # Vue 组件
│   │   └── theme/          # 主题定制
│   ├── 网络安全/           # 内容目录
│   ├── 渗透测试/
│   ├── 漏洞分析/
│   └── index.md            # 首页
├── api-server.js           # 本地 API 服务器
├── .env.example            # 环境变量模板
├── package.json            # 项目配置
└── README.md               # 项目说明

```

---

## 技术栈

- **静态站点生成器**: [VitePress](https://vitepress.dev/)
- **CMS**: [Notion](https://www.notion.so/)
- **部署平台**: GitHub Pages
- **自动化**: GitHub Actions
- **开发工具**: ESLint, Prettier

---

## 支持

如有问题，请提交 [GitHub Issue](https://github.com/cola9104/cola9104.github.io/issues)

---

## 许可证

MIT License
