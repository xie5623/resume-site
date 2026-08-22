<script setup>
/**
 * ModuleConfigBar — 模块配置独立可拖拽浮窗（t1 布局重构）
 * ------------------------------------------------------------
 * 从 ModuleEditorTab 拆出的「模块配置」区（动画/字号/强调/摆放/变体），
 * 做成固定定位的小型可拖拽浮窗：
 *   - 默认出现在左侧（原编辑面板的左外侧），拖标题栏（⠿ 手柄）可移动
 *     到屏幕任意位置；双击标题栏回到默认位置。
 *   - 跟随选中：读 useSelection().selection.moduleId（页面/模块树点选），
 *     回退 useConsole().selectedModuleId（面板持久化的当前模块）；
 *     都无选中时显示当前模板第一个模块（不打扰，可随时切换）。
 *   - 仅编辑态显示（控制台展开 = editing），收起面板即隐藏（成品态）。
 *   - 层级：高于主界面（z-index 1040），低于右侧编辑栏（1100）。
 *   - 位置/可见性持久化 localStorage key 'resume-site.config-bar'
 *     （{ x, y, visible }）；收起后左下角出现 ⚙ 重开小按钮。
 * 所有写操作与原来一致：改配置走 useHistory（可撤销），字号滑块
 * 拖动期间实时预览、松手入栈一次。
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue'
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
import { editing } from '@/composables/useEditingMode'
import { capture, push, historyUpdateModule, historyToggleLayout, withHistory, historyPasteAsNewModule, historySetElementStyle, historyClearElementStyle } from '@/composables/useHistory'
import { copyModule, clipboard } from '@/composables/useClipboard'
import { resolveElementStyle, getElementStyle, setElementStyle } from '@/composables/useElementStyle'

const { version } = useVersion()
const { lang } = useI18n()
const { getTemplateModules, updateModule } = useTemplates()
const { selectedModuleId, selectModule: selectInConsole } = useConsole()
const { selection, selectModule: selectInSelection, scrollToSelection } = useSelection()
const { isLayoutEnabled, toggleLayout, getLayout, clearModuleLayout } = useLayout()

/* ================= 位置 / 可见性持久化 ================= */
const STORAGE_KEY = 'resume-site.config-bar'
const DEF_POS = { x: 16, y: 96, visible: true }
const BAR_W = 252

function loadPos() {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (saved) {
      const p = JSON.parse(saved)
      const x = Number(p?.x), y = Number(p?.y)
      return {
        x: Number.isFinite(x) ? x : DEF_POS.x,
        y: Number.isFinite(y) ? y : DEF_POS.y,
        visible: typeof p?.visible === 'boolean' ? p.visible : DEF_POS.visible
      }
    }
  } catch (e) {
    console.warn('[ModuleConfigBar] 位置持久化数据损坏，回退默认：', e)
  }
  return { ...DEF_POS }
}

const pos = ref(loadPos())

function savePos() {
  try {
    typeof localStorage !== 'undefined' && localStorage.setItem(STORAGE_KEY, JSON.stringify(pos.value))
  } catch (e) {
    console.warn('[ModuleConfigBar] 位置持久化失败：', e)
  }
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/* 窗口变化时把浮窗夹回可视区 */
function clampToViewport() {
  const vw = window.innerWidth, vh = window.innerHeight
  const w = barRef.value?.offsetWidth ?? BAR_W
  const h = barRef.value?.offsetHeight ?? 360
  const nx = clamp(pos.value.x, 8, Math.max(8, vw - w - 8))
  const ny = clamp(pos.value.y, 8, Math.max(8, vh - h - 8))
  if (nx !== pos.value.x || ny !== pos.value.y) {
    pos.value = { ...pos.value, x: Math.round(nx), y: Math.round(ny) }
    savePos()
  }
}
if (typeof window !== 'undefined') window.addEventListener('resize', clampToViewport)

/* ================= 浮窗拖拽（标题栏 / ⠿ 手柄） ================= */
const barRef = ref(null)
const dragging = ref(false)
let dragStart = null

function startDrag(e) {
  if (e.button != null && e.button !== 0) return
  if (e.target.closest('.config-bar__close')) return /* 关闭按钮不触发拖动 */
  dragging.value = true
  dragStart = {
    px: e.clientX, py: e.clientY,
    x: pos.value.x, y: pos.value.y,
    w: barRef.value?.offsetWidth ?? BAR_W,
    h: barRef.value?.offsetHeight ?? 360
  }
  e.preventDefault() /* 防止拖动时选中文本 */
  window.addEventListener('pointermove', onDragMove)
  window.addEventListener('pointerup', onDragUp)
}
function onDragMove(e) {
  if (!dragStart) return
  const vw = window.innerWidth, vh = window.innerHeight
  const nx = clamp(dragStart.x + (e.clientX - dragStart.px), 8, Math.max(8, vw - dragStart.w - 8))
  const ny = clamp(dragStart.y + (e.clientY - dragStart.py), 8, Math.max(8, vh - dragStart.h - 8))
  pos.value = { ...pos.value, x: Math.round(nx), y: Math.round(ny) }
}
function onDragUp() {
  dragging.value = false
  dragStart = null
  window.removeEventListener('pointermove', onDragMove)
  window.removeEventListener('pointerup', onDragUp)
  savePos()
}
function onHeadDblclick() {
  pos.value = { ...pos.value, x: DEF_POS.x, y: DEF_POS.y }
  savePos()
}
function toggleVisible() {
  pos.value = { ...pos.value, visible: !pos.value.visible }
  savePos()
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onDragMove)
  window.removeEventListener('pointerup', onDragUp)
  window.removeEventListener('resize', clampToViewport)
})

/* ================= 选中模块解析 =================
   优先 useSelection（页面点选 / 模块树点选），回退控制台当前模块
   （面板持久化），都无则显示第一个模块（浮动窗可随时切）。 */
const allModules = computed(() => getTemplateModules(version.value))
const effectiveId = computed(() =>
  selection.value?.moduleId ?? selectedModuleId.value ?? allModules.value[0]?.id ?? null
)
const selected = computed(() =>
  allModules.value.find((m) => m.id === effectiveId.value) ?? null
)

const show = computed(() => editing.value && pos.value.visible && !!selected.value)

/* ================= 元素级配置（需求 2 / t6 req3）：选中元素时配置作用于该元素 =================
   点页面元素 → selection = { kind:'element', moduleId, elementKey, itemIndex? }。
   此时动画/字号/强调等字段应编辑【元素级】（useElementStyle），回退模块级：
   - elementKey：列表条目（itemIndex）→ `${elementKey}.${itemIndex}`；精确字段
     （items.N.field）→ elementKey 原样；标量 → elementKey 原样
   - effectiveCfg：元素级 → resolveElementStyle（元素→模块→默认）；否则模块级 */
const isElementSel = computed(() =>
  selection.value?.kind === 'element' && !!selection.value?.elementKey
)
const elementKey = computed(() => {
  const sel = selection.value
  if (sel?.kind !== 'element' || !sel?.elementKey) return null
  if (Number.isInteger(sel.itemIndex)) return `${sel.elementKey}.${sel.itemIndex}`
  return sel.elementKey
})
const hasElementPatch = computed(() => {
  if (!isElementSel.value || !elementKey.value || !effectiveId.value) return false
  return !!getElementStyle(effectiveId.value, elementKey.value)
})
const effectiveCfg = computed(() => {
  if (!selected.value) return null
  if (isElementSel.value && elementKey.value) {
    return resolveElementStyle(effectiveId.value, elementKey.value, selected.value)
  }
  return selected.value
})

/* ================= 模块选择：配置区 + 页面高亮双向联动 ================= */
function onModuleChange(e) {
  const id = e.target.value
  if (!id) return
  selectInConsole(id)          /* 面板 tab→editor + 当前模块 */
  selectInSelection(id)        /* 选中 store → SelectionBox 高亮 */
  scrollToSelection()          /* 页面滚动定位 */
}

/* ---------- 模块显示名 ---------- */
function labelOf(m) {
  const base = m.label?.[lang.value] ?? m.label?.zh ?? m.id
  return m.enabled === false ? `${base}（停用）` : base
}
function poolName(id) {
  return MODULE_LABELS[id]?.[lang.value] ?? MODULE_LABELS[id]?.zh ?? id
}

/* ================= 配置写操作（全部走历史，可撤销） =================
   元素选中 → 写元素级补丁（historySetElementStyle）；否则模块级（updateModule）。 */
function patch(p) {
  if (!selected.value) return
  if (isElementSel.value && elementKey.value) {
    historySetElementStyle(effectiveId.value, elementKey.value, p)
  } else {
    historyUpdateModule(version.value, selected.value.id, p)
  }
}
function patchAnim(e) { patch({ animation: e.target.value }) }
function patchTextAnim(e) { patch({ textAnim: e.target.value }) }
function patchVariant(v) { patch({ variant: v }) }

/* 字号滑块：@input 实时预览；开始拖/聚焦时捕获快照，松手入栈一次 */
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
  const v = Number(e.target.value)
  if (isElementSel.value && elementKey.value) {
    setElementStyle(effectiveId.value, elementKey.value, { fontScale: v })
  } else {
    updateModule(version.value, selected.value.id, { fontScale: v })
  }
}
function patchEmphasize() {
  if (!selected.value) return
  patch({ emphasize: !effectiveCfg.value?.emphasize })
}
/** 清除该元素元素级补丁 → 回到跟随模块级 */
function clearElementPatch() {
  if (!isElementSel.value || !elementKey.value) return
  historyClearElementStyle(effectiveId.value, elementKey.value)
}

/* ---------- 拖拽摆放开关（需求 5） ---------- */
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

/* ---------- 复制模块 / 粘贴为副本（需求 6，模块级） ----------
   复制：copyModule 捕获模块类型（namespace）→ 剪贴板 kind='module'。
   粘贴：historyPasteAsNewModule 生成同类型新实例（skills-2）并选中。
   仅「剪贴板为模块」时可粘贴（元素级粘贴走选中工具条 / Ctrl+V）。 */
const moduleCopied = ref(false)
function copyThisModule() {
  if (!selected.value) return
  copyModule(selected.value.id)
  moduleCopied.value = true
  setTimeout(() => { moduleCopied.value = false }, 1600)
}
const pasteModuleEnabled = computed(() => clipboard.value?.kind === 'module')
function pasteThisModule() {
  if (!pasteModuleEnabled.value) return
  const cfg = historyPasteAsNewModule()
  if (cfg) {
    selectInSelection(cfg.id) /* 新实例高亮 + 左侧树联动 */
    selectInConsole(cfg.id)
  }
}

/* ---------- 文案（id 仅用于语言切换，无变化） ---------- */
const labels = {
  title: { zh: '模块配置', en: 'Module config' },
  module: { zh: '模块', en: 'Module' },
  animation: { zh: '入场动画', en: 'Entry animation' },
  textAnim: { zh: '文字动画', en: 'Text animation' },
  fontScale: { zh: '字号缩放', en: 'Font scale' },
  emphasize: { zh: '渐变强调', en: 'Gradient emphasize' },
  layout: { zh: '拖拽摆放', en: 'Free placement' },
  placed: { zh: '个元素', en: 'placed' },
  reset: { zh: '清除摆放', en: 'Clear placements' },
  variant: { zh: '布局变体', en: 'Layout variant' },
  close: { zh: '收起配置浮窗', en: 'Hide config panel' },
  open: { zh: '打开模块配置', en: 'Open module config' },
  drag: { zh: '拖动可移动位置', en: 'Drag to move' },
  copyModule: { zh: '复制本模块（可粘为副本）', en: 'Copy this module' },
  pasteModule: { zh: '粘贴为副本模块', en: 'Paste as duplicate module' },
  moduleCopied: { zh: '已复制模块', en: 'Module copied' },
  elementMode: { zh: '元素级', en: 'Element' },
  elementReset: { zh: '清除元素级', en: 'Clear element style' },
  elementHint: { zh: '当前配置作用于选中元素', en: 'Config applies to selected element' }
}
</script>

<template>
  <!-- ======== 收起后的 ⚙ 重开小按钮（仍在编辑态时） ======== -->
  <Transition name="cfpill">
    <button
      v-if="editing && !pos.visible"
      type="button"
      class="config-bar-pill"
      :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
      :title="labels.open[lang]"
      :aria-label="labels.open[lang]"
      @click="toggleVisible"
    >⚙</button>
  </Transition>

  <!-- ======== 模块配置浮窗（可拖拽） ======== -->
  <Transition name="cfgbar">
    <section
      v-if="show"
      ref="barRef"
      class="config-bar"
      :class="{ 'config-bar--dragging': dragging }"
      :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
      :aria-label="labels.title[lang]"
    >
      <!-- 标题栏：⠿ 拖动 + 标题 + 收起 -->
      <header
        class="config-bar__head"
        :title="labels.drag[lang]"
        @pointerdown="startDrag"
        @dblclick="onHeadDblclick"
      >
        <span class="config-bar__grip" aria-hidden="true">⠿</span>
        <span class="config-bar__title">{{ labels.title[lang] }}</span>
        <button
          type="button"
          class="config-bar__close"
          :title="labels.close[lang]"
          :aria-label="labels.close[lang]"
          @click.stop="toggleVisible"
        >–</button>
      </header>

      <div class="config-bar__body">
        <!-- 模块选择 -->
        <label class="cfg-field">
          <span class="cfg-label">{{ labels.module[lang] }}</span>
          <select
            class="cfg-select"
            :value="selected?.id ?? ''"
            @change="onModuleChange"
          >
            <option v-for="m in allModules" :key="m.id" :value="m.id">
              {{ labelOf(m) }}
            </option>
          </select>
        </label>

        <!-- 复制模块 / 粘贴为副本（需求 6） -->
        <div class="cfg-field">
          <span class="cfg-label">⧉ {{ labels.copyModule[lang] }}</span>
          <div class="cfg-clone-row">
            <button
              type="button"
              class="cfg-clone-btn"
              :title="labels.copyModule[lang]"
              @click="copyThisModule"
            >{{ moduleCopied ? labels.moduleCopied[lang] : '复制' }}</button>
            <button
              type="button"
              class="cfg-clone-btn"
              :disabled="!pasteModuleEnabled"
              :title="labels.pasteModule[lang]"
              @click="pasteThisModule"
            >{{ labels.pasteModule[lang] }}</button>
          </div>
        </div>

        <!-- 元素级模式指示（需求 2：选中元素时配置作用于该元素） -->
        <div v-if="isElementSel && elementKey" class="cfg-field cfg-element">
          <div class="cfg-element__bar">
            <span class="cfg-element__badge">{{ labels.elementMode[lang] }}</span>
            <code class="cfg-element__key">{{ elementKey }}</code>
          </div>
          <span class="cfg-element__hint">{{ labels.elementHint[lang] }}</span>
          <button
            v-if="hasElementPatch"
            type="button"
            class="cfg-element__reset"
            :title="labels.elementReset[lang]"
            @click="clearElementPatch"
          >{{ labels.elementReset[lang] }}</button>
        </div>

        <!-- 入场动画 -->
        <div class="cfg-field">
          <span class="cfg-label">{{ labels.animation[lang] }}</span>
          <select class="cfg-select" :value="effectiveCfg?.animation" @change="patchAnim">
            <option v-for="a in ALLOWED_ANIMATIONS" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>

        <!-- 文字动画 -->
        <div class="cfg-field">
          <span class="cfg-label">{{ labels.textAnim[lang] }}</span>
          <select class="cfg-select" :value="effectiveCfg?.textAnim" @change="patchTextAnim">
            <option v-for="a in ALLOWED_TEXT_ANIMS" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>

        <!-- 字号缩放 -->
        <div class="cfg-field">
          <div class="cfg-head">
            <span class="cfg-label">{{ labels.fontScale[lang] }}</span>
            <span class="cfg-value">{{ Number(effectiveCfg?.fontScale ?? 1).toFixed(2) }}×</span>
          </div>
          <input
            type="range"
            class="cfg-range"
            :min="FONT_SCALE_RANGE.min"
            :max="FONT_SCALE_RANGE.max"
            :step="FONT_SCALE_RANGE.step"
            :value="effectiveCfg?.fontScale ?? 1"
            @input="patchFontScaleLive"
            @pointerdown="beginScale"
            @focus="beginScale"
            @change="endScale"
            @blur="endScale"
          />
        </div>

        <!-- 渐变强调 -->
        <div class="cfg-field cfg-field--row">
          <span class="cfg-label">{{ labels.emphasize[lang] }}</span>
          <button
            type="button"
            class="cfg-switch"
            :class="{ 'cfg-switch--on': effectiveCfg?.emphasize }"
            :aria-pressed="effectiveCfg?.emphasize"
            @click="patchEmphasize"
          >
            <span class="cfg-switch__knob" />
          </button>
        </div>

        <!-- 拖拽摆放 -->
        <div class="cfg-field">
          <div class="cfg-head">
            <span class="cfg-label">{{ labels.layout[lang] }}</span>
            <span v-if="layoutOn" class="cfg-value">
              {{ layoutCount }} {{ labels.placed[lang] }}
            </span>
          </div>
          <div class="cfg-layout-row">
            <button
              type="button"
              class="cfg-switch"
              :class="{ 'cfg-switch--on': layoutOn }"
              :aria-pressed="layoutOn"
              @click="patchLayout"
            >
              <span class="cfg-switch__knob" />
            </button>
            <span v-if="layoutOn" class="cfg-layout-reset" @click="resetModuleLayout">
              {{ labels.reset[lang] }}
            </span>
          </div>
        </div>

        <!-- 布局变体 -->
        <div class="cfg-field">
          <span class="cfg-label">{{ labels.variant[lang] }}</span>
          <div class="cfg-segs" role="group">
            <button
              v-for="v in ALLOWED_VARIANTS"
              :key="v"
              type="button"
              class="cfg-seg"
              :class="{ 'cfg-seg--active': selected?.variant === v }"
              @click="patchVariant(v)"
            >{{ v.toUpperCase() }}</button>
          </div>
        </div>
      </div>
    </section>
  </Transition>
</template>

<style scoped>
/* ============================================================
   固定深色调色板（与 ConsolePanel 一致的 --c-* 私有变量）
   浮窗独立于 .console-panel 之外浮在页面上，需要自带深色玻璃。
   ============================================================ */
.config-bar,
.config-bar-pill {
  color: var(--c-text);
  --c-bg: rgba(8, 12, 24, 0.92);
  --c-panel: rgba(15, 23, 42, 0.72);
  --c-panel-strong: rgba(24, 34, 60, 0.92);
  --c-hover: rgba(255, 255, 255, 0.09);
  --c-input: rgba(5, 9, 18, 0.7);
  --c-text: #e9effc;
  --c-text-2: rgba(214, 226, 255, 0.74);
  --c-text-3: rgba(180, 198, 240, 0.52);
  --c-border: rgba(130, 165, 255, 0.2);
  --c-border-2: rgba(150, 185, 255, 0.42);
  --c-accent: #37d9f2;
  --c-accent-2: #a78bfa;
  --c-grad: linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%);
  --c-on-accent: #060b16;
  --c-track: rgba(255, 255, 255, 0.12);
  --c-warning: #fbbf24;
  --c-danger: #f87171;
  --c-glow: 0 0 22px rgba(55, 217, 242, 0.3);
}

/* ================= 浮窗主体（可拖拽，fixed） ================= */
.config-bar {
  position: fixed;
  z-index: 1040; /* 高于主界面/高亮框(1000)，低于右侧编辑栏(1100) */
  width: 252px;
  max-width: calc(100vw - 16px);
  color-scheme: dark;
  background: var(--c-bg);
  backdrop-filter: blur(var(--blur-md)) saturate(150%);
  -webkit-backdrop-filter: blur(var(--blur-md)) saturate(150%);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg), var(--c-glow);
  overflow: hidden;
  transition:
    left 0.22s var(--ease-out),
    top 0.22s var(--ease-out),
    transform 0.22s var(--ease-out),
    opacity 0.22s var(--ease-out);
  will-change: left, top;
}
/* 拖拽中：禁用位移动画，直接跟手 */
.config-bar--dragging {
  transition: none;
}

/* ---------- 标题栏（拖动区） ---------- */
.config-bar__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--c-panel-strong);
  border-bottom: 1px solid var(--c-border);
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none; /* 触屏拖动不触发页面滚动 */
}
.config-bar--dragging .config-bar__head { cursor: grabbing; }
.config-bar__grip {
  font-size: 12px;
  line-height: 1;
  color: var(--c-text-3);
  flex-shrink: 0;
}
.config-bar__title {
  flex: 1;
  min-width: 0;
  font-size: var(--fs-xs);
  font-weight: 800;
  letter-spacing: 0.06em;
  color: transparent;
  background: var(--c-grad);
  background-clip: text;
  -webkit-background-clip: text;
  white-space: nowrap;
  overflow: hidden;
}
.config-bar__close {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  line-height: 1;
  color: var(--c-text-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  background: var(--c-input);
  transition: all var(--dur-fast) var(--ease-out);
}
.config-bar__close:hover { color: var(--c-danger); border-color: var(--c-danger); }

/* ---------- 配置体（紧凑） ---------- */
.config-bar__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  max-height: min(58vh, 400px);
  overflow-y: auto;
}
.cfg-field { display: flex; flex-direction: column; gap: var(--space-1); }
.cfg-field--row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.cfg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cfg-label {
  font-size: 11px;
  color: var(--c-text-3);
  letter-spacing: 0.04em;
}
.cfg-value {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--c-text-2);
}

.cfg-select {
  width: 100%;
  padding: var(--space-1) var(--space-2);
  font-size: var(--fs-xs);
  color: var(--c-text);
  background: var(--c-input);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  transition: border-color var(--dur-fast) var(--ease-out);
}
.cfg-select:focus {
  border-color: var(--c-accent);
  outline: none;
  box-shadow: 0 0 0 3px rgba(55, 217, 242, 0.25);
}
.cfg-select option { background: #0b1020; color: var(--c-text); }

/* ---------- 字号滑块 ---------- */
.cfg-range {
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  height: 6px;
  border-radius: var(--radius-pill);
  background: var(--c-track);
  outline: none;
  cursor: pointer;
}
.cfg-range::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--c-grad);
  border: 2px solid var(--c-on-accent);
  box-shadow: var(--c-glow);
}
.cfg-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--c-accent);
  border: 2px solid var(--c-on-accent);
  box-shadow: var(--c-glow);
}

/* ---------- 开关 ---------- */
.cfg-switch {
  position: relative;
  width: 36px;
  height: 20px;
  flex-shrink: 0;
  border-radius: var(--radius-pill);
  background: var(--c-track);
  border: 1px solid var(--c-border);
  transition: background var(--dur-fast) var(--ease-out);
}
.cfg-switch__knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--c-text-2);
  transition: transform var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}
.cfg-switch--on { background: var(--c-grad); border-color: transparent; }
.cfg-switch--on .cfg-switch__knob {
  transform: translateX(16px);
  background: var(--c-on-accent);
}

/* ---------- 拖拽摆放 ---------- */
.cfg-layout-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.cfg-layout-reset {
  font-size: 10px;
  color: var(--c-text-3);
  padding: 1px 7px;
  border: 1px dashed var(--c-border);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
}
.cfg-layout-reset:hover { color: var(--c-warning); border-color: var(--c-warning); }

/* ---------- 复制 / 粘贴模块（需求 6） ---------- */
.cfg-clone-row {
  display: flex;
  gap: 6px;
}
.cfg-clone-btn {
  flex: 1;
  padding: 4px 0;
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--c-text-2);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-panel);
  transition: all var(--dur-fast) var(--ease-out);
}
.cfg-clone-btn:hover:not(:disabled) {
  color: var(--c-on-accent);
  background: var(--c-grad);
  border-color: transparent;
}
.cfg-clone-btn:disabled { opacity: 0.4; cursor: default; }

/* ---------- 变体分段 ---------- */
.cfg-segs {
  display: flex;
  gap: 4px;
  margin-top: 2px;
}
.cfg-seg {
  flex: 1;
  padding: 3px 0;
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--c-text-2);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-panel);
  transition: all var(--dur-fast) var(--ease-out);
}
.cfg-seg:hover { color: var(--c-text); border-color: var(--c-border-2); }
.cfg-seg--active {
  color: var(--c-on-accent);
  background: var(--c-grad);
  border-color: transparent;
}

/* ---------- 元素级模式指示（需求 2） ---------- */
.cfg-element {
  padding: var(--space-2);
  border: 1px solid rgba(55, 217, 242, 0.4);
  border-radius: var(--radius-sm);
  background: rgba(55, 217, 242, 0.08);
}
.cfg-element__bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.cfg-element__badge {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--c-on-accent);
  background: var(--c-grad);
  padding: 1px 7px;
  border-radius: var(--radius-pill);
}
.cfg-element__key {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--c-accent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cfg-element__hint {
  font-size: 10px;
  color: var(--c-text-3);
  line-height: 1.4;
}
.cfg-element__reset {
  align-self: flex-start;
  font-size: 10px;
  color: var(--c-text-3);
  padding: 1px 8px;
  border: 1px dashed var(--c-border);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
}
.cfg-element__reset:hover { color: var(--c-warning); border-color: var(--c-warning); }

/* ================= 重开小按钮 ================= */
.config-bar-pill {
  position: fixed;
  z-index: 1030;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-md);
  line-height: 1;
  color: var(--c-on-accent);
  background: var(--c-grad);
  border: none;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg), var(--c-glow);
  cursor: pointer;
  transition: transform var(--dur-fast) var(--ease-out), filter var(--dur-fast) var(--ease-out);
}
.config-bar-pill:hover { transform: translateY(-2px); filter: brightness(1.1); }

/* ================= 过渡 ================= */
.cfgbar-enter-active,
.cfgbar-leave-active {
  transition: opacity 0.22s var(--ease-out), transform 0.22s var(--ease-out);
}
.cfgbar-enter-from,
.cfgbar-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.97);
}
.cfpill-enter-active,
.cfpill-leave-active {
  transition: opacity 0.2s var(--ease-out), transform 0.2s var(--ease-out);
}
.cfpill-enter-from,
.cfpill-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

@media (prefers-reduced-motion: reduce) {
  .config-bar { transition: none; }
  .cfgbar-enter-active, .cfgbar-leave-active,
  .cfpill-enter-active, .cfpill-leave-active { transition: none; }
}
</style>
