# 架构文档（ARCHITECTURE.md）

> 这是 **resume-gen-team** 的协作契约。所有成员在写/改代码前先读这里。
> 技术栈：**Vue 3 (Composition API) + Vite + GSAP + Sass（可选）**
> 数据模型：**三层分离 THEME / TEMPLATE / CONTENT** + **DEVICE 维度（第四层·叠加）**
> 生成器内核 = 主题（外观）× 模板（结构）× 内容（文字），且桌面/手机可各自独立编排。

---

## 1. 三层架构总览（最重要）

> 页面 = **主题（外观）× 模板（结构）× 内容（文字）**，三层解耦；
> DEVICE 维度在模板/内容之上叠加 desktop/mobile 双端变体（见 §12）。

| 层 | 决定什么 | 数据在哪 | 全局状态 | 换它 |
|----|----------|----------|----------|------|
| **THEME 主题** | 外观：颜色/玻璃/字体 | `src/themes/index.js`（cssVars 覆盖 tokens） | `useTheme()` | 不动内容/模板 |
| **TEMPLATE 模板** | 结构：模块选哪些/顺序/动画/字号配置 | `src/config/site.config.js`（VERSIONS=TEMPLATES，含 mobile 编排） | `useVersion()` + `useTemplates()` | 不动内容/主题 |
| **CONTENT 内容** | 文字：姓名/经历/技能/项目文案 | `src/content/`（CONTENT 数据）+ `src/i18n/messages.js`(base) | `useContent()` | 不动主题/模板 |
| **DEVICE 设备**（第四层·叠加） | 桌面/手机两套模板编排 + 内容覆盖 | 模板：useTemplates `{desktop,mobile}`；内容：useContent desktop 基准 + mobile 补丁 | `useDevice()` | 不动主题/模板默认值/内容默认值 |

**铁律：**
- 换主题不动内容，换内容不动主题，模板决定模块编排。
- 页面文字一律读**内容层**（`useContent()` / i18n `t()`），模块内禁止硬编码 DICT。
- 新颜色/尺寸先加进 tokens.css 或主题 cssVars 再引用，禁止硬编码色值。
- **动画系统（useReveal / TextReveal / 预设）保持不动**（用户验收前）。

---

## 2. 目录结构

```
resume-site/
├── index.html / package.json / vite.config.js
└── src/
    ├── main.js                 # 入口：全局样式 → 应用主题 → setupAnimations → 挂载
    ├── App.vue                 # 骨架/装配层：导航 + 主题/模板/语言切换 + 模块渲染
    ├── ARCHITECTURE.md         # 本文档（协作契约）
    │
    ├── themes/                 # ★ 主题层 THEME
    │   ├── index.js            #   THEMES 字典（4 主题：dark-glass/light-minimal/gold-luxury/cyber-gradient）
    │   └── useTheme.js         #   useTheme() + applyTheme()（写 :root 内联 cssVars + extraCss）
    │
    ├── config/
    │   └── site.config.js      # ★ 模板层 TEMPLATE：VERSIONS=TEMPLATES + 常量表 + 帮助函数
    │
    ├── content/                # ★ 内容层 CONTENT
    │   ├── index.js            #   CONTENT 合并出口（base + 各模块富内容）+ DEFAULT_TEMPLATE
    │   ├── hero.js             #   已改造模块的富内容（hero）
    │   ├── skills.js           #   已改造模块的富内容（skills）
    │   ├── experience.js       #   已改造模块的富内容（experience）
    │   └── useContent.js       #   全局响应式内容 store（读/写/持久化/重置）
    │
    ├── i18n/
    │   ├── messages.js         #   内容层基础数据（common + 未改造模块），被 content 合并
    │   └── index.js            #   轻量 i18n：useI18n()/t/setLang/toggleLang（t 读内容 store）
    │
    ├── styles/                 # tokens.css（基底变量）/ base.css / glass.css
    ├── animations/             # 动画系统统一出口（不动）
    ├── composables/
    │   ├── useVersion.js       #   版本状态（版本=模板）
    │   ├── useDevice.js        #   DEVICE 维度：当前设备 + 真实设备推断（见 §12）
    │   ├── useTemplates.js     # ★ 模板运行时 store：增删/排序/开关/改模块（含 desktop/mobile 双端）
    │   ├── useReveal.js        #   入场动画（不动）
    │   ├── useTextAnim.js      #   文字动画（不动）
    │   ├── useMotion.js        #   动效降级（不动）
    │   ├── moduleReveal.js     #   模块 revealed 共享状态
    │   ├── useAutoFit.js       #   内容自适应字号
    │   └── …
    ├── components/             # ModuleSection / TextReveal / LangToggle / VersionToggle / ThemePicker
    └── modules/                # 10 个模块组件 + 注册表 index.js
```

---

## 3. 主题层 THEME（`src/themes/`）

### 3.1 主题对象

```js
{
  id: 'dark-glass',                       // 唯一 id
  name: { zh: '深色玻璃', en: 'Dark Glass' }, // 切换器按钮文案
  colorScheme: 'dark',                    // 写到 :root 的 color-scheme
  preview: 'linear-gradient(...)',        // 切换器预览圆点背景（bg→强调）
  desc: { zh, en },                       // 切换器悬浮提示（可选）
  cssVars: { '--bg-base': '#0a0e1a', … }, // 完整覆盖 tokens.css 视觉变量
  extraCss: `…`                           // 可选：该主题专属 CSS 片段
}
```

- `cssVars` 采用**完整覆盖**：每个主题把 tokens.css 中影响视觉的变量全部列齐
  （背景/玻璃/文字/强调/语义/`--on-accent`/`--track-bg`/字体/阴影/圆角/模糊），
  主题自洽、互不泄漏；结构变量（间距/字号刻度/断点/过渡）沿用 tokens 默认。
- `extraCss` 由 `useTheme()` 注入为全局 `<style id="theme-extra-css">`（切主题即替换），
  用于变量表达不了的装饰（赛博扫描线、暗金衬线标题、专属卡面光效），
  选择器统一以 `[data-theme='<id>']` 开头（App 根节点带 `:data-theme`）。
- 4 个精细主题：`dark-glass`（深色玻璃·默认）/ `light-minimal`（浅色极简）/
  `gold-luxury`（暗金奢华）/ `cyber-gradient`（赛博渐变）。

### 3.2 API 与切换 UI

```js
import { useTheme } from '@/themes/useTheme'
const { themeId, setTheme, currentTheme, applyTheme, getThemes } = useTheme()

setTheme('gold-luxury')   // 切换 + localStorage 持久化（resume-site.theme）
applyTheme(id)            // 低层：先清上次主题写入的内联变量，再写新主题 + extraCss（可恢复）
```

- 模块加载即应用当前主题（main.js import `@/themes/useTheme` 时同步生效）。
- 根节点带 `:data-theme="themeId"`，CSS 可按主题定向（`[data-theme='gold-luxury']`）。
- 切换 UI：`src/components/ThemePicker.vue`（4 主题胶囊选择器，预览圆点 + 双语名，
  调 `setTheme`），已挂进 App.vue 顶栏（桌面）+ 移动端下拉面板。
- 平滑过渡：`setTheme` 先给 `<html>` 加 `.theme-switching` 淡出 → 换变量（隐藏态瞬间
  生效）→ 淡入；过渡 CSS 在 `styles/base.css`（`#app`）。
- 对比度：每套主题提供 `--on-accent`（强调色面上的文字色）与 `--track-bg`
  （进度轨道色），组件统一引用（禁止硬编码 `#0a0e1a` / 白色轨道）。

---

## 4. 模板层 TEMPLATE（`src/config/site.config.js` + `useTemplates`）

### 4.1 模板 = 模块编排

```js
VERSIONS = TEMPLATES = {
  senior:   { id, label, brand(兜底), lang, stickyNav, modules: [ {id,enabled,order,label,animation,textAnim,fontScale,emphasize,variant}, … ] },
  graduate: { … }
}
```

- **模板不含文字内容**（文字在内容层）。`brand` 只是兜底，正文品牌名走 `common.brand`。
- `VERSIONS` 与 `TEMPLATES` 同一份数据；「版本(version)」与「模板(template)」是同义词。
- 常量表：`MODULE_IDS` / `ALLOWED_ANIMATIONS` / `ALLOWED_TEXT_ANIMS` / `ALLOWED_VARIANTS` / `FONT_SCALE_RANGE` / `ANIMATION_DURATION`。
- 帮助函数：`getVersion/getTemplate`、`getEnabledModules/getTemplateModules`、`getModuleById`、`getVersionBrand`、`validateModuleConfig`。

### 4.2 运行时编排（console「增删/排序/开关模块」）

```js
import { useTemplates } from '@/composables/useTemplates'
const { enabledModules, addModule, removeModule, moveModule,
         toggleModule, updateModule, setTemplateModules, resetTemplateModules } = useTemplates()

enabledModules(tplId)               // 过滤 enabled + 按 order 排序（App 渲染用）
addModule(tplId, cfg)               // 追加（cfg 至少含 id/enabled/order/animation…）
removeModule(tplId, moduleId)       // 删除
moveModule(tplId, fromIdx, toIdx)   // 拖拽排序（自动重排 order）
toggleModule(tplId, moduleId, enabled) // 开关
updateModule(tplId, moduleId, patch)   // 改 animation/textAnim/fontScale/emphasize/variant/label
resetTemplateModules()              // 还原默认编排（清 resume-site.templates）
```

- 持久化 key：`resume-site.templates`；不改时与静态配置一致，页面行为不变。

---

## 5. 内容层 CONTENT（`src/content/`）

### 5.1 数据形状

```js
CONTENT = {
  senior:   { zh: { common: {…}, hero: {…}, … }, en: {…} },
  graduate: { zh: {…}, en: {…} }
}
```

- `src/content/index.js` 合并：base（`i18n/messages.js` 的 common + 兜底）＋ 各模块富内容
  （`hero.js` / `skills.js` / `experience.js` / `about.js` / `projects.js` /
  `education.js` / `certificates.js` / `portfolio.js` / `contact.js` / `footer.js`）。
- **已改造模块**（读内容层）：全部 10 个模块（Hero / About / Skills / Experience /
  Projects / Education / Certificates / Portfolio / Contact / Footer）已迁移，
  组件一律 `useContent().get(version, lang, '<ns>.<key>')` 读取。

### 5.2 全局响应式 store（`useContent.js`）

```js
import { useContent } from '@/content/useContent'
const { content, get, setContent, setByPath, resetContent } = useContent()

// 读（带回退链）：
get(templateId, lang, 'hero.name')               // [tpl][lang] → [tpl][zh] → [默认][lang] → [默认][zh] → undefined
get(templateId, lang, 'experience.items.0.role') // 点路径；值可为字符串/数组/对象

// 写（console「编辑文字」）：
setContent(templateId, lang, 'hero.name', '张三')
setContent(templateId, lang, 'skills.items', [{ name: 'Vue', level: 95 }])
setContent(templateId, lang, 'experience.items.0.desc', '…')
setByPath = setContent   // 别名
// 注：setContent 支持数字叶子（如 'hero.roles.0'）——父节点是数组时
// 按索引写入并保持数组元素类型（字符串数组逐项编辑不被破坏）。

resetContent()           // 还原默认 + 清持久化（resume-site.content）
```

- 单例响应式：控制台写 store → 所有读它的模块**实时预览**，无需刷新。
- 持久化 key：`resume-site.content`（刷新保留）；`resetContent()` 一键还原。
- 模块内推荐写法：

```js
const { version } = useVersion()
const { get } = useContent()
const T = (key) => get(version.value, props.lang, `hero.${key}`)  // 命名空间前缀
```

### 5.3 i18n 与内容层的关系

`i18n/index.js` 的 `t(key)` 改为读内容层 store（`resolveContent`），因此 App 层文案
（`common.brand` / 导航 aria 等）也可被控制台运行时编辑。模块**不要**再用组件内 DICT。

---

## 6. 全局状态协调

| 状态 | 位置 | 作用 | 持久化 key |
|------|------|------|-----------|
| `useTheme()` | `themes/useTheme.js` | 当前主题 + 应用 | `resume-site.theme` |
| `useVersion()` | `composables/useVersion.js` | 当前模板 id（版本=模板） | `resume-site.version` |
| `useDevice()` | `composables/useDevice.js` | 当前设备（desktop/mobile，预览模拟） | —（会话内，不持久化；旧 key `resume-site.device` 已弃用） |
| `useTemplates()` | `composables/useTemplates.js` | 模板模块编排（运行时编辑） | `resume-site.templates` |
| `useContent()` | `content/useContent.js` | 页面文字（运行时编辑） | `resume-site.content` |
| `useI18n()` | `i18n/index.js` | 语言 + `t()` | `resume-site.lang` |
| `useSelection()` | `composables/useSelection.js` | 全局选中态（模块/元素，双向联动基础） | —（会话态） |
| `useLayout()` | `composables/useLayout.js` | 拖拽摆放元素位置 + 开关（自动适配） | `resume-site.layout` |
| `useElementStyle()` | `composables/useElementStyle.js` | 元素级样式补丁（fontScale/animation/textAnim/emphasize/size，三层回退） | `resume-site.element-style` |
| `useClipboard()` | `composables/useClipboard.js` | 元素复制/粘贴/克隆剪贴板（copyElement/pasteElement/pasteAsNewModule） | —（会话态） |
| `useHistory()` | `composables/useHistory.js` | 撤销/重做（内容+模板+位置+元素级样式统一快照栈） | —（会话态） |
| `useEditableRegistry()` | `composables/useEditableRegistry.js` | 可编辑元素注册表（模块挂载时注册） | —（组件生命周期） |

核心四者（theme/version/templates/content）独立、可任意组合：App.vue 只做装配
（读 useVersion + useTemplates 渲染模块、useTheme 应用主题、useContent/i18n 渲染文字），
不写死任何组件。编辑器四件套（selection/layout/history/editableRegistry）叠加其上，
不侵入核心 store，详见 §11。

---

## 7. 控制台读写接口约定（console-dev 照此实现）

| 控制台功能 | 调用 |
|-----------|------|
| 编辑文字 | `useContent().setContent(tpl, lang, 'hero.name', value)`；读取 `get(tpl, lang, path)` |
| 换动画 | `useTemplates().updateModule(tpl, moduleId, { animation })`；可选值见 `ALLOWED_ANIMATIONS` |
| 换文字动画 | `updateModule(tpl, moduleId, { textAnim })`；可选值见 `ALLOWED_TEXT_ANIMS` |
| 调字号 | `updateModule(tpl, moduleId, { fontScale })`（0.8~1.6，见 `FONT_SCALE_RANGE`） |
| 强调 | `updateModule(tpl, moduleId, { emphasize })` |
| 元素级字号/强调/大小 | `useElementStyle().setElementStyle(moduleId, key, { fontScale / emphasize / size })`；读取 `resolveElementStyle(moduleId, key, moduleCfg)`（三层回退，见 §13） |
| 元素复制 | `useClipboard().copyElement(moduleId, key, { itemIndex })`（标量或列表条目） |
| 元素粘贴 | `useClipboard().pasteElement(moduleId, { targetIndex })`；撤销走 `historyPasteElement`（见 §13） |
| 增/删模块 | `addModule(tpl, cfg)` / `removeModule(tpl, id)`（可用 id 见 `MODULE_IDS`） |
| 排序模块 | `moveModule(tpl, fromIdx, toIdx)`（或 `setTemplateModules` 整体替换） |
| 开关模块 | `toggleModule(tpl, id, enabled)` |
| 切换主题 | `useTheme().setTheme(id)`；可选值见 `THEMES`（`getThemes()` 渲染按钮） |
| 恢复默认 | `resetContent()` / `resetTemplateModules()` / `setTheme(DEFAULT_THEME)` |
| 实时预览 | 直接生效——所有 store 都是单例响应式，控制台不额外做预览逻辑 |

> 约定：控制台**只写 store**，不直接改 `site.config.js`/`messages.js`；改模块/内容
> 都落在运行时 store + localStorage，刷新保留。

---

## 8. 模块组件约定（读内容层版）

1. **Props**：`config`（模块配置对象）+ `lang`（'zh' | 'en'）。
2. **内容**：一律 `useContent().get(version, props.lang, '<ns>.<key>')`，禁止本地 DICT。
   - `version` 来自 `useVersion()`；已改造模块见 Hero/Skills/Experience 的写法。
3. **入场状态**：`useModuleReveal(config.id)`（ModuleSection 装配层负责标记）。
4. **文字动画**：标题/正文用 `<TextReveal :anim="config.textAnim" :text="…" />`。
5. **主题样式**：引用 tokens 变量 + glass 工具类，禁硬编码色值。
6. **字号缩放**：`calc(var(--fs-*) * var(--fs-scale))`（App 装配层已注入，含自适应 × fontScale × emphasize）。
7. **实现后注册**：`src/modules/index.js` 的 `moduleRegistry[id]` 换真实组件。

---

## 9. 开发流程

```bash
npm install      # 装依赖
npm run dev      # 本地开发 http://localhost:5173
npm run build    # 产物 → dist/
```

- 每实现一个模块/改共享接口：在群里@相关成员，避免各改各的契约。
- 新增模块内容 → 在 `src/content/<module>.js` 建命名空间（不直接改 base 也可，merge 会覆盖）。

---

## 10. 已知待办

- [x] 三层分离数据模型：THEME（themes/）+ TEMPLATE（site.config + useTemplates）+ CONTENT（content/ + useContent）
- [x] 主题应用机制 applyTheme/useTheme + dark-glass 主题（从 tokens 提取）
- [x] 内容 store：setContent 运行时编辑 + localStorage 持久化 + resetContent
- [x] 模块内容迁移：全部 10 个模块读内容层 useContent（module-builder T5，列表类 items 数组可编辑）
- [x] 主题：浅色极简 / 暗金奢华 / 赛博渐变 + ThemePicker 切换（theme-dev T2）
- [x] 嵌入式可收起控制台：编辑文字/换动画/调字号/增删排序模块/切主题（console-dev）
- [x] 编辑器地基：useHistory 撤销/重做 + useSelection 选中 + useLayout 位置 + useEditableRegistry 注册表（architect T1）
- [x] DEVICE 维度：useDevice + 模板/内容双端拆分 + 内容同步策略（architect，见 §12）
- [x] 编辑器数据模型层：元素级配置 + 复制粘贴/克隆 + 气泡图数据契约 + 文档（architect t1，见 §13/§14/§15）
- [ ] 右侧模块区整体展开/收缩 + 展开显示模块全名（需求 1，console-dev）
- [ ] 左侧模块配置浮窗改作用于当前选中元素（需求 2 交互层，消费 useElementStyle）
- [ ] 四套真正不同风格的主题（需求 3，theme-dev）
- [ ] 点元素 → 控制台自动跳转 + 呼吸闪烁提醒（需求 4，console/preview-dev）
- [ ] 精细框选（需求 5，module-builder）
- [x] 元素复制/粘贴 UI + 拖拽摆放 + 可调整大小交互（需求 6 交互层，interaction-dev t5，见 §16）
- [ ] 专业技能气泡图交互：可调大小/材质/冒泡动画（需求 7 交互层，数据契约已定见 §14）
- [x] 创意工坊入口（需求 8，仅入口，功能后置，interaction-dev t5，见 §15）
- [ ] 更新项目文档（需求 9，本文档 §13–§15 已记录数据层）
- [ ] 滚动长页 ⇄ 翻页演示双形态切换（mode-dev）
- [ ] 导出单文件 HTML
- [ ] DEVICE 维度 UI：桌面/手机视口切换 + 双端差异/覆盖展示（console/preview-dev）

---

## 11. 编辑器地基：历史 / 选中 / 位置 / 可编辑注册表（architect T1）

> 供 console-dev（左侧面板/inline edit/快捷键）与 module-builder（元素标记/拖拽）照此实现。
> 四个 store 全部**不侵入**核心三层（content/templates/theme/mode），叠加使用、任意组合。
> 依赖方向：`useHistory → { useContent, useTemplates, useLayout }`（单向，无循环引用）。

### 11.1 撤销/重做内核 `useHistory()`

统一快照栈，对 **内容 + 模板编排 + 元素位置 + 元素级样式** 做一次深拷贝快照
（元素级样式见 §13.1；快照形状 `{ content, templates, layout, elementStyle }`）：

```js
import { useHistory } from '@/composables/useHistory'
const { undo, redo, canUndo, canRedo, withHistory } = useHistory()

undo() / redo()            // 撤销/重做，返回是否生效
canUndo / canRedo          // computed<boolean>（按钮禁用态）
capture()                  // 生成 { content, templates, layout } 深拷贝快照
push(snapshot?)            // 手动入栈一个快照
withHistory(fn, label?)    // 执行前快照 → 执行 fn → 成功后入栈（undo 回执行前）
clearHistory()             // 清空两栈（恢复全部默认后调用）
MAX_HISTORY = 50           // 栈深上限（超出丢最旧）
```

**规则：用户可撤销的写操作一律用历史包装的 setter，不要直接调裸 setter：**

| 原始 setter | 历史包装（useHistory） |
|---|---|
| `useContent().setContent(tpl, lang, key, v)` | `historySetContent(tpl, lang, key, v)` |
| `useTemplates().updateModule(tpl, id, patch)` | `historyUpdateModule(tpl, id, patch)` |
| `useLayout().setElementPos(id, key, pos, size?)` | `historySetElementPos(id, key, pos, size?)` |
| `useLayout().toggleLayout(id, on)` | `historyToggleLayout(id, on)` |
| `resetContent()` / `resetTemplateModules()` / `resetLayout()` | `historyResetContent()` / `historyResetTemplateModules()` / `historyResetLayout()` |

- 多步操作（增删排序模块、整体换内容）包进 `withHistory(() => { … })` 即一个可撤销单元。
- undo/redo 恢复时会把状态写回三个 store 并**同步 localStorage**（刷新后仍一致）。
- 快捷键：`Ctrl+Z` 撤销、`Ctrl+Shift+Z` 重做（`useHistory` 模块加载即绑定；
  焦点在输入框/可编辑区时**不劫持**，交给浏览器原生）。console-dev 接管快捷键时调
  `unbindHistoryShortcuts()` 关闭，自己调 `undo()/redo()`。

### 11.2 选中状态 `useSelection()`（双向联动基础）

```js
import { useSelection } from '@/composables/useSelection'
const { selection, selectModule, selectElement, clearSelection, getSelectionRect } = useSelection()

selection        // ref<{ kind:'module'|'element'|null, moduleId, elementId, elementKey }>
selectModule(id)           // 点左侧面板 → 页面高亮
selectElement(moduleId, elementKey)  // 点页面元素 → 左侧跟随选中
getSelectionRect()         // 高亮框定位：DOMRect | null（module 按 #moduleId 找，element 用绑定元素）
setSelectionEl(el)         // module-builder 选中元素时注入真实 DOM 元素
```

- 双向联动约定：**点左侧 →** console-dev 调 `selectModule` + `scrollToSelection()`；
  **点页面 →** 页面点击回调调 `selectModule`/`selectElement`，左侧面板 `watch(selection)`
  同步高亮（或同时调 `useConsole().selectModule` 跳到对应编辑页）。
- 不持久化（会话态）。

### 11.3 元素位置 `useLayout()`（拖拽摆放，默认关）

```js
import { useLayout } from '@/composables/useLayout'
const { isLayoutEnabled, toggleLayout, setElementPos, getLayout, toPx, fitToContainer } = useLayout()

isLayoutEnabled(moduleId)  // 拖拽摆放开关（默认 false）
toggleLayout(moduleId, on) // 模块配置里开/关
setElementPos(moduleId, elementKey, { x, y, unit? }, containerSize?) // 记录位置 + 持久化
getLayout(moduleId)        // { enabled, positions }
toPx(moduleId, elementKey, containerSize)        // % → 像素（定位 overlay 用）
fitToContainer(moduleId, elementKey, newCw, newH) // px 位置按新容器比例缩放
```

- 状态：`{ enabled: {moduleId:bool}, positions: {moduleId: {elementKey:{x,y,unit,cw,ch}}} }`，
  持久化 key **`resume-site.layout`**。
- **自动适配**：位置默认存**百分比**（相对模块容器）→ 页面/容器 resize 天然按比例保持；
  拖拽回调若给像素 + 传 `containerSize` 会自动换算成 %；要固定像素显式传 `unit:'px'`
  并用 `fitToContainer`/`scaleAllPx` 做缩放。
- module-builder 的拖拽浮层按 `toPx()`（或直接用 % 定位）应用；元素 key 与
  useEditableRegistry / useSelection 一致。

### 11.4 可编辑元素注册表 `useEditableRegistry()`

```js
import { useEditableRegistry } from '@/composables/useEditableRegistry'
const { registerEditable, unregisterEditable, getEditable } = useEditableRegistry()

registerEditable(moduleId, items)   // 模块组件 onMounted 注册（覆盖）
registerEditableItem(moduleId, item)// 增量追加单条
unregisterEditable(moduleId)        // onBeforeUnmount 注销
getEditable(moduleId)               // [{ key, label:{zh,en}, type }] 响应式数组
// type: 'text'|'number'|'boolean'|'list'|'object'（对应 ContentField 控件类型）
```

- 元素项 `key` = 内容路径后缀（如 `hero.name` 的 `name` / `roles` / `items`）；
  inline edit 用 `moduleId + key` 定位内容路径与 DOM。
- module-builder T3 负责把各模块组件接上注册（本任务只建结构 + API）。

### 11.5 与现有组件的关系

- 现有控制台（ModuleEditorTab / ModuleManagerTab / GlobalTab / ContentField）暂仍调裸
  setter；console-dev 切到历史包装即可让编辑可撤销。
- App.vue / ModuleSection / 模块组件**无需改动**即可共存；高亮框 / 拖拽 overlay /
  左侧面板由后续任务接入。

---

## 12. DEVICE 维度（第四层）：桌面/手机双端 + 内容同步（architect）

> 在 THEME/TEMPLATE/CONTENT 之上叠加「设备」维度：**桌面版 + 手机版两套专属模板**，
> 内容桌面填完自动同步手机、手机可微调可大改；平板默认桌面。
> 契约给 console-dev（设备切换 UI/双端差异展示）与 preview-dev（视口切换）照用。

### 12.1 useDevice（`src/composables/useDevice.js`）

```js
import { useDevice } from '@/composables/useDevice'
const { device, setDevice, clearDeviceOverride, isDesktop, isMobile,
        inferDeviceFromWidth, effectiveDevice } = useDevice()

setDevice('mobile') / setDevice('desktop')   // 编辑器切桌面/手机视口（模拟，会话内有效，不持久化）
clearDeviceOverride()                        // 回到按真实视口自动推断
inferDeviceFromWidth(720)                    // 真实设备规则：<768 → mobile；≥768 → desktop（含平板）
effectiveDevice                              // computed：手动模拟优先，否则按真实视口推断
```

- **平板规则**：视口 ≥1024 桌面；768–1023 平板 → 默认桌面；<768 手机。
  此规则用于「真实设备」推断（preview 自动选模板）；手动切换（编辑器模拟）优先。
- 手动覆盖为**会话内**有效、不持久化（旧 key `resume-site.device` 已弃用）；刷新/重新打开后按真实视口自动推断。

### 12.2 模板层双端拆分（`useTemplates.js` 扩展）

每个模板的 `modules` 编排拆成 **desktop / mobile 两套**（模块/顺序/动画/字号完全独立）：

```js
templates.value = {
  senior:   { desktop: [...], mobile: [...] },
  graduate: { desktop: [...], mobile: [...] }
}
```

- **旧数据兼容**：持久化里无 device 字段的模板（`{ modules: [...] }`）视为 desktop 编排
  （保留用户已保存的桌面编辑）；**mobile 用该模板「设计好的手机编排」
  （`VERSIONS[id].mobile`）**，不再跟随 desktop——让老用户升级后也直接拿到
  手机版专属编排（module-builder T3 改进；缺省仍保底跟随 desktop）。
- 静态默认：`site.config.js` 的 `VERSIONS[*].modules` = desktop，可选 `mobile` 数组 =
  手机专属默认（缺省跟随 desktop）。常量 `DEVICE_IDS` / `DEFAULT_DEVICE`。

```js
const { enabledModules, getTemplateModules, updateForDevice, getDeviceModules } = useTemplates()
enabledModules(version.value, device)      // 过滤+排序（device 可选，缺省=当前生效设备）
getTemplateModules(version.value, device)  // 某设备全量模块（console 编辑用）
updateForDevice('senior', 'mobile', (list) => list.push(cfg)) // 指定设备上下文事务修改
getDeviceModules(version.value)            // { desktop:[...], mobile:[...] } 双端差异展示
```

- 增删/排序/开关/改模块全部带**可选 device 尾参**（缺省=当前生效设备）；App.vue 现有
  `enabledModules(version.value)` 调用会自动跟随设备，无需改渲染代码即可双端预览。
- 持久化键：`resume-site.templates`（含双端分支）。

### 12.3 内容层双端（`useContent.js` 扩展）—— 同步策略（重点）

```js
content.value = {
  senior: {
    desktop: { zh: {...}, en: {...} },   // 桌面 = 基准（全量内容）
    mobile:  { zh: {...补丁}, en: {...} } // 手机 = 覆盖补丁（仅被微调的字段）
  }, ...
}
```

**同步策略契约：**
1. **desktop 为基准**：读取 mobile = 桌面全量 + 手机补丁（深度合并）。因此
   **编辑 desktop 内容 → mobile 无覆盖的字段自动同步**（合并视图天然继承）。
2. **编辑 mobile 内容 → 只写 mobile 覆盖补丁**（微调）；该字段手机端独立于桌面。
3. **清空手机覆盖恢复跟随桌面**：`resetDeviceContent(versionId)`（不传清全部）。
4. **数组覆盖**：手机补丁 `items.2.role` 只改第 3 条（按索引并入）；
   整数组覆盖（`items = [...]`）整体替换桌面列表（手机可大改）。
   ⚠️ 局限：按索引补丁在桌面增删列表项后可能错位——控制台提供「清空手机覆盖」兜底。

**API（device 为可选参数，缺省=当前生效设备；旧 3/4 参调用完全兼容）：**

```js
const { get, setContent, hasDeviceOverride, deviceOverrideStats, resetDeviceContent } = useContent()
get(version.value, device, lang, key)     // 新：显式设备（mobile 走合并视图）
get(version.value, lang, key)             // 旧：跟随当前设备（模块现有写法无需改）
setContent(version.value, device, lang, key, value)  // 新：显式设备写
setContent(version.value, lang, key, value)          // 旧：跟随当前设备写
hasDeviceOverride(version.value, lang, key)          // 该字段手机端是否已自定义
deviceOverrideStats(version.value)        // { templateId, device:'mobile', paths:[...], count }
resetDeviceContent(version.value)         // 清空手机覆盖 → 恢复跟随桌面
```

- **持久化键**：desktop 内容存原键 `resume-site.content`（旧数据形状兼容，向后不变）；
  mobile 覆盖补丁存新键 `resume-site.content.mobile`。
- `i18n.t()` 与模块的 `get(version, lang, key)` 在设备切换后自动跟随（内部读 useDevice）。

### 12.4 与 useHistory / useSelection 兼容

- `capture()` 快照深拷贝 content/templates（已含 desktop/mobile 分支）→
  **撤销/重做天然覆盖 device 维度**；undo/redo 经 replaceContentState/replaceTemplatesState
  恢复（两者都做形状规范化，旧形状快照也能恢复）。
- 新增历史包装：`historySetContentForDevice(tpl, device, lang, key, value)`、
  `historyUpdateForDevice(versionId, device, fn)`、`historyResetDeviceContent(versionId)`。
- useSelection 为会话态选中，与 device 维度正交，无需改动。

### 12.5 手机版专属编排 + 模块双端布局（module-builder T3）

**① 手机版模板编排**（`site.config.js` 的 `VERSIONS[*].mobile`，运行时走 useTemplates）：
- senior.mobile：精简掉 portfolio（移动端少滚动）；skills 用**气泡图 variant d**
  （`--bubble-scale` 整体缩放，紧凑省高度）、experience 用**卡片列表 variant c**（比时间线紧凑）、
  hero `fontScale:0.92` 更紧凑；动效全 fade-* 系、hero `textAnim:'none'`（轻量、省电）。
- graduate.mobile：模块集与桌面一致，重动效（zoom-in/letter-*）换 fade-up，
  hero 去文字动画 + fontScale 0.92，skills 用气泡图 variant d、experience 用 variant c。
- 每套 mobile 的 variant/fontScale 与 desktop 完全独立（双端可不同布局）。

**② 模块双端布局机制**（新增 `composables/useDeviceLayout.js`）：
```js
const { deviceCls } = useDeviceLayout()   // 'is-mobile' | 'is-desktop'（永远一个）
```
- 每个模块根元素挂 `deviceCls`，scoped 样式在 `.is-mobile { … }` 下写手机端专属布局。
- 以 `useDevice().effectiveDevice` 为唯一事实来源：手动模拟优先，否则按真实视口
  （<768 手机）。**为什么不用 @media 当唯一开关**：编辑器「手机视口」= setDevice 模拟
  + 整体 scale，真实 window 宽度不变、@media 不会触发；用 effectiveDevice 派生的类
  则真实视口与模拟都一致。真实手机 <768 时 effectiveDevice=mobile，行为与
  @media(max-width:767px) 一致。
- 手机端通用规则（10 模块全覆盖）：网格单列、字号下调、间距收紧、CTA/按钮全宽、
  隐藏装饰（hero 光球减淡/隐藏、滚动指示器隐藏、projects 装饰图隐藏）。

**③ 平板断点一致性**：`useDevice` 真实推断 `<768 mobile / ≥768 桌面（含平板）`，
模块 `.is-mobile` 布局与之一致（768 桌面、767 手机，实测边界精确）；
`tokens.css --bp-md:768px` 为唯一事实来源。

**④ 生效设备路由**（T3 修正）：`useTemplates.resolveDevice` 与 `useContent.activeDeviceValue`
的缺省设备由「手动 device」改为 **effectiveDevice**；App.vue 的
`enabledModules(version, effectiveDevice)` 显式传设备。效果：**真实手机无需手动切换即
自动渲染手机版模板 + 内容**；手动切换（console 设备切换器）优先。

---

## 13. 编辑器数据模型层：元素级配置 + 复制粘贴/克隆（architect t1）

> 在 §11 编辑器地基之上，为「编辑器体验大升级」新增两个叠加 store：
> `useElementStyle`（元素级样式补丁）与 `useClipboard`（复制/粘贴/克隆）。
> 两者都不侵入核心三层与动画系统；依赖方向：
> `useHistory → { useElementStyle, useClipboard } → useContent / useTemplates / useLayout`。

### 13.1 元素级配置 `useElementStyle()`（需求 2）

**为什么**：当前 `useTemplates` 是模块级配置（fontScale/animation/textAnim/emphasize 整块生效）。
需求 2 要求「每个选中元素可独立配置」——左侧 ModuleConfigBar（console-dev 改）编辑**当前选中元素**，
读到元素级优先、回退模块级、回退默认。

```js
import { useElementStyle } from '@/composables/useElementStyle'
const {
  getElementStyle, setElementStyle, clearElementStyle,
  resolveElementStyle, shiftItemStyles, resetElementStyles
} = useElementStyle()

setElementStyle('skills', 'title', { fontScale: 1.2, emphasize: true }) // 元素级补丁（合并写）
getElementStyle('skills', 'title')          // → { fontScale:1.2, emphasize:true } | null
clearElementStyle('skills', 'title')        // 移除 → 跟随模块级
resolveElementStyle('skills', 'title', moduleCfg)
// → { fontScale, animation, textAnim, emphasize, size }（元素级 → 模块级(base) → 默认 三层回退）
resetElementStyles()                        // 全部清空 + 清持久化（resume-site.element-style）
```

- **状态形状**：`{ moduleId: { elementKey: { fontScale, animation, textAnim, emphasize, size } } }`。
  elementKey 与 useEditableRegistry / useLayout / useSelection 一致；
  列表条目用下标式键 `items.<index>`（如 `items.3`）。
- **size 字段两种消费**：
  - 通用元素（需求 6「可调整大小」）：`{ w, h, unit:'px'|'%' }` → `v-element-style` 指令写
    `--el-w / --el-h`，T2/T3 交互层消费；
  - 气泡图（需求 7「每气泡可调大小」）：`number` = 直径 px → `useBubble.resolveBubbleSize` 消费。
- **持久化 key**：`resume-site.element-style`。
- **落地指令**：`v-element-style`（main.js 已注册全局）把元素级补丁应用到 DOM——
  fontScale 按「父级 `--fs-scale` ×（元素级 ÷ 模块级）」叠加、emphasize 加 `text-emphasize` 类、
  size 写 `--el-w/--el-h`。无补丁时零改动（安全叠加）。T2/T3 可让模块元素挂上该指令即可生效。
- **DEVICE 维度**：元素级样式属于**设计层**，desktop/mobile **共享同一份**（两端通用），
  不在 device 维度拆分——两端排版风格由同一套设计层样式统一；若未来要双端独立可再扩展。

### 13.2 复制/粘贴/克隆 `useClipboard()`（需求 6）

```js
import { useClipboard } from '@/composables/useClipboard'
const { copyElement, pasteElement, pasteAsNewModule, hasClipboard, clearClipboard } = useClipboard()

copyElement('skills', 'items', { itemIndex: 3 }) // 复制第 4 个气泡（数据 + 元素样式）
pasteElement('skills', { targetIndex: 4 })       // 插入副本（数据 + 样式，下标后移）→ true
pasteElement('skills')                            // 缺省 targetIndex = 追加到列表尾
pasteAsNewModule()                               // createModuleInstance 生成同类型新实例（skills-2）
```

- **剪贴板形状**：`{ kind:'element', moduleId, namespace, key, itemIndex|null, data, style|null, copiedAt }`。
  - `copyElement(moduleId, key, { itemIndex })`：标量元素复制文本值；列表条目复制单条数据 + 样式。
  - `pasteElement(moduleId, { targetIndex })`：列表条目 → 数组插入副本（`useContent.setContent` 整数组写，
    `shiftItemStyles` 平移下标样式后复制源样式到新位）；标量 → 覆盖目标模块同 key 文本。
  - `pasteAsNewModule()`：用 `useTemplates.createModuleInstance` 生成同类型新实例并 `addModule`
    （副本共享内容命名空间，沿用现有克隆模块机制）。
- **命名空间**：副本实例（skills-2）用基础类型（skills）读内容，与 ModuleEditorTab `nsOf` 一致。
- **剪贴板为会话态**（不持久化）；刷新即空。
- **与 useHistory 协作**：粘贴/克隆统一走 `historyPasteElement` / `historyPasteAsNewModule`
  （`withHistory` 包一层）→ 内容 + 元素样式 + 模板编排一步撤销。快照 `capture()` 现含四层
  `{ content, templates, layout, elementStyle }`，undo/redo 天然覆盖元素级样式。
- **下标样式平移**：`shiftItemStyles(moduleId, listKey, fromIndex, delta)` 在列表插入/删除后
  平移 `items.<n>` 式样式，保证「条目复制粘贴 / 增删」后每气泡样式不错位。

---

## 14. 专业技能气泡图数据契约（需求 7 · SkillsModule variant 'd'）

> 给 T7 交互层（气泡大小可调 / 材质 / 冒泡动画）与 mobile 端同步用的**唯一数据契约**。

- **变体**：`ALLOWED_VARIANTS` 已加 `'d'`；SkillsModule `variant === 'd'` 渲染气泡图。
- **数据**：仍读内容层 `skills.items = [{ name, level }]`（level 0~100），不新增内容结构。
- **气泡直径（默认）**：`useBubble.bubbleSizeForLevel(level)`——线性映射：
  `level 50 → BUBBLE_SIZE.min(48px)`，`level 95 → BUBBLE_SIZE.max(132px)`，夹取。
- **每气泡可独立覆盖**：元素级样式键 `items.<index>` 的 `size` 字段优先：
  ```js
  import { resolveBubbleSize, bubbleSizeForLevel } from '@/composables/useBubble'
  setElementStyle('skills', 'items.3', { size: 96 })   // 覆盖第 4 个气泡直径为 96px
  resolveBubbleSize('skills', 3, 88)                    // → 96（覆盖优先）
  resolveBubbleSize('skills', 5, 88)                    // → bubbleSizeForLevel(88)（默认映射）
  ```
- **落地**：SkillsModule d 分支内联 `--d: <px>` + 容器 `--bubble-scale`（手机端 0.78 整体缩放），
  玻璃材质 + 冒泡浮动动画（`translate` 独立于 `transform`，尊重 prefers-reduced-motion）。
- **局限（与 DEVICE 内容覆盖一致）**：下标式键在列表**增删/重排**后可能错位；
  复制粘贴会自动平移下标样式（§13.2），手改 items 顺序时每气泡样式需人工对齐或清空重建。

---

## 15. Roadmap / 后续规划（本次 9 项需求 + 创意工坊）

> 本次「编辑器体验大升级」9 项需求分工：数据模型层（本文档 §13–§14）已完成；
> 交互层由 console-dev / module-builder / preview-dev / theme-dev 分工推进。

| # | 需求 | 状态 | 数据/契约 |
|---|------|------|-----------|
| 1 | 右侧模块区整体展开/收缩 + 显示模块全名 | 待做（console-dev） | useTemplates 模块编排 |
| 2 | 左侧模块配置浮窗改作用于当前选中元素 | 数据层完成 / 交互待做 | **useElementStyle**（§13.1） |
| 3 | 四套真正不同风格的主题 | 待做（theme-dev） | themes/useTheme |
| 4 | 点元素 → 控制台跳转 + 呼吸闪烁提醒 | 待做 | useSelection + useConsole |
| 5 | 精细框选（任何可输入字精确可选中） | 待做（module-builder） | useEditableRegistry + editable 指令 |
| 6 | 元素复制/粘贴 + 拖拽摆放 + 可调整大小 | **交互已完成（interaction-dev t5）** | **useClipboard** + `size` 字段（§13.2 / §16） |
| 7 | 专业技能气泡图（大小/材质/冒泡动画/同步手机端） | 数据层完成 / 交互待做 | **useBubble**（§14）+ variant 'd' |
| 8 | 创意工坊入口（仅入口，功能后置） | **入口已完成（interaction-dev t5）** | 见下方 Roadmap |
| 9 | 更新项目文档 | 数据层已记录（§13–§15） | 本文件 + README-配置说明 |

### 创意工坊入口（需求 8 · 仅入口，功能后置）

- **现状（interaction-dev t5 已落地）**：入口在控制台「全局」tab 的「创意工坊」卡片
  （🧪 图标 + 双语文案 + 渐变按钮）。点击展开占位面板：显示
  「创意工坊 · 敬请期待」徽标 + 一句话说明 + 未来规划（模板市场 / 上传·审核·共享 / 版本管理）。
  **不实现任何上传/下载/社区逻辑**（仅入口 UI）。持久化只记住展开状态（会话态，收起即隐藏）。
- **未来社区模板上传架构设想**（写入此处，供后续立项）：
  - **模板即数据**：模板 = `TEMPLATE`（模块编排）+ `THEME`（主题 cssVars/extraCss）+ 缩略图，
    与现有三层分离天然对齐——上传一个模板包 = 三个 JSON/文本的归档（zip）。
  - **Schema 校验**：沿用 `validateModuleConfig` 扩展 `validateTemplateBundle`（模块 id /
    animation / textAnim / variant / fontScale / 主题 cssVars 键都在允许集内），
    非法模板拒收并给出逐条错误（防 XSS：额外 HTML/CSS 需白名单清洗）。
  - **导入流程**：下载 zip → 解析 → 校验 → 注入 `useTemplates`（新版本条目）+ `useTheme`
    （新主题条目）+ 缩略图 → 版本/主题切换器出现新选项 → 一键应用。
  - **安全边界**：模板包是**数据**不是代码（不执行 JS）；CSS 走 tokens 变量 + 白名单选择器；
    未来若支持自定义组件代码，须走独立的沙箱/审核流程（本期明确排除）。
  - **多语言**：模板包内 zh/en 文案成对，缺失用默认语言兜底。

---

## 16. 元素复制/粘贴 + 拖拽大小调整交互层（需求 6 · interaction-dev t5）

> 消费 §13.2 的 `useClipboard` 与 §13.1 的 `size` 字段，把「复制 / 粘贴 / 缩放手柄」
> 接到选中态（useSelection）上。与气泡图（§14）共用同一份数据契约。

### 16.1 复制 / 粘贴

- **选中态携带条目下标**：`useSelection.selection` 新增 `itemIndex`（列表内点击条目时写入）。
  `v-editable` 对 `type='list'` 元素在点击时解析「被点条目在容器的直接子项索引」
  （`findItemElement` 上溯到 `container.children`），并让高亮框精确框住该条目。
- **动作编排 `useEditorActions.js`**（新）：
  - `copySelection()`：模块选中 → `copyModule`；元素选中 → `copyElement(moduleId, key, { itemIndex })`
    （标量复制文本、列表条目复制单条数据 + 元素样式）。
  - `pasteSelection()`：剪贴板为模块 → `historyPasteAsNewModule()`（skills-2 副本实例，自动选中）；
    为元素 → `historyPasteElement(moduleId, { targetIndex })`（选中条目插其后 / 列表容器或模块追加到 items 尾）。
  - 粘贴统一走 history → **一个可撤销单元**（内容 + 元素样式 + 模板编排一步 undo）。
- **入口（三处）**：
  1. **选中高亮框工具条**（SelectionBox）：选中任意元素/模块后出现在框下方，⧉ 复制 / 📋 粘贴
     （粘贴按钮随剪贴板有无禁用），带一次性状态提示。
  2. **全局快捷键**：编辑态 `Ctrl+C` / `Ctrl+V`（焦点在输入框/可编辑区时不劫持，让浏览器原生处理）。
  3. **模块配置浮窗**（ModuleConfigBar）：`复制本模块` / `粘贴为副本模块`（仅剪贴板为模块时可用）。

### 16.2 拖拽摆放（拖拽手柄 · 重构版，取代原缩放手柄）

> ⚠️ 已按用户反馈重构（2026-08）：**移除「自由缩放/右下角缩放手柄」与 `--el-w/--el-h`
> 固定尺寸落地**（`v-element-style` 不再写 size）；元素框改为随字号自然变大变小
> （气泡 `--d` 另乘 `--fs-scale` 跟随模块字号缩放）。原「任意按住元素即可拖拽」
> 也已移除（`editable.js` 不再绑 pointerdown 拖拽——修复按住时间线等容器整块被移动）。

- **拖拽入口**：元素级选中 + 编辑态 + 该模块「拖拽摆放」开启时，高亮框右下角出现
  **拖拽手柄**（`.sel-drag`，grab 光标）。按住手柄才拖拽该元素（`SelectionBox.vue`）。
- **拖拽预览**：用 `transform: translate3d(...)` 预览跟手移动，**不触发重排/不写 layout**。
- **分步确认**：松手后元素停在预览位置，出现「✓ 确认修改 / ✕ 撤销」条：
  - 确认 → `historySetElementPos`（px→% 换算 + 持久化 + 可撤销）→ `editable.apply()` 落地 absolute 定位；
  - 撤销 / 切换选中 / 退出编辑态 → 清除预览回原位（`useLayout.pendingPos` 暂存态）。
- **协作**：气泡副本/粘贴由 §13.2 自动平移下标样式；气泡直径仍走
  `resolveBubbleSize`（元素级 `items.<index>.size` 覆盖优先），缩放改由 `--fs-scale` 驱动。
