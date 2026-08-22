/* ============================================================
   composables/useClipboard.js — 元素复制 / 粘贴 / 克隆 store（需求 6）
   ------------------------------------------------------------
   作用：全局剪贴板（会话态，不持久化），供「元素复制 / 粘贴」：
   - copyElement(moduleId, key, { itemIndex })：捕获元素数据 + 元素级
     样式，存入全局剪贴板。
       · 标量元素（title / sub / name…）：复制其文本值。
       · 列表条目（skills.items[i]）：复制单个条目数据。
   - copyModule(moduleId)：捕获模块类型（namespace），供「复制整个模块 →
     粘贴为同类型新实例」（kind='module'，pasteAsNewModule 消费）。
   - pasteElement(moduleId, { targetIndex })：把剪贴板粘到目标模块。
       · 列表条目 → 数组插入副本（拷贝数据 + 样式，下标后移）。
       · 标量 → 覆盖目标模块同 key 的文本。
   - pasteAsNewModule()：用 useTemplates.createModuleInstance 生成
     同类型新实例（副本实例共享内容命名空间，符合现有克隆模块机制）。

   剪贴板形状：
     clipboard = {
       kind: 'element',
       moduleId,       // 源实例 id
       namespace,      // 内容命名空间（副本实例用 type，见 ModuleEditorTab）
       key,            // 'items' | 'title' | …
       itemIndex,      // null=标量；number=列表条目下标
       data,           // 数据深拷贝
       style,          // 元素级样式补丁深拷贝（getElementStyle）| null
       copiedAt
     }

   协作约定：
   - 内容写 useContent.setContent（持久化 + 实时预览）；
   - 样式写 useElementStyle.setElementStyle / shiftItemStyles；
   - 与 useHistory 协作：粘贴走 historyPasteElement（一个可撤销单元，
     内容 + 元素样式 + 模板编排都被快照覆盖，undo 一步回粘贴前）。

   API（useClipboard()）：
     copyElement(moduleId, key, { itemIndex }?) → boolean
     copyModule(moduleId)                 → boolean
     pasteElement(moduleId, { targetIndex }?) → boolean
     pasteAsNewModule() → 新模块 cfg | null（已 addModule）
     getClipboard() → 当前剪贴板对象 | null
     hasClipboard   → computed<boolean>
     clearClipboard()
   ============================================================ */

import { ref, computed } from 'vue'
import { version } from '@/composables/useVersion'
import { lang } from '@/i18n'
import { getContent, setContent } from '@/content/useContent'
import { getTemplateDeviceModules, addModule, createModuleInstance } from '@/composables/useTemplates'
import { getElementStyle, setElementStyle, shiftItemStyles } from '@/composables/useElementStyle'

function cloneDeep(v) {
  if (Array.isArray(v)) return v.map(cloneDeep)
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, cloneDeep(val)]))
  }
  return v
}

/** 全局剪贴板（会话态，不持久化） */
export const clipboard = ref(null)

export const hasClipboard = computed(() => !!clipboard.value)

/** 内容命名空间：副本实例（skills-2）用基础类型（skills），与 ModuleEditorTab 一致 */
export function namespaceOf(moduleId) {
  const list = getTemplateDeviceModules(version.value)
  const m = list.find((x) => x.id === moduleId)
  return m?.type ?? m?.id ?? moduleId
}

/**
 * copyElement(moduleId, key, { itemIndex } = {}) — 复制元素到剪贴板。
 * - 标量（itemIndex 缺省）：key 为内容路径后缀（如 'title'），复制文本。
 * - 列表条目（itemIndex 给定）：key 为列表键（如 'items'），复制
 *   `items[itemIndex]` 单条数据 + 元素级样式（键 `items.<itemIndex>`）。
 * @returns {boolean} 是否复制成功（无数据返回 false）
 */
export function copyElement(moduleId, key, { itemIndex = null } = {}) {
  if (!moduleId || !key) return false
  const ns = namespaceOf(moduleId)
  const itemKey = itemIndex != null ? `${key}.${itemIndex}` : key

  const data = itemIndex != null
    ? getContent(version.value, lang.value, `${ns}.${key}.${itemIndex}`)
    : getContent(version.value, lang.value, `${ns}.${key}`)
  if (data == null) return false

  const style = getElementStyle(moduleId, itemKey)
  clipboard.value = {
    kind: 'element',
    moduleId,
    namespace: ns,
    key,
    itemIndex: itemIndex != null ? Number(itemIndex) : null,
    data: cloneDeep(data),
    style: style ? cloneDeep(style) : null,
    copiedAt: Date.now()
  }
  return true
}

/**
 * copyModule(moduleId) — 复制整个模块（kind='module'）。
 * 只捕获模块类型（namespace），不拷贝内容——粘贴时
 * pasteAsNewModule() 用 createModuleInstance 生成同类型新实例
 * （skills-2），与现有「克隆模块」机制一致（副本共享内容命名空间）。
 * @returns {boolean} 是否复制成功
 */
export function copyModule(moduleId) {
  if (!moduleId) return false
  const ns = namespaceOf(moduleId)
  clipboard.value = {
    kind: 'module',
    moduleId,
    namespace: ns,
    key: null,
    itemIndex: null,
    data: { type: ns },
    style: null,
    copiedAt: Date.now()
  }
  return true
}

/**
 * pasteElement(moduleId, { targetIndex } = {}) — 粘贴到目标模块。
 * - 剪贴板为列表条目：把副本插入目标模块列表 targetIndex（缺省追加），
 *   下标式元素样式整体后移 1，再把源样式复制到新条目。
 * - 剪贴板为标量：覆盖目标模块同 key 的文本（样式一并复制）。
 * @returns {boolean} 是否粘贴成功
 */
export function pasteElement(moduleId, { targetIndex } = {}) {
  const cb = clipboard.value
  if (!cb || !moduleId) return false
  const ns = namespaceOf(moduleId)

  if (cb.itemIndex != null) {
    const listKey = cb.key || 'items'
    const items = getContent(version.value, lang.value, `${ns}.${listKey}`)
    if (!Array.isArray(items)) return false

    const idx = (Number.isInteger(targetIndex) && targetIndex >= 0 && targetIndex <= items.length)
      ? targetIndex
      : items.length

    const next = cloneDeep(items)
    next.splice(idx, 0, cloneDeep(cb.data))
    setContent(version.value, lang.value, `${ns}.${listKey}`, next)

    /* 样式：目标模块下标式样式从 idx 起后移 1，再复制源样式到新位 */
    shiftItemStyles(moduleId, listKey, idx, +1)
    if (cb.style) setElementStyle(moduleId, `${listKey}.${idx}`, cb.style)
    return true
  }

  /* 标量：覆盖目标模块同 key */
  const value = typeof cb.data === 'string' ? cb.data : cloneDeep(cb.data)
  setContent(version.value, lang.value, `${ns}.${cb.key}`, value)
  if (cb.style) setElementStyle(moduleId, cb.key, cb.style)
  return true
}

/**
 * pasteAsNewModule() — 用 useTemplates.createModuleInstance 生成
 * 同类型新实例（如 skills-2）并加入当前模板（副本共享内容命名空间，
 * 沿用现有克隆模块机制）。样式按新实例 id 另行配置。
 * @returns {object|null} 新模块 cfg（已 addModule）；剪贴板为空返回 null
 */
export function pasteAsNewModule() {
  const cb = clipboard.value
  if (!cb) return null
  const cfg = createModuleInstance(version.value, cb.namespace)
  addModule(version.value, cfg)
  return cfg
}

/** 当前剪贴板对象（T3 剪贴板状态 UI 用） */
export function getClipboard() {
  return clipboard.value
}

/** 清空剪贴板 */
export function clearClipboard() {
  clipboard.value = null
}

/* ---------- composable ---------- */
export function useClipboard() {
  return {
    clipboard,
    copyElement,
    copyModule,
    pasteElement,
    pasteAsNewModule,
    getClipboard,
    hasClipboard,
    clearClipboard
  }
}

export default useClipboard
