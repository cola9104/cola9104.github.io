import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 加载环境变量
dotenv.config();

// 配置变量
const NOTION_TOKEN = process.env.NOTION_TOKEN;
// 验证NOTION_TOKEN格式
if (NOTION_TOKEN && !NOTION_TOKEN.startsWith('Bearer ')) {
  console.warn('⚠️ NOTION_TOKEN应该以"Bearer "开头');
}

// 从父页面获取子页面作为特性
async function getFeaturesFromParentPage() {
  try {
    // 获取父页面的所有子页面
    const homepageId = process.env.NOTION_MAIN_PAGE_ID || '26822358-21c9-80f5-b1d1-cc8fedd541b6';
    const parentBlocks = await getPageBlocks(homepageId);
    const childPages = parentBlocks.filter(block => block.type === 'child_page');
    
    console.log(`📄 找到 ${childPages.length} 个顶级子页面`);
    
    // 为每个子页面获取详细信息
    const features = [];
    for (const childPage of childPages) {
      const pageId = childPage.id;
      const title = childPage.child_page.title;
      
      // 跳过不需要在首页显示的页面
      if (title === '关于') {
        console.log(`⏭️  跳过页面: ${title}`);
        continue;
      }
      
      // 获取页面属性
      const properties = await getPageProperties(pageId);
      
      // 尝试从页面属性中获取描述
      const description = properties.description?.rich_text[0]?.plain_text || 
                         properties.Description?.rich_text[0]?.plain_text || 
                         getDefaultDescription(title);
      
      // 获取链接，优先使用特殊映射
      const link = SPECIAL_LINK_MAPPING[title] || 
                  properties.link?.rich_text[0]?.plain_text || 
                  properties.Link?.rich_text[0]?.plain_text || 
                  getCorrectLink(title);
      
      // 从标题提取图标或使用默认图标
      const { icon } = extractIconAndTitle(title);
      
      features.push({
        icon,
        title,
        details: description,
        link: link
      });
      
      console.log(`✅ 已添加特性: ${title} -> ${link}`);
    }
    
    return features;
  } catch (error) {
    console.error('❌ 从父页面获取子页面失败:', error.message);
    return [];
  }
}

/**
 * 获取正确的链接路径
 */
function getCorrectLink(title) {
  // 根据标题获取正确的链接路径
  const linkMap = {
    '网络安全': '/网络安全/',
    '渗透测试': '/渗透测试/',
    '漏洞分析': '/漏洞分析/',
    '嵌入式安全': '/嵌入式安全/',
    '编程技术': '/编程技术/',
    'CTF': '/CTF竞赛/'
  };
  
  return linkMap[title] || `/${generateSlug(title)}/`;
}

/**
 * 获取默认描述
 */
function getDefaultDescription(title) {
  // 根据标题获取默认描述
  const descriptionMap = {
    '网络安全': '深入探讨网络安全基础理论、防护策略和最新威胁情报，帮助构建安全防护体系',
    '渗透测试': '分享渗透测试实战经验，从信息收集到漏洞利用的完整流程和技巧',
    '漏洞分析': '分析各类安全漏洞的原理、利用方式和修复方案，提升安全防护能力',
    '嵌入式安全': '探索嵌入式系统和IoT设备的安全挑战，包括硬件安全、固件安全等',
    '编程技术': '编程语言学习和技术分享，涵盖Python、Go、Rust等多种语言，以及Web开发和安全编程',
    'CTF': 'CTF题目解析和解题思路分享，涵盖Web、Pwn、Crypto等多个方向'
  };
  
  return descriptionMap[title] || `探索${title}的相关内容和技术分享`;
}

/**
 * 获取Notion数据库中的特性数据
 */
async function getFeaturesFromDatabase() {
  try {
    console.log('🔍 正在尝试从数据库获取数据...');
    // 由于我们现在只使用页面子元素方式获取数据，这里直接返回空数组
    return [];
  } catch (error) {
    console.error('❌ 从数据库获取数据失败:', error.message);
    return [];
  }
}

/**
 * 优先使用blocks API获取页面子元素作为特性数据，支持递归获取二级子页面
 */
async function getFeaturesFromHomepageBlocks() {
  try {
    console.log('🔍 正在尝试从主页获取子页面数据...');
    
    // 获取主页的块内容
    const homepageId = process.env.NOTION_MAIN_PAGE_ID || '26822358-21c9-80f5-b1d1-cc8fedd541b6';
    const blocks = await getPageBlocks(homepageId);
    
    if (!blocks || blocks.length === 0) {
      console.log('📭 没有找到主页的块内容');
      return [];
    }

    // 过滤出子页面和子数据库
    const childItems = blocks.filter(block => {
      // 匹配子页面或子数据库
      return (block.type === 'child_page' && block.child_page && block.child_page.title) || 
             (block.type === 'database' && block.database && block.database.title);
    });
    
    if (childItems.length === 0) {
      console.log('📭 没有找到子页面或子数据库');
      return [];
    }

    console.log(`✅ 找到 ${childItems.length} 个子页面或子数据库作为特性`);
    
    // 处理子页面和子数据库数据，支持递归获取二级子页面
    const features = [];
    for (const childItem of childItems) {
      let title, itemId;
      
      // 根据类型获取标题和ID
      if (childItem.type === 'child_page') {
        title = childItem.child_page.title;
        itemId = childItem.id;
      } else if (childItem.type === 'database') {
        title = childItem.database.title;
        itemId = childItem.id;
      } else {
        continue;
      }
      
      // 跳过"关于"页面
      if (title === '关于') {
        continue;
      }

      // 获取页面属性
      const properties = await getPageProperties(itemId);
      
      // 生成链接路径
      const link = getCorrectLink(title);
      
      // 获取描述
      let description = '';
      if (properties && properties['描述']) {
        description = extractTextFromRichText(properties['描述'].rich_text);
      }
      
      // 如果没有描述，使用默认描述
      if (!description) {
        description = getDefaultDescription(title);
      }

      // 递归获取所有层级子页面
      const subPages = await getSubPages(itemId, title, link);
      
      features.push({
        title,
        description,
        link,
        subPages // 添加所有层级子页面
      });
    }

    return features;
  } catch (error) {
    console.error('❌ 从主页获取子页面数据失败:', error.message);
    return [];
  }
}

/**
 * 递归获取页面的子页面，支持无限层级
 * @param {string} pageId - 页面ID
 * @param {string} parentTitle - 父页面标题
 * @param {string} parentLink - 父页面链接
 * @returns {Promise<Array>} - 子页面数组，包含嵌套的子页面
 */
async function getSubPages(pageId, parentTitle, parentLink) {
  try {
    console.log(`🔍 正在获取 ${parentTitle} 的子页面...`);
    
    // 获取页面的块内容
    const blocks = await getPageBlocks(pageId);
    
    if (!blocks || blocks.length === 0) {
      console.log(`📭 ${parentTitle} 没有子页面`);
      return [];
    }

    // 过滤出子页面
    const childPages = blocks.filter(block => {
      return block.type === 'child_page' && block.child_page && block.child_page.title;
    });
    
    if (childPages.length === 0) {
      console.log(`📭 ${parentTitle} 没有子页面`);
      return [];
    }

    console.log(`✅ 找到 ${childPages.length} 个 ${parentTitle} 的子页面`);
    
    // 处理子页面数据，递归获取子页面的子页面
    const subPages = [];
    for (const childPage of childPages) {
      const subTitle = childPage.child_page.title;
      const subPageId = childPage.id;
      
      // 生成链接路径
      const subLink = `${parentLink}${generateSlug(subTitle)}/`;
      
      // 递归获取当前子页面的子页面
      const nestedSubPages = await getSubPages(subPageId, subTitle, subLink);
      
      const subPageData = {
        title: subTitle,
        link: subLink
      };
      
      // 如果有嵌套子页面，添加到当前子页面中
      if (nestedSubPages.length > 0) {
        subPageData.subPages = nestedSubPages;
      }
      
      subPages.push(subPageData);
    }

    return subPages;
  } catch (error) {
    console.error(`❌ 获取 ${parentTitle} 的子页面失败:`, error.message);
    return [];
  }
}

/**
 * 获取正确的链接路径，支持二级子页面
 */
function getCorrectLink(title, parentTitle = '') {
  // 根据标题获取正确的链接路径
  const linkMap = {
    '网络安全': '/网络安全/',
    '渗透测试': '/渗透测试/',
    '漏洞分析': '/漏洞分析/',
    '嵌入式安全': '/嵌入式安全/',
    '编程技术': '/编程技术/',
    'CTF': '/CTF竞赛/',
    'CTF竞赛': '/CTF竞赛/'
  };
  
  // 处理二级子页面链接
  if (parentTitle && linkMap[parentTitle]) {
    const parentLink = linkMap[parentTitle];
    return `${parentLink}${generateSlug(title)}/`;
  }
  
  return linkMap[title] || `/${generateSlug(title)}/`;
}

/**
 * 获取页面块内容
 */
async function getPageBlocks(pageId) {
  try {
    const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      headers: {
        'Authorization': NOTION_TOKEN,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`获取页面块失败 ${pageId}:`, error.message);
    return [];
  }
}

/**
 * 获取页面属性
 */
async function getPageProperties(pageId) {
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: {
        'Authorization': NOTION_TOKEN,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.properties || {};
  } catch (error) {
    console.error(`获取页面属性失败 ${pageId}:`, error.message);
    return {};
  }
}

/**
 * 从富文本中提取文本
 */
function extractTextFromRichText(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) {
    return '';
  }
  return richTextArray.map(item => item.plain_text).join('');
}

/**
 * 提取图标
 */
function extractIcon(iconName) {
  const iconMap = {
    'security': '🔒',
    'penetration': '🎯',
    'vulnerability': '🔍',
    'embedded': '🔧',
    'programming': '💻',
    'ctf': '🏆',
    'default': '📄'
  };
  
  return iconMap[iconName.toLowerCase()] || '📄';
}

/**
 * 提取图标和标题
 */
function extractIconAndTitle(text) {
  const iconMatch = text.match(/^(\p{Emoji_Presentation}|\p{Emoji_Modifier_Base})\s+/u);
  if (iconMatch) {
    const icon = iconMatch[1];
    const title = text.substring(icon.length).trim();
    return { icon, title };
  }
  
  // 根据标题内容选择图标
  const titleLower = text.toLowerCase();
  let icon = '📄';
  
  if (titleLower.includes('网络安全')) icon = '🔒';
  else if (titleLower.includes('渗透测试')) icon = '🎯';
  else if (titleLower.includes('漏洞分析')) icon = '🔍';
  else if (titleLower.includes('嵌入式')) icon = '🔧';
  else if (titleLower.includes('编程')) icon = '💻';
  else if (titleLower.includes('ctf')) icon = '🏆';
  
  return { icon, title: text };
}

/**
 * 生成URL友好的别名
 */
function generateSlug(title) {
  return title
    .replace(/[^\w\s\u4e00-\u9fff-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
    || 'untitled';
}

/**
 * 获取默认特性数据
 */
function getDefaultFeatures() {
  console.log('⚠️ 使用默认特性数据');
  
  return [
    {
      icon: '🔒',
      title: '网络安全',
      details: '深入探讨网络安全基础理论、防护策略和最新威胁情报，帮助构建安全防护体系',
      link: '/网络安全/'
    },
    {
      icon: '🎯',
      title: '渗透测试',
      details: '分享渗透测试实战经验，从信息收集到漏洞利用的完整流程和技巧',
      link: '/渗透测试/'
    },
    {
      icon: '🔍',
      title: '漏洞分析',
      details: '分析各类安全漏洞的原理、利用方式和修复方案，提升安全防护能力',
      link: '/漏洞分析/'
    },
    {
      icon: '🔧',
      title: '嵌入式安全',
      details: '探索嵌入式系统和IoT设备的安全挑战，包括硬件安全、固件安全等',
      link: '/嵌入式安全/'
    },
    {
      icon: '💻',
      title: '编程技术',
      details: '编程语言学习和技术分享，涵盖Python、Go、Rust等多种语言，以及Web开发和安全编程',
      link: '/编程技术/'
    },
    {
      icon: '🏆',
      title: 'CTF竞赛',
      details: 'CTF题目解析和解题思路分享，涵盖Web、Pwn、Crypto等多个方向',
      link: '/CTF竞赛/'
    }
  ];
}

// 定义特性标题到图标的映射
const titleToIcon = {
  '网络安全': '🔒',
  '渗透测试': '🎯',
  '漏洞分析': '🔍',
  '嵌入式安全': '🔧',
  '编程技术': '💻',
  'CTF': '🏆',
  'CTF竞赛': '🏆'
};

/**
 * 生成特性部分的Markdown
 */
function generateFeaturesMarkdown(features) {
  // 确保features是数组
  if (!Array.isArray(features)) {
    console.error('❌ 特性数据格式错误');
    return '';
  }

  // 生成正确格式的特性Markdown
  let markdown = '';
  
  features.forEach(feature => {
    // 确保feature对象有效
    if (!feature || typeof feature !== 'object') {
      return;
    }
    
    // 根据标题获取图标，否则使用默认图标
    const title = feature.title || '未知特性';
    const icon = titleToIcon[title] || '📄';
    
    markdown += `  - title: ${icon} ${title}
`;
    markdown += `    details: ${feature.details || feature.description || '暂无描述'}
`;
    markdown += `    link: ${feature.link || '/'} 
`;
  });

  return markdown;
}

/**
 * 主更新函数
 */
async function updateHomepageFeatures() {
  try {
    console.log('🚀 开始更新首页特性部分...');
    
    // 1. 优先使用blocks API获取页面子元素
    let features = await getFeaturesFromHomepageBlocks();
    
    // 2. 如果获取子页面失败或没有数据，尝试从数据库获取
    if (!features || features.length === 0) {
      console.log('🔄 尝试从数据库获取特性数据...');
      features = await getFeaturesFromDatabase();
    }
    
    // 3. 如果都失败，使用默认数据
    if (!features || features.length === 0) {
      console.log('⚠️ 使用默认特性数据...');
      features = getDefaultFeatures();
    }

    // 生成Markdown
    const featuresMarkdown = generateFeaturesMarkdown(features);
    
    // 读取首页文件
  const homepagePath = path.join('docs', 'index.md');
  let homepageContent = fs.readFileSync(homepagePath, 'utf-8');
  
  // 查找并替换features部分（YAML frontmatter中的）
  const yamlFeaturesRegex = /features:\s*\n(?:  - title: .+\n    details: .+\n    link: .+\n?)+/;
  if (yamlFeaturesRegex.test(homepageContent)) {
    homepageContent = homepageContent.replace(yamlFeaturesRegex, `features:\n${featuresMarkdown}`);
  }
  
  // 删除底部的Features部分（如果有）
  const bottomFeaturesRegex = /## Features\s*\n\n([\s\S]*?)(?=\n##|$)/;
  if (bottomFeaturesRegex.test(homepageContent)) {
    homepageContent = homepageContent.replace(bottomFeaturesRegex, '');
  }
  
  // 生成主要内容部分的Markdown
  let mainContentMarkdown = '## 主要内容\n\n';
  
  // 使用Set来避免重复分类，并且将CTF和CTF竞赛视为同一个分类
  const addedCategories = new Set();
  
  // 定义主要分类的顺序
  const categoryOrder = ['网络安全', '渗透测试', '漏洞分析', '嵌入式安全', 'CTF竞赛'];
  
  // 创建特性映射，方便按顺序访问
  const featureMap = new Map();
  features.forEach(feature => {
    if (!feature || typeof feature !== 'object') {
      return;
    }
    
    const title = feature.title || '未知特性';
    // 处理CTF和CTF竞赛的重复问题
    const normalizedTitle = title === 'CTF' ? 'CTF竞赛' : title;
    
    // 只处理主要分类
    if (categoryOrder.includes(normalizedTitle)) {
      featureMap.set(normalizedTitle, feature);
    }
  });
  
  // 按顺序生成主要内容
  categoryOrder.forEach(category => {
    const feature = featureMap.get(category);
    if (feature) {
      const icon = titleToIcon[category] || '📄';
      const details = feature.details || feature.description || '暂无描述';
      
      mainContentMarkdown += `### ${icon} ${category}\n\n`;
      mainContentMarkdown += `${details}\n\n`;
    }
  });
  
  // 简化首页内容更新逻辑
  // 先将首页内容按"## 数据更新状态"分割
  const parts = homepageContent.split('## 数据更新状态');
  if (parts.length === 2) {
    // 获取标题和描述部分
    const headerPart = parts[0].split('## 主要内容')[0].trim();
    // 重新构建首页内容
    homepageContent = `${headerPart}\n\n${mainContentMarkdown.trim()}\n\n## 数据更新状态${parts[1]}`;
  }
  
  // 写入更新后的内容
  fs.writeFileSync(homepagePath, homepageContent, 'utf-8');
    
    console.log(`🎉 成功更新首页特性，添加了 ${features.length} 个特性`);
    return features.length;
  } catch (error) {
    console.error('❌ 更新首页特性失败:', error.message);
    return 0;
  }
}

/**
 * 运行更新
 * @param {Object} options - 配置选项
 * @param {boolean} options.force - 是否强制更新
 * @returns {Promise<boolean>} 更新是否成功
 */
export default async function runUpdate(options = {}) {
  const forceUpdate = options.force || false;
  
  // 可以在这里添加更新条件检查
  if (!forceUpdate) {
    // 例如：检查上次更新时间，避免频繁更新
  }
  
  const result = await updateHomepageFeatures();
  if (result) {
    console.log('🎉 首页特性数据更新完成！');
  } else {
    console.log('❌ 首页特性数据更新失败，请检查日志信息。');
  }
  
  return result;
}

// 如果直接运行此脚本
if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  runUpdate({ force: true });
}