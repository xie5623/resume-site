/* ============================================================
   motion.js — 动效检测的统一入口（轻量兼容层）
   ------------------------------------------------------------
   所有「是否减少动效 / 是否窄屏」的判定逻辑在 useMotion.js 中实现
   （i18n-dev 契约，见 ARCHITECTURE.md 6.2）。本文件只做三件事：
     1. re-export useMotion.js 的 isMotionReduced / isNarrowScreen /
        useMotion / BP_MD，保证其它成员一处引入；
     2. 提供 shouldSimplifyMotion() 组合判断（小屏 或 系统减少动效）；
     3. 提供 resolveElement() DOM 工具（供 useReveal/useTextAnim 用）。

   请勿在本文件重复实现 matchMedia 逻辑——统一改 useMotion.js。
   ============================================================ */

import {
  isMotionReduced,
  isNarrowScreen,
  useMotion,
  BP_MD,
  BP_SM,
  BP_LG
} from './useMotion'

export { isMotionReduced, isNarrowScreen, useMotion, BP_MD, BP_SM, BP_LG }

/** 旧名别名：isSmallScreen = isNarrowScreen（兼容旧引用） */
export const isSmallScreen = isNarrowScreen

/** 旧名别名：MOBILE_BREAKPOINT = BP_MD（兼容旧引用） */
export const MOBILE_BREAKPOINT = BP_MD

/**
 * 是否需要简化动效（小屏 或 系统"减少动态"）。
 * 简化为：入场只用纯透明度、文字动画直接显示最终态。
 */
export function shouldSimplifyMotion() {
  return isMotionReduced() || isNarrowScreen()
}

/**
 * 把 原生 DOM / Vue ref（.value）/ 函数 ref 统一解成真实元素。
 * @param {*} target
 * @returns {HTMLElement|null}
 */
export function resolveElement(target) {
  if (!target) return null
  if (typeof target === 'function') return target() || null
  if (target.nodeType) return target
  if (target.value !== undefined) return resolveElement(target.value)
  return null
}
