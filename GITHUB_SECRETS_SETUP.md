# GitHub Secrets 配置指南

## 问题说明

GitHub Actions 工作流失败，原因是缺少必要的 Notion API 环境变量配置。

错误信息：
```
❌ NOTION_TOKEN 未设置
请在 GitHub 仓库设置中添加 NOTION_TOKEN secret
```

## 解决方案

### 步骤 1: 获取 Notion 信息

#### 1.1 NOTION_TOKEN (已有)
- ✅ 你的 Token: `ntn_Z91829129697EenwSBwmKQB1xdPOEjLK2i46iTzr9gf572`

#### 1.2 NOTION_DATABASE_ID (需要获取)
1. 打开你的 Notion 数据库页面
2. 查看浏览器地址栏的 URL，格式类似：
   ```
   https://www.notion.so/workspace/1234567890abcdef1234567890abcdef?v=...
   ```
3. 提取中间的32位ID（去除连字符）：`1234567890abcdef1234567890abcdef`

#### 1.3 NOTION_MAIN_PAGE_ID (可选)
- 如果你有特定的主页面需要同步，从该页面URL中提取ID
- 格式与 DATABASE_ID 相同

### 步骤 2: 在 GitHub 仓库中添加 Secrets

1. **访问仓库设置**
   - 打开: https://github.com/cola9104/cola9104.github.io
   - 点击顶部菜单栏的 **Settings**

2. **进入 Secrets 配置页面**
   - 在左侧边栏找到 **Secrets and variables**
   - 点击 **Actions**

3. **添加第一个 Secret: NOTION_TOKEN**
   - 点击 **New repository secret** 按钮
   - Name 填写: `NOTION_TOKEN`
   - Secret 填写: `ntn_Z91829129697EenwSBwmKQB1xdPOEjLK2i46iTzr9gf572`
   - 点击 **Add secret** 保存

4. **添加第二个 Secret: NOTION_DATABASE_ID**
   - 再次点击 **New repository secret**
   - Name 填写: `NOTION_DATABASE_ID`
   - Secret 填写: `你的数据库ID（32位字符）`
   - 点击 **Add secret** 保存

5. **添加第三个 Secret: NOTION_MAIN_PAGE_ID (可选)**
   - 如果有主页面ID，重复上述步骤
   - Name 填写: `NOTION_MAIN_PAGE_ID`
   - Secret 填写: `你的主页面ID（32位字符）`
   - 点击 **Add secret** 保存

### 步骤 3: 验证配置

配置完成后，你可以：

1. **手动触发工作流测试**
   - 进入仓库的 **Actions** 标签页
   - 选择 **Notion Content Sync** 工作流
   - 点击 **Run workflow** 手动触发

2. **推送代码触发**
   - 进行任何代码提交并推送到 main 分支
   - 工作流会自动运行

## 当前配置状态

### 本地环境
- ✅ `.env` 文件已创建
- ✅ `NOTION_TOKEN` 已配置
- ⚠️ `NOTION_DATABASE_ID` 需要你补充
- ⚠️ `NOTION_MAIN_PAGE_ID` (可选) 需要你补充

### GitHub Secrets（需要手动配置）
- ⚠️ `NOTION_TOKEN` - 需要添加
- ⚠️ `NOTION_DATABASE_ID` - 需要添加
- ⚠️ `NOTION_MAIN_PAGE_ID` - 可选

## 获取 Notion Database ID 的详细方法

### 方法 1: 从 URL 获取
1. 在浏览器中打开你的 Notion 数据库
2. URL 格式示例：
   ```
   https://www.notion.so/myworkspace/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4?v=x1y2z3
   ```
3. 提取的 Database ID: `a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4`

### 方法 2: 使用 Notion API
运行测试脚本查看你有权限访问的所有数据库：
```bash
node test-notion-connection.js
```

## 故障排除

### 如果工作流仍然失败

1. **检查 Token 权限**
   - 确保 Integration 已经被添加到对应的 Notion 页面/数据库
   - 在 Notion 中，点击页面右上角的 `...` -> `Connections` -> 添加你的 Integration

2. **验证 Database ID**
   - 确保 ID 是32位十六进制字符（不含连字符和特殊字符）
   - 格式正确: `1234567890abcdef1234567890abcdef`
   - 格式错误: `1234-5678-90ab-cdef` (含连字符)

3. **检查 Secrets 名称**
   - 确保名称完全匹配（区分大小写）
   - `NOTION_TOKEN` ✅
   - `notion_token` ❌

## 下一步

1. 请提供你的 `NOTION_DATABASE_ID`
2. 我会帮你更新本地 `.env` 文件
3. 然后你可以按照上述步骤在 GitHub 中配置 Secrets
4. 最后重新运行工作流进行验证

## 安全提示

⚠️ **重要**:
- 不要将 `.env` 文件提交到 Git 仓库
- `.env` 已经在 `.gitignore` 中（请验证）
- Secrets 配置在 GitHub 后，任何人都无法查看其值
