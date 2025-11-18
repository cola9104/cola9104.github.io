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
  
  // 导入并执行侧边栏配置更新
  try {
    const sidebarUpdateModule = await import(path.resolve(__dirname, '../../update-sidebar-config.js'))
    const sidebarRunUpdate = sidebarUpdateModule.default
    
    // 在构建时更新侧边栏配置（开发环境下不执行）
    if (sidebarRunUpdate && process.env.NODE_ENV !== 'development') {
      console.log('🚀 正在更新侧边栏配置...')
      await sidebarRunUpdate()
    }
  } catch (error) {
    console.log('⚠️ 无法导入update-sidebar-config.js，将跳过侧边栏配置更新')
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

    themeConfig: {
      // 网站logo
      logo: '/logo.svg',

      // 导航栏
      nav: [
        { text: '首页', link: '/' },
        { text: '网络安全', link: '/网络安全/' },
        { text: '渗透测试', link: '/渗透测试/' },
        { text: '漏洞分析', link: '/漏洞分析/' },
        { text: '嵌入式安全', link: '/嵌入式安全/' },
        { text: '编程技术', link: '/编程技术/' },
        { text: 'CTF竞赛', link: '/CTF竞赛/' },
        { text: '博客', link: '/博客/' },
        { text: '关于', link: '/关于' }
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
              {
                text: '常见攻击类型',
                link: '/网络安全/常见攻击类型/'
              },
              {
                text: '防护策略',
                link: '/网络安全/防护策略/'
              },
              {
                text: '零信任架构',
                link: '/网络安全/零信任架构/'
              },
              {
                text: '威胁情报',
                link: '/网络安全/威胁情报/'
              },
              {
                text: '安全运营中心',
                link: '/网络安全/安全运营中心/'
              }
            ]
          }
        ]
      },

      // 社交链接
      socialLinks: [
        { icon: 'github', link: 'https://github.com/cola9104' }
      ],

      // 页脚
      footer: {
        message: '基于 VitePress 构建',
        copyright: 'Copyright © 2024 Cola的网络安全博客'
      },

      // 搜索
      search: {
        provider: 'local'
      },

      // 编辑链接
      editLink: {
        pattern: 'https://github.com/cola9104/cola9104.github.io/edit/main/docs/:path',
        text: '在 GitHub 上编辑此页'
      },

      // 最后更新时间
      lastUpdated: {
        text: '最后更新于',
        formatOptions: {
          dateStyle: 'short',
          timeStyle: 'medium'
        }
      }
    },

    // 构建配置
    build: {
      outDir: '../dist'
    },

    // 忽略死链接检查
    ignoreDeadLinks: true,

    // 开发服务器配置
    server: {
      port: 3000,
      host: true
    }
  }
})