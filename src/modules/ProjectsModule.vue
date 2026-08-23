<script setup>
/**
 * ProjectsModule — 项目经验（id: projects）
 * 卡片网格（占位项目名/描述/标签/链接），config.variant 切换：
 *  - a：双列卡片网格
 *  - b：三列卡片网格
 *  - c：首张精选大卡 + 双列网格
 *
 * 全部文案走内容层（键名按 projects.* 命名空间，items 为可编辑数组）。
 * Props 契约见 ARCHITECTURE.md：config / lang
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
  { key: 'eyebrow', label: { zh: '眉标', en: 'Eyebrow' }, type: 'text' },
  { key: 'title', label: { zh: '标题', en: 'Title' }, type: 'text' },
  { key: 'sub', label: { zh: '副标题', en: 'Subtitle' }, type: 'text' },
  { key: 'items', label: { zh: '项目列表', en: 'Project items' }, type: 'list' },
  { key: 'demo', label: { zh: '演示链接', en: 'Demo' }, type: 'text' },
  { key: 'github', label: { zh: '仓库链接', en: 'GitHub' }, type: 'text' }
])

/* ===================== 内容层（projects 命名空间，跟随模板+语言，可运行时编辑） ===================== */
const { version } = useVersion()
const { get } = useContent()
const T = (key) => get(version.value, props.lang, `projects.${key}`)

/* ===================== 入场状态（revealed 由 App 装配层 ModuleSection 驱动） ===================== */
const revealed = useModuleReveal(props.config.id)

/* ===================== 强调（字号由 App 层 --fs-scale 统一注入） ===================== */
const emphasizeClass = computed(() => (props.config.emphasize ? 'text-emphasize' : ''))

/* ===================== 占位项目数据（来自内容层 projects.items） ===================== */
const PROJECTS = computed(() => {
  const items = T('items')
  return Array.isArray(items) ? items : []
})

/* 卡片列数：variant b 用 3 列，其余 2 列 */
const gridClass = computed(() => (props.config.variant === 'b' ? 'hm-proj__grid--3' : 'hm-proj__grid--2'))

/* ===================== 项目自定义跳转链接（需求：项目经历可自定义网址） =====================
   每个项目条目支持 demoUrl / githubUrl 字段（内容层配置，控制台可编辑）：
   - linkOf(url)：空值/非字符串 → 回退 '#'（占位，行为与原来一致）
   - extTarget(url)：http(s) 外链 → 新标签页打开；否则不设 target */
const linkOf = (u) => (typeof u === 'string' && u.trim() !== '') ? u.trim() : '#'
const extTarget = (u) => (/^https?:\/\//i.test(linkOf(u))) ? '_blank' : undefined
</script>

<template>
  <section
    class="hm-proj"
    :class="[deviceCls, `hm-proj--${config.variant}`, { 'is-revealed': revealed }]"
  >
    <div class="container">
      <!-- ======== 区块标题 ======== -->
      <header class="hm-proj__head">
        <span class="hm-proj__eyebrow" v-editable="ed('eyebrow')">{{ T('eyebrow') }}</span>
        <h2 class="hm-proj__title" :class="emphasizeClass" v-editable="ed('title')" v-element-style="'title'">
          <TextReveal :anim="config.textAnim" :text="T('title')" :delay="0.1" />
        </h2>
        <span class="hm-proj__line"></span>
        <p class="hm-proj__sub" v-editable="ed('sub')">{{ T('sub') }}</p>
      </header>

      <!-- ======== variant c：精选大卡 ======== -->
      <article
        v-if="config.variant === 'c' && PROJECTS[0]"
        class="hm-proj__feature glass glass--accent"
        v-editable="ed('items')"
      >
        <div class="hm-proj__feature-body">
          <span class="hm-proj__year">{{ PROJECTS[0].year }}</span>
          <h3 class="hm-proj__feature-title">{{ PROJECTS[0].name }}</h3>
          <p class="hm-proj__feature-desc">{{ PROJECTS[0].desc }}</p>
          <ul class="hm-proj__tags">
            <li v-for="tag in PROJECTS[0].tags" :key="tag" class="hm-proj__tag">{{ tag }}</li>
          </ul>
          <div class="hm-proj__links">
            <a class="glass-btn glass-btn--accent" :href="linkOf(PROJECTS[0].demoUrl)" :target="extTarget(PROJECTS[0].demoUrl)" rel="noopener" v-editable="ed('demo')">{{ T('demo') }}</a>
            <a class="glass-btn" :href="linkOf(PROJECTS[0].githubUrl)" :target="extTarget(PROJECTS[0].githubUrl)" rel="noopener" v-editable="ed('github')">{{ T('github') }}</a>
          </div>
        </div>
        <div class="hm-proj__feature-art" aria-hidden="true">
          <span class="hm-proj__art-ring"></span>
          <span class="hm-proj__art-bar hm-proj__art-bar--1"></span>
          <span class="hm-proj__art-bar hm-proj__art-bar--2"></span>
          <span class="hm-proj__art-bar hm-proj__art-bar--3"></span>
        </div>
      </article>

      <!-- ======== 卡片网格（variant c 时从第 2 个开始） ======== -->
      <div class="hm-proj__grid" :class="gridClass" v-editable="ed('items')">
        <article
          v-for="p in (config.variant === 'c' ? PROJECTS.slice(1) : PROJECTS)"
          :key="p.name"
          class="hm-proj__card glass glass--glow"
        >
          <div class="hm-proj__card-top">
            <span class="hm-proj__year">{{ p.year }}</span>
            <span class="hm-proj__pulse" aria-hidden="true"></span>
          </div>
          <h3 class="hm-proj__card-title">{{ p.name }}</h3>
          <p class="hm-proj__card-desc">{{ p.desc }}</p>
          <ul class="hm-proj__tags">
            <li v-for="tag in p.tags" :key="tag" class="hm-proj__tag">{{ tag }}</li>
          </ul>
          <div class="hm-proj__links">
            <a class="hm-proj__link" :href="linkOf(p.demoUrl)" :target="extTarget(p.demoUrl)" rel="noopener" v-editable="ed('demo')">{{ T('demo') }} →</a>
            <a class="hm-proj__link" :href="linkOf(p.githubUrl)" :target="extTarget(p.githubUrl)" rel="noopener" v-editable="ed('github')">{{ T('github') }}</a>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hm-proj { padding: var(--space-8) 0; }

/* ---------- 标题 ---------- */
.hm-proj__head { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-8); }
.hm-proj__eyebrow {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--accent-cyan);
}
.hm-proj__title { font-size: calc(var(--fs-2xl) * var(--fs-scale)); }
.hm-proj__line {
  width: 56px; height: 3px;
  border-radius: var(--radius-pill);
  background: var(--accent-gradient);
}
.hm-proj__sub { color: var(--text-muted); font-size: var(--fs-sm); }

/* ==================== 精选大卡（variant c） ==================== */
.hm-proj__feature {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: var(--space-6);
  padding: var(--space-8);
  margin-bottom: var(--space-6);
  align-items: center;
  overflow: hidden;
}
.hm-proj__feature-body { position: relative; z-index: 1; }
.hm-proj__feature-title { font-size: calc(var(--fs-xl) * var(--fs-scale)); margin: var(--space-2) 0; }
.hm-proj__feature-desc {
  color: var(--text-secondary);
  font-size: var(--fs-base);
  line-height: 1.8;
  max-width: 34em;
}

/* 装饰图形 */
.hm-proj__feature-art {
  position: relative;
  height: 180px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: var(--space-3);
}
.hm-proj__art-ring {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 160px; height: 160px;
  border-radius: 50%;
  border: 1px solid var(--accent-purple-soft);
  box-shadow: 0 0 32px var(--accent-purple-soft);
  animation: hm-art-pulse 3s ease-in-out infinite;
}
@keyframes hm-art-pulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50%      { transform: scale(1.08); opacity: 1; }
}
.hm-proj__art-bar {
  position: relative;
  width: 22px;
  border-radius: var(--radius-sm);
  background: var(--accent-gradient);
  opacity: 0.85;
}
.hm-proj__art-bar--1 { height: 44%; }
.hm-proj__art-bar--2 { height: 72%; }
.hm-proj__art-bar--3 { height: 56%; }

/* ==================== 卡片网格 ==================== */
.hm-proj__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}
.hm-proj__grid--3 { grid-template-columns: repeat(3, 1fr); }

.hm-proj__card {
  display: flex;
  flex-direction: column;
  padding: var(--space-6);
  transition: transform var(--dur-base) var(--ease-out);
}
.hm-proj__card:hover { transform: translateY(-4px); }

.hm-proj__card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}
.hm-proj__year {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.08em;
  color: var(--text-muted);
}
.hm-proj__pulse {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--success);
  animation: hm-pulse 2s ease-out infinite;
}
@keyframes hm-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.5); }
  70%  { box-shadow: 0 0 0 8px rgba(52, 211, 153, 0); }
  100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
}

.hm-proj__card-title {
  font-size: calc(var(--fs-lg) * var(--fs-scale));
  margin-bottom: var(--space-2);
}
.hm-proj__card-desc {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  line-height: 1.8;
}

.hm-proj__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}
.hm-proj__tag {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: var(--text-muted);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-pill);
  padding: 2px 10px;
}
.hm-proj__tag:hover { color: var(--accent-cyan); border-color: var(--accent-cyan-soft); }

.hm-proj__links {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-5);
}
.hm-proj__link {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--accent-cyan);
}
.hm-proj__link:hover { color: var(--accent-purple); }

/* ---------- 响应式 ---------- */
@media (max-width: 980px) {
  .hm-proj__grid--3 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 720px) {
  .hm-proj__grid, .hm-proj__grid--3 { grid-template-columns: 1fr; }
  .hm-proj__feature { grid-template-columns: 1fr; }
  .hm-proj__feature-art { display: none; }
}

/* ==================== 手机端布局（DEVICE 维度） ==================== */
.hm-proj.is-mobile { padding: var(--space-6) 0; }
.hm-proj.is-mobile .hm-proj__head { margin-bottom: var(--space-6); }
.hm-proj.is-mobile .hm-proj__title { font-size: calc(var(--fs-xl) * var(--fs-scale)); }
.hm-proj.is-mobile .hm-proj__grid,
.hm-proj.is-mobile .hm-proj__grid--3 { grid-template-columns: 1fr; gap: var(--space-3); }
.hm-proj.is-mobile .hm-proj__card { padding: var(--space-5); }
.hm-proj.is-mobile .hm-proj__feature { grid-template-columns: 1fr; padding: var(--space-6); gap: var(--space-4); }
.hm-proj.is-mobile .hm-proj__feature-art { display: none; }
.hm-proj.is-mobile .hm-proj__links { flex-wrap: wrap; }
.hm-proj.is-mobile .hm-proj__links .glass-btn { flex: 1 1 130px; text-align: center; justify-content: center; }
</style>
