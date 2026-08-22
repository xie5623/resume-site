<script setup>
/**
 * ModeTab — 控制台「形态」页：滚动长页 ⇄ 翻页演示双形态切换
 * 调 useMode().setMode(id) → 全站即时切换 + localStorage 持久化。
 */
import { useMode } from '@/composables/useMode'
import { useI18n } from '@/i18n'

const { mode, setMode } = useMode()
const { lang } = useI18n()

const MODES = [
  {
    id: 'scroll',
    icon: '⇅',
    name: { zh: '滚动长页', en: 'Scroll Page' },
    desc: { zh: '经典简历流式长页：滚动入场动画 + 锚点导航。', en: 'Classic resume long page with scroll animations & anchors.' }
  },
  {
    id: 'deck',
    icon: '▦',
    name: { zh: '翻页演示', en: 'Deck Mode' },
    desc: { zh: 'PPT 风格：每模块一屏，整屏切换，适合演示。', en: 'PPT-style: one module per screen, ideal for demos.' }
  }
]

const l = {
  hint: { zh: '切换展示形态，内容与主题保持不变', en: 'Switch presentation mode' }
}
</script>

<template>
  <div class="md-tab">
    <p class="md-tab__hint">{{ l.hint[lang] }}</p>
    <button
      v-for="m in MODES"
      :key="m.id"
      type="button"
      class="md-tab__card glass"
      :class="{ 'md-tab__card--active': mode === m.id }"
      :aria-pressed="mode === m.id"
      @click="setMode(m.id)"
    >
      <span class="md-tab__icon">{{ m.icon }}</span>
      <span class="md-tab__info">
        <span class="md-tab__name">{{ m.name[lang] }}</span>
        <span class="md-tab__desc">{{ m.desc[lang] }}</span>
      </span>
      <span class="md-tab__check" :class="{ 'md-tab__check--on': mode === m.id }">✓</span>
    </button>
  </div>
</template>

<style scoped>
.md-tab { display: flex; flex-direction: column; gap: var(--space-3); }
.md-tab__hint {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  text-align: center;
}

.md-tab__card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  text-align: left;
  cursor: pointer;
  transition: all var(--dur-base) var(--ease-out);
}
.md-tab__card:hover { transform: translateY(-1px); }
.md-tab__card--active {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 1px var(--accent-cyan-soft), var(--shadow-glow);
}

.md-tab__icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-lg);
  border-radius: var(--radius-md);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: var(--accent-cyan);
}

.md-tab__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.md-tab__name { font-size: var(--fs-sm); font-weight: 700; color: var(--text-primary); }
.md-tab__desc { font-size: var(--fs-xs); color: var(--text-muted); line-height: 1.5; }

.md-tab__check {
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
.md-tab__check--on {
  background: var(--accent-gradient);
  border-color: transparent;
  color: var(--on-accent);
  font-weight: 800;
}
</style>
