<script setup>
/**
 * TextReveal — 通用文字显现动画组件
 * ------------------------------------------------------------
 * 模块工程师核心组件：给一段文字挂上文字动画，自动拆分字符/词并播放。
 *
 * Props：
 *   text     : 要显示的文本（字符串）
 *   anim     : 文字动画名，见 ALLOWED_TEXT_ANIMS / TEXT_ANIM_PRESETS
 *              （typewriter | letter-stagger | word-fade | blur-in |
 *               gradient-shift | line-clip | none）
 *   as       : 渲染成哪个标签，默认 'span'（可传 'h1'/'h2'/'p'/'div' 等）
 *   delay    : 动画开始延迟（秒）
 *   duration : 动画时长（秒），缺省用各预设默认值
 *   autoplay : 挂载后是否自动播放，默认 true
 *
 * 用法（按 ARCHITECTURE.md 契约）：
 *   <TextReveal :anim="config.textAnim" :text="t('title')" :delay="0.2" as="h2" />
 *
 * 高级：模板 ref 拿到组件实例后可手动 start()/stop()：
 *   <TextReveal ref="tr" ... />  →  tr.start() / tr.stop()
 *
 * 文字变化（如中英切换）时会自动重新拆分并重新播放。
 * 系统"减少动态"时直接显示完整文本，不做拆分。
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useTextAnim } from '@/composables/useTextAnim'

const props = defineProps({
  text:     { type: String, default: '' },
  anim:     { type: String, default: 'none' },
  as:       { type: String, default: 'span' },
  delay:    { type: Number, default: 0 },
  duration: { type: Number, default: undefined },
  autoplay: { type: Boolean, default: true }
})

const root = ref(null)
let api = null

/** 重新挂载动画：先停掉旧的，再按最新 text/anim 重建 */
function setup() {
  if (!root.value) return
  api?.stop()
  /* 关键：watch 触发先于 Vue 重渲染，此时 el.textContent 仍是旧文本；
     useTextAnim 从 DOM 读原文拆分，会导致语言切换后标题仍旧文案。
     这里强制把最新 props.text 写入元素，保证拆分来源正确。 */
  root.value.textContent = props.text
  api = useTextAnim(root.value, props.anim, {
    delay: props.delay,
    duration: props.duration
  })
  if (props.autoplay) api.start()
}

onMounted(setup)
watch(() => props.text, setup)
watch(() => props.anim, setup)

onBeforeUnmount(() => api?.stop())

/* 手动控制入口 */
defineExpose({
  start: () => api?.start(),
  stop:  () => api?.stop()
})
</script>

<template>
  <component
    :is="as"
    ref="root"
    class="text-reveal"
    :data-text-anim="anim"
  >{{ text }}</component>
</template>

<style scoped>
/* 组件自身不强制排版，颜色/字体继承父级。
   这里只保证拆分后的 inline-block 单元换行表现正常。 */
.text-reveal {
  white-space: normal;
  word-break: break-word;
}
</style>
