import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 配置变量
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_MAIN_PAGE_ID = process.env.NOTION_MAIN_PAGE_ID || '26822358-21c9-80f5-b1d1-cc8fedd541b6';
const CONFIG_FILE_PATH = path.join('docs', '.vitepress', 'config.mjs');

// 验证NOTION_TOKEN格式
if (NOTION_TOKEN && !NOTION_TOKEN.startsWith('Bearer ')) {
  console.warn('⚠️ NOTION_TOKEN应该以"Bearer "开头');
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
 * 获取子页面及其子目录结构
 */
async function getSubPageStructure(pageId, title) {
  try {
    // 获取页面块
    const blocks = await getPageBlocks(pageId);
    const childPages = blocks.filter(block => block.type === 'child_page');

    // 如果没有子页面，返回空数组
    if (childPages.length === 0) {
      return [];
    }

    // 处理子页面
    const items = [];
    for (const childPage of childPages) {
      const childTitle = childPage.child_page.title;
      // 生成链接路径
      const link = `/${title}/${generateSlug(childTitle)}/`;

      items.push({
        text: childTitle,
        link: link
      });
    }

    return items;
  } catch (error) {
    console.error(`获取子页面结构失败:`, error.message);
    return [];
  }
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
 * 从Notion获取侧边栏配置数据（合并网络安全页面）
 */
async function getMergedSidebarConfigFromNotion() {
  try {
    console.log('🔍 正在从Notion获取侧边栏配置数据...');

    // 获取主页的子页面作为主要分类
    const mainBlocks = await getPageBlocks(NOTION_MAIN_PAGE_ID);
    const mainPages = mainBlocks.filter(block => block.type === 'child_page');

    console.log(`✅ 找到 ${mainPages.length} 个主要分类页面`);

    // 构建侧边栏配置
    const sidebarConfig = {};

    // 定义需要合并的网络安全相关页面
    const securityRelatedPages = ['网络安全基础', '高级主题', '网络安全概述', '常见攻击类型', '防护策略', '零信任架构', '威胁情报', '安全运营中心'];

    // 存储所有网络安全相关的内容
    let securityItems = [];
    let securityCategoryPath = '/网络安全/';

    // 遍历每个主要分类
    for (const mainPage of mainPages) {
      const title = mainPage.child_page.title;

      // 跳过不需要在侧边栏显示的页面
      if (title === '关于' || title === '首页') {
        continue;
      }

      // 检查是否为网络安全相关页面
      if (securityRelatedPages.some(related => title.includes(related) || related.includes(title))) {
        console.log(`🔒 找到网络安全相关页面: ${title}`);

        // 获取该分类的子页面结构
        const items = await getSubPageStructure(mainPage.id, title);

        // 如果是主分类页面（如网络安全基础、高级主题），添加到网络安全分类中
        if (items.length > 0) {
          securityItems.push({
            text: title,
            items: items
          });
        } else {
          // 如果没有子页面，直接添加为链接
          securityItems.push({
            text: title,
            link: `/${title}/${generateSlug(title)}/`
          });
        }
      } else {
        // 非网络安全页面，正常处理
        const categoryPath = `/${title}/`;
        const items = await getSubPageStructure(mainPage.id, title);

        // 如果有子页面，构建侧边栏配置
        if (items.length > 0) {
          sidebarConfig[categoryPath] = [
            {
              text: title,
              items: items
            }
          ];

          console.log(`✅ 已添加侧边栏配置: ${title} (${items.length}个子页面)`);
        }
      }
    }

    // 如果找到网络安全相关页面，创建合并的网络安全分类
    if (securityItems.length > 0) {
      sidebarConfig[securityCategoryPath] = [
        {
          text: '网络安全',
          items: securityItems
        }
      ];

      console.log(`🔒 已创建合并的网络安全分类，包含 ${securityItems.length} 个子分类`);
    }

    return sidebarConfig;
  } catch (error) {
    console.error('❌ 从Notion获取侧边栏配置数据失败:', error.message);
    return {};
  }
}

/**
 * 更新VitePress配置文件中的侧边栏配置
 */
async function updateMergedSidebarConfig() {
  try {
    console.log('🚀 开始更新合并后的侧边栏配置...');

    // 1. 从Notion获取合并的侧边栏配置
    const sidebarConfig = await getMergedSidebarConfigFromNotion();

    // 2. 如果获取配置失败，使用默认配置
    if (Object.keys(sidebarConfig).length === 0) {
      console.log('⚠️ 使用默认侧边栏配置...');
      return { success: false, message: '使用默认配置' };
    }

    // 3. 读取当前配置文件
    let configContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');

    // 4. 生成侧边栏配置的JavaScript代码（带正确缩进）
    const sidebarJSON = JSON.stringify(sidebarConfig, null, 2)
      .split('\n')
      .map((line, index) => index === 0 ? line : '      ' + line)
      .join('\n');

    const sidebarConfigString = `// 侧边栏（网络安全页面已合并）
      sidebar: ${sidebarJSON}`;

    // 5. 查找并替换现有的侧边栏配置
    // 使用更智能的方式查找 sidebar 配置块
    const sidebarStartRegex = /\/\/\s*侧边栏.*?\n\s*sidebar:\s*{/s;
    const startMatch = configContent.match(sidebarStartRegex);

    if (startMatch) {
      const startIndex = startMatch.index;
      const startPos = startIndex + startMatch[0].length - 1; // -1 因为我们要包含第一个 {

      // 从 sidebar: { 开始，找到匹配的闭合括号
      let braceCount = 0;
      let endPos = startPos;
      for (let i = startPos; i < configContent.length; i++) {
        if (configContent[i] === '{') braceCount++;
        if (configContent[i] === '}') braceCount--;
        if (braceCount === 0) {
          endPos = i + 1;
          break;
        }
      }

      // 替换整个 sidebar 配置块
      const before = configContent.substring(0, startIndex);
      const after = configContent.substring(endPos);
      configContent = before + sidebarConfigString + after;
    } else {
      // 如果没有找到侧边栏配置，在themeConfig中添加
      const themeConfigRegex = /themeConfig:\s*{/;
      if (themeConfigRegex.test(configContent)) {
        configContent = configContent.replace(themeConfigRegex, `themeConfig: {\n    ${sidebarConfigString.replace(/\n/g, '\n    ')}`);
      } else {
        console.error('❌ 无法在配置文件中找到themeConfig部分');
        return { success: false, message: '无法找到themeConfig部分' };
      }
    }

    // 6. 写入更新后的配置文件
    fs.writeFileSync(CONFIG_FILE_PATH, configContent, 'utf-8');

    console.log(`🎉 成功更新合并后的侧边栏配置，添加了 ${Object.keys(sidebarConfig).length} 个分类`);
    return { success: true, message: `更新了 ${Object.keys(sidebarConfig).length} 个分类（含合并的网络安全分类）` };
  } catch (error) {
    console.error('❌ 更新侧边栏配置失败:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * 运行更新
 * @param {Object} options - 配置选项
 * @param {boolean} options.force - 是否强制更新
 * @returns {Promise<boolean>} 更新是否成功
 */
// 主要更新函数
export async function runUpdate(options = {}) {
    const forceUpdate = options.force || false;

    // 可以在这里添加更新条件检查
    if (!forceUpdate) {
      // 例如：检查上次更新时间，避免频繁更新
    }

    const result = await updateMergedSidebarConfig();
    if (result.success) {
      console.log('🎉 合并后的侧边栏配置更新完成！');
    } else {
      console.log(`❌ 侧边栏配置更新失败: ${result.message}`);
    }

    return result.success;
  }

  // 如果直接运行此脚本
  if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
    runUpdate({ force: true });
  }