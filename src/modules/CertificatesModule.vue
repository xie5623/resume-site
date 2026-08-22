<script setup>
/**
 * CertificatesModule — 证书认证（占位内容）
 * 契约：props = { config, lang }；revealed 由 App 装配层驱动 + TextReveal。
 * 布局变体：'a' 徽章栅格（默认）｜'b' 左右分栏｜'c' 居中徽章墙
 */
import { computed } from 'vue'
import { useModuleReveal } from '@/composables/moduleReveal'
import { useVersion } from '@/composables/useVersion'
import { useContent } from '@/content/useContent'
import TextReveal from '@/components/TextReveal.vue'
import { useEditableElement } from '@/composables/useEditableElement'

const props = defineProps({
  config: { type: Object, required: true },
  lang: { type: String, default: 'zh' }
})

/* ===================== 可编辑元素注册（需求 4：标记 + 注册表） ===================== */
const { ed } = useEditableElement(props.config.id, [
  { key: 'kicker', label: { zh: '眉标', en: 'Kicker' }, type: 'text' },
  { key: 'title', label: { zh: '标题', en: 'Title' }, type: 'text' },
  { key: 'subtitle', label: { zh: '副标题', en: 'Subtitle' }, type: 'text' },
  { key: 'items', label: { zh: '证书列表', en: 'Certificate items' }, type: 'list' },
  { key: 'issuedBy', label: { zh: '颁发机构', en: 'Issued by' }, type: 'text' }
])

/* ===================== 内容层（certificates 命名空间，跟随模板+语言，可运行时编辑） ===================== */
const { version } = useVersion()
const { get } = useContent()
const T = (key) => get(version.value, props.lang, `certificates.${key}`)

const items = computed(() => {
  const list = T('items')
  return Array.isArray(list) ? list : []
})

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
      <span class="module__kicker" v-editable="ed('kicker')">{{ T('kicker') }}</span>
      <h2 class="module__title" :class="{ 'text-emphasize': config.emphasize }" v-editable="ed('title')">
        <TextReveal :anim="config.textAnim" :text="T('title')" :delay="0.05" />
      </h2>
      <p class="module__subtitle" v-editable="ed('subtitle')">
        <TextReveal :anim="config.textAnim" :text="T('subtitle')" :delay="0.25" />
      </p>
    </header>

    <ul class="cert__grid" v-editable="ed('items')">
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
            <span class="cert__issuer-label" v-editable="ed('issuedBy')">{{ T('issuedBy') }}</span>
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
