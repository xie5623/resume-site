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
  restored: { zh: '已恢复默认', en: 'Restored to defaults' }
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
</style>
