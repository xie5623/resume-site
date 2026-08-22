/* ============================================================
   i18n/index.js — 极简轻量 i18n（手写，无 vue-i18n 依赖）
   ------------------------------------------------------------
   API：
     - useI18n()         → { lang, t, setLang, toggleLang }（组件内调用）
     - t(key)            → 按点路径取文案，如 t('hero.name') / t('skills.title')
                           取不到时回退 zh，再取不到返回 key 本身
     - setLang('zh'|'en')→ 切换语言并持久化到 localStorage
     - toggleLang()      → 在中/英之间切换
     - lang (ref)        → 当前语言 'zh' | 'en'
   特性：
     - 单例 reactive 状态：所有组件共享，任意处 setLang 全站联动
     - localStorage 持久化（key: resume-site.lang）
     - 初始化顺序：localStorage → 浏览器语言 → CONFIG.lang
     - 自动同步 <html lang> 属性（无障碍）
   ============================================================ */

import { ref } from 'vue'
import { CONFIG, DEFAULT_VERSION } from '@/config/site.config'
import { version } from '@/composables/useVersion'
import { MESSAGES } from './messages'

export const STORAGE_KEY = 'resume-site.lang'
export const SUPPORTED_LANGS = ['zh', 'en']

const store = typeof localStorage !== 'undefined' ? localStorage : null

/* ---------- 初始化语言：localStorage → 浏览器语言 → 配置默认 ---------- */
function detectInitialLang() {
  const saved = store?.getItem(STORAGE_KEY)
  if (saved && SUPPORTED_LANGS.includes(saved)) return saved
  if (typeof navigator !== 'undefined') {
    const nav = (navigator.language || navigator.languages?.[0] || '').toLowerCase()
    if (nav.startsWith('zh')) return 'zh'
    if (nav.startsWith('en')) return 'en'
  }
  return SUPPORTED_LANGS.includes(CONFIG.lang) ? CONFIG.lang : 'zh'
}

/** 当前语言（响应式，模板里可直接用） */
export const lang = ref(detectInitialLang())

function applyLangToDocument() {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang.value === 'en' ? 'en' : 'zh-CN'
}
applyLangToDocument()

/* ---------- 切换 ---------- */
export function setLang(next) {
  if (!SUPPORTED_LANGS.includes(next) || lang.value === next) return
  lang.value = next
  store?.setItem(STORAGE_KEY, next)
  applyLangToDocument()
}

export function toggleLang() {
  setLang(lang.value === 'zh' ? 'en' : 'zh')
}

/* ---------- 取文案（支持嵌套对象点路径） ---------- */
function resolvePath(obj, path) {
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj)
}

/**
 * t(key) — 翻译函数。
 * 按「当前版本 → 当前语言」取文案；当前版本取不到时依次回退：
 *   当前版本 zh → 默认版本(资深版)当前语言 → 默认版本 zh → key 本身。
 * 值可以是字符串或数组（列表占位直接返回数组，模板里 v-for 即可）。
 * 语言/版本切换后自动响应（内部读取 lang.value 与 version.value，
 * 在渲染上下文中被追踪）。
 */
export function t(key) {
  const v = MESSAGES[version.value] ? version.value : DEFAULT_VERSION
  const ns = MESSAGES[v]?.[lang.value] ?? MESSAGES[v]?.zh
  const val = resolvePath(ns, key)
  if (val != null) return val
  const seniorNs = MESSAGES[DEFAULT_VERSION]?.[lang.value] ?? MESSAGES[DEFAULT_VERSION]?.zh
  const seniorVal = resolvePath(seniorNs, key)
  if (seniorVal != null) return seniorVal
  const zhVal = resolvePath(MESSAGES[DEFAULT_VERSION]?.zh, key)
  return zhVal ?? key
}

/* ---------- composable：组件内使用 ---------- */
export function useI18n() {
  return { lang, t, setLang, toggleLang }
}

export default useI18n
