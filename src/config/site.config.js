/* ============================================================
   site.config.js — 模板层（TEMPLATE）配置
   ------------------------------------------------------------
   三层分离中的【模板层】：决定"结构"——用哪些模块、什么顺序、
   每个模块的动画/字号/强调/变体配置。不含具体文字内容
   （文字在内容层 src/content/，外观在主题层 src/themes/）。

   - 换模板 = 换模块编排（同批组件可重排/精简/开关）
   - 换主题/内容完全不影响这里
   - 保留"版本(version)"术语作为模板的别名：useVersion() 切换的
     就是模板；VERSIONS / TEMPLATES 指向同一份数据。

   多模板机制（VERSIONS = TEMPLATES）：
     - 每个模板 = { id, label, brand(兜底), lang, stickyNav, modules }。
     - DEFAULT_VERSION = 'senior'（资深版）为默认模板，
       CONFIG 是它的向后兼容别名（老代码照常读 CONFIG.modules 等）。
     - 应届生版（graduate）复用同一批模块组件，仅重排/精简 modules。
     - 运行时"增删/排序/开关模块"请走 src/composables/useTemplates.js
       （响应式 store，控制台写它 → 页面实时变），不要直接改本文件。
   ============================================================ */

/* 项目仓库地址：导出成品的末尾署名链接指向这里（部署前请改成你的仓库地址） */
export const REPO_URL = 'https://github.com/yourname/resume-site'

/* 允许的模块 id（注册表校验用） */
export const MODULE_IDS = [
  'hero', 'about', 'skills', 'experience',
  'projects', 'education', 'certificates', 'portfolio',
  'contact', 'footer'
]

/* 模块显示名（中英双语，导航/占位卡片用） */
export const MODULE_LABELS = {
  hero:         { zh: '首屏',     en: 'Hero' },
  about:        { zh: '关于我',   en: 'About' },
  skills:       { zh: '专业技能', en: 'Skills' },
  experience:   { zh: '工作经历', en: 'Experience' },
  projects:     { zh: '项目',     en: 'Projects' },
  education:    { zh: '教育背景', en: 'Education' },
  certificates: { zh: '证书认证', en: 'Certificates' },
  portfolio:    { zh: '作品集',   en: 'Portfolio' },
  contact:      { zh: '联系方式', en: 'Contact' },
  footer:       { zh: '页脚',     en: 'Footer' }
}

/* ===================== 允许值常量表 ===================== */
/* 阶段二下拉框直接读这些常量，保证不产生非法值 */

/** 区块入场动画：组件用 useReveal 消费 */
export const ALLOWED_ANIMATIONS = [
  'fade-up',      // 自下而上淡入（默认）
  'fade-down',    // 自上而下淡入
  'fade-left',    // 自左向右淡入
  'fade-right',   // 自右向左淡入
  'zoom-in',      // 由小放大淡入
  'flip-up',      // 翻转上移
  'slide-blur',   // 位移 + 模糊消散
  /* --- 动画系统新增预设（useReveal 已支持） --- */
  'fade-in',          // 纯淡入
  'slide-left',       // 自左滑入
  'slide-right',      // 自右滑入
  'scale-in',         // 放大淡入（zoom-in 的变体）
  'blur-in',          // 模糊到清晰
  'flip-in',          // 翻转进入
  'stagger-children', // 子元素错峰入场
  'none'          // 无动画（直接显示）
]

/** 文字入场动画：用 <TextReveal> 组件消费 */
export const ALLOWED_TEXT_ANIMS = [
  'typewriter',   // 打字机逐字出现
  'word-fade',    // 逐词淡入
  'letter-float', // 逐字浮动
  'gradient-shift', // 渐变流动
  /* --- 动画系统新增预设（useTextAnim 已支持） --- */
  'letter-stagger', // 逐字上浮（letter-float 的别名）
  'blur-in',        // 模糊到清晰
  'line-clip',      // 行遮罩展开
  'none'          // 无文字动画
]

/** 布局变体：同一模块可提供多种排版样式（d = 专业技能气泡图，见 ARCHITECTURE §14） */
export const ALLOWED_VARIANTS = ['a', 'b', 'c', 'd']

/** 每个模块可配置的最小/最大字号缩放（阶段二"内容自适应字号"） */
export const FONT_SCALE_RANGE = { min: 0.8, max: 1.6, step: 0.05 }

/** 入场动画时长（秒）配置，供 useReveal 读取 */
export const ANIMATION_DURATION = {
  fast: 0.5,
  base: 1.0,
  slow: 1.4
}

/* ===================== 模块配置默认值 ===================== */
/**
 * 单个模块的完整配置字段说明：
 *  - id        : 唯一标识，须在 MODULE_IDS 中
 *  - enabled   : 是否渲染（阶段二"增删模块"改这里）
 *  - order     : 渲染顺序（升序）
 *  - label     : 导航/占位用显示名
 *  - animation : 区块入场动画，见 ALLOWED_ANIMATIONS
 *  - textAnim  : 区块内标题/正文文字动画，见 ALLOWED_TEXT_ANIMS
 *  - fontScale : 字号缩放系数，1 为默认，范围见 FONT_SCALE_RANGE
 *  - emphasize : 是否启用霓虹渐变强调标题（text-emphasize 类）
 *  - variant   : 布局变体 'a' | 'b' | 'c'
 *  - label     : （可选）覆盖默认显示名（如应届生版 experience 显示「实习经历」）
 */
function moduleCfg(id, { enabled = true, order = 0, animation = 'fade-up',
                         textAnim = 'typewriter', fontScale = 1,
                         emphasize = false, variant = 'a',
                         label = null } = {}) {
  return {
    id,
    enabled,
    order,
    label: label ?? MODULE_LABELS[id] ?? { zh: id, en: id },
    animation,
    textAnim,
    fontScale,
    emphasize,
    variant
  }
}

/* ===================== 设备（DEVICE 维度·第四层） ===================== */
/** 允许的设备 id（桌面版 / 手机版两套专属模板） */
export const DEVICE_IDS = ['desktop', 'mobile']

/** 默认设备（无手动切换时） */
export const DEFAULT_DEVICE = 'desktop'

/* ===================== 版本 ===================== */
/** 允许的版本 id（切换器只渲染这些版本） */
export const VERSION_IDS = ['senior', 'graduate']

/** 默认版本：无参调用（getEnabledModules() 等）时使用的版本 */
/* 站长本人为在读本科生，默认用「应届生」模板（graduate）——其内容已按
   真实简历填写；若切到 senior（工作经历）版，内容为占位待填。 */
export const DEFAULT_VERSION = 'graduate'

/**
 * 多版本配置字典：版本 id → 完整站点配置。
 * 字段：
 *  - id        : 版本唯一标识（与 key 一致）
 *  - label     : 版本名（版本切换器按钮文案，中英双语）
 *  - brand     : 站点品牌名。字符串或 { zh, en } 对象（跟随语言）
 *  - lang      : 该版本默认语言（i18n 初始化读取）
 *  - stickyNav : 顶部导航是否吸顶
 *  - modules   : 该版本的模块列表（同一批组件，可重排/精简）
 */
export const VERSIONS = {
  /* -------------------- 资深版（默认） -------------------- */
  senior: {
    id: 'senior',
    label: { zh: '资深版', en: 'Senior' },
    brand: { zh: '我的简历', en: 'My Resume' },
    lang: 'zh',
    stickyNav: true,
    modules: [
      moduleCfg('hero',         { order: 0,  animation: 'fade-in', variant: 'a' }),
      moduleCfg('about',        { order: 1,  animation: 'fade-up' }),
      moduleCfg('skills',       { order: 2,  animation: 'fade-up', variant: 'd' }),
      moduleCfg('experience',   { order: 3,  animation: 'fade-up' }),
      moduleCfg('projects',     { order: 4,  animation: 'fade-up', variant: 'b' }),
      moduleCfg('education',    { order: 5,  animation: 'fade-up' }),
      moduleCfg('certificates', { order: 6,  animation: 'fade-up', variant: 'c' }),
      moduleCfg('portfolio',    { order: 7,  animation: 'zoom-in' }),
      moduleCfg('contact',      { order: 8,  animation: 'fade-up' }),
      moduleCfg('footer',       { order: 9,  animation: 'none', textAnim: 'none' })
    ],
    /* 手机版专属编排（DEVICE 维度，module-builder T3 细化）：可完全不同。
       - 精简掉 portfolio（移动端少滚动）
       - 动效改轻量：全 fade-* 系、hero 去文字动画（省电、少卡顿）
       - 信息优先：skills 用气泡图 variant d（--bubble-scale 缩放下少占高度）、
         experience 用卡片列表 variant c（比时间线紧凑）、
         hero fontScale 0.92 更紧凑（配合 .is-mobile 布局收紧）
       运行时编辑走 useTemplates（desktop/mobile 两套独立）。 */
    mobile: [
      moduleCfg('hero',         { order: 0,  animation: 'fade-in',  textAnim: 'none', variant: 'a', fontScale: 0.92 }),
      moduleCfg('about',        { order: 1,  animation: 'fade-up',  variant: 'a' }),
      moduleCfg('skills',       { order: 2,  animation: 'fade-up',  variant: 'd' }),
      moduleCfg('experience',   { order: 3,  animation: 'fade-up',  variant: 'c' }),
      moduleCfg('projects',     { order: 4,  animation: 'fade-up',  variant: 'b' }),
      moduleCfg('education',    { order: 5,  animation: 'fade-up',  variant: 'a' }),
      moduleCfg('certificates', { order: 6,  animation: 'fade-up',  variant: 'c' }),
      moduleCfg('contact',      { order: 7,  animation: 'fade-up',  variant: 'a' }),
      moduleCfg('footer',       { order: 8,  animation: 'none', textAnim: 'none' })
    ]
  },

  /* -------------------- 应届生版 -------------------- */
  /*
   * 编排（T3 module-builder 已细化）：
   *   hero → about → education → skills → projects → experience(实习) → contact → footer
   * - about 保留：展示「自我评价」（站长要求加回）
   * - education 第 2 位：应届生以本科学历为卖点（占位：XX大学 / 计算机科学与技术 / 2021—2025）
   * - experience 复用同一时间线组件，文案为「实习经历」应届生口吻（组件内按版本取 i18n 键）
   * - 精简掉 certificates / portfolio（证书栏暂空，站长要求不展示）
   * - 动效更活泼：hero 用 fade-in、education 用 zoom-in 突出学历亮点
   * - experience 模块 label 覆盖为「实习经历」，导航随版本正确显示
   */
  graduate: {
    id: 'graduate',
    label: { zh: '应届生版', en: 'Graduate' },
    brand: { zh: '应届生简历', en: 'Graduate Resume' },
    lang: 'zh',
    stickyNav: true,
    modules: [
      moduleCfg('hero',         { order: 0,  animation: 'fade-in', textAnim: 'letter-float', variant: 'a' }),
      moduleCfg('about',        { order: 1,  animation: 'fade-up', variant: 'a' }),
      moduleCfg('education',    { order: 2,  animation: 'zoom-in', textAnim: 'letter-stagger' }),
      moduleCfg('skills',       { order: 3,  animation: 'fade-up', variant: 'd' }),
      moduleCfg('projects',     { order: 4,  animation: 'fade-up', variant: 'b' }),
      moduleCfg('experience',   { order: 5,  animation: 'fade-up', label: { zh: '实习经历', en: 'Internship' } }),
      moduleCfg('contact',      { order: 6,  animation: 'fade-up' }),
      moduleCfg('footer',       { order: 7,  animation: 'none', textAnim: 'none' })
    ],
    /* 手机版专属编排（DEVICE 维度，module-builder T3 细化）：模块集与桌面
       一致但更紧凑轻量：
       - hero 去文字动画 + fontScale 0.92（更紧凑）
       - 动效重活换轻量（zoom-in / letter-* → fade-up，移动端更顺滑）
       - skills 气泡图 variant d（--bubble-scale 缩放下紧凑）、
         experience 卡片列表 variant c（少占高度） */
    mobile: [
      moduleCfg('hero',         { order: 0,  animation: 'fade-in',  textAnim: 'none', variant: 'a', fontScale: 0.92 }),
      moduleCfg('about',        { order: 1,  animation: 'fade-up',  variant: 'a' }),
      moduleCfg('education',    { order: 2,  animation: 'fade-up',  variant: 'a' }),
      moduleCfg('skills',       { order: 3,  animation: 'fade-up',  variant: 'd' }),
      moduleCfg('projects',     { order: 4,  animation: 'fade-up',  variant: 'b' }),
      moduleCfg('experience',   { order: 5,  animation: 'fade-up',  variant: 'c', label: { zh: '实习经历', en: 'Internship' } }),
      moduleCfg('contact',      { order: 6,  animation: 'fade-up',  variant: 'a' }),
      moduleCfg('footer',       { order: 7,  animation: 'none', textAnim: 'none' })
    ]
  }
}

/* ===================== 向后兼容别名 ===================== */
/**
 * CONFIG 保留为「默认模板（资深版）」的别名。
 * 老代码 `CONFIG.modules` / `CONFIG.lang` / `CONFIG.stickyNav` 照常可用；
 * 注意 `CONFIG.brand` 现在是 { zh, en } 对象，取文案请用 getVersionBrand()。
 */
export const CONFIG = VERSIONS[DEFAULT_VERSION]

/* ===================== 模板层（TEMPLATE）别名 ===================== */
/**
 * TEMPLATES = VERSIONS：同一份数据，「模板」语义名。
 * 版本(version) 与 模板(template) 是同义词——模板决定模块编排。
 */
export const TEMPLATES = VERSIONS

/** 默认模板 id（= 默认版本） */
export const DEFAULT_TEMPLATE = DEFAULT_VERSION

/** 按模板 id 取模板配置；未知 id 回退默认模板（永不返回 undefined） */
export function getTemplate(id) {
  return TEMPLATES[id] ?? TEMPLATES[DEFAULT_TEMPLATE]
}

/** 所有模板（按 TEMPLATE_IDS 顺序），给模板切换器渲染用 */
export function getTemplates() {
  return VERSION_IDS.map((id) => TEMPLATES[id])
}

/** 返回某模板的全部模块配置（未过滤，含 disabled）；无参时默认模板 */
export function getTemplateModules(templateId = DEFAULT_TEMPLATE) {
  return getTemplate(templateId).modules
}

/** 按设备取某模板的模块编排（静态配置；运行时编辑请走 useTemplates） */
export function getTemplateModulesForDevice(templateId = DEFAULT_TEMPLATE, device = DEFAULT_DEVICE) {
  const tpl = getTemplate(templateId)
  if (device === 'mobile' && Array.isArray(tpl.mobile)) return tpl.mobile
  return tpl.modules
}

/* ===================== 派生帮助函数 ===================== */
/** 按版本 id 取版本配置；未知 id 回退默认版本（永不返回 undefined） */
export function getVersion(id) {
  return VERSIONS[id] ?? VERSIONS[DEFAULT_VERSION]
}

/** 所有版本（按 VERSION_IDS 顺序），给切换器渲染用 */
export function getVersions() {
  return VERSION_IDS.map((id) => VERSIONS[id])
}

/** 返回某版本按 order 排序且启用的模块配置数组；无参时默认资深版 */
export function getEnabledModules(versionId = DEFAULT_VERSION) {
  return getVersion(versionId).modules
    .filter((m) => m.enabled)
    .sort((a, b) => a.order - b.order)
}

/** 按 id 查某版本的模块配置，找不到返回 undefined；无参时默认资深版 */
export function getModuleById(id, versionId = DEFAULT_VERSION) {
  return getVersion(versionId).modules.find((m) => m.id === id)
}

/** 取某版本品牌名（跟随语言）。brand 支持字符串或 { zh, en } 对象 */
export function getVersionBrand(versionId, lang = 'zh') {
  const brand = getVersion(versionId)?.brand ?? ''
  if (typeof brand === 'string') return brand
  return brand?.[lang] ?? brand?.zh ?? ''
}

/** 校验某个模块配置是否合法，返回 { ok, errors } */
export function validateModuleConfig(m) {
  const errors = []
  if (!MODULE_IDS.includes(m.id)) errors.push(`未知模块 id: ${m.id}`)
  if (!ALLOWED_ANIMATIONS.includes(m.animation)) errors.push(`非法 animation: ${m.animation}`)
  if (!ALLOWED_TEXT_ANIMS.includes(m.textAnim)) errors.push(`非法 textAnim: ${m.textAnim}`)
  if (!ALLOWED_VARIANTS.includes(m.variant)) errors.push(`非法 variant: ${m.variant}`)
  if (typeof m.fontScale !== 'number') errors.push('fontScale 必须是数字')
  return { ok: errors.length === 0, errors }
}
