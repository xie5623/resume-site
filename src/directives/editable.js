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
   3. 拖拽摆放（需求 5，重点）：
      - 模块开启「拖拽摆放」（useLayout.isLayoutEnabled）时，
        pointer 拖拽元素改变位置：拖拽中脱离流式（absolute + 偏移），
        松手 setElementPos(moduleId, key, {x,y}, 容器尺寸) 记录 % 坐标
        （resize 自动按比例保持）；实时跟随 + 拖拽态视觉反馈。
      - 关闭摆放 / 未记录位置时清理内联样式 → 恢复默认流式布局。

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
  getElementPos,
  setElementPos
} from '@/composables/useLayout'
import { editing } from '@/composables/useEditingMode'

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

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

    /* ---------- 2. 元素级选中（编辑态点击） ---------- */
    function onClick(e) {
      if (!editing.value) return
      e.preventDefault()
      e.stopPropagation()
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
        st.width = 'fit-content'
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
    }
    /* 用 getter 精确追踪：layout 是嵌套响应式（enabled/positions 内部
       变更），直接 watch ref 不会触发；getter 读取时被追踪，变更即重跑。 */
    const stopApply = watch(
      [
        selection,
        editing,
        () => isLayoutEnabled(moduleId),
        () => getElementPos(moduleId, key)
      ],
      apply,
      { flush: 'post', immediate: true }
    )
    state.stopFns.push(stopApply)

    /* ---------- 4. 拖拽摆放（模块开启 + 编辑态时 pointer 拖拽） ---------- */
    function onPointerDown(e) {
      if (!editing.value || !isLayoutEnabled(moduleId)) return
      if (e.button !== 0) return
      /* 不劫持链接/表单等交互子元素（仍可点击选中，但不拖拽） */
      if (e.target.closest('a, button, input, textarea, select')) return
      e.preventDefault()
      startDrag(e)
    }
    el.addEventListener('pointerdown', onPointerDown)

    function startDrag(e) {
      const container = el.closest(`[data-module="${moduleId}"]`)
      if (!container) return
      const cRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      const startX = elRect.left - cRect.left
      const startY = elRect.top - cRect.top
      const startCX = e.clientX
      const startCY = e.clientY
      const maxX = Math.max(0, cRect.width - elRect.width)
      const maxY = Math.max(0, cRect.height - elRect.height)

      const st = el.style
      st.position = 'absolute'
      st.margin = '0'
      st.left = `${startX}px`
      st.top = `${startY}px`
      st.width = `${elRect.width}px`
      st.maxWidth = '100%'
      st.zIndex = '60'
      el.classList.add('is-dragging')
      document.body.setAttribute('data-drag-active', 'true')

      function onMove(ev) {
        st.left = `${clamp(startX + (ev.clientX - startCX), 0, maxX)}px`
        st.top = `${clamp(startY + (ev.clientY - startCY), 0, maxY)}px`
      }
      function finish() {
        const rect = el.getBoundingClientRect()
        const c = container.getBoundingClientRect()
        const nx = rect.left - c.left
        const ny = rect.top - c.top
        /* 传容器尺寸 → setElementPos 自动换算成 %（resize 按比例保持） */
        setElementPos(moduleId, key, { x: nx, y: ny }, { width: c.width, height: c.height })
        el.classList.remove('is-dragging')
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerup', finish)
        el.removeEventListener('pointercancel', finish)
        document.body.removeAttribute('data-drag-active')
        try { el.releasePointerCapture(e.pointerId) } catch (_) {}
        apply()
      }
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerup', finish)
      el.addEventListener('pointercancel', finish)
      try { el.setPointerCapture(e.pointerId) } catch (_) {}
    }

    el.addEventListener('pointerdown', onPointerDown)
    state.onClick = onClick
    state.onPointerDown = onPointerDown
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
      el.removeEventListener('pointerdown', el._editable.onPointerDown)
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
