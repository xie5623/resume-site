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
  markModuleRevealed,
  registerModuleReplay,
  replayModuleTextAnims
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
  const { revealed, replay, rebuild } = useReveal(sectionRef, {
    animation: props.module.animation,
    /* 需求B：reveal 触发点改早——模块顶在视口底边下方 20% 视口高
       （'top 120%'）时即开始入场动画，内容进入视口时已基本显示完，
       消除「慢半拍」（原先 'top 88%' 太靠后，0.8s 动画在进入视口后才开播）。 */
    start: 'top 88%'
  })
  /* 需求A：入场动画变化 → 重建 reveal（重新隐藏并按新动画播）。
     模块在视口内会自动重新入场，在视口外保持隐藏等滚到。 */
  watch(() => props.module.animation, (a) => rebuild(a))
  watch(revealed, (v) => {
    if (v) markModuleRevealed(props.module.id)
  })
  /* 重播注册：控制台「重新播放」→ 重播该模块区块的入场动画（GSAP）。
     ⚠️ 不再调用 resetModuleRevealed：内部元素（如经历卡片、技能气泡）由
     revealed 驱动独立 CSS 过渡，若一并重置会与区块 GSAP 动画打架，造成
     内容先淡出再淡入的「屏闪」。重播只针对区块入场（用户调整的
     config.animation），内部内容保持可见、随区块整体入场。
     ⚠️ 编辑态可验证：紧随入场之后强制重播本模块全部文字动画
     （replayModuleTextAnims → TextReveal.forceStart），让用户切换
     文字动画下拉后点「重新播放」即可看到效果。 */
  registerModuleReplay(props.module.id, () => {
    replay()
    replayModuleTextAnims(props.module.id)
  })
}

/* ---------- 内容自适应字号：autoScale × fontScale × (emphasize ? 1.4 : 1) ----------
   注意：config.fontScale 必须「响应式」读取（控制台改字号滑块 → 实时生效）。
   useAutoFit 的 baseFontScale 是快照值，改它不响应；故只取自适应系数
   autoScale，fontScale/emphasize 在此响应式乘算。 */
const { scale: autoScale } = useAutoFit(sectionRef)
const clampScale = (v) => Math.min(1.9, Math.max(0.7, v))
/* 字号令牌基础值（与 tokens.css 的 --fs-* 一致；这里在模块作用域内
   重新按「当前 --fs-scale」定义，使【所有】用 var(--fs-*) 的元素都随
   模块字号缩放。注：CSS 自定义属性在「定义处」求值——:root 里
   --fs-sm: calc(0.875rem * var(--fs-scale)) 的 scale 固定为 :root 的 1，
   不会跟随 section 的 --fs-scale，所以必须在 section 层重定义。 */
const FS_BASE = {
  '--fs-xs': 0.75,
  '--fs-sm': 0.875,
  '--fs-base': 1,
  '--fs-md': 1.125,
  '--fs-lg': 1.5,
  '--fs-xl': 2,
  '--fs-2xl': 3
}
const sectionStyle = computed(() => {
  /* 编辑态（控制台展开）或拖拽摆放时：禁用自动字号重算（autoScale 固定 1）。
     - 编辑态：改内容→高度变化→autoFit 重算→字号跳动，正是"每次改完屏闪"的
       视觉来源之一；编辑时字号只受 fontScale/emphasize 控制，所见即所得。
     - 拖拽摆放：元素脱离流式，高度随摆放变化，同理禁用防震荡。
     成品态（收起控制台）恢复自动缩放。 */
  const eff = clampScale((props.module.fontScale ?? 1) * (editing.value || layoutOn.value ? 1 : autoScale.value) * (props.module.emphasize ? 1.4 : 1))
  const vars = {
    '--fs-scale': eff,        // 模块通用字号系数（模块组件消费）
    '--mod-font-scale': eff   // 兜底变量（阶段二契约：未读 --fs-scale 的模块用这个）
  }
  /* 在模块作用域按当前 scale 重定义字号令牌 → 固定 var(--fs-*) 的元素也缩放 */
  for (const [k, base] of Object.entries(FS_BASE)) {
    vars[k] = `calc(${base}rem * ${eff})`
  }
  return vars
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
