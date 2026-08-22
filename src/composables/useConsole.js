/* ============================================================
   composables/useConsole.js — 嵌入式可收起控制台（编辑面板）状态
   ------------------------------------------------------------
   作用：管理「网页版 PPT」编辑面板的 UI 状态：
     - open              : 面板展开 / 收起（默认收起，成品正常展示）
     - activeTab         : 当前标签页（modules/editor/theme/mode/global）
     - selectedModuleId  : 「模块编辑」页当前选中的模块 id
     - isMobile          : 窄屏（< 768px）面板全屏覆盖的响应式判断
     - panelWidth        : 面板宽（320–720，resize handle 拖拽拉宽）
   持久化：activeTab / selectedModuleId / panelWidth 写入 localStorage
   （key: resume-site.console / resume-site.console-w）；open 不持久化（收起即成品态）。
   数据不在此处：面板内容读写走各自全局 store（useTemplates /
   useContent / useTheme / useMode / useI18n），本 composable 只管 UI。
   ============================================================ */

import { ref, computed, watch } from 'vue'

export const STORAGE_KEY = 'resume-site.console'

/* ---------- 面板宽度（右侧抽屉可拖拽拉宽，320–720px，持久化） ---------- */
export const PANEL_W_MIN = 320
export const PANEL_W_MAX = 720
export const PANEL_W_DEFAULT = 460
export const PANEL_W_STORAGE_KEY = 'resume-site.console-w'

/** 标签页定义（id → 双语名，面板 TabBar 渲染用）。
    注：模块树已作为左侧常驻列（ModuleRail），不再单独占「模块」tab。 */
export const CONSOLE_TABS = [
  { id: 'editor',  label: { zh: '编辑', en: 'Content' } },
  { id: 'theme',   label: { zh: '主题', en: 'Theme' } },
  { id: 'mode',    label: { zh: '形态', en: 'Mode' } },
  { id: 'global',  label: { zh: '全局', en: 'Global' } }
]

/** 默认标签页 */
export const DEFAULT_TAB = 'editor'

const store = typeof localStorage !== 'undefined' ? localStorage : null

/* ---------- 初始化（只恢复 activeTab / selectedModuleId） ---------- */
function loadInitial() {
  const state = { tab: DEFAULT_TAB, selected: null }
  const saved = store?.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (CONSOLE_TABS.some((t) => t.id === parsed.tab)) state.tab = parsed.tab
      if (typeof parsed.selected === 'string') state.selected = parsed.selected
    } catch (e) {
      console.warn('[useConsole] 控制台状态持久化数据损坏，已回退默认：', e)
    }
  }
  return state
}

const initial = loadInitial()

/** 面板展开状态（默认收起，不持久化） */
export const consoleOpen = ref(false)

/** 当前标签页 id（持久化） */
export const consoleTab = ref(initial.tab)

/** 「模块编辑」页选中的模块 id（持久化） */
export const consoleSelectedModuleId = ref(initial.selected)

function persist() {
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify({
      tab: consoleTab.value,
      selected: consoleSelectedModuleId.value
    }))
  } catch (e) {
    console.warn('[useConsole] 控制台状态持久化失败：', e)
  }
}
watch([consoleTab, consoleSelectedModuleId], persist)

/* ---------- 窄屏判断（面板全屏覆盖的阈值，与 tokens --bp-md 对齐） ---------- */
const isMobile = ref(
  typeof window !== 'undefined' ? window.innerWidth < 768 : false
)
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })
}

/* ================= 面板宽度：拖拽拉宽（resize handle）+ 持久化 =================
   - consolePanelWidth：响应式宽度（320–720，默认 460）
   - setConsolePanelWidth(w)：夹取到合法区间 → 持久化 → 同步 --console-panel-w
   - 主界面让位（App scale / deck right）都读 --console-panel-w 或本 ref，宽度变化即跟随 */
function loadPanelWidth() {
  const saved = store?.getItem(PANEL_W_STORAGE_KEY)
  const n = Number(saved)
  if (Number.isFinite(n) && n >= PANEL_W_MIN && n <= PANEL_W_MAX) return Math.round(n)
  return PANEL_W_DEFAULT
}

/** 右侧编辑面板宽度（响应式） */
export const consolePanelWidth = ref(loadPanelWidth())

/** 把面板宽同步到 :root 的 --console-panel-w（让位/缩放唯一宽度来源） */
function syncPanelWidthVar() {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.style.setProperty('--console-panel-w', `${consolePanelWidth.value}px`)
  }
}
/* 模块加载即同步（持久化宽度一进来就覆盖 tokens 默认，刷新后一致） */
syncPanelWidthVar()

export function setConsolePanelWidth(w) {
  const clamped = Math.min(PANEL_W_MAX, Math.max(PANEL_W_MIN, Math.round(w)))
  consolePanelWidth.value = clamped
  store?.setItem(PANEL_W_STORAGE_KEY, String(clamped))
  syncPanelWidthVar()
}

/* ---------- 面板开合 ---------- */
export function openConsole() { consoleOpen.value = true }
export function closeConsole() { consoleOpen.value = false }
export function toggleConsole() { consoleOpen.value = !consoleOpen.value }

/* ---------- 标签页 ---------- */
export function setConsoleTab(tab) {
  if (CONSOLE_TABS.some((t) => t.id === tab)) consoleTab.value = tab
}

/* ---------- 选择模块（跳到「模块编辑」页） ---------- */
export function selectModule(id) {
  consoleSelectedModuleId.value = id
  consoleTab.value = 'editor'
}

/* ---------- composable ---------- */
export function useConsole() {
  return {
    tabs: CONSOLE_TABS,
    open: consoleOpen,              // ref<boolean>：面板展开
    activeTab: consoleTab,          // ref<string>：当前标签页
    selectedModuleId: consoleSelectedModuleId, // ref<string|null>
    isMobile: computed(() => isMobile.value),
    openConsole,
    closeConsole,
    toggleConsole,
    setTab: setConsoleTab,
    setActiveTab: setConsoleTab,
    selectModule,
    panelWidth: consolePanelWidth,  // ref<number>：面板宽（320–720，可拖拽）
    setPanelWidth: setConsolePanelWidth,
    PANEL_W_MIN,
    PANEL_W_MAX,
    STORAGE_KEY
  }
}

export default useConsole
