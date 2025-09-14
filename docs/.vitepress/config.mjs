import { defineConfig } from 'vitepress'

export default defineConfig({
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

    // 侧边栏
    sidebar: {
      '/网络安全/': [
        {
          text: '网络安全基础',
          items: [
            { text: '网络安全概述', link: '/网络安全/概述' },
            { text: '常见攻击类型', link: '/网络安全/攻击类型' },
            { text: '防护策略', link: '/网络安全/防护策略' }
          ]
        },
        {
          text: '高级主题',
          items: [
            { text: '零信任架构', link: '/网络安全/零信任架构' },
            { text: '威胁情报', link: '/网络安全/威胁情报' },
            { text: '安全运营中心', link: '/网络安全/安全运营中心' }
          ]
        }
      ],
      '/渗透测试/': [
        {
          text: '渗透测试基础',
          items: [
            { text: '渗透测试流程', link: '/渗透测试/测试流程' },
            { text: '信息收集', link: '/渗透测试/信息收集' },
            { text: '漏洞扫描', link: '/渗透测试/漏洞扫描' }
          ]
        },
        {
          text: '实战案例',
          items: [
            { text: 'Web应用渗透', link: '/渗透测试/Web应用渗透' },
            { text: '内网渗透', link: '/渗透测试/内网渗透' },
            { text: '移动应用安全', link: '/渗透测试/移动应用安全' }
          ]
        }
      ],
      '/漏洞分析/': [
        {
          text: '漏洞分析',
          items: [
            { text: '漏洞分类', link: '/漏洞分析/漏洞分类' },
            { text: 'CVE分析', link: '/漏洞分析/CVE分析' },
            { text: '漏洞利用', link: '/漏洞分析/漏洞利用' }
          ]
        }
      ],
      '/嵌入式安全/': [
        {
          text: '嵌入式安全基础',
          items: [
            { text: '嵌入式安全概述', link: '/嵌入式安全/概述' },
            { text: '硬件安全', link: '/嵌入式安全/硬件安全' },
            { text: '固件安全', link: '/嵌入式安全/固件安全' },
            { text: 'IoT安全', link: '/嵌入式安全/IoT安全' }
          ]
        },
        {
          text: '攻击与防护',
          items: [
            { text: '侧信道攻击', link: '/嵌入式安全/侧信道攻击' },
            { text: '固件逆向', link: '/嵌入式安全/固件逆向' },
            { text: '硬件调试', link: '/嵌入式安全/硬件调试' },
            { text: '安全启动', link: '/嵌入式安全/安全启动' }
          ]
        }
      ],
      '/编程技术/': [
        {
          text: 'Python编程',
          items: [
            { text: 'Python入门', link: '/编程技术/Python入门' },
            { text: '数据结构与算法', link: '/编程技术/数据结构与算法' },
            { text: '面向对象编程', link: '/编程技术/面向对象编程' },
            { text: '异常处理', link: '/编程技术/异常处理' }
          ]
        },
        {
          text: 'Web开发',
          items: [
            { text: 'Django框架', link: '/编程技术/Django框架' },
            { text: 'Flask框架', link: '/编程技术/Flask框架' },
            { text: 'FastAPI框架', link: '/编程技术/FastAPI框架' },
            { text: 'API设计', link: '/编程技术/API设计' }
          ]
        },
        {
          text: '安全编程',
          items: [
            { text: '安全编程实践', link: '/编程技术/安全编程实践' },
            { text: '密码学应用', link: '/编程技术/密码学应用' },
            { text: '安全工具开发', link: '/编程技术/安全工具开发' },
            { text: '自动化脚本', link: '/编程技术/自动化脚本' }
          ]
        },
        {
          text: '其他语言',
          items: [
            { text: 'Go语言', link: '/编程技术/Go语言' },
            { text: 'Rust语言', link: '/编程技术/Rust语言' },
            { text: 'JavaScript/TypeScript', link: '/编程技术/JavaScript' },
            { text: 'Shell脚本', link: '/编程技术/Shell脚本' }
          ]
        }
      ],
      '/CTF竞赛/': [
        {
          text: 'CTF竞赛',
          items: [
            { text: 'CTF入门', link: '/CTF竞赛/入门指南' },
            { text: 'Web题目', link: '/CTF竞赛/Web题目' },
            { text: 'Pwn题目', link: '/CTF竞赛/Pwn题目' },
            { text: 'Crypto题目', link: '/CTF竞赛/Crypto题目' }
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
  },

})