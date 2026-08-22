<script setup>
/**
 * ThemeTab — 控制台「主题」页：4 主题选择卡片（带预览色）
 * 调 useTheme().setTheme(id) → 全站即时生效 + localStorage 持久化。
 * 卡片：主题预览渐变块 + 双语名 + 描述；当前主题高亮勾选。
 */
import { useTheme } from '@/themes/useTheme'
import { useI18n } from '@/i18n'

const { themeId, setTheme, getThemes } = useTheme()
const { lang } = useI18n()

const themes = getThemes()

function nameOf(t) {
  return t.name?.[lang.value] ?? t.name?.zh ?? t.id
}
function descOf(t) {
  return t.desc?.[lang.value] ?? t.desc?.zh ?? ''
}

const l = {
  title: { zh: '选择主题', en: 'Choose theme' },
  hint: { zh: '切换仅影响外观，不动内容与模块', en: 'Switches appearance only' }
}
</script>

<template>
  <div class="th-tab">
    <p class="th-tab__hint">{{ l.hint[lang] }}</p>
    <div class="th-tab__grid">
      <button
        v-for="t in themes"
        :key="t.id"
        type="button"
        class="th-tab__card glass"
        :class="{ 'th-tab__card--active': themeId === t.id }"
        :aria-pressed="themeId === t.id"
        @click="setTheme(t.id)"
      >
        <span class="th-tab__swatch" :style="{ background: t.preview }" />
        <span class="th-tab__info">
          <span class="th-tab__name">{{ nameOf(t) }}</span>
          <span class="th-tab__desc">{{ descOf(t) }}</span>
        </span>
        <span class="th-tab__check" :class="{ 'th-tab__check--on': themeId === t.id }">✓</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.th-tab { display: flex; flex-direction: column; gap: var(--space-3); }
.th-tab__hint {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  text-align: center;
}
.th-tab__grid { display: grid; grid-template-columns: 1fr; gap: var(--space-3); }

.th-tab__card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  text-align: left;
  cursor: pointer;
  transition: all var(--dur-base) var(--ease-out);
}
.th-tab__card:hover { transform: translateY(-1px); }
.th-tab__card--active {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 1px var(--accent-cyan-soft), var(--shadow-glow);
}

.th-tab__swatch {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border-hover);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.2);
}

.th-tab__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.th-tab__name { font-size: var(--fs-sm); font-weight: 700; color: var(--text-primary); }
.th-tab__desc {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  line-height: 1.5;
}

.th-tab__check {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-xs);
  border-radius: 50%;
  border: 1px solid var(--glass-border);
  color: transparent;
  transition: all var(--dur-fast) var(--ease-out);
}
.th-tab__check--on {
  background: var(--accent-gradient);
  border-color: transparent;
  color: var(--on-accent);
  font-weight: 800;
}
</style>
