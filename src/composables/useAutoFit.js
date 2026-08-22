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
    const shrinkExit = maxH * 0.9   // 退出「缩小」模式的滞回下沿

    let next
    if (last < 1) {
      /* 当前已处于缩小态：只有缩回 10% 余量才恢复原字号 */
      next = scrollH < shrinkExit
        ? 1
        : clamp(maxH / scrollH, FONT_SCALE_RANGE.min, 1)
    } else if (scrollH > shrinkEnter) {
      /* 内容多：按比例缩小，让整块高度 ≈ 一屏 */
      next = clamp(maxH / scrollH, FONT_SCALE_RANGE.min, 1)
    } else if (clientH < minH) {
      /* 内容很少：轻微放大 */
      next = clamp(1.15, FONT_SCALE_RANGE.min, FONT_SCALE_RANGE.max)
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
