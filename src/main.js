import { createApp } from 'vue'
import App from './App.vue'
import { DEFAULT_VERSION, getVersionBrand } from '@/config/site.config'
import { setupAnimations } from '@/animations'

/* 全局样式：顺序固定 tokens → base → glass */
import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/glass.css'

/* 动画系统初始化：注册 GSAP 插件 + ScrollTrigger（幂等） */
setupAnimations()

/* i18n：初始化时同步 <html lang>，并提供双语品牌名 */
import { t } from '@/i18n'

/* 同步文档标题（i18n 品牌名优先；版本品牌兜底——挂载后 App 会再跟随版本刷新） */
document.title = t('common.brand') || getVersionBrand(DEFAULT_VERSION, 'zh')

createApp(App).mount('#app')
