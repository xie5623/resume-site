# 架构文档（ARCHITECTURE.md）

> 这是 **resume-site-team** 的协作契约。所有成员在写/改代码前先读这里。
> 技术栈：**Vue 3 (Composition API) + Vite + GSAP + Sass（可选）**
> 主题：**深色玻璃拟态** · 配置驱动：**site.config.js** · 模块化：**模块注册表**

---

## 1. 目录结构

```
resume-site/
├── index.html                  # 入口 HTML（title: 简历 | Resume）
├── package.json                # 依赖与脚本（dev/build/preview）
├── vite.config.js              # Vite + @ 别名 → src
└── src/
    ├── main.js                 # 应用入口：引入全局样式、挂载 App
    ├── App.vue                 # 骨架：导航 + 语言切换 + 模块渲染区
    ├── ARCHITECTURE.md         # 本文档（协作契约）
    │
    ├── config/
    │   ├── site.config.js      # ★ 配置系统（阶段二用户入口）
    │   │                       #   CONFIG / MODULE_IDS / MODULE_LABELS /
    │   │                       #   ALLOWED_* 常量表 / 帮助函数
    │   └── README-配置说明.md   # 给非技术用户的配置手册（t6）
    │
    ├── styles/
    │   ├── tokens.css          # 设计令牌：颜色/字体/间距/圆角/阴影/玻璃
    │   ├── base.css            # reset + 排版 + 滚动条 + 背景(site-bg)
    │   └── glass.css           # 毛玻璃工具类：.glass / .glass--strong /
    │                           #   .glass--glow / .glass--accent / .glass-btn
    │
    ├── composables/
    │   ├── useReveal.js        # 入场动画 composable（t2 已实现）
    │   ├── useTextAnim.js      # 文字显现动画库（t2 已实现）
    │   ├── useMotion.js        # 动效降级/响应式策略（t5 已实现）
    │   ├── motion.js           # 兼容层（re-export useMotion + 工具函数）
    │   ├── moduleReveal.js     # 模块 revealed 共享状态（t6：App↔模块）
    │   └── useAutoFit.js       # 内容自适应字号（t6 阶段二核心）
    │
    ├── i18n/
    │   ├── messages.js         # 中英双语占位文案数据源（t5）
    │   └── index.js            # 轻量 i18n：useI18n() / t / setLang（t5）
    │
    ├── animations/
    │   └── index.js            # 动画系统统一出口 setupAnimations()（t2）
    │
    ├── components/
    │   ├── TextReveal.vue      # 文字动画组件（t2 已实现）
    │   ├── LangToggle.vue      # 语言切换按钮（t5 已实现）
    │   └── ModuleSection.vue   # ★ 模块装配容器（t6：模块级入场+自适应字号）
    │
    └── modules/
        ├── index.js            # ★ 模块注册表：id → 组件
        ├── ModulePlaceholder.vue   # 未实现模块的统一占位卡片
        └── … 共 10 个（HeroModule / AboutModule / … / FooterModule）
```

---

## 2. 模块组件约定（最重要）

**每个模块 = 一个 Vue 组件**，放在 `src/modules/`，命名 `<id 首字母大写>Section.vue`，
如 `HeroSection.vue`、`SkillsSection.vue`。

### 2.1 组件的 Props（固定契约，所有模块必须遵守）

| Prop    | 类型   | 必填 | 说明 |
|---------|--------|------|------|
| `config`| Object | 是   | 该模块的配置对象，见下方字段 |
| `lang`  | String | 是   | 当前语言 `'zh' \| 'en'`，组件内部据此切换文案 |

`config` 对象字段（来自 site.config.js，所有字段**永远有默认值**）：

```js
{
  id: 'about',            // 模块唯一 id
  enabled: true,          // 是否渲染（App.vue 已过滤，组件内可忽略）
  order: 1,               // 渲染顺序（App.vue 已排序，组件内可忽略）
  label: { zh: '关于我', en: 'About' },  // 双语显示名
  animation: 'fade-up',   // 区块入场动画（useReveal 消费）
  textAnim: 'typewriter', // 文字动画（TextReveal 消费）
  fontScale: 1,           // 字号缩放系数 0.8 ~ 1.6
  emphasize: false,       // 标题是否用霓虹渐变强调（加 .text-emphasize）
  variant: 'a'            // 布局变体 'a' | 'b' | 'c'
}
```

### 2.2 组件内必须做的事

> **t6 更新（装配契约）**：模块级滚动入场已上移到 App 装配层
> （`src/components/ModuleSection.vue`）统一负责——它用 `useReveal` 监听
> 每个模块容器进入视口，进入后通过 `markModuleRevealed(id)` 通知模块。
> 因此模块组件**不再自己建 ScrollTrigger**，只读取共享的 `revealed` 信号；
> 模块根元素上的**字号也不再由模块自己设 `--fs-scale`**，而是继承
> App 装配层注入的 `--fs-scale`（含 内容自适应 × fontScale × emphasize）。

1. **入场状态（必须）**：模块根元素绑定的 `revealed` 来自共享 store：

   ```js
   import { useModuleReveal } from '@/composables/moduleReveal'
   const revealed = useModuleReveal(props.config.id)
   ```

   之后照常用 `revealed` 驱动内部错峰/进度条：`:class="{ 'is-revealed': revealed }"`
   或 `:data-revealed="revealed ? 'yes' : 'no'"`。**不要**再 import/调用
   `useReveal`（那是 App 装配层的事）。

2. **文字动画**：标题/正文需要文字动画时用 `<TextReveal>`：

   ```html
   <TextReveal :anim="config.textAnim" :text="t('title')" :delay="0.2" />
   ```

3. **主题样式**：一律引用 tokens.css 变量 + glass.css 工具类，**禁止硬编码色值**。
4. **字号缩放（自动生效）**：App 装配层已把
   `--fs-scale = 内容自适应 × config.fontScale × (emphasize ? 1.4 : 1)`
   注入到模块容器。模块内字号用 `calc(var(--fs-*) * var(--fs-scale))`
   （**不要**再在根元素上写 `:style="{ '--fs-scale': config.fontScale }"`，
   会覆盖装配层的自适应结果）。
5. **强调**：`config.emphasize === true` 时标题加 `.text-emphasize` 类
   （渐变文字；放大由第 4 条的 ×1.4 完成）。
6. **双语**：内部维护 `const t = (key) => (props.lang === 'en' ? EN[key] : ZH[key])`
   的简单词典即可（或直接用 `useI18n()`，t5 提供）。

### 2.3 实现后注册

在 `src/modules/index.js` 中：
1. 取消对应 `import` 注释；
2. 把 `moduleRegistry[id]` 从 `ModulePlaceholder` 换成真实组件。

**不要**在 App.vue 里写死组件——一律走注册表。

---

## 3. 动画系统契约（t2 已实现）

以下接口已实现（`src/composables/`、`src/components/`），模块成员直接调用：

### 3.1 `useReveal(animOrEl, options?)` — composable

- 位置：`src/composables/useReveal.js`
- **用法一（App 装配层）**：`useReveal(elRef, { animation, start: 'top 88%' })`
  → 返回 `{ cleanup, revealed }`，绑定到模块容器做滚动入场。
- **用法二（其它动画）**：`useReveal('fade-up', { delay })` → `{ revealRef, revealed }`
- 预设覆盖 `ALLOWED_ANIMATIONS` 全部 15 个值，见 `REVEAL_PRESETS`。
- 小屏/系统减少动效自动降级为纯透明度。

### 3.2 `<TextReveal :anim :text :delay />` — 组件

- 位置：`src/components/TextReveal.vue`
- Props：`anim`（`ALLOWED_TEXT_ANIMS` 之一）、`text`、`as`（默认 span）、
  `delay`、`duration`、`autoplay`。
- 预设覆盖 `ALLOWED_TEXT_ANIMS` 全部 8 个值（`letter-float` 为
  `letter-stagger` 别名），见 `useTextAnim.js` 的 `TEXT_ANIM_PRESETS`。
- 文字/语言变化自动重播；系统减少动效时直接显示完整文本。

### 3.3 统一出口

`src/animations/index.js`：`setupAnimations()`（main.js 已调用一次）+ 全部
动画相关 re-export。全局初始化只需一次，见 `src/main.js`。

---

## 3.5 t6 装配层契约（App.vue + ModuleSection）

> 阶段二核心能力在装配层实现，模块组件无需关心。

- **配置驱动渲染**：App.vue 只做
  `getEnabledModules()`（过滤 enabled + 按 order 排序）→ `v-for` 渲染
  `<ModuleSection :module="m" :lang="currentLang" />`。用户增删/排序/开关模块
  只改 `src/config/site.config.js` 的 `CONFIG.modules` 即可生效。
- **`ModuleSection.vue`（模块装配容器）**职责：
  1. 模块级滚动入场：`useReveal(sectionRef, { animation: m.animation })` →
     进入视口后 `markModuleRevealed(m.id)`；
  2. 内容自适应字号：`useAutoFit(sectionRef, { baseFontScale: m.fontScale })`，
     与 `m.fontScale` 乘算、`m.emphasize` 时 ×1.4，注入
     `--fs-scale` 与 `--mod-font-scale` 两个 CSS 变量；
  3. `<component :is="getModuleComponent(m.id)" :config="m" :lang="lang" />`。
- **`useAutoFit(el, { baseFontScale })`**（`src/composables/useAutoFit.js`）：
  用 ResizeObserver + window resize + 字体加载重算，按模块内容量给字号缩放：
  内容多（整块 > 1.05 屏高）→ 缩小到贴近一屏；内容很少（< 0.35 屏高）→
  放大到 ×1.15；带滞回避免抖动。返回 `{ fitRef, scale, modFontScale }`。
- **`moduleReveal.js`**：`registerModuleReveal(id)` / `markModuleRevealed(id)` /
  `useModuleReveal(id)`。App 装配层负责标记，模块只读。
- **配置手册**：`src/config/README-配置说明.md`（给非技术用户的步骤式说明）。

---

## 4. 主题变量用法速查

| 想做什么 | 用什么 |
|----------|--------|
| 页面背景（渐变+光晕+网格） | 根节点加 `class="site-bg"` |
| 玻璃卡片 | `class="glass"`（hover 自动亮） |
| 更强玻璃（导航/浮层） | `class="glass glass--strong"` |
| 卡片内霓虹晕 | `class="glass glass--glow"` |
| 霓虹渐变描边强调卡 | `class="glass glass--accent"` |
| 玻璃按钮 | `class="glass-btn"` 或 `glass-btn glass-btn--accent` |
| 输入框 | `class="glass-input"` |
| 内容居中容器 | `class="container"` |
| 霓虹渐变文字 | 加 `.text-emphasize`（或用 tokens 的 `--accent-gradient`） |
| 文字色 | `var(--text-primary/secondary/muted)` |
| 强调色 | `var(--accent-cyan / --accent-purple / --accent-pink)` |
| 间距 | `var(--space-1..12)` |
| 圆角 | `var(--radius-sm/md/lg/xl/pill)` |
| 阴影 | `var(--shadow-sm/md/lg/glow)` |
| 字号 | `var(--fs-xs..2xl)` |

> 需要新颜色/尺寸时，**先加进 tokens.css 再引用**，不要就地硬编码。

---

## 5. 开发流程

```bash
npm install      # 装依赖
npm run dev      # 本地开发 http://localhost:5173
npm run build    # 产物 → dist/
```

- 每实现一个模块组件：注册进 `src/modules/index.js`，跑 `npm run dev` 自查。
- 每改一个共享接口（注册表/useReveal/TextReveal/配置字段）：**在群里@相关成员**，
  避免各改各的契约。
- 阶段二增强点（增删模块/切动画/自适应字号/强调字号）都挂在 `CONFIG` 上，
  现在就把组件写得**读配置、不写死**。

---

## 6. i18n / 响应式 / 动效降级契约（t5 新增）

> 双语与响应式由 **i18n-dev** 落地，所有模块与动画接口按此约定调用。

### 6.1 轻量 i18n（src/i18n/）

- **数据源**：`src/i18n/messages.js` — `messages = { zh: {...}, en: {...} }`，
  键按模块命名空间（`hero.name` / `skills.title` / `experience.items` …），
  值可为字符串或数组（列表占位直接 `v-for`）。
- **入口**：`src/i18n/index.js`，无 vue-i18n 依赖。
- **API**（`useI18n()` 返回）：
  - `t(key)` — 点路径取文案；取不到回退 zh，再取不到返回 key。
  - `lang` — 响应式 ref，`'zh' | 'en'`。
  - `setLang(next)` / `toggleLang()` — 切换并写 localStorage
    （key `resume-site.lang`），自动同步 `<html lang>`。
- **初始化顺序**：localStorage → 浏览器语言 → `CONFIG.lang`。
- **与模块的兼容**：App.vue 仍把 `:lang` 传给模块（t3/t4 现有本地词典
  写法不用改）；新模块建议直接用 `useI18n()`。

### 6.2 动效降级策略（src/composables/useMotion.js）

- 单例 composable，供 **animator（useReveal / TextReveal）与所有模块**共用，
  不要各自重复实现判断。
- 导出：
  - `isMotionReduced()` — 系统「减少动效」（`prefers-reduced-motion: reduce`）。
  - `isNarrowScreen()` — 视口 < 768px（移动端）。
  - `useMotion()` — 响应式 `{ motionReduced, narrow, isMobile, simplified }`。
- **降级约定**：`simplified === true`（系统减少动效 **或** 移动端）时，
  入场/文字动画统一退化为 **透明度过渡**；`typewriter` 等重动画在移动端
  强制关闭（TextReveal 需消费 `simplified`）。
- animator 合并点：useReveal 内部读 `useMotion().simplified`，命中则
  直接 `opacity` 淡入并跳过位移/翻转/模糊等位移型动画。

### 6.3 响应式断点与工具

- 断点变量在 `styles/tokens.css`：`--bp-sm: 480px` / `--bp-md: 768px` /
  `--bp-lg: 1024px`（与 `useMotion.js` 的 `BP_*` 常量对齐）。
- CSS `@media` 直接写像素字面量（如 `min-width: 768px`）。
- 栅格工具在 `styles/glass.css`：`.grid`（默认单列）、`.grid--2` / `.grid--3`
  （≥768px 展开）、`.grid--auto`（自适应 minmax）。
- 导航：App.vue 窄屏（<768px）收成汉堡菜单 + 下拉面板，桌面保留横向链接。
- 语言切换：App.vue 内 `.site-main--fading` 做 300ms 淡入淡出，不重挂载。

### 6.4 语言切换组件

- `src/components/LangToggle.vue` — 玻璃分段「中 / EN」，active 霓虹高亮，
  已接入 App.vue 右上角。

---

## 7. 已知待办

- [x] 项目脚手架 + 主题系统 + 配置系统 + 模块注册表（t1）
- [x] GSAP 动画引擎：useReveal / useTextAnim / TextReveal / setupAnimations（t2）
- [x] 模块 1-5：Hero / About / Skills / Experience / Projects（t3）
- [x] 模块 6-10：Education / Certificates / Portfolio / Contact / Footer（t4）
- [x] 轻量 i18n + 双语文案 + LangToggle + 响应式 + 动效降级（t5）
- [x] App.vue 装配 + 配置驱动渲染 + 模块级入场 + 内容自适应字号（useAutoFit）
      + 强调字号 + 配置手册 README-配置说明.md（t6）
- [ ] 阶段二：配置可视化面板（增删模块/切动画/字号/强调）——读 CONFIG + 常量表
- [ ] 模块组件内的本地词典逐步迁移到全局 i18n（messages.js）
