/* ============================================================
   themes/useTheme.js — 主题层全局状态 + 应用（生成器内核）
   ------------------------------------------------------------
   作用：切换主题 = 把主题的 cssVars 写到 <html>:root 的内联 style，
   覆盖 tokens.css 默认值；可切换、可恢复、实时生效。

   API：
     useTheme() → { themeId, setTheme, currentTheme, applyTheme, getThemes }
       - themeId (ref)         → 当前主题 id
       - setTheme(id)          → 切换 + localStorage 持久化（resume-site.theme）
       - currentTheme (computed) → 当前主题对象
       - applyTheme(id)        → 低层：把 cssVars 写到 :root（可外部直接调）
    特性：
     - 单例状态；模块加载即应用当前主题（main.js import 时同步生效）
     - 切换时先移除上一主题写入的内联变量，再写入新主题 → 无残留、可恢复
     - 与模板/内容/语言状态相互独立，可任意组合
   ============================================================ */

import { ref, computed } from 'vue'
import { THEMES, DEFAULT_THEME, getTheme, getThemes } from './index'

export const STORAGE_KEY = 'resume-site.theme'

const store = typeof localStorage !== 'undefined' ? localStorage : null

/* ---------- 初始化主题：localStorage → 默认主题 ---------- */
function detectInitialTheme() {
  const saved = store?.getItem(STORAGE_KEY)
  if (saved && THEMES[saved]) return saved
  return DEFAULT_THEME
}

/** 当前主题 id（响应式） */
export const themeId = ref(detectInitialTheme())

/* 记住本次主题写入了哪些内联变量，切换时先清掉（恢复 tokens 基底） */
let lastAppliedKeys = []

/** 注入主题专属 CSS（extraCss）的 <style> 元素（全局单例，懒创建） */
const EXTRA_STYLE_ID = 'theme-extra-css'
function syncExtraCss(css) {
  if (typeof document === 'undefined') return
  let el = document.getElementById(EXTRA_STYLE_ID)
  if (!el) {
    el = document.createElement('style')
    el.id = EXTRA_STYLE_ID
    el.setAttribute('data-theme-extra', '')
    document.head.appendChild(el)
  }
  el.textContent = css || ''
}

/**
 * applyTheme(id) — 把主题 cssVars 写入 :root 内联 style。
 * 先移除上次写入的变量（含 color-scheme），再写入新主题，
 * 并把主题的 extraCss 片段同步进全局 <style>（切走即清空）。
 */
export function applyTheme(id) {
  const theme = getTheme(id)
  const root = typeof document !== 'undefined' ? document.documentElement : null
  if (!root) return theme

  // 1. 清理上一主题写入的内联变量
  if (lastAppliedKeys.length) {
    for (const k of lastAppliedKeys) root.style.removeProperty(k)
    lastAppliedKeys = []
  }
  // 2. 写入新主题
  for (const [k, v] of Object.entries(theme.cssVars)) {
    root.style.setProperty(k, v)
    lastAppliedKeys.push(k)
  }
  if (theme.colorScheme) {
    root.style.setProperty('color-scheme', theme.colorScheme)
    lastAppliedKeys.push('color-scheme')
  }
  // 3. 同步主题专属 CSS 片段（扫描线/衬线标题等）
  syncExtraCss(theme.extraCss)
  return theme
}

/* ---------- 切换 ----------
   平滑过渡：切前给 <html> 加 .theme-switching（淡出 160ms）
   → 换变量/extraCss（隐藏态瞬间生效）→ 移除类淡入（300ms）。
   CSS 见 styles/base.css 的 #app 过渡。 */
export function setTheme(next) {
  if (!THEMES[next] || themeId.value === next) return

  const apply = () => {
    themeId.value = next
    store?.setItem(STORAGE_KEY, next)
    applyTheme(next)
  }

  const root = typeof document !== 'undefined' ? document.documentElement : null
  if (!root) {
    apply()
    return
  }

  root.classList.add('theme-switching')
  window.setTimeout(() => {
    apply()
    root.classList.remove('theme-switching')
  }, 160)
}

/** 当前主题对象（computed） */
export const currentTheme = computed(() => getTheme(themeId.value))

/* ---------- composable ---------- */
export function useTheme() {
  return { themeId, setTheme, currentTheme, applyTheme, getThemes }
}

/* 模块加载即应用当前主题（main.js 在挂载前 import 本文件时同步生效） */
if (typeof document !== 'undefined') applyTheme(themeId.value)

export default useTheme
