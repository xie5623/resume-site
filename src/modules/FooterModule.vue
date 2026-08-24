<script setup>
/**
 * FooterModule — 页脚（占位内容）
 * 契约：props = { config, lang }；revealed 由 App 装配层驱动 + TextReveal。
 * 默认配置 animation:'none' / textAnim:'none'（见 site.config.js），
 * 因此这里以静态展示为主，回到顶部按钮仍带平滑滚动。
 */
import { computed } from 'vue'
import { useModuleReveal } from '@/composables/moduleReveal'
import { useVersion } from '@/composables/useVersion'
import { useContent } from '@/content/useContent'
import TextReveal from '@/components/TextReveal.vue'
import { useEditableElement } from '@/composables/useEditableElement'
import { useDeviceLayout } from '@/composables/useDeviceLayout'
import { SOCIAL_PRESET_MAP } from '@/config/socialPresets'

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
  { key: 'backToTop', label: { zh: '回到顶部', en: 'Back to top' }, type: 'text' },
  { key: 'socials', label: { zh: '社交图标', en: 'Social icons' }, type: 'list' }
])

/* ===================== 内容层（footer 命名空间，跟随模板+语言，可运行时编辑） ===================== */
const { version } = useVersion()
const { get } = useContent()
const T = (key) => get(version.value, props.lang, `footer.${key}`)

/* 页脚社交图标（需求 2）：数据驱动自内容层 footer.socials。
   每项 { id, label, url, icon? }：
     - id 命中预设（SOCIAL_PRESET_MAP）→ 内置 SVG path（fill=currentColor 贴合主题）
     - 其他（id='custom' + icon dataURL）→ 自定义上传图标（CSS mask 渲染为主题色剪影）
   只渲染「有 url」的项（url 为空 = 编辑中未填，成品页不显示空壳）。 */
const socials = computed(() => {
  const list = T('socials')
  if (!Array.isArray(list)) return []
  return list.filter((s) => s && typeof s.url === 'string' && s.url.trim())
})

const year = new Date().getFullYear()

/* 构建时间戳（版本徽标）：构建时由 vite define 注入 __BUILD_TIME__，
   用于确认当前跑的构建（本地预览/线上一致）。 */
const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : ''
/* 诊断：系统「减少动态效果」状态（Edge 若开启会让 CSS 动画失效/入场动画降级） */
const reducedMotion = typeof window !== 'undefined'
  ? (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  : false

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

      <!-- 社交图标（数据驱动：预设 SVG / 自定义上传，均贴合主题色） -->
      <ul v-if="socials.length" class="footer__socials" aria-label="社交链接">
        <li v-for="s in socials" :key="s.id + ':' + s.label">
          <a
            class="footer__social"
            :href="s.url"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="s.label"
            :title="s.label"
          >
            <!-- 预设平台：内置 SVG（fill=currentColor → 自动跟随主题强调色） -->
            <svg
              v-if="SOCIAL_PRESET_MAP[s.id]"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
              aria-hidden="true"
            >
              <path :d="SOCIAL_PRESET_MAP[s.id].path"></path>
            </svg>
            <!-- 自定义上传图标：CSS mask + currentColor → 任意图标变成主题色剪影 -->
            <span
              v-else-if="s.icon"
              class="footer__social-icon"
              :style="{ '--s-icon': `url(${s.icon})` }"
              aria-hidden="true"
            ></span>
            <!-- 兜底：无图标无预设 → 显示首字符 -->
            <span v-else class="footer__social-fallback" aria-hidden="true">{{ String(s.label || '?').slice(0, 1) }}</span>
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
      <!-- 版本徽标：确认运行的是哪次构建（build <时间戳>）+ 减少动态诊断 -->
      <span class="footer__build" :title="'build ' + buildTime + (reducedMotion ? ' | reduced-motion: ON' : ' | reduced-motion: OFF')">{{ buildTime }}<span class="footer__build-diag" :class="{ 'footer__build-diag--on': reducedMotion }">{{ reducedMotion ? ' rM:ON' : ' rM:off' }}</span></span>
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
  font-size: var(--fs-lg);
  font-weight: 800;
  display: inline-block;
}
.footer__tagline {
  margin: var(--space-2) 0 0;
  color: var(--text-muted);
  font-size: var(--fs-sm);
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
/* 自定义上传图标：mask 抠形 + currentColor 填充 → 任意图标贴合当前主题色 */
.footer__social-icon {
  width: 18px;
  height: 18px;
  display: block;
  background-color: currentColor;
  -webkit-mask: var(--s-icon) no-repeat center / contain;
  mask: var(--s-icon) no-repeat center / contain;
}
.footer__social-fallback {
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
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
.footer__build {
  font-family: var(--font-mono);
  font-size: 10px;
  opacity: 0.35;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  user-select: none;
}
.footer__build-diag {
  margin-left: 4px;
  font-weight: 700;
  opacity: 1;
  color: var(--text-muted);
}
.footer__build-diag--on {
  color: #ff6b6b;
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
