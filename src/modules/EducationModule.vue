<script setup>
/**
 * EducationModule — 教育背景（占位内容）
 * 契约：props = { config, lang }；revealed 由 App 装配层驱动 + TextReveal。
 * 布局变体：
 *   variant 'a' 垂直时间线（默认）｜'b' 卡片栅格｜'c' 回退为 'a'
 *
 * 多版本：同一组件、同一结构，只切换文案来源（内容层 education 命名空间
 *   按 version 分区）——
 *   - senior   → 通用学历占位
 *   - graduate → 应届生本科学历占位（XX大学 / 计算机科学与技术 / 2021—2025）
 * 组件内一律用 useContent().get(version, lang, 'education.*') 读取，
 * 自动跟随当前版本（useVersion）。
 */
import { computed } from 'vue'
import { useModuleReveal } from '@/composables/moduleReveal'
import { useVersion } from '@/composables/useVersion'
import { useContent } from '@/content/useContent'
import TextReveal from '@/components/TextReveal.vue'
import { useEditableElement } from '@/composables/useEditableElement'
import { useDeviceLayout } from '@/composables/useDeviceLayout'

const props = defineProps({
  config: { type: Object, required: true },
  lang: { type: String, default: 'zh' }
})

/* ===================== 双端布局（DEVICE 维度）：有效设备 → is-mobile 类 ===================== */
const { deviceCls } = useDeviceLayout()

/* ===================== 可编辑元素注册（需求 4：标记 + 注册表） ===================== */
const { ed } = useEditableElement(props.config.id, [
  { key: 'kicker', label: { zh: '眉标', en: 'Kicker' }, type: 'text' },
  { key: 'title', label: { zh: '标题', en: 'Title' }, type: 'text' },
  { key: 'subtitle', label: { zh: '副标题', en: 'Subtitle' }, type: 'text' },
  { key: 'items', label: { zh: '教育列表', en: 'Education items' }, type: 'list' }
])

/* ===================== 内容层（education 命名空间，跟随模板+语言，可运行时编辑） ===================== */
const { version } = useVersion()
const { get } = useContent()
const T = (key) => get(version.value, props.lang, `education.${key}`)

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
    class="edu container"
    :data-revealed="revealed ? 'yes' : 'no'"
    :class="[deviceCls, `edu--${variant}`]"
  >
    <header class="module__head">
      <span class="module__kicker" v-editable="ed('kicker')">{{ T('kicker') }}</span>
      <h2 class="module__title" :class="{ 'text-emphasize': config.emphasize }" v-editable="ed('title')" v-element-style="'title'">
        <TextReveal :anim="config.textAnim" :text="T('title')" :delay="0.05" />
      </h2>
      <p class="module__subtitle" v-editable="ed('subtitle')">
        <TextReveal :anim="config.textAnim" :text="T('subtitle')" :delay="0.25" />
      </p>
    </header>

    <ol class="edu__timeline" aria-label="教育经历时间线" v-editable="ed('items')">
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

/* ==================== 手机端布局（DEVICE 维度） ==================== */
.edu.is-mobile { padding: var(--space-6) 0; }
.edu.is-mobile .module__head { margin-bottom: var(--space-6); }
.edu.is-mobile .module__title { font-size: calc(var(--fs-xl) * var(--fs-scale, 1)); }
.edu.is-mobile .edu__item { padding-left: calc(var(--space-5) + 6px); margin-bottom: var(--space-4); }
.edu.is-mobile .edu__card { padding: var(--space-4); }
.edu.is-mobile .edu--b .edu__timeline { grid-template-columns: 1fr; gap: var(--space-4); }
</style>
