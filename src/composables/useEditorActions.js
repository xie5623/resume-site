/* ============================================================
   composables/useEditorActions.js — 复制 / 粘贴动作编排（需求 6 交互层）
   ------------------------------------------------------------
   把「当前选中 → 复制」和「剪贴板 → 粘贴到当前选中」封装成两个动作，
   供 SelectionBox 工具条按钮与全局快捷键（Ctrl+C / Ctrl+V）复用：

   - copySelection()：
       · kind='module'  → copyModule(moduleId)（复制整个模块 → 粘为同类型副本）
       · kind='element' → copyElement(moduleId, elementKey, { itemIndex })
         （列表条目精确复制单条数据 + 元素样式；标量复制文本值）
   - pasteSelection()：
       · 剪贴板为 module → historyPasteAsNewModule()（skills-2 副本实例）
       · 剪贴板为元素   → 粘到当前选中目标：
           - 选中列表条目 → 插到其后（targetIndex = itemIndex + 1）
           - 选中列表容器 / 模块 → 追加到该模块 items 列表尾
       · 粘贴统一走 history（historyPasteElement / historyPasteAsNewModule），
         一个可撤销单元（内容 + 元素样式 + 模板编排一步 undo）。
   - 全局快捷键：编辑态下 Ctrl+C / Ctrl+V（焦点在输入框/可编辑区时不劫持，
     让浏览器原生复制/粘贴）。绑定幂等，模块加载即生效。

   依赖顺序：useEditorActions → useClipboard + useHistory + useSelection
   （无环：useHistory → useClipboard → useContent/useTemplates/useElementStyle）
   ============================================================ */

import { computed } from 'vue'
import { selection, selectModule as selectInSelection } from '@/composables/useSelection'
import { editing } from '@/composables/useEditingMode'
import { clipboard, hasClipboard, copyElement, copyModule } from '@/composables/useClipboard'
import { historyPasteElement, historyPasteAsNewModule } from '@/composables/useHistory'

/* ---------- 剪贴板内容的人类可读标签（工具条/状态提示用） ---------- */
export function clipboardLabel() {
  const cb = clipboard.value
  if (!cb) return ''
  if (cb.kind === 'module') return cb.namespace || cb.moduleId || ''
  if (cb.itemIndex != null) return `${cb.key}.${cb.itemIndex}`
  return cb.key || ''
}

/**
 * parseListItemKey(key) — 判断元素 key 是否为「列表条目路径」。
 * 气泡图单气泡 v-editable 的 key = `items.<index>`（module-builder T4），
 * 点气泡时选中态是 { elementKey:'items.0', itemIndex:null }；
 * 列表容器级选中则是 { elementKey:'items', itemIndex:N }。
 * 两者都归一化成 { listKey:'items', index:N }，复制/粘贴/缩放手柄统一消费。
 */
export function parseListItemKey(key) {
  if (!key) return null
  const m = /^(.+)\.(\d+)$/.exec(key)
  if (m) return { listKey: m[1], index: Number(m[2]) }
  return null
}

/** 从选中态解析「列表条目信息」（itemIndex 优先；无则试 key 路径） */
export function listItemInfoOf(sel) {
  if (!sel || sel.kind !== 'element') return null
  if (Number.isInteger(sel.itemIndex)) return { listKey: sel.elementKey, index: sel.itemIndex }
  return parseListItemKey(sel.elementKey)
}

/* ================= 复制当前选中 ================= */
/**
 * copySelection() — 复制当前选中到剪贴板。
 * @returns {{ ok:boolean, kind?:'module'|'element', label?:string, reason?:string }}
 */
export function copySelection() {
  if (!editing.value) return { ok: false, reason: 'not-editing' }
  const sel = selection.value
  if (!sel || sel.kind == null) return { ok: false, reason: 'no-selection' }

  if (sel.kind === 'module' && sel.moduleId) {
    const ok = copyModule(sel.moduleId)
    return ok ? { ok: true, kind: 'module', label: clipboardLabel() } : { ok: false, reason: 'copy-failed' }
  }

  if (sel.kind === 'element' && sel.moduleId && sel.elementKey) {
    /* 列表条目（含气泡单条 items.<n>）→ copyElement(moduleId, listKey, { itemIndex })，
       复制单条数据 + 元素样式；否则标量复制文本值。 */
    const info = listItemInfoOf(sel)
    const ok = info
      ? copyElement(sel.moduleId, info.listKey, { itemIndex: info.index })
      : copyElement(sel.moduleId, sel.elementKey, { itemIndex: null })
    return ok ? { ok: true, kind: 'element', label: clipboardLabel() } : { ok: false, reason: 'empty-data' }
  }

  return { ok: false, reason: 'no-selection' }
}

/* ================= 粘贴到当前选中 ================= */
/**
 * pasteSelection() — 把剪贴板粘贴到当前选中目标。
 * 返回 { ok, kind, moduleId?, label?, reason? }；粘贴成功且为模块副本时
 * 自动选中新实例（页面高亮 + 左侧树联动）。
 */
export function pasteSelection() {
  if (!editing.value) return { ok: false, reason: 'not-editing' }
  if (!hasClipboard.value) return { ok: false, reason: 'empty-clipboard' }
  const cb = clipboard.value
  const sel = selection.value

  /* 1) 剪贴板是模块：粘贴 = 生成同类型新实例（skills-2），与选中无关 */
  if (cb.kind === 'module') {
    const cfg = historyPasteAsNewModule()
    if (!cfg) return { ok: false, reason: 'module-failed' }
    selectInSelection(cfg.id)
    return { ok: true, kind: 'module', moduleId: cfg.id, label: cfg.id }
  }

  /* 2) 剪贴板是元素：粘到当前选中的模块
       - 选中列表条目（itemIndex / items.<n>）→ 插到其后
       - 选中列表容器 / 模块 → 追加到该模块 items 尾 */
  if (sel.kind === 'element' && sel.moduleId) {
    const info = listItemInfoOf(sel)
    const targetIndex = info ? info.index + 1 : undefined
    const ok = historyPasteElement(sel.moduleId, { targetIndex })
    return ok ? { ok: true, kind: 'element', moduleId: sel.moduleId } : { ok: false, reason: 'paste-failed' }
  }
  if (sel.kind === 'module' && sel.moduleId) {
    const ok = historyPasteElement(sel.moduleId)
    return ok ? { ok: true, kind: 'element', moduleId: sel.moduleId } : { ok: false, reason: 'no-list-target' }
  }

  return { ok: false, reason: 'no-target' }
}

/* ================= 全局快捷键：Ctrl+C / Ctrl+V（编辑态生效） ================= */
let bound = false

function onKeydown(e) {
  if (!editing.value) return
  if (!(e.ctrlKey || e.metaKey)) return
  const k = String(e.key).toLowerCase()
  if (k !== 'c' && k !== 'v') return

  /* 焦点在输入框/文本域/可编辑区：交给浏览器原生复制粘贴，不劫持 */
  const t = e.target
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return

  e.preventDefault()
  if (k === 'c') copySelection()
  else pasteSelection()
}

/** 绑定全局复制/粘贴快捷键（模块加载即绑定一次，幂等） */
export function bindEditorActionsShortcuts() {
  if (bound || typeof window === 'undefined') return
  bound = true
  window.addEventListener('keydown', onKeydown)
}

/** 解除绑定（console-dev 接管快捷键时调用） */
export function unbindEditorActionsShortcuts() {
  if (typeof window === 'undefined') return
  window.removeEventListener('keydown', onKeydown)
  bound = false
}

/* 默认自动绑定（幂等） */
if (typeof window !== 'undefined') bindEditorActionsShortcuts()

/* ---------- composable ---------- */
export function useEditorActions() {
  return {
    copySelection,
    pasteSelection,
    clipboardLabel,
    parseListItemKey,
    listItemInfoOf,
    hasClipboard: computed(() => hasClipboard.value),
    bindEditorActionsShortcuts,
    unbindEditorActionsShortcuts
  }
}

export default useEditorActions
