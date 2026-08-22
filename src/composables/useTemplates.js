/* ============================================================
   useTemplates.js — 模板层运行时 store（生成器内核）
   ------------------------------------------------------------
   作用：让「模块编排」可以被控制台运行时编辑（增/删/排序/开关/
   改模块配置），页面实时变，并持久化到 localStorage。
   - 单例 reactive 状态：每个模板的 modules 数组的响应式副本，
     初始值深拷贝自 site.config 的 VERSIONS（=TEMPLATES）。
   - 默认等于静态配置 → 不改时页面行为与原来完全一致。
   - App.vue 读 enabledModules(templateId)（过滤+排序），
     console 写 addModule/removeModule/moveModule/... → 页面实时联动。

   API：
     useTemplates() → {
       templates,                      // ref<object>：{ templateId: { modules: [...] } }
       getTemplateModules(id),         // 某模板全量模块（响应式数组）
       enabledModules(id),             // 过滤 enabled + 按 order 排序
       setTemplateModules(id, modules) // 整体替换（console 拖拽排序可用）
       addModule(id, cfg),             // 追加一个模块配置
       removeModule(id, moduleId),     // 删除模块
       moveModule(id, fromIdx, toIdx), // 移动（重排序）
       toggleModule(id, moduleId, enabled), // 开关
       updateModule(id, moduleId, patch),   // 改模块配置（动画/字号/强调…）
       resetTemplateModules(),         // 还原默认编排并清持久化
     }
   ============================================================ */

import { ref } from 'vue'
import { VERSIONS, DEFAULT_TEMPLATE } from '@/config/site.config'

export const STORAGE_KEY = 'resume-site.templates'

const store = typeof localStorage !== 'undefined' ? localStorage : null

/* ---------- 工具 ---------- */
function cloneDeep(v) {
  if (Array.isArray(v)) return v.map(cloneDeep)
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, cloneDeep(val)]))
  }
  return v
}

function cloneTemplateModules() {
  const out = {}
  for (const [id, tpl] of Object.entries(VERSIONS)) {
    out[id] = { modules: cloneDeep(tpl.modules || []) }
  }
  return out
}

/* ---------- 初始化：静态默认 + localStorage 覆盖 ---------- */
function loadInitial() {
  const base = cloneTemplateModules()
  const saved = store?.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      for (const [id, val] of Object.entries(parsed)) {
        if (base[id] && Array.isArray(val?.modules)) base[id].modules = val.modules
      }
    } catch (e) {
      console.warn('[useTemplates] 模板持久化数据损坏，已回退默认：', e)
    }
  }
  return base
}

/** 全局模板状态：{ templateId: { modules: [...] } }（ref → 深层响应式） */
export const templates = ref(loadInitial())

function persist() {
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify(templates.value))
  } catch (e) {
    console.warn('[useTemplates] 持久化失败：', e)
  }
}

function ensureTemplate(id) {
  if (!templates.value[id]) templates.value[id] = { modules: [] }
  if (!Array.isArray(templates.value[id].modules)) templates.value[id].modules = []
}

/* ---------- 读 ---------- */
export function getTemplateModules(templateId = DEFAULT_TEMPLATE) {
  ensureTemplate(templateId)
  return templates.value[templateId].modules
}

/** 过滤 enabled + 按 order 排序（App 渲染用） */
export function enabledModules(templateId = DEFAULT_TEMPLATE) {
  return getTemplateModules(templateId)
    .filter((m) => m.enabled)
    .sort((a, b) => a.order - b.order)
}

/* ---------- 写 ---------- */
/** 整体替换某模板的模块列表（console 拖拽排序/批量恢复用） */
export function setTemplateModules(templateId, modules) {
  ensureTemplate(templateId)
  templates.value[templateId].modules = cloneDeep(modules || [])
  persist()
}

/** 追加一个模块配置（cfg 至少含 id/enabled/order/animation 等字段） */
export function addModule(templateId, cfg) {
  const list = getTemplateModules(templateId)
  const next = cloneDeep(cfg)
  if (next.order == null) {
    next.order = list.length ? Math.max(...list.map((m) => m.order ?? 0)) + 1 : 0
  }
  list.push(next)
  persist()
  return next
}

/** 删除模块 */
export function removeModule(templateId, moduleId) {
  const list = getTemplateModules(templateId)
  const idx = list.findIndex((m) => m.id === moduleId)
  if (idx >= 0) {
    list.splice(idx, 1)
    persist()
  }
}

/** 移动模块：把 fromIdx 移到 toIdx（拖拽排序用） */
export function moveModule(templateId, fromIdx, toIdx) {
  const list = getTemplateModules(templateId)
  if (fromIdx < 0 || fromIdx >= list.length) return
  const [item] = list.splice(fromIdx, 1)
  const target = Math.max(0, Math.min(toIdx, list.length))
  list.splice(target, 0, item)
  // 同步 order 字段，保持与排序一致
  list.forEach((m, i) => { m.order = i })
  persist()
}

/** 开关模块（enabled） */
export function toggleModule(templateId, moduleId, enabled) {
  const list = getTemplateModules(templateId)
  const m = list.find((x) => x.id === moduleId)
  if (m) {
    m.enabled = !!enabled
    persist()
  }
}

/** 改模块配置（animation / textAnim / fontScale / emphasize / variant / label…） */
export function updateModule(templateId, moduleId, patch) {
  const list = getTemplateModules(templateId)
  const m = list.find((x) => x.id === moduleId)
  if (m) {
    Object.assign(m, cloneDeep(patch))
    persist()
  }
}

/** 还原默认编排并清空持久化 */
export function resetTemplateModules() {
  templates.value = cloneTemplateModules()
  store?.removeItem(STORAGE_KEY)
}

/* ---------- 状态整体替换（撤销/重做历史用；传入 null 即回默认） ---------- */
export function replaceTemplatesState(next) {
  templates.value = cloneDeep(next ?? cloneTemplateModules())
  persist()
}

/* ---------- composable ---------- */
export function useTemplates() {
  return {
    templates,
    getTemplateModules,
    enabledModules,
    setTemplateModules,
    addModule,
    removeModule,
    moveModule,
    toggleModule,
    updateModule,
    resetTemplateModules,
    STORAGE_KEY
  }
}

export default useTemplates
