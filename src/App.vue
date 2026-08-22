<script setup>
/**
 * App.vue — 站点骨架
 * 结构：顶部导航（品牌 + 语言切换 + 模块锚点）→ 模块渲染区
 * 模块渲染完全由 版本配置（VERSIONS）+ moduleRegistry 驱动：
 *   - 当前版本决定渲染哪些模块、什么顺序（见 site.config.js 的 VERSIONS）
 *   - getModuleComponent(id) 决定渲染哪个组件
 *
 * 多版本：版本状态由全局 useVersion() 管理（localStorage 持久化），
 *   版本切换重新渲染对应模块，品牌/文档标题跟随版本。
 * 多语言：语言状态由全局 i18n（src/i18n/index.js）管理，
 *   App 用 useI18n() 消费 t/lang；模块仍接收 :lang prop（向后兼容）。
 * 版本与语言相互独立：切版本不动语言，切语言不动版本。
 * 响应式：窄屏（< 768px）导航收成汉堡菜单；切换带淡入过渡。
 */
import { ref, computed, watch, onMounted } from 'vue'
import { getEnabledModules, getVersionBrand } from '@/config/site.config'
import { useI18n } from '@/i18n'
import { useVersion } from '@/composables/useVersion'
import LangToggle from '@/components/LangToggle.vue'
import VersionToggle from '@/components/VersionToggle.vue'
import ModuleSection from '@/components/ModuleSection.vue'

/* ---------- i18n：全局语言状态 + 翻译函数 ---------- */
const { lang, t } = useI18n()
const currentLang = computed(() => lang.value)

/* ---------- 版本：全局状态（localStorage 持久化，默认 senior） ---------- */
const { version, currentVersionConfig } = useVersion()

/* 当前版本品牌名（跟随版本 + 语言） */
const brandText = computed(() => getVersionBrand(version.value, lang.value))

/* 语言或版本切换时轻微淡出再淡入（版本切换还会重挂载模块，重播入场动画） */
const uiFading = ref(false)
function fadeOnce() {
  uiFading.value = true
  window.setTimeout(() => { uiFading.value = false }, 300)
}
watch(lang, fadeOnce)

/* 文档标题跟随品牌（版本 + 语言联动） */
onMounted(() => {
  document.title = brandText.value
})
watch([lang, version], () => {
  document.title = brandText.value
})

/* ---------- 当前版本启用的模块（已按 order 排序） ---------- */
const enabledModules = computed(() => getEnabledModules(version.value))

/* 模块标签文案（跟随当前语言） */
function labelOf(m) {
  return m.label?.[lang.value] ?? m.label?.zh ?? m.id
}

/* ---------- 移动端汉堡菜单 ---------- */
const navOpen = ref(false)
function closeNav() { navOpen.value = false }
</script>

<template>
  <div class="site site-bg" :data-lang="currentLang">
    <!-- ======== 顶部导航 ======== -->
    <header class="site-nav glass--strong" :class="{ 'site-nav--sticky': currentVersionConfig.stickyNav }">
      <div class="container site-nav__inner">
        <a class="site-nav__brand" href="#top">
          {{ brandText }}
        </a>

        <!-- 桌面端导航链接 -->
        <nav class="site-nav__links" :aria-label="t('common.navAria')">
          <a
            v-for="m in enabledModules"
            :key="m.id"
            class="site-nav__link"
            :href="`#${m.id}`"
          >{{ labelOf(m) }}</a>
        </nav>

        <!-- 版本切换 -->
        <VersionToggle class="site-nav__version" />

        <!-- 语言切换 -->
        <LangToggle class="site-nav__lang" />

        <!-- 移动端汉堡按钮 -->
        <button
          class="site-nav__burger glass-btn"
          type="button"
          :aria-expanded="navOpen"
          :aria-label="navOpen ? t('common.menuClose') : t('common.menuOpen')"
          @click="navOpen = !navOpen"
        >
          <span class="site-nav__burger-bar" />
          <span class="site-nav__burger-bar" />
          <span class="site-nav__burger-bar" />
        </button>
      </div>

      <!-- 移动端下拉导航面板 -->
      <div
        v-show="navOpen"
        class="site-nav__mobile glass--strong"
      >
        <a
          v-for="m in enabledModules"
          :key="m.id"
          class="site-nav__mobile-link"
          :href="`#${m.id}`"
          @click="closeNav"
        >{{ labelOf(m) }}</a>
      </div>
    </header>

    <!-- ======== 模块渲染区 ======== -->
    <main
      id="top"
      class="site-main"
      :class="{ 'site-main--fading': uiFading }"
    >
      <!-- 每个模块包一层 ModuleSection：
           模块级滚动入场 + 内容自适应字号 + 配置驱动渲染全在这里。
           key 含版本：切换版本时重挂载模块，重播入场动画。 -->
      <ModuleSection
        v-for="m in enabledModules"
        :key="`${version}-${m.id}`"
        :module="m"
        :lang="currentLang"
      />
    </main>
  </div>
</template>

<style scoped>
.site-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
}
.site-nav__inner {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  height: var(--header-h);
}
.site-nav__brand {
  font-size: var(--fs-lg);
  font-weight: 800;
  color: transparent;
  background: var(--accent-gradient);
  background-clip: text;
  -webkit-background-clip: text;
  white-space: nowrap;
  flex-shrink: 0;
}
.site-nav__links {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  overflow-x: auto;
  flex: 1;
}
.site-nav__link {
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  white-space: nowrap;
}
.site-nav__link:hover { color: var(--accent-cyan); }

.site-nav__lang {
  flex-shrink: 0;
}

/* 版本切换器：占据右侧自由空间，语言切换器紧跟其后（顺序：品牌→链接→版本→语言） */
.site-nav__version {
  flex-shrink: 0;
  margin-left: auto;
}
.site-nav__version + .site-nav__lang {
  margin-left: var(--space-2);
}

/* 汉堡按钮：默认隐藏（桌面用横向链接） */
.site-nav__burger {
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: var(--radius-md);
}
.site-nav__burger-bar {
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: currentColor;
  transition: transform var(--dur-fast) var(--ease-out), opacity var(--dur-fast) var(--ease-out);
}

/* 移动端下拉面板 */
.site-nav__mobile {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  flex-direction: column;
  padding: var(--space-3) var(--space-5) var(--space-5);
  border-top: 1px solid var(--glass-border);
}
.site-nav__mobile-link {
  padding: var(--space-3) var(--space-2);
  font-size: var(--fs-md);
  color: var(--text-secondary);
  border-bottom: 1px solid var(--glass-border);
}
.site-nav__mobile-link:last-child { border-bottom: none; }
.site-nav__mobile-link:hover { color: var(--accent-cyan); }

.site-main {
  position: relative;
  z-index: 1;
  padding-bottom: var(--space-12);
  /* 语言切换淡入淡出 */
  transition: opacity 0.25s var(--ease-out), transform 0.25s var(--ease-out);
}
.site-main--fading {
  opacity: 0;
  transform: translateY(4px);
}

/* ================= 响应式：窄屏（< 768px，对应 --bp-md） ================= */
@media (max-width: 767px) {
  .site-nav__links { display: none; }        /* 隐藏桌面链接 */
  .site-nav__burger { display: inline-flex; flex: 0 0 auto; } /* 显示汉堡；禁止压缩，保持可点面积 */
  .site-nav__mobile { display: flex; }        /* 显示下拉面板 */
  .site-nav__inner { gap: 6px; }              /* 移动端收紧间距，容纳 品牌+版本+语言+汉堡 不溢出 */
  .site-nav__brand { font-size: var(--fs-md); } /* 移动端收窄品牌字号，避免顶栏拥挤 */
  .site-main { padding-bottom: var(--space-8); }
}
</style>
