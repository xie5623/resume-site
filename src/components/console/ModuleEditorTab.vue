<script setup>
/**
 * ModuleEditorTab — 控制台「编辑」页：选中模块后改文字内容
 * ------------------------------------------------------------
 * 模块配置（入场动画/文字动画/字号缩放/渐变强调/拖拽摆放/布局变体）
 * 已拆到独立可拖拽浮窗 ModuleConfigBar（t1 布局重构），本页聚焦文字内容：
 *   - 模块选择下拉（选中联动页面高亮 + 浮窗跟随）
 *   - 通用递归编辑器 ContentField（读写 useContent() 的 <命名空间>）
 * 所有改动直接写全局 store → 主区实时预览。
 */
import { computed, watch, onBeforeUnmount } from 'vue'
import { useTemplates } from '@/composables/useTemplates'
import { useVersion } from '@/composables/useVersion'
import { useI18n } from '@/i18n'
import { MODULE_LABELS } from '@/config/site.config'
import { useConsole } from '@/composables/useConsole'
import { useSelection } from '@/composables/useSelection'
import ContentField from './ContentField.vue'

const { version } = useVersion()
const { lang } = useI18n()
const { getTemplateModules } = useTemplates()
const { selectedModuleId, selectModule } = useConsole()
const { selection, selectModule: selectInSelection, scrollToSelection } = useSelection()

/* ---------- 当前模板的全部模块（含禁用，供选择与编辑） ---------- */
const allModules = computed(() => getTemplateModules(version.value))

/* ---------- 选中的模块（响应式，取当前值） ---------- */
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
/* 内容命名空间：副本实例（skills-2）用基础类型（skills）→ 副本与原件共享同一份内容，
   配置/顺序/开关各自独立（唯一实例 id）；原件的命名空间 = 其 id。 */
function nsOf(m) {
  return m.type ?? m.id
}

const moduleLabel = { zh: '编辑模块', en: 'Edit module' }
const liveNote = { zh: '改动即时生效（实时预览）', en: 'Changes apply live' }
const contentLabel = { zh: '文字内容', en: 'Text content' }
const configHint = {
  zh: '动画/字号/强调/摆放/变体 → 左侧「模块配置」浮窗',
  en: 'Animation / scale / emphasize / layout / variant → floating "Module config"'
}

/* ================= 点元素 → 控制台自动定位 + 呼吸闪烁（需求 4） =================
   页面点元素 → useSelection 选中（moduleId + elementKey）→ 这里把 ContentField
   对应输入框滚动到面板可视区（居中）+ 触发 .flash-hint 呼吸闪烁（闪 2 下、
   柔和低亮 cyan）+ 行高亮（isSelected 由 ContentField 响应式维护）。
   - ContentField 每个输入框带 data-content-path=完整内容路径；完整路径 =
     内容命名空间（nsOf，副本用基础类型）+ '.' + elementKey。
   - 控制台选中模块/切 tab 是异步的（ConsolePanel watch → consoleSelectedModuleId
     → 本页 ContentField 重渲染），所以用重试轮询直到输入框出现。 */
let jumpTimer = null
let jumpAttempts = 0

function scrollInputIntoView(input) {
  /* 只滚面板内容区（.console-panel__main），不滚动页面主区 */
  const scroller = input.closest('.console-panel__main')
  if (!scroller || typeof scroller.scrollTo !== 'function') {
    input.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }
  const ir = input.getBoundingClientRect()
  const sr = scroller.getBoundingClientRect()
  const top = scroller.scrollTop + (ir.top - sr.top) - scroller.clientHeight / 2 + ir.height / 2
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
}

function jumpToSelection() {
  const sel = selection.value
  if (!sel || sel.kind !== 'element' || !sel.moduleId || !sel.elementKey) return
  const m = allModules.value.find((x) => x.id === sel.moduleId)
  if (!m) return
  const fullPath = `${nsOf(m)}.${sel.elementKey}`
  const safePath = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(fullPath) : fullPath

  clearTimeout(jumpTimer)
  jumpAttempts = 0
  const attempt = () => {
    const input = document.querySelector(`.cf__input[data-content-path="${safePath}"]`)
    if (input) {
      scrollInputIntoView(input)
      /* 呼吸闪烁：移除类 + 强制 reflow → 重放动画（同字段再次点选也能重闪） */
      input.classList.remove('flash-hint')
      void input.offsetWidth
      input.classList.add('flash-hint')
    } else if (jumpAttempts++ < 30) {
      jumpTimer = setTimeout(attempt, 60)
    }
  }
  attempt()
}

watch(
  () => selection.value?.moduleId + '|' + selection.value?.elementKey,
  jumpToSelection,
  { flush: 'post' }
)
onBeforeUnmount(() => { clearTimeout(jumpTimer) })
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
      <!-- ===== 文字内容（通用递归编辑器） ===== -->
      <section class="me-tab__card glass">
        <h4 class="me-tab__card-title">{{ contentLabel[lang] }} · {{ poolName(selected.type ?? selected.id) }}</h4>
        <ContentField :path="nsOf(selected)" :label="poolName(selected.type ?? selected.id)" :depth="0" />
      </section>
      <p class="me-tab__hint">{{ configHint[lang] }}</p>
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

.me-tab__hint {
  margin: 0;
  font-size: var(--fs-xs);
  color: var(--text-muted);
  text-align: center;
  line-height: 1.5;
}
</style>
