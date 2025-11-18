# GitHub Secrets 配置指南

## 重要提示

部署工作流需要在 GitHub 仓库中配置以下 Secrets,否则 Notion 同步将失败。

## 需要配置的 Secrets

访问: https://github.com/cola9104/cola9104.github.io/settings/secrets/actions

### 1. NOTION_TOKEN

**值**: `Bearer ntn_Z91829129697EenwSBwmKQB1xdPOEjLK2i46iTzr9gf572`

**说明**: Notion API 访问令牌

### 2. NOTION_MAIN_PAGE_ID

**值**: `26822358-21c9-80f5-b1d1-cc8fedd541b6`

**说明**: Notion 主页面 ID

## 配置步骤

1. 访问: https://github.com/cola9104/cola9104.github.io/settings/secrets/actions
2. 点击 "New repository secret"
3. 添加 NOTION_TOKEN 和 NOTION_MAIN_PAGE_ID
4. 重新运行部署工作流

## 同步状态

- 分类数: 5 个
- 总页面数: 10 个子页面

