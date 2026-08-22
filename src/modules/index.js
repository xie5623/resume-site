/* ============================================================
   src/modules/index.js — 模块注册表
   ------------------------------------------------------------
   作用：把 模块 id → Vue 组件 的映射集中在这里，
   App.vue 只按配置渲染，不关心具体组件是谁。
   新增一个真实模块的步骤：
     1. 把组件文件放进 src/modules/（如 HeroSection.vue）
     2. 取消下方对应 import 的注释
     3. 把注册表里的 ModulePlaceholder 换成真实组件
   真实组件必须遵守 ARCHITECTURE.md 的组件接口契约
   （props: config/lang，动画用 useReveal + TextReveal）。
   ============================================================ */

import { CONFIG } from '@/config/site.config'
import ModulePlaceholder from './ModulePlaceholder.vue'
import HeroModule from './HeroModule.vue'
import AboutModule from './AboutModule.vue'
import SkillsModule from './SkillsModule.vue'
import ExperienceModule from './ExperienceModule.vue'
import ProjectsModule from './ProjectsModule.vue'
import EducationModule from './EducationModule.vue'
import CertificatesModule from './CertificatesModule.vue'
import PortfolioModule from './PortfolioModule.vue'
import ContactModule from './ContactModule.vue'
import FooterModule from './FooterModule.vue'

/* ===================== 已实现组件 ===================== */
/* （模块 1-5：Hero / About / Skills / Experience / Projects） */
/* （模块 6-10：Education / Certificates / Portfolio / Contact / Footer） */

/* ===================== 待实现组件 ===================== */
/* 组件实现后：删除对应 import 注释，并把下方映射的值换掉 */
// import EducationSection from './EducationSection.vue'
// import CertificatesSection from './CertificatesSection.vue'
// import PortfolioSection from './PortfolioSection.vue'
// import ContactSection from './ContactSection.vue'
// import FooterSection from './FooterSection.vue'

/**
 * 模块注册表：id → 组件
 * 全部 10 个 id 都注册（含未实现的，统一指向占位组件），
 * 保证配置里即使全开也能渲染出不报错。
 */
export const moduleRegistry = {
  hero:         HeroModule,
  about:        AboutModule,
  skills:       SkillsModule,
  experience:   ExperienceModule,
  projects:     ProjectsModule,
  education:    EducationModule,
  certificates: CertificatesModule,
  portfolio:    PortfolioModule,
  contact:      ContactModule,
  footer:       FooterModule
}

/**
 * 按 id 取组件；未注册的 id 回退到占位组件（容错）。
 * @param {string} id 模块 id
 * @returns {object} 组件对象
 */
export function getModuleComponent(id) {
  return moduleRegistry[id] ?? ModulePlaceholder
}

/** 列出注册表里所有已注册的 id（调试用） */
export function getRegisteredIds() {
  return Object.keys(moduleRegistry)
}

/* 确保所有配置里的模块 id 都已注册（开发期提醒） */
if (import.meta.env.DEV) {
  const missing = CONFIG.modules
    .filter((m) => !moduleRegistry[m.id])
    .map((m) => m.id)
  if (missing.length) {
    console.warn('[modules] 未注册的模块 id：', missing, '将使用占位组件渲染。')
  }
}
