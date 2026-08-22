<script setup>
/**
 * ModulePlaceholder — 未实现模块的统一占位卡片。
 * 真实模块组件实现后，在 src/modules/index.js 注册表中替换对应条目即可。
 *
 * Props 契约（与真实模块一致，见 ARCHITECTURE.md）：
 *  - config : 该模块的完整配置对象（含 id/label/animation/textAnim/fontScale/emphasize/variant）
 *  - lang   : 当前语言 'zh' | 'en'
 */
import { useI18n } from '@/i18n'

defineProps({
  config: { type: Object, required: true },
  lang: { type: String, default: 'zh' }
})

/* 底部说明文案走 i18n（切语言时占位卡也会跟随） */
const { t } = useI18n()
</script>

<template>
  <div class="glass glass--glow module-placeholder">
    <span class="module-placeholder__tag">MODULE</span>
    <h3 class="module-placeholder__id">{{ config.id }}</h3>
    <p class="module-placeholder__label">{{ config.label?.[lang] ?? config.label?.zh ?? config.id }}</p>
    <p class="module-placeholder__note">{{ t('common.placeholderNote') }}</p>
  </div>
</template>

<style scoped>
.module-placeholder {
  padding: var(--space-8) var(--space-6);
  text-align: center;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}
.module-placeholder__tag {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.2em;
  color: var(--text-muted);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-pill);
  padding: 2px 10px;
}
.module-placeholder__id {
  font-size: var(--fs-xl);
  color: transparent;
  background: var(--accent-gradient);
  background-clip: text;
  -webkit-background-clip: text;
}
.module-placeholder__label { color: var(--text-secondary); font-size: var(--fs-md); }
.module-placeholder__note { color: var(--text-muted); font-size: var(--fs-sm); }
</style>
