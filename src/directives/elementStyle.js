/* ============================================================
   directives/elementStyle.js — v-element-style 元素级样式指令（需求 2）
   ------------------------------------------------------------
   在模块内元素上应用「元素级配置」（useElementStyle 的数据落地层）：
     - fontScale：把该元素及其子元素的 --fs-scale 设为
       「父级已生效 --fs-scale ×（元素级 fontScale ÷ 模块级 fontScale）」
       ——即相对模块默认 1 的比值叠加，保留模块字号/自适应/强调系数。
     - emphasize：给元素加 text-emphasize 类（渐变强调）。
     - size（通用元素）：设置 --el-w / --el-h CSS 变量 + data-el-resizable
       （需求 6「可调整大小」由 T2/T3 消费这两个变量做布局）。
   - 元素 key 无样式补丁时【什么都不做】（默认渲染不变，安全叠加）。
   - 模块 id 自动从最近祖先 `[data-module]` 解析（ModuleSection 已带），
     也可显式传 { moduleId, key }。

   用法（模板）：
     <h2 v-element-style="'title'">…</h2>
     <li v-element-style="{ moduleId:'skills', key:'items.3' }">…</li>
   注：气泡图 per-item size（需求 7）由模块组件直接调
   resolveBubbleSize() 计算内联尺寸，不走本指令（见 SkillsModule d）。
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

export const vElementStyle = {
  mounted(el, binding) {
    const parsed = parseBinding(binding, el)
    if (!parsed || !parsed.key) return
    const state = { ...parsed }
    el._elStyle = state

    function apply() {
      if (!el._elStyle) return
      const { moduleId, key } = el._elStyle
      if (!moduleId || !key) return
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
      } else {
        st.removeProperty('--fs-scale')
      }

      /* emphasize：渐变强调类（resolve 已含模块级回退，无补丁不误删） */
      el.classList.toggle('text-emphasize', resolved.emphasize === true)

      /* size（通用可调整大小元素）：--el-w / --el-h + 标记 */
      const sz = resolved.size
      if (sz && typeof sz === 'object' && sz.w != null) {
        const unit = sz.unit === '%' ? '%' : 'px'
        st.setProperty('--el-w', `${sz.w}${unit}`)
        st.setProperty('--el-h', sz.h != null ? `${sz.h}${unit}` : 'auto')
        el.dataset.elResizable = 'true'
      } else {
        st.removeProperty('--el-w')
        st.removeProperty('--el-h')
        delete el.dataset.elResizable
      }
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
    if (el._elStyle) el._elStyle.key = parseBinding(binding, el)?.key ?? el._elStyle.key
  },

  unmounted(el) {
    if (el._elStyle?.stop) {
      try { el._elStyle.stop() } catch (_) {}
    }
    delete el._elStyle
    el.classList.remove('text-emphasize')
    ;['--fs-scale', '--el-w', '--el-h'].forEach((p) => el.style.removeProperty(p))
    delete el.dataset.elResizable
  }
}

export default vElementStyle
