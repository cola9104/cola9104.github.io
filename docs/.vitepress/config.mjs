import { defineConfig } from 'vitepress'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const notionCachePath = path.resolve(__dirname, '../../.notion-cache/navigation.json')
const notionPages = fs.existsSync(notionCachePath) ? JSON.parse(fs.readFileSync(notionCachePath, 'utf-8')) : []

export default defineConfig({
  title: 'Cola的网络安全博客',
  description: '专注于网络安全、渗透测试、漏洞分析的技术博客',
  lang: 'zh-CN',
  appearance: 'auto',
  themeConfig: {
    siteTitle: 'Cola的网络安全博客',
    logo: {
      light: '/favicon.ico',
      dark: '/favicon.ico'
    },
    nav: [
      { text: '首页', link: '/', activeMatch: '^/ },
      ...notionPages.map(page => ({
        text: page.text,
        link: page.link,
        activeMatch: `^${page.link}`
      })),
      { text: '关于', link: '/关于/', activeMatch: '^/关于/' }
    ],
    sidebar: {
      '/': [],
      ...notionPages.reduce((sidebarConfig, page) => {
        if (page.items && page.items.length > 0) {
          sidebarConfig[page.link] = [
            {
              text: page.text,
              collapsible: true,
              items: page.items
            }
          ];
        }
        return sidebarConfig;
      }, {})
    },
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
    editLink: {
      pattern: 'https://github.com/cola9104/cola9104.github.io/edit/main/docs/:path',
      text: '编辑此页面'
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