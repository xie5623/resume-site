<script setup>
/**
 * App.vue — 站点骨架（三层架构装配层）
 * 结构：顶部导航（品牌 + 语言切换 + 模板切换 + 模块锚点）→ 模块渲染区
 * 三层分离（详见 src/ARCHITECTURE.md）：
 *   - 主题层 THEME：useTheme() 全局应用（tokens.css 变量覆盖到 :root）
 *   - 模板层 TEMPLATE：useVersion() 选模板（版本=模板）+
 *     useTemplates() 运行时模块编排（增删/排序/开关实时生效）
 *   - 内容层 CONTENT：useContent() 响应式文案（控制台改 → 页面实时变）
 * 三者独立、可任意组合：换主题不动内容，换内容不动主题，模板决定编排。
 * 模块渲染：App 从运行时模板 store 取 enabledModules（过滤+排序），
 *   <ModuleSection> 经注册表 getModuleComponent(id) 渲染组件。
 * 动画系统（useReveal/TextReveal/预设）保持不变。
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { getVersionBrand } from '@/config/site.config'
import { useI18n } from '@/i18n'
import { useVersion } from '@/composables/useVersion'
import { useTemplates } from '@/composables/useTemplates'
import { useTheme } from '@/themes/useTheme'
import { useMode } from '@/composables/useMode'
import { useDevice } from '@/composables/useDevice'
import { resolveContent } from '@/content/useContent'
import LangToggle from '@/components/LangToggle.vue'
import VersionToggle from '@/components/VersionToggle.vue'
import ModeToggle from '@/components/ModeToggle.vue'
import DeviceToggle from '@/components/DeviceToggle.vue'
import ThemePicker from '@/components/ThemePicker.vue'
import ModuleSection from '@/components/ModuleSection.vue'
import DeckContainer from '@/components/DeckContainer.vue'
import ConsolePanel from '@/components/ConsolePanel.vue'
import SelectionBox from '@/components/SelectionBox.vue'
import InlineEdit from '@/components/console/InlineEdit.vue'
import { useSelection } from '@/composables/useSelection'
import { useInlineEdit } from '@/composables/useInlineEdit'
import { useEditingMode } from '@/composables/useEditingMode'
import { useConsole } from '@/composables/useConsole'

/* ---------- i18n：全局语言状态 + 翻译函数 ---------- */
const { lang, t } = useI18n()
const currentLang = computed(() => lang.value)

/* ---------- 模板（版本）状态：useVersion 保留（版本=模板） ---------- */
const { version, currentVersionConfig } = useVersion()

/* ---------- 主题状态：useTheme 全局（模块加载时已自动应用当前主题） ---------- */
const { themeId } = useTheme()

/* ---------- 形态状态：滚动长页 ⇄ 翻页演示（useMode 全局单例） ---------- */
const { mode, isDeck } = useMode()
const deckRef = ref(null)
const activeDeckId = ref(null)

/* 翻页形态：锁定 body 滚动 + 回到顶部（进入时）；退出恢复 */
watch(mode, (m) => {
  const body = document.body
  if (m === 'deck') {
    body.classList.add('mode-deck')
    window.scrollTo(0, 0)
    activeDeckId.value = null
  } else {
    body.classList.remove('mode-deck')
  }
}, { immediate: true })

/* 翻页形态：当前屏变化 → 导航高亮跟随（DeckContainer change 事件） */
function onDeckChange(id) {
  activeDeckId.value = id
}

/* 导航锚点点击：翻页形态跳屏（goToId），滚动形态走原生锚点（行为不变） */
function onNavClick(e, m) {
  if (mode.value !== 'deck') return
  e.preventDefault()
  deckRef.value?.goToId(m.id)
}

/* 品牌点击：翻页形态回到第一屏 */
function onBrandClick(e) {
  if (mode.value !== 'deck') return
  e.preventDefault()
  deckRef.value?.goTo(0)
}

/* 当前模板品牌名：优先内容层 common.brand（可运行时编辑），
   缺失时回退模板配置 brand（行为与原版一致） */
const brandText = computed(() => {
  const fromContent = resolveContent(version.value, lang.value, 'common.brand')
  return fromContent ?? getVersionBrand(version.value, lang.value)
})

/* 语言切换时轻微淡出再淡入（仅滚动形态：翻页形态的固定容器
   不参与 fade 的 transform，避免固定定位受父级 transform 影响） */
const uiFading = ref(false)
function fadeOnce() {
  uiFading.value = true
  window.setTimeout(() => { uiFading.value = false }, 300)
}
watch(lang, () => {
  if (mode.value === 'scroll') fadeOnce()
})

/* 文档标题跟随品牌（版本 + 语言联动） */
onMounted(() => {
  document.title = brandText.value
})
watch([lang, version], () => {
  document.title = brandText.value
})

/* ---------- 当前模板启用的模块：读运行时模板 store（支持控制台增删/排序/开关） ----------
   DEVICE 维度：按生效设备取对应分支（桌面/手机两套编排）。
   effectiveDevice：手动模拟优先，否则按真实视口 <768 手机、≥768（含平板）桌面。 */
const { enabledModules: getTemplateEnabled } = useTemplates()
const { effectiveDevice, device } = useDevice()
const enabledModules = computed(() => getTemplateEnabled(version.value, effectiveDevice.value))

/* 模块标签文案（跟随当前语言） */
function labelOf(m) {
  return m.label?.[lang.value] ?? m.label?.zh ?? m.id
}

/* ---------- 移动端汉堡菜单 ---------- */
const navOpen = ref(false)
function closeNav() { navOpen.value = false }

/* ============================================================
   编辑器交互捕获（console-dev t2）：
   - 点页面模块 → 左侧选中联动（需求 3 反向）
   - 双击可编辑文字 → 就地 inline edit（需求 7）
   - Esc → 取消选中（需求 10）
   仅在编辑态（body.editing = 控制台展开）生效：收起面板即成品态。
   元素级选中（点击 data-editable-key）由 T3 v-editable 指令处理，
   这里只补模块级点击与双击 inline edit，避免重复拦截。
   ============================================================ */
const { selectModule: pickModuleOnPage, selectElement: pickElementOnPage, setSelectionEl, clearSelection } = useSelection()
const { startInlineEdit, inlineEdit, cancelInlineEdit } = useInlineEdit()
const { editing } = useEditingMode()

/* ============================================================
   控制台展开 → 主界面整体等比缩小居中（需求 1 · 预览等比例缩放）
   ------------------------------------------------------------
   不是旧的「横向 margin-right 让位」：滚动形态下把 .site-nav /
   .site-main 整体 transform: translateX(居中) scale(缩放)，缩小的
   整页预览在面板左侧剩余空间居中显示，互不遮挡、能看到整页效果。
   - 缩放系数 = 剩余宽度 / 布局宽度（跟随面板拉宽实时变化）
   - 桌面视口：布局宽 = 视口宽 → 整页等比缩小
   - 手机视口（DEVICE 维度）：布局宽 = 390px 手机框架 → 框架等比
     缩放适配面板左侧空间（内容列 390px 宽、走手机模块编排）
   - 翻页形态（deck）不整体缩放（fixed 满屏会随祖先 transform 错位），
     沿用 .deck 的 right 收窄视口（等效让位，行为不变）
   ============================================================ */
const { open: consoleOpen, isMobile: consoleNarrow, panelWidth } = useConsole()

/* 视口宽（resize 实时跟随） */
const viewportW = ref(typeof window !== 'undefined' ? window.innerWidth : 1440)
function onViewportResize() { viewportW.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onViewportResize))
onBeforeUnmount(() => window.removeEventListener('resize', onViewportResize))

const PREVIEW_GAP = 28      /* 缩放预览与面板之间的呼吸间距 */
const MOBILE_PREVIEW_W = 390 /* 手机视口模拟宽度 */
const clampPreview = (v) => Math.min(1, Math.max(0.5, v))

/** 是否激活等比缩放预览（面板展开 + 桌面宽窗口 + 滚动形态） */
const previewActive = computed(() =>
  consoleOpen.value && !consoleNarrow.value && mode.value === 'scroll'
)

/**
 * 生成「先 scale（左上为原点）再 translateX 居中到面板左侧剩余空间」的 transform。
 * 每个目标独立按自己的 layoutW 计算缩放（导航用视口宽、手机框架用 390px）。
 */
function centeredTransform(layoutW) {
  if (!previewActive.value) return ''
  const available = viewportW.value - panelWidth.value
  const s = clampPreview((available - PREVIEW_GAP) / layoutW)
  const tx = Math.round((available - layoutW * s) / 2)
  if (Math.abs(tx) < 1 && s >= 1) return '' /* 无需缩放也无需平移 */
  return `translate3d(${tx}px, 0, 0) scale(${s})`
}

/** 主界面（.site-main）缩放 + 手机时收窄为 390px 手机框架（居中到左区） */
const mainStyle = computed(() => {
  if (!previewActive.value) return {}
  if (device.value === 'mobile') {
    return { transform: centeredTransform(MOBILE_PREVIEW_W), width: `${MOBILE_PREVIEW_W}px` }
  }
  return { transform: centeredTransform(viewportW.value) }
})
/** 顶部导航跟随整体缩放（桌面公式：始终铺满左区，编辑器控件保持可读） */
const navStyle = computed(() => ({
  transform: centeredTransform(viewportW.value)
}))

/** 手机视口预览激活（编辑态 + 手机设备）→ 主界面套手机框架样式 */
const deviceMobilePreview = computed(() =>
  previewActive.value && device.value === 'mobile'
)

/* 控制台/配置浮窗/导航/高亮框/内联编辑浮层内的点击不参与页面选中 */
function isEditorUi(t) {
  return !!(t.closest('.console-panel') || t.closest('.console-fab')
    || t.closest('.config-bar') || t.closest('.config-bar-pill')
    || t.closest('.site-nav') || t.closest('.sel-box') || t.closest('.ie'))
}

/* 点页面（非可编辑元素区域）→ 模块级选中，左侧树联动 */
function onDocClick(e) {
  if (!editing.value) return
  const t = e.target
  if (!(t instanceof Element) || isEditorUi(t)) return
  if (t.closest('[data-editable-key]')) return /* 元素级由 v-editable 处理 */
  const section = t.closest('[data-module]')
  const mid = section?.getAttribute('data-module')
  if (mid) {
    pickModuleOnPage(mid)
    setSelectionEl(null)
  }
}

/* 双击可编辑文字 → 就地编辑（T3 标记 data-editable-key="moduleId.key"） */
function onDocDblclick(e) {
  if (!editing.value) return
  const t = e.target
  if (!(t instanceof Element) || isEditorUi(t)) return
  const editable = t.closest('[data-editable-key]')
  const section = t.closest('[data-module]')
  if (editable) {
    const full = editable.getAttribute('data-editable-key') || ''
    const dot = full.indexOf('.')
    const moduleId = dot > 0 ? full.slice(0, dot) : section?.getAttribute('data-module')
    const key = dot > 0 ? full.slice(dot + 1) : full
    if (!moduleId || !key) return
    e.preventDefault() /* 阻止双击触发链接/交互副作用 */
    pickElementOnPage(moduleId, key)
    setSelectionEl(editable)
    const ok = startInlineEdit(moduleId, key, editable)
    if (!ok) {
      /* 非字符串值：可能是列表容器（key=items 挂在 ul/ol 上）——
         尝试按「点击元素在列表中的索引 + 文本匹配字段」拼精确路径
         moduleId.items.N.field，实现列表项级就地编辑（无需改模块模板） */
      const precise = resolveListItemPath(t, editable, moduleId, key)
      if (precise) {
        const el = findTextFieldEl(t, precise.text)
        pickElementOnPage(moduleId, precise.path)
        setSelectionEl(el || editable)
        startInlineEdit(moduleId, precise.path, el || editable)
      } else {
        pickModuleOnPage(moduleId)
      }
    }
  } else if (section) {
    const mid = section.getAttribute('data-module')
    if (mid) { pickModuleOnPage(mid); setSelectionEl(null) }
  }
}

/* ---------- 列表项精确路径解析（需求 7 增强，列表容器级标记 → 项内字段） ----------
   T3 在列表容器（ul/ol/div）上标记 data-editable-key="moduleId.items"。
   双击列表内文字时，这里把容器级路径解析成 items.N.field：
   1) 找点击元素在容器直接子项中的索引 N
   2) 读 store 里 moduleId.items.N 对象
   3) 用点击文本匹配项内字符串字段（textContent === 字段值）→ 唯一命中即精确路径 */
function resolveListItemPath(target, container, moduleId, listKey) {
  if (typeof resolveContent !== 'function') return null
  const children = Array.from(container.children)
  let idx = -1
  for (let i = 0; i < children.length; i++) {
    if (children[i] === target || children[i].contains(target)) { idx = i; break }
  }
  if (idx < 0) return null
  const item = resolveContent(version.value, lang.value, `${moduleId}.${listKey}.${idx}`)
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null
  const text = (target.textContent || '').trim()
  if (!text) return null
  let hit = null
  for (const [k, v] of Object.entries(item)) {
    if (typeof v === 'string' && v.trim() === text) {
      if (hit) return null /* 多个字段同值 → 有歧义，放弃精确匹配 */
      hit = k
    }
  }
  if (!hit) return null
  return { path: `${listKey}.${idx}.${hit}`, text }
}

/* 找 textContent 恰好等于目标文本的最深元素（TextReveal 拆字 span → 上溯到标题/段落） */
function findTextFieldEl(target, expected) {
  let el = target
  while (el && el.getAttribute && !el.hasAttribute('data-editable-key')) {
    if ((el.textContent || '').trim() === expected) return el
    el = el.parentElement
  }
  return null
}

/* Esc → 取消选中（inline edit 的 Esc 已在输入框内 stopPropagation） */
function onDocKeydown(e) {
  if (e.key !== 'Escape') return
  if (inlineEdit.value.active) { cancelInlineEdit(); return }
  const t = e.target
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  clearSelection()
}

/* 收起面板（退出编辑态）→ 清空选中，页面回到成品态 */
watch(editing, (on) => { if (!on) clearSelection() })

onMounted(() => {
  window.addEventListener('click', onDocClick)
  window.addEventListener('dblclick', onDocDblclick)
  window.addEventListener('keydown', onDocKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('click', onDocClick)
  window.removeEventListener('dblclick', onDocDblclick)
  window.removeEventListener('keydown', onDocKeydown)
})
</script>

<template>
  <div
    class="site site-bg"
    :class="{
      'side-panel-open': consoleOpen,
      'preview-device-mobile': deviceMobilePreview
    }"
    :data-lang="currentLang"
    :data-theme="themeId"
    :data-device="effectiveDevice"
  >
    <!-- ======== 顶部导航 ======== -->
    <header class="site-nav glass--strong" :class="{ 'site-nav--sticky': currentVersionConfig.stickyNav }" :style="navStyle">
      <div class="container site-nav__inner">
        <a class="site-nav__brand" href="#top" @click="onBrandClick">
          {{ brandText }}
        </a>

        <!-- 桌面端导航链接（翻页形态点击跳屏，高亮跟随当前屏） -->
        <nav class="site-nav__links" :aria-label="t('common.navAria')">
          <a
            v-for="m in enabledModules"
            :key="m.id"
            class="site-nav__link"
            :class="{ 'site-nav__link--active': isDeck && activeDeckId === m.id }"
            :href="`#${m.id}`"
            @click="onNavClick($event, m)"
          >{{ labelOf(m) }}</a>
        </nav>

        <!-- 版本切换 -->
        <VersionToggle class="site-nav__version" />

        <!-- 语言切换 -->
        <LangToggle class="site-nav__lang" />

        <!-- 形态切换（滚动长页 / 翻页演示） -->
        <ModeToggle class="site-nav__mode" />

        <!-- 设备切换（桌面版 / 手机版视口模拟） -->
        <DeviceToggle class="site-nav__device" />

        <!-- 主题切换（4 主题胶囊选择器） -->
        <ThemePicker class="site-nav__theme" />

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
          :class="{ 'site-nav__mobile-link--active': isDeck && activeDeckId === m.id }"
          :href="`#${m.id}`"
          @click="(e) => { closeNav(); onNavClick(e, m) }"
        >{{ labelOf(m) }}</a>

        <!-- 移动端面板内形态切换（桌面导航窄屏隐藏后仍可切换） -->
        <ModeToggle class="site-nav__mobile-mode" />

        <!-- 移动端面板内设备切换 -->
        <DeviceToggle class="site-nav__mobile-device" />

        <!-- 移动端面板内主题切换（桌面导航窄屏隐藏后移到这里） -->
        <ThemePicker class="site-nav__mobile-theme" />
      </div>
    </header>

    <!-- ======== 模块渲染区（双形态） ======== -->
    <main
      id="top"
      class="site-main"
      :class="{ 'site-main--fading': uiFading }"
      :style="mainStyle"
    >
      <!-- 翻页演示形态：DeckContainer 每模块一屏，整屏切换（PPT 风格）。
           key 含版本：切换模板时重挂载，回到第一屏。 -->
      <DeckContainer
        v-if="isDeck"
        ref="deckRef"
        :key="`${version}-deck`"
        :modules="enabledModules"
        :lang="currentLang"
        @change="onDeckChange"
      />

      <!-- 滚动长页形态：现有 ModuleSection 流（行为完全不变）：
           模块级滚动入场 + 内容自适应字号 + 配置驱动渲染。
           key 含版本：切换版本时重挂载模块，重播入场动画。 -->
      <template v-else>
        <ModuleSection
          v-for="m in enabledModules"
          :key="`${version}-${m.id}`"
          :module="m"
          :lang="currentLang"
        />
      </template>
    </main>

    <!-- ======== 嵌入式可收起控制台（网页版 PPT 编辑面板） ======== -->
    <ConsolePanel />

    <!-- ======== 编辑器高亮层：选中高亮框 + 内联编辑浮层 ======== -->
    <SelectionBox />
    <InlineEdit />
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
  /* 侧边距让锚点有呼吸感，避免挤成一块 */
  padding: 2px 0;
  margin: 0 calc(var(--space-2) / 2);
  transition: color var(--dur-fast) var(--ease-out);
}
.site-nav__link:hover { color: var(--accent-cyan); }

/* 翻页形态：导航高亮跟随当前屏 */
.site-nav__link--active {
  color: var(--accent-cyan);
  font-weight: 600;
}

.site-nav__lang {
  flex-shrink: 0;
}

/* 控件组之间的视觉分隔：版本 | 语言 | 形态 | 设备 | 主题
   用左侧淡分隔线而非大间距，顶栏更整洁有层次 */
.site-nav__lang,
.site-nav__mode,
.site-nav__device,
.site-nav__theme {
  padding-left: var(--space-4);
  margin-left: var(--space-2);
  border-left: 1px solid var(--glass-border);
}

/* 版本切换器：占据右侧自由空间，语言切换器紧跟其后（顺序：品牌→链接→版本→语言） */
.site-nav__version {
  flex-shrink: 0;
  margin-left: auto;
}
.site-nav__version + .site-nav__lang {
  margin-left: var(--space-2);
}

/* 形态切换器：紧跟语言切换器右侧 */
.site-nav__mode {
  flex-shrink: 0;
  margin-left: var(--space-2);
}
/* 移动端面板内形态切换（同主题切换器位置） */
.site-nav__mobile-mode {
  margin-top: var(--space-3);
}

/* 设备切换器（桌面/手机视口模拟）：紧跟形态切换器右侧 */
.site-nav__device {
  flex-shrink: 0;
  margin-left: var(--space-2);
}
.site-nav__mobile-device {
  margin-top: var(--space-3);
}

/* 主题切换器：紧跟语言切换器右侧；移动端面板内另有一份（带文字） */
.site-nav__theme {
  flex-shrink: 0;
  margin-left: var(--space-2);
}
.site-nav__mobile-theme {
  margin-top: var(--space-3);
}

/* 平板：顶栏空间紧张，导航内主题切换器只留圆点（hover 有标题提示） */
@media (max-width: 1023px) {
  .site-nav__theme :deep(.theme-picker__label) { display: none; }
  .site-nav__theme :deep(.theme-picker__btn) { padding: var(--space-1) 6px; }
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

/* 翻页形态：移动端导航高亮跟随当前屏 */
.site-nav__mobile-link--active {
  color: var(--accent-cyan);
  font-weight: 600;
}

.site-main {
  position: relative;
  z-index: 1;
  padding-bottom: var(--space-12);
  /* 语言切换淡入淡出 + 控制台展开时右侧让位 */
  transition: opacity 0.25s var(--ease-out), transform 0.25s var(--ease-out),
    margin-right var(--dur-base) var(--ease-out);
}
.site-main--fading {
  opacity: 0;
  transform: translateY(4px);
}

/* ================= 控制台展开 → 主界面整体等比缩小居中（需求 1 · 预览等比例缩放） =================
   说明：右侧编辑栏展开时给 .site 加 .side-panel-open。
   滚动形态：.site-nav + .site-main 整体 transform 等比缩小并居中到面板左侧
   剩余空间（transform 由 App.vue 按「面板宽 + 设备视口」实时计算），
   不是旧的横向 margin-right 让位——缩小的整页预览完整可见、互不遮挡。
   翻页形态：DeckContainer 是 fixed 满屏，不能整体缩放（fixed 会随祖先
   transform 错位），沿用 .deck 的 right 收窄视口（等效让位）。 */
.site-nav { transition: transform var(--dur-base) var(--ease-out); }
.site.side-panel-open .site-nav,
.site.side-panel-open .site-main {
  transform-origin: top left;
  will-change: transform;
}
/* 翻页形态：固定视口收窄（右侧留白 = 面板宽，跟随拉宽实时变） */
.site.side-panel-open :deep(.deck) {
  right: var(--console-panel-w, 460px);
  transition: right var(--dur-base) var(--ease-out);
}

/* ================= 手机视口预览（需求 3）：主界面套手机框架 =================
   编辑态 + device=mobile 时，.site-main 收窄为 390px 手机列（App 内联 width），
   下面补一个手机框架质感（圆角边框 + 深底 + 阴影），导航同时收成手机样式
   （隐藏桌面链接、显示汉堡；主题/形态切换进下拉面板）。 */
.site.preview-device-mobile .site-main {
  background: var(--bg-base);
  border: 1px solid var(--glass-border);
  border-radius: 26px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
}
.site.preview-device-mobile .site-nav__links { display: none; }
.site.preview-device-mobile .site-nav__burger { display: inline-flex; flex: 0 0 auto; }
.site.preview-device-mobile .site-nav__theme,
.site.preview-device-mobile .site-nav__mode { display: none; }
/* 手机预览时设备切换器/版本切换器收窄为图标，给 390px 导航腾空间 */
.site.preview-device-mobile .site-nav__device :deep(.device-toggle__label) { display: none; }
.site.preview-device-mobile .site-nav__device :deep(.device-toggle__btn) { min-width: 30px; padding: 2px 6px; }
.site.preview-device-mobile .site-nav__inner { gap: 6px; }
.site.preview-device-mobile .site-nav__brand { font-size: var(--fs-md); }

/* ================= 响应式：窄屏（< 768px，对应 --bp-md） ================= */
@media (max-width: 767px) {
  .site-nav__links { display: none; }        /* 隐藏桌面链接 */
  .site-nav__burger { display: inline-flex; flex: 0 0 auto; } /* 显示汉堡；禁止压缩，保持可点面积 */
  .site-nav__mobile { display: flex; }        /* 显示下拉面板 */
  .site-nav__theme { display: none; }         /* 桌面导航内主题切换器隐藏（面板里有带文字的） */
  .site-nav__mode { display: none; }          /* 桌面导航内形态切换器隐藏（面板里有） */
  .site-nav__device { display: none; }        /* 桌面导航内设备切换器隐藏（下拉面板里有） */
  .site-nav__inner { gap: 6px; }              /* 移动端收紧间距，容纳 品牌+版本+语言+汉堡 不溢出 */
  .site-nav__brand { font-size: var(--fs-md); } /* 移动端收窄品牌字号，避免顶栏拥挤 */
  .site-main { padding-bottom: var(--space-8); }
  /* 窄屏：右侧面板为全屏覆盖，主界面不做缩放/让位（预览等比缩放仅桌面宽屏启用） */
  .site.side-panel-open :deep(.deck) { right: 0; }
}
</style>
