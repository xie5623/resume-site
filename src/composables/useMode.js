/* ============================================================
   useMode.js — 形态全局状态：滚动长页 ⇄ 翻页演示
   ------------------------------------------------------------
   两种形态（双形态切换，团队目标第 4 项）：
     - 'scroll' 滚动长页（默认，保持现状）：
       标准简历流式长页，滚动入场动画 + 锚点导航。
     - 'deck'   翻页演示（PPT 风格）：
       每模块一屏（100vh），整屏切换；键盘/滚轮/触摸/边缘按钮/
       导航点/导航锚点均可翻页；禁用滚动入场动画，模块直接显示、
       内部文字动画保留。
   - 单例 reactive 状态：任意处 setMode 全站联动。
   - localStorage 持久化（key: resume-site.mode），默认 'scroll'。
   - 与主题/模板/内容/语言相互独立，可任意组合。

   API：
     useMode() → { mode, setMode, isScroll, isDeck }
       - mode    (ref)        → 'scroll' | 'deck'
       - setMode(next)        → 切换 + 持久化
       - isScroll / isDeck    → computed 布尔（模板里可直接用）
   ============================================================ */

import { ref, computed } from 'vue'

/** 允许的形态 id（形态切换器只渲染这些） */
export const MODE_IDS = ['scroll', 'deck']

/** 默认形态（保持现状：滚动长页） */
export const DEFAULT_MODE = 'scroll'

export const STORAGE_KEY = 'resume-site.mode'

const store = typeof localStorage !== 'undefined' ? localStorage : null

/* ---------- 初始化形态：localStorage → 默认形态 ---------- */
function detectInitialMode() {
  const saved = store?.getItem(STORAGE_KEY)
  if (saved && MODE_IDS.includes(saved)) return saved
  return DEFAULT_MODE
}

/** 当前形态 id（响应式，模板里可直接用） */
export const mode = ref(detectInitialMode())

/** 快捷判断（computed） */
export const isScroll = computed(() => mode.value === 'scroll')
export const isDeck = computed(() => mode.value === 'deck')

/* ---------- 切换 ---------- */
export function setMode(next) {
  if (!MODE_IDS.includes(next) || mode.value === next) return
  mode.value = next
  store?.setItem(STORAGE_KEY, next)
}

/* ---------- composable：组件内使用 ---------- */
export function useMode() {
  return { mode, setMode, isScroll, isDeck }
}

export default useMode
