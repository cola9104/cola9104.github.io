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

  // 获取Notion子页面数据，用于动态生成导航栏
  let notionPages = [];
  try {
    // 尝试导入获取Notion页面的逻辑
    const { getFeaturesFromHomepageBlocks } = await import(path.resolve(__dirname, '../../update-homepage-features.js'));
    // 获取Notion子页面
    const features = await getFeaturesFromHomepageBlocks();
    notionPages = features;
    console.log('✅ 成功获取Notion子页面，用于生成导航栏:', notionPages.map(p => p.title));
  } catch (error) {
    console.log('⚠️ 无法获取Notion子页面，将使用默认导航栏配置');
    // 使用默认导航页面，包含硬编码的子页面信息
    notionPages = [
      { 
        title: '网络安全', 
        link: '/网络安全/',
        subPages: [
          { text: '网络安全概述', link: '/网络安全/网络安全概述/' },
          { text: '常见攻击类型', link: '/网络安全/常见攻击类型/' },
          { text: '防护策略', link: '/网络安全/防护策略/' },
          { text: '零信任架构', link: '/网络安全/零信任架构/' },
          { text: '威胁情报', link: '/网络安全/威胁情报/' },
          { text: '安全运营中心', link: '/网络安全/安全运营中心/' }
        ]
      },
      { 
        title: '渗透测试', 
        link: '/渗透测试/',
        subPages: [
          { text: '渗透测试流程', link: '/渗透测试/渗透测试流程/' },
          { text: '渗透测试基础', link: '/渗透测试/渗透测试基础/' },
          { text: '信息收集', link: '/渗透测试/信息收集/' },
          { text: '漏洞扫描', link: '/渗透测试/漏洞扫描/' }
        ]
      },
      { 
        title: '漏洞分析', 
        link: '/漏洞分析/',
        subPages: [
          { text: '漏洞分析1', link: '/漏洞分析/漏洞分析1/' },
          { text: '漏洞分析2', link: '/漏洞分析/漏洞分析2/' }
        ]
      },
      { 
        title: '嵌入式安全', 
        link: '/嵌入式安全/',
        subPages: [
          { text: '嵌入式安全分析1', link: '/嵌入式安全/嵌入式安全分析1/' },
          { text: '嵌入式安全分析2', link: '/嵌入式安全/嵌入式安全分析2/' }
        ]
      },
      { title: '编程技术', link: '/notion-pages/编程技术' },
      { 
        title: 'CTF竞赛', 
        link: '/CTF竞赛/',
        subPages: [
          { text: 'CTF竞赛概述', link: '/CTF竞赛/CTF竞赛概述/' },
          { text: 'Web安全CTF', link: '/CTF竞赛/Web安全CTF/' },
          { text: 'PwnCTF', link: '/CTF竞赛/PwnCTF/' },
          { text: 'CryptoCTF', link: '/CTF竞赛/CryptoCTF/' }
        ]
      }
    ];
  }

  // 生成动态导航栏
  const generateNav = () => {
    // 基础导航项
    const nav = [
      { text: '首页', link: '/', activeMatch: '^/$' }
    ];

    // 添加Notion子页面作为导航项
    notionPages.forEach(page => {
      if (page.title && page.link) {
        nav.push({
          text: page.title,
          link: page.link,
          activeMatch: `^${page.link}`
        });
      }
    });

    // 添加关于页面
    nav.push({
      text: '关于',
      link: '/关于/',
      activeMatch: '^/关于/'
    });

    return nav;
  };

  // 递归生成侧边栏项，支持嵌套子页面
  const generateSidebarItems = (pages) => {
    return pages.map(page => {
      const sidebarItem = {
        text: page.title,
        link: page.link
      };
      
      // 如果有嵌套子页面，递归生成
      if (page.subPages && page.subPages.length > 0) {
        sidebarItem.collapsible = true;
        sidebarItem.items = generateSidebarItems(page.subPages);
      }
      
      return sidebarItem;
    });
  };

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
      
      // 动态生成导航菜单，根据Notion子页面
      nav: generateNav(),

      // 动态生成侧边栏，根据Notion子页面和嵌套子页面
      sidebar: {
        // 首页不显示侧边栏
        "/": [],
        // 为每个Notion页面生成侧边栏配置，支持无限层级子页面
        ...notionPages.reduce((sidebarConfig, page) => {
          if (page.title && page.link) {
            // 提取页面路径，用于侧边栏配置键
            const pagePath = page.link;
            
            // 只在有子页面时生成侧边栏配置
            if (page.subPages && page.subPages.length > 0) {
              sidebarConfig[pagePath] = [
                {
                  text: page.title,
                  collapsible: true,
                  items: generateSidebarItems(page.subPages)
                }
              ];
            }
          }
          return sidebarConfig;
        }, {})
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