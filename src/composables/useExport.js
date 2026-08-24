/* ============================================================
   useExport.js — 导出独立成品 HTML（需求：导出功能）
   ------------------------------------------------------------
   把「用户配置好的简历站点」快照成一个【自包含单文件 HTML】：
     - 内联全部 CSS（序列化 document.styleSheets，@import 提前到顶部）
     - 剥离编辑器/工具 UI：控制台、选中框、内联编辑浮层、模块配置浮窗、
       顶部导航的版本/语言/形态/设备/主题切换器、页脚版本徽标
     - 剥离主运行脚本（静态快照无需整套运行时，可离线打开/分享/部署）
     - 仅注入一段【极小的运行时脚本】驱动导出后仍该动的动态部分
       （hero 职位轮播 data-export-roles），其余全部静态到终态
     - 强制所有模块入场动画到终态（滚动扫一遍 + GSAP flush + 安全网）
     - 成品【干净】：不含署名水印/仓库链接（求 star 提示在
       点导出时由编辑面板弹出，见 ConsolePanel.vue）
   输出：直接触发浏览器下载一个 .html 文件。
   ============================================================ */
import { nextTick } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { setMode } from './useMode'
import { closeConsole } from './useConsole'
import { REVEAL_PRESETS } from './useReveal'
import gsapCoreSrc from 'gsap/dist/gsap.min.js?raw'
import scrollTriggerSrc from 'gsap/dist/ScrollTrigger.min.js?raw'

gsap.registerPlugin(ScrollTrigger)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ===================== CSS 序列化 ===================== */
function rulesText(rules) {
  const out = []
  for (const rule of rules) {
    try {
      if (rule.type === CSSRule.MEDIA_RULE) {
        out.push(`@media ${rule.media.mediaText} {\n${rulesText(rule.cssRules)}\n}`)
      } else if (rule.type === CSSRule.SUPPORTS_RULE) {
        out.push(`@supports ${rule.conditionText} {\n${rulesText(rule.cssRules)}\n}`)
      } else if (rule.cssText) {
        out.push(rule.cssText)
      }
    } catch (e) {
      /* 单条规则无法序列化时跳过，不影响整体 */
    }
  }
  return out.join('\n')
}

/**
 * 汇总全站样式为一段 CSS。
 * 浏览器要求 @import 位于样式表最前，否则会被忽略——因此把
 * @import 单独抽出、全部放到合并结果的最前面。
 */
async function collectCss() {
  const imports = []
  const bodies = []
  for (const sheet of Array.from(document.styleSheets)) {
    let text = ''
    try {
      const rules = sheet.cssRules
      if (rules && rules.length) text = rulesText(rules)
    } catch (e) {
      /* 跨源/受限样式表：尝试同源 fetch 兜底 */
      try {
        const href = sheet.href
        if (href) {
          const res = await fetch(href)
          if (res.ok) text = await res.text()
        }
      } catch (_) { /* 兜底失败则跳过该样式表 */ }
    }
    if (!text.trim()) continue
    const imps = []
    const rest = text.split('\n').filter((ln) => {
      if (/^\s*@import\b/.test(ln)) { imps.push(ln.trim()); return false }
      return true
    }).join('\n')
    imports.push(...imps)
    if (rest.trim()) bodies.push(rest)
  }
  return [...imports, ...bodies].join('\n')
}

/* ===================== 导出成品保持干净 =====================
   按用户要求：求 star 提示放在「点导出时」（编辑面板内弹窗，见
   ConsolePanel.vue），成品文件不含署名水印、不含仓库链接、不含任何
   脚本，干干净净的静态快照。 */

/* ===================== 强制所有模块入场动画到终态 =====================
   动画初始隐藏态是 GSAP 写在模块根元素内联样式里的（opacity/transform），
   靠 ScrollTrigger 进入视口触发。导出前需要：
    1) 切回滚动形态（翻页形态只显示当前一屏）；
    2) 收起控制台（退出编辑态，清除预览缩放 transform）；
    3) 滚动扫一遍触发全部 ScrollTrigger；
    4) GSAP 直接快进到终态；
    5) 模块根元素安全网强制可见。 */
async function forceRevealAll() {
  setMode('scroll')
  closeConsole()
  await nextTick()
  await sleep(380) /* 等模式重挂载 + 过渡稳定（含 rAF 建动画） */

  const doc = document.documentElement
  const max = Math.max(doc.scrollHeight, document.body.scrollHeight, window.innerHeight)
  const steps = 14
  for (let i = 0; i <= steps; i++) {
    window.scrollTo(0, (max / steps) * i)
    await sleep(35)
  }

  /* 强制 GSAP 所有动画直接到终态（打字机/逐字/错峰等长动画） */
  try { gsap.globalTimeline.time(gsap.globalTimeline.duration()) } catch (e) {}
  try { ScrollTrigger.refresh() } catch (e) {}
  await sleep(150)

  /* 安全网：模块根元素强制可见（清残留的入场隐藏态） */
  document.querySelectorAll('[data-module]').forEach((el) => {
    el.style.opacity = '1'
    el.style.transform = ''
    el.style.filter = ''
    el.style.visibility = ''
  })
  await sleep(50)

  window.scrollTo(0, 0) /* 回到顶部，快照从首屏开始 */
  await sleep(80)
}

/* ===================== 导出成品动画运行时 =====================
   exportRuntimeScript：内联进导出的 HTML（通过 toString 序列化源码），
   依赖已内联的 gsap 核心 + ScrollTrigger 引擎。复刻 useReveal 的入场逻辑：
     - 模块按 data-export-anim 读动画名 → REVEAL_PRESETS（同预览版预设表）
     - 初始设 to .from（隐藏态），ScrollTrigger top 88% 触发动画到 .to
     - 'none' 跳过；'stagger-children' 子元素错峰
     - hero 职位轮播：data-export-roles 每 2.6s 淡入淡出轮换
  注意：这是【独立】运行时，不依赖 Vue —— 快照 DOM 已在导出前强制到
  入场终态，这里重新按动画名隐藏 + 滚动触发，达到与预览版一致的观感。 */
function exportRuntimeScript() {
  /* global gsap, ScrollTrigger, __EXPORT_REVEAL__ */
  ;(function () {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return

    /* 预设表来自导出时序列化的 REVEAL_PRESETS（与预览版 useReveal 完全一致） */
    var PRESETS = (typeof __EXPORT_REVEAL__ === 'object' && __EXPORT_REVEAL__) || {}

    function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)) }

    function setupReveals() {
      var mods = $$('[data-module][data-export-anim]')
      mods.forEach(function (el) {
        var name = el.getAttribute('data-export-anim')
        if (!name || name === 'none') return

        /* 简化：小屏 / 减少动态 → 只淡入（与预览版 shouldSimplifyMotion 一致） */
        var reduce = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        var small = window.innerWidth < 768

        if (name === 'stagger-children') {
          var kids = $$('[data-module][data-export-anim] > *').filter(function (c) { return c.nodeType === 1 })
          if (!kids.length) { gsap.set(el, { opacity: 1 }); return }
          gsap.set(kids, { opacity: 0, y: 40 })
          gsap.to(kids, {
            opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', stagger: 0.1,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true }
          })
          return
        }

        var p = PRESETS[name] || PRESETS['fade-up']
        if (reduce || small) {
          /* 简化：只透明度 */
          gsap.set(el, { opacity: 0 })
          gsap.to(el, {
            opacity: 1, duration: 0.5, ease: 'power1.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true }
          })
          return
        }

        gsap.set(el, p.from)
        gsap.to(el, {
          ...p.to,
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        })
      })
    }

    /* hero 职位轮播：data-export-roles → 每 2.6s 淡入淡出轮换 */
    function setupRoles() {
      $$('[data-export-roles]').forEach(function (el) {
        var roles = []
        try { roles = JSON.parse(el.getAttribute('data-export-roles') || '[]') } catch (e) { return }
        if (!roles.length) return
        var i = 0
        el.style.opacity = '1'
        setInterval(function () {
          i = (i + 1) % roles.length
          var next = roles[i]
          gsap.to(el, {
            opacity: 0, duration: 0.3, ease: 'power1.in',
            onComplete: function () {
              el.textContent = next
              gsap.to(el, { opacity: 1, duration: 0.4, ease: 'power1.out' })
            }
          })
        }, 2600)
      })
    }

    function boot() {
      setupReveals()
      setupRoles()
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
    else boot()
  })()
}

/* ===================== 快照 → 独立 HTML 字符串 ===================== */
async function buildStandaloneHtml() {
  const css = await collectCss()
  const root = document.documentElement.cloneNode(true)

  /* 剥离脚本与样式表链接（CSS 已内联） */
  root.querySelectorAll('script, link[rel="stylesheet"], link[rel="preload"]').forEach((n) => n.remove())

  /* 剥离编辑器/工具 UI */
  root.querySelectorAll(
    '.console-panel, .console-fab, .config-bar, .config-bar-pill, .sel-box, .ie, .footer__build'
  ).forEach((n) => n.remove())

  /* 剥离顶部导航的工具切换器（版本/语言/形态/设备/主题/汉堡/下拉），
     保留品牌 + 区块锚点链接（纯静态可用的部分） */
  root.querySelectorAll(
    '.site-nav__version, .site-nav__lang, .site-nav__mode, .site-nav__device, .site-nav__theme, .site-nav__burger, .site-nav__mobile'
  ).forEach((n) => n.remove())

  /* 剥离编辑器残留属性 */
  root.querySelectorAll('[data-editable-key], [data-module-label], [data-reveal-mode]').forEach((n) => {
    ;['data-editable-key', 'data-module-label', 'data-reveal-mode'].forEach((a) => n.removeAttribute(a))
  })

  /* 去掉编辑态类（预览缩放/手机框架） */
  root.classList.remove('side-panel-open', 'preview-device-mobile')

  /* 内联 CSS */
  const style = root.ownerDocument.createElement('style')
  style.setAttribute('data-export-css', 'true')
  style.textContent = css
  const head = root.querySelector('head')
  if (head) head.appendChild(style)

  /* ===================== 注入完整运行时（导出成品保留动画） =====================
     用户需求：下载的 HTML 要与预览版【一模一样】的动画（滚到 88% 才浮现、
     幅度/跟手/渐变强调等）。做法：
       - 内联 GSAP 核心 + ScrollTrigger 引擎（?raw 读取 node_modules 产物）
       - 运行时脚本按 data-export-anim（模块动画名）读取 REVEAL_PRESETS，
         用 ScrollTrigger 以 top 88% 触发入场动画——与预览版 useReveal 同预设同触发点
       - 保留 hero 职位轮播（data-export-roles）
     成品仍是单文件自包含：引擎内联、无外部请求。 */
  const bodyEl = root.querySelector('body')
  if (bodyEl) {
    const engine = root.ownerDocument.createElement('script')
    engine.setAttribute('data-export-run', 'true')
    /* 用运行时脚本 + 从 useReveal 序列化的 REVEAL_PRESETS（与预览版完全一致，
       避免硬编码重复导致两处漂移）。脚本从全局 __EXPORT_REVEAL__ 读预设表。 */
    engine.textContent =
      `var __EXPORT_REVEAL__=${JSON.stringify(REVEAL_PRESETS)};\n` +
      `${gsapCoreSrc}\n${scrollTriggerSrc}\n(${exportRuntimeScript.toString()})();`
    bodyEl.appendChild(engine)
  }

  return `<!DOCTYPE html>\n${root.outerHTML}`
}

/* ===================== 下载 ===================== */
function isChrome() {
  return (
    typeof navigator !== 'undefined' &&
    /Chrome\//i.test(navigator.userAgent) &&
    !/Edg\//i.test(navigator.userAgent) &&
    !/OPR\//i.test(navigator.userAgent)
  )
}

/**
 * 触发下载。Chrome 走 File System Access API（原生「另存为」对话框）：
 *   - 直接写文件，完全绕过 Chrome 下载管理器，规避部分 Chrome 环境
 *     下程序化下载「显示 UUID 文件名 / 完成却不落盘」的问题；
 *   - 用户取消（AbortError）静默返回；API 不可用/无手势则回退自动下载。
 * Edge 及其余浏览器保持现有自动下载（data: URI + <a download>，已验证可靠）。
 */
async function download(html, filename) {
  if (typeof window !== 'undefined' && window.showSaveFilePicker && isChrome()) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'HTML Document', accept: { 'text/html': ['.html'] } }]
      })
      const writable = await handle.createWritable()
      await writable.write(html)
      await writable.close()
      return
    } catch (e) {
      if (e && e.name === 'AbortError') return /* 用户主动取消 */
      /* 其他失败（无用户手势 / 安全限制等）→ 回退自动下载 */
    }
  }
  const a = document.createElement('a')
  a.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(html)
  a.download = filename
  a.style.display = 'none'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  window.setTimeout(() => a.remove(), 1000)
}

/* ===================== 主入口 ===================== */
/**
 * 导出当前配置的简历站点为独立 HTML 文件（触发下载）。
 * @param {object} [opts] { fileName } 可指定文件名，缺省用页面标题
 * @returns {Promise<number>} 生成的 HTML 字符长度
 */
export async function exportStandaloneHtml({ fileName } = {}) {
  await forceRevealAll()
  const html = await buildStandaloneHtml()
  const safe = String(document.title || 'resume')
    .replace(/[\\/:*?"<>|]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
  await download(html, fileName || `${safe || 'resume'}.html`)
  return html.length
}

export default exportStandaloneHtml
