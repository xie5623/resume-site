<script setup>
/**
 * CertificatesModule — 证书认证（占位内容）
 * 契约：props = { config, lang }；revealed 由 App 装配层驱动 + TextReveal。
 * 布局变体：'a' 徽章栅格（默认）｜'b' 左右分栏｜'c' 居中徽章墙
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
      'certificates.title': '证书认证',
      'certificates.subtitle': '专业资格与荣誉（占位示例）',
      'certificates.issuedBy': '颁发方',
      'certificates.item1.name': '高级前端工程师认证',
      'certificates.item1.issuer': '示例认证机构',
      'certificates.item1.year': '2023',
      'certificates.item2.name': '全栈开发训练营优秀学员',
      'certificates.item2.issuer': '示例训练营',
      'certificates.item2.year': '2022',
      'certificates.item3.name': 'UI 设计基础认证',
      'certificates.item3.issuer': '示例设计学院',
      'certificates.item3.year': '2021',
      'certificates.item4.name': '英语六级（CET-6）',
      'certificates.item4.issuer': '教育考试中心',
      'certificates.item4.year': '2020',
      'certificates.item5.name': '云计算工程师（初级）',
      'certificates.item5.issuer': '示例云厂商',
      'certificates.item5.year': '2023',
      'certificates.item6.name': '项目管理（PMP 备考）',
      'certificates.item6.issuer': '示例培训中心',
      'certificates.item6.year': '2024'
    },
    en: {
      'certificates.title': 'Certificates',
      'certificates.subtitle': 'Professional credentials & honors (placeholder)',
      'certificates.issuedBy': 'Issued by',
      'certificates.item1.name': 'Senior Frontend Engineer Certification',
      'certificates.item1.issuer': 'Example Institute',
      'certificates.item1.year': '2023',
      'certificates.item2.name': 'Full-stack Bootcamp Honor',
      'certificates.item2.issuer': 'Example Bootcamp',
      'certificates.item2.year': '2022',
      'certificates.item3.name': 'UI Design Fundamentals',
      'certificates.item3.issuer': 'Example Design School',
      'certificates.item3.year': '2021',
      'certificates.item4.name': 'CET-6 English Proficiency',
      'certificates.item4.issuer': 'National Exam Center',
      'certificates.item4.year': '2020',
      'certificates.item5.name': 'Cloud Engineer (Associate)',
      'certificates.item5.issuer': 'Example Cloud Vendor',
      'certificates.item5.year': '2023',
      'certificates.item6.name': 'Project Management (PMP prep)',
      'certificates.item6.issuer': 'Example Training Center',
      'certificates.item6.year': '2024'
    }
  },

  /* ---------- 应届生版：四六级 / 普通话 / 专业证书 ---------- */
  graduate: {
    zh: {
      'certificates.title': '证书认证',
      'certificates.subtitle': '英语、普通话与专业证书（占位示例）',
      'certificates.issuedBy': '颁发方',
      'certificates.item1.name': '英语六级（CET-6）',
      'certificates.item1.issuer': '教育部',
      'certificates.item1.year': '2024',
      'certificates.item2.name': '普通话水平测试 · 二级甲等',
      'certificates.item2.issuer': '国家语委',
      'certificates.item2.year': '2023',
      'certificates.item3.name': '计算机等级考试 · 二级 C 语言',
      'certificates.item3.issuer': '教育部考试中心',
      'certificates.item3.year': '2023',
      'certificates.item4.name': '前端开发微专业证书',
      'certificates.item4.issuer': '示例在线学习平台',
      'certificates.item4.year': '2024',
      'certificates.item5.name': 'Vue 3 实战训练营',
      'certificates.item5.issuer': '示例训练营',
      'certificates.item5.year': '2023',
      'certificates.item6.name': '计算机等级考试 · 二级 Office',
      'certificates.item6.issuer': '教育部考试中心',
      'certificates.item6.year': '2022'
    },
    en: {
      'certificates.title': 'Certificates',
      'certificates.subtitle': 'English, Mandarin & professional certifications (placeholder)',
      'certificates.issuedBy': 'Issued by',
      'certificates.item1.name': 'CET-6 English Proficiency',
      'certificates.item1.issuer': 'Ministry of Education',
      'certificates.item1.year': '2024',
      'certificates.item2.name': 'Mandarin Proficiency · Level 2A',
      'certificates.item2.issuer': 'State Language Commission',
      'certificates.item2.year': '2023',
      'certificates.item3.name': 'NCRE Level 2 · C Language',
      'certificates.item3.issuer': 'Ministry of Education Exam Center',
      'certificates.item3.year': '2023',
      'certificates.item4.name': 'Frontend Micro-degree Certificate',
      'certificates.item4.issuer': 'Example Online Platform',
      'certificates.item4.year': '2024',
      'certificates.item5.name': 'Vue 3 Bootcamp',
      'certificates.item5.issuer': 'Example Bootcamp',
      'certificates.item5.year': '2023',
      'certificates.item6.name': 'NCRE Level 2 · Office',
      'certificates.item6.issuer': 'Ministry of Education Exam Center',
      'certificates.item6.year': '2022'
    }
  }
}

/* t('certificates.*') 自动跟随版本：当前版本 → 资深版兜底 → key */
const { version } = useVersion()
const t = (key) => (
  DICT[version.value]?.[props.lang]?.[key]
  ?? DICT.senior?.[props.lang]?.[key]
  ?? DICT.senior?.zh?.[key]
  ?? key
)

const items = computed(() => [1, 2, 3, 4, 5, 6].map((i) => ({
  name: t(`certificates.item${i}.name`),
  issuer: t(`certificates.item${i}.issuer`),
  year: t(`certificates.item${i}.year`)
})))

/* ---------- 入场状态（revealed 由 App 装配层 ModuleSection 驱动） ---------- */
const revealed = useModuleReveal(props.config.id)
const variant = computed(() => (['a', 'b', 'c'].includes(props.config.variant) ? props.config.variant : 'a'))
</script>

<template>
  <section
    class="cert container"
    :data-revealed="revealed ? 'yes' : 'no'"
    :class="`cert--${variant}`"
  >
    <header class="module__head">
      <span class="module__kicker">CERTIFICATES</span>
      <h2 class="module__title" :class="{ 'text-emphasize': config.emphasize }">
        <TextReveal :anim="config.textAnim" :text="t('certificates.title')" :delay="0.05" />
      </h2>
      <p class="module__subtitle">
        <TextReveal :anim="config.textAnim" :text="t('certificates.subtitle')" :delay="0.25" />
      </p>
    </header>

    <ul class="cert__grid">
      <li v-for="(item, i) in items" :key="i" class="cert__item">
        <article class="glass cert__card">
          <span class="cert__medal" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="9" r="6"></circle>
              <path d="M9 14.5 7.5 21l4.5-2 4.5 2-1.5-6.5"></path>
            </svg>
          </span>
          <h3 class="cert__name">{{ item.name }}</h3>
          <p class="cert__issuer">
            <span class="cert__issuer-label">{{ t('certificates.issuedBy') }}</span>
            {{ item.issuer }}
          </p>
          <span class="cert__year">{{ item.year }}</span>
        </article>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.cert {
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

/* ---------- 徽章栅格（默认） ---------- */
.cert__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-5);
  margin: 0;
  padding: 0;
  list-style: none;
}
.cert__item {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out);
}
.cert[data-revealed='yes'] .cert__item {
  opacity: 1;
  transform: none;
}
.cert[data-revealed='yes'] .cert__item:nth-child(1) { transition-delay: 0.03s; }
.cert[data-revealed='yes'] .cert__item:nth-child(2) { transition-delay: 0.1s; }
.cert[data-revealed='yes'] .cert__item:nth-child(3) { transition-delay: 0.17s; }
.cert[data-revealed='yes'] .cert__item:nth-child(4) { transition-delay: 0.24s; }
.cert[data-revealed='yes'] .cert__item:nth-child(5) { transition-delay: 0.31s; }
.cert[data-revealed='yes'] .cert__item:nth-child(6) { transition-delay: 0.38s; }

.cert__card {
  padding: var(--space-5) var(--space-5);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  height: 100%;
}
.cert__card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
.cert__medal {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: var(--bg-elevated);
  background: var(--accent-gradient);
  box-shadow: var(--shadow-glow);
  margin-bottom: var(--space-2);
}
.cert__name {
  font-size: calc(var(--fs-md) * var(--fs-scale, 1));
  line-height: 1.35;
}
.cert__issuer {
  margin: 0;
  color: var(--text-secondary);
  font-size: calc(var(--fs-sm) * var(--fs-scale, 1));
}
.cert__issuer-label {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  margin-bottom: 2px;
}
.cert__year {
  margin-top: auto;
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--accent-purple);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-pill);
  padding: 2px 12px;
  background: var(--glass-bg);
}

/* ---------- 变体 b：左右分栏 ---------- */
.cert--b .cert__grid {
  grid-template-columns: 1.2fr 1fr;
  align-items: stretch;
}
.cert--b .cert__item:first-child {
  grid-row: span 2;
}

/* ---------- 变体 c：居中徽章墙 ---------- */
.cert--c .module__head {
  text-align: center;
}
.cert--c .cert__grid {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}
.cert--c .cert__card {
  align-items: center;
  text-align: center;
}
.cert--c .cert__year {
  align-self: center;
}
</style>
