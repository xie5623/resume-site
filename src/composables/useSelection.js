/* ============================================================
   composables/useSelection.js — 选中状态 store（双向联动基础）
   ------------------------------------------------------------
   作用：全局唯一选中态，供「左侧模块配置面板 ⇄ 页面高亮」双向联动：
   - 点左侧面板 → selectModule(moduleId) → 页面模块高亮/滚动
   - 点页面元素 → selectModule / selectElement → 左侧面板跟随选中
   - 选中元素时把定位信息交给高亮框：getSelectionRect() 或
     selectionEl（由绑定方 setSelectionEl 注入真实 DOM 元素）。

   选中态形状：
     selection = {
       kind: 'module' | 'element' | null,  // null = 无选中
       moduleId,                            // 模块 id
       elementId,                           // 元素 id（备用，如 DOM id）
       elementKey                           // 元素 key（可编辑注册表 / 布局位置用）
     }
   - 不持久化：选中是会话态，刷新即清空。
   - 独立 store：不依赖 useConsole（console-dev 通过 watch 本 store
     或同时调用 selectModule 同步左侧面板，见 ARCHITECTURE §11）。

   API（useSelection()）：
     selection               // ref<object> 选中态（响应式）
     selectModule(moduleId)  // 选中某模块（kind='module'，清空元素级）
     selectElement(moduleId, elementKey) // 选中某模块内元素（kind='element'）
     clearSelection()        // 清空选中
     isModuleSelected / isElementSelected / selectedModuleId / selectedElementKey
     setSelectionEl(el)      // 绑定当前选中元素对应的 DOM 元素（高亮框用）
     getSelectionRect()      // 高亮框定位：返回 DOMRect | null
     scrollToSelection()     // 滚动到选中模块（双向联动「点左侧→页面高亮」用）
   ============================================================ */

import { ref, computed } from 'vue'

export const DEFAULT_SELECTION = {
  kind: null,
  moduleId: null,
  elementId: null,
  elementKey: null
}

/** 全局选中态（不持久化） */
export const selection = ref({ ...DEFAULT_SELECTION })

/** 选中元素对应的 DOM 元素（由绑定方注入，高亮框/定位用） */
export const selectionEl = ref(null)

/* ---------- 选中操作 ---------- */
export function selectModule(moduleId) {
  selection.value = {
    kind: 'module',
    moduleId: moduleId ?? null,
    elementId: null,
    elementKey: null
  }
}

export function selectElement(moduleId, elementKey, elementId) {
  selection.value = {
    kind: 'element',
    moduleId: moduleId ?? null,
    elementId: elementId ?? null,
    elementKey: elementKey ?? null
  }
}

export function clearSelection() {
  selection.value = { ...DEFAULT_SELECTION }
  selectionEl.value = null
}

/* ---------- 派生状态（组件模板里可直接用） ---------- */
export const isModuleSelected = computed(() => selection.value.kind === 'module')
export const isElementSelected = computed(() => selection.value.kind === 'element')
export const selectedModuleId = computed(() => selection.value.moduleId)
export const selectedElementKey = computed(() => selection.value.elementKey)
export const selectedElementId = computed(() => selection.value.elementId)

/* ---------- 高亮框 / 定位 ---------- */
/** 绑定当前选中元素对应的 DOM 元素（module-builder 选中元素时调用） */
export function setSelectionEl(el) {
  selectionEl.value = el
}

/**
 * getSelectionRect() — 给高亮框的定位信息。
 * - element 选中：优先取绑定的 selectionEl 的 getBoundingClientRect()
 * - module 选中：按 moduleId 找页面模块容器（ModuleSection <section :id>）
 * 返回 DOMRect | null（找不到元素返回 null，高亮框自行隐藏）。
 */
export function getSelectionRect() {
  if (typeof document === 'undefined') return null

  if (selection.value.kind === 'module' && selection.value.moduleId) {
    const el = document.getElementById(selection.value.moduleId)
    if (el && typeof el.getBoundingClientRect === 'function') return el.getBoundingClientRect()
  }

  const el = selectionEl.value
  if (el && typeof el.getBoundingClientRect === 'function') return el.getBoundingClientRect()

  return null
}

/** 滚动到选中模块（点左侧 → 页面高亮/定位用；翻页形态由 console-dev 转跳屏） */
export function scrollToSelection() {
  if (typeof document === 'undefined' || !selection.value.moduleId) return false
  const el = document.getElementById(selection.value.moduleId)
  if (!el) return false
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return true
}

/* ---------- composable ---------- */
export function useSelection() {
  return {
    selection,
    selectModule,
    selectElement,
    clearSelection,
    selectionEl,
    setSelectionEl,
    getSelectionRect,
    scrollToSelection,
    isModuleSelected,
    isElementSelected,
    selectedModuleId,
    selectedElementKey,
    selectedElementId
  }
}

export default useSelection
