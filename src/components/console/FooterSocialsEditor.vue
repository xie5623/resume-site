<script setup>
/**
 * FooterSocialsEditor — 页脚社交图标编辑器（需求 2）
 * ------------------------------------------------------------
 * 在编辑面板「页脚」模块下提供：
 *   - 预设平台快捷添加：GitHub / X / LinkedIn / B站 / 小红书 / 抖音 / CSDN
 *     （已在列表中的预设显示为「已添加」）
 *   - 自定义上传图标：选图片 → base64 dataURL 存入 → 主题色剪影渲染
 *   - 每项：名称 / 链接 URL / 上传或替换图标 / 删除
 *   - 上移 / 下移排序
 * 数据：写入内容层 footer.socials（数组），跟随模板+语言；成品页只显示
 * 有 url 的项，url 留空 = 编辑中未填。
 */
import { ref, computed } from 'vue'
import { useVersion } from '@/composables/useVersion'
import { useContent } from '@/content/useContent'
import { SOCIAL_PRESETS, SOCIAL_PRESET_MAP } from '@/config/socialPresets'

const props = defineProps({
  moduleId: { type: String, default: 'footer' },
  lang: { type: String, default: 'zh' }
})

const { version } = useVersion()
const { get, setContent } = useContent()

const list = computed(() => {
  const v = get(version.value, props.lang, `footer.socials`)
  return Array.isArray(v) ? v : []
})

/* 预设是否已在列表中（按 id 去重） */
const usedIds = computed(() => new Set(list.value.map((s) => s?.id)))

/* ---------- 写入整数组（保持响应式 + 持久化） ---------- */
function write(next) {
  setContent(version.value, props.lang, 'footer.socials', next)
}

function addPreset(id) {
  const preset = SOCIAL_PRESET_MAP[id]
  if (!preset || usedIds.value.has(id)) return
  write([...list.value, { id, label: preset.label, url: preset.url }])
}

function updateItem(idx, patch) {
  const next = list.value.map((s, i) => (i === idx ? { ...s, ...patch } : s))
  write(next)
}

function removeItem(idx) {
  write(list.value.filter((_, i) => i !== idx))
}

function move(idx, delta) {
  const next = [...list.value]
  const target = idx + delta
  if (target < 0 || target >= next.length) return
  ;[next[idx], next[target]] = [next[target], next[idx]]
  write(next)
}

/* ---------- 自定义图标上传：FileReader → base64 dataURL ---------- */
const fileInputs = ref({})
function onPickFile(idx, e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      updateItem(idx, { id: 'custom', icon: reader.result })
    }
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}
function triggerFile(idx) {
  const inp = fileInputs.value[idx]
  if (inp) inp.click()
}

/* ---------- 文案 ---------- */
const l = {
  title: { zh: '页脚社交图标', en: 'Footer social icons' },
  hint: { zh: '点预设图标一键添加；链接留空则不显示；自定义可上传自己的图标（自动贴合主题色）', en: 'Tap a preset to add it; empty URL hides the icon; upload your own icon (auto-tinted to the theme)' },
  presets: { zh: '预设平台', en: 'Presets' },
  added: { zh: '已添加', en: 'Added' },
  name: { zh: '名称', en: 'Name' },
  url: { zh: '链接 URL', en: 'Link URL' },
  icon: { zh: '图标', en: 'Icon' },
  upload: { zh: '上传图标', en: 'Upload icon' },
  replace: { zh: '替换', en: 'Replace' },
  customLabel: { zh: '自定义图标', en: 'Custom icon' },
  remove: { zh: '删除', en: 'Remove' }
}

function labelText(k) {
  const o = l[k]
  return o ? (o[props.lang] ?? o.zh) : k
}
</script>

<template>
  <div class="fse">
    <div class="fse__head">
      <span class="fse__title">{{ labelText('title') }}</span>
    </div>
    <p class="fse__hint">{{ labelText('hint') }}</p>

    <!-- 预设平台快速添加 -->
    <div class="fse__presets">
      <span class="fse__label">{{ labelText('presets') }}</span>
      <div class="fse__preset-grid">
        <button
          v-for="p in SOCIAL_PRESETS"
          :key="p.id"
          type="button"
          class="fse__preset"
          :class="{ 'fse__preset--used': usedIds.has(p.id) }"
          :title="p.label"
          :disabled="usedIds.has(p.id)"
          @click="addPreset(p.id)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path :d="p.path"></path>
          </svg>
          <span class="fse__preset-name">{{ p.label }}</span>
        </button>
      </div>
    </div>

    <!-- 已添加列表 -->
    <div v-if="list.length" class="fse__list">
      <div v-for="(s, idx) in list" :key="idx" class="fse__item">
        <div class="fse__item-head">
          <span class="fse__item-icon">
            <svg v-if="SOCIAL_PRESET_MAP[s.id]" viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
              <path :d="SOCIAL_PRESET_MAP[s.id].path"></path>
            </svg>
            <span v-else-if="s.icon" class="fse__item-icon-custom" :style="{ '--s-icon': `url(${s.icon})` }"></span>
            <span v-else class="fse__item-icon-txt">{{ String(s.label || '?').slice(0, 1) }}</span>
          </span>
          <span class="fse__item-name">{{ s.label }}</span>
          <span class="fse__item-actions">
            <button type="button" class="fse__btn" :disabled="idx === 0" @click="move(idx, -1)" title="上移">↑</button>
            <button type="button" class="fse__btn" :disabled="idx === list.length - 1" @click="move(idx, 1)" title="下移">↓</button>
            <button type="button" class="fse__btn fse__btn--danger" @click="removeItem(idx)" :title="labelText('remove')">✕</button>
          </span>
        </div>

        <label class="fse__field">
          <span class="fse__field-label">{{ labelText('name') }}</span>
          <input class="glass-input fse__input" type="text" :value="s.label"
                 @input="updateItem(idx, { label: $event.target.value })" />
        </label>
        <label class="fse__field">
          <span class="fse__field-label">{{ labelText('url') }}</span>
          <input class="glass-input fse__input" type="text" :value="s.url" placeholder="https://…"
                 @input="updateItem(idx, { url: $event.target.value })" />
        </label>

        <div class="fse__icon-row">
          <input
            ref="fileInputs"
            class="fse__file-input"
            type="file"
            accept="image/*"
            :data-idx="idx"
            @change="onPickFile(idx, $event)"
          />
          <button type="button" class="fse__upload-btn" @click="triggerFile(idx)">
            {{ s.icon ? labelText('replace') : labelText('upload') }}
          </button>
          <span v-if="s.icon" class="fse__custom-badge">{{ labelText('customLabel') }}</span>
        </div>
      </div>
    </div>
    <p v-else class="fse__empty">{{ { zh: '（尚未添加任何社交图标）', en: '(No social icons yet)' }[lang] }}</p>
  </div>
</template>

<style scoped>
.fse { display: flex; flex-direction: column; gap: var(--space-3); }
.fse__head { display: flex; align-items: center; justify-content: space-between; }
.fse__title {
  font-size: var(--fs-sm);
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--accent-cyan);
}
.fse__hint {
  margin: 0;
  font-size: var(--fs-xs);
  color: var(--text-muted);
  line-height: 1.5;
}
.fse__label {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

/* 预设网格 */
.fse__preset-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-top: var(--space-1);
}
.fse__preset {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 2px;
  font-size: 10px;
  color: var(--text-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  background: var(--glass-bg);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
}
.fse__preset:hover:not(:disabled) {
  color: var(--accent-cyan);
  border-color: var(--glass-border-hover);
  background: var(--glass-bg-hover);
}
.fse__preset--used { opacity: 0.35; cursor: default; }
.fse__preset-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 列表 */
.fse__list { display: flex; flex-direction: column; gap: var(--space-3); }
.fse__item {
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  background: var(--glass-bg);
  padding: var(--space-2) var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.fse__item-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.fse__item-icon {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  color: var(--accent-cyan);
  border-radius: var(--radius-sm);
  background: var(--glass-bg-strong);
  border: 1px solid var(--glass-border);
}
.fse__item-icon-custom {
  width: 15px;
  height: 15px;
  display: block;
  background-color: currentColor;
  -webkit-mask: var(--s-icon) no-repeat center / contain;
  mask: var(--s-icon) no-repeat center / contain;
}
.fse__item-icon-txt { font-size: 12px; font-weight: 800; }
.fse__item-name {
  flex: 1;
  min-width: 0;
  font-size: var(--fs-sm);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fse__item-actions { display: flex; gap: 4px; }
.fse__btn {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-xs);
  color: var(--text-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  background: var(--glass-bg-strong);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
}
.fse__btn:hover:not(:disabled) { color: var(--accent-cyan); border-color: var(--glass-border-hover); }
.fse__btn:disabled { opacity: 0.3; cursor: default; }
.fse__btn--danger:hover:not(:disabled) { color: var(--danger); border-color: var(--danger); }

.fse__field { display: flex; align-items: center; gap: var(--space-2); }
.fse__field-label { flex-shrink: 0; width: 64px; font-size: var(--fs-xs); color: var(--text-muted); }
.fse__input { flex: 1; min-width: 0; padding: var(--space-1) var(--space-2); font-size: var(--fs-xs); }

.fse__icon-row { display: flex; align-items: center; gap: var(--space-2); }
.fse__file-input { display: none; }
.fse__upload-btn {
  padding: 3px 10px;
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--text-secondary);
  border: 1px dashed var(--glass-border-hover);
  border-radius: var(--radius-pill);
  background: transparent;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
}
.fse__upload-btn:hover { color: var(--accent-cyan); border-color: var(--accent-cyan); }
.fse__custom-badge {
  font-size: 10px;
  color: var(--text-muted);
  padding: 1px 8px;
  border: 1px dashed var(--glass-border);
  border-radius: var(--radius-pill);
}
.fse__empty {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  padding: var(--space-2) 0;
}
</style>
