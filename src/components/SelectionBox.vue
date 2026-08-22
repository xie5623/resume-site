<script setup>
/**
 * SelectionBox — 选中高亮框（需求 2 双向联动的页面高亮层）
 * ------------------------------------------------------------
 * 跟随 useSelection() 的选中态，在页面上绘制一个绝对定位的
 * 发光描边框 + 角标：
 *   - 点左侧模块名 → selectModule(id) → 本框定位到 #moduleId 模块
 *   - 点页面元素 → selectElement + setSelectionEl(el) → 本框定位到该元素
 * 定位用 useSelection().getSelectionRect()（module 按 id 找容器，
 * element 用注入的 DOM 元素），fixed 坐标系 + scroll/resize 跟随。
 * - 不拦截任何指针事件（pointer-events: none），纯高亮层。
 * - 模块级选中：角标显示模块名；元素级选中：角标显示 模块名 · key。
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useSelection } from '@/composables/useSelection'
import { useI18n } from '@/i18n'
import { MODULE_LABELS } from '@/config/site.config'

const { selection, getSelectionRect } = useSelection()
const { lang } = useI18n()

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
</style>
