<script setup>
/**
 * ExperienceModule — 工作经历 / 实习经历（id: experience）
 * 时间线布局（占位公司/职位/时间/描述），config.variant 切换：
 *  - a：左侧时间轴，条目统一居右（经典纵向）
 *  - b：中轴左右交替时间线（zigzag）
 *  - c：纵向玻璃卡片列表（时间徽章置顶）
 *
 * 多版本「实习经历」模式：同一组件、同一套时间线布局，
 * 只切换文案来源（DICT 按 version 分区）——
 *   - senior   → 工作经历（资深口吻）
 *   - graduate → 实习经历（应届生口吻：职位=实习生、公司=XX 公司 实习、
 *                时间=短周期如 2024.06—2024.09、描述=实习产出口吻）
 * 组件内一律用 t('experience.*') 读取，自动跟随当前版本（useVersion）。
 * 键名与全局 i18n 命名空间（messages.*.experience.*）对齐：
 * 若 T2 落地版本化 messages 后，把 DICT 换成 useI18n().t 即可，调用点不变。
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
  /* ---------- 资深版：工作经历 ---------- */
  senior: {
    zh: {
      'experience.eyebrow': '职业轨迹',
      'experience.title':   '工作经历',
      'experience.sub':     '占位经历，按时间倒序排列。',
      'experience.now':     '至今',
      'experience.present': '现任',

      /* 占位条目 1 */
      'experience.item1.period':   '2022 — 至今',
      'experience.item1.company':  '某科技公司',
      'experience.item1.role':     '高级前端工程师',
      'experience.item1.desc':     '负责核心产品的前端架构与性能优化，主导设计系统落地，带领 4 人前端小组。占位描述，替换为你的真实职责与成果。',

      /* 占位条目 2 */
      'experience.item2.period':   '2020 — 2022',
      'experience.item2.company':  '某互联网公司',
      'experience.item2.role':     '前端开发工程师',
      'experience.item2.desc':     '参与多条业务线 Web 端开发，搭建组件库与自动化构建流水线，显著提升交付效率。',

      /* 占位条目 3 */
      'experience.item3.period':   '2018 — 2020',
      'experience.item3.company':  '某设计工作室',
      'experience.item3.role':     '全栈工程师',
      'experience.item3.desc':     '从零搭建工作室官网与作品展示系统，独立完成前后端与部署，支撑品牌线上形象。',

      /* 占位条目 4 */
      'experience.item4.period':   '2017 — 2018',
      'experience.item4.company':  '某初创团队',
      'experience.item4.role':     'Web 开发实习生',
      'experience.item4.desc':     '负责移动端 H5 页面开发与数据可视化图表实现，快速学习并落地多个小功能。'
    },
    en: {
      'experience.eyebrow': 'CAREER',
      'experience.title':   'Experience',
      'experience.sub':     'Placeholder history, newest first.',
      'experience.now':     'Present',
      'experience.present': 'Current',

      'experience.item1.period':   '2022 — Present',
      'experience.item1.company':  'Tech Company A',
      'experience.item1.role':     'Senior Front-End Engineer',
      'experience.item1.desc':     'Own the front-end architecture and performance of the flagship product, lead the design-system rollout, and mentor a 4-person FE team. Placeholder — replace with your real work.',

      'experience.item2.period':   '2020 — 2022',
      'experience.item2.company':  'Internet Company B',
      'experience.item2.role':     'Front-End Developer',
      'experience.item2.desc':     'Built web features across several product lines, set up a component library and automated build pipeline, and visibly improved delivery speed.',

      'experience.item3.period':   '2018 — 2020',
      'experience.item3.company':  'Design Studio C',
      'experience.item3.role':     'Full-Stack Engineer',
      'experience.item3.desc':     'Built the studio website and portfolio system from scratch — front-end, back-end, and deployment done solo.',

      'experience.item4.period':   '2017 — 2018',
      'experience.item4.company':  'Startup D',
      'experience.item4.role':     'Web Developer Intern',
      'experience.item4.desc':     'Developed mobile H5 pages and data-visualization charts; picked things up fast and shipped several small features.'
    }
  },

  /* ---------- 应届生版：实习经历（保留时间线组件，只换文案） ---------- */
  graduate: {
    zh: {
      'experience.eyebrow': '实习轨迹',
      'experience.title':   '实习经历',
      'experience.sub':     '本科期间的实习与项目实战，快速学习、结果导向。',
      'experience.now':     '至今',
      'experience.present': '近期',

      /* 实习条目 1（短周期：2024.06—2024.09） */
      'experience.item1.period':   '2024.06 — 2024.09',
      'experience.item1.company':  '某互联网公司 · 前端实习',
      'experience.item1.role':     '前端开发实习生',
      'experience.item1.desc':     '参与核心产品前端开发，独立完成 3 个功能模块并接入 CI/CD；将首屏加载耗时降低 40%，获 mentor 好评。',

      /* 实习条目 2 */
      'experience.item2.period':   '2023.09 — 2024.01',
      'experience.item2.company':  '某科技公司 · 全栈实习',
      'experience.item2.role':     '全栈开发实习生',
      'experience.item2.desc':     '参与内部管理系统前后端开发，用 Vue 3 + Node.js 完成数据看板模块，熟悉团队研发流程与代码规范。',

      /* 实习条目 3 */
      'experience.item3.period':   '2023.06 — 2023.08',
      'experience.item3.company':  '某创业团队 · 开发实习',
      'experience.item3.role':     'Web 开发实习生',
      'experience.item3.desc':     '从 0 到 1 搭建团队官网与落地页，负责移动端 H5 适配与动效实现，上线后支撑了首次产品推广活动。',

      /* 实习条目 4 */
      'experience.item4.period':   '2022.07 — 2022.09',
      'experience.item4.company':  '某工作室 · 设计实习',
      'experience.item4.role':     '前端开发实习生',
      'experience.item4.desc':     '制作 UI 组件与页面原型，学习设计与开发协作方式，沉淀了第一个可展示的个人作品集页面。'
    },
    en: {
      'experience.eyebrow': 'INTERNSHIP',
      'experience.title':   'Internship',
      'experience.sub':     'Internships and hands-on projects during undergrad — fast learner, results-driven.',
      'experience.now':     'Present',
      'experience.present': 'Recent',

      'experience.item1.period':   'Jun 2024 — Sep 2024',
      'experience.item1.company':  'Internet Company A · Frontend Intern',
      'experience.item1.role':     'Front-End Developer Intern',
      'experience.item1.desc':     'Built core product features, shipped 3 modules on my own with CI/CD; cut first-load time by 40% and got strong mentor feedback.',

      'experience.item2.period':   'Sep 2023 — Jan 2024',
      'experience.item2.company':  'Tech Company B · Full-stack Intern',
      'experience.item2.role':     'Full-Stack Developer Intern',
      'experience.item2.desc':     'Worked on the admin system end to end (Vue 3 + Node.js), shipped a data-dashboard module, and learned the team’s engineering process.',

      'experience.item3.period':   'Jun 2023 — Aug 2023',
      'experience.item3.company':  'Startup C · Dev Intern',
      'experience.item3.role':     'Web Developer Intern',
      'experience.item3.desc':     'Built the team website and landing pages from scratch, handled mobile H5 and animations, and supported the first launch campaign.',

      'experience.item4.period':   'Jul 2022 — Sep 2022',
      'experience.item4.company':  'Studio D · Design/Dev Intern',
      'experience.item4.role':     'Front-End Developer Intern',
      'experience.item4.desc':     'Built UI components and page prototypes, learned design–dev collaboration, and shipped my first presentable portfolio page.'
    }
  }
}

/* t('experience.*') 自动跟随版本：当前版本 → 资深版兜底 → key */
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

/* ===================== 占位经历数据（只存键名） ===================== */
const JOBS = [
  { period: 'experience.item1.period', company: 'experience.item1.company', role: 'experience.item1.role', desc: 'experience.item1.desc', tags: ['Vue 3', 'TypeScript', 'Vite', 'GSAP'] },
  { period: 'experience.item2.period', company: 'experience.item2.company', role: 'experience.item2.role', desc: 'experience.item2.desc', tags: ['React', 'Node.js', 'Webpack', 'CI/CD'] },
  { period: 'experience.item3.period', company: 'experience.item3.company', role: 'experience.item3.role', desc: 'experience.item3.desc', tags: ['Vue 2', 'Express', 'MongoDB', 'Nginx'] },
  { period: 'experience.item4.period', company: 'experience.item4.company', role: 'experience.item4.role', desc: 'experience.item4.desc', tags: ['JavaScript', 'ECharts', 'jQuery'] }
]

/* variant c 用的时间徽章（取起始年份；现任取「至今」） */
function badgeText(job) {
  const period = t(job.period)
  const isNow = period.includes('至今') || period.includes('Present')
  return isNow ? t('experience.now') : period.split('—')[0].trim()
}
</script>

<template>
  <section
    class="hm-exp"
    :class="[`hm-exp--${config.variant}`, { 'is-revealed': revealed }]"
  >
    <div class="container">
      <!-- ======== 区块标题 ======== -->
      <header class="hm-exp__head">
        <span class="hm-exp__eyebrow">{{ t('experience.eyebrow') }}</span>
        <h2 class="hm-exp__title" :class="emphasizeClass">
          <TextReveal :anim="config.textAnim" :text="t('experience.title')" :delay="0.1" />
        </h2>
        <span class="hm-exp__line"></span>
        <p class="hm-exp__sub">{{ t('experience.sub') }}</p>
      </header>

      <!-- ======== variant a / b：时间线 ======== -->
      <ol v-if="config.variant === 'a' || config.variant === 'b'" class="hm-exp__timeline">
        <li
          v-for="(job, i) in JOBS"
          :key="job.company"
          class="hm-exp__item"
          :class="{ 'is-revealed': revealed }"
        >
          <span class="hm-exp__node" aria-hidden="true">
            <span class="hm-exp__node-core"></span>
          </span>

          <article class="hm-exp__card glass">
            <div class="hm-exp__card-top">
              <span class="hm-exp__period">{{ t(job.period) }}</span>
              <span class="hm-exp__badge" v-if="i === 0">{{ t('experience.present') }}</span>
            </div>
            <h3 class="hm-exp__role">{{ t(job.role) }}</h3>
            <p class="hm-exp__company">{{ t(job.company) }}</p>
            <p class="hm-exp__desc">{{ t(job.desc) }}</p>
            <ul class="hm-exp__tags">
              <li v-for="tag in job.tags" :key="tag" class="hm-exp__tag">{{ tag }}</li>
            </ul>
          </article>
        </li>
      </ol>

      <!-- ======== variant c：卡片列表 ======== -->
      <ol v-else class="hm-exp__list">
        <li v-for="job in JOBS" :key="job.company" class="hm-exp__list-item">
          <article class="hm-exp__list-card glass">
            <span class="hm-exp__list-badge">{{ badgeText(job) }}</span>
            <div class="hm-exp__list-body">
              <div class="hm-exp__card-top">
                <span class="hm-exp__period">{{ t(job.period) }}</span>
              </div>
              <h3 class="hm-exp__role">{{ t(job.role) }}</h3>
              <p class="hm-exp__company">{{ t(job.company) }}</p>
              <p class="hm-exp__desc">{{ t(job.desc) }}</p>
              <ul class="hm-exp__tags">
                <li v-for="tag in job.tags" :key="tag" class="hm-exp__tag">{{ tag }}</li>
              </ul>
            </div>
          </article>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.hm-exp { padding: var(--space-8) 0; }

/* ---------- 标题 ---------- */
.hm-exp__head { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-8); }
.hm-exp__eyebrow {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--accent-cyan);
}
.hm-exp__title { font-size: calc(var(--fs-2xl) * var(--fs-scale)); }
.hm-exp__line {
  width: 56px; height: 3px;
  border-radius: var(--radius-pill);
  background: var(--accent-gradient);
}
.hm-exp__sub { color: var(--text-muted); font-size: var(--fs-sm); }

/* ==================== variant a / b：时间线 ==================== */
.hm-exp__timeline {
  position: relative;
  display: grid;
  gap: var(--space-6);
  padding-left: 0;
}
/* 中轴 */
.hm-exp__timeline::before {
  content: '';
  position: absolute;
  top: 0; bottom: 0; left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: linear-gradient(180deg, transparent, var(--accent-purple-soft), var(--accent-cyan-soft), transparent);
}

/* variant a：轴在左侧，条目居右 */
.hm-exp--a .hm-exp__timeline::before { left: 20px; transform: none; }
.hm-exp--a .hm-exp__item { grid-template-columns: 40px 1fr; gap: var(--space-4); }

.hm-exp__item {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8);
  align-items: center;
  position: relative;
}

/* 节点 */
.hm-exp__node {
  position: absolute;
  top: 26px;
  left: 50%;
  transform: translateX(-50%);
  width: 18px; height: 18px;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 2px solid var(--accent-purple);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
.hm-exp__node-core {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent-cyan);
  box-shadow: 0 0 8px var(--accent-cyan);
}
.hm-exp--a .hm-exp__node { left: 20px; }

/* 条目卡片默认在右（variant a 恒为右；variant b 交替左右） */
.hm-exp__card {
  grid-column: 2;
  padding: var(--space-6);
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.7s var(--ease-out),
    transform 0.7s var(--ease-out);
}
.hm-exp__item.is-revealed .hm-exp__card { opacity: 1; transform: none; }

/* variant b：奇数项卡片放左，节点仍居中 */
.hm-exp--b .hm-exp__item:nth-child(even) .hm-exp__card {
  grid-column: 1;
  grid-row: 1;
}

/* 卡片内容 */
.hm-exp__card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}
.hm-exp__period {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.06em;
  color: var(--accent-cyan);
}
.hm-exp__badge {
  font-size: var(--fs-xs);
  color: var(--success);
  border: 1px solid rgba(52, 211, 153, 0.35);
  border-radius: var(--radius-pill);
  padding: 2px 10px;
}
.hm-exp__role {
  font-size: calc(var(--fs-lg) * var(--fs-scale));
  margin-bottom: var(--space-1);
}
.hm-exp__company {
  font-size: var(--fs-sm);
  color: var(--accent-purple);
  margin-bottom: var(--space-3);
}
.hm-exp__desc {
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  line-height: 1.8;
}
.hm-exp__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}
.hm-exp__tag {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: var(--text-muted);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-pill);
  padding: 2px 10px;
}
.hm-exp__tag:hover { color: var(--accent-cyan); border-color: var(--accent-cyan-soft); }

/* ==================== variant c：卡片列表 ==================== */
.hm-exp__list { display: grid; gap: var(--space-4); }
.hm-exp__list-card {
  display: flex;
  gap: var(--space-5);
  padding: var(--space-6);
  align-items: flex-start;
}
.hm-exp__list-badge {
  flex-shrink: 0;
  min-width: 74px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  font-weight: 700;
  color: transparent;
  background: var(--accent-gradient);
  background-clip: text;
  -webkit-background-clip: text;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
}
.hm-exp__list-body { flex: 1; min-width: 0; }

/* ---------- 响应式 ---------- */
@media (max-width: 860px) {
  /* variant b 退回单侧时间线（移动端不做 zigzag） */
  .hm-exp--b .hm-exp__timeline::before { left: 20px; transform: none; }
  .hm-exp--b .hm-exp__item { grid-template-columns: 40px 1fr; gap: var(--space-4); }
  .hm-exp--b .hm-exp__item:nth-child(even) .hm-exp__card { grid-column: 2; grid-row: auto; }
  .hm-exp__node { left: 20px !important; }

  .hm-exp__list-card { flex-direction: column; gap: var(--space-3); }
}
</style>
