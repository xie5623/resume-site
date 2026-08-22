<script setup>
/**
 * ProjectsModule — 项目经验（id: projects）
 * 卡片网格（占位项目名/描述/标签/链接），config.variant 切换：
 *  - a：双列卡片网格
 *  - b：三列卡片网格
 *  - c：首张精选大卡 + 双列网格
 *
 * 全部文案走 i18n 词典（键名按 proj.* 命名空间），数据数组只存键名。
 * Props 契约见 ARCHITECTURE.md：config / lang
 */
import { computed } from 'vue'
import { useModuleReveal } from '@/composables/moduleReveal'
import { useVersion } from '@/composables/useVersion'
import TextReveal from '@/components/TextReveal.vue'

const props = defineProps({
  config: { type: Object, required: true },
  lang: { type: String, default: 'zh' }
})

/* ===================== i18n（按版本分区词典，键名对齐全局 i18n 命名空间） ===================== */
const DICT = {
  /* ---------- 资深版 ---------- */
  senior: {
    zh: {
      'projects.eyebrow': '代表作品',
      'projects.title':   '项目经验',
      'projects.sub':     '占位项目卡片，链接指向 # 占位。',
      'projects.demo':    '在线演示',
      'projects.github':  '源码',

      'projects.item1.name': '智能简历生成器',
      'projects.item1.desc': '输入关键词即可生成排版精致的简历站点，支持中英双语与多套主题，AI 润色一键完成。',

      'projects.item2.name': '玻璃拟态组件库',
      'projects.item2.desc': '一套基于设计令牌的深色玻璃拟态 Vue 组件库，开箱即用，视觉一致。',

      'projects.item3.name': '实时数据看板',
      'projects.item3.desc': '低延迟的实时指标监控大屏，支持多数据源接入与自定义布局。',

      'projects.item4.name': '电商小程序',
      'projects.item4.desc': '覆盖商品、购物车、订单与支付流程的微信小程序，日活过万。',

      'projects.item5.name': 'Markdown 编辑器',
      'projects.item5.desc': '极简的所见即所得 Markdown 编辑器，支持实时预览与导出。',

      'projects.item6.name': '天气查询应用',
      'projects.item6.desc': '带动态背景与城市搜索的天气应用，支持多日预报与单位切换。'
    },
    en: {
      'projects.eyebrow': 'WORK',
      'projects.title':   'Projects',
      'projects.sub':     'Placeholder cards; links point to # for now.',
      'projects.demo':    'Live Demo',
      'projects.github':  'Source',

      'projects.item1.name': 'Smart Resume Builder',
      'projects.item1.desc': 'Generate a beautifully typeset resume site from a few keywords — bilingual, multi-theme, one-click AI polish.',

      'projects.item2.name': 'Glassmorphism UI Kit',
      'projects.item2.desc': 'A dark glassmorphism Vue component library driven by design tokens — consistent and ready to use.',

      'projects.item3.name': 'Real-Time Dashboard',
      'projects.item3.desc': 'Low-latency live metrics monitoring with multi-source ingestion and custom layouts.',

      'projects.item4.name': 'E-Commerce Mini-App',
      'projects.item4.desc': 'A WeChat mini-program covering products, cart, orders, and payments — 10k+ DAU.',

      'projects.item5.name': 'Markdown Editor',
      'projects.item5.desc': 'A minimal WYSIWYG Markdown editor with live preview and export.',

      'projects.item6.name': 'Weather App',
      'projects.item6.desc': 'A weather app with dynamic backgrounds, city search, multi-day forecasts, and unit toggles.'
    }
  },

  /* ---------- 应届生版：课程设计 / 毕业设计 / 个人项目口吻 ---------- */
  graduate: {
    zh: {
      'projects.eyebrow': '课程作品',
      'projects.title':   '项目实践',
      'projects.sub':     '课程设计、毕业设计与个人项目占位，链接指向 #。',
      'projects.demo':    '在线演示',
      'projects.github':  '源码',

      'projects.item1.name': '毕业设计：校园二手交易平台',
      'projects.item1.desc': '用 Vue 3 + Node.js 实现二手商品发布与交易流程，独立完成前后端。',

      'projects.item2.name': '课程设计：图书管理系统',
      'projects.item2.desc': '小组课程设计，负责前端页面与交互，按需求文档完成功能迭代。',

      'projects.item3.name': '个人项目：简历网站',
      'projects.item3.desc': '自学 Vue 3 后独立完成的个人网站，实践响应式布局与动画。',

      'projects.item4.name': '课程设计：校园活动报名系统',
      'projects.item4.desc': '前端 + 本地存储实现活动发布与报名，练习组件化开发。',

      'projects.item5.name': '个人项目：待办与笔记应用',
      'projects.item5.desc': '用 TypeScript + Vite 实现，练习状态管理与类型系统。',

      'projects.item6.name': '小组项目：数据可视化练习',
      'projects.item6.desc': '用 ECharts 完成课堂数据的可视化展示，熟悉图表配置。'
    },
    en: {
      'projects.eyebrow': 'PROJECTS',
      'projects.title':   'Projects',
      'projects.sub':     'Placeholder for coursework, graduation, and personal projects; links point to #.',
      'projects.demo':    'Live Demo',
      'projects.github':  'Source',

      'projects.item1.name': 'Graduation Project: Campus Second-hand Platform',
      'projects.item1.desc': 'Built listing & trading flows with Vue 3 and Node.js, frontend and backend solo.',

      'projects.item2.name': 'Course Project: Library Management System',
      'projects.item2.desc': 'Group coursework — owned the frontend UI and interactions, iterating against a requirements doc.',

      'projects.item3.name': 'Personal Project: Resume Website',
      'projects.item3.desc': 'Built solo after self-learning Vue 3, practicing responsive layouts and animation.',

      'projects.item4.name': 'Course Project: Campus Event Registration',
      'projects.item4.desc': 'Frontend + local storage for event publishing and registration — practiced componentization.',

      'projects.item5.name': 'Personal Project: Todo & Notes App',
      'projects.item5.desc': 'TypeScript + Vite; practiced state management and the type system.',

      'projects.item6.name': 'Team Project: Data Visualization',
      'projects.item6.desc': 'Used ECharts to visualize classroom data and get familiar with chart config.'
    }
  }
}

/* t('projects.*') 自动跟随版本：当前版本 → 资深版兜底 → key */
const { version } = useVersion()
const t = (key) => (
  DICT[version.value]?.[props.lang]?.[key]
  ?? DICT.senior?.[props.lang]?.[key]
  ?? DICT.senior?.zh?.[key]
  ?? key
)

/* ===================== 入场状态（revealed 由 App 装配层 ModuleSection 驱动） ===================== */
const revealed = useModuleReveal(props.config.id)

/* ===================== 强调（字号由 App 层 --fs-scale 统一注入） ===================== */
const emphasizeClass = computed(() => (props.config.emphasize ? 'text-emphasize' : ''))

/* ===================== 占位项目数据（只存键名） ===================== */
const PROJECTS = [
  { name: 'projects.item1.name', desc: 'projects.item1.desc', tags: ['Vue 3', 'Vite', 'OpenAI', 'GSAP'], year: '2024', featured: true },
  { name: 'projects.item2.name', desc: 'projects.item2.desc', tags: ['Vue 3', 'TypeScript', 'SCSS'], year: '2024' },
  { name: 'projects.item3.name', desc: 'projects.item3.desc', tags: ['React', 'WebSocket', 'ECharts'], year: '2023' },
  { name: 'projects.item4.name', desc: 'projects.item4.desc', tags: ['WeChat', 'JavaScript', 'CloudBase'], year: '2023' },
  { name: 'projects.item5.name', desc: 'projects.item5.desc', tags: ['TypeScript', 'Monaco', 'Electron'], year: '2022' },
  { name: 'projects.item6.name', desc: 'projects.item6.desc', tags: ['Vue 2', 'REST', 'PWA'], year: '2022' }
]

/* 卡片列数：variant b 用 3 列，其余 2 列 */
const gridClass = computed(() => (props.config.variant === 'b' ? 'hm-proj__grid--3' : 'hm-proj__grid--2'))
</script>

<template>
  <section
    class="hm-proj"
    :class="[`hm-proj--${config.variant}`, { 'is-revealed': revealed }]"
  >
    <div class="container">
      <!-- ======== 区块标题 ======== -->
      <header class="hm-proj__head">
        <span class="hm-proj__eyebrow">{{ t('projects.eyebrow') }}</span>
        <h2 class="hm-proj__title" :class="emphasizeClass">
          <TextReveal :anim="config.textAnim" :text="t('projects.title')" :delay="0.1" />
        </h2>
        <span class="hm-proj__line"></span>
        <p class="hm-proj__sub">{{ t('projects.sub') }}</p>
      </header>

      <!-- ======== variant c：精选大卡 ======== -->
      <article
        v-if="config.variant === 'c' && PROJECTS[0]"
        class="hm-proj__feature glass glass--accent"
      >
        <div class="hm-proj__feature-body">
          <span class="hm-proj__year">{{ PROJECTS[0].year }}</span>
          <h3 class="hm-proj__feature-title">{{ t(PROJECTS[0].name) }}</h3>
          <p class="hm-proj__feature-desc">{{ t(PROJECTS[0].desc) }}</p>
          <ul class="hm-proj__tags">
            <li v-for="tag in PROJECTS[0].tags" :key="tag" class="hm-proj__tag">{{ tag }}</li>
          </ul>
          <div class="hm-proj__links">
            <a class="glass-btn glass-btn--accent" href="#">{{ t('projects.demo') }}</a>
            <a class="glass-btn" href="#">{{ t('projects.github') }}</a>
          </div>
        </div>
        <div class="hm-proj__feature-art" aria-hidden="true">
          <span class="hm-proj__art-ring"></span>
          <span class="hm-proj__art-bar hm-proj__art-bar--1"></span>
          <span class="hm-proj__art-bar hm-proj__art-bar--2"></span>
          <span class="hm-proj__art-bar hm-proj__art-bar--3"></span>
        </div>
      </article>

      <!-- ======== 卡片网格（variant c 时从第 2 个开始） ======== -->
      <div class="hm-proj__grid" :class="gridClass">
        <article
          v-for="p in (config.variant === 'c' ? PROJECTS.slice(1) : PROJECTS)"
          :key="p.name"
          class="hm-proj__card glass glass--glow"
        >
          <div class="hm-proj__card-top">
            <span class="hm-proj__year">{{ p.year }}</span>
            <span class="hm-proj__pulse" aria-hidden="true"></span>
          </div>
          <h3 class="hm-proj__card-title">{{ t(p.name) }}</h3>
          <p class="hm-proj__card-desc">{{ t(p.desc) }}</p>
          <ul class="hm-proj__tags">
            <li v-for="tag in p.tags" :key="tag" class="hm-proj__tag">{{ tag }}</li>
          </ul>
          <div class="hm-proj__links">
            <a class="hm-proj__link" href="#">{{ t('projects.demo') }} →</a>
            <a class="hm-proj__link" href="#">{{ t('projects.github') }}</a>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hm-proj { padding: var(--space-8) 0; }

/* ---------- 标题 ---------- */
.hm-proj__head { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-8); }
.hm-proj__eyebrow {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--accent-cyan);
}
.hm-proj__title { font-size: calc(var(--fs-2xl) * var(--fs-scale)); }
.hm-proj__line {
  width: 56px; height: 3px;
  border-radius: var(--radius-pill);
  background: var(--accent-gradient);
}
.hm-proj__sub { color: var(--text-muted); font-size: var(--fs-sm); }

/* ==================== 精选大卡（variant c） ==================== */
.hm-proj__feature {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: var(--space-6);
  padding: var(--space-8);
  margin-bottom: var(--space-6);
  align-items: center;
  overflow: hidden;
}
.hm-proj__feature-body { position: relative; z-index: 1; }
.hm-proj__feature-title { font-size: calc(var(--fs-xl) * var(--fs-scale)); margin: var(--space-2) 0; }
.hm-proj__feature-desc {
  color: var(--text-secondary);
  font-size: var(--fs-base);
  line-height: 1.8;
  max-width: 34em;
}

/* 装饰图形 */
.hm-proj__feature-art {
  position: relative;
  height: 180px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: var(--space-3);
}
.hm-proj__art-ring {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 160px; height: 160px;
  border-radius: 50%;
  border: 1px solid var(--accent-purple-soft);
  box-shadow: 0 0 32px var(--accent-purple-soft);
  animation: hm-art-pulse 3s ease-in-out infinite;
}
@keyframes hm-art-pulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50%      { transform: scale(1.08); opacity: 1; }
}
.hm-proj__art-bar {
  position: relative;
  width: 22px;
  border-radius: var(--radius-sm);
  background: var(--accent-gradient);
  opacity: 0.85;
}
.hm-proj__art-bar--1 { height: 44%; }
.hm-proj__art-bar--2 { height: 72%; }
.hm-proj__art-bar--3 { height: 56%; }

/* ==================== 卡片网格 ==================== */
.hm-proj__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}
.hm-proj__grid--3 { grid-template-columns: repeat(3, 1fr); }

.hm-proj__card {
  display: flex;
  flex-direction: column;
  padding: var(--space-6);
  transition: transform var(--dur-base) var(--ease-out);
}
.hm-proj__card:hover { transform: translateY(-4px); }

.hm-proj__card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}
.hm-proj__year {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.08em;
  color: var(--text-muted);
}
.hm-proj__pulse {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--success);
  animation: hm-pulse 2s ease-out infinite;
}
@keyframes hm-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.5); }
  70%  { box-shadow: 0 0 0 8px rgba(52, 211, 153, 0); }
  100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
}

.hm-proj__card-title {
  font-size: calc(var(--fs-lg) * var(--fs-scale));
  margin-bottom: var(--space-2);
}
.hm-proj__card-desc {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  line-height: 1.8;
}

.hm-proj__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}
.hm-proj__tag {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: var(--text-muted);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-pill);
  padding: 2px 10px;
}
.hm-proj__tag:hover { color: var(--accent-cyan); border-color: var(--accent-cyan-soft); }

.hm-proj__links {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-5);
}
.hm-proj__link {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--accent-cyan);
}
.hm-proj__link:hover { color: var(--accent-purple); }

/* ---------- 响应式 ---------- */
@media (max-width: 980px) {
  .hm-proj__grid--3 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 720px) {
  .hm-proj__grid, .hm-proj__grid--3 { grid-template-columns: 1fr; }
  .hm-proj__feature { grid-template-columns: 1fr; }
  .hm-proj__feature-art { display: none; }
}
</style>
