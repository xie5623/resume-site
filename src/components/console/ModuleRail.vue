<script setup>
/**
 * ModuleRail — 左侧常驻模块树（需求 2/3 的左侧联动面板）
 * ------------------------------------------------------------
 * 固定在控制台最左列，常驻显示当前模板的全部模块：
 *   - 行 = 开关 + 模块名 + （hover）上移/下移/删除
 *   - 点模块名 → useSelection.selectModule(id)（页面高亮框 + 滚动定位）
 *             + useConsole.selectModule(id)（右侧配置区显示该模块）
 *   - 选中行高亮（读 useSelection().selection，页面点选也联动到这里）
 *   - 底部：从模块池添加 / 恢复默认编排（带历史，可撤销）
 * 所有写操作包进 useHistory().withHistory → 撤销/重做一步到位。
 */
import { ref, computed, watch } from 'vue'
import { useTemplates } from '@/composables/useTemplates'
import { useVersion } from '@/composables/useVersion'
import { useI18n } from '@/i18n'
import { useSelection } from '@/composables/useSelection'
import { useConsole } from '@/composables/useConsole'
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
  dragEl = grip.closest('.rail__row')
  preSnapshot = capture()              // 拖前快照 → 松手 push，整段拖拽一个撤销单元
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', String(idx))
  requestAnimationFrame(() => dragEl?.classList.add('rail__row--dragging'))
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
  if (dragEl) { dragEl.classList.remove('rail__row--dragging'); dragEl = null }
}

/* ---------- 当前模板全部模块（含停用，按 list 顺序） ---------- */
const modules = computed(() => getTemplateModules(version.value))

/* ---------- 当前选中模块 id（页面点选 / 左侧点选都联动到这里） ---------- */
const activeId = computed(() => selection.value?.moduleId ?? null)

function labelOf(m) {
  return m.label?.[lang.value] ?? m.label?.zh ?? m.id
}

/* ================= 模块树展开/收回（需求 1）：默认收回只显示缩写，可展开显示全名 =================
   默认收回态（行窄，只显示图标/缩写），点「▸/▾」展开；状态持久化
   localStorage 'resume-site.rail-expand'。 */
const railExpand = ref(
  (typeof localStorage !== 'undefined' ? localStorage.getItem('resume-site.rail-expand') : null) === '1'
)
watch(railExpand, (v) => {
  try {
    typeof localStorage !== 'undefined' && localStorage.setItem('resume-site.rail-expand', v ? '1' : '0')
  } catch (e) { /* ignore */ }
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
  expand: { zh: '展开模块名', en: 'Expand names' },
  collapse: { zh: '收回模块名', en: 'Collapse names' },
  copy: { zh: '副本', en: 'Copy' },
  on: { zh: '启用', en: 'Enable' },
  off: { zh: '停用', en: 'Disable' },
  up: { zh: '上移', en: 'Up' },
  down: { zh: '下移', en: 'Down' },
  del: { zh: '删除', en: 'Delete' }
}
</script>

<template>
  <div class="rail" :class="{ 'rail--collapsed': !railExpand }">
    <div class="rail__head">
      <span>{{ l.title[lang] }}</span>
      <button
        type="button"
        class="rail__expand"
        :title="railExpand ? l.collapse[lang] : l.expand[lang]"
        :aria-label="railExpand ? l.collapse[lang] : l.expand[lang]"
        :aria-expanded="railExpand"
        @click="railExpand = !railExpand"
      >{{ railExpand ? '▾' : '▸' }}</button>
    </div>

    <!-- ===== 模块树 ===== -->
    <div class="rail__list">
      <div
        v-for="(m, idx) in modules"
        :key="m.id"
        class="rail__row"
        :class="{
          'rail__row--active': activeId === m.id,
          'rail__row--off': !m.enabled,
          'rail__row--collapsed': !railExpand
        }"
        :data-module-id="m.id"
        role="button"
        tabindex="0"
        :aria-pressed="activeId === m.id"
        :title="labelOf(m)"
        @click="pick(m)"
        @keydown.enter="pick(m)"
        @keydown.space.prevent="pick(m)"
        @dragover="onRowDragOver($event, idx)"
        @drop.prevent="onDragEnd"
        @dragend="onDragEnd"
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

        <!-- 展开态：完整模块名；收回态：缩写 -->
        <span class="rail__name" :class="{ 'rail__name--muted': !m.enabled }">
          {{ railExpand ? labelOf(m) : glyphOf(m) }}
        </span>

        <span class="rail__ops">
          <button
            type="button"
            class="rail__op"
            :disabled="idx === 0"
            :title="l.up[lang]"
            @click.stop="moveHist(m, -1)"
          >↑</button>
          <button
            type="button"
            class="rail__op"
            :disabled="idx === modules.length - 1"
            :title="l.down[lang]"
            @click.stop="moveHist(m, 1)"
          >↓</button>
          <button
            type="button"
            class="rail__op rail__op--danger"
            :title="l.del[lang]"
            @click.stop="removeHist(m)"
          >✕</button>
        </span>
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
/* 展开/收回按钮 */
.rail__expand {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-xs);
  line-height: 1;
  color: var(--c-text-3, var(--text-muted));
  border-radius: var(--radius-sm);
  transition: color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}
.rail__expand:hover {
  color: var(--c-accent, var(--accent-cyan));
  background: var(--c-hover, var(--glass-bg-hover));
}

/* ---------- 收回态（需求 1）：行窄，只显示缩写，隐藏操作按钮 ---------- */
.rail--collapsed .rail__row {
  gap: 2px;
  padding: 4px 4px;
}
.rail--collapsed .rail__name {
  flex: 1;
  text-align: center;
  font-size: var(--fs-sm);
}
.rail--collapsed .rail__ops { display: none; }

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
.rail__row {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: 4px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
  flex-shrink: 0;
}
.rail__row:hover { background: var(--c-hover, var(--glass-bg-hover)); }
.rail__row--off { opacity: 0.5; }
.rail__row--active {
  background: rgba(55, 217, 242, 0.14);
  border-color: rgba(55, 217, 242, 0.5);
  box-shadow: inset 0 0 0 1px rgba(55, 217, 242, 0.18);
}
/* 拖拽排序：被拖行高亮 */
.rail__row--dragging {
  opacity: 0.45;
  border-color: var(--c-accent, var(--accent-cyan));
  border-style: dashed;
}

/* 拖拽抓手 */
.rail__grip {
  flex-shrink: 0;
  width: 18px;
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

/* ---------- 行内操作（hover 显示） ---------- */
.rail__ops {
  display: flex;
  gap: 1px;
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out);
  flex-shrink: 0;
}
.rail__row:hover .rail__ops,
.rail__row--active .rail__ops { opacity: 1; }
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
</style>
