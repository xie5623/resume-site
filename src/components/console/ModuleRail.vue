<script setup>
/**
 * ModuleRail — 左侧常驻模块树（需求 2/3 的左侧联动面板）
 * ------------------------------------------------------------
 * 固定在控制台最左列，常驻显示当前模板的全部模块：
 *   - 每模块 = 手风琴/折叠面板：默认只显示紧凑行（缩写 + 开关 + 抓手），
 *     点行身或 ▸ → 展开整个模块条目（全名 + 配置摘要 + 操作按钮），再点收起。
 *   - 展开/收起状态持久化 localStorage 'resume-site.rail-fold'（展开模块 id 集合）。
 *   - 点模块名/行身 → useSelection.selectModule(id)（页面高亮框 + 滚动定位）
 *             + useConsole.selectModule(id)（右侧配置区显示该模块）
 *   - 选中模块自动展开：页面点元素/点模块选中时，对应行展开 + 高亮
 *     （watch selection → activeId）。
 *   - 行内操作：上移 / 下移 / 复制（克隆副本）/ 删除，全部带历史可撤销。
 *   - 底部：从模块池添加 / 恢复默认编排（带历史，可撤销）。
 * 所有写操作包进 useHistory().withHistory → 撤销/重做一步到位。
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useTemplates } from '@/composables/useTemplates'
import { useVersion } from '@/composables/useVersion'
import { useI18n } from '@/i18n'
import { useSelection } from '@/composables/useSelection'
import { useConsole, consoleSelectedModuleId } from '@/composables/useConsole'
import { useHistory } from '@/composables/useHistory'
import { MODULE_IDS, MODULE_LABELS } from '@/config/site.config'

const { version } = useVersion()
const { lang } = useI18n()
const {
  getTemplateModules,
  toggleModule,
  moveModule,
  removeModule,
  addModule,
  createModuleInstance,
  resetTemplateModules
} = useTemplates()
const { selection, selectModule: selectInSelection, clearSelection } = useSelection()
const { selectModule: selectInConsole, openConsole } = useConsole()
const { withHistory, capture, push } = useHistory()

/* ---------- 拖拽排序（需求 8）：抓手拖起 → 实时重排 → 松手整段入历史 ---------- */
const dragIdx = ref(null)
let dragEl = null
let preSnapshot = null

function onDragStart(e, idx) {
  const grip = e.target.closest('.rail__grip')
  if (!grip) { e.preventDefault(); return }
  dragIdx.value = idx
  dragEl = grip.closest('.rail__item')
  preSnapshot = capture()              // 拖前快照 → 松手 push，整段拖拽一个撤销单元
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', String(idx))
  requestAnimationFrame(() => dragEl?.classList.add('rail__item--dragging'))
}

function onRowDragOver(e, idx) {
  e.preventDefault()
  if (dragIdx.value == null) return
  const rect = e.currentTarget.getBoundingClientRect()
  const before = e.clientY < rect.top + rect.height / 2
  const from = dragIdx.value
  let to = before ? idx : idx + 1
  if (to === from || to === from + 1) return
  const insertAt = to > from ? to - 1 : to
  if (insertAt === from) return
  moveModule(version.value, from, insertAt) // 实时重排 + 持久化 → 页面顺序跟随
  dragIdx.value = insertAt
}

function onDragEnd() {
  if (dragIdx.value != null && preSnapshot) push(preSnapshot) // 拖拽结果并入历史（可撤销）
  dragIdx.value = null
  preSnapshot = null
  if (dragEl) { dragEl.classList.remove('rail__item--dragging'); dragEl = null }
}

/* ---------- 当前模板全部模块（含停用，按 list 顺序） ---------- */
const modules = computed(() => getTemplateModules(version.value))

/* ---------- 当前选中模块 id（页面点选 / 左侧点选都联动到这里） ---------- */
const activeId = computed(() => selection.value?.moduleId ?? null)

function labelOf(m) {
  return m.label?.[lang.value] ?? m.label?.zh ?? m.id
}

/* ================= 手风琴折叠（需求 1）：每模块行可整体展开/收起 =================
   默认只显示紧凑行（缩写/名称 + 开关 + 抓手），点行身/▸ → 展开显示
   该模块完整信息区（全名 + 配置摘要 + 操作按钮），再点收起整个收进去。
   展开状态持久化：localStorage 'resume-site.rail-fold' = 展开模块 id 数组。 */
const FOLD_KEY = 'resume-site.rail-fold'

function loadFolded() {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(FOLD_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []
  } catch (e) {
    return []
  }
}

/** 展开的模块 id 集合（默认全收起，树不占空间） */
const expandedIds = ref(new Set(loadFolded()))

watch(expandedIds, (set) => {
  try {
    typeof localStorage !== 'undefined' && localStorage.setItem(FOLD_KEY, JSON.stringify([...set]))
  } catch (e) { /* ignore */ }
})

function isOpen(id) {
  return expandedIds.value.has(id)
}

function expand(id) {
  if (!id || expandedIds.value.has(id)) return
  const next = new Set(expandedIds.value)
  next.add(id)
  expandedIds.value = next
}

function toggleFold(id) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
}

/* 模块增删/换版本后清理已不存在的 id（避免残留）。
   注意：不能 watch(modules)——getTemplateModules 就地 splice 后返回同一数组
   引用，ref 级 watch 不会触发；改 watch id 列表字符串。 */
watch(
  () => modules.value.map((m) => m.id).join('\u0000'),
  (idsStr) => {
    const ids = new Set(idsStr.split('\u0000').filter(Boolean))
    if ([...expandedIds.value].some((id) => !ids.has(id))) {
      expandedIds.value = new Set([...expandedIds.value].filter((id) => ids.has(id)))
    }
  }
)

/* 选中模块自动展开（点页面元素/控制台选中时，对应行展开 + 高亮） */
let suppressExpand = false
watch(activeId, (id) => {
  if (id && !suppressExpand) expand(id)
})

/* 初次挂载：若已有选中/持久化选中模块，展开对应行 */
onMounted(() => {
  const id = activeId.value ?? consoleSelectedModuleId.value
  if (id && modules.value.some((m) => m.id === id)) expand(id)
})

/* 收回态缩写：中文取首字，英文取前 2 个字母 */
function glyphOf(m) {
  const base = String(m.label?.[lang.value] ?? m.label?.zh ?? m.type ?? m.id)
  return lang.value === 'zh' ? base.slice(0, 1) : base.slice(0, 2)
}

/* ================= 模块池不设限（需求 1）：全部模块类型可添加 =================
   - 池 = 所有 MODULE_IDS（含已用的），标注已用次数、可重复添加副本
   - 添加走 createModuleInstance → 唯一实例 id（如 skills-2），独立编辑/排序/删除 */
const pool = computed(() =>
  MODULE_IDS.map((type) => ({
    type,
    count: modules.value.filter((m) => (m.type ?? m.id) === type).length
  }))
)
const poolSel = ref('')
watch(pool, (p) => {
  if (!p.some((x) => x.type === poolSel.value)) poolSel.value = p[0]?.type ?? ''
}, { immediate: true })
function poolName(type) {
  return MODULE_LABELS[type]?.[lang.value] ?? MODULE_LABELS[type]?.zh ?? type
}

/* ================= 双向联动：点左侧 → 页面高亮 + 配置区 ================= */
function pick(m) {
  selectInSelection(m.id)      // 高亮框 SelectionBox 定位
  selectInConsole(m.id)        // 配置区切到该模块（tab→editor）
  openConsole()                // 确保面板展开（编辑态）
  /* 滚动定位：编辑态滚动到该模块（deck 形态下模块已可见，无副作用） */
  const el = document.getElementById(m.id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** 点行身 / ▸：展开/收起整个模块条目 + 选中（页面高亮 + 配置区跟随）。
    注意：这里自己控制展开/收起，selection 联动由页面点选触发；若此时
    允许 activeId watch 自动展开，会把「收起」又顶回去（点开行去收起
    时 activeId 变化 → 重新展开）。所以短暂压制一次自动展开。 */
function onRowClick(m) {
  suppressExpand = true
  toggleFold(m.id)
  pick(m)
  requestAnimationFrame(() => { suppressExpand = false })
}

/* ================= 管理操作（全部带历史） ================= */
function toggleHist(m) {
  withHistory(() => toggleModule(version.value, m.id, !m.enabled))
}
function moveHist(m, dir) {
  const idx = modules.value.findIndex((x) => x.id === m.id)
  const to = idx + dir
  if (to < 0 || to >= modules.value.length) return
  withHistory(() => moveModule(version.value, idx, to))
}
function removeHist(m) {
  withHistory(() => removeModule(version.value, m.id))
  if (activeId.value === m.id) clearSelection()
  /* 展开集合清理已由 watch(modules) 兜底 */
}
/** 复制 = 克隆当前模块副本（保留源视觉配置），生成唯一实例 id 并选中+展开 */
function copyHist(m) {
  const cfg = createModuleInstance(version.value, m.type ?? m.id, {
    order: modules.value.length,
    lang: lang.value
  })
  const next = {
    ...cfg,
    animation: m.animation ?? cfg.animation,
    textAnim: m.textAnim ?? cfg.textAnim,
    fontScale: m.fontScale ?? cfg.fontScale,
    emphasize: m.emphasize ?? cfg.emphasize,
    variant: m.variant ?? cfg.variant
  }
  withHistory(() => { addModule(version.value, next) })
  selectInSelection(next.id)   /* 选中新实例（副本 id 唯一） */
  selectInConsole(next.id)
  expand(next.id)
}
function doAdd() {
  if (!poolSel.value) return
  /* 生成唯一实例（type 或 type-N 副本）→ 当前设备列表追加 */
  const cfg = createModuleInstance(version.value, poolSel.value, {
    order: modules.value.length,
    lang: lang.value
  })
  withHistory(() => { addModule(version.value, cfg) })
  selectInSelection(cfg.id)   /* 选中新实例（副本 id 唯一） */
  selectInConsole(cfg.id)
  expand(cfg.id)
}
function resetHist() {
  withHistory(() => resetTemplateModules())
}

const l = {
  title: { zh: '模块', en: 'Modules' },
  addTo: { zh: '添加', en: 'Add' },
  add: { zh: '添加', en: 'Add' },
  reset: { zh: '恢复默认', en: 'Reset' },
  none: { zh: '（无可用）', en: '(None)' },
  copy: { zh: '副本', en: 'Copy' },
  dupe: { zh: '复制模块', en: 'Duplicate module' },
  on: { zh: '启用', en: 'Enable' },
  off: { zh: '停用', en: 'Disable' },
  up: { zh: '上移', en: 'Up' },
  down: { zh: '下移', en: 'Down' },
  del: { zh: '删除', en: 'Delete' },
  /* 展开区配置摘要 */
  anim: { zh: '动画', en: 'Anim' },
  textAnim: { zh: '文字', en: 'Text' },
  scale: { zh: '字号', en: 'Scale' },
  emph: { zh: '强调', en: 'Emph' },
  variant: { zh: '变体', en: 'Variant' },
  sumOn: { zh: '开', en: 'On' },
  sumOff: { zh: '关', en: 'Off' }
}
</script>

<template>
  <div class="rail">
    <div class="rail__head">
      <span>{{ l.title[lang] }}</span>
    </div>

    <!-- ===== 模块树（手风琴：每模块一行，默认收起紧凑行，点开显示全名+配置+操作） ===== -->
    <div class="rail__list">
      <div
        v-for="(m, idx) in modules"
        :key="m.id"
        class="rail__item"
        :class="{
          'rail__item--open': isOpen(m.id),
          'rail__item--active': activeId === m.id,
          'rail__item--off': !m.enabled
        }"
        :data-module-id="m.id"
        @dragover="onRowDragOver($event, idx)"
        @drop.prevent="onDragEnd"
        @dragend="onDragEnd"
      >
        <!-- 紧凑行（始终显示）：抓手 + ▸/▾ + 开关 + 名称（收起=缩写，展开=全名） -->
        <div
          class="rail__row"
          role="button"
          tabindex="0"
          :aria-expanded="isOpen(m.id)"
          :aria-pressed="activeId === m.id"
          :title="labelOf(m)"
          @click="onRowClick(m)"
          @keydown.enter="onRowClick(m)"
          @keydown.space.prevent="onRowClick(m)"
        >
          <!-- 拖拽排序抓手 -->
          <span
            class="rail__grip"
            draggable="true"
            title="拖拽排序"
            aria-label="拖拽排序"
            @dragstart="onDragStart($event, idx)"
            @click.stop.prevent
          >⠿</span>

          <!-- ▸/▾：整体展开/收起指示 -->
          <span class="rail__caret" aria-hidden="true">{{ isOpen(m.id) ? '▾' : '▸' }}</span>

          <button
            type="button"
            class="rail__switch"
            :class="{ 'rail__switch--on': m.enabled }"
            :aria-pressed="m.enabled"
            :title="m.enabled ? l.off[lang] : l.on[lang]"
            @click.stop="toggleHist(m)"
          >
            <span class="rail__switch-knob" />
          </button>

          <!-- 收起态：缩写；展开态：完整模块名 -->
          <span class="rail__name" :class="{ 'rail__name--muted': !m.enabled }">
            {{ isOpen(m.id) ? labelOf(m) : glyphOf(m) }}
          </span>
        </div>

        <!-- 展开区：模块全名 + 配置摘要 + 操作（上移/下移/复制/删除） -->
        <Transition name="rail-body" :duration="140">
          <div v-if="isOpen(m.id)" class="rail__body">
            <div class="rail__body-title">
              <span class="rail__fullname">{{ labelOf(m) }}</span>
              <span class="rail__type">{{ m.type && m.type !== m.id ? `${m.type} · ${m.id}` : m.id }}</span>
            </div>

            <!-- 配置摘要（只读概览，详细配置在「模块配置」浮窗） -->
            <div class="rail__summary">
              <span class="rail__sum"><i>{{ l.anim[lang] }}</i><b>{{ m.animation }}</b></span>
              <span class="rail__sum"><i>{{ l.textAnim[lang] }}</i><b>{{ m.textAnim }}</b></span>
              <span class="rail__sum"><i>{{ l.scale[lang] }}</i><b>{{ Number(m.fontScale ?? 1).toFixed(2) }}×</b></span>
              <span class="rail__sum"><i>{{ l.emph[lang] }}</i><b>{{ m.emphasize ? l.sumOn[lang] : l.sumOff[lang] }}</b></span>
              <span class="rail__sum"><i>{{ l.variant[lang] }}</i><b>{{ String(m.variant ?? 'a').toUpperCase() }}</b></span>
            </div>

            <div class="rail__ops">
              <button
                type="button"
                class="rail__op"
                :disabled="idx === 0"
                :title="l.up[lang]"
                :aria-label="l.up[lang]"
                @click="moveHist(m, -1)"
              >↑</button>
              <button
                type="button"
                class="rail__op"
                :disabled="idx === modules.length - 1"
                :title="l.down[lang]"
                :aria-label="l.down[lang]"
                @click="moveHist(m, 1)"
              >↓</button>
              <button
                type="button"
                class="rail__op rail__op--copy"
                :title="l.dupe[lang]"
                :aria-label="l.dupe[lang]"
                @click="copyHist(m)"
              >⧉</button>
              <button
                type="button"
                class="rail__op rail__op--danger"
                :title="l.del[lang]"
                :aria-label="l.del[lang]"
                @click="removeHist(m)"
              >✕</button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- ===== 添加（模块池不设限，可重复加副本）+ 恢复默认 ===== -->
    <div class="rail__foot">
      <div class="rail__add">
        <select
          v-if="pool.length"
          class="rail__pool"
          :value="poolSel"
          :title="l.addTo[lang]"
          @change="poolSel = $event.target.value"
        >
          <option v-for="p in pool" :key="p.type" :value="p.type">
            {{ poolName(p.type) }}{{ p.count > 0 ? ` · ${l.copy[lang]}×${p.count}` : '' }}
          </option>
        </select>
        <span v-else class="rail__none">{{ l.none[lang] }}</span>
        <button
          type="button"
          class="rail__add-btn"
          :disabled="!poolSel"
          :title="l.addTo[lang]"
          @click="doAdd"
        >＋</button>
      </div>
      <button type="button" class="rail__reset" @click="resetHist">
        ⟲ {{ l.reset[lang] }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.rail {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  height: 100%;
  min-height: 0;
}
.rail__head {
  font-size: var(--fs-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--c-text-3, var(--text-muted));
  padding: 0 var(--space-1);
  flex-shrink: 0;
}

/* ---------- 模块树 ---------- */
.rail__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-right: 2px;
}
.rail__item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex-shrink: 0;
}
.rail__row {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
}
.rail__row:hover { background: var(--c-hover, var(--glass-bg-hover)); }
.rail__item--off { opacity: 0.5; }
.rail__item--active .rail__row {
  background: rgba(55, 217, 242, 0.14);
  border-color: rgba(55, 217, 242, 0.5);
  box-shadow: inset 0 0 0 1px rgba(55, 217, 242, 0.18);
}
/* 拖拽排序：被拖项高亮 */
.rail__item--dragging {
  opacity: 0.45;
  border: 1px dashed var(--c-accent, var(--accent-cyan));
  border-radius: var(--radius-sm);
}

/* 拖拽抓手 */
.rail__grip {
  flex-shrink: 0;
  width: 16px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 1;
  color: var(--c-text-3, var(--text-muted));
  cursor: grab;
  border-radius: 4px;
  transition: color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}
.rail__grip:hover { color: var(--c-accent, var(--accent-cyan)); background: var(--c-hover, var(--glass-bg-hover)); }
.rail__grip:active { cursor: grabbing; }

/* ▸/▾ 展开指示 */
.rail__caret {
  flex-shrink: 0;
  width: 14px;
  text-align: center;
  font-size: 10px;
  line-height: 1;
  color: var(--c-text-3, var(--text-muted));
  transition: color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);
}
.rail__item--open .rail__caret { color: var(--c-accent, var(--accent-cyan)); }

.rail__name {
  flex: 1;
  min-width: 0;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--c-text, var(--text-primary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rail__name--muted { font-weight: 500; }

/* ---------- 展开区（需求 1）：全名 + 配置摘要 + 操作 ---------- */
.rail__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 5px 6px 7px 12px;
  margin-left: 17px;
  border-left: 1px solid var(--c-border, var(--glass-border));
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
}
.rail__body-title { display: flex; flex-direction: column; gap: 1px; }
.rail__fullname {
  font-size: var(--fs-sm);
  font-weight: 700;
  line-height: 1.25;
  color: var(--c-text, var(--text-primary));
  overflow-wrap: anywhere;
}
.rail__item--active .rail__fullname { color: var(--c-accent, var(--accent-cyan)); }
.rail__type {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--c-text-3, var(--text-muted));
}
.rail__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 8px;
}
.rail__sum {
  display: inline-flex;
  gap: 4px;
  align-items: baseline;
  font-size: 10px;
  line-height: 1.3;
}
.rail__sum i { font-style: normal; color: var(--c-text-3, var(--text-muted)); }
.rail__sum b {
  font-weight: 600;
  color: var(--c-text-2, var(--text-secondary));
  font-family: var(--font-mono);
}

/* ---------- 行内操作（展开区内，常显） ---------- */
.rail__ops {
  display: flex;
  gap: 2px;
}
.rail__op {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 1;
  color: var(--c-text-2, var(--text-secondary));
  border-radius: 4px;
  transition: color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}
.rail__op:hover:not(:disabled) { color: var(--c-accent, var(--accent-cyan)); background: var(--c-hover, var(--glass-bg-hover)); }
.rail__op--copy:hover:not(:disabled) { color: var(--c-success, var(--success)); }
.rail__op--danger:hover:not(:disabled) { color: var(--c-danger, var(--danger)); }
.rail__op:disabled { opacity: 0.25; cursor: default; }

/* ---------- 开关 ---------- */
.rail__switch {
  position: relative;
  width: 30px;
  height: 16px;
  flex-shrink: 0;
  border-radius: var(--radius-pill);
  background: var(--c-track, var(--track-bg));
  border: 1px solid var(--c-border, var(--glass-border));
  transition: background var(--dur-fast) var(--ease-out);
}
.rail__switch-knob {
  position: absolute;
  top: 1px;
  left: 1px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--c-text-2, var(--text-secondary));
  transition: transform var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}
.rail__switch--on {
  background: var(--c-grad, var(--accent-gradient));
  border-color: transparent;
}
.rail__switch--on .rail__switch-knob {
  transform: translateX(14px);
  background: var(--c-on-accent, var(--on-accent));
}

/* ---------- 底部：添加 + 恢复 ---------- */
.rail__foot {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--c-border, var(--glass-border));
}
.rail__add {
  display: flex;
  gap: 4px;
  align-items: center;
}
.rail__pool {
  flex: 1;
  min-width: 0;
  padding: 3px 6px;
  font-size: var(--fs-xs);
  color: var(--c-text, var(--text-primary));
  background: var(--c-input, var(--glass-bg));
  border: 1px solid var(--c-border, var(--glass-border));
  border-radius: var(--radius-sm);
}
.rail__add-btn {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--c-on-accent, var(--on-accent));
  background: var(--c-grad, var(--accent-gradient));
  border: none;
  border-radius: var(--radius-sm);
}
.rail__add-btn:disabled { opacity: 0.4; cursor: default; }
.rail__none { font-size: var(--fs-xs); color: var(--c-text-3, var(--text-muted)); }
.rail__reset {
  align-self: flex-start;
  font-size: var(--fs-xs);
  color: var(--c-text-3, var(--text-muted));
  padding: 2px 8px;
  border: 1px dashed var(--c-border, var(--glass-border));
  border-radius: var(--radius-pill);
  transition: color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
}
.rail__reset:hover { color: var(--c-warning, var(--warning)); border-color: var(--c-warning, var(--warning)); }

/* ---------- 展开区过渡 ---------- */
.rail-body-enter-active,
.rail-body-leave-active {
  transition: opacity 0.14s var(--ease-out), transform 0.14s var(--ease-out);
}
.rail-body-enter-from,
.rail-body-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .rail-body-enter-active,
  .rail-body-leave-active {
    transition: none;
  }
  .rail-body-enter-from,
  .rail-body-leave-to {
    opacity: 1;
    transform: none;
  }
}
</style>
