/* ============================================================
   composables/useItemPath.js — 列表项精确路径解析（需求 5 精细框选共享逻辑）
   ------------------------------------------------------------
   把「点击元素 + 列表容器 / per-item 元素」解析成精确内容路径
   `items.<N>.<field>`（如 skills.items.0.name），供：
     - v-editable 指令（点击 → 精细框选到最小可编辑字段，需求 5）
     - App.vue（双击 → 就地编辑精确字段）
   两者共用同一套文本匹配，避免逻辑漂移。

   - resolveListItemPath(target, container, moduleId, listKey, knownIndex, clientY)
       · container = 列表容器（ul/ol/div，key='items'）或 per-item 元素
         （气泡 span，key='items.<N>'）
       · knownIndex：per-item 元素时传条目下标；否则按「点击元素在容器
         直接子项中的索引」推断
       · clientY：可选。per-item 元素子元素常设 pointer-events:none（气泡
         name/level），e.target 落到容器自身 → 用点击 Y 定位到子元素再取
         文本；点到子元素内才精确，否则返回 null（回退整条选中）
       · 命中返回 { path, text, el }（el = 匹配文本的最深元素，高亮框用）
   - fieldTextMatches(v, text)：字段值匹配点击文本
       · string 精确；number 兼容 `92` / `92%`；boolean 兼容 true/false
   - findTextFieldEl(target, expected)：找 textContent 恰好等于目标文本的
     最深元素（TextReveal 拆字 span → 上溯到标题/段落）
   ============================================================ */

import { resolveContent } from '@/content/useContent'
import { version } from '@/composables/useVersion'
import { lang } from '@/i18n'

/** 字段值是否与点击文本匹配（string 精确；number 兼容 % 后缀；boolean 兼容 true/false） */
export function fieldTextMatches(v, text) {
  if (typeof v === 'string') return v.trim() === text
  if (typeof v === 'number') return String(v) === text || `${v}%` === text
  if (typeof v === 'boolean') return (v ? 'true' : 'false') === String(text).toLowerCase()
  return false
}

/** 找包含 clientY 的容器直接子元素（点到子元素内才命中，不取最近） */
function childAtY(container, clientY) {
  if (!container || typeof clientY !== 'number' || !container.children) return null
  for (const c of container.children) {
    if (!c || typeof c.getBoundingClientRect !== 'function') continue
    const r = c.getBoundingClientRect()
    if (clientY >= r.top - 1 && clientY <= r.bottom + 1) return c
  }
  return null
}

/**
 * 解析「点击元素 → 列表项内精确字段路径」。
 * @param {HTMLElement} target      被点击的元素（最内层）
 * @param {HTMLElement} container   列表容器（ul/ol/div）或 per-item 元素（气泡 span）
 * @param {string} moduleId         模块实例 id
 * @param {string} listKey          列表键（如 'items'）
 * @param {number|null} knownIndex  已知条目下标（per-item 元素）；null = 按容器直接子项推断
 * @param {number|null} clientY     点击 Y 坐标（per-item 元素子元素不可命中时用）
 * @returns {{path:string, text:string, el:HTMLElement}|null}
 */
export function resolveListItemPath(target, container, moduleId, listKey, knownIndex = null, clientY = null) {
  if (!target || !container || !moduleId || !listKey) return null

  /* 1) 条目下标：knownIndex 优先；否则找 target 在 container 直接子项中的索引 */
  let idx = Number.isInteger(knownIndex) ? knownIndex : null
  if (idx == null) {
    let node = target
    while (node && node !== container) {
      if (node.parentNode === container) {
        idx = Array.prototype.indexOf.call(container.children, node)
        break
      }
      node = node.parentNode
    }
  }
  if (idx == null || idx < 0) return null

  /* 2) 读该条目的数据（对象项才可精确到字段） */
  const item = resolveContent(version.value, lang.value, `${moduleId}.${listKey}.${idx}`)
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null

  /* 3) 取点击文本：
       - 常规容器：e.target 就是文本元素（或其后代），用其 textContent
       - per-item 元素（气泡，子元素 pointer-events:none）：e.target = 容器
         自身 → 按点击 Y 定位子元素；点到子元素内才精确，否则 null */
  let text = (target.textContent || '').trim()
  let textEl = target
  if (target === container || !text) {
    const child = childAtY(container, clientY)
    if (!child) return null
    text = (child.textContent || '').trim()
    textEl = child
  }
  if (!text) return null

  /* 4) 用点击文本匹配项内字段（唯一命中才返回，避免歧义） */
  let hit = null
  for (const [k, v] of Object.entries(item)) {
    if (fieldTextMatches(v, text)) {
      if (hit) return null /* 多个字段同值 → 歧义，放弃精确匹配 */
      hit = k
    }
  }
  if (!hit) return null
  return { path: `${listKey}.${idx}.${hit}`, text, el: textEl }
}

/** 找 textContent 恰好等于目标文本的最深元素（TextReveal 拆字 span → 上溯到标题/段落） */
export function findTextFieldEl(target, expected) {
  let el = target
  while (el && el.getAttribute && !el.hasAttribute('data-editable-key')) {
    if ((el.textContent || '').trim() === expected) return el
    el = el.parentElement
  }
  return null
}

/* ---------- composable ---------- */
export function useItemPath() {
  return { resolveListItemPath, findTextFieldEl, fieldTextMatches }
}

export default useItemPath
