/* ============================================================
   useTextAnim.js — 文字显现动画 composable（GSAP）
   ------------------------------------------------------------
   用法：
     import { useTextAnim } from '@/composables/useTextAnim'
     const { start, stop } = useTextAnim(elRef, 'typewriter', { delay: 0.2 })
     start()   // 开始显现（会先把文字拆成 span 再驱动）
     stop()    // 终止动画并还原成纯文本（组件卸载时调用）

   elRef 可以是：原生元素 / Vue ref（.value 为元素）。
   anim 预设名见 TEXT_ANIM_PRESETS：
     typewriter      打字机逐字出现（带闪烁光标）
     letter-stagger  逐字上浮（config 的 letter-float 是其别名）
     word-fade       逐词淡入（中文按单字、英文按单词切分）
     blur-in         整段由模糊到清晰
     gradient-shift  文字用霓虹渐变填充并持续流动
     line-clip       行遮罩展开（clip-path 自下而上揭开）
     none            无动画（start/stop 为空操作）

   系统"减少动态"时自动直接显示最终态，不做拆分与位移。
   ============================================================ */

import { gsap } from 'gsap'
import { shouldSimplifyMotion, resolveElement } from './motion'

/** 打字机光标字符（可用 options.caret 覆盖） */
const DEFAULT_CARET = '▍'

/* ===================== 文字动画预设表 ===================== */
/** name → 说明；resolveTextAnimName 用它做合法性校验/别名映射。 */
export const TEXT_ANIM_PRESETS = {
  typewriter:       '打字机逐字出现',
  'letter-stagger': '逐字上浮',
  'letter-float':   '逐字浮动（letter-stagger 的别名）',
  'word-fade':      '逐词淡入',
  'blur-in':        '整段模糊到清晰',
  'gradient-shift': '渐变流动',
  'line-clip':      '行遮罩展开',
  none:             '无文字动画'
}

export const TEXT_ANIM_PRESET_NAMES = Object.keys(TEXT_ANIM_PRESETS)

/** 别名表：其它名字 → 统一实现名 */
const TEXT_ALIASES = { 'letter-float': 'letter-stagger' }

/**
 * 解析文字动画名：支持别名；未知名字回退 'none' 并告警。
 * @param {string|undefined} name
 * @returns {string} 统一实现名
 */
export function resolveTextAnimName(name) {
  if (!name) return 'none'
  const key = String(name).trim()
  const aliased = TEXT_ALIASES[key] ?? key
  if (TEXT_ANIM_PRESETS[aliased] !== undefined) return aliased
  if (import.meta.env.DEV) {
    console.warn(
      `[useTextAnim] 未知文字动画 "${key}"，已回退为 none。可用：${TEXT_ANIM_PRESET_NAMES.join(', ')}`
    )
  }
  return 'none'
}

/* --------------------- 拆分工具 --------------------- */

/** 判断是否为 CJK / 全角字符（这类字符应"逐字"作为动画单元） */
function isCJKChar(ch) {
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(ch)
}

/**
 * 逐字拆分：每个可见字符包一个 inline-block span；空白保留为文本节点。
 * @returns {HTMLElement[]} 生成的字符 span 数组
 */
function splitChars(el) {
  const frag = document.createDocumentFragment()
  const units = []
  for (const ch of Array.from(el.textContent || '')) {
    if (/\s/.test(ch)) {
      frag.appendChild(document.createTextNode(ch))
    } else {
      const span = document.createElement('span')
      span.textContent = ch
      span.style.display = 'inline-block'
      span.style.whiteSpace = 'pre'
      span.setAttribute('data-tr-char', '')
      frag.appendChild(span)
      units.push(span)
    }
  }
  el.textContent = ''
  el.appendChild(frag)
  return units
}

/**
 * 逐词拆分：英文按单词、中文按单字（保证词频动画在中文下也有效）；
 * 空白保留为文本节点。
 * @returns {HTMLElement[]} 生成的词/字 span 数组
 */
function splitWords(el) {
  const frag = document.createDocumentFragment()
  const words = []
  const pushUnit = (value) => {
    const span = document.createElement('span')
    span.textContent = value
    span.style.display = 'inline-block'
    span.setAttribute('data-tr-word', '')
    frag.appendChild(span)
    words.push(span)
  }
  /* 先按空白切块，块内再细分：纯拉丁块按词，含中文块按字 */
  const chunks = (el.textContent || '').split(/(\s+)/).filter(Boolean)
  for (const chunk of chunks) {
    if (/^\s+$/.test(chunk)) {
      frag.appendChild(document.createTextNode(chunk))
      continue
    }
    const chars = Array.from(chunk)
    if (chars.some(isCJKChar)) {
      chars.forEach((ch) => pushUnit(ch))
    } else {
      pushUnit(chunk)
    }
  }
  el.textContent = ''
  el.appendChild(frag)
  return words
}

/** 我们可能写到元素上的内联样式，stop 时清掉还原 */
const TR_INLINE_PROPS = [
  'opacity', 'transform', 'filter',
  'background', 'backgroundPosition', 'backgroundSize',
  'color', 'clipPath', 'overflow', 'display', 'willChange'
]

function resetInline(el) {
  if (!el) return
  TR_INLINE_PROPS.forEach((p) => el.style.removeProperty(p))
  el.style.removeProperty('-webkit-background-clip')
}

/* --------------------- 各预设实现 --------------------- */

/** typewriter：逐字出现 + 闪烁光标（caret 传 null/'' 表示无光标，适合静态标题） */
function runTypewriter(el, { delay, duration, caret }) {
  const chars = splitChars(el)
  gsap.set(chars, { opacity: 0 })

  const perChar = duration && chars.length ? duration / Math.max(chars.length, 1) : 0.06
  const tl = gsap.timeline({ delay })
  /* 字符一个接一个亮起（打字机节奏） */
  tl.to(chars, {
    opacity: 1,
    duration: Math.min(perChar * 4, 0.35),
    ease: 'none',
    stagger: perChar
  }, 0)

  /* 光标：caret 存在时才加（静态标题无声的闪烁光标） */
  if (caret) {
    const caretEl = document.createElement('span')
    caretEl.textContent = caret
    caretEl.setAttribute('data-tr-caret', '')
    caretEl.style.display = 'inline-block'
    caretEl.style.marginLeft = '2px'
    caretEl.style.color = 'var(--accent-cyan)'
    el.appendChild(caretEl)
    /* 光标常亮闪烁 */
    tl.to(caretEl, { opacity: 0.15, duration: 0.45, repeat: -1, yoyo: true }, 0)
  }
  return tl
}

/** letter-stagger：逐字上浮（含轻微模糊，更精致） */
function runLetterStagger(el, { delay, duration }) {
  const chars = splitChars(el)
  gsap.set(chars, { opacity: 0, y: 18, filter: 'blur(5px)' })
  const tl = gsap.timeline({ delay })
  tl.to(chars, {
    opacity: 1, y: 0, filter: 'blur(0px)',
    duration: duration ?? 0.6,
    ease: 'power2.out',
    stagger: 0.03
  })
  return tl
}

/** word-fade：逐词淡入（中文按字，英文按词） */
function runWordFade(el, { delay, duration }) {
  const words = splitWords(el)
  gsap.set(words, { opacity: 0, y: 10 })
  const tl = gsap.timeline({ delay })
  tl.to(words, {
    opacity: 1, y: 0,
    duration: duration ?? 0.5,
    ease: 'power2.out',
    stagger: 0.06
  })
  return tl
}

/** blur-in：整段由模糊到清晰 */
function runBlurIn(el, { delay, duration }) {
  gsap.set(el, { opacity: 0, filter: 'blur(14px)' })
  const tl = gsap.timeline({ delay })
  tl.to(el, {
    opacity: 1, filter: 'blur(0px)',
    duration: duration ?? 0.8,
    ease: 'power2.out'
  })
  return tl
}

/** 给元素应用霓虹渐变文字样式（clip 到文字，颜色取自 tokens 变量） */
function applyGradientText(el) {
  el.style.background =
    'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple), var(--accent-pink), var(--accent-cyan))'
  el.style.backgroundSize = '200% 100%'
  el.style.webkitBackgroundClip = 'text'
  el.style.backgroundClip = 'text'
  el.style.color = 'transparent'
}

/** gradient-shift：渐变文字 + 背景位置持续流动 */
function runGradientShift(el, { delay, duration }) {
  applyGradientText(el)
  gsap.set(el, { backgroundPosition: '0% 0%' })
  const tl = gsap.timeline({ delay })
  tl.to(el, {
    backgroundPosition: '200% 0%',
    duration: duration ?? 3.5,
    ease: 'none',
    repeat: -1,
    yoyo: true
  }, 0)
  return tl
}

/** line-clip：行遮罩展开（clip-path 自下而上揭开） */
function runLineClip(el, { delay, duration }) {
  if (getComputedStyle(el).display === 'inline') el.style.display = 'inline-block'
  el.style.overflow = 'hidden'
  el.style.willChange = 'clip-path'
  gsap.set(el, { clipPath: 'inset(0 0 100% 0)' })
  const tl = gsap.timeline({ delay })
  tl.to(el, {
    clipPath: 'inset(0 0 0% 0)',
    duration: duration ?? 0.9,
    ease: 'power3.inOut'
  })
  return tl
}

/* 预设 → 实现函数映射 */
const RUNNERS = {
  typewriter: runTypewriter,
  'letter-stagger': runLetterStagger,
  'word-fade': runWordFade,
  'blur-in': runBlurIn,
  'gradient-shift': runGradientShift,
  'line-clip': runLineClip
}

/* ===================== 对外主入口 ===================== */
/**
 * useTextAnim(elOrRef, anim, options?) → { start, stop }
 *
 * options 可选：
 *   delay    : 动画开始延迟（秒），默认 0
 *   duration : 动画时长（秒）；缺省用各预设的合理默认值
 *   caret    : typewriter 光标字符，默认 '▍'
 *   autoplay : 是否在创建时立即 start，默认 false（由调用方决定时机）
 *
 * 返回：
 *   start() : 开始动画（会先按动画拆分文字再驱动；重复调用无副作用）
 *   stop()  : 终止动画并把元素还原成纯文本（组件卸载时务必调用）
 */
export function useTextAnim(elOrRef, animName, options = {}) {
  const el = resolveElement(elOrRef)
  const name = resolveTextAnimName(animName)
  /* 简化动效（系统减少动效 或 移动端窄屏）：直接显示最终态；
     typewriter 等重动画强制关闭（i18n-dev 契约，见 ARCHITECTURE.md 6.2） */
  const simplified = shouldSimplifyMotion()

  let tweens = []
  let started = false
  let original = el ? (el.textContent || '') : ''

  /** 把元素还原成纯文本（删除拆分 span / 光标，清内联样式） */
  function restore() {
    if (!el) return
    tweens.forEach((t) => t.kill())
    tweens = []
    el.querySelectorAll('[data-tr-char], [data-tr-word], [data-tr-caret]')
      .forEach((n) => n.remove())
    resetInline(el)
    if (el.textContent !== original) el.textContent = original
    delete el.dataset.trState
  }

  /** 准备并启动动画（内部）：拆分 DOM + 建 timeline */
  function prepare() {
    if (!el || name === 'none') return
    /* 若上一次已拆分，先还原（original 会随之更新为最新纯文本） */
    restore()
    original = el.textContent || ''

    if (simplified) {
      /* 简化动效：gradient-shift 仍保留静态渐变，其余直接显示最终态 */
      if (name === 'gradient-shift') applyGradientText(el)
      return
    }

    const runner = RUNNERS[name]
    if (!runner) return
    const tl = runner(el, {
      delay: options.delay ?? 0,
      duration: options.duration,
      /* caret: 调用方可传 '' 或 false 关闭光标（静态标题用），
         未传用默认光标字符（动态打字机行用）。 */
      caret: (options.caret === '' || options.caret === false) ? undefined : (options.caret ?? DEFAULT_CARET)
    })
    tweens.push(tl)
    el.dataset.trState = 'split'
  }

  /** 开始文字显现动画 */
  function start() {
    if (!el || started) return
    started = true
    prepare()
  }

  /** 终止并还原为纯文本（组件卸载时务必调用） */
  function stop() {
    if (!el) return
    restore()
    started = false
  }

  if (options.autoplay) start()

  return { start, stop }
}
