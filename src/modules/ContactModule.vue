<script setup>
/**
 * ContactModule — 联系方式（占位内容）
 * 契约：props = { config, lang }；revealed 由 App 装配层驱动 + TextReveal。
 * 布局变体：'a' 左右分栏（默认）｜'b' 链接在上、表单在下｜'c' 居中单栏
 */
import { computed, ref } from 'vue'
import { useModuleReveal } from '@/composables/moduleReveal'
import { useVersion } from '@/composables/useVersion'
import { useContent } from '@/content/useContent'
import TextReveal from '@/components/TextReveal.vue'
import { useEditableElement } from '@/composables/useEditableElement'
import { useDeviceLayout } from '@/composables/useDeviceLayout'

const props = defineProps({
  config: { type: Object, required: true },
  lang: { type: String, default: 'zh' }
})

/* ===================== 双端布局（DEVICE 维度）：有效设备 → is-mobile 类 ===================== */
const { deviceCls } = useDeviceLayout()

/* ===================== 可编辑元素注册（需求 4：标记 + 注册表） ===================== */
const { ed } = useEditableElement(props.config.id, [
  { key: 'kicker', label: { zh: '眉标', en: 'Kicker' }, type: 'text' },
  { key: 'title', label: { zh: '标题', en: 'Title' }, type: 'text' },
  { key: 'subtitle', label: { zh: '副标题', en: 'Subtitle' }, type: 'text' },
  { key: 'linksHead', label: { zh: '直达通道标题', en: 'Links heading' }, type: 'text' },
  { key: 'email', label: { zh: '邮箱标签', en: 'Email label' }, type: 'text' },
  { key: 'wechat', label: { zh: '微信标签', en: 'WeChat label' }, type: 'text' },
  { key: 'phone', label: { zh: '电话标签', en: 'Phone label' }, type: 'text' },
  { key: 'github', label: { zh: 'GitHub 标签', en: 'GitHub label' }, type: 'text' },
  { key: 'values', label: { zh: '联系值列表', en: 'Contact values' }, type: 'list' },
  { key: 'formHead', label: { zh: '表单标题', en: 'Form heading' }, type: 'text' },
  { key: 'formName', label: { zh: '姓名字段', en: 'Name field' }, type: 'text' },
  { key: 'formEmail', label: { zh: '邮箱字段', en: 'Email field' }, type: 'text' },
  { key: 'formMessage', label: { zh: '留言字段', en: 'Message field' }, type: 'text' },
  { key: 'formSubmit', label: { zh: '提交按钮', en: 'Submit button' }, type: 'text' },
  { key: 'formDone', label: { zh: '提交成功提示', en: 'Done message' }, type: 'text' },
  { key: 'formHint', label: { zh: '表单提示', en: 'Form hint' }, type: 'text' }
])

/* ===================== 内容层（contact 命名空间，跟随模板+语言，可运行时编辑） ===================== */
const { version } = useVersion()
const { get } = useContent()
const T = (key) => get(version.value, props.lang, `contact.${key}`)

/* ===================== 直达通道（需求 1：真正可用） =====================
   values = [邮箱, 微信, 电话, GitHub]
   每个通道点击动作：
     - 邮箱：复制邮箱到剪贴板（提示）+ 长按也可；成品态点击即复制
     - 微信：复制微信号
     - 电话：手机端 tel: 直拨；桌面端复制号码
     - GitHub：跳转（用户可编辑 URL 前缀）
   编辑态（body.editing）点击交给 v-editable 选中，不触发复制。 */
const channels = computed(() => {
  const values = Array.isArray(T('values')) ? T('values') : []
  return [
    { icon: 'mail', key: 'email', label: T('email'), value: values[0] ?? '', kind: 'copy', copyHint: T('email') + ' ✓' },
    { icon: 'chat', key: 'wechat', label: T('wechat'), value: values[1] ?? '', kind: 'copy', copyHint: T('wechat') + ' ✓' },
    { icon: 'phone', key: 'phone', label: T('phone'), value: values[2] ?? '', kind: 'tel', copyHint: T('phone') + ' ✓' },
    { icon: 'github', key: 'github', label: T('github'), value: values[3] ?? '', kind: 'link', copyHint: 'GitHub ↗' }
  ]
})

/* 复制反馈：点通道后短暂显示「已复制」 */
const copiedKey = ref(null)
let copyTimer = null
function copyText(text) {
  if (!text || typeof navigator === 'undefined') return false
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text))
  } else {
    fallbackCopy(text)
  }
  return true
}
function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  } catch (_) { /* ignore */ }
}
function onChannelClick(ch, e) {
  if (typeof document !== 'undefined' && document.body?.classList.contains('editing')) return /* 编辑态：交给 v-editable */
  if (!ch.value) return
  if (ch.kind === 'link') {
    window.open('https://github.com/' + ch.value, '_blank', 'noopener')
    return
  }
  if (ch.kind === 'tel' && /Mobi|Android|iPhone/i.test(navigator.userAgent || '')) {
    /* 手机端：tel: 直拨 */
    window.location.href = `tel:${ch.value.replace(/[^\d+]/g, '')}`
    return
  }
  /* 默认：复制 */
  copyText(ch.value)
  copiedKey.value = ch.key
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copiedKey.value = null }, 1600)
}

/* ===================== 留言表单（需求 1：真正能发） =====================
   提交 → 打开系统邮件客户端 mailto:，预填收件人（作者邮箱 values[0]）、
   主题、正文（姓名 + 回邮 + 留言）→ 访客点发送即真实送达作者邮箱。
   零后端、零配置，只要作者在控制台填了自己的邮箱。 */
const form = ref({ name: '', email: '', message: '' })
const sent = ref(false)
function onSubmit() {
  const to = (Array.isArray(T('values')) ? T('values')[0] : '') || ''
  const subject = encodeURIComponent(`来自 ${form.value.name || '访客'} 的留言`)
  const body = encodeURIComponent(
    `姓名：${form.value.name}\n回邮：${form.value.email}\n\n${form.value.message}`
  )
  if (to) {
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`
  }
  sent.value = true
}

/* ---------- 入场状态（revealed 由 App 装配层 ModuleSection 驱动） ---------- */
const revealed = useModuleReveal(props.config.id)
const variant = computed(() => (['a', 'b', 'c'].includes(props.config.variant) ? props.config.variant : 'a'))
</script>

<template>
  <section
    class="contact container"
    :data-revealed="revealed ? 'yes' : 'no'"
    :class="[deviceCls, `contact--${variant}`]"
  >
    <header class="module__head">
      <span class="module__kicker" v-editable="ed('kicker')">{{ T('kicker') }}</span>
      <h2 class="module__title" :class="{ 'text-emphasize': config.emphasize }" v-editable="ed('title')" v-element-style="'title'">
        <TextReveal :anim="config.textAnim" :text="T('title')" :delay="0.05" />
      </h2>
      <p class="module__subtitle" v-editable="ed('subtitle')">
        <TextReveal :anim="config.textAnim" :text="T('subtitle')" :delay="0.25" />
      </p>
    </header>

    <div class="contact__layout">
      <!-- 直达通道 -->
      <div class="contact__channels">
        <h3 class="contact__subhead" v-editable="ed('linksHead')">{{ T('linksHead') }}</h3>
        <div class="contact__link-grid">
          <div
            v-for="(ch, i) in channels"
            :key="ch.key"
            class="glass contact__link"
            role="button"
            tabindex="0"
            :aria-label="`${ch.label}: ${ch.value}`"
            :style="{ '--i': i }"
            @click="onChannelClick(ch, $event)"
            @keydown.enter="onChannelClick(ch, $event)"
          >
            <span class="contact__icon" aria-hidden="true">
              <!-- 邮箱 -->
              <svg v-if="ch.icon === 'mail'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="M22 6l-10 7L2 6"></path>
              </svg>
              <!-- 微信/聊天 -->
              <svg v-else-if="ch.icon === 'chat'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              <!-- 电话 -->
              <svg v-else-if="ch.icon === 'phone'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <!-- GitHub -->
              <svg v-else-if="ch.icon === 'github'" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"></path>
              </svg>
            </span>
            <span class="contact__link-text">
              <span class="contact__label" v-editable="ed(ch.key)">{{ ch.label }}</span>
              <span class="contact__value" v-editable="ed('values')">{{ copiedKey === ch.key ? ch.copyHint : ch.value }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- 留言表单（需求 1：提交 → 打开邮件客户端真实发信） -->
      <div class="glass glass--strong contact__form-panel">
        <h3 class="contact__subhead" v-editable="ed('formHead')">{{ T('formHead') }}</h3>
        <form class="contact__form" @submit.prevent="onSubmit">
          <label class="contact__field">
            <span class="contact__field-label" v-editable="ed('formName')">{{ T('formName') }}</span>
            <input class="glass-input" type="text" name="name" autocomplete="name"
                   :placeholder="T('formNamePh')" v-model="form.name" required />
          </label>
          <label class="contact__field">
            <span class="contact__field-label" v-editable="ed('formEmail')">{{ T('formEmail') }}</span>
            <input class="glass-input" type="email" name="email" autocomplete="email"
                   :placeholder="T('formEmailPh')" v-model="form.email" />
          </label>
          <label class="contact__field">
            <span class="contact__field-label" v-editable="ed('formMessage')">{{ T('formMessage') }}</span>
            <textarea class="glass-input contact__textarea" name="message" rows="4"
                      :placeholder="T('formMessagePh')" v-model="form.message" required></textarea>
          </label>
          <button class="glass-btn glass-btn--accent contact__submit" type="submit" v-editable="ed('formSubmit')">
            {{ T('formSubmit') }}
          </button>
          <p v-if="sent" class="contact__done" role="status" v-editable="ed('formDone')">{{ T('formDone') }}</p>
          <p class="contact__hint" v-editable="ed('formHint')">{{ T('formHint') }}</p>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.contact {
  padding: var(--space-10) 0;
}

/* ---------- 模块头 ---------- */
.module__head {
  margin-bottom: var(--space-8);
}
.module__kicker {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--accent-cyan);
  background: var(--accent-cyan-soft);
  border: 1px solid var(--glass-border);
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  margin-bottom: var(--space-3);
}
.module__title {
  font-size: calc(var(--fs-xl) * var(--fs-scale, 1));
  margin-bottom: var(--space-2);
}
.module__subtitle {
  font-size: calc(var(--fs-md) * var(--fs-scale, 1));
  color: var(--text-secondary);
  margin: 0;
}
.contact__subhead {
  font-size: calc(var(--fs-md) * var(--fs-scale, 1));
  margin-bottom: var(--space-4);
}

/* ---------- 布局 ---------- */
.contact__layout {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: var(--space-6);
  align-items: start;
}

/* ---------- 链接网格 ---------- */
.contact__link-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
}
.contact__link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  color: var(--text-primary);
  text-decoration: none;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out),
              background var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
}
.contact[data-revealed='yes'] .contact__link {
  opacity: 1;
  transform: none;
}
.contact[data-revealed='yes'] .contact__link {
  transition-delay: calc(0.08s + var(--i, 0) * 0.08s);
}
.contact__link:hover {
  color: var(--accent-cyan);
  border-color: var(--glass-border-hover);
}
.contact__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  color: var(--accent-cyan);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
}
.contact__link-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.contact__label {
  font-size: var(--fs-xs);
  color: var(--text-muted);
  font-family: var(--font-mono);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.contact__value {
  font-size: calc(var(--fs-sm) * var(--fs-scale, 1));
  color: var(--text-secondary);
  /* 仅在必要时断行，避免邮箱/GitHub 长串被 break-all 硬切 */
  overflow-wrap: anywhere;
}
.contact__link:hover .contact__value {
  color: var(--text-primary);
}

/* ---------- 表单面板 ---------- */
.contact__form-panel {
  padding: var(--space-6);
}
.contact__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.contact__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.contact__field-label {
  font-size: var(--fs-sm);
  color: var(--text-secondary);
}
.contact__textarea {
  resize: vertical;
  min-height: 96px;
  font-family: inherit;
}
.contact__submit {
  align-self: flex-start;
}
.contact__done {
  margin: 0;
  color: var(--success);
  font-size: var(--fs-sm);
}
.contact__hint {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

/* ---------- 变体 b：链接在上、表单在下 ---------- */
.contact--b .contact__layout {
  grid-template-columns: 1fr;
}
.contact--b .contact__link-grid {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

/* ---------- 变体 c：居中单栏 ---------- */
.contact--c .module__head {
  text-align: center;
}
.contact--c .contact__layout {
  grid-template-columns: 1fr;
  max-width: 560px;
  margin-inline: auto;
}

/* ---------- 移动端 ---------- */
@media (max-width: 820px) {
  .contact__layout {
    grid-template-columns: 1fr;
  }
}

/* ==================== 手机端布局（DEVICE 维度） ==================== */
.contact.is-mobile { padding: var(--space-6) 0; }
.contact.is-mobile .module__head { margin-bottom: var(--space-6); }
.contact.is-mobile .module__title { font-size: calc(var(--fs-xl) * var(--fs-scale, 1)); }
.contact.is-mobile .contact__layout { grid-template-columns: 1fr; gap: var(--space-5); }
.contact.is-mobile .contact__link-grid { grid-template-columns: 1fr; gap: var(--space-3); }
.contact.is-mobile .contact__link { padding: var(--space-3); }
.contact.is-mobile .contact__form-panel { padding: var(--space-5); }
.contact.is-mobile .contact__submit { width: 100%; text-align: center; justify-content: center; }
</style>
