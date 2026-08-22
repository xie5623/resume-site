/* ============================================================
   composables/useInlineEdit.js — 页面内联编辑（点文字直接编辑，需求 7）
   ------------------------------------------------------------
   作用：全局「双击页面文字 → 就地变成输入框」的状态与逻辑：
   - startInlineEdit(moduleId, key, el)：在元素上开启就地编辑。
     key = 内容路径后缀（与 T3 v-editable 的 data-editable-key 一致，
     完整内容路径 = `${moduleId}.${key}`，如 hero.name / experience.items.0.desc）。
   - 输入实时写 store（useContent.setContent）→ 页面文字实时预览。
   - 失焦 / Enter 提交 → 提交时把「编辑前快照」入撤销栈一次（undo 一步回到编辑前）。
   - Esc 取消 → 恢复编辑前快照（放弃草稿）。
   - 定位信息（x/y/w/h + 字号）给 InlineEdit.vue 的 fixed 浮层使用。
   - 非字符串值（数组/对象/布尔）不支持就地编辑，返回 false（交给左侧配置区）。
   ============================================================ */

import { ref } from 'vue'
import { version } from '@/composables/useVersion'
import { lang } from '@/i18n'
import { getContent, setContent, replaceContentState } from '@/content/useContent'
import { replaceTemplatesState } from '@/composables/useTemplates'
import { replaceLayoutState } from '@/composables/useLayout'
import { replaceElementStyleState } from '@/composables/useElementStyle'
import { capture, push } from '@/composables/useHistory'

/** 就地编辑状态（响应式，InlineEdit.vue 渲染用） */
export const inlineEdit = ref({
  active: false,
  moduleId: null,
  key: null,
  path: null,
  value: '',
  x: 0, y: 0, w: 0, h: 0,
  multiline: false,
  fontSize: '1rem',
  lineHeight: '1.4',
  textAlign: 'left'
})

const EMPTY = {
  active: false,
  moduleId: null,
  key: null,
  path: null,
  value: '',
  x: 0, y: 0, w: 0, h: 0,
  multiline: false,
  fontSize: '1rem',
  lineHeight: '1.4',
  textAlign: 'left'
}

let pendingSnap = null
let dirty = false

/** 恢复一份快照到四个 store（撤销/取消共用，与 useHistory 同款） */
function restoreSnapshot(snap) {
  if (snap?.content != null) replaceContentState(snap.content)
  if (snap?.templates != null) replaceTemplatesState(snap.templates)
  if (snap?.layout != null) replaceLayoutState(snap.layout)
  if (snap?.elementStyle != null) replaceElementStyleState(snap.elementStyle)
}

/**
 * 开启就地编辑。
 * @param {string} moduleId  模块 id（如 hero）
 * @param {string} key       内容路径后缀（如 name / items.0.desc）
 * @param {HTMLElement} el   被双击的 DOM 元素（定位 + 注入选中）
 * @returns {boolean} 是否成功开启（非字符串内容返回 false）
 */
export function startInlineEdit(moduleId, key, el) {
  if (!moduleId || !key || !el) return false
  const path = `${moduleId}.${key}`
  const v = getContent(version.value, lang.value, path)
  if (typeof v !== 'string') return false

  const r = el.getBoundingClientRect()
  const cs = window.getComputedStyle(el)
  inlineEdit.value = {
    ...EMPTY,
    active: true,
    moduleId,
    key,
    path,
    value: v,
    x: r.left,
    y: r.top,
    w: Math.max(r.width, 120),
    h: Math.max(r.height, 40),
    multiline: v.length > 48 || v.includes('\n'),
    fontSize: cs.fontSize || '1rem',
    lineHeight: cs.lineHeight && cs.lineHeight !== 'normal' ? cs.lineHeight : '1.4',
    textAlign: cs.textAlign || 'left'
  }
  pendingSnap = capture()
  dirty = false
  return true
}

/** 输入中：实时写 store（预览）+ 标记 dirty（提交时入栈一次） */
export function updateInlineEdit(next) {
  const st = inlineEdit.value
  if (!st.active) return
  dirty = true
  inlineEdit.value.value = next
  setContent(version.value, lang.value, st.path, next)
}

/** 提交（失焦 / Enter）：保存一次可撤销历史（undo 回到编辑前） */
export function commitInlineEdit() {
  const st = inlineEdit.value
  if (!st.active) return
  inlineEdit.value = { ...EMPTY }
  if (dirty && pendingSnap) push(pendingSnap)
  pendingSnap = null
  dirty = false
  window.dispatchEvent(new CustomEvent('editor:content-change'))
}

/** 取消（Esc）：恢复编辑前快照，放弃草稿 */
export function cancelInlineEdit() {
  if (!inlineEdit.value.active) return
  const snap = pendingSnap
  inlineEdit.value = { ...EMPTY }
  pendingSnap = null
  dirty = false
  if (snap) restoreSnapshot(snap)
  window.dispatchEvent(new CustomEvent('editor:content-change'))
}

export function useInlineEdit() {
  return {
    inlineEdit,
    startInlineEdit,
    updateInlineEdit,
    commitInlineEdit,
    cancelInlineEdit
  }
}

export default useInlineEdit
