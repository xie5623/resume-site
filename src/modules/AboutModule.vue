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
import { useContent } from '@/content/useContent'
import TextReveal from '@/components/TextReveal.vue'
import { useEditableElement } from '@/composables/useEditableElement'

const props = defineProps({
  config: { type: Object, required: true },
  lang: { type: String, default: 'zh' }
})

/* ===================== 可编辑元素注册（需求 4：标记 + 注册表） ===================== */
const { ed } = useEditableElement(props.config.id, [
  { key: 'eyebrow', label: { zh: '眉标', en: 'Eyebrow' }, type: 'text' },
  { key: 'title', label: { zh: '标题', en: 'Title' }, type: 'text' },
  { key: 'p1', label: { zh: '正文一', en: 'Paragraph 1' }, type: 'text' },
  { key: 'p2', label: { zh: '正文二', en: 'Paragraph 2' }, type: 'text' },
  { key: 'p3', label: { zh: '正文三', en: 'Paragraph 3' }, type: 'text' },
  { key: 'card.title', label: { zh: '卡片标题', en: 'Card title' }, type: 'text' },
  { key: 'placeholder.age', label: { zh: '年龄', en: 'Age' }, type: 'text' },
  { key: 'placeholder.city', label: { zh: '城市', en: 'City' }, type: 'text' },
  { key: 'placeholder.mail', label: { zh: '邮箱', en: 'Email' }, type: 'text' },
  { key: 'placeholder.phone', label: { zh: '电话', en: 'Phone' }, type: 'text' },
  { key: 'placeholder.status', label: { zh: '状态', en: 'Status' }, type: 'text' },
  { key: 'stat.1', label: { zh: '统计一', en: 'Stat 1' }, type: 'text' },
  { key: 'stat.2', label: { zh: '统计二', en: 'Stat 2' }, type: 'text' },
  { key: 'stat.3', label: { zh: '统计三', en: 'Stat 3' }, type: 'text' }
])

/* ===================== 内容层（about 命名空间，跟随模板+语言，可运行时编辑） ===================== */
const { version } = useVersion()
const { get } = useContent()
const T = (key) => get(version.value, props.lang, `about.${key}`)

/* ===================== 入场状态（revealed 由 App 装配层 ModuleSection 驱动） ===================== */
const revealed = useModuleReveal(props.config.id)

/* ===================== 强调（字号由 App 层 --fs-scale 统一注入） ===================== */
const emphasizeClass = computed(() => (props.config.emphasize ? 'text-emphasize' : ''))

/* ===================== 占位信息卡数据 ===================== */
const INFO_ROWS = [
  { label: 'age', value: 'placeholder.age' },
  { label: 'city', value: 'placeholder.city' },
  { label: 'mail', value: 'placeholder.mail' },
  { label: 'phone', value: 'placeholder.phone' },
  { label: 'available', value: 'placeholder.status' }
]

/* ===================== 统计条（variant b） ===================== */
const STATS = [
  { key: 'stat.1', value: '3' },
  { key: 'stat.2', value: '20+' },
  { key: 'stat.3', value: '8' }
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
        <span class="hm-about__eyebrow" v-editable="ed('eyebrow')">{{ T('eyebrow') }}</span>
        <h2 class="hm-about__title" :class="emphasizeClass" v-editable="ed('title')">
          <TextReveal :anim="config.textAnim" :text="T('title')" :delay="0.1" />
        </h2>
        <span class="hm-about__line"></span>
      </header>

      <!-- ======== variant c：信息卡置顶 ======== -->
      <div v-if="config.variant === 'c'" class="hm-about__card-top">
        <dl class="hm-about__card glass glass--glow">
          <div v-for="row in INFO_ROWS" :key="row.label" class="hm-about__card-row">
            <dt>{{ T(row.label) }}</dt>
            <dd v-editable="ed(row.value)">{{ T(row.value) }}</dd>
          </div>
        </dl>
      </div>

      <!-- ======== 正文 + 侧栏 ======== -->
      <div class="hm-about__body">
        <div class="hm-about__text">
          <p v-editable="ed('p1')">{{ T('p1') }}</p>
          <p v-editable="ed('p2')">{{ T('p2') }}</p>
          <p v-editable="ed('p3')">{{ T('p3') }}</p>
        </div>

        <!-- variant a：右侧信息卡 -->
        <aside v-if="config.variant === 'a'" class="hm-about__card glass glass--glow">
          <h3 class="hm-about__card-title" v-editable="ed('card.title')">{{ T('card.title') }}</h3>
          <dl>
            <div v-for="row in INFO_ROWS" :key="row.label" class="hm-about__card-row">
              <dt>{{ T(row.label) }}</dt>
              <dd v-editable="ed(row.value)">{{ T(row.value) }}</dd>
            </div>
          </dl>
        </aside>

        <!-- variant b：右侧统计条 -->
        <aside v-else-if="config.variant === 'b'" class="hm-about__side">
          <div v-for="s in STATS" :key="s.key" class="hm-about__stat glass">
            <span class="hm-about__stat-value">{{ s.value }}</span>
            <span class="hm-about__stat-label" v-editable="ed(s.key)">{{ T(s.key) }}</span>
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
