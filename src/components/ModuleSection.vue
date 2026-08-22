<script setup>
/**
 * ModuleSection — 模块装配容器（t6 装配层）
 * ------------------------------------------------------------
 * 每个启用的模块外面包一层本组件，职责：
 *   1. 模块级滚动入场：用 useReveal(config.animation) 监听本容器，
 *      进入视口后 markModuleRevealed(id)（模块组件的内部错峰动画
 *      通过 useModuleReveal(id) 消费该信号，避免双重入场）。
 *   2. 内容自适应字号：useAutoFit 按内容量算出 scale，与
 *      config.fontScale、config.emphasize(×1.4) 乘算，
 *      注入 --fs-scale 与 --mod-font-scale 两个 CSS 变量，
 *      模块内部 calc(var(--fs-xl) * var(--fs-scale)) 自动生效。
 *   3. 配置驱动渲染：<component :is> 动态渲染注册表里的模块组件，
 *      传入 config + lang。
 *
 * Props：module（模块配置对象）、lang（当前语言）。
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useReveal } from '@/composables/useReveal'
import { useAutoFit } from '@/composables/useAutoFit'
import {
  registerModuleReveal,
  unregisterModuleReveal,
  markModuleRevealed
} from '@/composables/moduleReveal'
import { getModuleComponent } from '@/modules'
import { isLayoutEnabled } from '@/composables/useLayout'
import { useSelection } from '@/composables/useSelection'
import { editing } from '@/composables/useEditingMode'
import { useDeviceLayout } from '@/composables/useDeviceLayout'

const props = defineProps({
  module: { type: Object, required: true },
  lang: { type: String, default: 'zh' },
  /* 形态：'scroll' 滚动长页（默认，滚动入场动画）；
     'deck' 翻页演示（不建 ScrollTrigger，由 DeckContainer 传 active 激活） */
  revealMode: { type: String, default: 'scroll' },
  active: { type: Boolean, default: false }
})

/* ===================== 双端布局（DEVICE 维度）：模块容器跟随有效设备 ===================== */
const { deviceCls } = useDeviceLayout()

/* ---------- 编辑器：模块显示名（hover 角标用，跟随语言） ---------- */
const moduleLabel = computed(() =>
  props.module.label?.[props.lang] ?? props.module.label?.zh ?? props.module.id
)

/* ---------- 编辑器：该模块是否开启「拖拽摆放」（决定 containing block + 禁动画打架） ---------- */
const layoutOn = computed(() => isLayoutEnabled(props.module.id))

/* ---------- 编辑器：点击模块背景 → 选中该模块（元素点击已 stopPropagation，不冲突） ---------- */
const { selectModule } = useSelection()
function onSectionClick() {
  if (!editing.value) return
  selectModule(props.module.id)
}

/* ---------- 装配层声明：本模块 revealed 由这里负责 ---------- */
registerModuleReveal(props.module.id)

const sectionRef = ref(null)

/* ---------- 模块 reveal 驱动（单一负责：装配层） ----------
   scroll：useReveal 滚动入场，进入视口后 markModuleRevealed。
   deck  ：不建任何 ScrollTrigger（禁用滚动入场动画，模块直接显示），
           激活（active=true，该屏切到视口）时 markModuleRevealed，
           模块内部文字动画（TextReveal）随挂载/激活正常播放。 */
if (props.revealMode === 'deck') {
  watch(() => props.active, (v) => {
    if (v) markModuleRevealed(props.module.id)
  }, { immediate: true })
} else {
  const { revealed } = useReveal(sectionRef, {
    animation: props.module.animation,
    start: 'top 88%'
  })
  watch(revealed, (v) => {
    if (v) markModuleRevealed(props.module.id)
  })
}

/* ---------- 内容自适应字号：autoScale × fontScale × (emphasize ? 1.4 : 1) ----------
   注意：config.fontScale 必须「响应式」读取（控制台改字号滑块 → 实时生效）。
   useAutoFit 的 baseFontScale 是快照值，改它不响应；故只取自适应系数
   autoScale，fontScale/emphasize 在此响应式乘算。 */
const { scale: autoScale } = useAutoFit(sectionRef)
const clampScale = (v) => Math.min(1.9, Math.max(0.7, v))
const sectionStyle = computed(() => {
  /* 拖拽摆放（layoutOn）：元素已脱离流式（absolute），模块高度会随
     摆放位置变化——此时禁用自动字号重算（autoScale 固定为 1），
     避免「高度变化 → 字号变化 → 布局再变」的震荡型屏闪。
     用户手动摆放时字号只受 fontScale/emphasize 控制，可预期。 */
  const eff = clampScale((props.module.fontScale ?? 1) * (layoutOn.value ? 1 : autoScale.value) * (props.module.emphasize ? 1.4 : 1))
  return {
    '--fs-scale': eff,        // 模块通用字号系数（模块组件消费）
    '--mod-font-scale': eff   // 兜底变量（阶段二契约：未读 --fs-scale 的模块用这个）
  }
})

onBeforeUnmount(() => unregisterModuleReveal(props.module.id))
</script>

<template>
  <section
    ref="sectionRef"
    :id="module.id"
    class="module-section"
    :class="[
      deviceCls,
      {
        'module-section--deck': revealMode === 'deck',
        'module-section--layout': layoutOn
      }
    ]"
    :data-device="deviceCls"
    :data-module="module.id"
    :data-module-label="moduleLabel"
    :data-reveal-mode="revealMode"
    :style="sectionStyle"
    @click="onSectionClick"
  >
    <component
      :is="getModuleComponent(module)"
      :config="module"
      :lang="lang"
    />
  </section>
</template>

<style scoped>
.module-section {
  scroll-margin-top: calc(var(--header-h) + var(--space-4));
  margin-bottom: var(--section-gap);
}
/* 翻页演示形态：去掉屏间距，交给 DeckContainer 的屏内居中布局 */
.module-section--deck {
  margin-bottom: 0;
}
/* 拖拽摆放开启：本模块作为元素绝对定位的 containing block */
.module-section--layout {
  position: relative;
}
/* 手机端（DEVICE 维度）：收紧模块间距，长页更紧凑 */
.module-section.is-mobile {
  margin-bottom: var(--space-8);
}
</style>
