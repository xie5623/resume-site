/* ============================================================
   src/animations/index.js — 动画系统统一出口
   ------------------------------------------------------------
   其它成员 / 模块组件统一从这里引入动画能力：
     import {
       setupAnimations,
       useReveal,
       useTextAnim,
       TextReveal,
       isMotionReduced,
       isSmallScreen,
       shouldSimplifyMotion
     } from '@/animations'
   全局初始化只需在 main.js 挂载前调一次 setupAnimations()。
   ============================================================ */

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export {
  useReveal,
  REVEAL_PRESETS,
  REVEAL_PRESET_NAMES,
  resolveAnimName
} from '@/composables/useReveal'
export {
  useTextAnim,
  TEXT_ANIM_PRESETS,
  TEXT_ANIM_PRESET_NAMES,
  resolveTextAnimName
} from '@/composables/useTextAnim'
/* 动效检测统一走 useMotion.js（i18n-dev 契约）；motion.js 是兼容层 */
export {
  isMotionReduced,
  isNarrowScreen,
  isSmallScreen,
  shouldSimplifyMotion,
  useMotion,
  BP_MD,
  MOBILE_BREAKPOINT
} from '@/composables/motion'
export { default as TextReveal } from '@/components/TextReveal.vue'

/**
 * 全局初始化：注册 GSAP 插件、设全局默认、字体加载完刷新 ScrollTrigger。
 * 在 main.js 挂载前调用一次即可（可重复调用，幂等）。
 * @returns {gsap} 全局 gsap 实例
 */
export function setupAnimations() {
  gsap.registerPlugin(ScrollTrigger)
  /* 关键：确保 tween 的 scrollTrigger 速记能找到插件。
     某些环境/打包情况下 ScrollTrigger 内部的 _coreInitted 已被
     其它 gsap 实例占用，导致 enable() 不会把插件挂到本核心的
     _globals 上，从而 tween 里的 scrollTrigger 配置被忽略。这里
     显式把 ScrollTrigger 挂到本核心的全局表，一劳永逸。 */
  gsap.core.globals('ScrollTrigger', ScrollTrigger)
  gsap.defaults({ ease: 'power2.out' })
  /* 忽略移动端 resize 造成的 trigger 位置抖动 */
  ScrollTrigger.config({ ignoreMobileResize: true })
  /* 字体加载完成后刷新 trigger，避免换行/尺寸变化导致触发位置偏移 */
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {})
  }
  return gsap
}
