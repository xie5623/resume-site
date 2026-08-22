<script setup>
/**
 * GlobalTab — 控制台「全局」页：语言 / 站点品牌名 / 模板 / 恢复默认
 * ------------------------------------------------------------
 *  - 语言：useI18n().setLang（复用现有 i18n，全站文案即时切换）
 *  - 品牌名：读写 useContent() 的 common.brand（当前模板+语言）
 *  - 模板：useVersion().setVersion（资深版 / 应届生版）
 *  - 恢复默认：resetContent() + resetTemplateModules() + 主题回默认
 */
import { computed, ref } from 'vue'
import { useI18n } from '@/i18n'
import { useVersion } from '@/composables/useVersion'
import { useContent } from '@/content/useContent'
import { useTemplates } from '@/composables/useTemplates'
import { useTheme } from '@/themes/useTheme'
import { DEFAULT_THEME } from '@/themes'
import { capture, push, historyResetContent, historyResetTemplateModules } from '@/composables/useHistory'

const { lang, setLang } = useI18n()
const { version, setVersion, currentVersionConfig } = useVersion()
const { get, setContent, resetContent } = useContent()
const { resetTemplateModules } = useTemplates()
const { setTheme } = useTheme()

/* ---------- 品牌名（当前模板+语言的 common.brand，可运行时编辑；带历史会话） ---------- */
const pendingSnap = ref(null)
let brandDirty = false
const brand = computed({
  get: () => get(version.value, lang.value, 'common.brand') ?? '',
  set: (v) => {
    if (!pendingSnap.value) { pendingSnap.value = capture(); brandDirty = false }
    brandDirty = true
    setContent(version.value, lang.value, 'common.brand', v)
  }
})
function finishBrandEdit() {
  if (pendingSnap.value && brandDirty) push(pendingSnap.value)
  pendingSnap.value = null
  brandDirty = false
}

/* ---------- 模板（版本）选择 ---------- */
const templates = [
  { id: 'senior', name: { zh: '资深版', en: 'Senior' } },
  { id: 'graduate', name: { zh: '应届生版', en: 'Graduate' } }
]

/* ---------- 恢复全部默认（内容 / 模块带历史，可撤销） ---------- */
function restoreAll() {
  historyResetContent()
  historyResetTemplateModules()
  setTheme(DEFAULT_THEME)
}

const l = {
  language: { zh: '界面语言', en: 'Language' },
  brand: { zh: '站点品牌名', en: 'Site brand name' },
  template: { zh: '当前模板', en: 'Template' },
  templateHint: { zh: '不同模板 = 不同模块编排（内容/主题不受影响）', en: 'Template = module layout only' },
  restore: { zh: '恢复全部默认（内容 / 模块 / 主题）', en: 'Reset all (content / modules / theme)' },
  restored: { zh: '已恢复默认', en: 'Restored to defaults' },
  workshop: { zh: '创意工坊', en: 'Creative Workshop' },
  workshopHint: { zh: '上传 / 下载社区简历模板（即将上线）', en: 'Upload / download community templates (coming soon)' },
  workshopOpen: { zh: '进入创意工坊', en: 'Open workshop' },
  workshopClose: { zh: '收起', en: 'Close' },
  workshopTitle: { zh: '创意工坊 · 敬请期待', en: 'Creative Workshop · Coming soon' },
  workshopDesc: { zh: '未来可在这里上传你的模板，或下载社区分享的精美模板一键套用。', en: 'Soon you can share your templates and apply community-made ones with one click.' },
  workshopRoadmap: { zh: '规划：模板市场 · 用户上传/审核/共享 · 模板版本管理', en: 'Planned: template marketplace · upload/review/share · versioning' },
  workshopComing: { zh: '敬请期待', en: 'Coming soon' }
}

/* ---------- 创意工坊（需求 8 · 仅入口，功能后置） ---------- */
const workshopOpen = ref(false)
function toggleWorkshop() {
  workshopOpen.value = !workshopOpen.value
}

function toggleLangNow() {
  setLang(lang.value === 'zh' ? 'en' : 'zh')
}
</script>

<template>
  <div class="gl-tab">
    <!-- ===== 语言 ===== -->
    <section class="gl-tab__card glass">
      <h4 class="gl-tab__title">{{ l.language[lang] }}</h4>
      <div class="gl-tab__segs" role="group">
        <button
          type="button"
          class="gl-tab__seg"
          :class="{ 'gl-tab__seg--active': lang === 'zh' }"
          @click="setLang('zh')"
        >中文</button>
        <button
          type="button"
          class="gl-tab__seg"
          :class="{ 'gl-tab__seg--active': lang === 'en' }"
          @click="setLang('en')"
        >English</button>
      </div>
    </section>

    <!-- ===== 品牌名 ===== -->
    <section class="gl-tab__card glass">
      <h4 class="gl-tab__title">{{ l.brand[lang] }}</h4>
      <input
        class="glass-input"
        type="text"
        :value="brand"
        @focus="pendingSnap = pendingSnap || capture()"
        @input="brand = $event.target.value"
        @blur="finishBrandEdit"
        :placeholder="brand || '…'"
      />
    </section>

    <!-- ===== 模板 ===== -->
    <section class="gl-tab__card glass">
      <h4 class="gl-tab__title">{{ l.template[lang] }}</h4>
      <p class="gl-tab__hint">{{ l.templateHint[lang] }}</p>
      <div class="gl-tab__segs" role="group">
        <button
          v-for="t in templates"
          :key="t.id"
          type="button"
          class="gl-tab__seg gl-tab__seg--wide"
          :class="{ 'gl-tab__seg--active': version === t.id }"
          @click="setVersion(t.id)"
        >{{ t.name[lang] }}</button>
      </div>
    </section>

    <!-- ===== 创意工坊入口（需求 8 · 仅入口，功能后置） ===== -->
    <section class="gl-tab__card glass">
      <h4 class="gl-tab__title">{{ l.workshop[lang] }}</h4>
      <p class="gl-tab__hint">{{ l.workshopHint[lang] }}</p>
      <button type="button" class="gl-tab__workshop" @click="toggleWorkshop">
        <span class="gl-tab__workshop-icon">🧪</span>
        <span>{{ workshopOpen ? l.workshopClose[lang] : l.workshopOpen[lang] }}</span>
      </button>

      <!-- 占位面板：仅说明 + 敬请期待，无真实上传/下载 -->
      <Transition name="ws">
        <div v-if="workshopOpen" class="gl-tab__ws-panel">
          <div class="gl-tab__ws-badge">{{ l.workshopComing[lang] }}</div>
          <p class="gl-tab__ws-title">{{ l.workshopTitle[lang] }}</p>
          <p class="gl-tab__ws-desc">{{ l.workshopDesc[lang] }}</p>
          <p class="gl-tab__ws-road">{{ l.workshopRoadmap[lang] }}</p>
        </div>
      </Transition>
    </section>

    <!-- ===== 恢复默认 ===== -->
    <button type="button" class="gl-tab__restore" @click="restoreAll">
      ⟲ {{ l.restore[lang] }}
    </button>
  </div>
</template>

<style scoped>
.gl-tab { display: flex; flex-direction: column; gap: var(--space-3); }
.gl-tab__card {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.gl-tab__title {
  font-size: var(--fs-sm);
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--accent-cyan);
}
.gl-tab__hint { font-size: var(--fs-xs); color: var(--text-muted); }

.gl-tab__segs {
  display: flex;
  gap: var(--space-2);
}
.gl-tab__seg {
  flex: 1;
  padding: var(--space-1) var(--space-3);
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  background: var(--glass-bg);
  transition: all var(--dur-fast) var(--ease-out);
}
.gl-tab__seg:hover { color: var(--text-primary); }
.gl-tab__seg--active {
  color: var(--on-accent);
  background: var(--accent-gradient);
  border-color: transparent;
  font-weight: 700;
}
.gl-tab__seg--wide { flex: 1; }

.gl-tab__restore {
  align-self: center;
  font-size: var(--fs-xs);
  color: var(--text-muted);
  padding: var(--space-1) var(--space-3);
  border: 1px dashed var(--glass-border);
  border-radius: var(--radius-pill);
  transition: color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
}
.gl-tab__restore:hover { color: var(--warning); border-color: var(--warning); }

/* ================= 创意工坊入口（需求 8） ================= */
.gl-tab__workshop {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  align-self: flex-start;
  padding: var(--space-2) var(--space-4);
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--on-accent);
  background: var(--accent-gradient);
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-glow, 0 0 18px rgba(55, 217, 242, 0.3));
  transition: transform var(--dur-fast) var(--ease-out), filter var(--dur-fast) var(--ease-out);
}
.gl-tab__workshop:hover { transform: translateY(-2px); filter: brightness(1.08); }
.gl-tab__workshop-icon { font-size: var(--fs-md); line-height: 1; }

.gl-tab__ws-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: 1px dashed var(--glass-border-hover);
  border-radius: var(--radius-md);
  background: var(--glass-bg-strong);
}
.gl-tab__ws-badge {
  align-self: flex-start;
  padding: 2px 10px;
  font-size: var(--fs-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--on-accent);
  background: var(--accent-gradient);
  border-radius: var(--radius-pill);
}
.gl-tab__ws-title {
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--text-primary);
}
.gl-tab__ws-desc { font-size: var(--fs-xs); color: var(--text-muted); line-height: 1.6; }
.gl-tab__ws-road {
  font-size: var(--fs-xs);
  font-family: var(--font-mono);
  color: var(--accent-cyan);
  opacity: 0.8;
}

/* 占位面板过渡 */
.ws-enter-active, .ws-leave-active { transition: opacity 0.2s var(--ease-out), transform 0.2s var(--ease-out); }
.ws-enter-from, .ws-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
