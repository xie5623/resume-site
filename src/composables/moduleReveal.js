/* ============================================================
   moduleReveal.js — 模块 revealed 共享状态（App 装配层 ↔ 模块组件）
   ------------------------------------------------------------
   职责划分（t6 装配契约，见 ARCHITECTURE.md §2.2 更新版）：
     - App 装配层（ModuleSection.vue）负责「模块级滚动入场」——
       用 useReveal 监听模块容器进入视口，进入后调用
       markModuleRevealed(id)。
     - 模块组件不再自己建 ScrollTrigger，只通过
       useModuleReveal(config.id) 读取 revealed（ref<boolean>），
       用于内部子元素的错峰/进度条等 CSS/逻辑联动。

   为什么这样拆：避免「App 容器 + 模块根节点」双重入场动画。
   单一来源 = App 装配层。

   独立渲染兜底：若某模块在 App 装配之外被单独渲染（如开发调试），
   该 id 不在 expected 集合里，则挂载 400ms 后自动 revealed=true，
   保证不会永远隐藏。
   ============================================================ */

import { ref, onBeforeUnmount } from 'vue'

/* id -> Ref<boolean>：全站共享的 revealed 状态 */
const store = new Map()

/* 已声明「由 App 装配层负责 reveal」的模块 id 集合 */
const expected = new Set()

/**
 * 注册：App 装配层声明负责某模块的 reveal 标记。
 * @param {string} id 模块 id
 */
export function registerModuleReveal(id) {
  expected.add(id)
  if (!store.has(id)) store.set(id, ref(false))
}

/** 注销：模块从配置里移除时清理（ModuleSection 卸载时调用） */
export function unregisterModuleReveal(id) {
  expected.delete(id)
  store.delete(id)
}

/**
 * 标记：模块容器已进入视口并完成入场。App 装配层调用。
 * @param {string} id 模块 id
 */
export function markModuleRevealed(id) {
  const r = store.get(id)
  if (r) r.value = true
}

/**
 * 读取：模块组件在 setup 里调用，拿到的 ref 在进入视口后变 true。
 * 模块组件用它驱动内部错峰动画 / 进度条 / data-revealed 样式。
 * @param {string} id 模块 id（建议传 config.id）
 * @returns {import('vue').Ref<boolean>}
 */
export function useModuleReveal(id) {
  if (!store.has(id)) store.set(id, ref(false))
  const revealed = store.get(id)

  /* 独立渲染（不在 App 装配内）兜底：避免永远隐藏 */
  if (!expected.has(id)) {
    const timer = setTimeout(() => { revealed.value = true }, 400)
    onBeforeUnmount(() => clearTimeout(timer))
  }
  return revealed
}

/* 开发期调试：列出所有已注册模块的 revealed 状态 */
export function dumpModuleReveal() {
  return Object.fromEntries([...store.entries()].map(([k, v]) => [k, v.value]))
}
