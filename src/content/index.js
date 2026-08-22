/* ============================================================
   content/index.js — 内容层（CONTENT）统一出口
   ------------------------------------------------------------
   三层分离中的【内容层】：页面上所有"文字/数据"的唯一数据源。

   CONTENT 形状（与 i18n messages 对齐，向后兼容）：
     CONTENT = {
       senior:   { zh: { common: {...}, hero: {...}, ... }, en: {...} },
       graduate: { zh: { ... }, en: { ... } }
     }

   组成：
     1. base（src/i18n/messages.js 的 MESSAGES）——common + 各模块基础
        命名空间（rich 中同名命名空间会被覆盖）。
     2. rich（hero / skills / experience / about / projects / education /
        certificates / portfolio / contact / footer）——模块改造的富内容，
        覆盖 base 里同名命名空间（形状以组件实际读取为准）。

   模块读内容一律走 useContent()（src/content/useContent.js），
   不要直接 import 本文件的 CONTENT（那是只读默认值）。
   ============================================================ */

import { MESSAGES } from '@/i18n/messages'
import { DEFAULT_VERSION } from '@/config/site.config'
import { HERO_CONTENT } from './hero'
import { SKILLS_CONTENT } from './skills'
import { EXPERIENCE_CONTENT } from './experience'
import { ABOUT_CONTENT } from './about'
import { PROJECTS_CONTENT } from './projects'
import { EDUCATION_CONTENT } from './education'
import { CERTIFICATES_CONTENT } from './certificates'
import { PORTFOLIO_CONTENT } from './portfolio'
import { CONTACT_CONTENT } from './contact'
import { FOOTER_CONTENT } from './footer'

/** 默认模板 id（= 默认版本，模板层别称） */
export const DEFAULT_TEMPLATE = DEFAULT_VERSION

/** 深度合并（后者覆盖前者；数组整体替换） */
function deepMerge(...objs) {
  const out = {}
  for (const obj of objs) {
    if (!obj || typeof obj !== 'object') continue
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === 'object' && !Array.isArray(v) &&
          out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
        out[k] = deepMerge(out[k], v)
      } else {
        out[k] = v
      }
    }
  }
  return out
}

/**
 * CONTENT — 内容层默认数据（读操作请走 useContent() 的响应式 store，
 * 这里只是「初始值 + 重置目标」）。
 */
export const CONTENT = deepMerge(
  {},
  MESSAGES,
  HERO_CONTENT,
  SKILLS_CONTENT,
  EXPERIENCE_CONTENT,
  ABOUT_CONTENT,
  PROJECTS_CONTENT,
  EDUCATION_CONTENT,
  CERTIFICATES_CONTENT,
  PORTFOLIO_CONTENT,
  CONTACT_CONTENT,
  FOOTER_CONTENT
)

/* 向后兼容别名：老代码 `import { MESSAGES } from '@/content'` 也能用 */
export const MESSAGES_ALIAS = CONTENT

export default CONTENT
