<script setup>
/**
 * ModuleManagerTab — 控制台「模块」页：增删 / 排序 / 开关模块
 * ------------------------------------------------------------
 * 读写 useTemplates() 运行时 store（当前模板）：
 *   - 列表：全部模块（含停用），显示顺序即渲染顺序
 *   - 开关：toggleModule(tpl, id, enabled)
 *   - 排序：moveModule(tpl, fromIdx, toIdx)（上移/下移）
 *   - 编辑：跳到「模块编辑」页 selectModule(id)
 *   - 删除：removeModule(tpl, id)（从模板移除，内容保留可再加回）
 *   - 添加：从可用模块池（MODULE_IDS 中当前未用的）addModule
 *   - 恢复默认：resetTemplateModules()
 * 主区按 enabledModules 实时重排。
 */
import { ref, computed, watch } from 'vue'
import { useTemplates } from '@/composables/useTemplates'
import { useVersion } from '@/composables/useVersion'
import { useI18n } from '@/i18n'
import { MODULE_IDS, MODULE_LABELS } from '@/config/site.config'
import { useConsole } from '@/composables/useConsole'

const { version } = useVersion()
const { lang } = useI18n()
const { getTemplateModules, addModule, removeModule, moveModule, toggleModule, resetTemplateModules } = useTemplates()
const { selectModule, openConsole } = useConsole()

/* ---------- 拖拽排序（HTML5 DnD，从抓手处拖起；松手 moveModule 持久化 → 页面实时重排） ---------- */
const dragIdx = ref(null)
let dragEl = null

function onDragStart(e, idx) {
  /* 只允许从抓手拖起，避免误碰按钮触发拖拽 */
  const grip = e.target.closest('.mm-tab__grip')
  if (!grip) { e.preventDefault(); return }
  dragIdx.value = idx
  dragEl = grip.closest('.mm-tab__row')
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', String(idx))
  requestAnimationFrame(() => dragEl?.classList.add('mm-tab__row--dragging'))
}

function onRowDragOver(e, idx) {
  e.preventDefault()
  if (dragIdx.value == null) return
  const rect = e.currentTarget.getBoundingClientRect()
  const before = e.clientY < rect.top + rect.height / 2
  const from = dragIdx.value
  let to = before ? idx : idx + 1          // 目标插入位（当前列表下标）
  if (to === from || to === from + 1) return
  const insertAt = to > from ? to - 1 : to // 扣除被拖走项后的目标下标
  if (insertAt === from) return
  moveModule(version.value, from, insertAt) // 持久化 + 页面实时跟随
  dragIdx.value = insertAt
}

function onDragEnd() {
  dragIdx.value = null
  if (dragEl) { dragEl.classList.remove('mm-tab__row--dragging'); dragEl = null }
}

/* ---------- 当前模板全部模块（含停用，按 list 顺序） ---------- */
const allModules = computed(() => getTemplateModules(version.value))

/* ---------- 可用模块池（未在当前模板中的 id） ---------- */
const pool = computed(() =>
  MODULE_IDS.filter((id) => !allModules.value.some((m) => m.id === id))
)

const poolSel = ref('')
watch(pool, (p) => {
  if (!p.includes(poolSel.value)) poolSel.value = p[0] ?? ''
}, { immediate: true })

function labelOf(m) {
  return m.label?.[lang.value] ?? m.label?.zh ?? m.id
}
function poolName(id) {
  return MODULE_LABELS[id]?.[lang.value] ?? MODULE_LABELS[id]?.zh ?? id
}

/* ---------- 操作 ---------- */
function toggle(m) {
  toggleModule(version.value, m.id, !m.enabled)
}
function moveUp(idx) {
  if (idx > 0) moveModule(version.value, idx, idx - 1)
}
function moveDown(idx) {
  if (idx < allModules.value.length - 1) moveModule(version.value, idx, idx + 1)
}
function remove(m) {
  removeModule(version.value, m.id)
}
function doAdd() {
  if (!poolSel.value) return
  const idx = allModules.value.length
  addModule(version.value, {
    id: poolSel.value,
    enabled: true,
    order: idx,
    label: MODULE_LABELS[poolSel.value] ?? { zh: poolSel.value, en: poolSel.value },
    animation: 'fade-up',
    textAnim: 'typewriter',
    fontScale: 1,
    emphasize: false,
    variant: 'a'
  })
}
function edit(m) {
  selectModule(m.id)
  openConsole()
}

const l = {
  title: { zh: '模块管理', en: 'Modules' },
  hint: { zh: '增删 / 排序 / 临时停用，主区即时重排', en: 'Add, reorder, toggle — preview updates live' },
  addTo: { zh: '从模块池添加', en: 'Add from pool' },
  add: { zh: '添加', en: 'Add' },
  edit: { zh: '编辑', en: 'Edit' },
  delete: { zh: '删除', en: 'Delete' },
  reset: { zh: '恢复默认编排', en: 'Reset layout' },
  none: { zh: '（无可用模块）', en: '(No modules available)' }
}
</script>

<template>
  <div class="mm-tab">
    <p class="mm-tab__hint">{{ l.hint[lang] }}</p>

    <!-- ===== 模块列表 ===== -->
    <div class="mm-tab__list">
      <div
        v-for="(m, idx) in allModules"
        :key="m.id"
        class="mm-tab__row glass"
        :class="{ 'mm-tab__row--off': !m.enabled }"
        @dragover="onRowDragOver($event, idx)"
        @drop.prevent="onDragEnd"
        @dragend="onDragEnd"
      >
        <!-- 拖拽排序抓手 -->
        <span
          class="mm-tab__grip"
          draggable="true"
          title="拖拽排序"
          aria-label="拖拽排序"
          @dragstart="onDragStart($event, idx)"
        >⠿</span>

        <button
          type="button"
          class="mm-tab__switch"
          :class="{ 'mm-tab__switch--on': m.enabled }"
          :aria-pressed="m.enabled"
          :title="m.enabled ? '停用' : '启用'"
          @click="toggle(m)"
        >
          <span class="mm-tab__switch-knob" />
        </button>

        <span class="mm-tab__name" :title="labelOf(m)">{{ labelOf(m) }}</span>
        <span class="mm-tab__id">{{ m.id }}</span>

        <div class="mm-tab__ops">
          <button type="button" class="mm-tab__icon" :disabled="idx === 0" title="上移" @click="moveUp(idx)">↑</button>
          <button type="button" class="mm-tab__icon" :disabled="idx === allModules.length - 1" title="下移" @click="moveDown(idx)">↓</button>
          <button type="button" class="mm-tab__icon" title="编辑内容" @click="edit(m)">✎</button>
          <button type="button" class="mm-tab__icon mm-tab__icon--danger" title="从模板删除" @click="remove(m)">✕</button>
        </div>
      </div>
    </div>

    <!-- ===== 添加模块 ===== -->
    <div class="mm-tab__add glass">
      <span class="mm-tab__add-label">{{ l.addTo[lang] }}</span>
      <div class="mm-tab__add-row">
        <select
          v-if="pool.length"
          class="glass-input mm-tab__pool"
          :value="poolSel"
          @change="poolSel = $event.target.value"
        >
          <option v-for="id in pool" :key="id" :value="id">{{ poolName(id) }}</option>
        </select>
        <span v-else class="mm-tab__none">{{ l.none[lang] }}</span>
        <button
          type="button"
          class="glass-btn glass-btn--accent mm-tab__add-btn"
          :disabled="!poolSel"
          @click="doAdd"
        >{{ l.add[lang] }}</button>
      </div>
    </div>

    <!-- ===== 恢复默认 ===== -->
    <button type="button" class="mm-tab__reset" @click="resetTemplateModules()">
      ⟲ {{ l.reset[lang] }}
    </button>
  </div>
</template>

<style scoped>
.mm-tab { display: flex; flex-direction: column; gap: var(--space-3); }
.mm-tab__hint {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  text-align: center;
}
.mm-tab__list { display: flex; flex-direction: column; gap: var(--space-2); }

.mm-tab__row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: opacity var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
}
.mm-tab__row--off { opacity: 0.45; }
/* 拖拽排序：被拖行高亮 + hover 行留出插槽感 */
.mm-tab__row--dragging {
  opacity: 0.5;
  border: 1px dashed var(--accent-cyan);
}
.mm-tab__row[dragover='true'] { border-color: var(--accent-cyan); }

/* 拖拽抓手 */
.mm-tab__grip {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-sm);
  color: var(--text-muted);
  cursor: grab;
  border-radius: var(--radius-sm);
  transition: color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}
.mm-tab__grip:hover { color: var(--accent-cyan); background: var(--glass-bg-hover); }
.mm-tab__grip:active { cursor: grabbing; }
.mm-tab__name {
  flex: 1;
  min-width: 0;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mm-tab__id {
  font-size: var(--fs-xs);
  font-family: var(--font-mono);
  color: var(--text-muted);
  flex-shrink: 0;
}
.mm-tab__ops { display: flex; gap: 2px; flex-shrink: 0; }

.mm-tab__icon {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}
.mm-tab__icon:hover:not(:disabled) { color: var(--accent-cyan); background: var(--glass-bg-hover); }
.mm-tab__icon:disabled { opacity: 0.3; cursor: default; }
.mm-tab__icon--danger:hover:not(:disabled) { color: var(--danger); }

/* ---------- 开关 ---------- */
.mm-tab__switch {
  position: relative;
  width: 36px;
  height: 20px;
  flex-shrink: 0;
  border-radius: var(--radius-pill);
  background: var(--track-bg);
  border: 1px solid var(--glass-border);
  transition: background var(--dur-fast) var(--ease-out);
}
.mm-tab__switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--text-secondary);
  transition: transform var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}
.mm-tab__switch--on { background: var(--accent-gradient); border-color: transparent; }
.mm-tab__switch--on .mm-tab__switch-knob {
  transform: translateX(16px);
  background: var(--on-accent);
}

/* ---------- 添加区 ---------- */
.mm-tab__add {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.mm-tab__add-label {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  letter-spacing: 0.04em;
}
.mm-tab__add-row { display: flex; gap: var(--space-2); }
.mm-tab__pool {
  flex: 1;
  min-width: 0;
  padding: var(--space-1) var(--space-3);
  font-size: var(--fs-sm);
  border-radius: var(--radius-sm);
}
.mm-tab__add-btn { padding: var(--space-1) var(--space-4); font-size: var(--fs-sm); white-space: nowrap; }
.mm-tab__add-btn:disabled { opacity: 0.4; cursor: default; }
.mm-tab__none { font-size: var(--fs-xs); color: var(--text-muted); }

/* ---------- 恢复默认 ---------- */
.mm-tab__reset {
  align-self: center;
  font-size: var(--fs-xs);
  color: var(--text-muted);
  padding: var(--space-1) var(--space-3);
  border: 1px dashed var(--glass-border);
  border-radius: var(--radius-pill);
  transition: color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
}
.mm-tab__reset:hover { color: var(--warning); border-color: var(--warning); }
</style>
