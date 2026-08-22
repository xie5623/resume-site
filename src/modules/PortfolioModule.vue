<script setup>
/**
 * PortfolioModule — 作品集（占位内容，图块用纯 CSS 渐变）
 * 契约：props = { config, lang }；revealed 由 App 装配层驱动 + TextReveal。
 * 布局变体：'a' 瀑布栅格（默认）｜'b' 等宽栅格｜'c' 大图轮播式
 */
import { computed } from 'vue'
import { useModuleReveal } from '@/composables/moduleReveal'
import { useVersion } from '@/composables/useVersion'
import TextReveal from '@/components/TextReveal.vue'

const props = defineProps({
  config: { type: Object, required: true },
  lang: { type: String, default: 'zh' }
})

/* ---------- 按版本分区双语词典（键名按模块命名空间） ---------- */
const DICT = {
  /* ---------- 资深版 ---------- */
  senior: {
    zh: {
      'portfolio.title': '作品集',
      'portfolio.subtitle': '代表性项目（占位示例 · 纯渐变占位图）',
      'portfolio.view': '查看详情',
      'portfolio.item1.title': '电商平台重构',
      'portfolio.item1.tag': 'Web 应用',
      'portfolio.item2.title': '数据可视化大屏',
      'portfolio.item2.tag': '可视化',
      'portfolio.item3.title': '移动端点餐小程序',
      'portfolio.item3.tag': '小程序',
      'portfolio.item4.title': '开源组件库',
      'portfolio.item4.tag': '开源',
      'portfolio.item5.title': '品牌官网',
      'portfolio.item5.tag': '官网',
      'portfolio.item6.title': '游戏化学习应用',
      'portfolio.item6.tag': '游戏化'
    },
    en: {
      'portfolio.title': 'Portfolio',
      'portfolio.subtitle': 'Selected work (placeholder · CSS gradient covers)',
      'portfolio.view': 'View project',
      'portfolio.item1.title': 'E-commerce Platform Redesign',
      'portfolio.item1.tag': 'Web App',
      'portfolio.item2.title': 'Data Visualization Dashboard',
      'portfolio.item2.tag': 'Visualization',
      'portfolio.item3.title': 'Mobile Food-ordering Mini App',
      'portfolio.item3.tag': 'Mini App',
      'portfolio.item4.title': 'Open-source Component Library',
      'portfolio.item4.tag': 'Open Source',
      'portfolio.item5.title': 'Brand Website',
      'portfolio.item5.tag': 'Website',
      'portfolio.item6.title': 'Gamified Learning App',
      'portfolio.item6.tag': 'Gamified'
    }
  },

  /* ---------- 应届生版（graduate 版当前未渲染此模块，文案备用） ---------- */
  graduate: {
    zh: {
      'portfolio.title': '作品集',
      'portfolio.subtitle': '课程与个人作品（占位示例 · 纯渐变占位图）',
      'portfolio.view': '查看详情',
      'portfolio.item1.title': '课程设计：图书管理系统',
      'portfolio.item1.tag': 'Web 应用',
      'portfolio.item2.title': '毕业设计：校园平台',
      'portfolio.item2.tag': '全栈',
      'portfolio.item3.title': '个人简历网站',
      'portfolio.item3.tag': '前端',
      'portfolio.item4.title': '数据可视化练习',
      'portfolio.item4.tag': '可视化',
      'portfolio.item5.title': '团队项目作品',
      'portfolio.item5.tag': '协作',
      'portfolio.item6.title': '个人练习作品',
      'portfolio.item6.tag': '前端'
    },
    en: {
      'portfolio.title': 'Portfolio',
      'portfolio.subtitle': 'Coursework & personal work (placeholder · CSS gradient covers)',
      'portfolio.view': 'View project',
      'portfolio.item1.title': 'Coursework: Library System',
      'portfolio.item1.tag': 'Web App',
      'portfolio.item2.title': 'Graduation: Campus Platform',
      'portfolio.item2.tag': 'Full-stack',
      'portfolio.item3.title': 'Personal Resume Site',
      'portfolio.item3.tag': 'Frontend',
      'portfolio.item4.title': 'Data Visualization',
      'portfolio.item4.tag': 'Visualization',
      'portfolio.item5.title': 'Team Project',
      'portfolio.item5.tag': 'Team',
      'portfolio.item6.title': 'Personal Practice',
      'portfolio.item6.tag': 'Frontend'
    }
  }
}

/* t('portfolio.*') 自动跟随版本：当前版本 → 资深版兜底 → key */
const { version } = useVersion()
const t = (key) => (
  DICT[version.value]?.[props.lang]?.[key]
  ?? DICT.senior?.[props.lang]?.[key]
  ?? DICT.senior?.zh?.[key]
  ?? key
)

/* 每个条目绑定一个渐变变体类（颜色全部取自 tokens） */
const items = computed(() => [1, 2, 3, 4, 5, 6].map((i) => ({
  title: t(`portfolio.item${i}.title`),
  tag: t(`portfolio.item${i}.tag`),
  cover: `pf-cover--${i}`,
  num: String(i).padStart(2, '0')
})))

/* ---------- 入场状态（revealed 由 App 装配层 ModuleSection 驱动） ---------- */
const revealed = useModuleReveal(props.config.id)
const variant = computed(() => (['a', 'b', 'c'].includes(props.config.variant) ? props.config.variant : 'a'))
</script>

<template>
  <section
    class="pf container"
    :data-revealed="revealed ? 'yes' : 'no'"
    :class="`pf--${variant}`"
  >
    <header class="module__head">
      <span class="module__kicker">PORTFOLIO</span>
      <h2 class="module__title" :class="{ 'text-emphasize': config.emphasize }">
        <TextReveal :anim="config.textAnim" :text="t('portfolio.title')" :delay="0.05" />
      </h2>
      <p class="module__subtitle">
        <TextReveal :anim="config.textAnim" :text="t('portfolio.subtitle')" :delay="0.25" />
      </p>
    </header>

    <ul class="pf__grid">
      <li v-for="(item, i) in items" :key="i" class="pf__item">
        <article class="glass pf__card" tabindex="0">
          <div class="pf__cover" :class="item.cover" aria-hidden="true">
            <span class="pf__cover-num">{{ item.num }}</span>
            <span class="pf__cover-glyph">◈</span>
          </div>
          <div class="pf__meta">
            <div>
              <h3 class="pf__title">{{ item.title }}</h3>
              <span class="pf__tag">{{ item.tag }}</span>
            </div>
            <span class="pf__link">{{ t('portfolio.view') }} →</span>
          </div>
        </article>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.pf {
  padding: var(--space-10) 0;
}

/* ---------- 模块头 ---------- */
.module__head {
  margin-bottom: var(--space-8);
}
.module__kicker {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--accent-cyan);
  background: var(--accent-cyan-soft);
  border: 1px solid var(--glass-border);
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  margin-bottom: var(--space-3);
}
.module__title {
  font-size: calc(var(--fs-xl) * var(--fs-scale, 1));
  margin-bottom: var(--space-2);
}
.module__subtitle {
  font-size: calc(var(--fs-md) * var(--fs-scale, 1));
  color: var(--text-secondary);
  margin: 0;
}

/* ---------- 画廊栅格 ---------- */
.pf__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-5);
  margin: 0;
  padding: 0;
  list-style: none;
}
.pf__item {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out);
}
.pf[data-revealed='yes'] .pf__item {
  opacity: 1;
  transform: none;
}
.pf[data-revealed='yes'] .pf__item:nth-child(1) { transition-delay: 0.03s; }
.pf[data-revealed='yes'] .pf__item:nth-child(2) { transition-delay: 0.1s; }
.pf[data-revealed='yes'] .pf__item:nth-child(3) { transition-delay: 0.17s; }
.pf[data-revealed='yes'] .pf__item:nth-child(4) { transition-delay: 0.24s; }
.pf[data-revealed='yes'] .pf__item:nth-child(5) { transition-delay: 0.31s; }
.pf[data-revealed='yes'] .pf__item:nth-child(6) { transition-delay: 0.38s; }

/* 默认变体 a：首块作为宽幅主视觉（桌面端），其余等高 */
@media (min-width: 760px) {
  .pf--a .pf__item:first-child {
    grid-column: span 2;
  }
}

.pf__card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.pf__card:hover,
.pf__card:focus-visible {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  outline: none;
}
.pf__cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  display: grid;
  place-items: center;
  overflow: hidden;
}
.pf__cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 100% at 50% 0%, var(--glass-highlight) 0%, transparent 55%),
    repeating-linear-gradient(45deg, var(--glass-highlight) 0 2px, transparent 2px 12px);
  opacity: 0.22;
  mix-blend-mode: overlay;
  pointer-events: none;
}
.pf__cover-num {
  position: absolute;
  top: var(--space-3);
  left: var(--space-4);
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.2em;
  color: var(--text-primary);
}
.pf__cover-glyph {
  font-size: 2.5rem;
  color: var(--text-primary);
  text-shadow: 0 2px 12px var(--bg-deep);
  transition: transform var(--dur-base) var(--ease-out);
}
.pf__card:hover .pf__cover-glyph,
.pf__card:focus-visible .pf__cover-glyph {
  transform: scale(1.15) rotate(-6deg);
}

/* 渐变封面：颜色全部取自 tokens（无硬编码色值） */
.pf-cover--1 { background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple)); }
.pf-cover--2 { background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink)); }
.pf-cover--3 { background: linear-gradient(135deg, var(--accent-pink), var(--accent-cyan)); }
.pf-cover--4 { background: linear-gradient(160deg, var(--accent-cyan), var(--accent-pink)); }
.pf-cover--5 { background: linear-gradient(160deg, var(--accent-purple), var(--accent-cyan)); }
.pf-cover--6 { background: linear-gradient(160deg, var(--accent-pink), var(--accent-purple)); }

.pf__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
}
.pf__title {
  font-size: calc(var(--fs-md) * var(--fs-scale, 1));
  margin-bottom: var(--space-1);
}
.pf__tag {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  font-family: var(--font-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pf__link {
  font-size: var(--fs-sm);
  color: var(--accent-cyan);
  white-space: nowrap;
}

/* ---------- 变体 b：等宽栅格 ---------- */
.pf--b .pf__grid {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
.pf--b .pf__cover {
  aspect-ratio: 4 / 3;
}

/* ---------- 变体 c：居中大图 ---------- */
.pf--c .module__head {
  text-align: center;
}
.pf--c .pf__grid {
  grid-template-columns: 1fr;
  max-width: 720px;
  margin-inline: auto;
}
.pf--c .pf__cover {
  aspect-ratio: 21 / 9;
}

/* 移动端：单列等高卡片 */
@media (max-width: 720px) {
  .pf--a .pf__grid,
  .pf--b .pf__grid {
    grid-template-columns: 1fr;
  }
  .pf--a .pf__item:first-child {
    grid-column: auto;
  }
  .pf__cover {
    aspect-ratio: 16 / 10;
  }
}
</style>
