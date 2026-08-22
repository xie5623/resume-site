<script setup>
/**
 * ThemePicker — 主题切换器（4 主题胶囊选择器）
 * 玻璃风分段切换：每个按钮 = 主题色预览圆点 + 双语名（跟随当前语言）。
 * 数据来自全局 useTheme()：点击 setTheme(id) 即时生效 + localStorage
 * 持久化（resume-site.theme，刷新保留）；切换时带平滑淡入淡出。
 * 主题与模板（版本）/语言/内容相互独立，可任意组合。
 */
import { useTheme } from '@/themes/useTheme'
import { useI18n } from '@/i18n'

const { themeId, setTheme, getThemes } = useTheme()
const { lang } = useI18n()

const themes = getThemes()

function nameOf(th) {
  return th.name?.[lang.value] ?? th.name?.zh ?? th.id
}
function titleOf(th) {
  return th.desc?.[lang.value] ?? th.desc?.zh ?? nameOf(th)
}
</script>

<template>
  <div
    class="theme-picker glass"
    role="group"
    :aria-label="lang === 'zh' ? '切换主题 / Switch theme' : 'Switch theme'"
  >
    <button
      v-for="th in themes"
      :key="th.id"
      type="button"
      class="theme-picker__btn"
      :class="{ 'theme-picker__btn--active': themeId === th.id }"
      :aria-pressed="themeId === th.id"
      :title="titleOf(th)"
      @click="setTheme(th.id)"
    >
      <span class="theme-picker__dot" :style="{ background: th.preview }" />
      <span class="theme-picker__label">{{ nameOf(th) }}</span>
    </button>
  </div>
</template>

<style scoped>
.theme-picker {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--dur-fast) var(--ease-out);
}
.theme-picker__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: var(--space-1) var(--space-3);
  font-size: var(--fs-xs);
  font-weight: 600;
  line-height: 1.6;
  white-space: nowrap;
  color: var(--text-secondary);
  border-radius: var(--radius-pill);
  transition:
    color var(--dur-fast) var(--ease-out),
    background var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}
.theme-picker__btn:hover {
  color: var(--text-primary);
  background: var(--glass-bg-hover);
}
.theme-picker__btn--active {
  color: var(--text-primary);
  background: var(--glass-bg-strong);
  box-shadow: 0 0 0 1px var(--accent-cyan-soft), var(--shadow-glow);
  font-weight: 700;
}
.theme-picker__btn--active:hover {
  filter: brightness(1.05);
}

/* 预览圆点：主题色渐变 + 1px 描边，与当前玻璃边框呼应 */
.theme-picker__dot {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid var(--glass-border-hover);
  box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.2);
}

/* 尊重减少动效：关闭过渡 */
@media (prefers-reduced-motion: reduce) {
  .theme-picker, .theme-picker__btn { transition: none; }
  .theme-picker__btn--active { box-shadow: none; }
}
</style>
