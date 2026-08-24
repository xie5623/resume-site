<script setup>
/**
 * SkillsModule — 专业技能（id: skills）
 * 四种布局变体（config.variant 切换）：
 *  - a：进度条列表（revealed 后宽度动画）
 *  - b：环形图网格（SVG stroke-dashoffset 动画）
 *  - c：标签云（按熟练度加权字号）
 *  - d：气泡图（需求 7）——气泡大小按 level 映射 + 元素级样式
 *       `items.<index>.size` 覆盖（useBubble.resolveBubbleSize），
 *       玻璃材质 + 冒泡浮动动画，手机端按 --bubble-scale 缩放。
 *
 * 内容：从内容层 useContent() 读取（skills 命名空间，含 items 数组），
 * 控制台可实时编辑技能名/熟练度。
 * Props 契约见 ARCHITECTURE.md：config / lang
 */
import { computed } from 'vue'
import { useModuleReveal } from '@/composables/moduleReveal'
import { useVersion } from '@/composables/useVersion'
import { useContent } from '@/content/useContent'
import TextReveal from '@/components/TextReveal.vue'
import { useEditableElement } from '@/composables/useEditableElement'
import { useDeviceLayout } from '@/composables/useDeviceLayout'
import { resolveBubbleSize } from '@/composables/useBubble'

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
  { key: 'items', label: { zh: '技能列表', en: 'Skill items' }, type: 'list' }
])

/* ===================== 内容层（skills 命名空间，跟随模板+语言，可运行时编辑） ===================== */
const { version } = useVersion()
const { get } = useContent()
const T = (key) => get(version.value, props.lang, `skills.${key}`)

/* ===================== 入场状态（revealed 由 App 装配层 ModuleSection 驱动） ===================== */
const revealed = useModuleReveal(props.config.id)

/* ===================== 强调（字号由 App 层 --fs-scale 统一注入） ===================== */
const emphasizeClass = computed(() => (props.config.emphasize ? 'text-emphasize' : ''))

/* ===================== 技能数据（来自内容层 skills.items） ===================== */
const SKILLS = computed(() => {
  const items = T('items')
  return Array.isArray(items) ? items : []
})

/* 环形图需要 SVG 圆的周长：r=34 → C=2πr≈213.6 */
const RING_R = 34
const RING_C = 2 * Math.PI * RING_R

function ringDash(level) {
  return `${(level / 100) * RING_C} ${RING_C}`
}

/* 标签云字号按熟练度在 --fs-sm ~ --fs-xl 之间插值 */
function tagSize(level) {
  const min = 0.875
  const max = 1.5
  const k = (level - 55) / 45
  return `${(min + (max - min) * Math.max(0, Math.min(1, k))).toFixed(2)}rem`
}

/* ===================== 气泡图：单气泡可编辑绑定（需求 7） =====================
   每个气泡独立可选中（elementKey = `items.<index>`，与 useBubble 的
   元素级 size 覆盖键一致）→ 左侧配置浮窗/交互层可对该气泡单独调大小。
   容器仍保留 ed('items') 作整列表选中，单气泡点击 stopPropagation 不冲突。 */
function edItem(i, s) {
  return {
    moduleId: props.config.id,
    key: `items.${i}`,
    label: s?.name ? `${s.name} · ${s.level}%` : `#${i + 1}`,
    type: 'list'
  }
}
</script>

<template>
  <section
    class="hm-skills"
    :class="[deviceCls, `hm-skills--${config.variant}`, { 'is-revealed': revealed }]"
  >
    <div class="container">
      <!-- ======== 区块标题 ======== -->
      <header class="hm-skills__head">
        <span class="hm-skills__eyebrow" v-editable="ed('eyebrow')">{{ T('eyebrow') }}</span>
        <h2 class="hm-skills__title" :class="emphasizeClass" v-editable="ed('title')" v-element-style="'title'">
          <TextReveal :anim="config.textAnim" :text="T('title')" :delay="0.1" />
        </h2>
        <span class="hm-skills__line"></span>
        <p class="hm-skills__sub" v-editable="ed('sub')">{{ T('sub') }}</p>
      </header>

      <!-- ======== variant a：进度条 ======== -->
      <ul v-if="config.variant === 'a'" class="hm-skills__bars" v-editable="ed('items')">
        <li v-for="s in SKILLS" :key="s.name" class="hm-skills__bar glass">
          <div class="hm-skills__bar-top">
            <span class="hm-skills__bar-name">{{ s.name }}</span>
            <span class="hm-skills__bar-value">{{ s.level }}%</span>
          </div>
          <div class="hm-skills__bar-track">
            <span
              class="hm-skills__bar-fill"
              :style="{ width: revealed ? s.level + '%' : '0%' }"
            ></span>
          </div>
        </li>
      </ul>

      <!-- ======== variant b：环形图 ======== -->
      <ul v-else-if="config.variant === 'b'" class="hm-skills__rings" v-editable="ed('items')">
        <li v-for="s in SKILLS" :key="s.name" class="hm-skills__ring glass">
          <svg class="hm-skills__ring-svg" viewBox="0 0 80 80" aria-hidden="true">
            <circle class="hm-skills__ring-track" cx="40" cy="40" :r="RING_R" />
            <circle
              class="hm-skills__ring-progress"
              :class="{ 'is-on': revealed }"
              cx="40" cy="40" :r="RING_R"
              :stroke-dasharray="ringDash(s.level)"
              :stroke-dashoffset="revealed ? 0 : RING_C"
            />
          </svg>
          <span class="hm-skills__ring-value">{{ s.level }}%</span>
          <span class="hm-skills__ring-name">{{ s.name }}</span>
        </li>
      </ul>

      <!-- ======== variant c：标签云 ======== -->
      <div v-else-if="config.variant === 'c'" class="hm-skills__cloud glass" v-editable="ed('items')">
        <span
          v-for="s in SKILLS"
          :key="s.name"
          class="hm-skills__tag"
          :class="{ 'is-on': revealed }"
          :style="{ fontSize: tagSize(s.level) }"
        >{{ s.name }}</span>
      </div>

      <!-- ======== variant d：气泡图（需求 7） ========
           气泡直径 = resolveBubbleSize(level 映射 + 元素级 size 覆盖)；
           --i 错峰浮动/浮现延迟；--bubble-scale 手机端整体缩放。
           每个气泡独立 v-editable（key = items.<index>）→ 可单独选中/调大小。 -->
      <div v-else class="hm-skills__bubbles" v-editable="ed('items')">
        <span
          v-for="(s, i) in SKILLS"
          :key="`${s.name}-${i}`"
          class="hm-skills__bubble"
          :class="{ 'is-on': revealed }"
          :data-item="i"
          v-editable="edItem(i, s)"
          :style="{ '--d': resolveBubbleSize(config.id, i, s.level) + 'px', '--i': i }"
        >
          <span class="hm-skills__bubble-name">{{ s.name }}</span>
          <span class="hm-skills__bubble-level">{{ s.level }}%</span>
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hm-skills { padding: var(--space-8) 0; }

/* ---------- 标题 ---------- */
.hm-skills__head { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-8); }
.hm-skills__eyebrow {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--accent-cyan);
}
.hm-skills__title { font-size: calc(var(--fs-2xl) * var(--fs-scale)); }
.hm-skills__line {
  width: 56px; height: 3px;
  border-radius: var(--radius-pill);
  background: var(--accent-gradient);
}
.hm-skills__sub { color: var(--text-muted); font-size: var(--fs-sm); max-width: 40em; }

/* ==================== variant a：进度条 ==================== */
.hm-skills__bars {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}
.hm-skills__bar { padding: var(--space-5); }
.hm-skills__bar-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-3);
}
.hm-skills__bar-name { font-size: var(--fs-sm); font-weight: 600; }
.hm-skills__bar-value {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: var(--accent-cyan);
}
.hm-skills__bar-track {
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--track-bg);
  overflow: hidden;
}
.hm-skills__bar-fill {
  display: block;
  height: 100%;
  border-radius: var(--radius-pill);
  background: var(--accent-gradient);
  box-shadow: 0 0 12px var(--accent-cyan-soft);
  transition: width 1s var(--ease-out);
}

/* ==================== variant b：环形图 ==================== */
.hm-skills__rings {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}
.hm-skills__ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-5);
}
.hm-skills__ring-svg {
  width: 88px; height: 88px;
  transform: rotate(-90deg);
}
.hm-skills__ring-track {
  fill: none;
  stroke: var(--track-bg);
  stroke-width: 6;
}
.hm-skills__ring-progress {
  fill: none;
  stroke: var(--accent-cyan);
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dashoffset 1.2s var(--ease-out);
}
.hm-skills__ring-value {
  margin-top: var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--text-primary);
}
.hm-skills__ring-name {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  text-align: center;
}

/* ==================== variant c：标签云 ==================== */
.hm-skills__cloud {
  padding: var(--space-8);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: var(--space-3) var(--space-4);
}
.hm-skills__tag {
  display: inline-block;
  padding: var(--space-1) var(--space-4);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-pill);
  color: var(--text-secondary);
  background: var(--glass-bg);
  transition:
    color var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out),
    transform var(--dur-base) var(--ease-out),
    opacity 0.6s var(--ease-out);
}
.hm-skills__tag:hover {
  color: var(--accent-cyan);
  border-color: var(--accent-cyan-soft);
  transform: translateY(-2px);
}
.hm-skills__tag.is-on { opacity: 1; }
.hm-skills__tag:not(.is-on) { opacity: 0; }

/* ==================== variant d：气泡图（需求 7） ====================
   气泡直径由 --d（内联 px）决定，--bubble-scale 整体缩放（手机端调小）；
   玻璃材质 = 径向高光 + 玻璃底 + 内发光/内阴影；revealed 前透明下沉，
   revealed 后浮现并持续冒泡浮动（translate 独立于 transform，互不冲突）。 */
.hm-skills__bubbles {
  --bubble-scale: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: var(--space-3) var(--space-4);
  padding: var(--space-6);
}
.hm-skills__bubble {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: calc(var(--d, 80px) * var(--bubble-scale, 1) * var(--fs-scale, 1));
  height: calc(var(--d, 80px) * var(--bubble-scale, 1) * var(--fs-scale, 1));
  border-radius: 50%;
  color: var(--text-primary);
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.10) 34%, transparent 60%),
    radial-gradient(circle at 72% 80%, rgba(255, 255, 255, 0.10) 0%, transparent 46%),
    var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow:
    0 8px 22px rgba(0, 0, 0, 0.3),
    inset 0 0 22px var(--accent-cyan-soft),
    inset -6px -10px 18px rgba(0, 0, 0, 0.28);
  cursor: default;
  opacity: 0;
  transform: translateY(18px) scale(0.82);
  /* opacity/transform 错峰浮现（--i * 70ms），border/shadow 即时响应 hover */
  transition:
    opacity 0.7s var(--ease-out) calc(var(--i, 0) * 70ms),
    transform 0.7s var(--ease-out) calc(var(--i, 0) * 70ms),
    border-color var(--dur-base) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out);
  animation: hm-bubble-float 5.5s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * -0.7s);
  will-change: transform;
}
/* 玻璃珠高光点（液体气泡质感）：单气泡的右上高光 + 底部反光 */
.hm-skills__bubble::before {
  content: '';
  position: absolute;
  left: 24%;
  top: 16%;
  width: 26%;
  height: 13%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0) 72%);
  filter: blur(0.5px);
  pointer-events: none;
}
.hm-skills__bubble.is-on { opacity: 1; transform: translateY(0) scale(1); }
.hm-skills__bubble:hover {
  border-color: var(--accent-cyan);
  box-shadow:
    0 8px 26px rgba(0, 0, 0, 0.34),
    0 0 24px var(--accent-cyan-soft),
    inset 0 0 22px var(--accent-cyan-soft),
    inset -6px -10px 18px rgba(0, 0, 0, 0.28);
}
.hm-skills__bubble-name {
  font-size: calc(var(--d, 80px) * 0.115 * var(--bubble-scale, 1) * var(--fs-scale, 1));
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
  padding: 0 12%;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  pointer-events: none;
}
.hm-skills__bubble-level {
  font-family: var(--font-mono);
  font-size: calc(var(--d, 80px) * 0.085 * var(--bubble-scale, 1) * var(--fs-scale, 1));
  color: var(--accent-cyan);
  opacity: 0.85;
  pointer-events: none;
}
@keyframes hm-bubble-float {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -7px; }
}
/* 注：原 @media (prefers-reduced-motion: reduce) 禁用浮动动画的规则已移除——
   站长要求保留技能浮动动画（系统 reduce 已在 useMotion.isMotionReduced 覆盖）。 */

/* ---------- 响应式 ---------- */
@media (max-width: 980px) {
  .hm-skills__bars { grid-template-columns: 1fr; }
  .hm-skills__rings { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 640px) {
  .hm-skills__rings { grid-template-columns: repeat(2, 1fr); }
}

/* ==================== 手机端布局（DEVICE 维度） ====================
   生效设备 = 手机：网格收紧、字号下调、间距压缩。
   手机版编排 skills 用标签云 variant c（少占高度）。 */
.hm-skills.is-mobile { padding: var(--space-6) 0; }
.hm-skills.is-mobile .hm-skills__head { margin-bottom: var(--space-6); }
.hm-skills.is-mobile .hm-skills__title { font-size: calc(var(--fs-xl) * var(--fs-scale)); }
.hm-skills.is-mobile .hm-skills__bars { grid-template-columns: 1fr; gap: var(--space-3); }
.hm-skills.is-mobile .hm-skills__bar { padding: var(--space-4); }
.hm-skills.is-mobile .hm-skills__rings { grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
.hm-skills.is-mobile .hm-skills__ring { padding: var(--space-4); }
.hm-skills.is-mobile .hm-skills__ring-svg { width: 64px; height: 64px; }
.hm-skills.is-mobile .hm-skills__cloud { padding: var(--space-5); gap: var(--space-2) var(--space-3); }
.hm-skills.is-mobile .hm-skills__tag { padding: var(--space-1) var(--space-3); }
.hm-skills.is-mobile .hm-skills__bubbles { --bubble-scale: 0.78; padding: var(--space-4); gap: var(--space-2) var(--space-3); }
</style>
