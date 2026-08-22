<script setup>
/**
 * SelectionBox — 选中高亮框 + 复制/粘贴工具条 + 缩放手柄（需求 2 / 6）
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
 * 需求 6（interaction-dev t5）新增：
 *   - 复制 / 粘贴工具条：选中任意元素（模块/条目/文字）后出现，
 *     复制走 copySelection，粘贴走 pasteSelection（useEditorActions，
 *     与 Ctrl+C/Ctrl+V 同一套逻辑，粘贴可撤销）。
 *   - 右下角缩放手柄（元素级选中时）：pointer 拖拽实时调整大小——
 *        · 技能气泡（skills variant d 的列表条目）→ 直径 px（number size，
 *          写 items.<index>，resolveBubbleSize 消费 → --d 实时生效）；
 *        · 通用元素（文字块/标题等）→ { w, unit:'px' }（写元素级 size，
 *          v-element-style 落地 --el-w；高度自动回流不裁剪）。
 *     拖拽期间实时预览、不打断编辑；松手把拖前快照入栈 = 一次撤销。
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useSelection } from '@/composables/useSelection'
import { useI18n } from '@/i18n'
import { MODULE_LABELS } from '@/config/site.config'
import { useEditorActions } from '@/composables/useEditorActions'
import { setElementStyle } from '@/composables/useElementStyle'
import { capture, push } from '@/composables/useHistory'
import { getTemplateModules } from '@/composables/useTemplates'
import { version } from '@/composables/useVersion'
import { editing } from '@/composables/useEditingMode'

const { selection, getSelectionRect } = useSelection()
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
  onResizeEnd()
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
const handleL = { zh: '拖拽右下角调整大小', en: 'Drag corner to resize' }

/* ================= 右下角缩放手柄（需求 6 · 元素级选中） ================= */
const resizing = ref(false)
let resizeState = null

const handleVisible = computed(() => editing.value && selection.value?.kind === 'element')

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }

/** 元素级样式的键：列表条目 → `${listKey}.<index>`；标量 → 元素 key。
    气泡单条 v-editable（key='items.<n>'）直接是条目路径，原样返回。 */
function styleKeyOf(sel) {
  if (Number.isInteger(sel.itemIndex)) return `${sel.elementKey}.${sel.itemIndex}`
  return sel.elementKey
}

/** 从选中态解析「列表条目信息」：itemIndex 优先；气泡单条 key（items.<n>）
    或气泡内字段 key（items.<n>.name / items.<n>.level）归一化成条目下标 */
function itemInfoOf(sel) {
  if (Number.isInteger(sel.itemIndex)) return { index: sel.itemIndex }
  const m = /^(.+)\.(\d+)$/.exec(sel.elementKey || '')
  if (m) return { index: Number(m[2]) }
  const m2 = /^(.+)\.(\d+)\.(name|level)$/.exec(sel.elementKey || '')
  return m2 ? { index: Number(m2[2]) } : null
}

/** 气泡缩放手柄的目标键：条目 key（items.<n>）；气泡内字段选中归一化为条目键 */
function bubbleKeyOf(sel) {
  if (Number.isInteger(sel.itemIndex)) return `${sel.elementKey}.${sel.itemIndex}`
  const m = /^(.+)\.(\d+)$/.exec(sel.elementKey || '')
  if (m) return sel.elementKey
  const m2 = /^(.+)\.(\d+)\.(name|level)$/.exec(sel.elementKey || '')
  return m2 ? `${m2[1]}.${m2[2]}` : sel.elementKey
}

/** 是否气泡图条目：skills 模块 variant d 的列表条目（number size 消费方） */
function isBubbleTarget(sel) {
  if (!itemInfoOf(sel)) return false
  const list = getTemplateModules(version.value)
  const m = list.find((x) => x.id === sel.moduleId)
  return m && (m.type ?? m.id) === 'skills' && m.variant === 'd'
}

function onResizeStart(e) {
  if (!editing.value) return
  const sel = selection.value
  if (!sel || sel.kind !== 'element') return
  if (e.button != null && e.button !== 0) return
  const rect = getSelectionRect()
  if (!rect || rect.width < 2 || rect.height < 2) return
  e.preventDefault()
  e.stopPropagation()
  const bubble = isBubbleTarget(sel)
  /* 气泡基线用当前气泡直径 --d（而非窄文字框的宽度），拖拽增量相对当前大小 */
  let startW = rect.width
  if (bubble) {
    const info = itemInfoOf(sel)
    const bub = document.querySelector(`[data-module="${sel.moduleId}"] .hm-skills__bubble[data-item="${info?.index ?? ''}"]`)
    const d = bub ? parseFloat(bub.style.getPropertyValue('--d')) : NaN
    if (Number.isFinite(d) && d > 0) startW = d
  }
  resizeState = {
    startW,
    startH: rect.height,
    cx: e.clientX,
    cy: e.clientY,
    snapshot: capture(),          /* 拖前快照 → 松手入栈 = 一次撤销 */
    bubble,
    moduleId: sel.moduleId,
    /* 气泡（含 items.<n>.name/level 字段选中）→ 归一化为气泡条目键 items.<n>，
       通用元素 → 原选中键（styleKeyOf） */
    styleKey: bubble ? bubbleKeyOf(sel) : styleKeyOf(sel)
  }
  resizing.value = true
  document.body.classList.add('resizing-element')
  window.addEventListener('pointermove', onResizeMove)
  window.addEventListener('pointerup', onResizeEnd)
  window.addEventListener('pointercancel', onResizeEnd)
}

function onResizeMove(e) {
  if (!resizeState) return
  const dx = e.clientX - resizeState.cx
  const dy = e.clientY - resizeState.cy
  const { moduleId, styleKey } = resizeState

  if (resizeState.bubble) {
    /* 气泡：直径 px（number size）→ resolveBubbleSize 消费 → --d 实时生效 */
    const d = clamp(Math.round(resizeState.startW + Math.max(dx, dy)), 40, 220)
    setElementStyle(moduleId, styleKey, { size: d })
  } else {
    /* 通用元素：只写宽度（高度自动回流，避免文字被裁剪） */
    const w = clamp(Math.round(resizeState.startW + dx), 32, 1200)
    setElementStyle(moduleId, styleKey, { size: { w, unit: 'px' } })
  }
  schedule() /* 元素尺寸变化 → 高亮框跟随 */
}

function onResizeEnd() {
  if (!resizeState) return
  push(resizeState.snapshot)      /* 整个拖拽 = 一个可撤销单元 */
  resizeState = null
  resizing.value = false
  document.body.classList.remove('resizing-element')
  window.removeEventListener('pointermove', onResizeMove)
  window.removeEventListener('pointerup', onResizeEnd)
  window.removeEventListener('pointercancel', onResizeEnd)
}
</script>

<template>
  <div
    v-if="box.show"
    class="sel-box"
    :class="{ 'sel-box--resizing': resizing }"
    :style="{
      transform: `translate(${box.x}px, ${box.y}px)`,
      width: box.w + 'px',
      height: box.h + 'px'
    }"
    aria-hidden="true"
  >
    <span v-if="label" class="sel-box__label">{{ label }}</span>

    <!-- ======== 复制 / 粘贴工具条（需求 6） ======== -->
    <div v-if="toolVisible" class="sel-tool" @pointerdown.stop @click.stop>
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

    <!-- ======== 右下角缩放手柄（元素级选中 · 需求 6） ======== -->
    <span
      v-if="handleVisible"
      class="sel-resize"
      :title="handleL[lang]"
      role="slider"
      aria-orientation="diagonal"
      @pointerdown.stop="onResizeStart"
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
/* 拖缩放时：去掉过渡，跟手跟随 */
.sel-box--resizing {
  transition: none;
  border-style: dashed;
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

/* ================= 复制 / 粘贴工具条（需求 6） ================= */
.sel-tool {
  position: absolute;
  top: calc(100% + 6px);
  left: -2px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 8px;
  background: rgba(8, 12, 24, 0.94);
  border: 1px solid rgba(130, 165, 255, 0.32);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4), 0 0 14px rgba(55, 217, 242, 0.18);
  pointer-events: auto; /* 工具条可交互（父框是 pointer-events:none） */
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

/* ================= 右下角缩放手柄（需求 6） ================= */
.sel-resize {
  position: absolute;
  right: -7px;
  bottom: -7px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  pointer-events: auto; /* 手柄可交互 */
  cursor: nwse-resize;
  background: #06121a;
  border: 2px solid #37d9f2;
  box-shadow: 0 0 0 2px rgba(8, 12, 24, 0.6), 0 0 12px rgba(55, 217, 242, 0.65);
  touch-action: none;
}
.sel-resize::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-right: 2px solid #37d9f2;
  border-bottom: 2px solid #37d9f2;
  border-radius: 0 0 3px 0;
}
.sel-resize:hover {
  transform: scale(1.2);
  background: #37d9f2;
}
.sel-resize:hover::after { border-color: #06121a; }
</style>
