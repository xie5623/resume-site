/* ============================================================
   composables/useLayout.js — 元素位置 store（拖拽摆放）
   ------------------------------------------------------------
   作用：记录「拖拽摆放」模式下元素的自定义位置，供模块组件叠加
   定位（module-builder 的拖拽 UI + 高亮框消费），并持久化。
   - 单例 reactive 状态：
       layout = {
         enabled:   { moduleId: boolean },        // 每模块拖拽开关
         positions: { moduleId: { elementKey: { x, y, unit, cw, ch } } }
       }
   - 默认关闭：每个模块的 layoutEnabled 默认 false（模块配置里开开关
     ——console-dev 的模块配置 UI 调 toggleLayout(moduleId, on)）。
   - 自动适配：位置默认按百分比（%）存，表示相对模块容器的偏移 →
     页面/容器 resize 时天然按比例保持；需要固定像素就显式传 unit:'px'
     （并用 fitToContainer / scaleAllPx 做比例缩放）。
   - 持久化 key: resume-site.layout（刷新保留）。
   - 与内容/模板/主题/形态独立，可任意组合。

   API（useLayout()）：
     layout                    // ref<{ enabled, positions }> 原始状态（诊断用）
     isLayoutEnabled(moduleId) // 该模块拖拽摆放是否开启（默认 false）
     toggleLayout(moduleId, on)            // 开关某模块拖拽 + 持久化
     setElementPos(moduleId, elementKey, pos, containerSize?) // 记录位置 + 持久化
       pos: { x, y, unit? }   unit 默认 '%'；传 'px' 用像素
       containerSize?: { width, height }  有值时把像素换算成 %（自动适配）
     getElementPos(moduleId, elementKey)  // 读一条位置（响应式）
     getLayout(moduleId)                  // { enabled, positions }（模块配置面板用）
     removeElementPos(moduleId, elementKey)
     clearModuleLayout(moduleId)          // 清掉某模块的开关+全部位置
     resetLayout()                        // 全部清空 + 清持久化
     toPx(moduleId, elementKey, containerSize)  // % → 像素（自动适配映射）
     fitToContainer(moduleId, elementKey, newCw, newCh) // px 位置按新容器比例缩放
     scaleAllPx(scaleX, scaleY)           // 全局按比例缩放所有 px 位置（页面 resize）
   ============================================================ */

import { ref } from 'vue'

export const STORAGE_KEY = 'resume-site.layout'

const store = typeof localStorage !== 'undefined' ? localStorage : null

/* ---------- 工具 ---------- */
function cloneDeep(v) {
  if (Array.isArray(v)) return v.map(cloneDeep)
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, cloneDeep(val)]))
  }
  return v
}

const DEFAULT_LAYOUT = { enabled: {}, positions: {} }

/* ---------- 初始化：默认 + localStorage 覆盖 ---------- */
function loadInitial() {
  const base = { enabled: {}, positions: {} }
  const saved = store?.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed === 'object') {
        if (parsed.enabled && typeof parsed.enabled === 'object') base.enabled = parsed.enabled
        if (parsed.positions && typeof parsed.positions === 'object') base.positions = parsed.positions
      }
    } catch (e) {
      console.warn('[useLayout] 布局持久化数据损坏，已回退默认：', e)
    }
  }
  return base
}

/** 全局布局状态（ref → 深层响应式） */
export const layout = ref(loadInitial())

function persist() {
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify(layout.value))
  } catch (e) {
    console.warn('[useLayout] 持久化失败：', e)
  }
}

function ensureModule(moduleId) {
  if (!layout.value.enabled || typeof layout.value.enabled !== 'object') layout.value.enabled = {}
  if (!layout.value.positions || typeof layout.value.positions !== 'object') layout.value.positions = {}
  if (!layout.value.positions[moduleId]) layout.value.positions[moduleId] = {}
}

/* ---------- 开关（拖拽摆放默认关，模块配置里开） ---------- */
export function isLayoutEnabled(moduleId) {
  return !!layout.value.enabled?.[moduleId]
}

export function toggleLayout(moduleId, on) {
  if (!layout.value.enabled || typeof layout.value.enabled !== 'object') layout.value.enabled = {}
  layout.value.enabled[moduleId] = !!on
  persist()
}

/* ---------- 位置读写 ---------- */
/**
 * setElementPos(moduleId, elementKey, pos, containerSize?) — 记录元素位置。
 * pos: { x, y, unit? }；unit 默认 '%'（相对模块容器百分比 → 自动适配），
 * 传 'px' 则存固定像素（不做自动适配）。
 * 传入 containerSize 且 pos 未显式给 unit 时，把像素换算成 %：
 *   x% = x / 容器宽 * 100，y% = y / 容器高 * 100（拖拽回调直接传像素即可）。
 */
export function setElementPos(moduleId, elementKey, pos, containerSize) {
  ensureModule(moduleId)
  const { x = 0, y = 0, unit } = pos || {}
  let entry

  if (unit === 'px') {
    entry = {
      x, y, unit: 'px',
      cw: containerSize?.width ?? null, ch: containerSize?.height ?? null
    }
  } else if (containerSize && containerSize.width && containerSize.height) {
    // 像素 → 百分比（自动适配摆放位置：相对容器，resize 按比例保持）
    entry = {
      x: (x / containerSize.width) * 100,
      y: (y / containerSize.height) * 100,
      unit: '%',
      cw: containerSize.width, ch: containerSize.height
    }
  } else {
    // 直接按百分比存（调用方已给 %）
    entry = { x, y, unit: '%', cw: null, ch: null }
  }

  layout.value.positions[moduleId][elementKey] = entry
  persist()
  return entry
}

/** 读一条位置（响应式；无则 null） */
export function getElementPos(moduleId, elementKey) {
  return layout.value.positions?.[moduleId]?.[elementKey] ?? null
}

/** 某模块的布局（模块配置面板用） */
export function getLayout(moduleId) {
  return {
    enabled: isLayoutEnabled(moduleId),
    positions: layout.value.positions?.[moduleId] ?? {}
  }
}

export function removeElementPos(moduleId, elementKey) {
  const mod = layout.value.positions?.[moduleId]
  if (mod && elementKey in mod) {
    delete mod[elementKey]
    if (!Object.keys(mod).length) delete layout.value.positions[moduleId]
    persist()
  }
}

/** 清掉某模块的开关 + 全部位置 */
export function clearModuleLayout(moduleId) {
  delete layout.value.enabled?.[moduleId]
  delete layout.value.positions?.[moduleId]
  persist()
}

/** 全部清空并清持久化 */
export function resetLayout() {
  layout.value = { enabled: {}, positions: {} }
  store?.removeItem(STORAGE_KEY)
}

/* ---------- 自动适配（比例缩放） ---------- */
/**
 * toPx(moduleId, elementKey, containerSize) — % → 像素。
 * 把存储的相对位置映射到当前容器尺寸（拖拽 overlay / 高亮框定位用）。
 * px 存储直接返回原值。
 */
export function toPx(moduleId, elementKey, containerSize) {
  const entry = getElementPos(moduleId, elementKey)
  if (!entry) return null
  if (entry.unit === 'px') return { x: entry.x, y: entry.y, unit: 'px' }
  if (!containerSize) return { x: entry.x, y: entry.y, unit: '%' }
  return {
    x: (entry.x / 100) * (containerSize.width || 0),
    y: (entry.y / 100) * (containerSize.height || 0),
    unit: 'px'
  }
}

/**
 * fitToContainer(moduleId, elementKey, newCw, newCh) — 容器尺寸变化时
 * 按记录比例缩放 px 位置，保持相对位置（页面 resize 时调用）。
 * % 存储天然自适应，无需缩放。
 */
export function fitToContainer(moduleId, elementKey, newCw, newCh) {
  const entry = getElementPos(moduleId, elementKey)
  if (!entry || entry.unit === '%') return entry
  if (!entry.cw || !entry.ch || !newCw || !newCh) return entry
  const ratioW = newCw / entry.cw
  const ratioH = newCh / entry.ch
  const next = {
    ...entry,
    x: entry.x * ratioW,
    y: entry.y * ratioH,
    cw: newCw, ch: newCh
  }
  layout.value.positions[moduleId][elementKey] = next
  return next
}

/** 全局按比例缩放所有 px 位置（页面 resize 统一入口） */
export function scaleAllPx(scaleX, scaleY) {
  const positions = layout.value.positions
  if (!positions) return
  for (const moduleId of Object.keys(positions)) {
    for (const key of Object.keys(positions[moduleId])) {
      const e = positions[moduleId][key]
      if (e.unit === 'px' && e.cw && e.ch) {
        e.x *= scaleX
        e.y *= scaleY
      }
    }
  }
  persist()
}

/* ---------- 状态整体替换（撤销/重做历史用） ---------- */
export function replaceLayoutState(next) {
  layout.value = cloneDeep(next ?? { enabled: {}, positions: {} })
  persist()
}

/* ---------- composable ---------- */
export function useLayout() {
  return {
    layout,
    isLayoutEnabled,
    toggleLayout,
    setElementPos,
    getElementPos,
    getLayout,
    removeElementPos,
    clearModuleLayout,
    resetLayout,
    toPx,
    fitToContainer,
    scaleAllPx,
    STORAGE_KEY
  }
}

export default useLayout
