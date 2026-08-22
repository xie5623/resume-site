# 配置说明 / Configuration Guide

> 这是给**非技术用户**看的配置手册。想改简历网站的样子，只改一个文件：
> `src/config/site.config.js`，保存后刷新页面即可（开发模式下自动生效）。
>
> *This guide is for non-technical users. To change your resume site, edit only
> ONE file: `src/config/site.config.js`, save it, then refresh the page.*

---

## 0. 怎么开始 / Getting started

1. 打开文件 `src/config/site.config.js`（用任意文本编辑器，推荐 VS Code）。
2. 找到下面的 `VERSIONS` 部分（多版本配置：`senior` 资深版 / `graduate` 应届生版）。
3. 按本文档修改 → 保存 → 回到浏览器刷新。

*1. Open `src/config/site.config.js` in any text editor (VS Code recommended).
2. Find the `VERSIONS` section below (multi-version config: `senior` / `graduate`).
3. Make your edits → save → refresh the browser.*

---

## 0.5 多版本 / Versions

站点有两个版本，右上角切换器随时切换，各自独立持久化在浏览器里：

| 版本 id | 切换器文案 | 说明 |
|---------|-----------|------|
| `senior`（默认） | 资深版 / Senior | 现有版本，10 个模块 |
| `graduate` | 应届生版 / Graduate | 教育背景前移、工作经历改实习，模块骨架见 `VERSIONS.graduate` |

每个版本是一份完整配置：`brand`（站点名）、`lang`（默认语言）、`stickyNav`、
`modules`（模块列表，同一批组件可重排/精简）。改哪个版本就编辑 `VERSIONS` 里
对应的那一段。`CONFIG` 是默认版本（资深版）的别名，老配置代码不受影响。

*Two versions live in the top-right switcher, each persisted independently.
Each version is a full config block under `VERSIONS`; `CONFIG` stays as an alias
of the default (senior) version for backward compatibility.*

---

## 1. 改站点名 / Change the site name

找到你要改的版本（`VERSIONS.senior` 或 `VERSIONS.graduate`），里面这一行：

```js
brand: { zh: '我的简历', en: 'My Resume' },   // 资深版示例；中英各自独立
```

改成你想要的文字即可（`zh` 中文、`en` 英文分开填）。

*In the version block you want, edit `brand` — `zh` and `en` separately.*

---

## 2. 加一个模块 / Add a module

### 方法 A：把已禁用/占位的模块打开

配置里已经内置 10 个模块，每个模块是一行 `moduleCfg('模块id', {...})`。
找到它，把 `enabled: false` 改成 `enabled: true`：

```js
moduleCfg('about', { order: 1, enabled: true }),
```

### 方法 B：添加一个「未知 id」的模块（占位卡片）

复制任意一行，改成一个**新名字**（必须是英文小写单词），例如：

```js
moduleCfg('awards', { order: 2, animation: 'fade-up' }),   // 新增"奖项"模块（暂时显示占位卡片）
```

> 说明：新模块会先显示一张“占位组件”玻璃卡片，页面不报错。
> 想让它有真实内容，需要开发者在 `src/modules/` 写对应组件并在
> `src/modules/index.js` 注册（见 ARCHITECTURE.md）。
>
> *Note: an unknown id renders a placeholder glass card (no errors).
> Real content requires a developer to build & register a component.*

### 方法 C：去掉一个模块（不想显示某块）

把该模块的 `enabled` 改成 `false`，或者直接**整行删除**。

```js
moduleCfg('portfolio', { order: 7, enabled: false }),   // 隐藏作品集
```

---

## 3. 调整顺序 / Reorder modules

每个模块的 `order` 数字决定显示顺序（数字小在前）。改数字即可：

```js
moduleCfg('skills',  { order: 10 }),   // 放到更后面
moduleCfg('about',   { order: 1 }),
```

---

## 4. 切换入场动画 / Change entrance animation

每个模块可配 `animation`（整块进入视口的动画）和 `textAnim`（标题/文字动画）。

### 可用入场动画 / Available entrance animations (`animation`)

| 值 | 效果 |
|----|------|
| `'fade-up'` | 自下而上淡入（默认） |
| `'fade-down'` | 自上而下淡入 |
| `'fade-left'` | 从左淡入 |
| `'fade-right'` | 从右淡入 |
| `'zoom-in'` | 放大淡入 |
| `'scale-in'` | 由小放大 |
| `'flip-up'` / `'flip-in'` | 翻转进入 |
| `'slide-left'` / `'slide-right'` | 滑入 |
| `'slide-blur'` / `'blur-in'` | 位移+模糊 |
| `'fade-in'` | 纯淡入 |
| `'stagger-children'` | 子元素依次入场 |
| `'none'` | 无动画 |

示例：

```js
moduleCfg('about', { order: 1, animation: 'zoom-in' }),
```

### 可用文字动画 / Available text animations (`textAnim`)

| 值 | 效果 |
|----|------|
| `'typewriter'` | 打字机逐字出现（默认） |
| `'word-fade'` | 逐词淡入 |
| `'letter-float'` / `'letter-stagger'` | 逐字浮动 |
| `'gradient-shift'` | 霓虹渐变流动 |
| `'blur-in'` | 模糊到清晰 |
| `'line-clip'` | 行遮罩展开 |
| `'none'` | 无文字动画 |

示例：

```js
moduleCfg('about', { order: 1, textAnim: 'word-fade' }),
```

---

## 5. 调字号（内容自适应 / 手动） / Adjust font size

### 手动调大/调小

`fontScale`：`1` 是默认。`>1` 更大，`<1` 更小（范围 0.8 ~ 1.6）。

```js
moduleCfg('about', { order: 1, fontScale: 1.2 }),   // 这个模块字更大
```

### 内容自适应（自动）

网站默认开启**内容自适应字号**：某个模块内容很多（整块很高）会自动把字
稍微调小，内容很少会自动放大，保证整页节奏舒服。不需要额外设置；
如想对某个模块关掉自动，可把它 `fontScale` 设回 `1` 并保持内容量适中。

> *Auto-fit is on by default: dense modules get slightly smaller text,
> sparse ones slightly larger. No setup needed.*

---

## 6. 强调标题 / Emphasize a title

`emphasize: true` 让该模块标题变成霓虹渐变 + 字号再放大一点（×1.4）：

```js
moduleCfg('about', { order: 1, emphasize: true }),
```

---

## 7. 换布局变体 / Change layout variant

有些模块支持多套排版（`variant`）：

```js
moduleCfg('about', { order: 1, variant: 'b' }),   // a | b | c
```

> 不是每个模块三种变体都做了完整差异，尽量用默认 `'a'` 最稳。

---

## 8. 语言 / Language

默认语言在 `CONFIG.lang: 'zh'`，改成 `'en'` 默认英文；页面右上角按钮随时可切。
*Default language: `CONFIG.lang` (`'zh'` or `'en'`); the toggle in the top-right switches anytime.*

---

## 9. 元素级配置（编辑器内完成，无需改配置文件） / Per-element style (in the editor)

上面的配置都是**模块级**（整块生效）。**元素级配置**（某个文字/某个气泡单独调字号、
强调、大小）在**编辑器控制台**里完成，不写在 `site.config.js`：

- 打开编辑器 → 点中某个元素（标题/正文/技能气泡等）→ 左侧「模块配置」浮窗按元素编辑
  （字号缩放 / 渐变强调 / 大小等，由 console-dev 按需求 2/6/7 实现）。
- 元素级样式优先级高于模块级：元素级 → 模块级 → 默认，逐级回退。
- 持久化在浏览器 `localStorage`（key `resume-site.element-style`），刷新保留；
  恢复默认可在控制台全局页重置。
- **桌面版 / 手机版共享同一份元素级样式**（样式属于设计层，两端通用）。

*Per-element styling (single text/bubble) is done in the editor, not in
`site.config.js`. Element-level overrides module-level, which overrides defaults.
Persisted to `resume-site.element-style`; shared across desktop & mobile.*

---

## 快速对照表 / Cheat-sheet

```js
moduleCfg('模块id', {
  enabled: true,        // 是否显示
  order: 1,             // 顺序（小在前）
  animation: 'fade-up', // 入场动画（见第4节）
  textAnim: 'typewriter', // 文字动画（见第4节）
  fontScale: 1,         // 字号（0.8~1.6）
  emphasize: false,     // 是否霓虹强调标题
  variant: 'a'          // 布局变体 a|b|c
})
```

改坏了的补救：把这个文件还原成之前的样子，或交给开发者。
*Broken something? Revert the file or ask a developer.*
