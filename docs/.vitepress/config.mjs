import { defineConfig } from 'vitepress'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// 导入更新首页特性的函数
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 使用defineConfig的回调形式，支持异步操作
export default defineConfig(async () => {
  // 在构建时更新首页特性（开发环境下不执行）
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('🚀 正在更新首页特性数据...')
      const updateModule = await import(path.resolve(__dirname, '../../update-homepage-features.js'))
      const runUpdate = updateModule.default
      if (runUpdate) {
        await runUpdate()
      }
    } catch (error) {
      console.log('⚠️ 无法导入update-homepage-features.js，将跳过首页特性更新')
      console.log('错误信息:', error.message)
    }
  }

  return {
    title: 'Cola的网络安全博客',
    description: '专注于网络安全、渗透测试、漏洞分析的技术博客',
    // 语言设置
    lang: 'zh-CN',
    
    // 启用深色模式支持，根据系统偏好自动切换
    appearance: 'auto',
    
    // 自定义主题颜色
    themeConfig: {
      // 网站信息
      siteTitle: 'Cola的网络安全博客',
      
      // 网站logo
      logo: {
        light: '/favicon.ico',
        dark: '/favicon.ico'
      },
      
      // 导航菜单
      nav: [
        { text: '首页', link: '/', activeMatch: '^/$' },
        { text: '网络安全', link: '/网络安全/', activeMatch: '^/网络安全/' },
        { text: '渗透测试', link: '/渗透测试/', activeMatch: '^/渗透测试/' },
        { text: '漏洞分析', link: '/漏洞分析/', activeMatch: '^/漏洞分析/' },
        { text: '嵌入式安全', link: '/嵌入式安全/', activeMatch: '^/嵌入式安全/' },
        { text: 'CTF竞赛', link: '/CTF竞赛/', activeMatch: '^/CTF竞赛/' },
        {
          text: 'Notion 内容',
          items: [
            { text: '网络安全', link: '/notion-pages/网络安全' },
            { text: '渗透测试', link: '/notion-pages/渗透测试' },
            { text: '嵌入式安全', link: '/notion-pages/嵌入式安全' },
            { text: 'CTF竞赛', link: '/notion-pages/ctf竞赛' },
            { text: '编程技术', link: '/notion-pages/编程技术' },
            { text: '漏洞分析', link: '/notion-pages/漏洞分析' }
          ]
        },
        { text: '关于', link: '/关于/', activeMatch: '^/关于/' }
      ],

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
      },

      // 社交链接
      socialLinks: [
        { icon: 'github', link: 'https://github.com/cola9104' },
        { icon: 'twitter', link: 'https://twitter.com' },
        { icon: 'linkedin', link: 'https://linkedin.com' },
        { icon: 'discord', link: 'https://discord.com' }
      ],

      // 搜索配置
      search: {
        provider: 'local',
        options: {
          // 搜索结果数量
          maxResults: 10,
          // 是否显示搜索历史
          showHistory: true,
          // 是否高亮匹配的文本
          highlightMatches: true,
          // 搜索延迟（毫秒）
          throttleDelay: 300
        }
      },

      // 页脚
      footer: {
        message: '🚀 专注于网络安全技术分享',
        copyright: `版权所有 © 2024-${new Date().getFullYear()} Cola | 基于 MIT 许可发布`
      },
      
      // 上次更新时间
      lastUpdated: {
        text: '上次更新',
        formatOptions: {
          dateStyle: 'full',
          timeStyle: 'medium'
        }
      },
      
      // 编辑链接
      editLink: {
        pattern: 'https://github.com/cola9104/cola9104.github.io/edit/main/docs/:path',
        text: '编辑此页面'
      },
      
      // 页面滚动进度条
      scrollProgress: true,
      
      // 导航栏区域颜色
      navBarTheme: {
        light: '#ffffff',
        dark: '#0f172a'
      },
      
      // 卡片组件样式
      cardTheme: {
        light: {
          background: '#ffffff',
          border: '#e2e8f0',
          hoverBorder: '#3b82f6'
        },
        dark: {
          background: '#1e293b',
          border: '#334155',
          hoverBorder: '#3b82f6'
        }
      }
    },

    // Markdown 配置
    markdown: {
      lineNumbers: true,
      theme: {
        light: 'github-light',
        dark: 'github-dark'
      },
      // 启用代码复制功能
      copyCode: {
        buttonText: '复制代码',
        successText: '已复制!'
      }
    },

    // Vite 配置
    vite: {
      define: {
        __VUE_OPTIONS_API__: false
      },
      // 优化构建性能
      build: {
        chunkSizeWarningLimit: 1000
      },
      // 开发服务器配置
      server: {
        port: 5173,
        open: true
      }
    },
    
    // 优化SEO
    head: [
      ['link', { rel: 'icon', href: '/favicon.ico' }],
      ['meta', { name: 'keywords', content: '网络安全,渗透测试,漏洞分析,信息安全,CTF,Cola' }],
      ['meta', { name: 'author', content: 'Cola' }],
      ['meta', { property: 'og:title', content: 'Cola的网络安全博客' }],
      ['meta', { property: 'og:description', content: '专注于网络安全、渗透测试、漏洞分析的技术博客' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:url', content: 'https://cola9104.github.io' }],
      ['link', { rel: 'stylesheet', href: '/theme/blog.css' }],
      // 添加Google Analytics（如果需要）
      // ['script', { async: true, src: 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX' }],
      // ['script', {}, "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-XXXXXXXXXX');"]
    ]
  }
})