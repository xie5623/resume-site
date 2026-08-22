/* ============================================================
   content/useContent.js — 内容层全局响应式 store（生成器内核）
   ------------------------------------------------------------
   作用：让页面文字可以被【控制台运行时编辑、实时预览、持久化】。
   - 单例 reactive 状态：初始值深拷贝自 CONTENT（src/content），
     组件只读 store，控制台写 store → 所有读它的模块实时联动。
   - localStorage 持久化（key: resume-site.content）：编辑结果在
     刷新后保留；调用 resetContent() 可一键还原默认。

   API：
     useContent() → {
       content,                    // ref<object>：{ templateId: { lang: { ns: {...} } } }
       get(templateId, lang, key), // 取文案（带回退链，见 resolveContent）
       resolve: resolveContent,    // 同 get（别名）
       setContent(templateId, lang, key, value), // 写文案（点路径）+ 持久化
       setByPath(...)              // setContent 别名（console 语义名）
       resetContent(),             // 还原默认并清 localStorage
     }
   模块内用法（示范）：
     const { version } = useVersion()
     const { get } = useContent()
     const t = (key) => get(version.value, props.lang, `hero.${key}`)
   ============================================================ */

import { ref } from 'vue'
import { CONTENT, DEFAULT_TEMPLATE } from './index'

export const STORAGE_KEY = 'resume-site.content'

const store = typeof localStorage !== 'undefined' ? localStorage : null

/* ---------- 工具 ---------- */
function cloneDeep(v) {
  if (Array.isArray(v)) return v.map(cloneDeep)
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, cloneDeep(val)]))
  }
  return v
}

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

function resolvePath(obj, path) {
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj)
}

/* ---------- 初始化：CONTENT 默认 + localStorage 覆盖 ---------- */
function loadInitial() {
  const base = cloneDeep(CONTENT)
  const saved = store?.getItem(STORAGE_KEY)
  if (saved) {
    try {
      return mergeDeep(base, JSON.parse(saved))
    } catch (e) {
      console.warn('[useContent] 内容持久化数据损坏，已回退默认：', e)
    }
  }
  return base
}

/** 全局内容状态（ref → 深层响应式；改任意叶子，读它的组件即时更新） */
export const content = ref(loadInitial())

function persist() {
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify(content.value))
  } catch (e) {
    console.warn('[useContent] 持久化失败：', e)
  }
}

/* ---------- 读 ---------- */
/**
 * resolveContent(templateId, lang, key) — 带回退链取值。
 * 依次尝试： [template][lang] → [template][zh] → [默认模板][lang]
 *            → [默认模板][zh] → undefined。
 * key 支持点路径（'hero.name' / 'experience.items.0.role'）。
 * 值可以是字符串、数组或对象（列表类内容直接返回数组，模板 v-for 即可）。
 */
export function resolveContent(templateId, lang, key) {
  const tpl = templateId || DEFAULT_TEMPLATE
  const data = content.value
  if (!data) return undefined
  const chain = [
    data[tpl]?.[lang],
    data[tpl]?.zh,
    data[DEFAULT_TEMPLATE]?.[lang],
    data[DEFAULT_TEMPLATE]?.zh
  ]
  for (const ns of chain) {
    if (!ns) continue
    const v = resolvePath(ns, key)
    if (v != null) return v
  }
  return undefined
}

export const getContent = resolveContent

/* ---------- 写 ---------- */
/**
 * setContent(templateId, lang, key, value) — 写文案（点路径）+ 持久化。
 * 自动创建中间对象；叶子可以是字符串/数组/对象。
 * console 编辑文字、换列表、改数值都走这个接口。
 */
export function setContent(templateId, lang, key, value) {
  const tpl = templateId || DEFAULT_TEMPLATE
  const root = content.value
  if (!root[tpl] || typeof root[tpl] !== 'object') root[tpl] = {}
  if (!root[tpl][lang] || typeof root[tpl][lang] !== 'object') root[tpl][lang] = {}

  const keys = key.split('.')
  let node = root[tpl][lang]
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
  persist()
}

export const setByPath = setContent

/* ---------- 重置 ---------- */
/** 还原默认内容并清空持久化（控制台「恢复默认」按钮用） */
export function resetContent() {
  content.value = cloneDeep(CONTENT)
  store?.removeItem(STORAGE_KEY)
}

/* ---------- 状态整体替换（撤销/重做历史用；传入 null 即回默认） ---------- */
export function replaceContentState(next) {
  content.value = cloneDeep(next ?? cloneDeep(CONTENT))
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
    STORAGE_KEY
  }
}

export default useContent
