<script setup>
/**
 * VersionToggle — 版本切换按钮（资深版 / 应届生版）
 * 玻璃风格分段切换，active 高亮（霓虹渐变），样式仿 LangToggle。
 * 数据来自全局 useVersion()；按钮文案中英跟随当前语言。
 * 切换版本不影响当前语言（版本与语言状态相互独立）。
 */
import { useVersion } from '@/composables/useVersion'
import { getVersions } from '@/config/site.config'
import { useI18n } from '@/i18n'

const { version, setVersion } = useVersion()
const { lang } = useI18n()

const versions = getVersions()

function labelOf(v) {
  return v.label?.[lang.value] ?? v.label?.zh ?? v.id
}
</script>

<template>
  <div class="version-toggle glass" role="group" aria-label="切换版本 / Switch version">
    <button
      v-for="v in versions"
      :key="v.id"
      type="button"
      class="version-toggle__btn"
      :class="{ 'version-toggle__btn--active': version === v.id }"
      :aria-pressed="version === v.id"
      :title="labelOf(v)"
      @click="setVersion(v.id)"
    >
      {{ labelOf(v) }}
    </button>
  </div>
</template>

<style scoped>
.version-toggle {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--dur-fast) var(--ease-out);
}
.version-toggle__btn {
  min-width: 56px;
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
.version-toggle__btn:hover {
  color: var(--text-primary);
  background: var(--glass-bg-hover);
}
.version-toggle__btn--active {
  color: #0a0e1a;
  background: var(--accent-gradient);
  font-weight: 700;
  box-shadow: var(--shadow-glow);
}
.version-toggle__btn--active:hover {
  filter: brightness(1.08);
  color: #0a0e1a;
}

/* 尊重减少动效：关闭过渡 */
@media (prefers-reduced-motion: reduce) {
  .version-toggle, .version-toggle__btn {
    transition: none;
  }
  .version-toggle__btn--active { box-shadow: none; }
}

/* 窄屏：收紧按钮宽度，避免与语言切换器/汉堡挤在一起 */
@media (max-width: 767px) {
  .version-toggle__btn {
    min-width: 34px;
    padding: 2px 4px;
  }
}
</style>
