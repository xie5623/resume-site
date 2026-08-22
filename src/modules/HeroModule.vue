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
 * 内容：从内容层 useContent() 读取（hero 命名空间），控制台可实时编辑。
 * Props 契约见 ARCHITECTURE.md：config / lang
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useModuleReveal } from '@/composables/moduleReveal'
import { useVersion } from '@/composables/useVersion'
import { useTemplates } from '@/composables/useTemplates'
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
  { key: 'greeting', label: { zh: '问候语', en: 'Greeting' }, type: 'text' },
  { key: 'name', label: { zh: '姓名', en: 'Name' }, type: 'text' },
  { key: 'roles', label: { zh: '头衔轮播', en: 'Roles' }, type: 'list' },
  { key: 'tagline', label: { zh: '标语', en: 'Tagline' }, type: 'text' },
  { key: 'ctaWork', label: { zh: '主按钮', en: 'Primary CTA' }, type: 'text' },
  { key: 'ctaContact', label: { zh: '联系按钮', en: 'Contact CTA' }, type: 'text' },
  { key: 'scroll', label: { zh: '滚动提示', en: 'Scroll hint' }, type: 'text' },
  { key: 'badge', label: { zh: '在线徽章', en: 'Badge' }, type: 'text' },
  { key: 'cardRole', label: { zh: '卡片·职位', en: 'Card role' }, type: 'text' },
  { key: 'placeholderCity', label: { zh: '卡片·城市', en: 'Card city' }, type: 'text' },
  { key: 'placeholderMail', label: { zh: '卡片·邮箱', en: 'Card email' }, type: 'text' },
  { key: 'stats', label: { zh: '数据条', en: 'Stats' }, type: 'list' }
])

/* ===================== 内容层（hero 命名空间，跟随模板+语言，可运行时编辑） ===================== */
const { version } = useVersion()
const { get } = useContent()
const T = (key) => get(version.value, props.lang, `hero.${key}`)

/* ===================== 入场状态（revealed 由 App 装配层 ModuleSection 驱动） ===================== */
const revealed = useModuleReveal(props.config.id)

/* ===================== 强调（字号由 App 层 --fs-scale 统一注入） ===================== */
const emphasizeClass = computed(() => (props.config.emphasize ? 'text-emphasize' : ''))

/* ===================== 打字机标语（循环切换角色，:key 重触发 TextReveal） ===================== */
const roleIdx = ref(0)
const roleText = computed(() => {
  const roles = T('roles')
  return Array.isArray(roles) ? (roles[roleIdx.value] ?? '') : ''
})
let timer = null

function scheduleRole() {
  timer = setTimeout(() => {
    roleIdx.value = (roleIdx.value + 1) % (Array.isArray(T('roles')) ? T('roles').length : 1)
    scheduleRole()
  }, 2600)
}

onMounted(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!reduce) scheduleRole()
})
onBeforeUnmount(() => clearTimeout(timer))

/* ===================== 占位统计（variant c，来自内容层 stats） ===================== */
const STATS = computed(() => {
  const stats = T('stats')
  return Array.isArray(stats) ? stats : []
})

/* ===================== 向下滚动目标（模板感知：读运行时模板编排） ===================== */
const { enabledModules: getEnabledModules } = useTemplates()
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
        <div class="hm-hero__eyebrow" v-editable="ed('eyebrow')">
          <span class="hm-hero__eyebrow-dot"></span>
          <TextReveal :anim="config.textAnim" :text="T('eyebrow')" :delay="0.05" />
        </div>

        <p class="hm-hero__greeting" v-editable="ed('greeting')">{{ T('greeting') }}</p>

        <h1 class="hm-hero__name" :class="emphasizeClass" v-editable="ed('name')">
          <TextReveal :anim="config.textAnim" :text="T('name')" :delay="0.15" />
        </h1>

        <!-- 打字机标语：不重建组件（:key 重建会导致完整文本闪现再逐字，
             即首屏"抽搐屏闪"元凶之一）。TextReveal 内部已 watch text
             自动重新拆分播放，直接改 :text 即可平滑轮换。 -->
        <p class="hm-hero__role" aria-live="polite" v-editable="ed('roles')">
          <TextReveal
            :anim="config.textAnim"
            :text="roleText"
            :delay="0.3"
          />
        </p>

        <p class="hm-hero__tagline" v-editable="ed('tagline')">{{ T('tagline') }}</p>

        <div class="hm-hero__actions">
          <a class="glass-btn glass-btn--accent" href="#projects" v-editable="ed('ctaWork')">{{ T('ctaWork') }}</a>
          <a class="glass-btn" href="#contact" v-editable="ed('ctaContact')">{{ T('ctaContact') }}</a>
        </div>

        <!-- variant c：底部数据条 -->
        <div v-if="config.variant === 'c'" class="hm-hero__stats" v-editable="ed('stats')">
          <div v-for="s in STATS" :key="s.label" class="hm-hero__stat glass">
            <span class="hm-hero__stat-value">{{ s.value }}</span>
            <span class="hm-hero__stat-label">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <!-- variant b：右侧快速信息卡 -->
      <aside v-if="config.variant === 'b'" class="hm-hero__card glass glass--glow">
        <div class="hm-hero__card-head">
          <span class="hm-hero__badge" v-editable="ed('badge')">
            <span class="hm-hero__badge-dot"></span>{{ T('badge') }}
          </span>
        </div>
        <dl class="hm-hero__card-list">
          <div class="hm-hero__card-row">
            <dt>{{ T('cardRole') }}</dt>
            <dd v-editable="ed('roles')">{{ T('roles')[0] }}</dd>
          </div>
          <div class="hm-hero__card-row">
            <dt>{{ T('cardLoc') }}</dt>
            <dd v-editable="ed('placeholderCity')">{{ T('placeholderCity') }}</dd>
          </div>
          <div class="hm-hero__card-row">
            <dt>{{ T('cardMail') }}</dt>
            <dd v-editable="ed('placeholderMail')">{{ T('placeholderMail') }}</dd>
          </div>
          <div class="hm-hero__card-row">
            <dt>{{ T('cardAvail') }}</dt>
            <dd class="hm-hero__avail" v-editable="ed('badge')">{{ T('badge') }}</dd>
          </div>
        </dl>
      </aside>
    </div>

    <!-- ======== 滚动指示器 ======== -->
    <a class="hm-hero__scroll" :href="scrollTarget" :aria-label="T('scroll')" v-editable="ed('scroll')">
      <span class="hm-hero__mouse">
        <span class="hm-hero__mouse-wheel"></span>
      </span>
      <span class="hm-hero__scroll-text">{{ T('scroll') }}</span>
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
