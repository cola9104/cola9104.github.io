import { defineConfig } from 'vitepress'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 读取 notion-sync.json，如果失败则使用空数组
let pagesData = []
try {
  const notionSyncPath = path.resolve(__dirname, 'notion-sync.json')
  if (fs.existsSync(notionSyncPath)) {
    const rawSync = JSON.parse(fs.readFileSync(notionSyncPath, 'utf-8'))
    // 兼容不同的数据结构
    pagesData = Array.isArray(rawSync.pages) ? rawSync.pages :
                Array.isArray(rawSync) ? rawSync :
                (rawSync.pages && Array.isArray(rawSync.pages)) ? rawSync.pages : []
  }
} catch (error) {
  console.warn('⚠️  读取 notion-sync.json 失败，将使用空页面列表:', error.message)
}

// Helper to convert title to link
const getLink = (title) => `/notion-pages/${title.replace(/[^\w\u4e00-\u9fa5]/g, '-').replace(/-+/g, '-').toLowerCase()}`

// Recursive function to map notion-sync tree to VitePress sidebar items
function mapToSidebarItems(nodes) {
  if (!nodes || nodes.length === 0) return []

  return nodes.map(node => ({
    text: node.text,
    link: node.link,
    collapsed: true, // Default to closed to avoid too long sidebar
    items: mapToSidebarItems(node.items)
  }))
}

// Build notionPages for Nav (Top Level Only)
const notionPages = pagesData.map(page => ({
  text: page.text,
  link: page.link,
  items: mapToSidebarItems(page.items) // Store full tree for sidebar construction
}))

// Build Sidebar Config
function buildSidebarConfig(pages) {
  const sidebarConfig = {}

  pages.forEach(page => {
    // Main category link
    const mainLink = page.link
    
    // Build the sidebar structure for this category
    // The category itself is the first item, followed by its children
    const categorySidebar = [
      {
        text: page.text,
        link: page.link,
        items: page.items // Recursive items from mapToSidebarItems
      }
    ]

    // Assign this sidebar to the main category page
    sidebarConfig[mainLink] = categorySidebar

    // Recursively assign this sidebar to all descendant pages
    // so that when you visit a child page, you still see the full category sidebar
    function assignSidebarToDescendants(items) {
      if (!items) return
      items.forEach(item => {
        if (item.link) {
          sidebarConfig[item.link] = categorySidebar
        }
        if (item.items) {
          assignSidebarToDescendants(item.items)
        }
      })
    }
    
    assignSidebarToDescendants(page.items)
  })

  return sidebarConfig
}

export default defineConfig({
  title: 'Cola的网络安全博客',
  description: '专注于网络安全、渗透测试、漏洞分析的技术博客',
  lang: 'zh-CN',
  appearance: 'auto',
  themeConfig: {
    // ✅ 纯动态侧边栏配置
    // 侧边栏完全基于 Notion 页面结构自动生成
    sidebar: {
      '/': [],
      ...buildSidebarConfig(notionPages)
    },

    siteTitle: 'Cola的网络安全博客',
    logo: {
      light: '/favicon.ico',
      dark: '/favicon.ico'
    },
    nav: [
      { text: '首页', link: '/', activeMatch: '^/$' },
      // 动态生成导航菜单
      ...notionPages.map(page => ({
        text: page.text,
        link: page.link,
        activeMatch: `^${page.link}`
      }))
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/cola9104' },
      { icon: 'twitter', link: 'https://twitter.com' },
      { icon: 'linkedin', link: 'https://linkedin.com' },
      { icon: 'discord', link: 'https://discord.com' }
    ],
    search: {
      provider: 'local',
      options: {
        maxResults: 10,
        showHistory: true,
        highlightMatches: true,
        throttleDelay: 300
      }
    },
    footer: {
      message: '🚀 专注于网络安全技术分享',
      copyright: `版权所有 © 2024-${new Date().getFullYear()} Cola | 基于 MIT 许可发布`
    },
    lastUpdated: {
      text: '上次更新',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    },
    scrollProgress: true,
  },
  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    copyCode: {
      buttonText: '复制代码',
      successText: '已复制!'
    }
  },
  vite: {
    define: {
      __VUE_OPTIONS_API__: false
    },
    build: {
      chunkSizeWarningLimit: 1000
    },
    server: {
      port: 5173,
      open: true
    }
  },
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'keywords', content: '网络安全,渗透测试,漏洞分析,信息安全,CTF,Cola' }],
    ['meta', { name: 'author', content: 'Cola' }],
    ['meta', { property: 'og:title', content: 'Cola的网络安全博客' }],
    ['meta', { property: 'og:description', content: '专注于网络安全、渗透测试、漏洞分析的技术博客' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://cola9104.github.io' }],
    ['link', { rel: 'stylesheet', href: '/theme/blog.css' }],
  ]
})
