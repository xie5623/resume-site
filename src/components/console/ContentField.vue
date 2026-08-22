<script setup>
/**
 * ContentField — 递归内容编辑器（模块文字编辑的通用渲染器）
 * ------------------------------------------------------------
 * 传入一条内容路径（如 'hero' / 'hero.roles' / 'hero.roles.0' /
 * 'experience.items.0.desc'），按值类型递归渲染编辑控件：
 *   - string   → 玻璃输入框（即时写 store，实时预览）
 *   - number   → 数字输入框
 *   - boolean  → 开关
 *   - array    → 列表卡片（字符串项 / 对象项 / 嵌套数组均可），
 *                每项可编辑 + 删除，底部「添加」按钮
 *   - object   → 字段分组（递归渲染其条目）
 * 所有读写直接走 useContent 全局响应式 store：输入即写、页面即变。
 * 数据契约：get(version, lang, path) / setContent(version, lang, path, v)。
 */
import { ref, computed } from 'vue'
import { useContent } from '@/content/useContent'
import { version } from '@/composables/useVersion'
import { lang } from '@/i18n'
import { useSelection } from '@/composables/useSelection'
import { getTemplateModules } from '@/composables/useTemplates'
import { capture, push, withHistory } from '@/composables/useHistory'

const props = defineProps({
  path: { type: String, required: true },   // 完整点路径（含命名空间前缀）
  label: { type: String, default: '' },     // 友好名（缺省自动推导）
  depth: { type: Number, default: 0 }       // 缩进层级（样式用）
})

const { get, setContent } = useContent()
const { selection } = useSelection()

/* ---------- 是否当前选中字段（需求 4：ContentField 高亮对应项） ----------
   选中元素（moduleId + elementKey）→ 内容命名空间 + '.' + elementKey =
   完整内容路径；与本字段 props.path 相等即该输入框被选中 → 行高亮。 */
const isSelected = computed(() => {
  const sel = selection.value
  if (!sel || sel.kind !== 'element' || !sel.moduleId || !sel.elementKey) return false
  const m = getTemplateModules(version.value).find((x) => x.id === sel.moduleId)
  if (!m) return false
  const ns = m.type ?? m.id
  return `${ns}.${sel.elementKey}` === props.path
})

/* ---------- 读取当前值（带回退链，随 store 响应） ---------- */
const value = () => get(version.value, lang.value, props.path)

/* ---------- 历史会话（撤销） ----------
   文字输入：聚焦时捕获快照 → 输入实时写 store（预览）→ 失焦时入栈一次，
   undo 一步回到编辑前（避免每敲一键都生成一条历史）。 */
const pendingSnap = ref(null)
let dirty = false
function beginEdit() {
  if (!pendingSnap.value) {
    pendingSnap.value = capture()
    dirty = false
  }
}
function finishEdit() {
  if (pendingSnap.value && dirty) push(pendingSnap.value)
  pendingSnap.value = null
  dirty = false
}

/* ---------- 写叶子 ----------
   setContent 已支持数字叶子（数组内字符串项不被破坏）。 */
function write(v) {
  if (!pendingSnap.value) beginEdit()
  dirty = true
  setContent(version.value, lang.value, props.path, v)
}

/* ---------- 数组：增删项（整数组写回，保证连续性；带历史） ---------- */
function addItem() {
  withHistory(() => {
    const arr = value()
    const list = Array.isArray(arr) ? arr : []
    let seed = ''
    if (list.length) {
      const first = list[0]
      if (Array.isArray(first)) seed = []
      else if (first && typeof first === 'object') seed = {}
    }
    setContent(version.value, lang.value, props.path, [...list, seed])
  })
}
function removeItem(idx) {
  withHistory(() => {
    const arr = value()
    if (!Array.isArray(arr)) return
    setContent(version.value, lang.value, props.path, arr.filter((_, i) => i !== idx))
  })
}

/* ---------- 布尔：开关（带历史） ---------- */
function toggleBool() {
  withHistory(() => write(!value()))
}

/* ---------- 键名 → 友好名（跟随当前语言，缺省回退原键） ---------- */
const KEY_LABELS = {
  eyebrow:   { zh: '眉题',   en: 'Eyebrow' },
  title:     { zh: '标题',   en: 'Title' },
  subtitle:  { zh: '副标题', en: 'Subtitle' },
  sub:       { zh: '说明',   en: 'Note' },
  lead:      { zh: '导语',   en: 'Lead' },
  body:      { zh: '正文',   en: 'Body' },
  intro:     { zh: '简介',   en: 'Intro' },
  name:      { zh: '名称',   en: 'Name' },
  role:      { zh: '职位',   en: 'Role' },
  roles:     { zh: '职位列表', en: 'Roles' },
  company:   { zh: '公司',   en: 'Company' },
  period:    { zh: '时间',   en: 'Period' },
  desc:      { zh: '描述',   en: 'Description' },
  tag:       { zh: '标签',   en: 'Tag' },
  tags:      { zh: '标签',   en: 'Tags' },
  links:     { zh: '链接',   en: 'Links' },
  school:    { zh: '学校',   en: 'School' },
  degree:    { zh: '学位',   en: 'Degree' },
  note:      { zh: '备注',   en: 'Note' },
  issuer:    { zh: '颁发机构', en: 'Issuer' },
  year:      { zh: '年份',   en: 'Year' },
  category:  { zh: '分类',   en: 'Category' },
  items:     { zh: '条目',   en: 'Items' },
  groups:    { zh: '分组',   en: 'Groups' },
  level:     { zh: '熟练度', en: 'Level' },
  value:     { zh: '数值',   en: 'Value' },
  label:     { zh: '标签',   en: 'Label' },
  stats:     { zh: '数据',   en: 'Stats' },
  interests: { zh: '兴趣',   en: 'Interests' },
  email:     { zh: '邮箱',   en: 'Email' },
  greeting:  { zh: '问候语', en: 'Greeting' },
  tagline:   { zh: '标语',   en: 'Tagline' },
  ctaWork:   { zh: '按钮·作品', en: 'CTA · Work' },
  ctaContact:{ zh: '按钮·联系', en: 'CTA · Contact' },
  status:    { zh: '状态',   en: 'Status' },
  location:  { zh: '城市',   en: 'Location' },
  scroll:    { zh: '滚动提示', en: 'Scroll' },
  badge:     { zh: '徽标',   en: 'Badge' },
  cardRole:  { zh: '卡·角色', en: 'Card · Role' },
  cardLoc:   { zh: '卡·城市', en: 'Card · Location' },
  cardMail:  { zh: '卡·邮箱', en: 'Card · Email' },
  cardAvail: { zh: '卡·状态', en: 'Card · Availability' },
  placeholderMail: { zh: '邮箱占位', en: 'Email placeholder' },
  placeholderCity: { zh: '城市占位', en: 'City placeholder' },
  now:       { zh: '至今',   en: 'Now' },
  present:   { zh: '现任',   en: 'Present' },
  formName:  { zh: '表单·姓名', en: 'Form · Name' },
  formEmail: { zh: '表单·邮箱', en: 'Form · Email' },
  formMessage: { zh: '表单·留言', en: 'Form · Message' },
  phName:    { zh: '姓名占位', en: 'Name placeholder' },
  phEmail:   { zh: '邮箱占位', en: 'Email placeholder' },
  phMessage: { zh: '留言占位', en: 'Message placeholder' },
  submit:    { zh: '提交按钮', en: 'Submit' },
  submitNote:{ zh: '表单说明', en: 'Form note' },
  footer:    { zh: '页脚',   en: 'Footer' },
  madeWith:  { zh: '技术栈', en: 'Built with' },
  copyright: { zh: '版权',   en: 'Copyright' },
  backToTop: { zh: '回顶',   en: 'Back to top' }
}

function labelFor(key) {
  const hit = KEY_LABELS[key]
  if (hit) return hit[lang.value] ?? hit.zh ?? key
  return key
}

/* ---------- 是数组第几项（父为数组的数字叶子） ---------- */
function isIndexLeaf(p) {
  const segs = p.split('.')
  return /^\d+$/.test(segs[segs.length - 1])
}
</script>

<template>
  <div class="cf" :class="`cf--d${Math.min(depth, 3)}`">
    <template v-if="Array.isArray(value())">
      <!-- ===== 数组：列表编辑 ===== -->
      <div class="cf__group">
        <div class="cf__group-head">
          <span class="cf__label">{{ label || labelFor(path.split('.').pop()) }}</span>
          <button type="button" class="cf__add" @click="addItem">＋ 添加</button>
        </div>
        <div v-if="!value().length" class="cf__empty">（空列表）</div>
        <div v-for="(item, idx) in value()" :key="`${path}.${idx}`" class="cf__item">
          <div class="cf__item-bar">
            <span class="cf__item-index">#{{ idx + 1 }}</span>
            <button type="button" class="cf__remove" title="删除该项" @click="removeItem(idx)">✕</button>
          </div>
          <div v-if="item && typeof item === 'object' && !Array.isArray(item)" class="cf__item-body">
            <ContentField
              v-for="(subVal, subKey) in item"
              :key="`${path}.${idx}.${subKey}`"
              :path="`${path}.${idx}.${subKey}`"
              :label="labelFor(subKey)"
              :depth="depth + 1"
            />
          </div>
          <ContentField
            v-else
            :key="`${path}.${idx}`"
            :path="`${path}.${idx}`"
            :label="`${label || labelFor(path.split('.').pop())} ${idx + 1}`"
            :depth="depth + 1"
          />
        </div>
      </div>
    </template>

    <template v-else-if="value() && typeof value() === 'object'">
      <!-- ===== 对象：字段分组 ===== -->
      <div class="cf__group">
        <div class="cf__group-title">{{ label || labelFor(path.split('.').pop()) }}</div>
        <ContentField
          v-for="(subVal, subKey) in value()"
          :key="`${path}.${subKey}`"
          :path="`${path}.${subKey}`"
          :label="labelFor(subKey)"
          :depth="depth + 1"
        />
      </div>
    </template>

    <template v-else-if="typeof value() === 'boolean'">
      <!-- ===== 布尔：开关 ===== -->
      <label class="cf__row cf__row--switch">
        <span class="cf__label">{{ label || labelFor(path.split('.').pop()) }}</span>
        <button
          type="button"
          class="cf__switch"
          :class="{ 'cf__switch--on': value() }"
          :aria-pressed="value()"
          @click="toggleBool"
        >
          <span class="cf__switch-knob" />
        </button>
      </label>
    </template>

    <template v-else-if="typeof value() === 'number'">
      <!-- ===== 数字 ===== -->
      <label class="cf__row" :class="{ 'cf__row--selected': isSelected }">
        <span class="cf__label">{{ label || labelFor(path.split('.').pop()) }}</span>
        <input
          class="glass-input cf__input cf__input--num"
          :data-content-path="path"
          type="number"
          :value="value()"
          @focus="beginEdit"
          @input="write(Number($event.target.value) || 0)"
          @blur="finishEdit"
        />
      </label>
    </template>

    <template v-else>
      <!-- ===== 字符串 ===== -->
      <label class="cf__row" :class="{ 'cf__row--indent': isIndexLeaf(path), 'cf__row--selected': isSelected }">
        <span class="cf__label">{{ label || labelFor(path.split('.').pop()) }}</span>
        <input
          class="glass-input cf__input"
          :data-content-path="path"
          type="text"
          :value="value() ?? ''"
          @focus="beginEdit"
          @input="write($event.target.value)"
          @blur="finishEdit"
        />
      </label>
    </template>
  </div>
</template>

<style scoped>
.cf { width: 100%; }
.cf--d1 { padding-left: var(--space-2); }
.cf--d2 { padding-left: var(--space-3); }
.cf--d3 { padding-left: var(--space-4); }

/* ---------- 行：标签 + 控件 ---------- */
.cf__row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.cf__row--switch { justify-content: space-between; }
.cf__label {
  flex-shrink: 0;
  width: 92px;
  font-size: var(--fs-xs);
  color: var(--text-muted);
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cf__input {
  flex: 1;
  min-width: 0;
  padding: var(--space-1) var(--space-3);
  font-size: var(--fs-sm);
  border-radius: var(--radius-sm);
}
.cf__input--num { width: 88px; flex: 0 0 88px; }
.cf__row--indent .cf__label { width: 72px; }

/* ---------- 分组 ---------- */
.cf__group { margin-bottom: var(--space-2); }
.cf__group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}
.cf__group-title {
  margin: var(--space-2) 0;
  font-size: var(--fs-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
}
.cf__empty {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  padding: var(--space-2) 0;
}

/* ---------- 列表项卡片 ---------- */
.cf__item {
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  background: var(--glass-bg);
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-2);
}
.cf__item-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-1);
}
.cf__item-index {
  font-size: var(--fs-xs);
  font-family: var(--font-mono);
  color: var(--accent-cyan);
}
.cf__item-body { display: flex; flex-direction: column; gap: 0; }

/* ---------- 添加 / 删除 ---------- */
.cf__add {
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--accent-cyan);
  padding: 2px 8px;
  border: 1px dashed var(--glass-border-hover);
  border-radius: var(--radius-pill);
  transition: background var(--dur-fast) var(--ease-out);
}
.cf__add:hover { background: var(--glass-bg-hover); }
.cf__remove {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-xs);
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  transition: color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}
.cf__remove:hover { color: var(--danger); background: var(--glass-bg-hover); }

/* ---------- 开关 ---------- */
.cf__switch {
  position: relative;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
  border-radius: var(--radius-pill);
  background: var(--track-bg);
  border: 1px solid var(--glass-border);
  transition: background var(--dur-fast) var(--ease-out);
}
.cf__switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--text-secondary);
  transition: transform var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}
.cf__switch--on { background: var(--accent-gradient); border-color: transparent; }
.cf__switch--on .cf__switch-knob {
  transform: translateX(18px);
  background: var(--on-accent);
}

/* ---------- 选中字段高亮（需求 4：点页面元素 → 控制台定位对应输入框） ---------- */
.cf__row--selected {
  border-radius: var(--radius-sm);
  background: rgba(55, 217, 242, 0.08);
  box-shadow: inset 0 0 0 1px rgba(55, 217, 242, 0.3);
}

/* ---------- 呼吸闪烁提示（需求 4：闪 2 下、低亮度柔和 cyan） ---------- */
@keyframes cf-flash {
  0%, 100% { box-shadow: 0 0 0 0 rgba(55, 217, 242, 0); border-color: var(--glass-border); }
  20%      { box-shadow: 0 0 0 3px rgba(55, 217, 242, 0.22); border-color: rgba(55, 217, 242, 0.55); }
  40%      { box-shadow: 0 0 0 0 rgba(55, 217, 242, 0); border-color: var(--glass-border); }
  60%      { box-shadow: 0 0 0 3px rgba(55, 217, 242, 0.22); border-color: rgba(55, 217, 242, 0.55); }
  80%      { box-shadow: 0 0 0 0 rgba(55, 217, 242, 0); border-color: var(--glass-border); }
}
.cf__input.flash-hint {
  animation: cf-flash 1.15s ease-out 1;
}

@media (prefers-reduced-motion: reduce) {
  .cf__input.flash-hint { animation: none; }
}
</style>
