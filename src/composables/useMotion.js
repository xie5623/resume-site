/* ============================================================
   composables/useMotion.js — 动效降级与响应式策略（共享单例）
   ------------------------------------------------------------
   供 animator（useReveal / TextReveal）与各模块共同使用，避免各自
   重复实现「是否减少动效 / 是否窄屏」的判断。

   导出：
     - isMotionReduced()   → boolean，是否开启系统「减少动效」
                             （prefers-reduced-motion: reduce）
     - isNarrowScreen(w?)  → boolean，视口宽度是否 < BP_MD（窄屏/移动）
     - useMotion()         → composable，响应式：
         { motionReduced: Ref<boolean>,  系统减少动效
           narrow:        Ref<boolean>,  窄屏（< 768px）
           isMobile:      Ref<boolean>,  同 narrow（别名）
           simplified:    ComputedRef<boolean>  应简化动画
                             = motionReduced || narrow }
   降级策略约定：
     - simplified === true 时，入场/文字动画统一退化为「透明度过渡」：
       直接显示目标态，只做极短 opacity 过渡（或干脆 no-op）。
     - 打字机 typewriter 等重动画在窄屏/减少动效下强制关闭
       （TextReveal 消费 simplified 处理）。
   断点与 tokens.css 的 --bp-* 保持一致（改动时两边同步）。
   ============================================================ */

import { ref, computed } from 'vue'

/* 断点常量（与 styles/tokens.css 的 --bp-sm/md/lg 对齐） */
export const BP_SM = 480
export const BP_MD = 768
export const BP_LG = 1024

const hasWindow = typeof window !== 'undefined'

/* ---------- 独立判断函数（非响应式，供 animator 直接调用） ---------- */
export function isMotionReduced() {
  /* 本站覆盖系统「减少动态」：站长明确要求保留完整动画（技能浮动/
     入场动效等），避免 Edge 等浏览器误开 reduce 导致动画全失效。
     如需恢复无障碍降级，改回：matchMedia('(prefers-reduced-motion: reduce)').matches */
  return false
}

export function isNarrowScreen(width = hasWindow ? window.innerWidth : 0) {
  return width < BP_MD
}

/* ---------- 响应式单例状态（模块加载后全局共享） ---------- */
const motionReduced = ref(isMotionReduced())
const narrow = ref(isNarrowScreen())

let inited = false
function init() {
  if (inited || !hasWindow || typeof window.matchMedia !== 'function') return
  inited = true

  const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  const mqNarrow = window.matchMedia(`(max-width: ${BP_MD - 1}px)`)

  const syncReduced = (e) => { motionReduced.value = e.matches }
  const syncNarrow = (e) => {
    narrow.value = e.matches
  }

  if (typeof mqReduced.addEventListener === 'function') {
    mqReduced.addEventListener('change', syncReduced)
    mqNarrow.addEventListener('change', syncNarrow)
  } else {
    // 兼容旧内核（Safari 13-）
    mqReduced.addListener(syncReduced)
    mqNarrow.addListener(syncNarrow)
  }

  /* 初始化同步一次（避免首帧与实际媒体查询不一致） */
  motionReduced.value = mqReduced.matches
  narrow.value = mqNarrow.matches
}

/**
 * useMotion() — 响应式动效策略。
 * @returns {{ motionReduced: Ref<boolean>, narrow: Ref<boolean>,
 *             isMobile: Ref<boolean>, simplified: ComputedRef<boolean> }}
 */
export function useMotion() {
  init()
  return {
    motionReduced,
    narrow,
    isMobile: narrow,
    simplified: computed(() => motionReduced.value || narrow.value)
  }
}

export default useMotion
