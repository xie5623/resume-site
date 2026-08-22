<script setup>
/**
 * LangToggle — 语言切换按钮（中 / EN）
 * 玻璃风格分段切换，active 高亮（霓虹渐变）。
 * 数据来自全局 i18n（useI18n），切换自动持久化并全站联动。
 */
import { useI18n } from '@/i18n'

const { lang, setLang } = useI18n()

const LANGS = [
  { code: 'zh', label: '中', title: '中文 / Chinese' },
  { code: 'en', label: 'EN', title: 'English' }
]
</script>

<template>
  <div class="lang-toggle glass" role="group" aria-label="切换语言 / Switch language">
    <button
      v-for="l in LANGS"
      :key="l.code"
      type="button"
      class="lang-toggle__btn"
      :class="{ 'lang-toggle__btn--active': lang === l.code }"
      :aria-pressed="lang === l.code"
      :title="l.title"
      @click="setLang(l.code)"
    >
      {{ l.label }}
    </button>
  </div>
</template>

<style scoped>
.lang-toggle {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-sm);
  /* 切换高亮时的平滑过渡 */
  transition: border-color var(--dur-fast) var(--ease-out);
}
.lang-toggle__btn {
  min-width: 40px;
  padding: var(--space-1) var(--space-2);
  font-size: var(--fs-sm);
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-secondary);
  border-radius: var(--radius-pill);
  transition:
    color var(--dur-fast) var(--ease-out),
    background var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}
.lang-toggle__btn:hover {
  color: var(--text-primary);
  background: var(--glass-bg-hover);
}
.lang-toggle__btn--active {
  color: #0a0e1a;
  background: var(--accent-gradient);
  font-weight: 700;
  box-shadow: var(--shadow-glow);
}
.lang-toggle__btn--active:hover {
  filter: brightness(1.08);
  color: #0a0e1a;
}

/* 尊重减少动效：关闭过渡 */
@media (prefers-reduced-motion: reduce) {
  .lang-toggle, .lang-toggle__btn {
    transition: none;
  }
  .lang-toggle__btn--active { box-shadow: none; }
}

/* 窄屏：收紧按钮宽度，避免与版本切换器/汉堡挤在一起 */
@media (max-width: 767px) {
  .lang-toggle__btn {
    min-width: 28px;
    padding: 2px 4px;
  }
}
</style>
