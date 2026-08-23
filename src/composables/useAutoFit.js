/* ============================================================
   useAutoFit.js — 内容自适应字号（阶段二核心）
   ------------------------------------------------------------
   目标：根据模块内容量自动调节字号——
     - 内容多（整块很高）→ 字号略小，让整块更紧凑（约贴近一屏）
     - 内容很少（整块很矮）→ 字号轻微放大，视觉更饱满
     - 中等内容 → 字号不变（scale = 1）

   API（契约，模块/装配层按此调用）：
     import { useAutoFit } from '@/composables/useAutoFit'
     const { fitRef, scale, modFontScale } = useAutoFit(elOrRef, {
       baseFontScale: 1        // 与 config.fontScale 乘算
     })

     - elOrRef   : 原生元素 / Vue ref / 函数 ref（模块容器）
     - fitRef    : 兼容函数 ref 形态的绑定函数（也可不用，直接用 elOrRef）
     - scale     : Ref<number>，纯自适应系数（0.8~1.6，由内容量得出）
     - modFontScale : ComputedRef<number> = baseFontScale × scale
                      （交给装配层再乘 emphasize 后作为 --fs-scale）

   实现：ResizeObserver + window resize + 字体加载后重算。
   带滞回（hysteresis）避免在阈值附近来回抖动。
   ============================================================ */

import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { resolveElement } from './motion'
import { FONT_SCALE_RANGE } from '@/config/site.config'

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/**
 * @param {*}      target           元素 / Vue ref / 函数 ref
 * @param {object} [options]
 * @param {number} [options.baseFontScale] 基础字号系数（config.fontScale）
 * @returns {{ fitRef: Function, scale: Ref<number>,
 *             modFontScale: import('vue').ComputedRef<number> }}
 */
export function useAutoFit(target, { baseFontScale = 1 } = {}) {
  const scale = ref(1)
  let ro = null
  let raf = 0
  let attached = false
  /* last 记录上次生效的 scale，用于滞回判断 */
  let last = 1

  function compute() {
    raf = 0
    const el = resolveElement(target)
    if (!el) return
    const hasWindow = typeof window !== 'undefined'
    const vh = hasWindow ? window.innerHeight : 800
    const clientH = el.clientHeight || el.offsetHeight
    const scrollH = el.scrollHeight
    if (!clientH || !scrollH) return

    /* 高度阈值：超过 = 内容偏多；低于 = 内容很少 */
    const maxH = vh * 1.05          // 整块高度的舒适上限（约一屏）
    const minH = vh * 0.35          // 低于此高度视为内容稀疏
    const shrinkEnter = maxH * 1.08 // 进入「缩小」模式的滞回上沿
    /* 注：shrinkExit（退出缩小的滞回下沿）已废弃——
       恢复判定改为「按当前 scale 折算回全字号高度」，见下方 last<1 分支 */

    let next
    if (scrollH > shrinkEnter) {
      /* 内容超高 → 按比例缩小，让整块高度 ≈ 一屏。
         已在缩小态时只允许继续缩小、不允许回弹（Math.min），
         否则在「连 0.8 最小字号都放不下」的超高区，会 0.8↔0.9 来回抖 */
      const target = clamp(maxH / scrollH, FONT_SCALE_RANGE.min, 1)
      next = last < 1 ? Math.min(last, target) : target
    } else if (last < 1) {
      /* 已处于缩小态：保持不动，直到「全字号下的高度」也不越界才恢复。
         scrollH / last 估算「全字号高度」：仍 ≥ shrinkEnter → 保持缩小，
         否则缩到 ≈maxH 时会被下一帧误判成「已恢复」→ 再缩小，来回震荡 */
      next = (scrollH / last) < shrinkEnter ? 1 : last
    } else if (clientH < minH) {
      /* 内容很少：轻微放大 */
      next = clamp(1.15, FONT_SCALE_RANGE.min, FONT_SCALE_RANGE.max)
    } else if (last > 1) {
      /* 已处于放大态：保持，直到「全字号高度」不再稀疏才恢复。
         clientH / last 估算「全字号高度」：超过 minH 才恢复 1 */
      next = (clientH / last) > minH ? 1 : last
    } else {
      next = 1
    }

    /* 滞回：变化太小时不动，避免抖动 */
    if (Math.abs(next - last) < 0.03) return
    last = next
    scale.value = next
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(compute)
  }

  function attach() {
    const el = resolveElement(target)
    if (!el || attached) return
    attached = true
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(schedule)
      ro.observe(el)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', schedule)
    }
    schedule()
    /* 字体加载完成后重算（换行/尺寸变化会影响高度） */
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(schedule).catch(() => {})
    }
  }

  /* 兼容三种传入形态：原生元素 / Vue ref / 函数 ref */
  const elNow = resolveElement(target)
  if (elNow) {
    attach()
  } else if (target && typeof target === 'object' && target.value !== undefined) {
    watch(target, (v) => { if (v) attach() }, { flush: 'post' })
  }
  onMounted(() => { if (!attached) attach() })

  onBeforeUnmount(() => {
    ro?.disconnect(); ro = null
    if (typeof window !== 'undefined') window.removeEventListener('resize', schedule)
    if (raf) cancelAnimationFrame(raf)
    attached = false
  })

  /* 函数 ref：供模板 :ref 绑定；此处直接转发给内部逻辑 */
  function fitRef(node) {
    if (node && !attached) attach()
  }

  const modFontScale = computed(() => baseFontScale * scale.value)

  return { fitRef, scale, modFontScale }
}
