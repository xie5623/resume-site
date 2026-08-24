/* ============================================================
   directives/editable.js — v-editable 可编辑元素指令（T3 module-builder）
   ------------------------------------------------------------
   给模块内可编辑元素统一打标记 + 提供交互（样式只在编辑态/拖拽态叠加，
   不改变模块原有渲染结构）：

   1. 标记（需求 4）：
      - data-editable-key="模块key.字段key"（如 hero.name、skills.items）
      - data-editable-label（悬停提示文案）/ data-editable-type
      - 原生 title = 可编辑提示（可编辑 cursor + title）
   2. 元素级选中（需求 4）：
      - 编辑态点击 → useSelection.selectElement(moduleId, key) +
        setSelectionEl(el)（供 console-dev SelectionBox 定位）
      - 自身 data-selected=true 高亮（CSS 叠加）
   3. 位置应用（需求 5）：
      - 模块开启「拖拽摆放」（useLayout.isLayoutEnabled）且元素有保存位置时，
        apply() 把元素脱离流式按记录坐标绝对定位（resize 自动按比例保持）。
      - 关闭摆放 / 未记录位置时清理内联样式 → 恢复默认流式布局。
      - 【拖拽本体已移到 SelectionBox.vue 的拖拽手柄】：用户选中元素后按住
        右下角手柄拖拽，预览用 transform（不触发重排），松手暂存，点确认才
        写入位置（见 SelectionBox.vue）。本指令不再拦截 pointerdown 整块拖走。

   用法（模板）：<h1 v-editable="ed('name')">…</h1>
   ed() 来自 useEditableElement（模块组件内注册清单 + 返回绑定对象）。
   ============================================================ */

import { watch } from 'vue'
import {
  selection,
  selectElement,
  setSelectionEl
} from '@/composables/useSelection'
import {
  isLayoutEnabled,
  getElementPos
} from '@/composables/useLayout'
import { editing } from '@/composables/useEditingMode'
import { getElementStyle } from '@/composables/useElementStyle'
import { resolveListItemPath } from '@/composables/useItemPath'
import { applyElementStyle } from '@/directives/elementStyle'

export const vEditable = {
  mounted(el, binding) {
    const cfg = binding.value || {}
    const { moduleId, key } = cfg
    if (!moduleId || !key) return

    const state = { moduleId, key, stopFns: [] }
    el._editable = state

    /* ---------- 1. 标记 ---------- */
    el.setAttribute('data-editable-key', `${moduleId}.${key}`)
    el.setAttribute('data-editable-type', cfg.type || 'text')
    el.setAttribute('data-editable-label', cfg.label || key)
    if (cfg.label) el.title = cfg.label

    /* ---------- 2. 元素级选中（编辑态点击） ----------
       list 元素（type='list'，如 skills.items 挂在 ul/div 上）内点击条目：
       先尝试【精细框选】（需求 5）——用 resolveListItemPath 把容器级标记
       解析成 items.N.field（如 skills.items.0.name），命中则选中该最小
       可编辑字段，控制台定位到对应输入框；未命中/歧义再回退整条选中
       （容器 key + itemIndex，或 per-item 元素 key 本身）。 */
    function findItemElement(target, container) {
      if (!target || !container || typeof target.closest !== 'function') return null
      let node = target
      while (node && node !== container) {
        if (node.parentNode === container) return node
        node = node.parentNode
      }
      return null
    }

    /* per-item 元素（气泡等）的 key 含条目下标：items.<N> */
    const ITEM_KEY_RE = /^(.+)\.(\d+)$/

    function onClick(e) {
      if (!editing.value) return
      e.preventDefault()
      e.stopPropagation()
      if (cfg.type === 'list') {
        const keyMatch = ITEM_KEY_RE.exec(key)
        const knownIndex = keyMatch ? Number(keyMatch[2]) : null
        const listKey = keyMatch ? keyMatch[1] : key
        /* ① 精细框选：解析 items.N.field 精确路径（传点击 Y，per-item 元素
           子元素 pointer-events:none 时按坐标定位到 name/level 文本） */
        const precise = resolveListItemPath(e.target, el, moduleId, listKey, knownIndex, e.clientY)
        if (precise) {
          selectElement(moduleId, precise.path)
          setSelectionEl(precise.el || e.target)
          return
        }
        /* ② per-item 元素（气泡 span，key=items.<N>）：整体选中该条目 */
        if (knownIndex != null) {
          selectElement(moduleId, key)
          setSelectionEl(el)
          return
        }
        /* ③ 容器级列表回退：整条选中（容器 key + itemIndex） */
        const itemEl = findItemElement(e.target, el)
        if (itemEl) {
          const itemIndex = Array.prototype.indexOf.call(el.children, itemEl)
          selectElement(moduleId, key, null, itemIndex)
          setSelectionEl(itemEl)
          return
        }
      }
      /* 普通可编辑元素：直接选中 */
      selectElement(moduleId, key)
      setSelectionEl(el)
    }
    el.addEventListener('click', onClick)

    /* ---------- 3. 位置应用：watch 选中态 + 布局 + 编辑态 ---------- */
    function apply() {
      if (!el._editable) return
      const { moduleId: m, key: k } = el._editable

      const isSel = editing.value
        && selection.value.kind === 'element'
        && selection.value.moduleId === m
        && selection.value.elementKey === k
      el.dataset.selected = isSel ? 'true' : 'false'

      const on = isLayoutEnabled(m)
      const pos = on ? getElementPos(m, k) : null
      const st = el.style
      if (pos) {
        /* 摆放中：脱离流式，按记录坐标绝对定位（% → 自适应） */
        st.position = 'absolute'
        st.margin = '0'
        st.maxWidth = '100%'
        st.zIndex = '5'
        /* 宽度协调（与 v-element-style 的 fit-content 规则配对，见 elementStyle.js）：
           有【元素级字号补丁】（fontScale 数字 ≠ 1）时，宽度交给 elementStyle.js
           的 fit-content 自适应（问题4——框随字号/内容变大变小），本处不覆盖；
           无字号补丁时，按拖拽时记录的像素宽度定宽，保持元素原始尺寸，
           避免 fit-content 把块级元素缩成内容宽造成「变形」（问题2）。 */
        const rawPatch = getElementStyle(m, k)
        const hasFontPatch = rawPatch && typeof rawPatch.fontScale === 'number' && rawPatch.fontScale !== 1
        if (!hasFontPatch) st.width = pos.w ? `${pos.w}px` : 'auto'
        if (pos.unit === 'px') {
          st.left = `${pos.x}px`
          st.top = `${pos.y}px`
        } else {
          st.left = `${pos.x}%`
          st.top = `${pos.y}%`
        }
      } else {
        /* 未摆放/关闭摆放：清理内联样式 → 恢复默认流式布局
           （removeProperty 需用连字符 CSS 属性名，max-width / z-index 用 kebab-case） */
        st.removeProperty('position')
        st.removeProperty('left')
        st.removeProperty('top')
        st.removeProperty('margin')
        st.removeProperty('max-width')
        st.removeProperty('width')
        st.removeProperty('z-index')
      }

      /* ---------- 元素级样式（字号/强调/自适应框）统一落地 ----------
         修复「选中元素调字号滑块没反应」（用户问题 2）：v-element-style
         指令只挂在部分元素的 title 上；这里对【所有】可编辑元素应用元素级
         补丁，使任意可编辑元素都能响应元素级字号缩放（--fs-scale +
         fit-content 自适应框）、渐变强调。
         - 元素已挂 v-element-style（data-el-style-key 存在）时跳过，
           由该指令负责，避免双写冲突（其逻辑与本函数一致）。
         - applyElementStyle 内部对无补丁元素是「清理」语义（无副作用）。 */
      if (!el.dataset.elStyleKey) {
        applyElementStyle(el, m, k)
      }
    }
    /* 用 getter 精确追踪：layout 是嵌套响应式（enabled/positions 内部
       变更），直接 watch ref 不会触发；getter 读取时被追踪，变更即重跑。
       另追踪 getElementStyle：元素级字号补丁被清除/调回 1 时，本处
       hasFontPatch 变 false → 把 width 写回 pos.w（否则会一直停在
       elementStyle 的 fit-content，不回原宽）。 */
    const stopApply = watch(
      [
        selection,
        editing,
        () => isLayoutEnabled(moduleId),
        () => getElementPos(moduleId, key),
        () => getElementStyle(moduleId, key)
      ],
      apply,
      { flush: 'post', immediate: true }
    )
    state.stopFns.push(stopApply)
    state.onClick = onClick
  },

  updated(el, binding) {
    const cfg = binding.value || {}
    if (cfg.label) {
      el.setAttribute('data-editable-label', cfg.label)
      el.title = cfg.label
    }
  },

  unmounted(el) {
    if (el._editable) {
      el._editable.stopFns.forEach((stop) => {
        try { stop() } catch (_) {}
      })
      el.removeEventListener('click', el._editable.onClick)
      delete el._editable
    }
    el.removeAttribute('data-editable-key')
    el.removeAttribute('data-editable-label')
    el.removeAttribute('data-editable-type')
    el.removeAttribute('data-selected')
    el.removeAttribute('title')
    ;['position', 'left', 'top', 'margin', 'max-width', 'width', 'z-index'].forEach((p) => {
      el.style.removeProperty(p)
    })
  }
}

export default vEditable
