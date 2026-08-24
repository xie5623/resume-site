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

/* 编辑器：v-element-style 元素级样式指令（需求 2：fontScale/emphasize/size 落地） */
import { vElementStyle } from '@/directives/elementStyle'

/* 编辑器：复制/粘贴动作编排 + Ctrl+C / Ctrl+V 快捷键（需求 6，加载即绑定） */
import '@/composables/useEditorActions'

/* ---------- Edge 兼容层 ---------- */

/* 检测 Edge → <html data-browser="edge">（CSS 据此对 Edge 做针对性
   合成优化，见 glass.css 的导航去毛玻璃规则）。 */
if (typeof window !== 'undefined') {
  const isEdge =
    /Edg\//i.test(navigator.userAgent) ||
    (navigator.userAgentData?.brands || []).some((b) => /Edg/i.test(b.brand || ''))
  if (isEdge) document.documentElement.setAttribute('data-browser', 'edge')
}

/* 同步文档标题（i18n 品牌名优先；版本品牌兜底——挂载后 App 会再跟随版本刷新） */
document.title = t('common.brand') || getVersionBrand(DEFAULT_VERSION, 'zh')

const app = createApp(App)
app.directive('editable', vEditable)
app.directive('element-style', vElementStyle)
app.mount('#app')
