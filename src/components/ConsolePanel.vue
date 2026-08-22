<script setup>
/**
 * ConsolePanel — 嵌入式可收起控制台（左侧常驻面板 · 深色玻璃化）
 * ------------------------------------------------------------
 * 固定在【左侧】的抽屉式玻璃面板，默认收起：
 *   - 收起：只留一个浮动「编辑」按钮（右下角），主区占满全屏正常展示
 *   - 展开：面板自左滑入（~460px，不重排主区），进入编辑态（body.editing）
 *   - 窄屏（< 768px）：面板变全屏覆盖，可关闭
 * 布局（需求 2）：
 *   - 左列：ModuleRail 常驻模块树（增删/排序/开关 + 点选联动高亮）
 *   - 右列：选中模块/元素的完整配置区（文字 + 动画/字号/强调/变体）
 *   - 顶部 tab：编辑 / 主题 / 形态 / 全局（模块树已常驻，不单独占 tab）
 * 深色玻璃化（需求 1）：
 *   - 在 .console-panel/.console-fab 作用域定义固定深色调色板 --c-*，
 *     并把主题令牌（--glass-* / --text-* / --accent-* / --track-bg 等）
 *     在子树内重映射为固定深色值 → 所有控制台子组件强制深色，不随页面主题变化。
 * 双向联动（需求 3）：读 useSelection，页面点选 → 这里同步选中模块。
 */
import { watch } from 'vue'
import { useConsole, setConsoleTab, consoleTab, consoleSelectedModuleId } from '@/composables/useConsole'
import { useI18n } from '@/i18n'
import { useSelection } from '@/composables/useSelection'
import ModuleRail from './console/ModuleRail.vue'
import ModuleEditorTab from './console/ModuleEditorTab.vue'
import ThemeTab from './console/ThemeTab.vue'
import ModeTab from './console/ModeTab.vue'
import GlobalTab from './console/GlobalTab.vue'

const { open, activeTab, isMobile, toggleConsole, closeConsole } = useConsole()
const { lang } = useI18n()
const { selection } = useSelection()

/* ---------- 页面点选 → 左侧联动（需求 3 反向） ----------
   点页面元素（v-editable → selectElement）或模块 → 左侧树高亮 + 配置区跟随：
   - 同步 consoleSelectedModuleId（配置区显示该模块）
   - 若正在「模块/编辑」页则跳到该模块配置；主题/形态/全局不打扰 */
watch(
  () => selection.value?.moduleId,
  (id) => {
    if (!id) return
    consoleSelectedModuleId.value = id
    if (consoleTab.value === 'modules' || consoleTab.value === 'editor') {
      setConsoleTab('editor')
    }
  }
)

/* 标签页：编辑 / 主题 / 形态 / 全局 */
const TABS = [
  { id: 'editor', icon: '✎', name: { zh: '编辑', en: 'Content' } },
  { id: 'theme',  icon: '◐', name: { zh: '主题', en: 'Theme' } },
  { id: 'mode',   icon: '▦', name: { zh: '形态', en: 'Mode' } },
  { id: 'global', icon: '⚙', name: { zh: '全局', en: 'Global' } }
]

function tabName(t) {
  return t.name[lang.value] ?? t.name.zh
}

const l = {
  panelTitle: { zh: '编辑面板', en: 'Edit Panel' },
  edit: { zh: '编辑', en: 'Edit' },
  close: { zh: '收起面板', en: 'Close panel' },
  hint: { zh: '编辑即所见 · 实时预览', en: 'Edit → live preview' }
}
</script>

<template>
  <!-- ======== 浮动「编辑」按钮（收起时） ======== -->
  <Transition name="fab">
    <button
      v-if="!open"
      type="button"
      class="console-fab"
      :aria-label="l.edit[lang]"
      @click="open ? closeConsole() : toggleConsole()"
    >
      <span class="console-fab__icon">✎</span>
      <span class="console-fab__text">{{ l.edit[lang] }}</span>
    </button>
  </Transition>

  <!-- ======== 控制台面板（展开时 · 左侧抽屉） ======== -->
  <Transition name="console">
    <aside
      v-if="open"
      class="console-panel"
      :class="{ 'console-panel--mobile': isMobile }"
      aria-label="编辑面板"
    >
      <!-- 头部：标题 + 收起 -->
      <header class="console-panel__head">
        <div class="console-panel__title-wrap">
          <span class="console-panel__title">{{ l.panelTitle[lang] }}</span>
          <span class="console-panel__hint">{{ l.hint[lang] }}</span>
        </div>
        <button
          type="button"
          class="console-panel__close"
          :aria-label="l.close[lang]"
          :title="l.close[lang]"
          @click="closeConsole"
        >✕</button>
      </header>

      <!-- 标签栏：编辑 / 主题 / 形态 / 全局 -->
      <nav class="console-tabs" role="tablist" :aria-label="l.panelTitle[lang]">
        <button
          v-for="t in TABS"
          :key="t.id"
          type="button"
          class="console-tabs__tab"
          :class="{ 'console-tabs__tab--active': activeTab === t.id }"
          role="tab"
          :aria-selected="activeTab === t.id"
          @click="setConsoleTab(t.id)"
        >
          <span class="console-tabs__icon">{{ t.icon }}</span>
          <span class="console-tabs__name">{{ tabName(t) }}</span>
        </button>
      </nav>

      <!-- 内容区：左常驻模块树 + 右配置区 -->
      <div class="console-panel__split">
        <ModuleRail class="console-panel__rail" />
        <div class="console-panel__main">
          <ModuleEditorTab v-if="activeTab === 'editor'" />
          <ThemeTab v-else-if="activeTab === 'theme'" />
          <ModeTab v-else-if="activeTab === 'mode'" />
          <GlobalTab v-else-if="activeTab === 'global'" />
        </div>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
/* ============================================================
   固定深色调色板（需求 1）——不随页面主题变化
   在 .console-fab / .console-panel 子树内定义私有变量 --c-*，
   并把主题令牌重映射为固定深色值；所有控制台子组件（含 .glass /
   .glass-input / 下拉 / 滑块 / 开关）自动落到深色玻璃风格。
   ============================================================ */
.console-fab,
.console-panel {
  color: var(--c-text); /* 面板内所有未显式着色的文字固定浅色，不随页面主题 */

  /* ---- 私有深色调色板 ---- */
  --c-bg: rgba(8, 12, 24, 0.9);                 /* 面板底（近黑蓝，高不透明保证对比） */
  --c-panel: rgba(15, 23, 42, 0.66);            /* 卡片/行底 */
  --c-panel-strong: rgba(24, 34, 60, 0.85);     /* 强玻璃（头部/tab 激活底） */
  --c-hover: rgba(255, 255, 255, 0.09);         /* hover 底 */
  --c-input: rgba(5, 9, 18, 0.62);              /* 输入框底 */
  --c-text: #e9effc;                            /* 主文字 */
  --c-text-2: rgba(214, 226, 255, 0.74);        /* 次级文字 */
  --c-text-3: rgba(180, 198, 240, 0.52);        /* 弱化文字 */
  --c-border: rgba(130, 165, 255, 0.2);         /* 常规描边 */
  --c-border-2: rgba(150, 185, 255, 0.42);      /* hover 描边 */
  --c-accent: #37d9f2;                          /* 霓虹青 */
  --c-accent-2: #a78bfa;                        /* 霓虹紫 */
  --c-pink: #f472b6;
  --c-grad: linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%);
  --c-on-accent: #060b16;                       /* 渐变面上的文字 */
  --c-track: rgba(255, 255, 255, 0.12);
  --c-danger: #f87171;
  --c-warning: #fbbf24;
  --c-success: #34d399;
  --c-glow: 0 0 22px rgba(55, 217, 242, 0.3);

  /* ---- 重映射主题令牌 → 子树内强制深色（不随页面主题） ---- */
  --glass-bg: var(--c-panel);
  --glass-bg-strong: var(--c-panel-strong);
  --glass-bg-hover: var(--c-hover);
  --glass-border: var(--c-border);
  --glass-border-hover: var(--c-border-2);
  --glass-highlight: rgba(160, 200, 255, 0.5);
  --text-primary: var(--c-text);
  --text-secondary: var(--c-text-2);
  --text-muted: var(--c-text-3);
  --accent-cyan: var(--c-accent);
  --accent-purple: var(--c-accent-2);
  --accent-pink: var(--c-pink);
  --accent-gradient: var(--c-grad);
  --accent-cyan-soft: rgba(55, 217, 242, 0.28);
  --accent-purple-soft: rgba(167, 139, 250, 0.28);
  --on-accent: var(--c-on-accent);
  --track-bg: var(--c-track);
  --danger: var(--c-danger);
  --warning: var(--c-warning);
  --success: var(--c-success);
  --shadow-glow: var(--c-glow);
}

/* ================= 浮动编辑按钮 ================= */
.console-fab {
  position: fixed;
  right: var(--space-5);
  bottom: var(--space-6);
  z-index: 1200;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-pill);
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--c-on-accent);
  background: var(--c-grad);
  border: 1px solid transparent;
  box-shadow: var(--shadow-lg), var(--c-glow);
}
.console-fab:hover { filter: brightness(1.1); transform: translateY(-2px); }
.console-fab__icon { font-size: var(--fs-md); line-height: 1; }
.console-fab__text { font-weight: 700; }

/* ================= 面板骨架（左侧抽屉） ================= */
.console-panel {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 1100;
  width: 460px;
  max-width: 96vw;
  display: flex;
  flex-direction: column;
  color-scheme: dark; /* 强制面板内原生控件（select 下拉等）深色渲染，不随页面 color-scheme */
  background: var(--c-bg);
  backdrop-filter: blur(var(--blur-lg)) saturate(150%);
  -webkit-backdrop-filter: blur(var(--blur-lg)) saturate(150%);
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  border-right: 1px solid var(--c-border);
  box-shadow: var(--shadow-lg);
}
/* 窄屏：全屏覆盖（自左滑入，无圆角） */
.console-panel--mobile {
  width: 100%;
  max-width: 100vw;
  border-radius: 0;
}

.console-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--c-border);
  flex-shrink: 0;
  background: var(--c-panel-strong);
}
.console-panel__title-wrap { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.console-panel__title {
  font-size: var(--fs-md);
  font-weight: 800;
  letter-spacing: 0.02em;
  color: transparent;
  background: var(--c-grad);
  background-clip: text;
  -webkit-background-clip: text;
}
.console-panel__hint {
  font-size: var(--fs-xs);
  color: var(--c-text-3);
  letter-spacing: 0.03em;
}
.console-panel__close {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-sm);
  color: var(--c-text-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  background: var(--c-input);
  transition: all var(--dur-fast) var(--ease-out);
}
.console-panel__close:hover { color: var(--c-danger); border-color: var(--c-danger); }

/* ================= 标签栏 ================= */
.console-tabs {
  display: flex;
  padding: var(--space-2) var(--space-3);
  gap: 2px;
  border-bottom: 1px solid var(--c-border);
  flex-shrink: 0;
  background: var(--c-bg);
}
.console-tabs__tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-2) 0;
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--c-text-2);
  border-radius: var(--radius-sm);
  transition: all var(--dur-fast) var(--ease-out);
}
.console-tabs__tab:hover { color: var(--c-text); background: var(--c-hover); }
.console-tabs__tab--active {
  color: var(--c-on-accent);
  background: var(--c-grad);
  box-shadow: var(--c-glow);
}
.console-tabs__icon { font-size: var(--fs-base); line-height: 1; }
.console-tabs__name { line-height: 1.2; }

/* ================= 内容区：左常驻模块树 + 右配置区 ================= */
.console-panel__split {
  flex: 1;
  min-height: 0;
  display: flex;
}
.console-panel__rail {
  width: 176px;
  flex-shrink: 0;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-3);
  border-right: 1px solid var(--c-border);
  background: rgba(8, 12, 24, 0.4);
}
.console-panel__main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-4);
}

/* ================= 控制台子控件强制深色（覆盖所有状态） ================= */
/* 输入框 / 下拉：深底浅字 */
.console-panel :deep(.glass-input),
.console-panel :deep(select),
.console-panel :deep(select.glass-input),
.console-panel :deep(input),
.console-panel :deep(textarea) {
  color: var(--c-text);
  background-color: var(--c-input);
  border-color: var(--c-border);
}
.console-panel :deep(.glass-input:focus),
.console-panel :deep(select:focus),
.console-panel :deep(input:focus),
.console-panel :deep(textarea:focus) {
  border-color: var(--c-accent);
  box-shadow: 0 0 0 3px var(--accent-cyan-soft);
  outline: none;
}
.console-panel :deep(option) {
  background-color: #0b1020;
  color: var(--c-text);
}
/* 玻璃按钮 / 卡片：落到固定深色 */
.console-panel :deep(.glass),
.console-panel :deep(.glass-btn) {
  background: var(--c-panel);
  border-color: var(--c-border);
}
.console-panel :deep(.glass-btn--accent) {
  color: var(--c-on-accent);
  background: var(--c-grad);
  border-color: transparent;
}

/* ================= 过渡 ================= */
/* 面板：自左滑入 + 淡入 */
.console-enter-active,
.console-leave-active {
  transition: transform 0.3s var(--ease-out), opacity 0.3s var(--ease-out);
}
.console-enter-from,
.console-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* 浮动按钮：淡入淡出 + 微缩放 */
.fab-enter-active,
.fab-leave-active {
  transition: opacity 0.25s var(--ease-out), transform 0.25s var(--ease-out);
}
.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.9);
}

/* ================= 响应式 ================= */
@media (max-width: 767px) {
  .console-fab {
    right: var(--space-3);
    bottom: var(--space-4);
    padding: var(--space-2) var(--space-4);
  }
  /* 窄屏：模块树横在上方（可横滚），配置区在下 */
  .console-panel__split { flex-direction: column; }
  .console-panel__rail {
    width: 100%;
    max-height: 36%;
    border-right: none;
    border-bottom: 1px solid var(--c-border);
    overflow-y: auto;
  }
  .console-panel__main { padding: var(--space-3); }
}

/* 尊重减少动效 */
@media (prefers-reduced-motion: reduce) {
  .console-enter-active, .console-leave-active,
  .fab-enter-active, .fab-leave-active { transition: none; }
}
</style>
