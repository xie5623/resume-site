<script setup>
/**
 * ModuleEditorTab — 控制台「编辑」页：选中模块后改文字内容 + 模块配置
 * ------------------------------------------------------------
 * 分两区：
 *   1. 模块配置（写 useTemplates().updateModule）：
 *      animation / textAnim / fontScale(0.8~1.6 滑块) / emphasize / variant
 *   2. 文字内容（读写 useContent() 的 <命名空间>）：
 *      通用递归编辑器 ContentField，覆盖全部 10 个模块（含列表项）。
 * 所有改动直接写全局 store → 主区实时预览。
 */
import { ref, computed, watch } from 'vue'
import { useTemplates } from '@/composables/useTemplates'
import { useVersion } from '@/composables/useVersion'
import { useI18n } from '@/i18n'
import {
  ALLOWED_ANIMATIONS,
  ALLOWED_TEXT_ANIMS,
  ALLOWED_VARIANTS,
  FONT_SCALE_RANGE,
  MODULE_LABELS
} from '@/config/site.config'
import { useConsole } from '@/composables/useConsole'
import { useSelection } from '@/composables/useSelection'
import { useLayout } from '@/composables/useLayout'
import { capture, push, historyUpdateModule, historyToggleLayout, withHistory } from '@/composables/useHistory'
import ContentField from './ContentField.vue'

const { version } = useVersion()
const { lang } = useI18n()
const { getTemplateModules, updateModule } = useTemplates()
const { selectedModuleId, selectModule } = useConsole()
const { selectModule: selectInSelection, scrollToSelection } = useSelection()

/* ---------- 拖拽摆放开关（需求 5）：开启后模块内已标记元素可拖拽改变位置 ---------- */
const { isLayoutEnabled, toggleLayout, getLayout, clearModuleLayout } = useLayout()
const layoutOn = computed(() => (selected.value ? isLayoutEnabled(selected.value.id) : false))
const layoutCount = computed(() => {
  if (!selected.value) return 0
  return Object.keys(getLayout(selected.value.id).positions ?? {}).length
})
function patchLayout() {
  if (!selected.value) return
  historyToggleLayout(selected.value.id, !layoutOn.value)
}
function resetModuleLayout() {
  if (!selected.value) return
  withHistory(() => clearModuleLayout(selected.value.id))
}

/* ---------- 当前模板的全部模块（含禁用，供选择与配置） ---------- */
const allModules = computed(() => getTemplateModules(version.value))

/* ---------- 选中的模块配置（响应式，取当前值） ---------- */
const selected = computed(() =>
  allModules.value.find((m) => m.id === selectedModuleId.value) ?? null
)

/* ---------- 版本切换后校验选中项（无效则回退第一个） ---------- */
watch(version, () => {
  if (!allModules.value.some((m) => m.id === selectedModuleId.value)) {
    selectModule(allModules.value[0]?.id ?? null)
  }
}, { immediate: true })

/* ---------- 模块选择：配置区 + 页面高亮双向联动 ---------- */
function onModuleChange(e) {
  const id = e.target.value
  if (!id) return
  selectModule(id)          /* 配置区切到该模块（tab→editor） */
  selectInSelection(id)     /* 选中 store → SelectionBox 高亮 + 左侧树高亮 */
  scrollToSelection()       /* 页面滚动定位 */
}

/* ---------- 模块显示名 ---------- */
function labelOf(m) {
  const base = m.label?.[lang.value] ?? m.label?.zh ?? m.id
  return m.enabled === false ? `${base}（停用）` : base
}
function poolName(id) {
  return MODULE_LABELS[id]?.[lang.value] ?? MODULE_LABELS[id]?.zh ?? id
}

/* ---------- 配置写操作（全部走历史，可撤销） ---------- */
function patch(p) {
  if (!selected.value) return
  historyUpdateModule(version.value, selected.value.id, p)
}
function patchAnim(e) { patch({ animation: e.target.value }) }
function patchTextAnim(e) { patch({ textAnim: e.target.value }) }
function patchVariant(e) { patch({ variant: e.target.value }) }

/* 字号滑块：@input 实时预览（不逐次生成历史）；开始拖/聚焦时捕获快照，
   松手（@change/@blur）入栈一次 → undo 一步回到拖动前 */
const pendingScaleSnap = ref(null)
function beginScale() {
  if (!pendingScaleSnap.value) pendingScaleSnap.value = capture()
}
function endScale() {
  if (pendingScaleSnap.value) {
    push(pendingScaleSnap.value)
    pendingScaleSnap.value = null
  }
}
function patchFontScaleLive(e) {
  if (!selected.value) return
  updateModule(version.value, selected.value.id, { fontScale: Number(e.target.value) })
}
function patchEmphasize() { patch({ emphasize: !selected.value.emphasize }) }

const animLabel = { zh: '入场动画', en: 'Entry animation' }
const textAnimLabel = { zh: '文字动画', en: 'Text animation' }
const fontScaleLabel = { zh: '字号缩放', en: 'Font scale' }
const emphasizeLabel = { zh: '渐变强调', en: 'Gradient emphasize' }
const variantLabel = { zh: '布局变体', en: 'Layout variant' }
const configLabel = { zh: '模块配置', en: 'Module config' }
const contentLabel = { zh: '文字内容', en: 'Text content' }
const moduleLabel = { zh: '编辑模块', en: 'Edit module' }
const liveNote = { zh: '改动即时生效（实时预览）', en: 'Changes apply live' }
const layoutLabel = { zh: '拖拽摆放', en: 'Free placement' }
const layoutHint = {
  zh: '开启后，模块内标题/正文/列表等元素可拖拽改位置，关闭即恢复默认排版',
  en: 'Drag marked elements to reposition; turn off to restore flow layout'
}
const layoutOnHint = { zh: '已开启：拖拽已标记元素摆放位置', en: 'On: drag marked elements to place them' }
const layoutReset = { zh: '清除本模块摆放', en: 'Clear placements' }
const layoutCountText = { zh: '个元素已摆放', en: 'elements placed' }
</script>

<template>
  <div class="me-tab">
    <!-- ===== 模块选择 ===== -->
    <label class="me-tab__sel">
      <span class="me-tab__sel-label">{{ moduleLabel[lang] }}</span>
      <select
        class="glass-input me-tab__select"
        :value="selected?.id ?? ''"
        @change="onModuleChange"
      >
        <option v-for="m in allModules" :key="m.id" :value="m.id">
          {{ labelOf(m) }}
        </option>
      </select>
    </label>

    <p class="me-tab__note">{{ liveNote[lang] }} ✦</p>

    <template v-if="selected">
      <!-- ===== 模块配置 ===== -->
      <section class="me-tab__card glass">
        <h4 class="me-tab__card-title">{{ configLabel[lang] }}</h4>

        <div class="me-tab__field">
          <span class="me-tab__field-label">{{ animLabel[lang] }}</span>
          <select class="glass-input" :value="selected.animation" @change="patchAnim">
            <option v-for="a in ALLOWED_ANIMATIONS" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>

        <div class="me-tab__field">
          <span class="me-tab__field-label">{{ textAnimLabel[lang] }}</span>
          <select class="glass-input" :value="selected.textAnim" @change="patchTextAnim">
            <option v-for="a in ALLOWED_TEXT_ANIMS" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>

        <div class="me-tab__field">
          <div class="me-tab__field-head">
            <span class="me-tab__field-label">{{ fontScaleLabel[lang] }}</span>
            <span class="me-tab__field-value">{{ Number(selected.fontScale ?? 1).toFixed(2) }}×</span>
          </div>
          <input
            type="range"
            class="cf-range"
            :min="FONT_SCALE_RANGE.min"
            :max="FONT_SCALE_RANGE.max"
            :step="FONT_SCALE_RANGE.step"
            :value="selected.fontScale ?? 1"
            @input="patchFontScaleLive"
            @pointerdown="beginScale"
            @focus="beginScale"
            @change="endScale"
            @blur="endScale"
          />
        </div>

        <div class="me-tab__field me-tab__field--row">
          <span class="me-tab__field-label">{{ emphasizeLabel[lang] }}</span>
          <button
            type="button"
            class="cf__switch"
            :class="{ 'cf__switch--on': selected.emphasize }"
            :aria-pressed="selected.emphasize"
            @click="patchEmphasize"
          >
            <span class="cf__switch-knob" />
          </button>
        </div>

        <!-- 拖拽摆放开关（需求 5） -->
        <div class="me-tab__field">
          <div class="me-tab__field-head">
            <span class="me-tab__field-label">{{ layoutLabel[lang] }}</span>
            <span v-if="layoutOn" class="me-tab__field-value">
              {{ layoutCount }} {{ layoutCountText[lang] }}
            </span>
          </div>
          <div class="me-tab__layout-row">
            <button
              type="button"
              class="cf__switch"
              :class="{ 'cf__switch--on': layoutOn }"
              :aria-pressed="layoutOn"
              @click="patchLayout"
            >
              <span class="cf__switch-knob" />
            </button>
            <span v-if="layoutOn" class="me-tab__layout-reset" @click="resetModuleLayout">
              {{ layoutReset[lang] }}
            </span>
          </div>
          <p class="me-tab__layout-hint">{{ layoutOn ? layoutOnHint[lang] : layoutHint[lang] }}</p>
        </div>

        <div class="me-tab__field">
          <span class="me-tab__field-label">{{ variantLabel[lang] }}</span>
          <div class="me-tab__segs" role="group">
            <button
              v-for="v in ALLOWED_VARIANTS"
              :key="v"
              type="button"
              class="me-tab__seg"
              :class="{ 'me-tab__seg--active': selected.variant === v }"
              @click="patch({ variant: v })"
            >{{ v.toUpperCase() }}</button>
          </div>
        </div>
      </section>

      <!-- ===== 文字内容（通用递归编辑器） ===== -->
      <section class="me-tab__card glass">
        <h4 class="me-tab__card-title">{{ contentLabel[lang] }} · {{ poolName(selected.id) }}</h4>
        <ContentField :path="selected.id" :label="poolName(selected.id)" :depth="0" />
      </section>
    </template>

    <p v-else class="me-tab__note">{{ { zh: '（当前模板没有可编辑的模块）', en: '(No editable modules in this template)' }[lang] }}</p>
  </div>
</template>

<style scoped>
.me-tab { display: flex; flex-direction: column; gap: var(--space-3); }
.me-tab__sel { display: flex; flex-direction: column; gap: var(--space-1); }
.me-tab__sel-label {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  letter-spacing: 0.04em;
}
.me-tab__select { width: 100%; padding: var(--space-2) var(--space-3); font-size: var(--fs-sm); }
.me-tab__note {
  font-size: var(--fs-xs);
  color: var(--success);
  text-align: center;
}

.me-tab__card {
  padding: var(--space-4);
  border-radius: var(--radius-md);
}
.me-tab__card-title {
  font-size: var(--fs-sm);
  font-weight: 700;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-3);
  color: var(--accent-cyan);
}

.me-tab__field { margin-bottom: var(--space-3); }
.me-tab__field:last-child { margin-bottom: 0; }
.me-tab__field--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.me-tab__field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-1);
}
.me-tab__field-label {
  font-size: var(--fs-xs);
  color: var(--text-muted);
}
.me-tab__field-value {
  font-size: var(--fs-xs);
  font-family: var(--font-mono);
  color: var(--text-secondary);
}
.me-tab__field select {
  width: 100%;
  margin-top: var(--space-1);
  padding: var(--space-1) var(--space-3);
  font-size: var(--fs-sm);
  border-radius: var(--radius-sm);
}

/* ---------- 变体分段 ---------- */
.me-tab__segs {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-1);
}
.me-tab__seg {
  flex: 1;
  padding: var(--space-1) 0;
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--text-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  background: var(--glass-bg);
  transition: all var(--dur-fast) var(--ease-out);
}
.me-tab__seg:hover { color: var(--text-primary); }
.me-tab__seg--active {
  color: var(--on-accent);
  background: var(--accent-gradient);
  border-color: transparent;
}

/* ---------- 拖拽摆放 ---------- */
.me-tab__layout-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-1);
}
.me-tab__layout-reset {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  padding: 2px 8px;
  border: 1px dashed var(--glass-border);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
}
.me-tab__layout-reset:hover { color: var(--warning); border-color: var(--warning); }
.me-tab__layout-hint {
  margin: var(--space-1) 0 0;
  font-size: var(--fs-xs);
  color: var(--text-muted);
  line-height: 1.5;
}

/* ---------- 字号滑块 ---------- */
.cf-range {
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  height: 6px;
  border-radius: var(--radius-pill);
  background: var(--track-bg);
  outline: none;
  cursor: pointer;
}
.cf-range::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-gradient);
  border: 2px solid var(--on-accent);
  box-shadow: var(--shadow-glow);
}
.cf-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-cyan);
  border: 2px solid var(--on-accent);
  box-shadow: var(--shadow-glow);
}

/* ---------- 开关（复用 ContentField 的样式，非 scoped 需深选择器） ---------- */
:deep(.cf__switch) {
  position: relative;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
  border-radius: var(--radius-pill);
  background: var(--track-bg);
  border: 1px solid var(--glass-border);
  transition: background var(--dur-fast) var(--ease-out);
}
:deep(.cf__switch-knob) {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--text-secondary);
  transition: transform var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}
:deep(.cf__switch--on) { background: var(--accent-gradient); border-color: transparent; }
:deep(.cf__switch--on .cf__switch-knob) {
  transform: translateX(18px);
  background: var(--on-accent);
}
</style>
