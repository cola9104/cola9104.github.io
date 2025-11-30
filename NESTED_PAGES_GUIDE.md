# 多级子页面功能使用指南

## 功能概述

本项目已经实现了基于Notion数据的多级子页面功能。系统会自动从Notion获取页面结构，并在VitePress中创建对应的多级侧边栏导航。

## 工作原理

1. **Notion数据同步** (`notion-sync.js`)
   - 递归获取Notion主页面下的所有子页面
   - 自动构建多级页面树结构
   - 保存导航数据到`.notion-cache/navigation.json`

2. **VitePress配置** (`docs/.vitepress/config.mjs`)
   - 读取Notion导航数据
   - 递归构建侧边栏配置
   - 为每个有子页面的页面创建独立的侧边栏

3. **页面文件创建** (`create-nested-pages.js`)
   - 根据Notion数据自动创建目录结构
   - 为每个页面生成`index.md`文件
   - 递归处理所有层级的子页面

## 使用步骤

### 1. 配置环境变量

在项目根目录创建`.env`文件（如果不存在）：

```bash
# Notion API Token（必需）
NOTION_TOKEN=Bearer secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Notion 主页面 ID（必需）
NOTION_MAIN_PAGE_ID=26822358-21c9-80f5-b1d1-cc8fedd541b6

# Notion 数据库 ID（可选，用于文章列表）
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**获取方式：**
- **NOTION_TOKEN**: 访问 https://www.notion.so/my-integrations 创建集成并复制Token，需要以`Bearer `开头
- **NOTION_MAIN_PAGE_ID**: 打开Notion主页面，从URL中提取32位ID（去除连字符后）

### 2. 在Notion中构建页面结构

在Notion中按以下结构组织页面：

```
主页面
├── 网络安全
│   ├── 网络安全概述
│   ├── 常见攻击类型
│   │   ├── SQL注入
│   │   └── XSS攻击
│   └── 防护策略
├── 渗透测试
│   ├── 渗透测试流程
│   ├── 信息收集
│   │   ├── 主动信息收集
│   │   └── 被动信息收集
│   └── 漏洞扫描
└── ...
```

**注意事项：**
- 使用Notion的子页面（child_page）功能来创建层级结构
- 页面标题将被转换为URL友好的slug（中文和英文都支持）
- 支持无限层级嵌套

### 3. 运行同步脚本

#### 方式一：同步导航数据

```bash
# 同步Notion导航数据到本地缓存
node notion-sync.js
```

这将：
- 获取Notion页面结构
- 生成`.notion-cache/navigation.json`
- 更新首页特性列表

#### 方式二：创建页面文件

```bash
# 根据Notion数据创建多级目录和markdown文件
node create-nested-pages.js
```

这将：
- 创建与Notion结构对应的目录
- 为每个页面生成`index.md`文件
- 提取Notion页面内容到markdown

#### 方式三：完整同步

```bash
# 运行完整的同步流程
node notion-sync.js && node create-nested-pages.js
```

### 4. 启动开发服务器

```bash
# 安装依赖（首次运行）
npm install

# 启动VitePress开发服务器
npm run docs:dev
```

访问 http://localhost:5173 查看效果。

## 生成的文件结构

运行同步后，将生成以下结构：

```
cola9104.github.io/
├── .notion-cache/
│   └── navigation.json          # Notion导航数据缓存
├── docs/
│   ├── 网络安全/
│   │   ├── index.md            # 网络安全主页
│   │   ├── 网络安全概述/
│   │   │   └── index.md
│   │   ├── 常见攻击类型/
│   │   │   ├── index.md
│   │   │   ├── SQL注入/
│   │   │   │   └── index.md
│   │   │   └── XSS攻击/
│   │   │       └── index.md
│   │   └── 防护策略/
│   │       └── index.md
│   └── ...
└── ...
```

## VitePress侧边栏配置说明

配置文件会自动生成类似以下的侧边栏结构：

```javascript
sidebar: {
  '/网络安全/': [
    {
      text: '网络安全',
      collapsible: true,
      collapsed: false,
      items: [
        {
          text: '网络安全概述',
          link: '/网络安全/网络安全概述/',
          collapsible: true
        },
        {
          text: '常见攻击类型',
          link: '/网络安全/常见攻击类型/',
          collapsible: true,
          items: [
            {
              text: 'SQL注入',
              link: '/网络安全/常见攻击类型/SQL注入/',
              collapsible: true
            },
            // ...更多子项
          ]
        }
      ]
    }
  ],
  // ...其他路径的侧边栏
}
```

## 自定义配置

### 修改标题映射

如果需要自定义某些分类的URL，可以修改`notion-sync.js`中的`getCorrectLink`函数：

```javascript
function getCorrectLink(title) {
  const linkMap = {
    '网络安全': '/网络安全/',
    '渗透测试': '/渗透测试/',
    'CTF': '/CTF竞赛/',  // 自定义映射
    // 添加更多映射...
  };
  return linkMap[title] || `/${title.replace(/\s+/g, '-')}/`;
}
```

### 修改URL生成规则

修改`generateSlug`函数来改变URL生成方式：

```javascript
function generateSlug(title) {
  return title
    .replace(/[^\w\s\u4e00-\u9fff-]/g, '')  // 保留中英文和数字
    .replace(/\s+/g, '-')                    // 空格转换为连字符
    .trim()
    || 'untitled';
}
```

### 自定义缓存时间

修改`notion-sync.js`中的缓存配置：

```javascript
const CACHE_DURATION = 1000 * 60 * 60; // 1小时，可以调整
```

## 自动化部署

项目已配置GitHub Actions自动同步，在`.github/workflows/`目录中：

- 每天自动运行同步脚本
- 推送到main分支时自动部署
- 自动更新侧边栏配置

## 故障排除

### 问题1: API token is invalid

**解决方案：**
- 确认`.env`文件中的`NOTION_TOKEN`以`Bearer `开头
- 检查Token是否有效（访问 https://www.notion.so/my-integrations）
- 确认已将集成添加到Notion页面（点击页面右上角的"..."菜单 > "Add connections"）

### 问题2: 侧边栏不显示

**解决方案：**
- 检查`.notion-cache/navigation.json`是否生成
- 运行`node notion-sync.js`重新生成缓存
- 重启VitePress开发服务器

### 问题3: 中文URL显示异常

**解决方案：**
- VitePress默认支持中文URL
- 确认文件夹名称与URL路径一致
- 检查`generateSlug`函数是否正确处理中文

### 问题4: 子页面无法访问

**解决方案：**
- 确认对应的目录和`index.md`文件已创建
- 运行`node create-nested-pages.js`创建文件
- 检查侧边栏配置中的link路径是否正确

## 核心代码文件说明

1. **notion-sync.js** - Notion数据同步脚本
   - `getPageBlocks()`: 获取页面块
   - `getSubPages()`: 递归获取子页面
   - `getNavigation()`: 构建导航数据
   - `updateHomepage()`: 更新首页特性

2. **create-nested-pages.js** - 页面文件创建脚本
   - `createNestedPages()`: 递归创建页面文件
   - `extractBlockContent()`: 提取Notion块内容
   - `generateSlug()`: 生成URL slug

3. **docs/.vitepress/config.mjs** - VitePress配置
   - `buildSidebarItems()`: 递归构建侧边栏项
   - `buildSidebarConfig()`: 构建完整侧边栏配置
   - 侧边栏自动加载缓存数据

## 最佳实践

1. **定期同步**
   - 建议每天自动运行同步脚本
   - 使用GitHub Actions或其他CI/CD工具

2. **内容组织**
   - 在Notion中保持清晰的层级结构
   - 避免过深的嵌套（建议不超过4层）
   - 使用有意义的页面标题

3. **版本控制**
   - `.notion-cache/`目录加入`.gitignore`
   - 提交生成的markdown文件到Git

4. **性能优化**
   - 使用缓存减少API调用
   - 避免频繁同步大量页面

## 相关资源

- [VitePress 官方文档](https://vitepress.dev/)
- [Notion API 文档](https://developers.notion.com/)
- [项目GitHub仓库](https://github.com/cola9104/cola9104.github.io)

## 更新日志

- **2025-11-30**: 实现多级子页面递归功能
- 支持无限层级嵌套
- 自动生成侧边栏配置
- 创建页面文件生成脚本
