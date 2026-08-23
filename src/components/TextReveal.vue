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
import { editing } from '@/composables/useEditingMode'
import { registerTextAnim, unregisterTextAnim } from '@/composables/moduleReveal'
import { getElementStyle } from '@/composables/useElementStyle'

const props = defineProps({
  text:     { type: String, default: '' },
  anim:     { type: String, default: 'none' },
  as:       { type: String, default: 'span' },
  delay:    { type: Number, default: 0 },
  duration: { type: Number, default: undefined },
  autoplay: { type: Boolean, default: true },
  /* caret：typewriter 光标字符。默认 ''（无光标，静态标题不该闪烁）；
     动态打字机行（如 Hero 轮换角色）显式传 '▍' */
  caret:    { type: [String, Boolean], default: '' }
})

const root = ref(null)
let api = null
/* 所在模块 id（重播注册表 key）：挂载时从最近的 [data-module] 容器解析 */
let moduleId = null

/** 元素 key（元素级 textAnim 补丁定位）：每次用的时候实时从最近
    [data-el-style-key] 解析，不缓存。原因：父级 v-element-style 指令的
    mounted 钩子晚于子组件 TextReveal 的 onMounted 才打上 data-el-style-key
    （Vue 挂载顺序：子组件 mounted 先于父元素指令 mounted），若只在
    onMounted 快照一次会拿到 null，导致元素级 textAnim 补丁永远读不到。 */
function currentElementKey() {
  return root.value?.closest('[data-el-style-key]')?.dataset.elStyleKey || null
}

/**
 * 重新挂载动画：先停掉旧的，再按最新 text/anim 重建。
 * @param {boolean} [force=false] force=true 时无视编辑态强制播放——
 *   编辑态控制台「重新播放」验证文字动画用（见 replayModuleTextAnims）。
 */
function setup(force = false) {
  if (!root.value) return
  api?.stop()
  /* 关键：watch 触发先于 Vue 重渲染，此时 el.textContent 仍是旧文本；
     useTextAnim 从 DOM 读原文拆分，会导致语言切换后标题仍旧文案。
     这里强制把最新 props.text 写入元素，保证拆分来源正确。 */
  root.value.textContent = props.text

  /* 元素级 textAnim 补丁优先（getElementStyle 原始补丁，无补丁回退模块级 anim） */
  const elKey = currentElementKey()
  const patch = (moduleId && elKey) ? getElementStyle(moduleId, elKey) : null
  const effAnim = (patch && typeof patch.textAnim === 'string') ? patch.textAnim : props.anim

  /* 编辑态（body.editing = 控制台展开）：默认不重播文字动画——
     用户编辑内容时直接显示最终文本，避免"每次改完都重新逐字动画"的屏闪。
     动画只在成品态（收起控制台）播放一次。
     force=true（编辑态重播验证）除外：强制播放一次文字动画。 */
  if (editing.value && !force) return

  api = useTextAnim(root.value, effAnim, {
    delay: props.delay,
    duration: props.duration,
    caret: props.caret
  })
  if (props.autoplay || force) api.start()
}

/** 强制重播（重播注册表回调 / 手动入口）：无视编辑态播放一次 */
function forceStart() {
  setup(true)
}

onMounted(() => {
  /* 挂载后注册进模块文字动画重播注册表：
     控制台「重新播放」→ replayModuleTextAnims(moduleId) → 强制重播本文字动画 */
  moduleId = root.value?.closest('[data-module]')?.dataset.module || null
  if (moduleId) registerTextAnim(moduleId, forceStart)
  const k0 = currentElementKey()
  setup()
  /* 首帧元素 key 可能因父指令 mounted 顺序尚未打上 data-el-style-key → 下一帧
     重读一次，若读到元素 key 则按元素级 textAnim 补丁重放（防首播落空）。 */
  requestAnimationFrame(() => {
    const k = currentElementKey()
    if (k && k !== k0) setup()
  })
})
watch(() => props.text, setup)
watch(() => props.anim, setup)
/* 元素级 textAnim 补丁变化也重播（getElementStyle 响应式；moduleId 未解析时
   不触发，onMounted 解析后 setup 已覆盖） */
watch(
  () => (moduleId ? getElementStyle(moduleId, currentElementKey())?.textAnim : undefined),
  setup
)

onBeforeUnmount(() => {
  api?.stop()
  if (moduleId) unregisterTextAnim(moduleId, forceStart)
})

/* 手动控制入口 */
defineExpose({
  start: () => api?.start(),
  stop:  () => api?.stop(),
  forceStart
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
