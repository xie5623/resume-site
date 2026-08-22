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
import { resolveContent } from '@/content/useContent'
import LangToggle from '@/components/LangToggle.vue'
import VersionToggle from '@/components/VersionToggle.vue'
import ModeToggle from '@/components/ModeToggle.vue'
import ThemePicker from '@/components/ThemePicker.vue'
import ModuleSection from '@/components/ModuleSection.vue'
import DeckContainer from '@/components/DeckContainer.vue'
import ConsolePanel from '@/components/ConsolePanel.vue'
import SelectionBox from '@/components/SelectionBox.vue'
import InlineEdit from '@/components/console/InlineEdit.vue'
import { useSelection } from '@/composables/useSelection'
import { useInlineEdit } from '@/composables/useInlineEdit'
import { useEditingMode } from '@/composables/useEditingMode'

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

/* ---------- 当前模板启用的模块：读运行时模板 store（支持控制台增删/排序/开关） ---------- */
const { enabledModules: getTemplateEnabled } = useTemplates()
const enabledModules = computed(() => getTemplateEnabled(version.value))

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

/* 控制台/导航/高亮框/内联编辑浮层内的点击不参与页面选中 */
function isEditorUi(t) {
  return !!(t.closest('.console-panel') || t.closest('.console-fab')
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
  <div class="site site-bg" :data-lang="currentLang" :data-theme="themeId">
    <!-- ======== 顶部导航 ======== -->
    <header class="site-nav glass--strong" :class="{ 'site-nav--sticky': currentVersionConfig.stickyNav }">
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

        <!-- 移动端面板内主题切换（桌面导航窄屏隐藏后移到这里） -->
        <ThemePicker class="site-nav__mobile-theme" />
      </div>
    </header>

    <!-- ======== 模块渲染区（双形态） ======== -->
    <main
      id="top"
      class="site-main"
      :class="{ 'site-main--fading': uiFading }"
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
  .site-nav__theme { display: none; }         /* 桌面导航内主题切换器隐藏（面板里有带文字的） */
  .site-nav__mode { display: none; }          /* 桌面导航内形态切换器隐藏（面板里有） */
  .site-nav__inner { gap: 6px; }              /* 移动端收紧间距，容纳 品牌+版本+语言+汉堡 不溢出 */
  .site-nav__brand { font-size: var(--fs-md); } /* 移动端收窄品牌字号，避免顶栏拥挤 */
  .site-main { padding-bottom: var(--space-8); }
}
</style>
