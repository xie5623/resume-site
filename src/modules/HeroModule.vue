<script setup>
/**
 * HeroModule — 首屏门面模块（id: hero）
 * 超大姓名 / 头衔 / 打字机标语 / 背景光效 / 滚动指示器
 * 排版与动效做到极致：这是访问者看到的第一屏。
 *
 * Variants（读 config.variant）：
 *  - a：居中大标题 + 标语 + 双 CTA
 *  - b：左侧大标题 + 右侧快速信息卡（玻璃）
 *  - c：居中 + 底部数据条（占位统计）
 *
 * Props 契约见 ARCHITECTURE.md：config / lang
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useModuleReveal } from '@/composables/moduleReveal'
import { useVersion } from '@/composables/useVersion'
import { getEnabledModules } from '@/config/site.config'
import TextReveal from '@/components/TextReveal.vue'

const props = defineProps({
  config: { type: Object, required: true },
  lang: { type: String, default: 'zh' }
})

/* ===================== i18n（按版本分区词典，键名按模块命名空间，对齐全局 i18n 键） ===================== */
const DICT = {
  /* ---------- 资深版 ---------- */
  senior: {
    zh: {
      'hero.eyebrow':   '个人简历',
      'hero.name':      'YOUR NAME',
      'hero.greeting':  '你好，我是',
      'hero.tagline':   '用代码把想法变成精致的数字产品。',
      'hero.cta.work':  '查看项目',
      'hero.cta.contact': '联系我',
      'hero.scroll':    '向下滚动',
      'hero.badge':     '开放合作',
      'hero.card.role': '当前角色',
      'hero.card.loc':  '所在城市',
      'hero.card.mail': '邮箱',
      'hero.card.avail':'合作状态',
      'hero.role.1':    '全栈工程师',
      'hero.role.2':    '前端开发',
      'hero.role.3':    'UI 动效爱好者',
      'hero.role.4':    '开源贡献者',
      'hero.stat.1':    '年经验',
      'hero.stat.2':    '交付项目',
      'hero.stat.3':    '技术栈',
      'hero.placeholder.mail': 'you@example.com',
      'hero.placeholder.city': '上海 · 中国'
    },
    en: {
      'hero.eyebrow':   'PORTFOLIO',
      'hero.name':      'YOUR NAME',
      'hero.greeting':  "Hi, I'm",
      'hero.tagline':   'Turning ideas into polished digital products with code.',
      'hero.cta.work':  'View Work',
      'hero.cta.contact': 'Contact',
      'hero.scroll':    'Scroll down',
      'hero.badge':     'Open to work',
      'hero.card.role': 'Current role',
      'hero.card.loc':  'Location',
      'hero.card.mail': 'Email',
      'hero.card.avail':'Availability',
      'hero.role.1':    'Full-Stack Developer',
      'hero.role.2':    'Front-End Engineer',
      'hero.role.3':    'Motion & UI Enthusiast',
      'hero.role.4':    'Open Source Contributor',
      'hero.stat.1':    'Years Exp.',
      'hero.stat.2':    'Projects',
      'hero.stat.3':    'Skills',
      'hero.placeholder.mail': 'you@example.com',
      'hero.placeholder.city': 'Shanghai, CN'
    }
  },

  /* ---------- 应届生版：本科学历/校招口吻 ---------- */
  graduate: {
    zh: {
      'hero.eyebrow':   '应届生简历',
      'hero.name':      'YOUR NAME',
      'hero.greeting':  '你好，我是',
      'hero.tagline':   '2025 届毕业生，期待把校园里的热情与学习能力带进团队，快速成长、踏实产出。',
      'hero.cta.work':  '查看项目',
      'hero.cta.contact': '联系我',
      'hero.scroll':    '向下滚动',
      'hero.badge':     '应届 · 求职中',
      'hero.card.role': '当前角色',
      'hero.card.loc':  '所在城市',
      'hero.card.mail': '邮箱',
      'hero.card.avail':'求职状态',
      'hero.role.1':    '前端开发应届生',
      'hero.role.2':    '前端开发',
      'hero.role.3':    '编程爱好者',
      'hero.role.4':    '学习型选手',
      'hero.stat.1':    '校园项目',
      'hero.stat.2':    '交付项目',
      'hero.stat.3':    '技术栈',
      'hero.placeholder.mail': 'you@example.com',
      'hero.placeholder.city': '上海 · 中国'
    },
    en: {
      'hero.eyebrow':   'NEW GRAD',
      'hero.name':      'YOUR NAME',
      'hero.greeting':  "Hi, I'm",
      'hero.tagline':   'Class of 2025. Ready to bring campus enthusiasm and fast learning to your team — growing quickly and shipping steadily.',
      'hero.cta.work':  'View Projects',
      'hero.cta.contact': 'Contact',
      'hero.scroll':    'Scroll down',
      'hero.badge':     'Open to new-grad roles',
      'hero.card.role': 'Current role',
      'hero.card.loc':  'Location',
      'hero.card.mail': 'Email',
      'hero.card.avail':'Status',
      'hero.role.1':    'Frontend Developer (New Grad)',
      'hero.role.2':    'Front-End Developer',
      'hero.role.3':    'Coding Enthusiast',
      'hero.role.4':    'Fast Learner',
      'hero.stat.1':    'Campus Projects',
      'hero.stat.2':    'Projects',
      'hero.stat.3':    'Skills',
      'hero.placeholder.mail': 'you@example.com',
      'hero.placeholder.city': 'Shanghai, CN'
    }
  }
}

/* t('hero.*') 自动跟随版本：当前版本 → 资深版兜底 → key */
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

/* ===================== 打字机标语（循环切换角色，:key 重触发 TextReveal） ===================== */
const ROLES = [
  'hero.role.1', 'hero.role.2', 'hero.role.3', 'hero.role.4'
]
const roleIdx = ref(0)
const roleText = computed(() => t(ROLES[roleIdx.value]))
let timer = null

function scheduleRole() {
  timer = setTimeout(() => {
    roleIdx.value = (roleIdx.value + 1) % ROLES.length
    scheduleRole()
  }, 2600)
}

onMounted(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!reduce) scheduleRole()
})
onBeforeUnmount(() => clearTimeout(timer))

/* ===================== 占位统计（variant c） ===================== */
const STATS = [
  { key: 'hero.stat.1', value: '5+' },
  { key: 'hero.stat.2', value: '30+' },
  { key: 'hero.stat.3', value: '12' }
]

/* ===================== 向下滚动目标（版本感知） ===================== */
/* 资深版指向 #about；应届生版 hero 后是 education，指向 #education，避免指向不存在的模块 */
const scrollTarget = computed(() => {
  const mods = getEnabledModules(version.value)
  const idx = mods.findIndex((m) => m.id === 'hero')
  const next = mods[idx + 1] ?? mods[0] ?? { id: 'about' }
  return `#${next.id}`
})
</script>

<template>
  <section
    class="hm-hero"
    :class="[`hm-hero--${config.variant}`, { 'is-revealed': revealed }]"
  >
    <!-- ======== 背景光效（装饰性光晕球） ======== -->
    <div class="hm-hero__bg" aria-hidden="true">
      <span class="hm-hero__orb hm-hero__orb--1"></span>
      <span class="hm-hero__orb hm-hero__orb--2"></span>
      <span class="hm-hero__orb hm-hero__orb--3"></span>
    </div>

    <div class="container hm-hero__inner">
      <!-- 左 / 中主区 -->
      <div class="hm-hero__main">
        <div class="hm-hero__eyebrow">
          <span class="hm-hero__eyebrow-dot"></span>
          <TextReveal :anim="config.textAnim" :text="t('hero.eyebrow')" :delay="0.05" />
        </div>

        <p class="hm-hero__greeting">{{ t('hero.greeting') }}</p>

        <h1 class="hm-hero__name" :class="emphasizeClass">
          <TextReveal :anim="config.textAnim" :text="t('hero.name')" :delay="0.15" />
        </h1>

        <!-- 打字机标语：不重建组件（:key 重建会导致完整文本闪现再逐字，
             即首屏"抽搐屏闪"元凶之一）。TextReveal 内部已 watch text
             自动重新拆分播放，直接改 :text 即可平滑轮换。 -->
        <p class="hm-hero__role" aria-live="polite">
          <TextReveal
            :anim="config.textAnim"
            :text="roleText"
            :delay="0.3"
          />
        </p>

        <p class="hm-hero__tagline">{{ t('hero.tagline') }}</p>

        <div class="hm-hero__actions">
          <a class="glass-btn glass-btn--accent" href="#projects">{{ t('hero.cta.work') }}</a>
          <a class="glass-btn" href="#contact">{{ t('hero.cta.contact') }}</a>
        </div>

        <!-- variant c：底部数据条 -->
        <div v-if="config.variant === 'c'" class="hm-hero__stats">
          <div v-for="s in STATS" :key="s.key" class="hm-hero__stat glass">
            <span class="hm-hero__stat-value">{{ s.value }}</span>
            <span class="hm-hero__stat-label">{{ t(s.key) }}</span>
          </div>
        </div>
      </div>

      <!-- variant b：右侧快速信息卡 -->
      <aside v-if="config.variant === 'b'" class="hm-hero__card glass glass--glow">
        <div class="hm-hero__card-head">
          <span class="hm-hero__badge">
            <span class="hm-hero__badge-dot"></span>{{ t('hero.badge') }}
          </span>
        </div>
        <dl class="hm-hero__card-list">
          <div class="hm-hero__card-row">
            <dt>{{ t('hero.card.role') }}</dt>
            <dd>{{ t('hero.role.1') }}</dd>
          </div>
          <div class="hm-hero__card-row">
            <dt>{{ t('hero.card.loc') }}</dt>
            <dd>{{ t('hero.placeholder.city') }}</dd>
          </div>
          <div class="hm-hero__card-row">
            <dt>{{ t('hero.card.mail') }}</dt>
            <dd>{{ t('hero.placeholder.mail') }}</dd>
          </div>
          <div class="hm-hero__card-row">
            <dt>{{ t('hero.card.avail') }}</dt>
            <dd class="hm-hero__avail">{{ t('hero.badge') }}</dd>
          </div>
        </dl>
      </aside>
    </div>

    <!-- ======== 滚动指示器 ======== -->
    <a class="hm-hero__scroll" :href="scrollTarget" :aria-label="t('hero.scroll')">
      <span class="hm-hero__mouse">
        <span class="hm-hero__mouse-wheel"></span>
      </span>
      <span class="hm-hero__scroll-text">{{ t('hero.scroll') }}</span>
    </a>
  </section>
</template>

<style scoped>
.hm-hero {
  position: relative;
  min-height: calc(100vh - var(--header-h));
  display: flex;
  align-items: center;
  padding: var(--space-12) 0;
  overflow: hidden;
}

/* ---------- 背景光效 ---------- */
.hm-hero__bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.hm-hero__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(42px);
  opacity: 0.55;
  /* GPU 友好：只动 transform，并提示浏览器单独成层，减少首屏重绘 */
  will-change: transform;
  transform: translateZ(0);
}
.hm-hero__orb--1 {
  width: 34rem; height: 34rem;
  top: -10rem; right: -8rem;
  background: radial-gradient(circle, var(--accent-purple-soft) 0%, transparent 70%);
  animation: hm-float 9s ease-in-out infinite;
}
.hm-hero__orb--2 {
  width: 26rem; height: 26rem;
  bottom: -8rem; left: -6rem;
  background: radial-gradient(circle, var(--accent-cyan-soft) 0%, transparent 70%);
  animation: hm-float 11s ease-in-out infinite reverse;
}
.hm-hero__orb--3 {
  width: 16rem; height: 16rem;
  top: 20%; left: 45%;
  background: radial-gradient(circle, var(--accent-pink) 0%, transparent 65%);
  opacity: 0.28;
  animation: hm-float 13s ease-in-out infinite;
}
@keyframes hm-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(24px, -28px) scale(1.06); }
}

.hm-hero__inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

/* ---------- 主区 ---------- */
.hm-hero__main { flex: 1; min-width: 0; }

.hm-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--text-muted);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-pill);
  padding: var(--space-1) var(--space-3);
  backdrop-filter: blur(var(--blur-sm));
}
.hm-hero__eyebrow-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 8px var(--success);
}

.hm-hero__greeting {
  margin-top: var(--space-8);
  margin-bottom: var(--space-2);
  font-size: calc(var(--fs-lg) * var(--fs-scale));
  color: var(--text-secondary);
}

.hm-hero__name {
  font-size: calc(var(--fs-2xl) * 1.9 * var(--fs-scale));
  line-height: 1.06;
  letter-spacing: -0.02em;
  font-weight: 800;
}

.hm-hero__role {
  margin-top: var(--space-5);
  font-size: calc(var(--fs-xl) * var(--fs-scale));
  color: var(--accent-cyan);
  font-weight: 600;
  min-height: 1.4em;
}

.hm-hero__tagline {
  margin-top: var(--space-4);
  max-width: 34em;
  font-size: calc(var(--fs-md) * var(--fs-scale));
  color: var(--text-secondary);
}

.hm-hero__actions {
  margin-top: var(--space-8);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

/* ---------- 数据条（variant c） ---------- */
.hm-hero__stats {
  margin-top: var(--space-8);
  display: flex;
  gap: var(--space-4);
}
.hm-hero__stat {
  flex: 1;
  padding: var(--space-4) var(--space-5);
  text-align: center;
}
.hm-hero__stat-value {
  display: block;
  font-size: calc(var(--fs-xl) * var(--fs-scale));
  font-weight: 800;
  color: transparent;
  background: var(--accent-gradient);
  background-clip: text;
  -webkit-background-clip: text;
}
.hm-hero__stat-label {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--fs-xs);
  color: var(--text-muted);
  letter-spacing: 0.06em;
}

/* ---------- 信息卡（variant b） ---------- */
.hm-hero__card {
  flex-shrink: 0;
  width: 320px;
  padding: var(--space-6);
}
.hm-hero__card-head { margin-bottom: var(--space-5); }
.hm-hero__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--success);
  border: 1px solid rgba(52, 211, 153, 0.35);
  border-radius: var(--radius-pill);
  padding: var(--space-1) var(--space-3);
}
.hm-hero__badge-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--success);
}
.hm-hero__card-list { display: grid; gap: var(--space-4); }
.hm-hero__card-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--glass-border);
}
.hm-hero__card-row:last-child { border-bottom: none; padding-bottom: 0; }
.hm-hero__card-row dt {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  letter-spacing: 0.06em;
}
.hm-hero__card-row dd {
  font-size: var(--fs-sm);
  color: var(--text-primary);
  text-align: right;
  word-break: break-all;
}
.hm-hero__avail { color: var(--success) !important; }

/* ---------- 滚动指示器 ---------- */
.hm-hero__scroll {
  position: absolute;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-muted);
  z-index: 1;
}
.hm-hero__scroll:hover { color: var(--accent-cyan); }
.hm-hero__mouse {
  width: 26px; height: 42px;
  border: 2px solid var(--glass-border-hover);
  border-radius: var(--radius-pill);
  display: flex;
  justify-content: center;
  padding-top: 7px;
}
.hm-hero__mouse-wheel {
  width: 3px; height: 8px;
  border-radius: var(--radius-pill);
  background: var(--accent-cyan);
  animation: hm-wheel 1.6s ease-in-out infinite;
}
@keyframes hm-wheel {
  0%   { transform: translateY(0); opacity: 1; }
  70%  { transform: translateY(10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 0; }
}
.hm-hero__scroll-text {
  font-size: var(--fs-xs);
  letter-spacing: 0.2em;
}

/* ---------- variant 布局微调 ---------- */
.hm-hero--a { justify-content: center; }
.hm-hero--a .hm-hero__main { text-align: center; }
.hm-hero--a .hm-hero__eyebrow { margin-inline: auto; }
.hm-hero--a .hm-hero__actions { justify-content: center; }
.hm-hero--a .hm-hero__tagline { margin-inline: auto; }
.hm-hero--c { justify-content: center; }
.hm-hero--c .hm-hero__main { text-align: center; }
.hm-hero--c .hm-hero__eyebrow { margin-inline: auto; }
.hm-hero--c .hm-hero__actions { justify-content: center; }
.hm-hero--c .hm-hero__tagline { margin-inline: auto; }
.hm-hero--c .hm-hero__stats { max-width: 640px; margin-inline: auto; }

/* ---------- 响应式 ---------- */
@media (max-width: 900px) {
  .hm-hero__inner { flex-direction: column; gap: var(--space-6); }
  .hm-hero__card { width: 100%; max-width: 420px; }
}
@media (max-width: 640px) {
  .hm-hero { padding: var(--space-8) 0 var(--space-10); }
  .hm-hero__name { font-size: calc(var(--fs-2xl) * 1.25 * var(--fs-scale)); }
  .hm-hero__role { font-size: calc(var(--fs-lg) * var(--fs-scale)); }
  .hm-hero__stats { flex-direction: column; }
  .hm-hero__scroll { display: none; }
}
</style>
