<script setup>
/**
 * InlineEdit — 页面内联编辑浮层（需求 7）
 * ------------------------------------------------------------
 * 双击页面文字（data-editable-key）后，在元素原位置覆盖一个
 * 玻璃输入框 / 文本域：
 *   - 输入实时写 store → 页面文字实时预览
 *   - Enter（单行）或 失焦 → 提交保存（可撤销一次）
 *   - Esc → 取消并恢复编辑前文字
 * 定位用 useInlineEdit 记录的 fixed 坐标（view 坐标），Teleport 到 body。
 */
import { ref, computed, watch, nextTick } from 'vue'
import {
  inlineEdit,
  updateInlineEdit,
  commitInlineEdit,
  cancelInlineEdit
} from '@/composables/useInlineEdit'

const inputRef = ref(null)

/* 草稿：绑定 store 里的 value，输入即实时写 store */
const draft = computed({
  get: () => inlineEdit.value.value,
  set: (v) => updateInlineEdit(v)
})

const fieldType = computed(() => (inlineEdit.value.multiline ? 'textarea' : 'input'))

const boxStyle = computed(() => {
  const s = inlineEdit.value
  return {
    left: `${s.x}px`,
    top: `${s.y}px`,
    width: `${s.w}px`,
    minHeight: `${s.h}px`,
    fontSize: s.fontSize,
    lineHeight: s.lineHeight,
    textAlign: s.textAlign
  }
})

/* 每次开启后聚焦 + 全选 */
watch(() => inlineEdit.value.active, (a) => {
  if (!a) return
  nextTick(() => {
    const el = inputRef.value
    if (!el) return
    el.focus()
    try { el.select() } catch (_) {}
  })
}, { immediate: true })

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    cancelInlineEdit()
  } else if (e.key === 'Enter' && fieldType.value !== 'textarea') {
    e.preventDefault()
    commitInlineEdit()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="inlineEdit.active"
      class="ie"
      :style="boxStyle"
      role="textbox"
      :aria-label="inlineEdit.path"
    >
      <textarea
        v-if="fieldType === 'textarea'"
        ref="inputRef"
        v-model="draft"
        class="ie__field ie__field--area"
        rows="3"
        @keydown="onKeydown"
        @blur="commitInlineEdit"
      ></textarea>
      <input
        v-else
        ref="inputRef"
        v-model="draft"
        class="ie__field"
        type="text"
        @keydown="onKeydown"
        @blur="commitInlineEdit"
      />
      <span class="ie__hint">{{ inlineEdit.path }} · Enter 保存 · Esc 取消</span>
    </div>
  </Teleport>
</template>

<style scoped>
.ie {
  position: fixed;
  z-index: 1050;
  padding: 2px;
  border-radius: 6px;
  background: rgba(10, 16, 32, 0.92);
  border: 1px solid rgba(55, 217, 242, 0.6);
  box-shadow:
    0 0 0 1px rgba(55, 217, 242, 0.28),
    0 0 20px rgba(55, 217, 242, 0.35),
    0 8px 24px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
}
.ie__field {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #eaf2ff;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  text-align: inherit;
  padding: 2px 4px;
  border-radius: 4px;
  box-sizing: border-box;
  caret-color: #37d9f2;
}
.ie__field--area { resize: none; min-height: 2.6em; }
.ie__hint {
  display: block;
  margin-top: 2px;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  line-height: 1;
  color: rgba(180, 200, 255, 0.6);
  padding: 0 4px 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
