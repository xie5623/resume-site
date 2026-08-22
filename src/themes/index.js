/* ============================================================
   themes/index.js — 主题层（THEME）注册表
   ------------------------------------------------------------
   三层分离中的【主题层】：决定"外观"（颜色/玻璃/字体/光效），
   与模板（结构）、内容（文字）完全解耦：换主题不动内容。

   每个主题：
     {
       id: 'dark-glass',
       name: { zh: '深色玻璃', en: 'Dark Glass' },   // 切换器按钮文案
       colorScheme: 'dark',            // 写到 :root 的 color-scheme
       preview: 'linear-gradient(...)', // 切换器预览圆点背景
       desc: { zh, en },                // 切换器悬浮提示（可选）
       cssVars: { '--var': value, … },  // 覆盖 tokens.css 变量的键值对
       extraCss: `…`,                   // 可选：该主题专属 CSS 片段
     }
   - cssVars 采用「完整覆盖」：每个主题都把 tokens.css 里影响视觉的
     变量全部列齐（颜色/玻璃/文字/强调/阴影/圆角/模糊/字体），
     主题自洽、互不泄漏；结构变量（间距/字号刻度/断点/过渡时长）
     沿用 tokens.css 默认，仅个别主题按需覆盖（如暗金的圆角）。
   - extraCss 由 useTheme() 注入为全局 <style>（切主题时替换内容），
     用于变量表达不了的装饰（扫描线/衬线标题/专属卡面光效），
     选择器统一以 [data-theme='<id>'] 开头（App 根节点带 data-theme）。
   - 新主题（浅色极简/暗金奢华/赛博渐变）每个对象独立成节，
     注册进下方 THEMES 字典即可生效。
   ============================================================ */

/* ============================================================
   1) dark-glass — 深色玻璃拟态（默认主题）
   近黑蓝底 + 低透明玻璃卡 + 青紫霓虹渐变。从现有 tokens 提取精修。
   ============================================================ */
export const darkGlassTheme = {
  id: 'dark-glass',
  name: { zh: '深色玻璃', en: 'Dark Glass' },
  colorScheme: 'dark',
  preview: 'linear-gradient(135deg, #0a0e1a 0%, #22d3ee 100%)',
  desc: {
    zh: '默认主题：近黑蓝底、毛玻璃卡片、青紫霓虹渐变',
    en: 'Default: near-black blue, frosted glass, cyan-purple neon'
  },
  cssVars: {
    /* 背景 */
    '--bg-base': '#0a0e1a',
    '--bg-elevated': '#0e1424',
    '--bg-deep': '#06080f',
    '--bg-grid': 'rgba(148, 163, 255, 0.05)',
    /* 玻璃卡片 */
    '--glass-bg': 'rgba(255, 255, 255, 0.06)',
    '--glass-bg-strong': 'rgba(255, 255, 255, 0.1)',
    '--glass-bg-hover': 'rgba(255, 255, 255, 0.12)',
    '--glass-border': 'rgba(255, 255, 255, 0.12)',
    '--glass-border-hover': 'rgba(255, 255, 255, 0.24)',
    '--glass-highlight': 'rgba(255, 255, 255, 0.55)',
    /* 文字 */
    '--text-primary': '#eef2ff',
    '--text-secondary': 'rgba(226, 232, 255, 0.72)',
    '--text-muted': 'rgba(203, 213, 255, 0.48)',
    /* 霓虹强调 */
    '--accent-cyan': '#22d3ee',
    '--accent-purple': '#a78bfa',
    '--accent-pink': '#f472b6',
    '--accent-gradient': 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
    '--accent-cyan-soft': 'rgba(34, 211, 238, 0.35)',
    '--accent-purple-soft': 'rgba(167, 139, 250, 0.35)',
    /* 语义色 + 强调面文字 + 进度轨道 */
    '--success': '#34d399',
    '--warning': '#fbbf24',
    '--danger': '#f87171',
    '--on-accent': '#0a0e1a',
    '--track-bg': 'rgba(255, 255, 255, 0.08)',
    /* 字体栈 */
    '--font-sans': "'Inter', 'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', system-ui, -apple-system, sans-serif",
    '--font-serif': "'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'SimSun', Georgia, 'Times New Roman', serif",
    '--font-mono': "'JetBrains Mono', 'SF Mono', 'Cascadia Code', Consolas, monospace",
    /* 阴影 */
    '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.25)',
    '--shadow-md': '0 8px 24px rgba(0, 0, 0, 0.35)',
    '--shadow-lg': '0 16px 48px rgba(0, 0, 0, 0.5)',
    '--shadow-glow': '0 0 24px rgba(34, 211, 238, 0.35)',
    /* 圆角 */
    '--radius-sm': '0.375rem',
    '--radius-md': '0.625rem',
    '--radius-lg': '1rem',
    '--radius-xl': '1.5rem',
    '--radius-pill': '9999px',
    /* 毛玻璃模糊 */
    '--blur-sm': '8px',
    '--blur-md': '20px',
    '--blur-lg': '40px'
  }
}

/* ============================================================
   2) light-minimal — 浅色极简
   白/浅灰底、深色文字、细线卡片、克制的蓝紫点缀、大量留白；
   标题走衬线（编辑感），通透 + 高端简约。
   ============================================================ */
export const lightMinimalTheme = {
  id: 'light-minimal',
  name: { zh: '浅色极简', en: 'Light Minimal' },
  colorScheme: 'light',
  preview: 'linear-gradient(135deg, #f6f7f9 0%, #6d28d9 100%)',
  desc: {
    zh: '白/浅灰底、深字、细线卡片、克制的蓝紫点缀、衬线标题',
    en: 'White/grey, dark type, hairline cards, restrained blue-violet, serif headings'
  },
  cssVars: {
    /* 背景 */
    '--bg-base': '#f6f7f9',
    '--bg-elevated': '#ffffff',
    '--bg-deep': '#edeff3',
    '--bg-grid': 'rgba(15, 23, 42, 0.045)',
    /* 玻璃卡片：半透明白，细暗线描边 */
    '--glass-bg': 'rgba(255, 255, 255, 0.72)',
    '--glass-bg-strong': 'rgba(255, 255, 255, 0.92)',
    '--glass-bg-hover': 'rgba(255, 255, 255, 0.98)',
    '--glass-border': 'rgba(15, 23, 42, 0.09)',
    '--glass-border-hover': 'rgba(15, 23, 42, 0.18)',
    '--glass-highlight': 'rgba(255, 255, 255, 0.9)',
    /* 文字：近黑，弱化文字调高透明度保证浅底对比 */
    '--text-primary': '#161e2e',
    '--text-secondary': 'rgba(22, 30, 46, 0.7)',
    '--text-muted': 'rgba(22, 30, 46, 0.55)',
    /* 克制的蓝紫点缀（非霓虹，偏商务） */
    '--accent-cyan': '#0e7490',
    '--accent-purple': '#6d28d9',
    '--accent-pink': '#be185d',
    '--accent-gradient': 'linear-gradient(135deg, #0e7490 0%, #6d28d9 100%)',
    '--accent-cyan-soft': 'rgba(14, 116, 144, 0.16)',
    '--accent-purple-soft': 'rgba(109, 40, 217, 0.16)',
    /* 语义色（浅底可读的深版）+ 强调面文字 + 进度轨道 */
    '--success': '#059669',
    '--warning': '#b45309',
    '--danger': '#be123c',
    '--on-accent': '#ffffff',
    '--track-bg': 'rgba(22, 30, 46, 0.1)',
    /* 字体栈：衬线标题由 extraCss 指定 */
    '--font-sans': "'Inter', 'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', system-ui, -apple-system, sans-serif",
    '--font-serif': "'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'SimSun', Georgia, 'Times New Roman', serif",
    '--font-mono': "'JetBrains Mono', 'SF Mono', 'Cascadia Code', Consolas, monospace",
    /* 阴影：轻、低对比、通透 */
    '--shadow-sm': '0 1px 2px rgba(15, 23, 42, 0.06)',
    '--shadow-md': '0 8px 24px rgba(15, 23, 42, 0.08)',
    '--shadow-lg': '0 16px 48px rgba(15, 23, 42, 0.12)',
    '--shadow-glow': '0 0 20px rgba(14, 116, 144, 0.18)',
    /* 圆角 */
    '--radius-sm': '0.375rem',
    '--radius-md': '0.625rem',
    '--radius-lg': '1rem',
    '--radius-xl': '1.5rem',
    '--radius-pill': '9999px',
    /* 毛玻璃模糊 */
    '--blur-sm': '8px',
    '--blur-md': '20px',
    '--blur-lg': '40px'
  },
  extraCss: `
[data-theme='light-minimal'] h1,
[data-theme='light-minimal'] h2,
[data-theme='light-minimal'] h3,
[data-theme='light-minimal'] h4 {
  font-family: var(--font-serif);
  font-weight: 600;
  letter-spacing: 0.01em;
}
[data-theme='light-minimal'] .glass {
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px rgba(15, 23, 42, 0.07);
}
[data-theme='light-minimal'] .glass--accent {
  box-shadow: 0 0 0 1px rgba(14, 116, 144, 0.25), 0 8px 24px rgba(14, 116, 144, 0.12);
}
`
}

/* ============================================================
   3) gold-luxury — 暗金奢华
   深黑金底 + 金色渐变强调 + 奢华衬线标题 + 细金边 + 柔光。
   ============================================================ */
export const goldLuxuryTheme = {
  id: 'gold-luxury',
  name: { zh: '暗金奢华', en: 'Gold Luxury' },
  colorScheme: 'dark',
  preview: 'linear-gradient(135deg, #14100a 0%, #d4af37 100%)',
  desc: {
    zh: '深黑金底、金色渐变、奢华衬线、细金边、柔光',
    en: 'Deep black-gold, gold gradient, luxurious serif, thin gold borders'
  },
  cssVars: {
    /* 背景：暖黑金 */
    '--bg-base': '#14100a',
    '--bg-elevated': '#1b1610',
    '--bg-deep': '#0b0906',
    '--bg-grid': 'rgba(212, 175, 55, 0.06)',
    /* 玻璃卡片：暖金低透明 + 细金边 */
    '--glass-bg': 'rgba(255, 224, 158, 0.05)',
    '--glass-bg-strong': 'rgba(255, 224, 158, 0.09)',
    '--glass-bg-hover': 'rgba(255, 224, 158, 0.12)',
    '--glass-border': 'rgba(212, 175, 55, 0.24)',
    '--glass-border-hover': 'rgba(233, 198, 94, 0.55)',
    '--glass-highlight': 'rgba(233, 198, 94, 0.5)',
    /* 文字：暖象牙白 */
    '--text-primary': '#f6eeda',
    '--text-secondary': 'rgba(246, 238, 218, 0.72)',
    '--text-muted': 'rgba(228, 214, 180, 0.5)',
    /* 强调：金家族（金/香槟/古铜） */
    '--accent-cyan': '#d4af37',
    '--accent-purple': '#e8c766',
    '--accent-pink': '#a8763e',
    '--accent-gradient': 'linear-gradient(135deg, #f2d478 0%, #d4af37 50%, #9c7a2a 100%)',
    '--accent-cyan-soft': 'rgba(212, 175, 55, 0.28)',
    '--accent-purple-soft': 'rgba(232, 199, 102, 0.28)',
    /* 语义色 + 强调面文字 + 进度轨道 */
    '--success': '#9caf88',
    '--warning': '#d9a441',
    '--danger': '#c07f6a',
    '--on-accent': '#221703',
    '--track-bg': 'rgba(255, 224, 158, 0.12)',
    /* 字体栈：奢华衬线（标题由 extraCss 指定） */
    '--font-sans': "'Inter', 'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', system-ui, -apple-system, sans-serif",
    '--font-serif': "'Cormorant Garamond', 'Playfair Display', 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', Georgia, 'Times New Roman', serif",
    '--font-mono': "'JetBrains Mono', 'SF Mono', 'Cascadia Code', Consolas, monospace",
    /* 阴影：更深沉 + 金辉光 */
    '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.4)',
    '--shadow-md': '0 8px 24px rgba(0, 0, 0, 0.45)',
    '--shadow-lg': '0 20px 60px rgba(0, 0, 0, 0.6)',
    '--shadow-glow': '0 0 28px rgba(212, 175, 55, 0.22)',
    /* 圆角：更大更圆润，贵气 */
    '--radius-sm': '0.5rem',
    '--radius-md': '0.75rem',
    '--radius-lg': '1.125rem',
    '--radius-xl': '1.75rem',
    '--radius-pill': '9999px',
    /* 毛玻璃模糊 */
    '--blur-sm': '8px',
    '--blur-md': '20px',
    '--blur-lg': '40px'
  },
  extraCss: `
[data-theme='gold-luxury'] h1,
[data-theme='gold-luxury'] h2,
[data-theme='gold-luxury'] h3,
[data-theme='gold-luxury'] h4 {
  font-family: var(--font-serif);
  font-weight: 600;
  letter-spacing: 0.02em;
}
[data-theme='gold-luxury'] .glass {
  box-shadow:
    inset 0 1px 0 rgba(255, 224, 158, 0.1),
    0 8px 24px rgba(0, 0, 0, 0.45);
}
[data-theme='gold-luxury'] .glass::before { opacity: 0.85; }
[data-theme='gold-luxury'] .glass--accent {
  box-shadow: 0 0 32px rgba(212, 175, 55, 0.28);
}
[data-theme='gold-luxury'] .site-bg::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(60rem 30rem at 50% 0%, rgba(212, 175, 55, 0.08), transparent 60%);
}
`
}

/* ============================================================
   4) cyber-gradient — 赛博渐变
   深紫/蓝底 + 青/品红/紫强渐变 + 霓虹描边 + 扫描线。
   ============================================================ */
export const cyberGradientTheme = {
  id: 'cyber-gradient',
  name: { zh: '赛博渐变', en: 'Cyber Gradient' },
  colorScheme: 'dark',
  preview: 'linear-gradient(135deg, #0a0a1f 0%, #ff2fd6 100%)',
  desc: {
    zh: '深紫蓝底、青紫品红强渐变、霓虹描边、扫描线',
    en: 'Deep indigo, cyan-violet-magenta gradients, neon outlines, scanlines'
  },
  cssVars: {
    /* 背景：深靛蓝 */
    '--bg-base': '#0a0a1f',
    '--bg-elevated': '#111128',
    '--bg-deep': '#050510',
    '--bg-grid': 'rgba(0, 240, 255, 0.055)',
    /* 玻璃卡片：暗蓝玻璃 + 青/品红霓虹描边 */
    '--glass-bg': 'rgba(18, 20, 56, 0.6)',
    '--glass-bg-strong': 'rgba(24, 27, 72, 0.72)',
    '--glass-bg-hover': 'rgba(34, 38, 96, 0.78)',
    '--glass-border': 'rgba(0, 240, 255, 0.28)',
    '--glass-border-hover': 'rgba(255, 47, 214, 0.55)',
    '--glass-highlight': 'rgba(0, 240, 255, 0.6)',
    /* 文字 */
    '--text-primary': '#eef3ff',
    '--text-secondary': 'rgba(214, 228, 255, 0.72)',
    '--text-muted': 'rgba(180, 200, 255, 0.5)',
    /* 强霓虹强调：青 / 紫 / 品红 */
    '--accent-cyan': '#00f0ff',
    '--accent-purple': '#a45cff',
    '--accent-pink': '#ff2fd6',
    '--accent-gradient': 'linear-gradient(135deg, #00f0ff 0%, #a45cff 45%, #ff2fd6 100%)',
    '--accent-cyan-soft': 'rgba(0, 240, 255, 0.32)',
    '--accent-purple-soft': 'rgba(255, 47, 214, 0.32)',
    /* 语义色 + 强调面文字 + 进度轨道 */
    '--success': '#2dd4bf',
    '--warning': '#facc15',
    '--danger': '#fb7185',
    '--on-accent': '#070b1f',
    '--track-bg': 'rgba(148, 163, 255, 0.16)',
    /* 字体栈 */
    '--font-sans': "'Inter', 'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', system-ui, -apple-system, sans-serif",
    '--font-serif': "'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'SimSun', Georgia, 'Times New Roman', serif",
    '--font-mono': "'JetBrains Mono', 'SF Mono', 'Cascadia Code', Consolas, monospace",
    /* 阴影：霓虹辉光 */
    '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.35)',
    '--shadow-md': '0 8px 24px rgba(0, 0, 0, 0.45)',
    '--shadow-lg': '0 16px 48px rgba(0, 0, 0, 0.6)',
    '--shadow-glow': '0 0 24px rgba(0, 240, 255, 0.45)',
    /* 圆角：更锐利，科技感 */
    '--radius-sm': '0.25rem',
    '--radius-md': '0.5rem',
    '--radius-lg': '0.75rem',
    '--radius-xl': '1.25rem',
    '--radius-pill': '9999px',
    /* 毛玻璃模糊 */
    '--blur-sm': '8px',
    '--blur-md': '20px',
    '--blur-lg': '40px'
  },
  extraCss: `
[data-theme='cyber-gradient'] .site-bg::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.028) 0 1px, transparent 1px 4px),
    radial-gradient(60rem 30rem at 85% -10%, rgba(255, 47, 214, 0.1), transparent 60%),
    radial-gradient(50rem 28rem at -10% 30%, rgba(0, 240, 255, 0.1), transparent 55%);
}
[data-theme='cyber-gradient'] .glass {
  box-shadow: 0 0 0 1px rgba(0, 240, 255, 0.1), 0 8px 24px rgba(0, 0, 0, 0.5);
}
[data-theme='cyber-gradient'] .glass--accent {
  box-shadow: 0 0 32px rgba(0, 240, 255, 0.35), 0 0 48px rgba(255, 47, 214, 0.2);
}
[data-theme='cyber-gradient'] h1,
[data-theme='cyber-gradient'] h2,
[data-theme='cyber-gradient'] h3 {
  letter-spacing: 0.01em;
}
`
}

/* ===================== 主题注册表 ===================== */
/**
 * THEMES — 主题字典：id → 主题对象。
 * 4 个精细主题：深色玻璃（默认）/ 浅色极简 / 暗金奢华 / 赛博渐变。
 * 切换器用 getThemes() 渲染按钮；未知 id 回退默认主题。
 */
export const THEMES = {
  'dark-glass': darkGlassTheme,
  'light-minimal': lightMinimalTheme,
  'gold-luxury': goldLuxuryTheme,
  'cyber-gradient': cyberGradientTheme
}

/** 默认主题 id */
export const DEFAULT_THEME = 'dark-glass'

/** 按 id 取主题；未知 id 回退默认主题（永不返回 undefined） */
export function getTheme(id) {
  return THEMES[id] ?? THEMES[DEFAULT_THEME]
}

/** 所有主题（按注册顺序），给主题切换器渲染用 */
export function getThemes() {
  return Object.values(THEMES)
}

export default THEMES
