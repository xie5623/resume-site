import { createApp } from 'vue'
import App from './App.vue'
import { DEFAULT_VERSION, getVersionBrand } from '@/config/site.config'
import { setupAnimations } from '@/animations'

/* 全局样式：顺序固定 tokens → base → glass */
import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/glass.css'

/* 主题层：应用持久化的当前主题（写入 <html>:root 内联 cssVars，幂等可恢复） */
import '@/themes/useTheme'

/* 动画系统初始化：注册 GSAP 插件 + ScrollTrigger（幂等） */
setupAnimations()

/* i18n：初始化时同步 <html lang>，并提供双语品牌名 */
import { t } from '@/i18n'

/* 编辑器：编辑态 body class（打开控制台即进入编辑态） */
import '@/composables/useEditingMode'

/* 编辑器：v-editable 可编辑元素指令（标记/选中/拖拽摆放） */
import { vEditable } from '@/directives/editable'

/* 同步文档标题（i18n 品牌名优先；版本品牌兜底——挂载后 App 会再跟随版本刷新） */
document.title = t('common.brand') || getVersionBrand(DEFAULT_VERSION, 'zh')

const app = createApp(App)
app.directive('editable', vEditable)
app.mount('#app')
