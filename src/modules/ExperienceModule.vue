<script setup>
/**
 * ExperienceModule — 工作经历 / 实习经历（id: experience）
 * 时间线布局（公司/职位/时间/描述），config.variant 切换：
 *  - a：左侧时间轴，条目统一居右（经典纵向）
 *  - b：中轴左右交替时间线（zigzag）
 *  - c：纵向玻璃卡片列表（时间徽章置顶）
 *
 * 多模板「实习经历」模式：同一组件、同一套时间线布局，只切换内容层
 * （experience 命名空间，senior → 工作经历 / graduate → 实习经历），
 * 控制台可实时编辑每条经历的字段与标签。
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
  { key: 'sub', label: { zh: '副标题', en: 'Subtitle' }, type: 'text' },
  { key: 'items', label: { zh: '经历列表', en: 'Experience items' }, type: 'list' },
  { key: 'present', label: { zh: '现任徽章', en: 'Present badge' }, type: 'text' },
  { key: 'now', label: { zh: '至今', en: 'Now' }, type: 'text' }
])

/* ===================== 内容层（experience 命名空间，跟随模板+语言，可运行时编辑） ===================== */
const { version } = useVersion()
const { get } = useContent()
const T = (key) => get(version.value, props.lang, `experience.${key}`)

/* ===================== 入场状态（revealed 由 App 装配层 ModuleSection 驱动） ===================== */
const revealed = useModuleReveal(props.config.id)

/* ===================== 强调（字号由 App 层 --fs-scale 统一注入） ===================== */
const emphasizeClass = computed(() => (props.config.emphasize ? 'text-emphasize' : ''))

/* ===================== 经历数据（来自内容层 experience.items） ===================== */
const JOBS = computed(() => {
  const items = T('items')
  return Array.isArray(items) ? items : []
})

/* variant c 用的时间徽章（取起始年份；现任取「至今」） */
function badgeText(job) {
  const isNow = (job.period || '').includes('至今') || (job.period || '').includes('Present')
  return isNow ? T('now') : (job.period || '').split('—')[0].trim()
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
        <span class="hm-exp__eyebrow" v-editable="ed('eyebrow')">{{ T('eyebrow') }}</span>
        <h2 class="hm-exp__title" :class="emphasizeClass" v-editable="ed('title')">
          <TextReveal :anim="config.textAnim" :text="T('title')" :delay="0.1" />
        </h2>
        <span class="hm-exp__line"></span>
        <p class="hm-exp__sub" v-editable="ed('sub')">{{ T('sub') }}</p>
      </header>

      <!-- ======== variant a / b：时间线 ======== -->
      <ol v-if="config.variant === 'a' || config.variant === 'b'" class="hm-exp__timeline" v-editable="ed('items')">
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
              <span class="hm-exp__period">{{ job.period }}</span>
              <span class="hm-exp__badge" v-if="i === 0" v-editable="ed('present')">{{ T('present') }}</span>
            </div>
            <h3 class="hm-exp__role">{{ job.role }}</h3>
            <p class="hm-exp__company">{{ job.company }}</p>
            <p class="hm-exp__desc">{{ job.desc }}</p>
            <ul class="hm-exp__tags">
              <li v-for="tag in job.tags" :key="tag" class="hm-exp__tag">{{ tag }}</li>
            </ul>
          </article>
        </li>
      </ol>

      <!-- ======== variant c：卡片列表 ======== -->
      <ol v-else class="hm-exp__list" v-editable="ed('items')">
        <li v-for="job in JOBS" :key="job.company" class="hm-exp__list-item">
          <article class="hm-exp__list-card glass">
            <span class="hm-exp__list-badge">{{ badgeText(job) }}</span>
            <div class="hm-exp__list-body">
              <div class="hm-exp__card-top">
                <span class="hm-exp__period">{{ job.period }}</span>
              </div>
              <h3 class="hm-exp__role">{{ job.role }}</h3>
              <p class="hm-exp__company">{{ job.company }}</p>
              <p class="hm-exp__desc">{{ job.desc }}</p>
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
