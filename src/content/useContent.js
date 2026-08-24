/* ============================================================
   content/useContent.js — 内容层全局响应式 store + DEVICE 维度
   ------------------------------------------------------------
   作用：让页面文字可以被【控制台运行时编辑、实时预览、持久化】。
   - 单例 reactive 状态：初始值深拷贝自 CONTENT（src/content），
     组件只读 store，控制台写 store → 所有读它的模块实时联动。
   - 持久化：desktop 内容存原键（resume-site.content，向后兼容），
     mobile 覆盖补丁存新键（resume-site.content.mobile）。

   DEVICE 维度（第四层）—— 内容按设备覆盖，同步策略：
     content.value = {
       senior: {
         desktop: { zh: {...}, en: {...} },   // 桌面 = 基准（全量内容）
         mobile:  { zh: {...补丁}, en: {...} } // 手机 = 覆盖补丁（仅被微调的字段）
       }, ...
     }
   - desktop 为基准：读取 mobile 时 = 桌面全量 + 手机补丁（深度合并），
     因此「编辑 desktop 内容 → mobile 无覆盖的字段自动跟随」（天然同步）。
   - 编辑 mobile 内容 → 只写 mobile 覆盖补丁（微调）；该字段手机端独立。
   - resetDeviceContent(versionId) → 清空手机补丁，手机恢复跟随桌面。
   - 数组覆盖按「索引合并」：手机补丁 items.2.role 只改第 3 条，
     整数组覆盖（items = [...]）整体替换桌面列表（手机可大改）。
   - hasDeviceOverride / deviceOverrideStats：供控制台显示
     「该字段手机端已自定义」徽标。

   API：
     useContent() → {
       content,                    // ref<object>：{ templateId: { desktop:{lang:ns}, mobile:{lang:补丁} } }
       get(templateId, device, lang, key), // 新签名（device 显式）
       get(templateId, lang, key),         // 旧签名（device 用当前生效设备，兼容现有模块）
       setContent(templateId, device, lang, key, value), // 新签名
       setContent(templateId, lang, key, value),         // 旧签名
       setByPath(...)              // setContent 别名
       resetContent(),             // 还原默认并清两个持久化键
       resetDeviceContent(versionId?), // 清空手机覆盖 → 恢复跟随桌面
       hasDeviceOverride(versionId, lang, key), // 该字段手机端是否已自定义
       deviceOverrideStats(versionId, lang?),   // { templateId, device:'mobile', paths, count }
     }
   模块内用法（示范）：
     const { version } = useVersion()
     const { get } = useContent()
     const t = (key) => get(version.value, props.lang, `hero.${key}`)  // 跟随当前设备
   ============================================================ */

import { ref, computed } from 'vue'
import { CONTENT, DEFAULT_TEMPLATE } from './index'
import { effectiveDevice as activeDevice } from '@/composables/useDevice'

export const STORAGE_KEY = 'resume-site.content'              /* 桌面内容（原键） */
export const MOBILE_STORAGE_KEY = 'resume-site.content.mobile' /* 手机覆盖补丁（新键） */

/* 内容版本号：内容层文件（src/content/*.js）有实质更新时 +1。
   持久化数据带版本标记；加载时版本不匹配 → 忽略旧数据（用最新文件默认值）。
   防止「浏览器 localStorage 里旧的占位内容」长期覆盖新填的内容。 */
export const CONTENT_VERSION = 'v2-resume-2026-08-24'

const store = typeof localStorage !== 'undefined' ? localStorage : null
const LANGS = ['zh', 'en']

/* ---------- 工具 ---------- */
function cloneDeep(v) {
  if (Array.isArray(v)) return v.map(cloneDeep)
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, cloneDeep(val)]))
  }
  return v
}

/** 深度合并（数组整体替换）—— 用于「默认 + 已持久化桌面内容」的加载合并 */
function mergeDeep(target, src) {
  for (const [k, v] of Object.entries(src)) {
    if (v && typeof v === 'object' && !Array.isArray(v) &&
        target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) {
      mergeDeep(target[k], v)
    } else {
      target[k] = cloneDeep(v)
    }
  }
  return target
}

/** 数组感知的深度合并 —— 用于「桌面基准 + 手机覆盖补丁」：
 *  - 补丁为数组 → 整体替换（手机大改）
 *  - 补丁为对象、基准为数组 → 按索引并入（手机微调 items.2.role）
 *  - 否则对象递归合并 / 标量替换 */
function mergeOverride(target, src) {
  if (Array.isArray(src)) return cloneDeep(src)
  if (Array.isArray(target) && src && typeof src === 'object') {
    const out = cloneDeep(target)
    for (const [k, v] of Object.entries(src)) {
      const idx = Number(k)
      if (!Number.isInteger(idx) || idx < 0) continue
      out[idx] = mergeOverride(out[idx], v)
    }
    return out
  }
  const out = cloneDeep(target || {})
  for (const [k, v] of Object.entries(src || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) &&
        out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
      out[k] = mergeOverride(out[k], v)
    } else {
      out[k] = cloneDeep(v)
    }
  }
  return out
}

function resolvePath(obj, path) {
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj)
}

/** 把 CONTENT 默认值规范成 { tpl: { desktop: {zh,en}, mobile: {} } }（mobile 空=跟随桌面） */
function normalizeContentDefault(defaultContent) {
  const out = {}
  for (const [tpl, branches] of Object.entries(defaultContent || {})) {
    const entry = { desktop: {}, mobile: {} }
    for (const lang of LANGS) {
      if (branches?.[lang] && typeof branches[lang] === 'object') {
        entry.desktop[lang] = cloneDeep(branches[lang])
      }
    }
    out[tpl] = entry
  }
  return out
}

/** 把任意状态（新形状 / 旧形状 { tpl: { lang: ns } }）规范成 device 分支结构 */
function normalizeState(state) {
  const out = {}
  for (const [tpl, branches] of Object.entries(state || {})) {
    if (!branches || typeof branches !== 'object') continue
    const entry = { desktop: {}, mobile: {} }
    if (branches.desktop && typeof branches.desktop === 'object') {
      /* 新形状：{ desktop:{zh,en}, mobile:{zh,en} } */
      for (const lang of LANGS) {
        if (branches.desktop[lang]) entry.desktop[lang] = cloneDeep(branches.desktop[lang])
      }
      if (branches.mobile && typeof branches.mobile === 'object') entry.mobile = cloneDeep(branches.mobile)
    } else {
      /* 旧形状：{ zh:{...}, en:{...} } → 全部当桌面 */
      for (const lang of LANGS) {
        if (branches[lang]) entry.desktop[lang] = cloneDeep(branches[lang])
      }
    }
    out[tpl] = entry
  }
  return out
}

/* ---------- 初始化：CONTENT 默认 + localStorage 覆盖 ---------- */
function loadInitial() {
  const base = normalizeContentDefault(cloneDeep(CONTENT))

  /* 读取持久化桌面内容：带版本标记；旧格式（无 v 字段）或版本不匹配一律忽略 */
  const saved = store?.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      const data = (parsed && typeof parsed === 'object' && parsed.v === CONTENT_VERSION) ? parsed.data : null
      if (data) {
        for (const [tpl, branches] of Object.entries(data)) {
          if (!base[tpl]) base[tpl] = { desktop: {}, mobile: {} }
          for (const lang of LANGS) {
            if (branches?.[lang] && typeof branches[lang] === 'object') {
              base[tpl].desktop[lang] = mergeDeep(base[tpl].desktop[lang] || {}, branches[lang])
            }
          }
        }
      }
    } catch (e) {
      console.warn('[useContent] 内容持久化数据损坏，已回退默认：', e)
    }
  }

  /* 手机覆盖补丁：新键（同样带版本标记） */
  const savedMobile = store?.getItem(MOBILE_STORAGE_KEY)
  if (savedMobile) {
    try {
      const parsed = JSON.parse(savedMobile)
      const data = (parsed && typeof parsed === 'object' && parsed.v === CONTENT_VERSION) ? parsed.data : null
      if (data) {
        for (const [tpl, branches] of Object.entries(data)) {
          if (!base[tpl]) base[tpl] = { desktop: {}, mobile: {} }
          if (!base[tpl].mobile || typeof base[tpl].mobile !== 'object') base[tpl].mobile = {}
          for (const lang of LANGS) {
            if (branches?.[lang] && typeof branches[lang] === 'object') {
              base[tpl].mobile[lang] = mergeDeep(base[tpl].mobile[lang] || {}, branches[lang])
            }
          }
        }
      }
    } catch (e) {
      console.warn('[useContent] 手机内容覆盖数据损坏，已忽略：', e)
    }
  }
  return base
}

/** 全局内容状态（ref → 深层响应式；改任意叶子，读它的组件即时更新） */
export const content = ref(loadInitial())

/** 手机读取用的合并视图：desktop 全量 + mobile 补丁（computed 缓存，内容变更才重算） */
const mergedMobile = computed(() => {
  const out = {}
  for (const [tpl, branches] of Object.entries(content.value || {})) {
    const desktop = branches?.desktop || {}
    const mobile = branches?.mobile || {}
    out[tpl] = {}
    for (const lang of LANGS) {
      out[tpl][lang] = mergeOverride(desktop[lang] || {}, mobile[lang] || {})
    }
  }
  return out
})

function persist() {
  try {
    const desktopOut = {}
    const mobileOut = {}
    for (const [tpl, branches] of Object.entries(content.value || {})) {
      const d = branches?.desktop
      if (d && typeof d === 'object') {
        const langEntries = {}
        for (const lang of LANGS) {
          if (d[lang] && typeof d[lang] === 'object') langEntries[lang] = d[lang]
        }
        if (Object.keys(langEntries).length) desktopOut[tpl] = langEntries
      }
      const m = branches?.mobile
      if (m && typeof m === 'object' && Object.keys(m).length) mobileOut[tpl] = m
    }
    store?.setItem(STORAGE_KEY, JSON.stringify({ v: CONTENT_VERSION, data: desktopOut }))
    store?.setItem(MOBILE_STORAGE_KEY, JSON.stringify({ v: CONTENT_VERSION, data: mobileOut }))
  } catch (e) {
    console.warn('[useContent] 持久化失败：', e)
  }
}

/* ---------- 参数兼容（旧签名 3/4 参 vs 新签名 4/5 参） ---------- */
function activeDeviceValue() {
  return activeDevice.value === 'mobile' ? 'mobile' : 'desktop'
}
function normalizeReadArgs(templateId, arg2, arg3, arg4) {
  /* 旧：get(tpl, lang, key)  新：get(tpl, device, lang, key) */
  if (typeof arg2 === 'string' && (arg2 === 'zh' || arg2 === 'en')) {
    return { tpl: templateId || DEFAULT_TEMPLATE, device: activeDeviceValue(), lang: arg2, key: arg3 }
  }
  return {
    tpl: templateId || DEFAULT_TEMPLATE,
    device: arg2 === 'mobile' ? 'mobile' : (arg2 === 'desktop' ? 'desktop' : activeDeviceValue()),
    lang: arg3,
    key: arg4
  }
}

function normalizeWriteArgs(templateId, arg2, arg3, arg4, arg5) {
  /* 旧：setContent(tpl, lang, key, value)  新：setContent(tpl, device, lang, key, value) */
  if (typeof arg2 === 'string' && (arg2 === 'zh' || arg2 === 'en')) {
    return { tpl: templateId || DEFAULT_TEMPLATE, device: activeDeviceValue(), lang: arg2, key: arg3, value: arg4 }
  }
  return {
    tpl: templateId || DEFAULT_TEMPLATE,
    device: arg2 === 'mobile' ? 'mobile' : (arg2 === 'desktop' ? 'desktop' : activeDeviceValue()),
    lang: arg3,
    key: arg4,
    value: arg5
  }
}

/* ---------- 读 ---------- */
/**
 * resolveContent(templateId, device, lang, key) / (templateId, lang, key) — 带回退链取值。
 * 依次尝试： [template][device][lang] → [template][device][zh] → [默认模板][device][lang]
 *            → [默认模板][device][zh] → undefined。
 * mobile 读取在「桌面全量 + 手机补丁」合并视图上进行。
 * key 支持点路径（'hero.name' / 'experience.items.0.role'）。
 */
export function resolveContent(templateId, device, lang, key) {
  const { tpl, device: dev, lang: ln, key: k } = normalizeReadArgs(templateId, device, lang, key)
  const data = content.value
  if (!data) return undefined

  if (dev === 'mobile') {
    const chain = [
      mergedMobile.value[tpl]?.[ln],
      mergedMobile.value[tpl]?.zh,
      mergedMobile.value[DEFAULT_TEMPLATE]?.[ln],
      mergedMobile.value[DEFAULT_TEMPLATE]?.zh
    ]
    for (const ns of chain) {
      if (!ns) continue
      const v = resolvePath(ns, k)
      if (v != null) return v
    }
    return undefined
  }

  const chain = [
    data[tpl]?.desktop?.[ln],
    data[tpl]?.desktop?.zh,
    data[DEFAULT_TEMPLATE]?.desktop?.[ln],
    data[DEFAULT_TEMPLATE]?.desktop?.zh
  ]
  for (const ns of chain) {
    if (!ns) continue
    const v = resolvePath(ns, k)
    if (v != null) return v
  }
  return undefined
}

export const getContent = resolveContent

/* ---------- 写 ---------- */
/** 点路径写入某个分支（desktop 全量 / mobile 补丁） */
function writeLeaf(root, tpl, branch, lang, key, value) {
  if (!root[tpl] || typeof root[tpl] !== 'object') root[tpl] = { desktop: {}, mobile: {} }
  if (!root[tpl][branch] || typeof root[tpl][branch] !== 'object') root[tpl][branch] = {}
  if (!root[tpl][branch][lang] || typeof root[tpl][branch][lang] !== 'object') root[tpl][branch][lang] = {}

  const keys = key.split('.')
  let node = root[tpl][branch][lang]
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    if (node[k] == null || typeof node[k] !== 'object') node[k] = {}
    node = node[k]
  }
  const last = keys[keys.length - 1]
  // 数字叶子（如 'hero.roles.0'）：父节点是数组时按索引写入，
  // 保持数组元素类型（字符串数组逐项编辑不破坏为对象）。
  if (Array.isArray(node) && /^\d+$/.test(last)) {
    node[Number(last)] = cloneDeep(value)
  } else {
    node[last] = cloneDeep(value)
  }
}

/**
 * setContent(templateId, device, lang, key, value) / (templateId, lang, key, value)
 * — 写文案（点路径）+ 持久化。自动创建中间对象。
 *  - device 缺省 → 当前生效设备（编辑器模拟视口）。
 *  - desktop 写入全量；mobile 写入覆盖补丁（微调），两者互不覆盖，
 *    合并视图保证 desktop 变更自动同步到「未自定义」的 mobile 字段。
 */
export function setContent(templateId, device, lang, key, value) {
  const { tpl, device: dev, lang: ln, key: k, value: v } = normalizeWriteArgs(templateId, device, lang, key, value)
  writeLeaf(content.value, tpl, dev, ln, k, v)
  persist()
}

export const setByPath = setContent

/* ---------- 手机覆盖（DEVICE 维度同步策略） ---------- */
function mobilePatches(tpl) {
  const e = content.value[tpl]
  return (e && typeof e.mobile === 'object') ? e.mobile : {}
}

/** 指定字段在手机端是否已有覆盖（供控制台显示「手机端已自定义」徽标） */
export function hasDeviceOverride(templateId, lang, key) {
  const tpl = templateId || DEFAULT_TEMPLATE
  const node = mobilePatches(tpl)[lang]
  return node != null && typeof node === 'object' && resolvePath(node, key) != null
}

function collectLeafPaths(node, prefix, acc) {
  for (const [k, v] of Object.entries(node || {})) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) collectLeafPaths(v, p, acc)
    else acc.push(p)
  }
  return acc
}

/** 统计某模板手机端覆盖字段：{ templateId, device:'mobile', paths:[...], count } */
export function deviceOverrideStats(templateId, lang) {
  const tpl = templateId || DEFAULT_TEMPLATE
  const patches = mobilePatches(tpl)
  const langs = lang ? [lang] : LANGS
  const paths = []
  for (const ln of langs) {
    if (patches[ln] && typeof patches[ln] === 'object') collectLeafPaths(patches[ln], '', paths)
  }
  return { templateId: tpl, device: 'mobile', paths, count: paths.length }
}

/** 清空手机端覆盖（恢复跟随桌面）；不传 versionId 清全部 */
export function resetDeviceContent(versionId) {
  if (versionId) {
    if (content.value[versionId]) content.value[versionId].mobile = {}
  } else {
    for (const tpl of Object.keys(content.value || {})) {
      if (content.value[tpl]) content.value[tpl].mobile = {}
    }
  }
  persist()
}

/* ---------- 重置 ---------- */
/** 还原默认内容并清空两个持久化键（控制台「恢复默认」按钮用） */
export function resetContent() {
  content.value = normalizeContentDefault(cloneDeep(CONTENT))
  store?.removeItem(STORAGE_KEY)
  store?.removeItem(MOBILE_STORAGE_KEY)
}

/* ---------- 状态整体替换（撤销/重做历史用；传入 null 即回默认） ---------- */
export function replaceContentState(next) {
  content.value = normalizeState(next == null ? cloneDeep(CONTENT) : next)
  persist()
}

/* ---------- composable ---------- */
export function useContent() {
  return {
    content,
    get: getContent,
    resolve: resolveContent,
    setContent,
    setByPath,
    resetContent,
    resetDeviceContent,
    hasDeviceOverride,
    deviceOverrideStats,
    STORAGE_KEY,
    MOBILE_STORAGE_KEY
  }
}

export default useContent
