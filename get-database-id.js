import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

console.log('🔍 Notion数据库ID获取指南');
console.log('');

console.log('📋 步骤1：在Notion中创建数据库');
console.log('1. 打开Notion，创建新页面');
console.log('2. 输入 /database 或点击 + 按钮');
console.log('3. 选择 "Table - Full page"');
console.log('');

console.log('🏗️ 步骤2：设置数据库属性');
console.log('必需属性列表：');
console.log('  📝 标题 (Title) - 类型：Title');
console.log('  🏷️ 状态 (Status) - 类型：Select (Published, Draft, Archived)');
console.log('  🔗 别名 (Slug) - 类型：Rich text');
console.log('  📄 摘要 (Excerpt) - 类型：Rich text');
console.log('  🏷️ 标签 (Tags) - 类型：Multi-select');
console.log('  📂 分类 (Category) - 类型：Select');
console.log('  📅 创建时间 (Created) - 类型：Created time');
console.log('  📅 更新时间 (Updated) - 类型：Last edited time');
console.log('  🖼️ 封面 (Cover) - 类型：Files & media');
console.log('  ⭐ 优先级 (Priority) - 类型：Select (High, Medium, Low)');
console.log('  👁️ 阅读量 (Views) - 类型：Number');
console.log('');

console.log('🔗 步骤3：获取数据库ID');
console.log('1. 打开你的Notion数据库');
console.log('2. 复制URL，格式类似：');
console.log('   https://www.notion.so/your-workspace/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=xxxxx');
console.log('3. 提取32位字符的ID（去掉连字符）');
console.log('');

console.log('🔐 步骤4：设置数据库权限');
console.log('1. 点击数据库右上角的 "..." 菜单');
console.log('2. 选择 "Add connections"');
console.log('3. 选择你的集成应用');
console.log('4. 确保有 "Read content" 权限');
console.log('');

console.log('📝 步骤5：更新.env文件');
console.log('将正确的数据库ID更新到 .env 文件中：');
console.log('NOTION_DATABASE_ID=你的32位数据库ID');
console.log('');

console.log('🧪 步骤6：测试连接');
console.log('运行以下命令测试连接：');
console.log('node test-fetch.js');
console.log('');

// 显示当前配置
console.log('📊 当前配置状态：');
console.log('Token:', process.env.NOTION_TOKEN ? '✅ 已配置' : '❌ 未配置');
console.log('Database ID:', process.env.NOTION_DATABASE_ID ? '✅ 已配置' : '❌ 未配置');
console.log('');

if (process.env.NOTION_DATABASE_ID) {
  console.log('💡 提示：如果连接失败，请检查：');
  console.log('1. 数据库ID是否正确（32位字符，无连字符）');
  console.log('2. 数据库是否已分享给集成应用');
  console.log('3. 集成应用是否有读取权限');
}
