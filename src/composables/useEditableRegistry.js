/* ============================================================
   composables/useEditableRegistry.js — 可编辑元素注册表
   ------------------------------------------------------------
   作用：全局注册表，描述每个模块「有哪些可编辑元素」。
   由模块组件挂载时注册（module-builder 的 T3 会把真实模块组件
   改成在 onMounted 里 registerEditable），供：
     - 左侧模块配置面板（console-dev）：列出某模块可编辑元素
     - inline edit（点文字直接编辑）：知道元素 key → 内容路径
     - 拖拽摆放：知道哪些元素可被摆放（与 useLayout 配合）
   - 单例 reactive：registry = { moduleId: EditableItem[] }
   - 元素项形状：
       {
         key:   'name' | 'roles' | 'items' ...  // 内容路径后缀（hero.name）
         label: { zh, en }                        // 面板/浮层显示名
         type:  'text' | 'number' | 'boolean' | 'list' | 'object'  // 编辑控件类型
       }
   - 不持久化：结构随模块组件生命周期注册/注销（刷新重建）。

   API（useEditableRegistry()）：
     registerEditable(moduleId, items)        // 整体注册（覆盖）
     registerEditableItem(moduleId, item)     // 追加单条
     unregisterEditable(moduleId)             // 注销（组件卸载时）
     getEditable(moduleId)                    // 某模块可编辑元素（响应式数组）
     getAllEditable()                         // 全量 { moduleId: [...] }
     hasEditable(moduleId)                    // 是否已注册
     countEditable(moduleId)                  // 元素个数
   ============================================================ */

import { ref, computed } from 'vue'

function cloneDeep(v) {
  if (Array.isArray(v)) return v.map(cloneDeep)
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, cloneDeep(val)]))
  }
  return v
}

/** 全局可编辑注册表：moduleId → EditableItem[]（ref → 深层响应式） */
export const editableRegistry = ref({})

/* ---------- 注册 / 注销 ---------- */
/** 整体注册（覆盖旧值）。items: [{ key, label:{zh,en}, type }] */
export function registerEditable(moduleId, items) {
  editableRegistry.value[moduleId] = cloneDeep(Array.isArray(items) ? items : [])
}

/** 追加单条可编辑元素（增量注册用） */
export function registerEditableItem(moduleId, item) {
  if (!Array.isArray(editableRegistry.value[moduleId])) editableRegistry.value[moduleId] = []
  editableRegistry.value[moduleId].push(cloneDeep(item))
}

/** 注销某模块的可编辑元素（模块组件卸载时调用） */
export function unregisterEditable(moduleId) {
  delete editableRegistry.value[moduleId]
}

/* ---------- 读 ---------- */
/** 某模块的可编辑元素列表（响应式；未注册返回 []） */
export function getEditable(moduleId) {
  return editableRegistry.value[moduleId] ?? []
}

/** 全量注册表（左侧面板/调试用） */
export function getAllEditable() {
  return editableRegistry.value
}

export function hasEditable(moduleId) {
  return !!editableRegistry.value[moduleId]?.length
}

export function countEditable(moduleId) {
  return editableRegistry.value[moduleId]?.length ?? 0
}

/** 已注册模块 id 列表 */
export const registeredModuleIds = computed(() => Object.keys(editableRegistry.value))

/* ---------- composable ---------- */
export function useEditableRegistry() {
  return {
    registry: editableRegistry,
    registerEditable,
    registerEditableItem,
    unregisterEditable,
    getEditable,
    getAllEditable,
    hasEditable,
    countEditable,
    registeredModuleIds
  }
}

export default useEditableRegistry
