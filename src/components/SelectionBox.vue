<script setup>
/**
 * SelectionBox — 选中高亮框 + 复制/粘贴工具条 + 拖拽摆放手柄（需求 2 / 6）
 * ------------------------------------------------------------
 * 跟随 useSelection() 的选中态，在页面上绘制一个绝对定位的
 * 发光描边框 + 角标：
 *   - 点左侧模块名 → selectModule(id) → 本框定位到 #moduleId 模块
 *   - 点页面元素 → selectElement + setSelectionEl(el) → 本框定位到该元素
 * 定位用 useSelection().getSelectionRect()（module 按 id 找容器，
 * element 用注入的 DOM 元素），fixed 坐标系 + scroll/resize 跟随。
 * - 不拦截任何指针事件（pointer-events: none），纯高亮层；工具条/手柄
 *   单独放开 pointer-events: auto 可交互。
 * - 模块级选中：角标显示模块名；元素级选中：角标显示 模块名 · key。
 *
 * 拖拽摆放重构（本组件负责）：
 *   - 右下角【拖拽手柄】（取代原缩放光标）：元素级选中 + 编辑态 + 该模块
 *     拖拽摆放开启时显示。按住手柄才拖拽该元素（元素本体不再整块被拖走，
 *     根因修复见 editable.js——那里已移除 pointerdown 整块拖拽）。
 *   - 拖拽预览用 transform（不触发重排/不写 layout），松手后元素停留在
 *     预览位置，出现「✓ 确认修改 / ✕ 撤销」条：确认 → historySetElementPos
 *     写入（可撤销、刷新保留）；撤销 → 清除预览回原位。
 *   - 选中变化 / 退出编辑态时自动撤销待确认位置。
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useSelection } from '@/composables/useSelection'
import { useI18n } from '@/i18n'
import { MODULE_LABELS } from '@/config/site.config'
import { useEditorActions } from '@/composables/useEditorActions'
import { historySetElementPos } from '@/composables/useHistory'
import {
  isLayoutEnabled,
  pendingPos,
  stageElementPos,
  cancelPendingPos
} from '@/composables/useLayout'
import { editing } from '@/composables/useEditingMode'

const { selection, getSelectionRect, selectionEl } = useSelection()
const { lang } = useI18n()
const { copySelection, pasteSelection, hasClipboard } = useEditorActions()

const box = ref({ x: 0, y: 0, w: 0, h: 0, show: false })

/* ---------- 角标文案 ---------- */
const label = computed(() => {
  const sel = selection.value
  if (!sel || sel.kind == null) return ''
  const m = MODULE_LABELS[sel.moduleId]?.[lang.value]
    ?? MODULE_LABELS[sel.moduleId]?.zh
    ?? sel.moduleId ?? ''
  if (sel.kind === 'element' && sel.elementKey) return `${m} · ${sel.elementKey}`
  return m
})

/* ---------- 定位：fixed 坐标系（getBoundingClientRect 即 view 坐标） ---------- */
let raf = 0
function update() {
  raf = 0
  const sel = selection.value
  if (!sel || sel.kind == null) {
    box.value.show = false
    return
  }
  const rect = getSelectionRect()
  if (!rect || rect.width < 2 || rect.height < 2) {
    box.value.show = false
    return
  }
  /* 完全滚出视口时隐藏，避免出现悬空的框 */
  if (rect.bottom < -8 || rect.top > (window.innerHeight || 0) + 8) {
    box.value.show = false
    return
  }
  box.value = { x: rect.left, y: rect.top, w: rect.width, h: rect.height, show: true }
}

function schedule() {
  if (raf) return
  raf = requestAnimationFrame(update)
}

watch(() => selection.value, schedule, { deep: true })

/* 内容/布局变化（inline edit 提交、字号拖动）后重新定位 */
function onContentChange() { schedule() }

onMounted(() => {
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  window.addEventListener('editor:content-change', onContentChange)
  schedule()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  window.removeEventListener('editor:content-change', onContentChange)
  if (raf) cancelAnimationFrame(raf)
  /* 清理拖拽监听与待确认状态 */
  clearDragHandlers()
  const p = pendingPos.value
  if (p) { clearPreviewTransform(p); cancelPendingPos() }
})

/* ================= 复制 / 粘贴工具条（需求 6） =================
   编辑态 + 有选中 → 显示；按钮可点击（pointer-events auto）。
   复制/粘贴复用 useEditorActions（与 Ctrl+C/Ctrl+V 同一套逻辑）。 */
const toolVisible = computed(() => editing.value && selection.value?.kind != null)
const pasteEnabled = computed(() => hasClipboard.value)

const toolbarMsg = ref('')
let toolbarTimer = null
function flash(msg) {
  toolbarMsg.value = msg
  clearTimeout(toolbarTimer)
  toolbarTimer = setTimeout(() => { toolbarMsg.value = '' }, 1800)
}
function doCopy() {
  const r = copySelection()
  if (r.ok) flash(`${copyDone[lang.value]} · ${r.label}`)
  else flash(copyFail[lang.value])
}
function doPaste() {
  const r = pasteSelection()
  if (r.ok) flash(`${pasteDone[lang.value]}${r.label ? ` · ${r.label}` : ''}`)
  else flash(pasteFail[lang.value])
}

const copyL = { zh: '复制', en: 'Copy' }
const pasteL = { zh: '粘贴', en: 'Paste' }
const copyDone = { zh: '已复制', en: 'Copied' }
const pasteDone = { zh: '已粘贴', en: 'Pasted' }
const copyFail = { zh: '未复制：先选中一个元素/模块', en: 'Nothing to copy — select first' }
const pasteFail = { zh: '无法粘贴：剪贴板为空或目标不支持', en: 'Paste unavailable' }
const dragL = { zh: '按住拖拽摆放', en: 'Drag to reposition' }
const confirmL = { zh: '确认修改', en: 'Apply' }
const cancelL = { zh: '撤销', en: 'Cancel' }

/* ================= 右下角拖拽摆放手柄（元素级选中 + 模块开启拖拽摆放） ================= */
const dragHandleVisible = computed(() => editing.value
  && selection.value?.kind === 'element'
  && isLayoutEnabled(selection.value?.moduleId))

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }

/** 拖拽目标元素：优先 useSelection 注入的 selectionEl；回退按 data-editable-key 查询 */
function dragTargetEl(moduleId, elementKey) {
  if (selectionEl.value && typeof selectionEl.value.getBoundingClientRect === 'function') {
    return selectionEl.value
  }
  if (typeof document === 'undefined') return null
  return document.querySelector(`[data-editable-key="${moduleId}.${elementKey}"]`)
}

let dragState = null   /* 拖拽中状态 */
let dragHandlers = null /* window pointer 监听（onBeforeUnmount 清理用） */
let dragPreview = null  /* { el, origTransform }：待确认期间的预览残留（撤销/确认恢复用） */

function clearDragHandlers() {
  if (dragHandlers) {
    window.removeEventListener('pointermove', dragHandlers.onMove)
    window.removeEventListener('pointerup', dragHandlers.finish)
    window.removeEventListener('pointercancel', dragHandlers.finish)
    dragHandlers = null
  }
}

/** 恢复元素到拖拽前的 transform 并清掉预览残留引用 */
function clearPreviewTransform() {
  if (dragPreview) {
    dragPreview.el.style.transform = dragPreview.origTransform
    dragPreview = null
  }
}

function onDragStart(e) {
  if (!editing.value) return
  const sel = selection.value
  if (!sel || sel.kind !== 'element') return
  if (e.button != null && e.button !== 0) return
  const moduleId = sel.moduleId
  const elementKey = sel.elementKey
  const el = dragTargetEl(moduleId, elementKey)
  if (!el || typeof el.closest !== 'function') return
  const container = el.closest(`[data-module="${moduleId}"]`)
  if (!container) return
  e.preventDefault()
  e.stopPropagation()

  /* 已有待确认位置时先撤销上一段预览，再开始新拖拽 */
  if (pendingPos.value) { clearPreviewTransform(); cancelPendingPos() }

  dragState = {
    el,
    container,
    moduleId,
    elementKey,
    w: el.offsetWidth || el.getBoundingClientRect().width,
    origTransform: el.style.transform || '',
    cx: e.clientX,
    cy: e.clientY,
    pointerId: e.pointerId,
    moved: false
  }
  el.classList.add('is-dragging')
  document.body.setAttribute('data-drag-active', 'true')

  function onMove(ev) {
    if (!dragState) return
    const dx = ev.clientX - dragState.cx
    const dy = ev.clientY - dragState.cy
    if (!dragState.moved && Math.abs(dx) + Math.abs(dy) > 3) dragState.moved = true
    /* 预览用 transform：跟手移动，不触发页面重排 */
    dragState.el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
  }
  function finish() {
    if (!dragState) return
    const { el: target, container: cont, moduleId: m, elementKey: k, w, origTransform, pointerId, moved } = dragState
    /* 清理拖拽态（但保留 transform 预览：元素停在拖后位置，等确认/撤销） */
    target.classList.remove('is-dragging')
    document.body.removeAttribute('data-drag-active')
    clearDragHandlers()
    try { target.releasePointerCapture?.(pointerId) } catch (_) {}
    dragState = null
    /* 只是点了一下手柄（没拖动）→ 恢复原 transform，不产生待确认位置 */
    if (!moved) {
      target.style.transform = origTransform
      return
    }
    /* 先取最终视觉 rect（transform 仍生效 → 含拖拽增量） */
    const rect = target.getBoundingClientRect()
    const c = cont.getBoundingClientRect()
    const fx = clamp(rect.left - c.left, 0, Math.max(0, c.width - rect.width))
    const fy = clamp(rect.top - c.top, 0, Math.max(0, c.height - rect.height))
    /* 元素保持拖后位置（预览残留，等确认/撤销恢复） */
    dragPreview = { el: target, origTransform }
    /* 暂存待确认（不写 layout / 不持久化 / 不重排）；w = 拖拽前记录的像素宽度 */
    stageElementPos(m, k, { x: fx, y: fy, w }, { width: c.width, height: c.height })
    schedule() /* 高亮框跟随预览位置 */
  }

  dragHandlers = { onMove, finish }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', finish)
  window.addEventListener('pointercancel', finish)
  try { el.setPointerCapture?.(e.pointerId) } catch (_) {}
}

/* ================= 分步确认：确认修改 / 撤销 ================= */
function confirmPending() {
  const p = pendingPos.value
  if (!p) return
  /* 历史包装的写入（% 换算 + 持久化 + 可撤销）→ editable.apply() 落地 absolute 定位；
     宽度 w 一并写入，摆放后保持原宽（不被 fit-content 缩成内容宽） */
  historySetElementPos(p.moduleId, p.elementKey, { x: p.x, y: p.y, w: p.w }, p.containerSize)
  clearPreviewTransform()
  cancelPendingPos()
  schedule()
}

function cancelPending() {
  const p = pendingPos.value
  if (p) clearPreviewTransform()
  cancelPendingPos()
  schedule()
}

/* 选中变化 / 退出编辑态：自动撤销待确认位置（清除预览 + 清暂存） */
watch([selection, editing], () => {
  if (pendingPos.value) {
    clearPreviewTransform()
    cancelPendingPos()
    schedule()
  }
})
</script>

<template>
  <div
    v-if="box.show"
    class="sel-box"
    :style="{
      transform: `translate(${box.x}px, ${box.y}px)`,
      width: box.w + 'px',
      height: box.h + 'px'
    }"
    aria-hidden="true"
  >
    <span v-if="label" class="sel-box__label">{{ label }}</span>

    <!-- ======== 选中框下方操作区：复制/粘贴工具条 + 拖拽确认/撤销条 ======== -->
    <div class="sel-tools" @pointerdown.stop @click.stop>
      <div v-if="toolVisible" class="sel-tool">
        <button
          type="button"
          class="sel-tool__btn"
          :title="copyL[lang]"
          @click="doCopy"
        >⧉ {{ copyL[lang] }}</button>
        <button
          type="button"
          class="sel-tool__btn"
          :class="{ 'sel-tool__btn--muted': !pasteEnabled }"
          :disabled="!pasteEnabled"
          :title="pasteL[lang]"
          @click="doPaste"
        >📋 {{ pasteL[lang] }}</button>
        <span v-if="toolbarMsg" class="sel-tool__msg">{{ toolbarMsg }}</span>
      </div>

      <div v-if="pendingPos" class="sel-confirm">
        <button
          type="button"
          class="sel-confirm__btn sel-confirm__btn--ok"
          @click="confirmPending"
        >✓ {{ confirmL[lang] }}</button>
        <button
          type="button"
          class="sel-confirm__btn sel-confirm__btn--no"
          @click="cancelPending"
        >✕ {{ cancelL[lang] }}</button>
      </div>
    </div>

    <!-- ======== 右下角拖拽摆放手柄（元素级选中 + 模块开启拖拽摆放） ======== -->
    <span
      v-if="dragHandleVisible"
      class="sel-drag"
      role="button"
      :title="dragL[lang]"
      :aria-label="dragL[lang]"
      @pointerdown.stop="onDragStart"
    ></span>
  </div>
</template>

<style scoped>
.sel-box {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  pointer-events: none;
  border: 2px solid #37d9f2;
  border-radius: 6px;
  box-shadow:
    0 0 0 1px rgba(55, 217, 242, 0.3),
    0 0 18px rgba(55, 217, 242, 0.55),
    inset 0 0 16px rgba(55, 217, 242, 0.12);
  transition: transform 0.12s var(--ease-out, ease-out);
}
.sel-box__label {
  position: absolute;
  top: -24px;
  left: -2px;
  padding: 3px 9px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #06121a;
  background: linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%);
  border-radius: 5px 5px 5px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  white-space: nowrap;
}

/* ================= 选中框下方操作区（工具条 + 拖拽确认条） ================= */
.sel-tools {
  position: absolute;
  top: calc(100% + 6px);
  left: -2px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  pointer-events: auto; /* 操作区可交互（父框是 pointer-events:none） */
}
.sel-tool {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 8px;
  background: rgba(8, 12, 24, 0.94);
  border: 1px solid rgba(130, 165, 255, 0.32);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4), 0 0 14px rgba(55, 217, 242, 0.18);
  white-space: nowrap;
}
.sel-tool__btn {
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  color: #e9effc;
  background: rgba(55, 217, 242, 0.14);
  border: 1px solid rgba(130, 165, 255, 0.35);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s var(--ease-out, ease-out);
}
.sel-tool__btn:hover:not(:disabled) {
  color: #06121a;
  background: linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%);
  border-color: transparent;
}
.sel-tool__btn--muted { opacity: 0.45; }
.sel-tool__btn:disabled { cursor: default; }
.sel-tool__msg {
  padding: 0 6px;
  font-size: 11px;
  color: rgba(180, 220, 255, 0.9);
}

/* ================= 拖拽摆放确认 / 撤销条 ================= */
.sel-confirm {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 8px;
  background: rgba(8, 12, 24, 0.96);
  border: 1px solid rgba(55, 217, 242, 0.5);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45), 0 0 14px rgba(55, 217, 242, 0.25);
  white-space: nowrap;
}
.sel-confirm__btn {
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  color: #e9effc;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s var(--ease-out, ease-out);
}
.sel-confirm__btn--ok {
  background: rgba(52, 211, 153, 0.16);
  border: 1px solid rgba(52, 211, 153, 0.55);
}
.sel-confirm__btn--ok:hover {
  color: #06121a;
  background: #34d399;
  border-color: transparent;
}
.sel-confirm__btn--no {
  background: rgba(248, 113, 113, 0.16);
  border: 1px solid rgba(248, 113, 113, 0.55);
}
.sel-confirm__btn--no:hover {
  color: #06121a;
  background: #f87171;
  border-color: transparent;
}

/* ================= 右下角拖拽摆放手柄（取代原缩放光标） ================= */
.sel-drag {
  position: absolute;
  right: -7px;
  bottom: -7px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  pointer-events: auto; /* 手柄可交互 */
  cursor: grab;
  background: #06121a;
  border: 2px solid #37d9f2;
  box-shadow: 0 0 0 2px rgba(8, 12, 24, 0.6), 0 0 12px rgba(55, 217, 242, 0.65);
  touch-action: none;
}
.sel-drag::after {
  content: '';
  position: absolute;
  inset: 2px;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2337d9f2" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"/><path d="m8 6 4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4M18 8l4 4-4 4"/></svg>') center/contain no-repeat;
}
.sel-drag:hover {
  transform: scale(1.2);
  border-color: #a5f3fc;
}
.sel-drag:active { cursor: grabbing; }
</style>
