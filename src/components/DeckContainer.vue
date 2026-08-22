<script setup>
/**
 * DeckContainer — 翻页演示容器（PPT 风格，每模块一屏）
 * ------------------------------------------------------------
 * 形态：mode === 'deck' 时由 App 渲染本组件，替代滚动长页的
 *   ModuleSection 流；共享同一批模块组件与同一套配置/内容/主题。
 *
 * 功能：
 *   1. 每模块一屏（100vh），屏内垂直居中；内容超高时屏内滚动。
 *   2. 整屏切换：translateY 轨道 + CSS 平滑过渡（屏间滑动 + 深度缩放）。
 *   3. 交互：
 *      - 键盘：方向键 / 空格 / PageUp/PageDown / Home / End
 *      - 鼠标滚轮（累积 + 切换锁，避免一次滚多屏）
 *      - 触摸滑动（移动端整屏滑动翻页）
 *      - 屏幕边缘按钮、右侧导航点、顶部导航锚点（App 转发）
 *   4. 懒挂载：只渲染当前屏 ±1（上一/当前/下一）。目标屏在切屏前
 *      已挂载 → 进入时 markModuleRevealed 触发模块内部 reveal
 *      （进度条/环形图等），TextReveal 文字动画随挂载播放。
 *   5. 不建任何 ScrollTrigger：翻页形态禁用滚动入场动画（模块直接
 *      显示），动画系统（useReveal/TextReveal）本身零改动。
 *   6. 小屏自适应：<768px 隐藏边缘按钮、收紧导航点；屏内内容超高
 *      自动滚动（整屏自适应，可继续翻页）。
 *
 * Props：modules（启用模块列表，已排序）、lang（当前语言）
 * Emits：change(moduleId) —— 当前屏变化，供 App 导航高亮跟随
 * Expose：goTo(index) / goToId(id) / next() / prev() / index
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import ModuleSection from '@/components/ModuleSection.vue'

const props = defineProps({
  modules: { type: Array, default: () => [] },
  lang: { type: String, default: 'zh' }
})
const emit = defineEmits(['change'])

/* ---------- 当前屏 ---------- */
const index = ref(0)
const count = computed(() => props.modules.length)
const currentId = computed(() => props.modules[index.value]?.id ?? null)

/* ---------- 轨道样式：translateY(-index * 100%)，每屏一视口 ---------- */
const trackStyle = computed(() => ({
  transform: `translate3d(0, ${-index.value * 100}%, 0)`
}))

/* ---------- 切换锁：锁定切换过渡期间，防止一次滚多屏 / 连按跳屏 ---------- */
const LOCK_MS = 700 /* 与 --dur-slow(0.6s) 过渡时长对齐，略留余量 */
const locked = ref(false)
let lockTimer = null
function lock() {
  locked.value = true
  clearTimeout(lockTimer)
  lockTimer = setTimeout(() => { locked.value = false }, LOCK_MS)
}

function clamp(i) { return Math.max(0, Math.min(count.value - 1, i)) }

function goTo(i) {
  const next = clamp(i)
  if (next === index.value || locked.value) return
  index.value = next
  lock()
  resetActiveScroll()
}
function next() { goTo(index.value + 1) }
function prev() { goTo(index.value - 1) }

/** 跳转到某模块 id 对应的屏（导航锚点 / 控制台用） */
function goToId(id) {
  const i = props.modules.findIndex((m) => m.id === id)
  if (i >= 0) goTo(i)
}

/* ---------- 切屏后：目标屏内容从顶部开始（屏内若已滚动则复位） ---------- */
const slideEls = []
function setSlideRef(el, i) {
  if (el) slideEls[i] = el
}
function resetActiveScroll() {
  setTimeout(() => {
    const el = slideEls[index.value]
    if (el) el.scrollTop = 0
  }, LOCK_MS)
}

/* ---------- 懒挂载窗口：当前 ±1（上一/当前/下一屏） ---------- */
function isNear(i) {
  return Math.abs(i - index.value) <= 1
}

/* ---------- 键盘控制 ---------- */
function isEditable(t) {
  return !!t && (
    t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' ||
    t.tagName === 'SELECT' || t.isContentEditable
  )
}
function onKeydown(e) {
  if (isEditable(e.target)) return
  const k = e.key
  /* 空格在按钮上聚焦时不劫持（让按钮本身可被空格激活） */
  if (k === ' ' && e.target && e.target.tagName === 'BUTTON') return

  if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'PageDown' || k === ' ') {
    e.preventDefault(); next()
  } else if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'PageUp') {
    e.preventDefault(); prev()
  } else if (k === 'Home') {
    e.preventDefault(); goTo(0)
  } else if (k === 'End') {
    e.preventDefault(); goTo(count.value - 1)
  }
}

/* ---------- 鼠标滚轮（累积 deltaY + 锁，避免一次滚多屏） ---------- */
let wheelAccum = 0
function onWheel(e) {
  e.preventDefault()
  if (locked.value) { wheelAccum = 0; return }
  wheelAccum += e.deltaY
  if (Math.abs(wheelAccum) >= 48) {
    if (wheelAccum > 0) next(); else prev()
    wheelAccum = 0
  }
}

/* ---------- 触摸滑动（移动端整屏翻页） ---------- */
let touchY = 0
let touchX = 0
function onTouchStart(e) {
  touchY = e.touches[0].clientY
  touchX = e.touches[0].clientX
}
function onTouchEnd(e) {
  const dy = e.changedTouches[0].clientY - touchY
  const dx = e.changedTouches[0].clientX - touchX
  if (Math.abs(dy) < 48) return
  if (Math.abs(dy) > Math.abs(dx)) {
    if (dy < 0) next(); else prev()
  }
}

/* ---------- 屏内锚点（事件委托）：模块内部的 <a href="#id">（如 Hero 的
   CTA「查看作品」#projects）在翻页形态下点击 = 跳到对应屏。
   模块组件零改动：在容器层拦截，命中模块 id 才翻页。 ---------- */
function onAnchorClick(e) {
  const a = e.target.closest?.('a[href^="#"]')
  if (!a) return
  const id = (a.getAttribute('href') || '').slice(1)
  if (!id) return
  const i = props.modules.findIndex((m) => m.id === id)
  if (i >= 0) {
    e.preventDefault()
    goTo(i)
  }
}

/* ---------- 生命周期 ---------- */
const viewportRef = ref(null)
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  const vp = viewportRef.value
  if (vp) {
    vp.addEventListener('wheel', onWheel, { passive: false })
    vp.addEventListener('touchstart', onTouchStart, { passive: true })
    vp.addEventListener('touchend', onTouchEnd, { passive: true })
    vp.addEventListener('click', onAnchorClick)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  const vp = viewportRef.value
  if (vp) {
    vp.removeEventListener('wheel', onWheel)
    vp.removeEventListener('touchstart', onTouchStart)
    vp.removeEventListener('touchend', onTouchEnd)
    vp.removeEventListener('click', onAnchorClick)
  }
  clearTimeout(lockTimer)
})

/* ---------- 模块增减 / 越界收敛 ---------- */
watch(count, (c) => {
  if (index.value > c - 1) index.value = Math.max(0, c - 1)
})
/* 屏变化 → 通知 App（导航高亮跟随）；immediate 让首屏进入翻页形态
   时立即高亮（否则要等第一次切屏才亮） */
watch(index, (i) => {
  emit('change', props.modules[i]?.id ?? null)
}, { immediate: true })

/* ---------- 对外接口 ---------- */
defineExpose({ goTo, goToId, next, prev, index })

/* ---------- 文案（本地词典，跟随语言） ---------- */
const labelOf = (m) => m.label?.[props.lang] ?? m.label?.zh ?? m.id
const A = {
  zh: { prev: '上一屏', next: '下一屏', dots: '跳转屏', page: '页' },
  en: { prev: 'Previous slide', next: 'Next slide', dots: 'Go to slide', page: '/' }
}
const a = computed(() => A[props.lang] ?? A.zh)
</script>

<template>
  <div ref="viewportRef" class="deck" data-mode="deck">
    <!-- 轨道：所有屏纵向排布，translateY 整屏切换 -->
    <div class="deck__track" :style="trackStyle">
      <section
        v-for="(m, i) in modules"
        :key="m.id"
        :ref="(el) => setSlideRef(el, i)"
        class="deck__slide"
        :class="{ 'deck__slide--active': i === index }"
        :data-module="m.id"
      >
        <div class="deck__slide-inner">
          <!-- 懒挂载：当前屏 ±1 才挂载模块内容（切屏时才触发文字动画） -->
          <div v-if="isNear(i)" class="deck__slide-content">
            <ModuleSection
              :module="m"
              :lang="lang"
              reveal-mode="deck"
              :active="i === index"
            />
          </div>
        </div>
      </section>
    </div>

    <!-- 屏幕边缘翻页按钮 -->
    <button
      v-if="index > 0"
      class="deck__nav deck__nav--prev glass-btn"
      type="button"
      :aria-label="a.prev"
      @click="prev"
    >‹</button>
    <button
      v-if="index < count - 1"
      class="deck__nav deck__nav--next glass-btn"
      type="button"
      :aria-label="a.next"
      @click="next"
    >›</button>

    <!-- 右侧导航点 -->
    <nav class="deck__dots" :aria-label="a.dots">
      <button
        v-for="(m, i) in modules"
        :key="m.id"
        type="button"
        class="deck__dot"
        :class="{ 'deck__dot--active': i === index }"
        :title="labelOf(m)"
        :aria-label="`${labelOf(m)} ${i + 1} ${a.page} ${count}`"
        :aria-current="i === index ? 'true' : undefined"
        @click="goTo(i)"
      ></button>
    </nav>

    <!-- 页码计数 -->
    <span class="deck__counter" aria-hidden="true">{{ index + 1 }} / {{ count }}</span>
  </div>
</template>

<style scoped>
/* 全屏视口：覆盖在站点背景之上、顶部导航之下 */
.deck {
  position: fixed;
  inset: 0;
  z-index: 5;
  overflow: hidden;
}

/* 轨道：纵向排布全部屏，transform 整屏滑动 */
.deck__track {
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: transform var(--dur-slow) var(--ease-out);
  will-change: transform;
}

/* 每屏一视口 */
.deck__slide {
  flex: 0 0 100%;
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  /* 非当前屏：轻微缩小 + 降透明，突出当前屏（深度感） */
  opacity: 0.45;
  transform: scale(0.96);
  transition:
    opacity var(--dur-base) var(--ease-out),
    transform var(--dur-base) var(--ease-out);
}
.deck__slide--active {
  opacity: 1;
  transform: scale(1);
}

/* 屏内布局：内容垂直居中；内容超高时自动从顶部滚动 */
.deck__slide-inner {
  min-height: 100%;
  box-sizing: border-box;
  display: flex;
  padding:
    calc(var(--header-h) + var(--space-4))
    var(--space-5)
    var(--space-6);
}
.deck__slide-content {
  margin: auto;   /* 双轴居中；内容超高时 margin 归零、可滚到顶部 */
  width: 100%;
}

/* ---------- 屏幕边缘翻页按钮 ---------- */
.deck__nav {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  width: 44px;
  height: 44px;
  padding: 0;
  font-size: var(--fs-xl);
  line-height: 1;
}
.deck__nav--prev { left: var(--space-4); }
.deck__nav--next { right: var(--space-4); }

/* ---------- 右侧导航点 ---------- */
.deck__dots {
  position: fixed;
  right: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.deck__dot {
  width: 10px;
  height: 10px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid var(--glass-border-hover);
  background: transparent;
  transition:
    background var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}
.deck__dot:hover {
  border-color: var(--accent-cyan);
  transform: scale(1.25);
}
.deck__dot--active {
  background: var(--accent-gradient);
  border-color: transparent;
  box-shadow: var(--shadow-glow);
}

/* ---------- 页码计数 ---------- */
.deck__counter {
  position: fixed;
  left: var(--space-4);
  bottom: var(--space-4);
  z-index: 20;
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

/* ---------- 窄屏（<768px）：隐藏边缘按钮、收紧导航点，屏内自适应滚动 ---------- */
@media (max-width: 767px) {
  .deck__nav { display: none; }
  .deck__dots { right: var(--space-2); gap: var(--space-1); }
  .deck__dot { width: 8px; height: 8px; }
  .deck__counter { display: none; }
  .deck__slide-inner { padding-top: calc(var(--header-h) + var(--space-2)); }
}
</style>
