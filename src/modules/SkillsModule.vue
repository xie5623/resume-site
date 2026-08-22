<script setup>
/**
 * SkillsModule — 专业技能（id: skills）
 * 占位技能项 + 三种布局变体（config.variant 切换）：
 *  - a：进度条列表（revealed 后宽度动画）
 *  - b：环形图网格（SVG stroke-dashoffset 动画）
 *  - c：标签云（按熟练度加权字号）
 *
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

/* ===================== i18n（按版本分区词典，键名按模块命名空间） ===================== */
const DICT = {
  /* ---------- 资深版 ---------- */
  senior: {
    zh: {
      'skills.eyebrow': '技术能力',
      'skills.title':   '专业技能',
      'skills.sub':     '占位技能清单，熟练度数值可随意替换。',
      'skills.level':   '熟练度'
    },
    en: {
      'skills.eyebrow': 'SKILLS',
      'skills.title':   'Skills',
      'skills.sub':     'Placeholder skill list; feel free to tweak the levels.',
      'skills.level':   'Level'
    }
  },

  /* ---------- 应届生版 ---------- */
  graduate: {
    zh: {
      'skills.eyebrow': '技术能力',
      'skills.title':   '专业技能',
      'skills.sub':     '本科期间掌握的核心技术栈，仍在持续学习中。',
      'skills.level':   '熟练度'
    },
    en: {
      'skills.eyebrow': 'SKILLS',
      'skills.title':   'Skills',
      'skills.sub':     'Core stack learned during undergrad — still learning and growing.',
      'skills.level':   'Level'
    }
  }
}

/* t('skills.*') 自动跟随版本：当前版本 → 资深版兜底 → key */
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

/* ===================== 占位技能数据（按版本分区：资深版在职能手栈 / 应届生版基础+正在成长的栈） ===================== */
const SKILLS_BY_VERSION = {
  senior: [
    { name: 'Vue.js',        level: 92 },
    { name: 'TypeScript',    level: 88 },
    { name: 'Node.js',       level: 84 },
    { name: 'React',         level: 78 },
    { name: 'CSS / SCSS',    level: 90 },
    { name: 'Python',        level: 74 },
    { name: 'GSAP Motion',    level: 82 },
    { name: 'SQL / Database', level: 70 },
    { name: 'Docker',        level: 66 },
    { name: 'Figma / Design', level: 72 },
    { name: 'Vite / Build',   level: 85 },
    { name: 'Git / Workflow', level: 88 }
  ],
  graduate: [
    { name: 'HTML / CSS',      level: 90 },
    { name: 'JavaScript (ES6+)', level: 86 },
    { name: 'Vue 3',           level: 85 },
    { name: 'TypeScript',      level: 80 },
    { name: 'Vite / Build',    level: 78 },
    { name: 'Git / Workflow',  level: 82 },
    { name: 'Node.js',         level: 75 },
    { name: 'GSAP Motion',     level: 74 },
    { name: 'Figma / Design',  level: 72 },
    { name: 'Python',          level: 70 },
    { name: 'React',           level: 68 },
    { name: 'SQL / Database',  level: 65 }
  ]
}
const SKILLS = computed(() => SKILLS_BY_VERSION[version.value] ?? SKILLS_BY_VERSION.senior)

/* 环形图需要 SVG 圆的周长：r=34 → C=2πr≈213.6 */
const RING_R = 34
const RING_C = 2 * Math.PI * RING_R

function ringDash(level) {
  return `${(level / 100) * RING_C} ${RING_C}`
}

/* 标签云字号按熟练度在 --fs-sm ~ --fs-xl 之间插值 */
function tagSize(level) {
  const min = 0.875
  const max = 1.5
  const k = (level - 55) / 45
  return `${(min + (max - min) * Math.max(0, Math.min(1, k))).toFixed(2)}rem`
}
</script>

<template>
  <section
    class="hm-skills"
    :class="[`hm-skills--${config.variant}`, { 'is-revealed': revealed }]"
  >
    <div class="container">
      <!-- ======== 区块标题 ======== -->
      <header class="hm-skills__head">
        <span class="hm-skills__eyebrow">{{ t('skills.eyebrow') }}</span>
        <h2 class="hm-skills__title" :class="emphasizeClass">
          <TextReveal :anim="config.textAnim" :text="t('skills.title')" :delay="0.1" />
        </h2>
        <span class="hm-skills__line"></span>
        <p class="hm-skills__sub">{{ t('skills.sub') }}</p>
      </header>

      <!-- ======== variant a：进度条 ======== -->
      <ul v-if="config.variant === 'a'" class="hm-skills__bars">
        <li v-for="s in SKILLS" :key="s.name" class="hm-skills__bar glass">
          <div class="hm-skills__bar-top">
            <span class="hm-skills__bar-name">{{ s.name }}</span>
            <span class="hm-skills__bar-value">{{ s.level }}%</span>
          </div>
          <div class="hm-skills__bar-track">
            <span
              class="hm-skills__bar-fill"
              :style="{ width: revealed ? s.level + '%' : '0%' }"
            ></span>
          </div>
        </li>
      </ul>

      <!-- ======== variant b：环形图 ======== -->
      <ul v-else-if="config.variant === 'b'" class="hm-skills__rings">
        <li v-for="s in SKILLS" :key="s.name" class="hm-skills__ring glass">
          <svg class="hm-skills__ring-svg" viewBox="0 0 80 80" aria-hidden="true">
            <circle class="hm-skills__ring-track" cx="40" cy="40" :r="RING_R" />
            <circle
              class="hm-skills__ring-progress"
              :class="{ 'is-on': revealed }"
              cx="40" cy="40" :r="RING_R"
              :stroke-dasharray="ringDash(s.level)"
              :stroke-dashoffset="revealed ? 0 : RING_C"
            />
          </svg>
          <span class="hm-skills__ring-value">{{ s.level }}%</span>
          <span class="hm-skills__ring-name">{{ s.name }}</span>
        </li>
      </ul>

      <!-- ======== variant c：标签云 ======== -->
      <div v-else class="hm-skills__cloud glass">
        <span
          v-for="s in SKILLS"
          :key="s.name"
          class="hm-skills__tag"
          :class="{ 'is-on': revealed }"
          :style="{ fontSize: tagSize(s.level) }"
        >{{ s.name }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hm-skills { padding: var(--space-8) 0; }

/* ---------- 标题 ---------- */
.hm-skills__head { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-8); }
.hm-skills__eyebrow {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--accent-cyan);
}
.hm-skills__title { font-size: calc(var(--fs-2xl) * var(--fs-scale)); }
.hm-skills__line {
  width: 56px; height: 3px;
  border-radius: var(--radius-pill);
  background: var(--accent-gradient);
}
.hm-skills__sub { color: var(--text-muted); font-size: var(--fs-sm); max-width: 40em; }

/* ==================== variant a：进度条 ==================== */
.hm-skills__bars {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}
.hm-skills__bar { padding: var(--space-5); }
.hm-skills__bar-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-3);
}
.hm-skills__bar-name { font-size: var(--fs-sm); font-weight: 600; }
.hm-skills__bar-value {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: var(--accent-cyan);
}
.hm-skills__bar-track {
  height: 8px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}
.hm-skills__bar-fill {
  display: block;
  height: 100%;
  border-radius: var(--radius-pill);
  background: var(--accent-gradient);
  box-shadow: 0 0 12px var(--accent-cyan-soft);
  transition: width 1s var(--ease-out);
}

/* ==================== variant b：环形图 ==================== */
.hm-skills__rings {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}
.hm-skills__ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-5);
}
.hm-skills__ring-svg {
  width: 88px; height: 88px;
  transform: rotate(-90deg);
}
.hm-skills__ring-track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.08);
  stroke-width: 6;
}
.hm-skills__ring-progress {
  fill: none;
  stroke: var(--accent-cyan);
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dashoffset 1.2s var(--ease-out);
}
.hm-skills__ring-value {
  margin-top: var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--text-primary);
}
.hm-skills__ring-name {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  text-align: center;
}

/* ==================== variant c：标签云 ==================== */
.hm-skills__cloud {
  padding: var(--space-8);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: var(--space-3) var(--space-4);
}
.hm-skills__tag {
  display: inline-block;
  padding: var(--space-1) var(--space-4);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-pill);
  color: var(--text-secondary);
  background: var(--glass-bg);
  transition:
    color var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out),
    transform var(--dur-base) var(--ease-out),
    opacity 0.6s var(--ease-out);
}
.hm-skills__tag:hover {
  color: var(--accent-cyan);
  border-color: var(--accent-cyan-soft);
  transform: translateY(-2px);
}
.hm-skills__tag.is-on { opacity: 1; }
.hm-skills__tag:not(.is-on) { opacity: 0; }

/* ---------- 响应式 ---------- */
@media (max-width: 980px) {
  .hm-skills__bars { grid-template-columns: 1fr; }
  .hm-skills__rings { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 640px) {
  .hm-skills__rings { grid-template-columns: repeat(2, 1fr); }
}
</style>
