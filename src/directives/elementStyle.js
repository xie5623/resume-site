/* ============================================================
   directives/elementStyle.js — v-element-style 元素级样式指令（需求 2）
   ------------------------------------------------------------
   在模块内元素上应用「元素级配置」（useElementStyle 的数据落地层）：
     - fontScale：把该元素及其子元素的 --fs-scale 设为
       「父级已生效 --fs-scale ×（元素级 fontScale ÷ 模块级 fontScale）」
       ——即相对模块默认 1 的比值叠加，保留模块字号/自适应/强调系数。
     - emphasize：给元素加 text-emphasize 类（渐变强调）。
   - 元素 key 无样式补丁时【什么都不做】（默认渲染不变，安全叠加）。
   - 模块 id 自动从最近祖先 `[data-module]` 解析（ModuleSection 已带），
     也可显式传 { moduleId, key }。

   用法（模板）：
     <h2 v-element-style="'title'">…</h2>
     <li v-element-style="{ moduleId:'skills', key:'items.3' }">…</li>
   注：气泡图 per-item size（需求 7）由模块组件直接调
   resolveBubbleSize() 计算内联尺寸，不走本指令（见 SkillsModule d）。
   注：原「size 固定尺寸落地（--el-w/--el-h + data-el-resizable）」已随
   【移除放大缩小功能】删除——元素不再被固定宽高撑住，字号变大时元素框
   随内容自然变大变小。
   注：字号≠1（元素级字号补丁生效）时，元素宽度设为 fit-content——
   框住文字、随字号/内容整体变大变小（用户问题4）；无补丁时恢复自然宽
   （块级元素保持占满容器的自然宽，不误改）。
   ============================================================ */

import { watch } from 'vue'
import { getElementStyle, resolveElementStyle } from '@/composables/useElementStyle'
import { getTemplateDeviceModules } from '@/composables/useTemplates'
import { version } from '@/composables/useVersion'

function moduleIdOf(el) {
  if (!el || typeof el.closest !== 'function') return null
  return el.closest('[data-module]')?.dataset?.module || null
}

/** 解析绑定值 → { moduleId, key }；字符串 = 元素 key（moduleId 取上下文） */
function parseBinding(binding, el) {
  const v = binding.value
  const fallback = moduleIdOf(el)
  if (typeof v === 'string') return { moduleId: fallback, key: v }
  if (v && typeof v === 'object') {
    return { moduleId: v.moduleId || fallback, key: v.key }
  }
  return null
}

/**
 * applyElementStyle(el, moduleId, key) — 把元素级样式补丁应用到元素上。
 * 与 v-element-style 指令共用同一实现；v-editable 也调用它，让
 * 【所有】可编辑元素都能响应元素级字号/强调（不只是挂了 v-element-style
 * 的 title）——修复「选中元素调字号滑块没反应」（用户问题 2）。
 */
export function applyElementStyle(el, moduleId, key) {
  if (!el || !moduleId || !key) return
  /* 三层回退（元素级 → 模块级 → 默认）：与 ARCHITECTURE §13.1 一致，
     模块级 emphasize / fontScale 在无元素级补丁时保留（不误删）。 */
  const list = getTemplateDeviceModules(version.value)
  const mod = list.find((x) => x.id === moduleId) ?? {}
  const resolved = resolveElementStyle(moduleId, key, mod)
  const st = el.style

  /* fontScale：父级已生效 --fs-scale × 元素/模块比值 */
  if (resolved.fontScale !== 1) {
    let parentScale = 1
    const parent = el.parentElement
    if (parent && typeof getComputedStyle === 'function') {
      const v = parseFloat(getComputedStyle(parent).getPropertyValue('--fs-scale'))
      if (Number.isFinite(v) && v > 0) parentScale = v
    }
    const moduleScale = typeof mod.fontScale === 'number' ? mod.fontScale : 1
    const factor = moduleScale ? resolved.fontScale / moduleScale : 1
    st.setProperty('--fs-scale', String(parentScale * factor))

    /* 继承型元素字号补足（用户问题 2 根治）：自消费 --fs-scale 的元素
       （title 等，font-size 用 calc(var(--fs-*) * var(--fs-scale))）字号会随
       注入的 --fs-scale 自动缩放；但段落等【继承型】元素（computed 字号 =
       父级字号，自身无 font-size 规则）不会重算——即使 --fs-scale 已注入。
       判定继承型：el 计算字号 ≈ 父级计算字号（差值 < 0.01px）。
       处理：显式写 font-size = 父级字号（已含模块级缩放）× 元素/模块比值
       （= 基准字号 × 元素级缩放），让框随字号真正变大变小。 */
    const elFs = parseFloat(getComputedStyle(el).fontSize)
    const pFs = parent ? parseFloat(getComputedStyle(parent).fontSize) : NaN
    if (Number.isFinite(elFs) && Number.isFinite(pFs) && Math.abs(elFs - pFs) < 0.01) {
      const ratio = moduleScale ? resolved.fontScale / moduleScale : 1
      st.fontSize = `${(elFs * ratio)}px`
    }
  } else {
    st.removeProperty('--fs-scale')
    st.removeProperty('font-size')
  }

  /* emphasize：渐变强调类（resolve 已含模块级回退，无补丁不误删） */
  el.classList.toggle('text-emphasize', resolved.emphasize === true)

  /* 字号缩放【元素级补丁】（≠1）时：让元素框 fit-content 随内容/字号自适应
     变大变小（用户问题4）。只认元素级补丁（getElementStyle 原始 patch），
     不认模块级字号回退——模块级字号是整块统一缩放，不该把每个标题框改成
     fit-content（会破坏 hero 等模块的块级布局）。 */
  const rawPatch = getElementStyle(moduleId, key)
  if (rawPatch && typeof rawPatch.fontScale === 'number' && rawPatch.fontScale !== 1) {
    st.width = 'fit-content'
    st.maxWidth = '100%'
  } else if (el.style.position !== 'absolute') {
    /* 守卫：editable.js 已摆放元素设了内联 position:absolute 并写入
       「拖拽记录宽度」（无字号补丁时 st.width = pos.w px）——此处跳过，
       避免删掉已保存的位置宽度（否则刷新后标题又缩回内容宽）。
       流式元素 removeProperty 本就是无害空操作，守卫零副作用。 */
    st.removeProperty('width')
    st.removeProperty('max-width')
  }
}

export const vElementStyle = {
  mounted(el, binding) {
    const parsed = parseBinding(binding, el)
    if (!parsed || !parsed.key) return
    const state = { ...parsed }
    el._elStyle = state
    /* 把元素 key 暴露到 DOM（data-el-style-key）：
       TextReveal 借此定位自己是哪个元素（读元素级 textAnim 补丁） */
    el.dataset.elStyleKey = state.key

    function apply() {
      if (!el._elStyle) return
      applyElementStyle(el, el._elStyle.moduleId, el._elStyle.key)
    }

    /* 响应式追踪：绑定值变化 + 元素样式补丁变化都重算 */
    const stop = watch(
      [() => binding.value, () => getElementStyle(state.moduleId, state.key)],
      apply,
      { flush: 'post', immediate: true }
    )
    state.stop = stop
  },

  updated(el, binding) {
    if (el._elStyle) {
      el._elStyle.key = parseBinding(binding, el)?.key ?? el._elStyle.key
      el.dataset.elStyleKey = el._elStyle.key
    }
  },

  unmounted(el) {
    if (el._elStyle?.stop) {
      try { el._elStyle.stop() } catch (_) {}
    }
    delete el._elStyle
    delete el.dataset.elStyleKey
    el.classList.remove('text-emphasize')
    el.style.removeProperty('--fs-scale')
    el.style.removeProperty('width')
    el.style.removeProperty('max-width')
  }
}

export default vElementStyle
