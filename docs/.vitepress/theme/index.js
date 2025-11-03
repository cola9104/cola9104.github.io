import './blog.css'

// 导入客户端配置
import enhanceClient from '../client.js'

// 导入Notion插件
import { NotionPlugin } from '../plugins/notionPlugin.js'

export default {
  enhanceApp({ app, router }) {
    // 注册Notion插件
    app.use(NotionPlugin)
    
    // 使用客户端增强函数，并传入router
    enhanceClient(app, router)
    
    // 注册全局组件
    // 可以在这里注册其他全局组件
  }
}
