/* ============================================================
   useReveal.js — 滚动入场动画 composable（GSAP + ScrollTrigger）
   ------------------------------------------------------------
   【模式一 · 推荐，模块组件按 ARCHITECTURE.md 契约调用】
     import { useReveal } from '@/composables/useReveal'
     const { revealRef, revealed } = useReveal(config.animation, { delay: 0.1 })

     <section :ref="revealRef" class="...">   <!-- 绑定到根元素 -->

     - revealRef : 绑定到根元素的 ref（ScrollTrigger 监听它进入视口）
     - revealed  : ref<boolean>，进入视口后为 true，可用于联动其它逻辑
     - cleanup   : 手动清理函数（组件卸载时自动调用，一般无需手动）

   【模式二 · 直接传元素】
     import { useReveal } from '@/composables/useReveal'
     const { cleanup, revealed } = useReveal(elOrRef, { animation: 'fade-up', delay: 0 })
     - elOrRef : 原生元素 / Vue ref / 函数 ref
     - 返回 cleanup 清理函数 + revealed 状态 ref

   预设列表见 REVEAL_PRESETS。
   覆盖 config 的 ALLOWED_ANIMATIONS（fade-up/fade-down/fade-left/
   fade-right/zoom-in/flip-up/slide-blur/none），并额外支持任务要求的：
     fade-in / slide-left / slide-right / scale-in / blur-in /
     flip-in / stagger-children（子元素错峰）

   小屏或系统"减少动态"时自动降级为纯透明度（见 shouldSimplifyMotion）。
   ============================================================ */

import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ANIMATION_DURATION } from '@/config/site.config'
import {
  isMotionReduced,
  isSmallScreen,
  shouldSimplifyMotion,
  resolveElement
} from './motion'

/* 注册插件（幂等，可重复调用） */
gsap.registerPlugin(ScrollTrigger)
/* 关键：显式把 ScrollTrigger 挂到本核心全局表，保证 tween 的
   scrollTrigger 速记可用（见 src/animations/index.js 的说明） */
gsap.core.globals('ScrollTrigger', ScrollTrigger)

/* 重新导出检测函数，方便 i18n-dev 等成员一处引入 */
export { isMotionReduced, isSmallScreen, shouldSimplifyMotion }

/** 默认入场时长：取 config 的 ANIMATION_DURATION.base（秒） */
const DEFAULT_DURATION = ANIMATION_DURATION?.base ?? 0.8

/* ===================== 入场动画预设表 ===================== */
/**
 * name → { from, to }。
 * from 为进入前的初始状态，to 为进入后的结束状态。
 * 组件挂载后立即被 gsap.set 到 from 状态，等滚动进入视口后动画到 to。
 */
export const REVEAL_PRESETS = {
  /* --- 方向淡入（config ALLOWED_ANIMATIONS 原有） --- */
  'fade-up':    { from: { opacity: 0, y: 48 },  to: { opacity: 1, y: 0 } },
  'fade-down':  { from: { opacity: 0, y: -48 }, to: { opacity: 1, y: 0 } },
  'fade-left':  { from: { opacity: 0, x: -48 }, to: { opacity: 1, x: 0 } },
  'fade-right': { from: { opacity: 0, x: 48 },  to: { opacity: 1, x: 0 } },

  /* --- 任务补充预设 --- */
  'fade-in':     { from: { opacity: 0 },              to: { opacity: 1 } },
  'slide-left':  { from: { x: -80, opacity: 0 },      to: { x: 0, opacity: 1 } },
  'slide-right': { from: { x: 80,  opacity: 0 },      to: { x: 0, opacity: 1 } },
  'zoom-in':     { from: { opacity: 0, scale: 0.9 },  to: { opacity: 1, scale: 1 } },
  'scale-in':    { from: { opacity: 0, scale: 0.85 }, to: { opacity: 1, scale: 1 } },
  'flip-up':     { from: { opacity: 0, y: 24, rotationX: -90, transformOrigin: '50% 0%' },
                   to:   { opacity: 1, y: 0,  rotationX: 0,   transformOrigin: '50% 0%' } },
  'flip-in':     { from: { opacity: 0, rotationY: -90, transformOrigin: '50% 50%' },
                   to:   { opacity: 1, rotationY: 0,   transformOrigin: '50% 50%' } },
  'slide-blur':  { from: { opacity: 0, y: 40, filter: 'blur(12px)' },
                   to:   { opacity: 1, y: 0,  filter: 'blur(0px)' } },
  'blur-in':     { from: { opacity: 0, filter: 'blur(16px)' },
                   to:   { opacity: 1, filter: 'blur(0px)' } },

  /* 子元素错峰：单独处理（见 revealElement），这里留空占位 */
  'stagger-children': null,

  /* 无动画：直接显示（revealElement 单独处理） */
  'none': null
}

/** 预设名列表（调试 / 阶段二下拉框扩展参考） */
export const REVEAL_PRESET_NAMES = Object.keys(REVEAL_PRESETS)

/**
 * 解析动画名：未知名字回退 'fade-up' 并在开发环境告警。
 * @param {string|undefined} name
 * @returns {string} 合法预设名
 */
export function resolveAnimName(name) {
  if (!name) return 'fade-up'
  const key = String(name).trim()
  if (REVEAL_PRESETS[key] !== undefined) return key
  if (import.meta.env.DEV) {
    console.warn(
      `[useReveal] 未知入场动画 "${key}"，已回退为 fade-up。可用：${REVEAL_PRESET_NAMES.join(', ')}`
    )
  }
  return 'fade-up'
}

/**
 * 同步把元素设为入场动画的「初始隐藏态」（首帧前调用，防屏闪）。
 * - none            : 清掉内联样式，保持可见（无动画）
 * - 简化动效        : 只隐藏透明度（最终态仍显示）
 * - stagger-children: 隐藏直接子元素
 * - 其它预设        : 应用 preset.from（含 transform/opacity/filter）
 * 之后 revealElement 的 gsap.fromTo 会以同样的 from 起步，视觉连续。
 */
function preHideState(el, animName) {
  if (!el) return
  const name = resolveAnimName(animName)

  if (name === 'none') {
    gsap.set(el, { clearProps: 'all' })
    return
  }

  if (shouldSimplifyMotion()) {
    gsap.set(el, { opacity: 0 })
    return
  }

  if (name === 'stagger-children') {
    const children = gsap.utils.toArray(el.children).filter((c) => c.nodeType === 1)
    gsap.set(children, { opacity: 0, y: 24 })
    return
  }

  const preset = REVEAL_PRESETS[name]
  if (preset) gsap.set(el, preset.from)
}

/**
 * 核心：在单个元素上挂载滚动入场动画（两种调用模式共用）。
 * 说明：不用 tween 的 `scrollTrigger` 速记（gsap 3.15 在本项目
 * 环境里速记偶尔不生效），改为「显式 ScrollTrigger.create + 手动
 * 关联 tween」，行为等价且稳定。
 *
 * @param {HTMLElement} el            目标元素
 * @param {string}      animName      动画名
 * @param {object}      [opts]        { delay, duration, once, ease, start }
 * @param {object}      [revealedRef] 可选：ref<boolean>，进入视口时置 true
 * @returns {() => void} 清理函数
 */
function revealElement(el, animName, opts = {}, revealedRef) {
  const name = resolveAnimName(animName)
  const {
    delay = 0,
    duration = DEFAULT_DURATION,
    once = true,
    ease = 'power2.out',
    start = 'top 85%'
  } = opts

  const setRevealed = (v) => { if (revealedRef) revealedRef.value = v }
  const baseTrigger = { trigger: el, start, once }
  const onEnter = () => setRevealed(true)

  /* 1) 无动画：直接显示 */
  if (name === 'none') {
    gsap.set(el, { clearProps: 'all' })
    setRevealed(true)
    return () => {}
  }

  /**
   * 建 tween + ScrollTrigger 并手动关联。
   * @param {object} from  from 状态
   * @param {object} to    to 状态（含 duration/delay/ease/onComplete）
   * @param {object} [extraTriggerVars] 额外的 trigger 配置
   * @returns {{tween: object, scrollTrigger: object}}
   */
  const link = (from, to, extraTriggerVars = {}) => {
    const tween = gsap.fromTo(el, from, to)
    const scrollTrigger = ScrollTrigger.create({
      ...baseTrigger,
      ...extraTriggerVars,
      animation: tween,
      onEnter
    })
    /* 手动关联（防御 gsap 3.15 在部分环境不写回 tween.scrollTrigger） */
    tween.scrollTrigger = scrollTrigger
    return { tween, scrollTrigger }
  }

  const cleanupOf = ({ tween, scrollTrigger }, targets) => () => {
    scrollTrigger?.kill()
    tween?.kill()
    gsap.set(targets || el, { clearProps: 'all' })
  }

  /* 2) 简化模式（小屏 / 减少动态）：只做纯透明度，时长取 fast */
  if (shouldSimplifyMotion()) {
    const a = link(
      { opacity: 0 },
      {
        opacity: 1,
        duration: ANIMATION_DURATION?.fast ?? 0.5,
        delay,
        ease: 'power1.out',
        onComplete: () => setRevealed(true)
      }
    )
    return cleanupOf(a)
  }

  /* 3) stagger-children：直接子元素错峰入场 */
  if (name === 'stagger-children') {
    const children = gsap.utils.toArray(el.children).filter((c) => c.nodeType === 1)
    /* 无子元素时退化为 fade-up */
    if (!children.length) {
      const a = link(
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration, delay, ease, onComplete: () => setRevealed(true) }
      )
      return cleanupOf(a)
    }
    gsap.set(children, { opacity: 0, y: 24 })
    const tween = gsap.to(children, {
      opacity: 1, y: 0,
      duration, delay, ease,
      stagger: 0.08,
      onComplete: () => setRevealed(true)
    })
    const scrollTrigger = ScrollTrigger.create({ ...baseTrigger, animation: tween, onEnter })
    tween.scrollTrigger = scrollTrigger
    return cleanupOf({ tween, scrollTrigger }, children)
  }

  /* 4) 常规预设：fromTo + ScrollTrigger */
  const preset = REVEAL_PRESETS[name]
  const a = link(
    preset.from,
    {
      ...preset.to,
      duration,
      delay,
      ease,
      onComplete: () => setRevealed(true)
    },
    /* once=false 时允许滚动离开后反向隐藏（回到初始态） */
    once ? {} : { toggleActions: 'play none none reverse' }
  )
  return cleanupOf(a)
}

/* ===================== 对外主入口 ===================== */
/**
 * useReveal(anim, options?) → { revealRef, revealed, cleanup }
 * 或 useReveal(elOrRef, { animation, ... }) → { cleanup, revealed }
 *
 * options 可选字段：
 *   delay    : 动画延迟（秒），默认 0
 *   duration : 动画时长（秒），默认取 config ANIMATION_DURATION.base
 *   once     : 是否只播一次，默认 true（滚动离开不反向隐藏）
 *   ease     : 缓动函数，默认 'power2.out'
 *   start    : ScrollTrigger 触发位置，默认 'top 85%'
 */
export function useReveal(animOrEl, options = {}) {
  /* -------- 模式二：直接传入元素 / ref -------- */
  if (typeof animOrEl !== 'string') {
    const revealed = ref(false)
    const { animation = 'fade-up' } = options
    let cleanup = () => {}
    let inited = false

    const setup = (el) => {
      if (!el || inited) return
      inited = true
      /* 关键：先同步把元素设为动画「初始隐藏态」——否则元素先以完整可见态
         渲染出首帧，再被下一帧隐藏并重新淡入，形成「闪一下再消失」的屏闪。
         这里同步 pre-hide 保证第一帧即为隐藏态。 */
      preHideState(el, animation)
      /* 延迟到下一帧，确保布局完成后再建 ScrollTrigger（见模式一注释） */
      requestAnimationFrame(() => {
        if (!el.isConnected) return
        cleanup = revealElement(el, animation, options, revealed)
      })
    }

    const el = resolveElement(animOrEl)
    if (el) setup(el)
    else if (animOrEl && animOrEl.value !== undefined) {
      /* Vue ref：等元素挂载后再初始化 */
      watch(animOrEl, (v) => setup(resolveElement(v)), { flush: 'post' })
      onMounted(() => setup(resolveElement(animOrEl)))
    }
    onBeforeUnmount(() => cleanup())
    return { cleanup, revealed }
  }

  /* -------- 模式一：动画名字符串（ARCHITECTURE.md 契约） -------- */
  const anim = options.animation ?? animOrEl
  const revealed = ref(false)
  let cleanup = () => {}
  let inited = false
  let currentEl = null

  /**
   * revealRef —— 以「函数 ref」实现（兼容性最强的形态）。
   *
   * 模板里 `:ref="revealRef"` 时，Vue 会在元素挂载/卸载时用元素
   * （或 null）调用它，从而拿到目标元素。之所以用函数而非普通
   * `ref()` 对象：本环境的 Vue 渲染上下文会把 `$setup` 里的 ref
   * 解包，导致 `:ref="对象ref"` 绑定收不到元素；函数 ref 在任意
   * 环境都能正常工作（Vue 会直接调用）。
   *
   * 同时镜像 `.value` 属性，兼容"读取 revealRef.value"的调用方。
   *
   * 注意：真正挂载 ScrollTrigger 延迟到 requestAnimationFrame。
   * 若在 Vue 渲染/挂载同步阶段就创建 trigger，浏览器尚未完成整页
   * 布局（元素 rect 为 0、文档高度未展开），ScrollTrigger 会把
   * start 算成负值导致一进页面就触发。延后到下一帧再建 trigger，
   * 保证测到的位置是最终布局。
   */
  function revealRef(node) {
    revealRef.value = node || null
    if (!inited && node) {
      inited = true
      const el = node
      /* 同步 pre-hide：避免首帧完整显示再隐藏的屏闪（同模式二） */
      preHideState(el, anim)
      requestAnimationFrame(() => {
        if (!el.isConnected) return
        cleanup = revealElement(el, anim, options, revealed)
      })
    }
    currentEl = node || currentEl
  }
  revealRef.value = null

  onBeforeUnmount(() => cleanup())

  return { revealRef, revealed, cleanup }
}
