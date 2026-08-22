/* ============================================================
   composables/useEditingMode.js — 编辑模式状态（元素级编辑辅助开关）
   ------------------------------------------------------------
   作用：全局「是否处于编辑态」。编辑态时：
     - <body> 加 class 'editing'：CSS 据此启用模块/元素的 hover 虚线框、
       模块名角标、可编辑光标（编辑辅助框，需求 9）
     - 元素点击 → useSelection.selectElement（元素级选中，需求 4）
     - 拖拽摆放 / 模块拖拽排序生效
   驱动：默认跟随「控制台面板展开」（展开 = 进入编辑态；收起 = 成品态），
   也可用 setEditing() 手动控制（console-dev 如需独立开关可调用）。
   - 会话态，不持久化（打开即编辑，收起即成品）。
   ============================================================ */

import { ref, watch } from 'vue'
import { useConsole } from './useConsole'

/** 是否处于编辑态（响应式，组件/指令可直接读） */
export const editing = ref(false)

function syncBody() {
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.toggle('editing', editing.value)
  }
}

export function setEditing(on) {
  editing.value = !!on
  syncBody()
}

/* 默认跟随控制台开合：展开 → 编辑态；收起 → 成品态 */
const { open } = useConsole()
watch(open, (o) => setEditing(o), { immediate: true })

export function useEditingMode() {
  return { editing, setEditing }
}

export default useEditingMode
