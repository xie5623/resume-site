<script setup>
/**
 * ModeToggle — 形态切换按钮（滚动长页 / 翻页演示）
 * 玻璃风格分段切换，active 高亮（霓虹渐变），样式仿 LangToggle。
 * 数据来自全局 useMode()；切换形态不动主题/模板/内容/语言。
 * - 'scroll' 滚动长页：标准简历流式长页（默认）
 * - 'deck'   翻页演示：每模块一屏，整屏切换（PPT 风格）
 */
import { useMode } from '@/composables/useMode'
import { useI18n } from '@/i18n'

const { mode, setMode } = useMode()
const { lang } = useI18n()

const MODES = [
  { id: 'scroll', label: { zh: '滚动', en: 'Scroll' } },
  { id: 'deck',   label: { zh: '翻页', en: 'Deck' } }
]

function labelOf(m) {
  return m.label?.[lang.value] ?? m.label?.zh ?? m.id
}
</script>

<template>
  <div class="mode-toggle glass" role="group" aria-label="切换形态 / Switch mode">
    <button
      v-for="m in MODES"
      :key="m.id"
      type="button"
      class="mode-toggle__btn"
      :class="{ 'mode-toggle__btn--active': mode === m.id }"
      :aria-pressed="mode === m.id"
      :title="labelOf(m)"
      @click="setMode(m.id)"
    >
      {{ labelOf(m) }}
    </button>
  </div>
</template>

<style scoped>
.mode-toggle {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--dur-fast) var(--ease-out);
}
.mode-toggle__btn {
  min-width: 44px;
  padding: var(--space-1) var(--space-2);
  font-size: var(--fs-sm);
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  color: var(--text-secondary);
  border-radius: var(--radius-pill);
  transition:
    color var(--dur-fast) var(--ease-out),
    background var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}
.mode-toggle__btn:hover {
  color: var(--text-primary);
  background: var(--glass-bg-hover);
}
.mode-toggle__btn--active {
  color: #0a0e1a;
  background: var(--accent-gradient);
  font-weight: 700;
  box-shadow: var(--shadow-glow);
}
.mode-toggle__btn--active:hover {
  filter: brightness(1.08);
  color: #0a0e1a;
}

/* 尊重减少动效：关闭过渡 */
@media (prefers-reduced-motion: reduce) {
  .mode-toggle, .mode-toggle__btn {
    transition: none;
  }
  .mode-toggle__btn--active { box-shadow: none; }
}

/* 窄屏：收紧按钮宽度，避免与版本/语言切换器/汉堡挤在一起 */
@media (max-width: 767px) {
  .mode-toggle__btn {
    min-width: 30px;
    padding: 2px 4px;
  }
}
</style>
