<script setup>
/**
 * EducationModule — 教育背景（占位内容）
 * 契约：props = { config, lang }；revealed 由 App 装配层驱动 + TextReveal。
 * 布局变体：
 *   variant 'a' 垂直时间线（默认）｜'b' 卡片栅格｜'c' 回退为 'a'
 *
 * 多版本：同一组件、同一结构，只切换文案来源（DICT 按 version 分区）——
 *   - senior   → 通用学历占位
 *   - graduate → 应届生本科学历占位（XX大学 / 计算机科学与技术 / 2021—2025）
 * 组件内一律用 t('education.*') 读取，自动跟随当前版本（useVersion）。
 * 键名与全局 i18n 命名空间（messages.*.education.*）对齐。
 */
import { computed } from 'vue'
import { useModuleReveal } from '@/composables/moduleReveal'
import { useVersion } from '@/composables/useVersion'
import TextReveal from '@/components/TextReveal.vue'

const props = defineProps({
  config: { type: Object, required: true },
  lang: { type: String, default: 'zh' }
})

/* ---------- 按版本分区词典（键名按模块命名空间） ---------- */
const DICT = {
  /* 资深版：通用学历占位 */
  senior: {
    zh: {
      'education.title': '教育背景',
      'education.subtitle': '学历与专业训练（占位示例）',
      'education.period': '时间',
      'education.item1.school': '示例大学',
      'education.item1.major': '计算机科学与技术 · 本科',
      'education.item1.tag': '学士学位',
      'education.item1.desc': '主修课程、成绩或奖学金等占位说明文字，用于展示卡片排版效果。',
      'education.item1.period': '2018 — 2022',
      'education.item2.school': '示例中学',
      'education.item2.major': '理科方向',
      'education.item2.tag': '高中',
      'education.item2.desc': '这里是一段占位描述，说明时间线卡片在中英双语下的排版表现。',
      'education.item2.period': '2015 — 2018',
      'education.item3.school': '线上学习平台',
      'education.item3.major': '前端开发 · 微专业',
      'education.item3.tag': '在线证书',
      'education.item3.desc': '持续学习能力的占位示例，体现自我驱动的学习经历。',
      'education.item3.period': '2023'
    },
    en: {
      'education.title': 'Education',
      'education.subtitle': 'Academic background (placeholder)',
      'education.period': 'Period',
      'education.item1.school': 'Example University',
      'education.item1.major': 'B.S. in Computer Science',
      'education.item1.tag': "Bachelor's Degree",
      'education.item1.desc': 'Placeholder for coursework, GPA, or scholarships to demonstrate the card layout.',
      'education.item1.period': '2018 — 2022',
      'education.item2.school': 'Example High School',
      'education.item2.major': 'Science Track',
      'education.item2.tag': 'High School',
      'education.item2.desc': 'A placeholder paragraph showing how the timeline renders in both languages.',
      'education.item2.period': '2015 — 2018',
      'education.item3.school': 'Online Learning Platform',
      'education.item3.major': 'Frontend · Micro-degree',
      'education.item3.tag': 'Online Certificate',
      'education.item3.desc': 'A placeholder for self-driven learning to highlight continuous growth.',
      'education.item3.period': '2023'
    }
  },

  /* 应届生版：本科学历占位（学历是应届生亮点） */
  graduate: {
    zh: {
      'education.title': '教育背景',
      'education.subtitle': '本科学历 · 计算机科学与技术（2021—2025）',
      'education.period': '时间',
      'education.item1.school': 'XX大学',
      'education.item1.major': '计算机科学与技术 · 本科',
      'education.item1.tag': '学士学位',
      'education.item1.desc': '主修数据结构、操作系统、计算机网络；GPA 3.6/4.0，获校级学业奖学金。',
      'education.item1.period': '2021 — 2025',
      'education.item2.school': 'XX中学',
      'education.item2.major': '理科方向',
      'education.item2.tag': '高中',
      'education.item2.desc': '理科背景，数学基础扎实，编程启蒙阶段。',
      'education.item2.period': '2018 — 2021',
      'education.item3.school': '在线学习平台',
      'education.item3.major': '前端开发 · 微专业',
      'education.item3.tag': '在线证书',
      'education.item3.desc': '系统性自学 Vue / TypeScript / 工程化，完成多个实战项目。',
      'education.item3.period': '2024'
    },
    en: {
      'education.title': 'Education',
      'education.subtitle': 'B.S. in Computer Science (2021—2025)',
      'education.period': 'Period',
      'education.item1.school': 'XX University',
      'education.item1.major': 'B.S. in Computer Science',
      'education.item1.tag': "Bachelor's Degree",
      'education.item1.desc': 'Coursework: data structures, OS, computer networks. GPA 3.6/4.0, merit scholarship.',
      'education.item1.period': '2021 — 2025',
      'education.item2.school': 'XX High School',
      'education.item2.major': 'Science Track',
      'education.item2.tag': 'High School',
      'education.item2.desc': 'Science background with solid math foundations and early programming interest.',
      'education.item2.period': '2018 — 2021',
      'education.item3.school': 'Online Learning Platform',
      'education.item3.major': 'Frontend · Micro-degree',
      'education.item3.tag': 'Online Certificate',
      'education.item3.desc': 'Self-paced learning of Vue / TypeScript / engineering, with several hands-on projects.',
      'education.item3.period': '2024'
    }
  }
}

/* t('education.*') 自动跟随版本：当前版本 → 资深版兜底 → key */
const { version } = useVersion()
const t = (key) => (
  DICT[version.value]?.[props.lang]?.[key]
  ?? DICT.senior?.[props.lang]?.[key]
  ?? DICT.senior?.zh?.[key]
  ?? key
)

const items = computed(() => [1, 2, 3].map((i) => ({
  school: t(`education.item${i}.school`),
  major: t(`education.item${i}.major`),
  tag: t(`education.item${i}.tag`),
  desc: t(`education.item${i}.desc`),
  period: t(`education.item${i}.period`)
})))

/* ---------- 入场状态（revealed 由 App 装配层 ModuleSection 驱动） ---------- */
const revealed = useModuleReveal(props.config.id)
const variant = computed(() => (['a', 'b', 'c'].includes(props.config.variant) ? props.config.variant : 'a'))
</script>

<template>
  <section
    class="edu container"
    :data-revealed="revealed ? 'yes' : 'no'"
    :class="`edu--${variant}`"
  >
    <header class="module__head">
      <span class="module__kicker">EDUCATION</span>
      <h2 class="module__title" :class="{ 'text-emphasize': config.emphasize }">
        <TextReveal :anim="config.textAnim" :text="t('education.title')" :delay="0.05" />
      </h2>
      <p class="module__subtitle">
        <TextReveal :anim="config.textAnim" :text="t('education.subtitle')" :delay="0.25" />
      </p>
    </header>

    <ol class="edu__timeline" aria-label="教育经历时间线">
      <li v-for="(item, i) in items" :key="i" class="edu__item">
        <span class="edu__dot" aria-hidden="true"></span>
        <article class="glass glass--glow edu__card">
          <div class="edu__card-top">
            <time class="edu__time">{{ item.period }}</time>
            <span class="edu__tag">{{ item.tag }}</span>
          </div>
          <h3 class="edu__school">{{ item.school }}</h3>
          <p class="edu__major">{{ item.major }}</p>
          <p class="edu__desc">{{ item.desc }}</p>
        </article>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.edu {
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

/* ---------- 时间线（variant a，默认） ---------- */
.edu__timeline {
  position: relative;
  margin: 0;
  padding: 0;
  list-style: none;
}
.edu__timeline::before {
  content: '';
  position: absolute;
  left: 9px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  border-radius: var(--radius-pill);
  background: linear-gradient(180deg, var(--accent-cyan-soft), var(--accent-purple-soft));
}
.edu__item {
  position: relative;
  padding-left: calc(var(--space-8) + 6px);
  margin-bottom: var(--space-5);
  opacity: 0;
  transform: translateY(14px);
  transition: opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out);
}
.edu[data-revealed='yes'] .edu__item {
  opacity: 1;
  transform: none;
}
.edu[data-revealed='yes'] .edu__item:nth-child(1) { transition-delay: 0.05s; }
.edu[data-revealed='yes'] .edu__item:nth-child(2) { transition-delay: 0.18s; }
.edu[data-revealed='yes'] .edu__item:nth-child(3) { transition-delay: 0.31s; }

.edu__dot {
  position: absolute;
  left: 1px;
  top: 26px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 2px solid var(--accent-cyan);
  box-shadow: 0 0 0 5px var(--accent-cyan-soft);
}
.edu__card {
  padding: var(--space-5) var(--space-6);
}
.edu__card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
.edu__card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-bottom: var(--space-3);
}
.edu__time {
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--accent-cyan);
  letter-spacing: 0.02em;
}
.edu__tag {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-pill);
  padding: 2px 10px;
}
.edu__school {
  font-size: calc(var(--fs-lg) * var(--fs-scale, 1));
  margin-bottom: var(--space-1);
}
.edu__major {
  font-weight: 600;
  color: var(--accent-purple);
  margin-bottom: var(--space-2);
  font-size: calc(var(--fs-base) * var(--fs-scale, 1));
}
.edu__desc {
  margin: 0;
  color: var(--text-secondary);
  font-size: calc(var(--fs-sm) * var(--fs-scale, 1));
}

/* ---------- 变体 b：卡片栅格 ---------- */
.edu--b .edu__timeline {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-5);
}
.edu--b .edu__timeline::before,
.edu--b .edu__dot {
  display: none;
}
.edu--b .edu__item {
  padding-left: 0;
  margin-bottom: 0;
}
</style>
