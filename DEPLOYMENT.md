# GitHub Pages 部署指南

本指南将帮助你将网络安全博客部署到GitHub Pages。

## 🚀 快速部署

### 1. 推送代码到GitHub

```bash
# 初始化Git仓库（如果还没有）
git init

# 添加远程仓库
git remote add origin https://github.com/你的用户名/cola9104.github.io.git

# 添加所有文件
git add .

# 提交更改
git commit -m "Initial commit: 网络安全博客"

# 推送到GitHub
git push -u origin main
```

### 2. 启用GitHub Pages

1. 进入你的GitHub仓库页面
2. 点击 **Settings** 标签
3. 在左侧菜单中找到 **Pages**
4. 在 **Source** 部分选择 **GitHub Actions**
5. 保存设置

### 3. 配置环境变量（可选）

如果你使用Notion API，需要在GitHub仓库中配置环境变量：

1. 进入仓库的 **Settings** 页面
2. 点击左侧的 **Secrets and variables** > **Actions**
3. 点击 **New repository secret**
4. 添加以下环境变量：
   - `NOTION_TOKEN`: 你的Notion API Token
   - `NOTION_DATABASE_ID`: 你的Notion数据库ID

## 🔧 本地开发

### 安装依赖

```bash
# 使用npm
npm install

# 或使用pnpm
pnpm install
```

### 启动开发服务器

```bash
# 使用npm
npm run docs:dev

# 或使用pnpm
pnpm docs:dev
```

### 构建生产版本

```bash
# 使用npm
npm run docs:build

# 或使用pnpm
pnpm docs:build
```

## 📁 项目结构

```
cola9104.github.io/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions部署配置
├── docs/
│   ├── .vitepress/
│   │   ├── config.mjs          # VitePress配置
│   │   ├── notion.js           # Notion API集成
│   │   └── components/
│   │       └── NotionBlog.vue  # 博客组件
│   ├── cybersecurity/          # 网络安全专栏
│   ├── penetration-testing/    # 渗透测试专栏
│   ├── vulnerability-analysis/ # 漏洞分析专栏
│   ├── embedded-security/      # 嵌入式安全专栏
│   ├── programming/            # 编程技术专栏
│   ├── ctf/                    # CTF竞赛专栏
│   ├── blog/                   # 博客文章
│   └── index.md               # 首页
├── package.json               # 项目配置
├── .gitignore                # Git忽略文件
└── README.md                 # 项目说明
```

## 🌐 访问你的博客

部署成功后，你的博客将在以下地址可用：

- **GitHub Pages**: `https://你的用户名.github.io/cola9104.github.io`
- **自定义域名**: 如果你配置了自定义域名，可以通过你的域名访问

## 🔄 自动部署

每次你推送代码到 `main` 分支时，GitHub Actions会自动：

1. 检出代码
2. 安装依赖
3. 构建VitePress站点
4. 部署到GitHub Pages

你可以在 **Actions** 标签页查看部署状态。

## 🛠️ 自定义配置

### 修改站点信息

编辑 `docs/.vitepress/config.mjs` 文件：

```javascript
export default defineConfig({
  title: '你的博客标题',
  description: '你的博客描述',
  // ... 其他配置
})
```

### 添加自定义域名

1. 在仓库根目录创建 `CNAME` 文件
2. 在文件中写入你的域名，例如：`blog.yourdomain.com`
3. 在你的域名DNS设置中添加CNAME记录指向 `你的用户名.github.io`

### 配置Notion集成

1. 在Notion中创建集成：https://www.notion.so/my-integrations
2. 创建数据库并添加必要的属性
3. 在GitHub仓库的Secrets中添加环境变量

## 🐛 故障排除

### 部署失败

1. 检查GitHub Actions日志
2. 确保所有依赖都正确安装
3. 检查VitePress配置是否正确

### 页面无法访问

1. 确认GitHub Pages已启用
2. 检查仓库设置中的Pages配置
3. 等待几分钟让DNS传播

### Notion API错误

1. 检查环境变量是否正确设置
2. 确认Notion集成权限
3. 验证数据库ID格式

## 📞 获取帮助

如果遇到问题，可以：

1. 查看GitHub Actions日志
2. 检查VitePress文档：https://vitepress.dev/
3. 提交Issue到仓库

---

🎉 恭喜！你的网络安全博客现在已经部署到GitHub Pages了！
