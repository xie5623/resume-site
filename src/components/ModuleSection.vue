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

const props = defineProps({
  module: { type: Object, required: true },
  lang: { type: String, default: 'zh' }
})

/* ---------- 装配层声明：本模块 revealed 由这里负责 ---------- */
registerModuleReveal(props.module.id)

const sectionRef = ref(null)

/* ---------- 模块级滚动入场（单一负责：装配层） ---------- */
const { revealed } = useReveal(sectionRef, {
  animation: props.module.animation,
  start: 'top 88%'
})
watch(revealed, (v) => {
  if (v) markModuleRevealed(props.module.id)
})

/* ---------- 内容自适应字号：autoScale × fontScale × (emphasize ? 1.4 : 1) ---------- */
const { scale: autoScale, modFontScale } = useAutoFit(sectionRef, {
  baseFontScale: props.module.fontScale
})
const clampScale = (v) => Math.min(1.9, Math.max(0.7, v))
const sectionStyle = computed(() => {
  const eff = clampScale(modFontScale.value * (props.module.emphasize ? 1.4 : 1))
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
    :data-module="module.id"
    :style="sectionStyle"
  >
    <component
      :is="getModuleComponent(module.id)"
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
</style>
