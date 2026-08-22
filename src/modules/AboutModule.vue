<script setup>
/**
 * AboutModule — 关于我（id: about）
 * 段落占位文案 + 侧边信息卡（年龄/城市/邮箱占位）
 *
 * Variants（读 config.variant）：
 *  - a：左文 + 右信息卡（经典两栏）
 *  - b：左文 + 右统计条（占位数字）
 *  - c：居中信息卡在上，正文在下
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
      'about.eyebrow':   '了解我',
      'about.title':     '关于我',
      'about.p1':        '这里是一段占位自我介绍。写清楚你是谁、做过什么、擅长什么，以及为什么值得被记住。两三句话足够，重点是真诚和具体。',
      'about.p2':        '第二段可以补充你的工作理念、你喜欢的工具链，或者你在业余时间做的事情。保持简洁，让阅读体验始终轻盈。',
      'about.p3':        '最后一段可以给出你的合作方式与期望：远程 / 全职 / 自由职业均可，随时欢迎交流。',
      'about.card.title': '个人档案',
      'about.age':       '年龄',
      'about.city':      '城市',
      'about.mail':      '邮箱',
      'about.phone':     '电话',
      'about.available': '求职状态',
      'about.placeholder.age':   'XX',
      'about.placeholder.city':  '上海 · 中国',
      'about.placeholder.mail':  'you@example.com',
      'about.placeholder.phone': '+86 138 0000 0000',
      'about.placeholder.status':'正在寻找机会',
      'about.stat.1':    '专注领域',
      'about.stat.2':    '技术文章',
      'about.stat.3':    '开源项目'
    },
    en: {
      'about.eyebrow':   'ABOUT ME',
      'about.title':     'About Me',
      'about.p1':        'This is a placeholder intro. Describe who you are, what you have built, and what you are great at. A few honest, concrete sentences are enough.',
      'about.p2':        'A second paragraph can cover your working philosophy, your favorite toolchain, or what you do in your spare time. Keep it short and light.',
      'about.p3':        'Wrap up with how you like to collaborate: remote, full-time, or freelance — all welcome. Reach out anytime.',
      'about.card.title':'Profile',
      'about.age':       'Age',
      'about.city':      'Location',
      'about.mail':      'Email',
      'about.phone':     'Phone',
      'about.available': 'Status',
      'about.placeholder.age':   'XX',
      'about.placeholder.city':  'Shanghai, CN',
      'about.placeholder.mail':  'you@example.com',
      'about.placeholder.phone': '+86 138 0000 0000',
      'about.placeholder.status':'Open to opportunities',
      'about.stat.1':    'Focus',
      'about.stat.2':    'Articles',
      'about.stat.3':    'OSS Projects'
    }
  },

  /* ---------- 应届生版（graduate 版当前未渲染此模块，文案备用） ---------- */
  graduate: {
    zh: {
      'about.eyebrow':   '关于我',
      'about.title':     '关于我',
      'about.p1':        '我是 2025 届本科应届生，主修计算机科学与技术。对前端开发充满热情，能快速学习新工具，注重把想法落地成可用的产品。',
      'about.p2':        '在校期间通过课程设计、实习与个人项目积累实战经验，习惯用文档记录学习、用作品沉淀成长。',
      'about.p3':        '期待一份校招或实习转正机会：前端 / 全栈方向均可，欢迎随时联系交流。',
      'about.card.title':'个人档案',
      'about.age':       '年龄',
      'about.city':      '城市',
      'about.mail':      '邮箱',
      'about.phone':     '电话',
      'about.available': '求职状态',
      'about.placeholder.age':   'XX',
      'about.placeholder.city':  '上海 · 中国',
      'about.placeholder.mail':  'you@example.com',
      'about.placeholder.phone': '+86 138 0000 0000',
      'about.placeholder.status':'应届 · 求职中',
      'about.stat.1':    '学习方向',
      'about.stat.2':    '个人项目',
      'about.stat.3':    '实习经历'
    },
    en: {
      'about.eyebrow':   'ABOUT ME',
      'about.title':     'About Me',
      'about.p1':        "I'm a 2025 undergrad in Computer Science. Passionate about frontend development, quick to pick up new tools, and focused on shipping ideas into working products.",
      'about.p2':        "Through coursework, internships, and personal projects, I've built hands-on experience — I document what I learn and let my work show my growth.",
      'about.p3':        'Looking for a new-grad or intern-to-full-time role in frontend/full-stack. Reach out anytime.',
      'about.card.title':'Profile',
      'about.age':       'Age',
      'about.city':      'Location',
      'about.mail':      'Email',
      'about.phone':     'Phone',
      'about.available': 'Status',
      'about.placeholder.age':   'XX',
      'about.placeholder.city':  'Shanghai, CN',
      'about.placeholder.mail':  'you@example.com',
      'about.placeholder.phone': '+86 138 0000 0000',
      'about.placeholder.status':'Open to new-grad roles',
      'about.stat.1':    'Focus',
      'about.stat.2':    'Projects',
      'about.stat.3':    'Internships'
    }
  }
}

/* t('about.*') 自动跟随版本：当前版本 → 资深版兜底 → key */
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

/* ===================== 占位信息卡数据 ===================== */
const INFO_ROWS = [
  { label: 'about.age',    value: 'about.placeholder.age' },
  { label: 'about.city',   value: 'about.placeholder.city' },
  { label: 'about.mail',   value: 'about.placeholder.mail' },
  { label: 'about.phone',  value: 'about.placeholder.phone' },
  { label: 'about.available', value: 'about.placeholder.status' }
]

/* ===================== 统计条（variant b） ===================== */
const STATS = [
  { key: 'about.stat.1', value: '3' },
  { key: 'about.stat.2', value: '20+' },
  { key: 'about.stat.3', value: '8' }
]
</script>

<template>
  <section
    class="hm-about"
    :class="[`hm-about--${config.variant}`, { 'is-revealed': revealed }]"
  >
    <div class="container">
      <!-- ======== 区块标题 ======== -->
      <header class="hm-about__head">
        <span class="hm-about__eyebrow">{{ t('about.eyebrow') }}</span>
        <h2 class="hm-about__title" :class="emphasizeClass">
          <TextReveal :anim="config.textAnim" :text="t('about.title')" :delay="0.1" />
        </h2>
        <span class="hm-about__line"></span>
      </header>

      <!-- ======== variant c：信息卡置顶 ======== -->
      <div v-if="config.variant === 'c'" class="hm-about__card-top">
        <dl class="hm-about__card glass glass--glow">
          <div v-for="row in INFO_ROWS" :key="row.label" class="hm-about__card-row">
            <dt>{{ t(row.label) }}</dt>
            <dd>{{ t(row.value) }}</dd>
          </div>
        </dl>
      </div>

      <!-- ======== 正文 + 侧栏 ======== -->
      <div class="hm-about__body">
        <div class="hm-about__text">
          <p>{{ t('about.p1') }}</p>
          <p>{{ t('about.p2') }}</p>
          <p>{{ t('about.p3') }}</p>
        </div>

        <!-- variant a：右侧信息卡 -->
        <aside v-if="config.variant === 'a'" class="hm-about__card glass glass--glow">
          <h3 class="hm-about__card-title">{{ t('about.card.title') }}</h3>
          <dl>
            <div v-for="row in INFO_ROWS" :key="row.label" class="hm-about__card-row">
              <dt>{{ t(row.label) }}</dt>
              <dd>{{ t(row.value) }}</dd>
            </div>
          </dl>
        </aside>

        <!-- variant b：右侧统计条 -->
        <aside v-else-if="config.variant === 'b'" class="hm-about__side">
          <div v-for="s in STATS" :key="s.key" class="hm-about__stat glass">
            <span class="hm-about__stat-value">{{ s.value }}</span>
            <span class="hm-about__stat-label">{{ t(s.key) }}</span>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hm-about { padding: var(--space-8) 0; }

/* ---------- 标题 ---------- */
.hm-about__head { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-8); }
.hm-about__eyebrow {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--accent-cyan);
}
.hm-about__title { font-size: calc(var(--fs-2xl) * var(--fs-scale)); }
.hm-about__line {
  width: 56px; height: 3px;
  border-radius: var(--radius-pill);
  background: var(--accent-gradient);
}

/* ---------- 主体布局 ---------- */
.hm-about__body {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--space-8);
  align-items: start;
}
.hm-about__text {
  font-size: calc(var(--fs-base) * var(--fs-scale));
  color: var(--text-secondary);
  line-height: 1.9;
}
.hm-about__text p { margin-bottom: var(--space-5); }
.hm-about__text p:last-child { margin-bottom: 0; }

/* ---------- 信息卡 ---------- */
.hm-about__card { padding: var(--space-6); }
.hm-about__card-title {
  font-size: var(--fs-md);
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--glass-border);
}
.hm-about__card-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) 0;
}
.hm-about__card-row dt { font-size: var(--fs-xs); color: var(--text-muted); letter-spacing: 0.06em; }
.hm-about__card-row dd {
  font-size: var(--fs-sm);
  color: var(--text-primary);
  text-align: right;
  word-break: break-all;
}

/* ---------- 统计条（variant b） ---------- */
.hm-about__side { display: grid; gap: var(--space-4); }
.hm-about__stat {
  padding: var(--space-5);
  text-align: center;
}
.hm-about__stat-value {
  display: block;
  font-size: calc(var(--fs-xl) * var(--fs-scale));
  font-weight: 800;
  color: transparent;
  background: var(--accent-gradient);
  background-clip: text;
  -webkit-background-clip: text;
}
.hm-about__stat-label {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--fs-xs);
  color: var(--text-muted);
  letter-spacing: 0.08em;
}

/* ---------- variant c ---------- */
.hm-about--c .hm-about__card-top {
  max-width: 480px;
  margin: 0 auto var(--space-8);
}
.hm-about--c .hm-about__body { grid-template-columns: 1fr; }
.hm-about--c .hm-about__text { max-width: 46em; margin-inline: auto; text-align: center; }
.hm-about--c .hm-about__head { align-items: center; text-align: center; }

/* ---------- 响应式 ---------- */
@media (max-width: 860px) {
  .hm-about__body { grid-template-columns: 1fr; }
}
</style>
