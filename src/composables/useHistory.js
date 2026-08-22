/* ============================================================
   composables/useHistory.js — 撤销/重做内核
   ------------------------------------------------------------
   作用：对「内容(useContent) + 模板编排(useTemplates) + 元素位置
   (useLayout)」三层做统一快照栈，任何编辑器写操作都可撤销/重做
   （含位置，位置即 useLayout 的状态）。
   - 快照 = 三层当前完整状态的一次深拷贝：
       { content, templates, layout }
     （DEVICE 维度已包含：content/templates 的快照含 desktop/mobile 分支，
       撤销/重做天然覆盖设备维度。）
   - 每次可撤销写操作：执行前捕获快照，执行成功后入栈
     （undo 即回到执行前状态）；新操作会清空 redo 栈。
   - 栈深上限 MAX_HISTORY = 50（超出丢弃最旧）。
   - 持久化：不持久化历史本身（会话态）；但 undo/redo 恢复的
     状态会写回各 store 并同步 localStorage（刷新后保持一致）。
   - 全局快捷键：Ctrl+Z = undo，Ctrl+Shift+Z = redo
     （焦点在输入框/可编辑区时让给浏览器原生，不劫持）。
     console-dev 若接管快捷键，可调 unbindHistoryShortcuts() 关闭，
     直接调用 undo()/redo() 即可。

   API（useHistory()）：
     undo() / redo()              → boolean（是否有可操作项）
     canUndo / canRedo            → computed<boolean>（按钮禁用态）
     push(snapshot)               → 手动入栈一个快照（capture() 生成）
     withHistory(fn, label?)      → 历史事务：捕获→执行→入栈
     capture()                    → 生成当前三层快照（深拷贝）
     clearHistory()               → 清空两栈
     // 历史包装的 setter：每次写操作自动进入历史
     historySetContent(tpl, lang, key, value)
     historyUpdateModule(tpl, moduleId, patch)
     historySetElementPos(moduleId, elementKey, pos, containerSize?)
     historyToggleLayout(moduleId, on)
     historyResetContent() / historyResetTemplateModules() / historyResetLayout()
     historySetContentForDevice(tpl, device, lang, key, value) // 显式设备写内容
     historyUpdateForDevice(versionId, device, fn)             // 显式设备改模板编排
     historyResetDeviceContent(versionId)                      // 清空手机内容覆盖
     bindHistoryShortcuts() / unbindHistoryShortcuts()
   ============================================================ */

import { ref, computed } from 'vue'
import { content, setContent, resetContent, resetDeviceContent, replaceContentState } from '@/content/useContent'
import {
  templates,
  updateModule,
  updateForDevice,
  resetTemplateModules,
  replaceTemplatesState
} from '@/composables/useTemplates'
import {
  layout,
  setElementPos,
  toggleLayout,
  resetLayout,
  replaceLayoutState
} from '@/composables/useLayout'

/** 撤销栈深度上限 */
export const MAX_HISTORY = 50

/* ---------- 工具 ---------- */
function cloneDeep(v) {
  if (Array.isArray(v)) return v.map(cloneDeep)
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, cloneDeep(val)]))
  }
  return v
}

/* ---------- 快照 ---------- */
/** 生成当前三层状态快照（深拷贝，入栈/比较用） */
export function capture() {
  return {
    content: cloneDeep(content.value),
    templates: cloneDeep(templates.value),
    layout: cloneDeep(layout.value)
  }
}

/* ---------- 栈 ---------- */
const undoStack = ref([])
const redoStack = ref([])

export const canUndo = computed(() => undoStack.value.length > 0)
export const canRedo = computed(() => redoStack.value.length > 0)

function pushUndo(snapshot) {
  undoStack.value.push(snapshot)
  if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift()
}

/** 恢复一个快照到三个 store（写回 + 持久化） */
function restore(snapshot) {
  if (snapshot?.content != null) replaceContentState(snapshot.content)
  if (snapshot?.templates != null) replaceTemplatesState(snapshot.templates)
  if (snapshot?.layout != null) replaceLayoutState(snapshot.layout)
}

/* ---------- 核心操作 ---------- */
/** 手动入栈一个快照（一般用 withHistory 即可） */
export function push(snapshot) {
  pushUndo(snapshot ?? capture())
  redoStack.value.length = 0
}

/**
 * withHistory(fn, label?) — 历史事务助手。
 * 执行前捕获快照 → 执行 fn → 成功后把该快照入栈（undo 回到执行前）。
 * 任意多步写操作包进来 = 一个可撤销单元；fn 抛错则不入栈。
 */
export function withHistory(fn, label) {
  if (typeof fn !== 'function') return undefined
  const before = capture()
  const result = fn()
  pushUndo(before)
  redoStack.value.length = 0
  return result
}

/** 撤销：恢复到上一快照，当前状态存入 redo 栈 */
export function undo() {
  if (!undoStack.value.length) return false
  const prev = undoStack.value.pop()
  redoStack.value.push(capture())
  restore(prev)
  return true
}

/** 重做：恢复被撤销的状态，当前状态回存 undo 栈 */
export function redo() {
  if (!redoStack.value.length) return false
  const next = redoStack.value.pop()
  pushUndo(capture())
  restore(next)
  return true
}

/** 清空撤销/重做历史（如恢复全部默认后） */
export function clearHistory() {
  undoStack.value.length = 0
  redoStack.value.length = 0
}

/* ---------- 历史包装的 setter（写操作自动进入历史） ---------- */
export function historySetContent(templateId, lang, key, value) {
  withHistory(() => setContent(templateId, lang, key, value))
}

export function historyUpdateModule(templateId, moduleId, patch) {
  withHistory(() => updateModule(templateId, moduleId, patch))
}

export function historySetElementPos(moduleId, elementKey, pos, containerSize) {
  withHistory(() => setElementPos(moduleId, elementKey, pos, containerSize))
}

export function historyToggleLayout(moduleId, on) {
  withHistory(() => toggleLayout(moduleId, on))
}

export function historyResetContent() {
  withHistory(() => resetContent())
}

/**
 * DEVICE 维度包装（device 维度已随快照自动覆盖——快照克隆了
 * content/templates 的 device 分支；这些包装用于显式指定设备的事务）：
 */
export function historySetContentForDevice(templateId, device, lang, key, value) {
  withHistory(() => setContent(templateId, device, lang, key, value))
}

export function historyUpdateForDevice(versionId, device, fn) {
  withHistory(() => updateForDevice(versionId, device, fn))
}

export function historyResetDeviceContent(versionId) {
  withHistory(() => resetDeviceContent(versionId))
}

export function historyResetTemplateModules() {
  withHistory(() => resetTemplateModules())
}

export function historyResetLayout() {
  withHistory(() => resetLayout())
}

/* ---------- 全局快捷键（Ctrl+Z / Ctrl+Shift+Z） ---------- */
let bound = false

function onKeydown(e) {
  if (!(e.ctrlKey || e.metaKey)) return
  if (String(e.key).toLowerCase() !== 'z') return

  // 焦点在输入框/文本域/可编辑区：Ctrl+Z 交给浏览器原生撤销，不劫持
  const t = e.target
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return

  e.preventDefault()
  if (e.shiftKey) redo()
  else undo()
}

/** 绑定全局快捷键（模块加载即绑定一次，幂等） */
export function bindHistoryShortcuts() {
  if (bound || typeof window === 'undefined') return
  bound = true
  window.addEventListener('keydown', onKeydown)
}

/** 解除绑定（console-dev 接管快捷键时调用） */
export function unbindHistoryShortcuts() {
  if (typeof window === 'undefined') return
  window.removeEventListener('keydown', onKeydown)
  bound = false
}

/* 默认自动绑定（幂等）；console-dev 接管后可调用 unbindHistoryShortcuts() */
if (typeof window !== 'undefined') bindHistoryShortcuts()

/* ---------- composable ---------- */
export function useHistory() {
  return {
    undo,
    redo,
    canUndo,
    canRedo,
    push,
    capture,
    withHistory,
    clearHistory,
    historySetContent,
    historyUpdateModule,
    historySetElementPos,
    historyToggleLayout,
    historyResetContent,
    historySetContentForDevice,
    historyUpdateForDevice,
    historyResetDeviceContent,
    historyResetTemplateModules,
    historyResetLayout,
    bindHistoryShortcuts,
    unbindHistoryShortcuts,
    MAX_HISTORY
  }
}

export default useHistory
