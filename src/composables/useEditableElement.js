/* ============================================================
   composables/useEditableElement.js — 模块侧可编辑元素接入助手（T3）
   ------------------------------------------------------------
   模块组件用它统一两件事：
   1. 挂载时用 useEditableRegistry 注册本模块的可编辑元素清单
      （key / label / type）→ 控制台左侧配置区可列出（需求 4）
   2. 返回 ed(key) → 供模板 v-editable 绑定（moduleId/key/label/type）
   模块卸载自动注销注册表项。
   - 不改变模块渲染结构，只叠加 data 标记 + 轻量交互。

   用法：
     const { ed } = useEditableElement(props.config.id, [
       { key: 'name',  label: { zh: '姓名', en: 'Name' },  type: 'text' },
       { key: 'items', label: { zh: '条目', en: 'Items' }, type: 'list' },
     ])
     // 模板：<h2 v-editable="ed('title')">…</h2>
   ============================================================ */

import { onMounted, onBeforeUnmount } from 'vue'
import { useEditableRegistry } from './useEditableRegistry'
import { useI18n } from '@/i18n'

export function useEditableElement(moduleId, items = []) {
  const { registerEditable, unregisterEditable } = useEditableRegistry()
  const { lang } = useI18n()

  onMounted(() => registerEditable(moduleId, items))
  onBeforeUnmount(() => unregisterEditable(moduleId))

  function labelOf(label) {
    if (typeof label === 'string') return label
    return label?.[lang.value] ?? label?.zh ?? ''
  }

  /** 模板里 v-editable 绑定：v-editable="ed('name')" */
  function ed(key) {
    const item = items.find((i) => i.key === key)
    return {
      moduleId,
      key,
      label: item ? labelOf(item.label) : key,
      type: item?.type ?? 'text'
    }
  }

  return { ed, items }
}

export default useEditableElement
