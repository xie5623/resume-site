<script setup>
/**
 * FooterModule — 页脚（占位内容）
 * 契约：props = { config, lang }；revealed 由 App 装配层驱动 + TextReveal。
 * 默认配置 animation:'none' / textAnim:'none'（见 site.config.js），
 * 因此这里以静态展示为主，回到顶部按钮仍带平滑滚动。
 */
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
  { key: 'name', label: { zh: '品牌名', en: 'Brand name' }, type: 'text' },
  { key: 'tagline', label: { zh: '标语', en: 'Tagline' }, type: 'text' },
  { key: 'rights', label: { zh: '版权', en: 'Rights' }, type: 'text' },
  { key: 'madeWith', label: { zh: '制作说明', en: 'Made with' }, type: 'text' },
  { key: 'backToTop', label: { zh: '回到顶部', en: 'Back to top' }, type: 'text' }
])

/* ===================== 内容层（footer 命名空间，跟随模板+语言，可运行时编辑） ===================== */
const { version } = useVersion()
const { get } = useContent()
const T = (key) => get(version.value, props.lang, `footer.${key}`)

const socials = [
  {
    label: 'GitHub',
    href: 'https://github.com/',
    path: 'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z'
  },
  {
    label: 'X (Twitter)',
    href: 'https://x.com/',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z'
  }
]

const year = new Date().getFullYear()

/* ---------- 入场状态（'none' 时 App 装配层立即标记 revealed） ---------- */
const revealed = useModuleReveal(props.config.id)

function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <footer
    class="footer container"
    :class="deviceCls"
    :data-revealed="revealed ? 'yes' : 'no'"
  >
    <div class="footer__top">
      <!-- 品牌与标语 -->
      <div class="footer__brand">
        <span class="footer__name" :class="{ 'text-emphasize': config.emphasize }" v-editable="ed('name')">
          <TextReveal :anim="config.textAnim" :text="T('name')" :delay="0.05" />
        </span>
        <p class="footer__tagline" v-editable="ed('tagline')">
          <TextReveal :anim="config.textAnim" :text="T('tagline')" :delay="0.2" />
        </p>
      </div>

      <!-- 社交图标 -->
      <ul class="footer__socials" aria-label="社交链接">
        <li v-for="s in socials" :key="s.label">
          <a class="footer__social" :href="s.href" target="_blank" rel="noopener noreferrer"
             :aria-label="s.label" :title="s.label">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path :d="s.path"></path>
            </svg>
          </a>
        </li>
      </ul>

      <!-- 回到顶部 -->
      <button class="glass-btn footer__top" type="button" @click="backToTop" v-editable="ed('backToTop')">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 19V5M5 12l7-7 7 7"></path>
        </svg>
        {{ T('backToTop') }}
      </button>
    </div>

    <div class="footer__bottom">
      <p class="footer__copy" v-editable="ed('rights')">
        © {{ year }} {{ T('name') }} · {{ T('rights') }}
      </p>
      <p class="footer__made" v-editable="ed('madeWith')">{{ T('madeWith') }}</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  padding: var(--space-8) 0 var(--space-6);
  border-top: 1px solid var(--glass-border);
  background: linear-gradient(180deg, transparent 0%, var(--bg-deep) 90%);
}

.footer__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-5);
  flex-wrap: wrap;
  margin-bottom: var(--space-6);
}

.footer__brand {
  min-width: 0;
}
.footer__name {
  font-size: calc(var(--fs-lg) * var(--fs-scale, 1));
  font-weight: 800;
  display: inline-block;
}
.footer__tagline {
  margin: var(--space-2) 0 0;
  color: var(--text-muted);
  font-size: calc(var(--fs-sm) * var(--fs-scale, 1));
}

.footer__socials {
  display: flex;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}
.footer__social {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  transition: color var(--dur-fast) var(--ease-out),
              background var(--dur-fast) var(--ease-out),
              transform var(--dur-fast) var(--ease-out);
}
.footer__social:hover {
  color: var(--accent-cyan);
  background: var(--glass-bg-strong);
  transform: translateY(-2px);
}

.footer__top {
  gap: var(--space-2);
}

.footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
  padding-top: var(--space-5);
  border-top: 1px dashed var(--glass-border);
}
.footer__copy,
.footer__made {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
}
.footer__made {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.06em;
}

/* 移动端：居中堆叠 */
@media (max-width: 720px) {
  .footer__top,
  .footer__bottom {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}

/* ==================== 手机端布局（DEVICE 维度） ==================== */
.footer.is-mobile { padding: var(--space-6) 0 var(--space-5); }
.footer.is-mobile .footer__top,
.footer.is-mobile .footer__bottom {
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-4);
}
.footer.is-mobile .footer__top { gap: var(--space-5); }
</style>
