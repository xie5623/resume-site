/* ============================================================
   useVersion.js — 全局版本状态（轻量，仿 i18n/index.js 风格）
   ------------------------------------------------------------
   API：
     - useVersion()            → { version, setVersion, currentVersionConfig }
     - version (ref)           → 当前版本 id（'senior' | 'graduate'）
     - setVersion(id)          → 切换版本并持久化到 localStorage
     - currentVersionConfig    → 当前版本的完整配置对象（computed）
   特性：
     - 单例 reactive 状态：所有组件共享，任意处 setVersion 全站联动
     - localStorage 持久化（key: resume-site.version），默认 senior
     - 版本与语言相互独立：切版本不动语言，切语言不动版本
   ============================================================ */

import { ref, computed } from 'vue'
import { VERSIONS, DEFAULT_VERSION, getVersion } from '@/config/site.config'

export const STORAGE_KEY = 'resume-site.version'

const store = typeof localStorage !== 'undefined' ? localStorage : null

/* ---------- 初始化版本：localStorage → 默认版本 ---------- */
function detectInitialVersion() {
  const saved = store?.getItem(STORAGE_KEY)
  if (saved && VERSIONS[saved]) return saved
  return DEFAULT_VERSION
}

/** 当前版本 id（响应式，模板里可直接用） */
export const version = ref(detectInitialVersion())

/** 当前版本的完整配置对象（含 brand / lang / stickyNav / modules） */
export const currentVersionConfig = computed(() => getVersion(version.value))

/* ---------- 切换 ---------- */
export function setVersion(next) {
  if (!VERSIONS[next] || version.value === next) return
  version.value = next
  store?.setItem(STORAGE_KEY, next)
}

/* ---------- composable：组件内使用 ---------- */
export function useVersion() {
  return { version, setVersion, currentVersionConfig }
}

export default useVersion
