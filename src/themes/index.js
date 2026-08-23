/* ============================================================
   themes/index.js — 主题层（THEME）注册表
   ------------------------------------------------------------
   三层分离中的【主题层】：决定"外观"（颜色/玻璃/字体/光效/风格），
   与模板（结构）、内容（文字）完全解耦：换主题不动内容。

   每个主题：
     {
       id: 'dark-glass',
       name: { zh: '极客', en: 'Geek Terminal' },   // 切换器按钮文案
       colorScheme: 'dark',            // 写到 :root 的 color-scheme
       preview: 'linear-gradient(...)', // 切换器预览圆点背景
       desc: { zh, en },                // 切换器悬浮提示（可选）
       cssVars: { '--var': value, … },  // 覆盖 tokens.css 变量的键值对
       extraCss: `…`,                   // 可选：该主题专属 CSS 片段
     }
   - cssVars 采用「完整覆盖」：每个主题都把 tokens.css 里影响视觉的
     变量全部列齐（颜色/玻璃/文字/强调/阴影/圆角/模糊/字体），
     主题自洽、互不泄漏；结构变量（间距/字号刻度/断点/过渡时长）
     沿用 tokens.css 默认，仅个别主题按需覆盖（如圆角/模糊）。
   - extraCss 由 useTheme() 注入为全局 <style>（切主题时替换内容），
     用于变量表达不了的装饰（扫描线/衬线标题/粗边框/糖果光晕），
     选择器统一以 [data-theme='<id>'] 开头（App 根节点带 data-theme）。

   四套主题 = 四套「视觉语言」，不是换色：
     1) dark-glass   极客终端   ：深黑绿 + 终端绿 + 扫描线 + 网格 + 等宽
     2) calm-business 沉着稳重  ：深蓝黑金 + 衬线标题 + 无光效 + 硬朗克制
     3) playful-pop  个性跳脱  ：奶油底 + 糖果撞色 + 粗边框 + 大圆角 + 贴纸阴影
     4) fresh-minimal 清新极简  ：浅底 + 细线 + 柔和绿蓝 + 轻盈留白
   ============================================================ */

/* ============================================================
   1) dark-glass — 极客（默认主题）
   深蓝黑底 + 青紫霓虹（第一版经典配色）+ 等宽字体细节。
   深色玻璃拟态为核心，等宽标题注入"代码/极客"气质。
   ============================================================ */
export const darkGlassTheme = {
  id: 'dark-glass',
  name: { zh: '极客', en: 'Geek' },
  colorScheme: 'dark',
  preview: 'linear-gradient(135deg, #0a0e1a 0%, #a78bfa 100%)',
  desc: {
    zh: '深蓝黑底、青紫霓虹、毛玻璃、等宽字体',
    en: 'Deep navy-black, cyan-purple neon, glassmorphism, monospace'
  },
  cssVars: {
    /* 背景：深蓝黑（第一版经典） */
    '--bg-base': '#0a0e1a',
    '--bg-elevated': '#0e1424',
    '--bg-deep': '#06080f',
    '--bg-grid': 'rgba(148, 163, 255, 0.05)',
    /* 玻璃卡片：低透明白 + 细高光边框 */
    '--glass-bg': 'rgba(255, 255, 255, 0.06)',
    '--glass-bg-strong': 'rgba(255, 255, 255, 0.1)',
    '--glass-bg-hover': 'rgba(255, 255, 255, 0.12)',
    '--glass-border': 'rgba(255, 255, 255, 0.12)',
    '--glass-border-hover': 'rgba(255, 255, 255, 0.24)',
    '--glass-highlight': 'rgba(255, 255, 255, 0.55)',
    /* 文字：近白 */
    '--text-primary': '#eef2ff',
    '--text-secondary': 'rgba(226, 232, 255, 0.72)',
    '--text-muted': 'rgba(203, 213, 255, 0.48)',
    /* 霓虹强调：青 / 紫渐变（第一版经典） */
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
    /* 字体栈：等宽细节（标题/按钮走 mono，极客感） */
    '--font-sans': "'Inter', 'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', system-ui, -apple-system, sans-serif",
    '--font-serif': "'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'SimSun', Georgia, 'Times New Roman', serif",
    '--font-mono': "'JetBrains Mono', 'SF Mono', 'Cascadia Code', Consolas, monospace",
    /* 阴影：深沉 + 青紫辉光 */
    '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.25)',
    '--shadow-md': '0 8px 24px rgba(0, 0, 0, 0.35)',
    '--shadow-lg': '0 16px 48px rgba(0, 0, 0, 0.5)',
    '--shadow-glow': '0 0 24px rgba(34, 211, 238, 0.35)',
    /* 圆角：偏锐利，终端面板感 */
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
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
[data-theme='dark-glass'] .site-bg::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    repeating-linear-gradient(0deg, rgba(148, 163, 255, 0.03) 0 1px, transparent 1px 3px),
    radial-gradient(60rem 30rem at 80% -10%, rgba(34, 211, 238, 0.07), transparent 60%),
    radial-gradient(50rem 30rem at 8% 22%, rgba(167, 139, 250, 0.07), transparent 55%);
}
[data-theme='dark-glass'] h1,
[data-theme='dark-glass'] h2,
[data-theme='dark-glass'] h3,
[data-theme='dark-glass'] h4 {
  font-family: var(--font-mono);
  letter-spacing: 0.02em;
}
[data-theme='dark-glass'] .glass {
  box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.06), var(--shadow-md);
}
[data-theme='dark-glass'] .glass--accent {
  box-shadow: 0 0 24px rgba(34, 211, 238, 0.25);
}
[data-theme='dark-glass'] .glass-btn,
[data-theme='dark-glass'] .glass-input {
  font-family: var(--font-mono);
}
`
}

/* ============================================================
   2) calm-business — 沉着稳重（商务）
   深蓝黑底 + 克制金强调 + 衬线标题 + 硬朗直角 + 无光效。
   厚重、可信、克制：不做霓虹、不做扫描线，只有冷静的层次。
   ============================================================ */
export const calmBusinessTheme = {
  id: 'calm-business',
  name: { zh: '沉着稳重', en: 'Calm Executive' },
  colorScheme: 'dark',
  preview: 'linear-gradient(135deg, #0c1017 0%, #c9a04a 100%)',
  desc: {
    zh: '深蓝黑底、克制金、衬线标题、硬朗直角、无花哨光效',
    en: 'Deep navy-black, restrained gold, serif headings, squared, no flashy glow'
  },
  cssVars: {
    /* 背景：深蓝黑 */
    '--bg-base': '#0c1017',
    '--bg-elevated': '#11161f',
    '--bg-deep': '#070a0f',
    '--bg-grid': 'rgba(212, 178, 100, 0.05)',
    /* 玻璃卡片：极低透明 + 细金发丝边 */
    '--glass-bg': 'rgba(255, 255, 255, 0.04)',
    '--glass-bg-strong': 'rgba(255, 255, 255, 0.07)',
    '--glass-bg-hover': 'rgba(255, 255, 255, 0.09)',
    '--glass-border': 'rgba(212, 178, 100, 0.2)',
    '--glass-border-hover': 'rgba(212, 178, 100, 0.45)',
    '--glass-highlight': 'rgba(212, 178, 100, 0.35)',
    /* 文字：暖象牙白 */
    '--text-primary': '#f2efe8',
    '--text-secondary': 'rgba(242, 239, 232, 0.72)',
    '--text-muted': 'rgba(200, 195, 180, 0.5)',
    /* 克制金强调：金/青铜/钢蓝 */
    '--accent-cyan': '#c9a04a',
    '--accent-purple': '#9a8450',
    '--accent-pink': '#6b7f99',
    '--accent-gradient': 'linear-gradient(135deg, #d4b264 0%, #8a7a4d 100%)',
    '--accent-cyan-soft': 'rgba(212, 178, 100, 0.12)',
    '--accent-purple-soft': 'rgba(107, 127, 153, 0.12)',
    /* 语义色（降饱和，不刺眼）+ 强调面文字 + 进度轨道 */
    '--success': '#8aa27a',
    '--warning': '#b98a3f',
    '--danger': '#b0554d',
    '--on-accent': '#0c1017',
    '--track-bg': 'rgba(212, 178, 100, 0.14)',
    /* 字体栈：衬线标题（商务） */
    '--font-sans': "'Inter', 'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', system-ui, -apple-system, sans-serif",
    '--font-serif': "'Playfair Display', 'Cormorant Garamond', 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', Georgia, 'Times New Roman', serif",
    '--font-mono': "'JetBrains Mono', 'SF Mono', 'Cascadia Code', Consolas, monospace",
    /* 阴影：深沉厚重，无彩色光效 */
    '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.5)',
    '--shadow-md': '0 12px 32px rgba(0, 0, 0, 0.55)',
    '--shadow-lg': '0 24px 64px rgba(0, 0, 0, 0.65)',
    '--shadow-glow': '0 8px 28px rgba(0, 0, 0, 0.4)',
    /* 圆角：更小、硬朗 */
    '--radius-sm': '0.25rem',
    '--radius-md': '0.375rem',
    '--radius-lg': '0.5rem',
    '--radius-xl': '0.75rem',
    '--radius-pill': '9999px',
    /* 毛玻璃模糊：更低（偏实体、不漂浮） */
    '--blur-sm': '6px',
    '--blur-md': '14px',
    '--blur-lg': '28px'
  },
  extraCss: `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Cormorant+Garamond:wght@500;600&display=swap');
/* 无网格：干净商务底（保留极淡金径向光 + 底部压暗） */
[data-theme='calm-business'] .site-bg::before { display: none; }
[data-theme='calm-business'] .site-bg::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(70rem 40rem at 85% -10%, rgba(212, 178, 100, 0.06), transparent 60%),
    linear-gradient(180deg, rgba(12, 16, 23, 0) 0%, rgba(12, 16, 23, 0.5) 100%);
}
[data-theme='calm-business'] h1,
[data-theme='calm-business'] h2,
[data-theme='calm-business'] h3,
[data-theme='calm-business'] h4 {
  font-family: var(--font-serif);
  font-weight: 600;
  letter-spacing: 0.015em;
}
[data-theme='calm-business'] .glass {
  box-shadow: inset 0 1px 0 rgba(212, 178, 100, 0.08), 0 12px 32px rgba(0, 0, 0, 0.55);
}
[data-theme='calm-business'] .glass::before { opacity: 0.35; }
[data-theme='calm-business'] .glass--accent {
  box-shadow: inset 0 0 0 1px rgba(212, 178, 100, 0.35), 0 12px 32px rgba(0, 0, 0, 0.55);
}
`
}

/* ============================================================
   3) playful-pop — 个性跳脱（年轻活泼）
   奶油暖底 + 糖果撞色 + 粗边框 + 大圆角 + 贴纸式硬阴影 + 俏皮字体。
   明亮、有活力、像彩色贴纸手册，跟"玻璃拟态"完全不同。
   ============================================================ */
export const playfulPopTheme = {
  id: 'playful-pop',
  name: { zh: '个性跳脱', en: 'Playful Pop' },
  colorScheme: 'light',
  preview: 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 55%, #4ecdc4 100%)',
  desc: {
    zh: '奶油底、糖果撞色、粗边框、大圆角、贴纸阴影、俏皮字体',
    en: 'Cream base, candy clash colors, thick borders, big radii, sticker shadows'
  },
  cssVars: {
    /* 背景：奶油暖底 */
    '--bg-base': '#fff7e8',
    '--bg-elevated': '#ffffff',
    '--bg-deep': '#ffe9c9',
    '--bg-grid': 'rgba(255, 107, 107, 0.06)',
    /* 卡片：近实心白 + 珊瑚粗边（粗度由 extraCss 的 border-width 实现） */
    '--glass-bg': 'rgba(255, 255, 255, 0.88)',
    '--glass-bg-strong': 'rgba(255, 255, 255, 0.97)',
    '--glass-bg-hover': 'rgba(255, 255, 255, 1)',
    '--glass-border': '#ff6b6b',
    '--glass-border-hover': '#ff5fa2',
    '--glass-highlight': 'rgba(255, 217, 61, 0.5)',
    /* 文字：深梅子墨 */
    '--text-primary': '#2d1b3d',
    '--text-secondary': 'rgba(45, 27, 61, 0.72)',
    '--text-muted': 'rgba(45, 27, 61, 0.5)',
    /* 糖果撞色：珊瑚/阳光黄/果冻粉 */
    '--accent-cyan': '#ff6b6b',
    '--accent-purple': '#ffd93d',
    '--accent-pink': '#ff5fa2',
    '--accent-gradient': 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 50%, #4ecdc4 100%)',
    '--accent-cyan-soft': 'rgba(255, 107, 107, 0.18)',
    '--accent-purple-soft': 'rgba(255, 217, 61, 0.28)',
    /* 语义色 + 强调面文字（深墨，糖果面可读）+ 进度轨道 */
    '--success': '#2ec4b6',
    '--warning': '#f9a826',
    '--danger': '#ff5f6d',
    '--on-accent': '#2d1b3d',
    '--track-bg': 'rgba(45, 27, 61, 0.12)',
    /* 字体栈：俏皮圆体（拉丁 Baloo 2，中文 ZCOOL 快乐体优先，回退黑体） */
    '--font-sans': "'Baloo 2', 'ZCOOL KuaiLe', 'Comic Sans MS', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
    '--font-serif': "'Baloo 2', 'ZCOOL KuaiLe', 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', Georgia, 'Times New Roman', serif",
    '--font-mono': "'JetBrains Mono', 'SF Mono', 'Cascadia Code', Consolas, monospace",
    /* 阴影：贴纸式硬阴影（偏移实色） */
    '--shadow-sm': '0 2px 0 rgba(45, 27, 61, 0.1)',
    '--shadow-md': '0 6px 0 rgba(45, 27, 61, 0.12), 0 12px 28px rgba(45, 27, 61, 0.16)',
    '--shadow-lg': '0 10px 0 rgba(45, 27, 61, 0.12), 0 24px 48px rgba(45, 27, 61, 0.2)',
    '--shadow-glow': '0 6px 0 rgba(255, 107, 107, 0.25), 0 12px 28px rgba(45, 27, 61, 0.18)',
    /* 圆角：大而圆润，俏皮 */
    '--radius-sm': '1rem',
    '--radius-md': '1.25rem',
    '--radius-lg': '1.5rem',
    '--radius-xl': '2rem',
    '--radius-pill': '9999px',
    /* 毛玻璃模糊：低（近实心卡，轻模糊） */
    '--blur-sm': '6px',
    '--blur-md': '12px',
    '--blur-lg': '20px'
  },
  extraCss: `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=ZCOOL+KuaiLe&display=swap');
/* 糖果光斑底 */
[data-theme='playful-pop'] .site-bg::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(28rem 28rem at 10% 6%, rgba(255, 217, 61, 0.2), transparent 60%),
    radial-gradient(30rem 30rem at 90% 14%, rgba(255, 95, 162, 0.14), transparent 60%),
    radial-gradient(34rem 34rem at 72% 92%, rgba(46, 196, 182, 0.14), transparent 60%);
}
[data-theme='playful-pop'] h1,
[data-theme='playful-pop'] h2,
[data-theme='playful-pop'] h3,
[data-theme='playful-pop'] h4 {
  font-weight: 800;
  letter-spacing: -0.015em;
}
/* 粗边框：所有玻璃卡/输入/按钮 2.5px 实边 */
[data-theme='playful-pop'] .glass,
[data-theme='playful-pop'] .glass--strong {
  border-width: 2.5px;
  box-shadow: 0 6px 0 rgba(45, 27, 61, 0.12), 0 12px 28px rgba(45, 27, 61, 0.16);
}
[data-theme='playful-pop'] .glass--accent {
  border-width: 2.5px;
  box-shadow: 0 6px 0 rgba(255, 107, 107, 0.28), 0 12px 28px rgba(45, 27, 61, 0.18);
}
[data-theme='playful-pop'] .glass-btn,
[data-theme='playful-pop'] .glass-input {
  border-width: 2.5px;
  box-shadow: 0 4px 0 rgba(45, 27, 61, 0.14);
}
/* 按下的贴纸回弹 */
[data-theme='playful-pop'] .glass-btn:active,
[data-theme='playful-pop'] .theme-picker__btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 rgba(45, 27, 61, 0.14);
}
`
}

/* ============================================================
   4) fresh-minimal — 清新极简
   近白浅底 + 柔和绿/蓝 + 发丝细线 + 大留白 + 轻盈柔和投影。
   安静、透气、细腻：跟跳脱的撞色完全相反。
   ============================================================ */
export const freshMinimalTheme = {
  id: 'fresh-minimal',
  name: { zh: '清新极简', en: 'Fresh Minimal' },
  colorScheme: 'light',
  preview: 'linear-gradient(135deg, #f7f9f8 0%, #5aa48f 100%)',
  desc: {
    zh: '浅色底、柔和绿蓝、发丝细线、大留白、轻盈投影',
    en: 'Light base, soft sage & sky, hairline borders, whitespace, airy shadows'
  },
  cssVars: {
    /* 背景：近白浅底（带一丝绿意） */
    '--bg-base': '#f7f9f8',
    '--bg-elevated': '#ffffff',
    '--bg-deep': '#eef3f1',
    '--bg-grid': 'rgba(90, 164, 143, 0.05)',
    /* 玻璃卡片：空气感半透明白 + 发丝细边 */
    '--glass-bg': 'rgba(255, 255, 255, 0.6)',
    '--glass-bg-strong': 'rgba(255, 255, 255, 0.85)',
    '--glass-bg-hover': 'rgba(255, 255, 255, 0.95)',
    '--glass-border': 'rgba(45, 85, 75, 0.1)',
    '--glass-border-hover': 'rgba(90, 164, 143, 0.35)',
    '--glass-highlight': 'rgba(255, 255, 255, 0.9)',
    /* 文字：深苔墨 */
    '--text-primary': '#1f3d36',
    '--text-secondary': 'rgba(31, 61, 54, 0.7)',
    '--text-muted': 'rgba(31, 61, 54, 0.5)',
    /* 柔和绿蓝：鼠尾草绿/天蓝/淡粉 */
    '--accent-cyan': '#5aa48f',
    '--accent-purple': '#7fa8c9',
    '--accent-pink': '#e8a2b0',
    '--accent-gradient': 'linear-gradient(135deg, #5aa48f 0%, #7fa8c9 100%)',
    '--accent-cyan-soft': 'rgba(90, 164, 143, 0.14)',
    '--accent-purple-soft': 'rgba(127, 168, 201, 0.14)',
    /* 语义色（柔和版）+ 强调面文字 + 进度轨道 */
    '--success': '#6db694',
    '--warning': '#c9a95c',
    '--danger': '#d9826b',
    '--on-accent': '#ffffff',
    '--track-bg': 'rgba(31, 61, 54, 0.1)',
    /* 字体栈：干净无衬线 + 字距留白 */
    '--font-sans': "'Inter', 'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', system-ui, -apple-system, sans-serif",
    '--font-serif': "'Cormorant Garamond', 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', Georgia, 'Times New Roman', serif",
    '--font-mono': "'JetBrains Mono', 'SF Mono', 'Cascadia Code', Consolas, monospace",
    /* 阴影：轻、低对比、通透 */
    '--shadow-sm': '0 1px 2px rgba(31, 61, 54, 0.04)',
    '--shadow-md': '0 12px 32px rgba(31, 61, 54, 0.07)',
    '--shadow-lg': '0 24px 60px rgba(31, 61, 54, 0.1)',
    '--shadow-glow': '0 0 20px rgba(90, 164, 143, 0.12)',
    /* 圆角：柔和适中 */
    '--radius-sm': '0.5rem',
    '--radius-md': '0.75rem',
    '--radius-lg': '1rem',
    '--radius-xl': '1.25rem',
    '--radius-pill': '9999px',
    /* 毛玻璃模糊 */
    '--blur-sm': '8px',
    '--blur-md': '18px',
    '--blur-lg': '32px'
  },
  extraCss: `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600&display=swap');
/* 柔和背景光晕 */
[data-theme='fresh-minimal'] .site-bg::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(50rem 30rem at 85% -5%, rgba(90, 164, 143, 0.08), transparent 60%),
    radial-gradient(40rem 28rem at 8% 30%, rgba(127, 168, 201, 0.07), transparent 55%);
}
[data-theme='fresh-minimal'] h1,
[data-theme='fresh-minimal'] h2,
[data-theme='fresh-minimal'] h3,
[data-theme='fresh-minimal'] h4 {
  font-weight: 600;
  letter-spacing: 0.05em;
}
[data-theme='fresh-minimal'] .glass {
  box-shadow: 0 1px 2px rgba(31, 61, 54, 0.03), 0 16px 40px rgba(31, 61, 54, 0.06);
}
[data-theme='fresh-minimal'] .glass::before { opacity: 0.4; }
[data-theme='fresh-minimal'] .glass--accent {
  box-shadow: 0 0 0 1px rgba(90, 164, 143, 0.18), 0 16px 40px rgba(90, 164, 143, 0.1);
}
`
}

/* ===================== 主题注册表 ===================== */
/**
 * THEMES — 主题字典：id → 主题对象。
 * 4 套「视觉语言」主题：极客终端（默认）/ 沉着稳重 / 个性跳脱 / 清新极简。
 * 切换器用 getThemes() 渲染按钮；未知 id 回退默认主题。
 */
export const THEMES = {
  'dark-glass': darkGlassTheme,
  'calm-business': calmBusinessTheme,
  'playful-pop': playfulPopTheme,
  'fresh-minimal': freshMinimalTheme
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
