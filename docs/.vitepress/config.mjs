import { defineConfig } from 'vitepress'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// 导入更新首页特性的函数
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 使用defineConfig的回调形式，支持异步操作
export default defineConfig(async () => {
  let runUpdate

  try {
    const updateModule = await import(path.resolve(__dirname, '../../update-homepage-features.js'))
    runUpdate = updateModule.default

    // 在构建时更新首页特性（开发环境下不执行）
    if (runUpdate && process.env.NODE_ENV !== 'development') {
      console.log('🚀 正在更新首页特性数据...')
      await runUpdate()
    }
  } catch (error) {
    console.log('⚠️ 无法导入update-homepage-features.js，将跳过首页特性更新')
    console.log('错误信息:', error.message)
  }

  return {
    title: 'Cola的网络安全博客',
    description: '专注于网络安全、渗透测试、漏洞分析的技术博客',

    head: [
      ['link', { rel: 'icon', href: '/favicon.ico' }],
      ['meta', { name: 'keywords', content: '网络安全,渗透测试,漏洞分析,信息安全,CTF' }],
      ['link', { rel: 'stylesheet', href: '/theme/blog.css' }]
    ],

    // 主题配置
    themeConfig: {
      // 网站信息
      siteTitle: 'Cola的网络安全博客',

      // 导航菜单
      nav: [
        { text: '首页', link: '/' },
        { text: '网络安全', link: '/网络安全/' },
        { text: '渗透测试', link: '/渗透测试/' },
        { text: '漏洞分析', link: '/漏洞分析/' },
        { text: '嵌入式安全', link: '/嵌入式安全/' },
        { text: 'CTF竞赛', link: '/CTF竞赛/' },
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
        { text: '关于', link: '/关于/' }
      ],

      // 侧边栏配置（简化版）
      sidebar: {
        '/网络安全/': [
          {
            text: '网络安全',
            items: [
              {
                text: '网络安全概述',
                link: '/网络安全/'
              }
            ]
          }
        ],
        '/渗透测试/': [
          {
            text: '渗透测试',
            items: [
              {
                text: '渗透测试流程',
                link: '/渗透测试/渗透测试流程/'
              },
              {
                text: '渗透测试基础',
                link: '/渗透测试/渗透测试基础/'
              },
              {
                text: '信息收集',
                link: '/渗透测试/信息收集/'
              },
              {
                text: '漏洞扫描',
                link: '/渗透测试/漏洞扫描/'
              }
            ]
          }
        ]
      },

      // 社交链接
      socialLinks: [
        { icon: 'github', link: 'https://github.com/cola9104' }
      ],

      // 搜索
      search: {
        provider: 'local'
      },

      // 页脚
      footer: {
        message: '基于 MIT 许可发布',
        copyright: `版权所有 © 2024-${new Date().getFullYear()} Cola`
      }
    },

    // Markdown 配置
    markdown: {
      lineNumbers: true,
      theme: {
        light: 'github-light',
        dark: 'github-dark'
      }
    },

    // Vite 配置
    vite: {
      define: {
        __VUE_OPTIONS_API__: false
      }
    }
  }
})