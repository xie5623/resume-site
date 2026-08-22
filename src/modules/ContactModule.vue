<script setup>
/**
 * ContactModule — 联系方式（占位内容）
 * 契约：props = { config, lang }；revealed 由 App 装配层驱动 + TextReveal。
 * 布局变体：'a' 左右分栏（默认）｜'b' 链接在上、表单在下｜'c' 居中单栏
 */
import { computed, ref } from 'vue'
import { useModuleReveal } from '@/composables/moduleReveal'
import { useVersion } from '@/composables/useVersion'
import TextReveal from '@/components/TextReveal.vue'

const props = defineProps({
  config: { type: Object, required: true },
  lang: { type: String, default: 'zh' }
})

/* ---------- 按版本分区双语词典（键名按模块命名空间） ---------- */
const DICT = {
  /* ---------- 资深版 ---------- */
  senior: {
    zh: {
      'contact.title': '联系方式',
      'contact.subtitle': '欢迎交流合作（占位示例）',
      'contact.linksHead': '直达通道',
      'contact.email': '邮箱',
      'contact.wechat': '微信',
      'contact.phone': '电话',
      'contact.github': 'GitHub',
      'contact.formHead': '给我留言',
      'contact.formName': '姓名',
      'contact.formNamePh': '请输入您的姓名',
      'contact.formEmail': '邮箱',
      'contact.formEmailPh': 'you@example.com',
      'contact.formMessage': '留言内容',
      'contact.formMessagePh': '简单介绍一下您的需求…',
      'contact.formSubmit': '发送留言',
      'contact.formHint': '表单为占位示例，点击不会真的提交。',
      'contact.formDone': '已收到！(占位提示：演示环境未发送)',
      'contact.value1': 'hello@example.com',
      'contact.value2': 'YourWeChatID',
      'contact.value3': '+86 138 0000 0000',
      'contact.value4': 'github.com/yourname'
    },
    en: {
      'contact.title': 'Contact',
      'contact.subtitle': "Let's connect (placeholder)",
      'contact.linksHead': 'Direct channels',
      'contact.email': 'Email',
      'contact.wechat': 'WeChat',
      'contact.phone': 'Phone',
      'contact.github': 'GitHub',
      'contact.formHead': 'Send a message',
      'contact.formName': 'Name',
      'contact.formNamePh': 'Your name',
      'contact.formEmail': 'Email',
      'contact.formEmailPh': 'you@example.com',
      'contact.formMessage': 'Message',
      'contact.formMessagePh': 'Briefly describe what you need…',
      'contact.formSubmit': 'Send message',
      'contact.formHint': 'This form is a placeholder — nothing is submitted.',
      'contact.formDone': 'Received! (placeholder: nothing was sent)',
      'contact.value1': 'hello@example.com',
      'contact.value2': 'YourWeChatID',
      'contact.value3': '+86 138 0000 0000',
      'contact.value4': 'github.com/yourname'
    }
  },

  /* ---------- 应届生版：校招 / 实习语境 ---------- */
  graduate: {
    zh: {
      'contact.title': '联系方式',
      'contact.subtitle': '期待加入你的团队（占位示例）',
      'contact.linksHead': '直达通道',
      'contact.email': '邮箱',
      'contact.wechat': '微信',
      'contact.phone': '电话',
      'contact.github': 'GitHub',
      'contact.formHead': '给我留言',
      'contact.formName': '姓名',
      'contact.formNamePh': '请输入您的姓名',
      'contact.formEmail': '邮箱',
      'contact.formEmailPh': 'you@example.com',
      'contact.formMessage': '留言内容',
      'contact.formMessagePh': '简单介绍一下校招或实习机会…',
      'contact.formSubmit': '发送留言',
      'contact.formHint': '表单为占位示例，点击不会真的提交。',
      'contact.formDone': '已收到！(占位提示：演示环境未发送)',
      'contact.value1': 'hello@example.com',
      'contact.value2': 'YourWeChatID',
      'contact.value3': '+86 138 0000 0000',
      'contact.value4': 'github.com/yourname'
    },
    en: {
      'contact.title': 'Contact',
      'contact.subtitle': "I'd love to join your team (placeholder)",
      'contact.linksHead': 'Direct channels',
      'contact.email': 'Email',
      'contact.wechat': 'WeChat',
      'contact.phone': 'Phone',
      'contact.github': 'GitHub',
      'contact.formHead': 'Send a message',
      'contact.formName': 'Name',
      'contact.formNamePh': 'Your name',
      'contact.formEmail': 'Email',
      'contact.formEmailPh': 'you@example.com',
      'contact.formMessage': 'Message',
      'contact.formMessagePh': 'Briefly describe the new-grad or intern opportunity…',
      'contact.formSubmit': 'Send message',
      'contact.formHint': 'This form is a placeholder — nothing is submitted.',
      'contact.formDone': 'Received! (placeholder: nothing was sent)',
      'contact.value1': 'hello@example.com',
      'contact.value2': 'YourWeChatID',
      'contact.value3': '+86 138 0000 0000',
      'contact.value4': 'github.com/yourname'
    }
  }
}

/* t('contact.*') 自动跟随版本：当前版本 → 资深版兜底 → key */
const { version } = useVersion()
const t = (key) => (
  DICT[version.value]?.[props.lang]?.[key]
  ?? DICT.senior?.[props.lang]?.[key]
  ?? DICT.senior?.zh?.[key]
  ?? key
)

const channels = computed(() => [
  { icon: 'mail', label: t('contact.email'), value: t('contact.value1'), href: 'mailto:hello@example.com' },
  { icon: 'chat', label: t('contact.wechat'), value: t('contact.value2'), href: '#' },
  { icon: 'phone', label: t('contact.phone'), value: t('contact.value3'), href: '#' },
  { icon: 'github', label: t('contact.github'), value: t('contact.value4'), href: 'https://github.com/' }
])

/* ---------- 入场状态（revealed 由 App 装配层 ModuleSection 驱动） ---------- */
const revealed = useModuleReveal(props.config.id)
const variant = computed(() => (['a', 'b', 'c'].includes(props.config.variant) ? props.config.variant : 'a'))

/* ---------- 表单占位：不提交 ---------- */
const sent = ref(false)
function onSubmit() {
  sent.value = true
}
</script>

<template>
  <section
    class="contact container"
    :data-revealed="revealed ? 'yes' : 'no'"
    :class="`contact--${variant}`"
  >
    <header class="module__head">
      <span class="module__kicker">CONTACT</span>
      <h2 class="module__title" :class="{ 'text-emphasize': config.emphasize }">
        <TextReveal :anim="config.textAnim" :text="t('contact.title')" :delay="0.05" />
      </h2>
      <p class="module__subtitle">
        <TextReveal :anim="config.textAnim" :text="t('contact.subtitle')" :delay="0.25" />
      </p>
    </header>

    <div class="contact__layout">
      <!-- 直达通道 -->
      <div class="contact__channels">
        <h3 class="contact__subhead">{{ t('contact.linksHead') }}</h3>
        <div class="contact__link-grid">
          <a
            v-for="(ch, i) in channels"
            :key="ch.label"
            class="glass contact__link"
            :href="ch.href"
            :aria-label="`${ch.label}: ${ch.value}`"
            :target="ch.href.startsWith('http') ? '_blank' : undefined"
            :rel="ch.href.startsWith('http') ? 'noopener noreferrer' : undefined"
            :style="{ '--i': i }"
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
              <span class="contact__label">{{ ch.label }}</span>
              <span class="contact__value">{{ ch.value }}</span>
            </span>
          </a>
        </div>
      </div>

      <!-- 留言表单（占位，不提交） -->
      <div class="glass glass--strong contact__form-panel">
        <h3 class="contact__subhead">{{ t('contact.formHead') }}</h3>
        <form class="contact__form" @submit.prevent="onSubmit">
          <label class="contact__field">
            <span class="contact__field-label">{{ t('contact.formName') }}</span>
            <input class="glass-input" type="text" name="name" autocomplete="name"
                   :placeholder="t('contact.formNamePh')" />
          </label>
          <label class="contact__field">
            <span class="contact__field-label">{{ t('contact.formEmail') }}</span>
            <input class="glass-input" type="email" name="email" autocomplete="email"
                   :placeholder="t('contact.formEmailPh')" />
          </label>
          <label class="contact__field">
            <span class="contact__field-label">{{ t('contact.formMessage') }}</span>
            <textarea class="glass-input contact__textarea" name="message" rows="4"
                      :placeholder="t('contact.formMessagePh')"></textarea>
          </label>
          <button class="glass-btn glass-btn--accent contact__submit" type="submit">
            {{ t('contact.formSubmit') }}
          </button>
          <p v-if="sent" class="contact__done" role="status">{{ t('contact.formDone') }}</p>
          <p class="contact__hint">{{ t('contact.formHint') }}</p>
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
</style>
