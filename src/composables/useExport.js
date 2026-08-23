/* ============================================================
   useExport.js — 导出独立成品 HTML（需求：导出功能）
   ------------------------------------------------------------
   把「用户配置好的简历站点」快照成一个【自包含单文件 HTML】：
     - 内联全部 CSS（序列化 document.styleSheets，@import 提前到顶部）
     - 剥离编辑器/工具 UI：控制台、选中框、内联编辑浮层、模块配置浮窗、
       顶部导航的版本/语言/形态/设备/主题切换器（保留品牌与锚点链接）
     - 剥离全部 <script>（静态快照无需运行时，可离线打开/分享/部署）
     - 强制所有模块入场动画到终态（滚动扫一遍 + GSAP flush + 安全网）
     - 末尾追加「本开源项目仓库地址」署名（链接指向 REPO_URL）
   输出：直接触发浏览器下载一个 .html 文件。
   ============================================================ */
import { nextTick } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { setMode } from './useMode'
import { closeConsole } from './useConsole'
import { REPO_URL } from '@/config/site.config'

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

/* ===================== 导出署名水印 UI（自包含，不依赖主题变量） =====================
   样式前缀 rc-*：独立小样式块，追加在导出内联 CSS 末尾，保证即使主题 CSS
   缺失也能正常显示弹窗/按钮。 */
const WATERMARK_CSS = `
/* 导出署名水印：隐藏按钮 */
.rc-hide {
  font: inherit;
  color: inherit;
  background: none;
  border: none;
  padding: 0 2px;
  margin: 0;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  opacity: 0.85;
}
.rc-hide:hover { opacity: 1; }
/* 求 star 弹窗遮罩 */
.rc-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(8, 12, 24, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.rc-modal {
  max-width: 360px;
  width: 100%;
  box-sizing: border-box;
  padding: 26px 24px;
  border-radius: 16px;
  background: #0f172a;
  border: 1px solid rgba(130, 165, 255, 0.35);
  color: #e9effc;
  text-align: center;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}
.rc-title { font-size: 16px; font-weight: 700; margin: 0 0 10px; }
.rc-text { font-size: 13px; line-height: 1.7; color: rgba(214, 226, 255, 0.78); margin: 0 0 18px; }
.rc-btn {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
  margin-top: 8px;
  font-family: inherit;
}
.rc-btn--star { color: #060b16; background: linear-gradient(135deg, #22d3ee, #a78bfa); }
.rc-btn--star:hover { filter: brightness(1.08); }
.rc-btn--ghost { color: rgba(214, 226, 255, 0.8); background: transparent; border-color: rgba(130, 165, 255, 0.35); }
.rc-btn--ghost:hover { background: rgba(255, 255, 255, 0.06); }
`

/* ===================== 求 star 交互脚本（内联进导出文件末尾） =====================
   行为：
     - 点水印上的「隐藏署名」→ 弹出求 star 弹窗（不直接隐藏）
     - 弹窗里「去 GitHub 点 Star」→ 新标签打开仓库 + 隐藏水印
     - 「直接隐藏」/ 点遮罩 / Esc → 隐藏水印（不强制 star）
     - 隐藏后写入 localStorage（key: resume-credit-hidden），同源下刷新不再出现 */
function exportCreditScript(repoUrl, T) {
  return `(function () {
  var KEY = 'resume-credit-hidden';
  var credit = document.querySelector('[data-export-credit]');
  if (!credit) return;
  var overlay = null;
  function persist() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }
  function tearDown() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    document.removeEventListener('keydown', onKey);
  }
  function hideCredit() { persist(); tearDown(); if (credit.parentNode) credit.parentNode.removeChild(credit); }
  function onKey(e) { if (e.key === 'Escape') hideCredit(); }
  function showModal() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'rc-overlay';
    overlay.innerHTML =
      '<div class="rc-modal" role="dialog" aria-modal="true">' +
        '<div class="rc-title">${T.modalTitle}</div>' +
        '<p class="rc-text">${T.modalText}</p>' +
        '<a class="rc-btn rc-btn--star" href="${repoUrl}" target="_blank" rel="noopener">${T.starBtn}</a>' +
        '<button type="button" class="rc-btn rc-btn--ghost" data-rc-hide>${T.hideBtn}</button>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('[data-rc-hide]').addEventListener('click', hideCredit);
    overlay.querySelector('.rc-btn--star').addEventListener('click', function () { hideCredit(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) hideCredit(); });
    document.addEventListener('keydown', onKey);
  }
  var hideBtn = credit.querySelector('[data-credit-hide]');
  if (hideBtn) hideBtn.addEventListener('click', showModal);
  var hidden = false;
  try { hidden = localStorage.getItem(KEY) === '1'; } catch (e) {}
  if (hidden) hideCredit();
})();
`
}

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

/* ===================== 快照 → 独立 HTML 字符串 ===================== */
async function buildStandaloneHtml() {
  const css = (await collectCss()) + '\n' + WATERMARK_CSS
  const root = document.documentElement.cloneNode(true)

  /* 剥离脚本与样式表链接（CSS 已内联） */
  root.querySelectorAll('script, link[rel="stylesheet"], link[rel="preload"]').forEach((n) => n.remove())

  /* 剥离编辑器/工具 UI */
  root.querySelectorAll(
    '.console-panel, .console-fab, .config-bar, .config-bar-pill, .sel-box, .ie'
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

  /* 末尾署名水印（可隐藏 · 隐藏前求 star，跟随当前语言） */
  const htmlLang = document.documentElement.getAttribute('lang') || 'zh'
  const isEn = htmlLang.toLowerCase().startsWith('en')
  const T = {
    text: isEn ? 'Generated with the open-source project {link}' : '本简历由开源项目 {link} 生成',
    hide: isEn ? 'Hide credit' : '隐藏署名',
    modalTitle: isEn ? '⭐ Like this resume template?' : '⭐ 喜欢这个简历模板吗？',
    modalText: isEn
      ? 'This resume is built with an open-source project. If you like it, give it a Star on GitHub — or just hide this credit.'
      : '这份简历由开源项目生成。如果喜欢，欢迎去 GitHub 点个 Star 支持一下；不需要也可以直接隐藏署名。',
    starBtn: isEn ? 'Star it on GitHub ⭐' : '去 GitHub 点 Star ⭐',
    hideBtn: isEn ? 'Hide credit' : '直接隐藏'
  }
  const link = `<a href="${REPO_URL}" target="_blank" rel="noopener" style="color:inherit;font-weight:600;text-decoration:underline;text-underline-offset:2px;">${REPO_URL}</a>`

  const credit = root.ownerDocument.createElement('div')
  credit.setAttribute('data-export-credit', 'true')
  credit.style.cssText = [
    'display:flex',
    'flex-wrap:wrap',
    'align-items:center',
    'justify-content:center',
    'gap:10px',
    'padding:18px 16px 24px',
    'text-align:center',
    'font-size:12px',
    'line-height:1.7',
    'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',
    'letter-spacing:0.04em',
    'color:inherit',
    'opacity:0.75'
  ].join(';')
  credit.innerHTML = T.text.replace('{link}', link)
    + `<button type="button" data-credit-hide class="rc-hide" title="${T.hide}" aria-label="${T.hide}">${T.hide}</button>`

  const body = root.querySelector('body')
  if (body) {
    body.appendChild(credit)
    /* 求 star 交互脚本（内联在导出文件末尾，剥离脚本那一步发生在它之前） */
    const script = root.ownerDocument.createElement('script')
    script.setAttribute('data-export-credit-js', 'true')
    script.textContent = exportCreditScript(REPO_URL, T)
    body.appendChild(script)
  }

  return `<!DOCTYPE html>\n${root.outerHTML}`
}

/* ===================== 下载 ===================== */
function download(html, filename) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
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
  download(html, fileName || `${safe || 'resume'}.html`)
  return html.length
}

export default exportStandaloneHtml
