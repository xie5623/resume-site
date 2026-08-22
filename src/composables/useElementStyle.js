/* ============================================================
   composables/useElementStyle.js — 元素级配置 store（需求 2）
   ------------------------------------------------------------
   作用：在「模块级配置」（useTemplates.updateModule 的 fontScale /
   animation / textAnim / emphasize）之上叠加【元素级样式补丁】：
   每个选中元素（可编辑元素）可有独立的 fontScale / animation /
   textAnim / emphasize / size，读取时元素级优先 → 模块级 → 默认。

   状态形状：
     elementStyle = {
       skills: {
         'title':   { fontScale: 1.2, emphasize: true },   // 元素级
         'items.3': { size: 96 }                            // 列表条目级
       },
       hero: { name: { textAnim: 'none' } }
     }
   - 键（elementKey）= 可编辑元素 key（与 useEditableRegistry /
     useLayout / useSelection 一致）；列表条目用下标式键
     `items.<index>`（如 items.0 / items.3），与 DEVICE 维度
     手机内容覆盖的按索引策略一致（重排后可能错位，见 §13 局限）。
   - size 字段两种消费：
       · 通用元素（需求 6「可调整大小」）：{ w, h, unit:'px'|'%' }
       · 气泡图（需求 7「每气泡可调大小」）：number = 直径 px
   - 读取统一走 resolveElementStyle(moduleId, key, base)（三层回退）。
   - 持久化：localStorage 'resume-site.element-style'（刷新保留）。
   - DEVICE 维度：元素级样式属于【设计层】，desktop / mobile 共享
     同一份（两端通用），不在 device 维度拆分（见 ARCHITECTURE §13）。

   API（useElementStyle()）：
     elementStyle                      // ref<object> 原始状态（诊断用）
     getElementStyle(moduleId, elementKey)    // 读单条补丁（无则 null）
     getModuleStyles(moduleId)                // 某模块全部元素补丁
     setElementStyle(moduleId, elementKey, patch) // 合并写入 + 持久化
     clearElementStyle(moduleId, elementKey)       // 移除单条
     clearModuleStyles(moduleId)                   // 清某模块全部
     resetElementStyles()                          // 全部清空 + 清持久化
     shiftItemStyles(moduleId, listKey, fromIndex, delta)
        // 列表插入/删除后平移下标式样式（items.3 → items.4）
     resolveElementStyle(moduleId, elementKey, base)
        // 有效样式：元素级覆盖 base（模块配置），未覆盖取 base/默认
     replaceElementStyleState(next)      // 状态整体替换（历史 undo/redo）
   ============================================================ */

import { ref } from 'vue'

export const STORAGE_KEY = 'resume-site.element-style'

const store = typeof localStorage !== 'undefined' ? localStorage : null

/* ---------- 工具 ---------- */
function cloneDeep(v) {
  if (Array.isArray(v)) return v.map(cloneDeep)
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, cloneDeep(val)]))
  }
  return v
}

/* 元素级字段默认值（resolveElementStyle 的兜底，T2/T3 可扩展） */
export const ELEMENT_STYLE_DEFAULTS = {
  fontScale: 1,
  animation: null,   // null = 跟随模块级
  textAnim: null,    // null = 跟随模块级
  emphasize: false,
  size: null         // 通用 {w,h,unit} | 气泡 number(px 直径) | null=自动
}

/* ---------- 初始化：默认空 + localStorage 覆盖 ---------- */
function loadInitial() {
  const base = {}
  const saved = store?.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed === 'object') {
        for (const [moduleId, patches] of Object.entries(parsed)) {
          if (patches && typeof patches === 'object') base[moduleId] = cloneDeep(patches)
        }
      }
    } catch (e) {
      console.warn('[useElementStyle] 元素级样式持久化数据损坏，已回退默认：', e)
    }
  }
  return base
}

/** 全局元素级样式状态（ref → 深层响应式） */
export const elementStyle = ref(loadInitial())

function persist() {
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify(elementStyle.value))
  } catch (e) {
    console.warn('[useElementStyle] 持久化失败：', e)
  }
}

function ensureModule(moduleId) {
  if (!elementStyle.value || typeof elementStyle.value !== 'object') elementStyle.value = {}
  if (!elementStyle.value[moduleId] || typeof elementStyle.value[moduleId] !== 'object') {
    elementStyle.value[moduleId] = {}
  }
}

/* ---------- 读 ---------- */
/** 读单条元素补丁（响应式；无则 null）。返回值是原始补丁（未合并默认）。 */
export function getElementStyle(moduleId, elementKey) {
  if (!moduleId || !elementKey) return null
  return elementStyle.value?.[moduleId]?.[elementKey] ?? null
}

/** 某模块全部元素补丁（模块配置面板用；无则 {}） */
export function getModuleStyles(moduleId) {
  return elementStyle.value?.[moduleId] ?? {}
}

/* ---------- 写 ---------- */
/**
 * setElementStyle(moduleId, elementKey, patch) — 合并写入元素级补丁。
 * patch 支持字段：fontScale / animation / textAnim / emphasize / size。
 * 传 { fontScale: 1 } 即「还原到模块级」；要彻底移除用 clearElementStyle。
 */
export function setElementStyle(moduleId, elementKey, patch) {
  if (!moduleId || !elementKey || !patch || typeof patch !== 'object') return null
  ensureModule(moduleId)
  elementStyle.value[moduleId][elementKey] = {
    ...(elementStyle.value[moduleId][elementKey] || {}),
    ...cloneDeep(patch)
  }
  persist()
  return elementStyle.value[moduleId][elementKey]
}

/** 移除单条元素补丁（该元素回到「跟随模块级」） */
export function clearElementStyle(moduleId, elementKey) {
  const mod = elementStyle.value?.[moduleId]
  if (mod && elementKey in mod) {
    delete mod[elementKey]
    if (!Object.keys(mod).length) delete elementStyle.value[moduleId]
    persist()
  }
}

/** 清某模块的全部元素补丁 */
export function clearModuleStyles(moduleId) {
  if (elementStyle.value?.[moduleId]) {
    delete elementStyle.value[moduleId]
    persist()
  }
}

/** 全部清空并清持久化（控制台「恢复默认」用） */
export function resetElementStyles() {
  elementStyle.value = {}
  store?.removeItem(STORAGE_KEY)
}

/* ---------- 列表下标平移（复制粘贴 / 增删条目用） ---------- */
/**
 * shiftItemStyles(moduleId, listKey, fromIndex, delta) — 列表插入/删除后
 * 平移下标式元素样式：所有 `${listKey}.<n>`（n >= fromIndex）的键改为
 * n + delta（插入 delta=+1 后移；删除 delta=-1 前移）。
 * 例：粘贴到 items 下标 2 → fromIndex=2, delta=+1 → items.3 变 items.4。
 */
export function shiftItemStyles(moduleId, listKey, fromIndex, delta) {
  const mod = elementStyle.value?.[moduleId]
  if (!mod) return
  const prefix = `${listKey}.`
  const entries = Object.entries(mod)
    .filter(([k]) => k.startsWith(prefix) && /^\d+$/.test(k.slice(prefix.length)))
    .map(([k, v]) => ({ idx: Number(k.slice(prefix.length)), v }))
    .filter(({ idx }) => idx >= fromIndex)
    .sort((a, b) => (delta > 0 ? b.idx - a.idx : a.idx - b.idx)) // 正delta从大到小避免覆盖

  for (const { idx, v } of entries) {
    delete mod[`${prefix}${idx}`]
    mod[`${prefix}${idx + delta}`] = v
  }
  if (Object.keys(entries).length) persist()
}

/* ---------- 有效样式（三层回退：元素级 → 模块级(base) → 默认） ---------- */
/**
 * resolveElementStyle(moduleId, elementKey, base) — 计算元素最终生效样式。
 * base = 模块级配置对象（如 useTemplates 的模块 cfg：{ fontScale, animation,
 * textAnim, emphasize }），可为 null。返回：
 *   { fontScale, animation, textAnim, emphasize, size }
 * 元素级有值覆盖 base；base 有值；否则 ELEMENT_STYLE_DEFAULTS。
 */
export function resolveElementStyle(moduleId, elementKey, base = {}) {
  const patch = getElementStyle(moduleId, elementKey) || {}
  const b = base || {}
  return {
    fontScale: typeof patch.fontScale === 'number'
      ? patch.fontScale
      : (typeof b.fontScale === 'number' ? b.fontScale : ELEMENT_STYLE_DEFAULTS.fontScale),
    animation: patch.animation ?? b.animation ?? ELEMENT_STYLE_DEFAULTS.animation,
    textAnim: patch.textAnim ?? b.textAnim ?? ELEMENT_STYLE_DEFAULTS.textAnim,
    emphasize: typeof patch.emphasize === 'boolean'
      ? patch.emphasize
      : (typeof b.emphasize === 'boolean' ? b.emphasize : ELEMENT_STYLE_DEFAULTS.emphasize),
    size: patch.size !== undefined ? patch.size
      : (b.size !== undefined ? b.size : ELEMENT_STYLE_DEFAULTS.size)
  }
}

/* ---------- 状态整体替换（撤销/重做历史用） ---------- */
export function replaceElementStyleState(next) {
  elementStyle.value = cloneDeep(next ?? {})
  persist()
}

/* ---------- composable ---------- */
export function useElementStyle() {
  return {
    elementStyle,
    getElementStyle,
    getModuleStyles,
    setElementStyle,
    clearElementStyle,
    clearModuleStyles,
    resetElementStyles,
    shiftItemStyles,
    resolveElementStyle,
    replaceElementStyleState,
    STORAGE_KEY,
    ELEMENT_STYLE_DEFAULTS
  }
}

export default useElementStyle
