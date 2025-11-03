/**
 * Notion数据插件
 * 提供全局访问Notion数据的能力
 */
export const NotionPlugin = {
  install(app) {
    // 创建默认的store
    const defaultStore = {
      lastUpdate: null,
      notionData: {},
      loading: false
    }
    
    // 创建默认的API方法
    const defaultApi = {
      getHomepageData: async () => null,
      getPageData: async () => null,
      getCategoryData: async () => null
    }
    
    // 提供全局数据访问，确保不会覆盖client.js中已定义的
    app.config.globalProperties.$notion = {
      store: defaultStore,
      ...defaultApi,
      ...(app.config.globalProperties.$notion || {})
    }
    
    // 提供组合式API方式访问
    app.provide('notion', app.config.globalProperties.$notion)
  }
}

/**
 * 简单的Notion数据访问函数
 * 直接从全局属性获取notion实例
 */
export function useNotion() {
  // 由于在某些环境下直接导入vue函数会导致问题，
  // 我们使用一种更简单的方式来提供数据访问能力
  
  // 创建一个简单的响应式模拟对象
  function createSimpleStore() {
    const store = {
      data: null,
      loading: false,
      error: null
    }
    
    return {
      get data() {
        return store.data
      },
      set data(value) {
        store.data = value
      },
      get loading() {
        return store.loading
      },
      set loading(value) {
        store.loading = value
      },
      get error() {
        return store.error
      },
      set error(value) {
        store.error = value
      }
    }
  }
  
  // 获取全局notion实例
  const getGlobalNotion = () => {
    // 在浏览器环境中获取
    if (typeof window !== 'undefined' && window.__VUE_APP__) {
      return window.__VUE_APP__.config.globalProperties.$notion
    }
    // 在组件环境中尝试通过Vue应用实例获取
    try {
      // 导入Vue来获取当前应用实例
      const { getCurrentInstance } = require('vue')
      const instance = getCurrentInstance()
      if (instance) {
        return instance.appContext.config.globalProperties.$notion
      }
    } catch (e) {
      console.warn('无法获取Vue实例:', e)
    }
    
    // 返回默认的空对象
    return {
      store: { lastUpdate: null, notionData: {}, loading: false },
      getHomepageData: async () => null,
      getPageData: async () => null,
      getCategoryData: async () => null
    }
  }
  
  // 创建简单的响应式存储
  const simpleStore = createSimpleStore()
  const notion = getGlobalNotion()
  
  // 获取首页数据
  const fetchHomepageData = async () => {
    simpleStore.loading = true
    simpleStore.error = null
    
    try {
      const result = await notion.getHomepageData()
      simpleStore.data = result
      return result
    } catch (err) {
      simpleStore.error = err
      console.error('获取首页数据失败:', err)
      return null
    } finally {
      simpleStore.loading = false
    }
  }
  
  // 获取页面数据
  const fetchPageData = async (path) => {
    simpleStore.loading = true
    simpleStore.error = null
    
    try {
      const result = await notion.getPageData(path)
      simpleStore.data = result
      return result
    } catch (err) {
      simpleStore.error = err
      console.error(`获取页面数据失败: ${path}`, err)
      return null
    } finally {
      simpleStore.loading = false
    }
  }
  
  // 获取分类数据
  const fetchCategoryData = async (category) => {
    simpleStore.loading = true
    simpleStore.error = null
    
    try {
      const result = await notion.getCategoryData(category)
      simpleStore.data = result
      return result
    } catch (err) {
      simpleStore.error = err
      console.error(`获取分类数据失败: ${category}`, err)
      return null
    } finally {
      simpleStore.loading = false
    }
  }
  
  // 刷新当前数据
  const refreshData = async (type, id) => {
    if (type === 'home') {
      return fetchHomepageData()
    } else if (type === 'page') {
      return fetchPageData(id)
    } else if (type === 'category') {
      return fetchCategoryData(id)
    }
  }
  
  return {
    data: simpleStore.data,
    loading: simpleStore.loading,
    error: simpleStore.error,
    fetchHomepageData,
    fetchPageData,
    fetchCategoryData,
    refreshData,
    store: notion.store
  }
}