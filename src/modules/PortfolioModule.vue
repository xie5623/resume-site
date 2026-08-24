<script setup>
/**
 * PortfolioModule — 作品集（占位内容，图块用纯 CSS 渐变）
 * 契约：props = { config, lang }；revealed 由 App 装配层驱动 + TextReveal。
 * 布局变体：'a' 瀑布栅格（默认）｜'b' 等宽栅格｜'c' 大图轮播式
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
  { key: 'items', label: { zh: '作品列表', en: 'Portfolio items' }, type: 'list' },
  { key: 'view', label: { zh: '查看链接', en: 'View' }, type: 'text' }
])

/* ===================== 内容层（portfolio 命名空间，跟随模板+语言，可运行时编辑） ===================== */
const { version } = useVersion()
const { get } = useContent()
const T = (key) => get(version.value, props.lang, `portfolio.${key}`)

/* 每个条目绑定一个渐变变体类（颜色全部取自 tokens） */
const items = computed(() => {
  const list = T('items')
  return (Array.isArray(list) ? list : []).map((it, i) => ({
    title: it.title,
    tag: it.tag,
    cover: `pf-cover--${i + 1}`,
    num: String(i + 1).padStart(2, '0')
  }))
})

/* ---------- 入场状态（revealed 由 App 装配层 ModuleSection 驱动） ---------- */
const revealed = useModuleReveal(props.config.id)
const variant = computed(() => (['a', 'b', 'c'].includes(props.config.variant) ? props.config.variant : 'a'))
</script>

<template>
  <section
    class="pf container"
    :data-revealed="revealed ? 'yes' : 'no'"
    :class="[deviceCls, `pf--${variant}`]"
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

    <ul class="pf__grid" v-editable="ed('items')">
      <li v-for="(item, i) in items" :key="i" class="pf__item">
        <article class="glass pf__card" tabindex="0">
          <div class="pf__cover" :class="item.cover" aria-hidden="true">
            <span class="pf__cover-num">{{ item.num }}</span>
            <span class="pf__cover-glyph">◈</span>
          </div>
          <div class="pf__meta">
            <div>
              <h3 class="pf__title">{{ item.title }}</h3>
              <span class="pf__tag">{{ item.tag }}</span>
            </div>
            <span class="pf__link" v-editable="ed('view')">{{ T('view') }} →</span>
          </div>
        </article>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.pf {
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
  font-size: var(--fs-xl);
  margin-bottom: var(--space-2);
}
.module__subtitle {
  font-size: var(--fs-md);
  color: var(--text-secondary);
  margin: 0;
}

/* ---------- 画廊栅格 ---------- */
.pf__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-5);
  margin: 0;
  padding: 0;
  list-style: none;
}
.pf__item {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out);
}
.pf[data-revealed='yes'] .pf__item {
  opacity: 1;
  transform: none;
}
.pf[data-revealed='yes'] .pf__item:nth-child(1) { transition-delay: 0.03s; }
.pf[data-revealed='yes'] .pf__item:nth-child(2) { transition-delay: 0.1s; }
.pf[data-revealed='yes'] .pf__item:nth-child(3) { transition-delay: 0.17s; }
.pf[data-revealed='yes'] .pf__item:nth-child(4) { transition-delay: 0.24s; }
.pf[data-revealed='yes'] .pf__item:nth-child(5) { transition-delay: 0.31s; }
.pf[data-revealed='yes'] .pf__item:nth-child(6) { transition-delay: 0.38s; }

/* 默认变体 a：首块作为宽幅主视觉（桌面端），其余等高 */
@media (min-width: 760px) {
  .pf--a .pf__item:first-child {
    grid-column: span 2;
  }
}

.pf__card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.pf__card:hover,
.pf__card:focus-visible {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  outline: none;
}
.pf__cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  display: grid;
  place-items: center;
  overflow: hidden;
}
.pf__cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 100% at 50% 0%, var(--glass-highlight) 0%, transparent 55%),
    repeating-linear-gradient(45deg, var(--glass-highlight) 0 2px, transparent 2px 12px);
  opacity: 0.22;
  mix-blend-mode: overlay;
  pointer-events: none;
}
.pf__cover-num {
  position: absolute;
  top: var(--space-3);
  left: var(--space-4);
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.2em;
  color: var(--text-primary);
}
.pf__cover-glyph {
  font-size: 2.5rem;
  color: var(--text-primary);
  text-shadow: 0 2px 12px var(--bg-deep);
  transition: transform var(--dur-base) var(--ease-out);
}
.pf__card:hover .pf__cover-glyph,
.pf__card:focus-visible .pf__cover-glyph {
  transform: scale(1.15) rotate(-6deg);
}

/* 渐变封面：颜色全部取自 tokens（无硬编码色值） */
.pf-cover--1 { background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple)); }
.pf-cover--2 { background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink)); }
.pf-cover--3 { background: linear-gradient(135deg, var(--accent-pink), var(--accent-cyan)); }
.pf-cover--4 { background: linear-gradient(160deg, var(--accent-cyan), var(--accent-pink)); }
.pf-cover--5 { background: linear-gradient(160deg, var(--accent-purple), var(--accent-cyan)); }
.pf-cover--6 { background: linear-gradient(160deg, var(--accent-pink), var(--accent-purple)); }

.pf__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
}
.pf__title {
  font-size: var(--fs-md);
  margin-bottom: var(--space-1);
}
.pf__tag {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  font-family: var(--font-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pf__link {
  font-size: var(--fs-sm);
  color: var(--accent-cyan);
  white-space: nowrap;
}

/* ---------- 变体 b：等宽栅格 ---------- */
.pf--b .pf__grid {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
.pf--b .pf__cover {
  aspect-ratio: 4 / 3;
}

/* ---------- 变体 c：居中大图 ---------- */
.pf--c .module__head {
  text-align: center;
}
.pf--c .pf__grid {
  grid-template-columns: 1fr;
  max-width: 720px;
  margin-inline: auto;
}
.pf--c .pf__cover {
  aspect-ratio: 21 / 9;
}

/* 移动端：单列等高卡片 */
@media (max-width: 720px) {
  .pf--a .pf__grid,
  .pf--b .pf__grid {
    grid-template-columns: 1fr;
  }
  .pf--a .pf__item:first-child {
    grid-column: auto;
  }
  .pf__cover {
    aspect-ratio: 16 / 10;
  }
}

/* ==================== 手机端布局（DEVICE 维度） ==================== */
.pf.is-mobile { padding: var(--space-6) 0; }
.pf.is-mobile .module__head { margin-bottom: var(--space-6); }
.pf.is-mobile .module__title { font-size: var(--fs-xl); }
.pf.is-mobile .pf__grid,
.pf.is-mobile .pf--b .pf__grid { grid-template-columns: 1fr; gap: var(--space-4); }
.pf.is-mobile .pf--a .pf__item:first-child { grid-column: auto; }
.pf.is-mobile .pf__cover { aspect-ratio: 16 / 9; }
.pf.is-mobile .pf__meta { padding: var(--space-3) var(--space-4); }
</style>
