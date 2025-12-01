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
    // 侧边栏（网络安全页面已合并）
      sidebar: {
        "/渗透测试/": [
          {
            "text": "渗透测试",
            "items": [
              {
                "text": "渗透测试流程",
                "link": "/渗透测试/渗透测试流程/"
              },
              {
                "text": "渗透测试基础",
                "link": "/渗透测试/渗透测试基础/"
              },
              {
                "text": "信息收集",
                "link": "/渗透测试/信息收集/"
              },
              {
                "text": "漏洞扫描",
                "link": "/渗透测试/漏洞扫描/"
              }
            ]
          }
        ],
        "/漏洞分析/": [
          {
            "text": "漏洞分析",
            "items": [
              {
                "text": "漏洞分析1",
                "link": "/漏洞分析/漏洞分析1/"
              },
              {
                "text": "漏洞分析2",
                "link": "/漏洞分析/漏洞分析2/"
              }
            ]
          }
        ],
        "/嵌入式安全/": [
          {
            "text": "嵌入式安全",
            "items": [
              {
                "text": "嵌入式安全分析1",
                "link": "/嵌入式安全/嵌入式安全分析1/"
              },
              {
                "text": "嵌入式安全分析2",
                "link": "/嵌入式安全/嵌入式安全分析2/"
              }
            ]
          }
        ],
        "/编程技术/": [
          {
            "text": "编程技术",
            "items": [
              {
                "text": "编程技术1",
                "link": "/编程技术/编程技术1/"
              },
              {
                "text": "编程技术2",
                "link": "/编程技术/编程技术2/"
              }
            ]
          }
        ],
        "/CTF竞赛/": [
          {
            "text": "CTF竞赛",
            "items": [
              {
                "text": "CTF1",
                "link": "/CTF竞赛/CTF1/"
              }
            ]
          }
        ],
        "/网络安全/": [
          {
            "text": "网络安全",
            "items": [
              {
                "text": "网络安全",
                "items": [
                  {
                    "text": "网络安全概述",
                    "link": "/网络安全/网络安全概述/"
                  },
                  {
                    "text": "常见攻击类型",
                    "link": "/网络安全/常见攻击类型/"
                  },
                  {
                    "text": "防护策略",
                    "link": "/网络安全/防护策略/"
                  },
                  {
                    "text": "零信任架构",
                    "link": "/网络安全/零信任架构/"
                  },
                  {
                    "text": "威胁情报",
                    "link": "/网络安全/威胁情报/"
                  },
                  {
                    "text": "安全运营中心",
                    "link": "/网络安全/安全运营中心/"
                  }
                ]
              }
            ]
          }
        ]
      }
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