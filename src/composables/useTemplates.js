/* ============================================================
   useTemplates.js — 模板层运行时 store（生成器内核）+ DEVICE 维度
   ------------------------------------------------------------
   作用：让「模块编排」可以被控制台运行时编辑（增/删/排序/开关/
   改模块配置），页面实时变，并持久化到 localStorage。

   DEVICE 维度（第四层）：每个模板的编排拆成 desktop / mobile 两套
   （模块/顺序/动画/字号完全独立）：
     templates.value = {
       senior:   { desktop: [...], mobile: [...] },
       graduate: { desktop: [...], mobile: [...] }
     }
   - 旧数据兼容：无 device 字段的模板（{ modules: [...] }）视为
     desktop 编排，mobile 用 desktop 兜底（渐进增强，不破坏现有持久化）。
   - 所有读写 API 的 device 参数都是可选的，缺省用「当前生效设备」
     （useDevice().device，编辑器模拟视口切了就用哪套）。
   - App.vue 读 enabledModules(versionId, device)（过滤+排序），
     console 写 addModule/removeModule/moveModule/... → 页面实时联动。

   API：
     useTemplates() → {
       templates,                      // ref<object>：{ templateId: { desktop: [...], mobile: [...] } }
       getTemplateModules(id, device?),// 某模板某设备全量模块（响应式数组）
       getTemplateDeviceModules(id, device), // 同上（显式设备）
       enabledModules(id, device?),    // 过滤 enabled + 按 order 排序
       setTemplateModules(id, modules, device?), // 整体替换某设备模块
       addModule(id, cfg, device?),    // 追加一个模块配置
       removeModule(id, moduleId, device?), // 删除模块
       moveModule(id, fromIdx, toIdx, device?), // 移动（重排序）
       toggleModule(id, moduleId, enabled, device?), // 开关
       updateModule(id, moduleId, patch, device?), // 改模块配置（动画/字号/强调…）
       updateForDevice(versionId, device, fn), // 在指定设备上下文中执行修改事务
       resetTemplateModules(),         // 还原默认编排（含双端）并清持久化
       getDeviceModules(id),           // { desktop:[...], mobile:[...] }（console 展示双端差异）
     }
   ============================================================ */

import { ref } from 'vue'
import { VERSIONS, DEFAULT_TEMPLATE, MODULE_LABELS } from '@/config/site.config'
import { effectiveDevice as activeDevice } from '@/composables/useDevice'

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

/** 静态默认：每模板 desktop/mobile 两套编排（mobile 缺省时跟随 desktop） */
function cloneTemplateModules() {
  const out = {}
  for (const [id, tpl] of Object.entries(VERSIONS)) {
    const desktop = cloneDeep(tpl.modules || [])
    out[id] = {
      desktop,
      mobile: cloneDeep(Array.isArray(tpl.mobile) ? tpl.mobile : desktop)
    }
  }
  return out
}

/**
 * 规范化一条模板记录：
 *  - 新形状 { desktop:[...], mobile:[...] } → 原样
 *  - 旧形状 { modules:[...] } → desktop = modules（用户已保存的桌面编辑），
 *    mobile = 该模板「设计好的手机编排」（VERSIONS[id].mobile），
 *    而不是跟随 desktop——让老用户升级后也能直接拿到手机版专属编排。
 *  - 缺 desktop → []
 *  - 缺 mobile → 跟随 desktop（保底）
 */
function normalizeEntry(entry, templateId) {
  const e = entry && typeof entry === 'object' ? entry : {}
  let desktop
  let mobile
  if (Array.isArray(e.desktop)) desktop = e.desktop
  else if (Array.isArray(e.modules)) desktop = e.modules
  else desktop = []
  if (Array.isArray(e.mobile)) mobile = e.mobile
  else if (Array.isArray(e.modules)) {
    /* 旧数据：mobile 用该模板的手机版专属编排（设计值），不再跟随 desktop */
    mobile = cloneDeep(VERSIONS[templateId]?.mobile || e.modules)
  }
  else mobile = cloneDeep(desktop)
  return { desktop, mobile }
}

/* ---------- 初始化：静态默认 + localStorage 覆盖 ---------- */
function loadInitial() {
  const base = cloneTemplateModules()
  const saved = store?.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      for (const [id, val] of Object.entries(parsed)) {
        if (!base[id]) continue
        base[id] = normalizeEntry(val, id)
      }
    } catch (e) {
      console.warn('[useTemplates] 模板持久化数据损坏，已回退默认：', e)
    }
  }
  return base
}

/** 全局模板状态：{ templateId: { desktop:[...], mobile:[...] } }（ref → 深层响应式） */
export const templates = ref(loadInitial())

function persist() {
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify(templates.value))
  } catch (e) {
    console.warn('[useTemplates] 持久化失败：', e)
  }
}

/** 确保模板条目为 { desktop:[...], mobile:[...] } 结构（旧数据就地补 branch） */
function ensureTemplate(id) {
  const cur = templates.value[id]
  if (!cur || typeof cur !== 'object') {
    templates.value[id] = { desktop: [], mobile: [] }
    return
  }
  if (Array.isArray(cur.desktop) && Array.isArray(cur.mobile)) return
  templates.value[id] = normalizeEntry(cur, id)
}

/** 解析 device：显式传入合法值用之，否则用当前生效设备
    （effectiveDevice：手动模拟优先，否则按真实视口 <768 手机） */
function resolveDevice(device) {
  if (device === 'mobile' || device === 'desktop') return device
  return activeDevice.value === 'mobile' ? 'mobile' : 'desktop'
}

/* ---------- 读 ---------- */
/** 某模板某设备的完整模块数组（响应式） */
export function getTemplateDeviceModules(templateId, device) {
  const id = templateId || DEFAULT_TEMPLATE
  ensureTemplate(id)
  return templates.value[id][resolveDevice(device)] || []
}

export function getTemplateModules(templateId = DEFAULT_TEMPLATE, device) {
  return getTemplateDeviceModules(templateId, device)
}

/** 过滤 enabled + 按 order 排序（App 渲染用） */
export function enabledModules(templateId = DEFAULT_TEMPLATE, device) {
  return getTemplateDeviceModules(templateId, device)
    .filter((m) => m.enabled)
    .sort((a, b) => a.order - b.order)
}

/** 返回某模板 desktop/mobile 两套完整编排（console 展示双端差异用） */
export function getDeviceModules(templateId = DEFAULT_TEMPLATE) {
  const id = templateId || DEFAULT_TEMPLATE
  ensureTemplate(id)
  return {
    desktop: templates.value[id].desktop || [],
    mobile: templates.value[id].mobile || []
  }
}

/* ---------- 写 ---------- */
/** 整体替换某模板某设备的模块列表（console 拖拽排序/批量恢复用） */
export function setTemplateModules(templateId, modules, device) {
  const id = templateId || DEFAULT_TEMPLATE
  ensureTemplate(id)
  templates.value[id][resolveDevice(device)] = cloneDeep(modules || [])
  persist()
}

/** 追加一个模块配置（cfg 至少含 id/enabled/order/animation 等字段） */
export function addModule(templateId, cfg, device) {
  const list = getTemplateDeviceModules(templateId, device)
  const next = cloneDeep(cfg)
  if (next.order == null) {
    next.order = list.length ? Math.max(...list.map((m) => m.order ?? 0)) + 1 : 0
  }
  list.push(next)
  persist()
  return next
}

/**
 * 从模块池生成一个新实例（模块自由添加 / 副本，需求 1）：
 *  - type 为模块类型 id（MODULE_IDS 之一，如 'skills'）
 *  - id 自动唯一：type 已被占用则生成 type-2 / type-3 …（如 skills-2）
 *  - 所有类型可无限重复添加（即使已全用也能加副本）
 *  - label：基础名（首个实例）或「基础名 #N」（副本可区分）
 *  - 写入当前生效设备（createModuleInstance 用 getTemplateDeviceModules 默认参数）
 */
export function createModuleInstance(templateId, type, { order, lang = 'zh' } = {}) {
  const list = getTemplateDeviceModules(templateId)
  const ids = new Set(list.map((m) => m.id))
  let n = 1
  let id = type
  while (ids.has(id)) { n += 1; id = `${type}-${n}` }
  const base = MODULE_LABELS[type] ?? { zh: type, en: type }
  const label = n === 1
    ? { zh: base.zh ?? type, en: base.en ?? type }
    : { zh: `${base.zh ?? type} #${n}`, en: `${base.en ?? type} #${n}` }
  return {
    id,
    type,                    /* 副本实例的基础类型（组件/内容命名空间用） */
    enabled: true,
    order: order ?? (list.length ? Math.max(...list.map((m) => m.order ?? 0)) + 1 : 0),
    label,
    animation: 'fade-up',
    textAnim: 'typewriter',
    fontScale: 1,
    emphasize: false,
    variant: 'a'
  }
}

/** 删除模块 */
export function removeModule(templateId, moduleId, device) {
  const list = getTemplateDeviceModules(templateId, device)
  const idx = list.findIndex((m) => m.id === moduleId)
  if (idx >= 0) {
    list.splice(idx, 1)
    persist()
  }
}

/** 移动模块：把 fromIdx 移到 toIdx（拖拽排序用） */
export function moveModule(templateId, fromIdx, toIdx, device) {
  const list = getTemplateDeviceModules(templateId, device)
  if (fromIdx < 0 || fromIdx >= list.length) return
  const [item] = list.splice(fromIdx, 1)
  const target = Math.max(0, Math.min(toIdx, list.length))
  list.splice(target, 0, item)
  // 同步 order 字段，保持与排序一致
  list.forEach((m, i) => { m.order = i })
  persist()
}

/** 开关模块（enabled） */
export function toggleModule(templateId, moduleId, enabled, device) {
  const list = getTemplateDeviceModules(templateId, device)
  const m = list.find((x) => x.id === moduleId)
  if (m) {
    m.enabled = !!enabled
    persist()
  }
}

/** 改模块配置（animation / textAnim / fontScale / emphasize / variant / label…） */
export function updateModule(templateId, moduleId, patch, device) {
  const list = getTemplateDeviceModules(templateId, device)
  const m = list.find((x) => x.id === moduleId)
  if (m) {
    Object.assign(m, cloneDeep(patch))
    persist()
  }
}

/**
 * 在指定 device 上下文中执行修改事务（DEVICE 维度的主要扩展 API）。
 * fn 收到该设备的模块数组，可对其任意增删改；执行后统一持久化。
 * 例：updateForDevice('senior', 'mobile', (list) => list.push(newCfg))
 */
export function updateForDevice(versionId, device, fn) {
  const list = getTemplateDeviceModules(versionId, device)
  const result = typeof fn === 'function' ? fn(list) : undefined
  persist()
  return result
}

/** 还原默认编排（含双端）并清空持久化 */
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
    getTemplateDeviceModules,
    enabledModules,
    setTemplateModules,
    addModule,
    removeModule,
    moveModule,
    toggleModule,
    updateModule,
    updateForDevice,
    createModuleInstance,
    resetTemplateModules,
    getDeviceModules,
    STORAGE_KEY
  }
}

export default useTemplates
