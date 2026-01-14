# Cola的网络安全博客

一个基于VitePress构建的网络安全博客，支持从Notion自动同步内容。

## ✨ 特性

- 🔒 **网络安全专题**：涵盖网络安全、渗透测试、漏洞分析、CTF竞赛
- 📝 **Notion集成**：从Notion自动获取和同步文章内容
- 🌲 **多级子页面**：支持无限层级的页面嵌套，自动生成侧边栏
- 🤖 **完全自动化**：GitHub Actions 每日自动同步并部署
- 🎨 **现代设计**：响应式设计，支持深色模式
- 🔍 **全文搜索**：内置搜索功能，支持中文
- 📱 **移动友好**：完美适配各种设备
- ⚡ **快速加载**：基于VitePress的极速构建

## 🎉 最近更新 (2026-01-14)

- ✅ 修复 GitHub Actions 推送冲突问题
- ✅ 实现真正的 Notion 内容自动同步
- ✅ 优化配置文件，统一使用动态侧边栏
- ✅ 完善错误处理和环境变量验证
- 📖 详细优化说明请查看 [OPTIMIZATION_GUIDE.md](./OPTIMIZATION_GUIDE.md)

## 🚀 快速开始

### 环境要求

- Node.js >= 20
- npm >= 10

### 安装依赖

```bash
npm install
```

### 配置Notion API

1. **获取 Notion API Token**:
   - 访问 [Notion Integrations](https://www.notion.so/my-integrations)
   - 创建新的集成
   - 复制生成的 "Internal Integration Token"

2. **获取 Notion Page ID**:
   - 打开你的 Notion 主页面
   - 从 URL 中复制页面 ID（32位字符）
   - URL 格式: `https://www.notion.so/username/Page-Title-[32位ID]`

3. **配置环境变量**:
```bash
# 复制示例配置文件
cp .env.example .env

# 编辑 .env 文件
NOTION_TOKEN=Bearer xxxxxxxxxxxxxxxxxx
NOTION_MAIN_PAGE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (可选)
```

**注意**: NOTION_TOKEN 必须包含 "Bearer " 前缀（有空格）

### 同步Notion内容

```bash
# 同步 Notion 内容到本地
npm run sync:notion

# 或直接运行
node notion-sync.js
```

### 启动开发服务器

```bash
npm run docs:dev
```

访问 http://localhost:5173 查看博客。

### 构建生产版本

```bash
npm run docs:build
npm run docs:preview
```

## 🌲 多级子页面功能

本项目支持基于Notion的多级子页面自动生成，可以创建无限层级的页面结构。

### 快速使用

```bash
# 完整同步（推荐）
node sync-all.js

# 或分步执行
node notion-sync.js           # 同步导航数据
node create-nested-pages.js   # 创建页面文件
```

### 功能特点

- ✅ 自动从Notion获取页面层级结构
- ✅ 递归生成多级侧边栏导航
- ✅ 自动创建对应的markdown文件和目录
- ✅ 支持中文和英文URL
- ✅ 可折叠的侧边栏项

📖 **详细指南**: 查看 [NESTED_PAGES_GUIDE.md](./NESTED_PAGES_GUIDE.md) 了解完整配置和使用方法

## 📁 项目结构

```
cola9104.github.io/
├── .notion-cache/
│   └── navigation.json    # Notion导航数据缓存
├── docs/
│   ├── .vitepress/
│   │   ├── config.mjs     # VitePress配置（含多级侧边栏）
│   │   ├── notion.js      # Notion API集成
│   │   └── components/
│   ├── 网络安全/           # 自动生成的多级目录
│   │   ├── index.md
│   │   ├── 网络安全概述/
│   │   ├── 常见攻击类型/
│   │   │   ├── index.md
│   │   │   └── SQL注入/
│   │   └── 防护策略/
│   ├── 渗透测试/
│   ├── 漏洞分析/
│   └── index.md
├── notion-sync.js         # Notion同步脚本
├── create-nested-pages.js # 页面创建脚本
└── sync-all.js           # 完整同步脚本
```

## 📝 Notion数据库结构

为了正确显示文章，Notion数据库需要包含以下属性：

### 必需属性

- **Title** (标题) - 文本类型
- **Slug** (URL别名) - 富文本类型
- **Status** (状态) - 选择类型，包含"Published"选项
- **Category** (分类) - 选择类型，包含"Cybersecurity"选项

### 可选属性

- **Excerpt** (摘要) - 富文本类型
- **Tags** (标签) - 多选类型
- **Created** (创建时间) - 日期类型
- **Cover** (封面) - 文件类型

### 示例数据库结构

| 属性名 | 类型 | 说明 |
|--------|------|------|
| Title | 标题 | 文章标题 |
| Slug | 富文本 | URL别名，如"cybersecurity-overview" |
| Status | 选择 | Published/Draft |
| Category | 选择 | Cybersecurity/Penetration Testing/CTF |
| Excerpt | 富文本 | 文章摘要 |
| Tags | 多选 | 标签，如"网络安全"、"渗透测试" |
| Created | 日期 | 创建时间 |
| Cover | 文件 | 封面图片 |

## 🎨 自定义主题

博客使用VitePress默认主题，支持以下自定义：

### 颜色主题

在 `.vitepress/config.js` 中配置：

```javascript
export default defineConfig({
  themeConfig: {
    // 自定义颜色
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b'
    }
  }
})
```

### 组件

- `NotionBlog.vue` - 博客文章列表组件
- 可以添加更多自定义组件

## 📚 内容管理

### 添加新文章

1. 在Notion数据库中创建新页面
2. 填写所有必需属性
3. 设置状态为"Published"
4. 文章会自动同步到博客

### 文章格式

- 使用Markdown格式编写内容
- 支持代码高亮、表格、图表等
- 可以嵌入图片、视频等媒体

## 🔧 开发指南

### 添加新专栏

1. 在 `docs/` 目录下创建新文件夹
2. 添加 `index.md` 文件
3. 在 `.vitepress/config.js` 中配置导航和侧边栏

### 自定义组件

1. 在 `.vitepress/components/` 目录下创建Vue组件
2. 在Markdown文件中使用组件

### API集成

- `notion.js` - Notion API集成
- 支持获取文章列表、单个文章、分类文章等

## 🚀 部署

### GitHub Pages

1. 推送代码到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择"GitHub Actions"作为源
4. 创建 `.github/workflows/deploy.yml` 文件

### 其他平台

- Vercel
- Netlify
- 自建服务器

## 🤝 贡献

欢迎提交Issue和Pull Request！

### 贡献指南

1. Fork项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 📄 许可证

MIT License

## 📞 联系方式

- GitHub: [@cola9104](https://github.com/cola9104)
- 邮箱: your-email@example.com

---

⭐ 如果这个项目对你有帮助，请给个Star！
