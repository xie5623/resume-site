/* ============================================================
   content/skills.js — 专业技能（skills）富内容（内容层 CONTENT 的一部分）
   ------------------------------------------------------------
   形状：{ templateId: { lang: { skills: {...} } } }
   来源：SkillsModule.vue 原组件内 DICT + SKILLS_BY_VERSION，迁移到
   内容层后由模块用 useContent().get(version, lang, 'skills.*') 读取。
   skills.items = [{ name, level }]（level 0~100，供进度条/环形图/标签云）
   ============================================================ */

export const SKILLS_CONTENT = {
  senior: {
    zh: {
      skills: {
        eyebrow: '技术能力',
        title: '专业技能',
        sub: '占位技能清单，熟练度数值可随意替换。',
        level: '熟练度',
        items: [
          { name: 'Vue.js', level: 92 },
          { name: 'TypeScript', level: 88 },
          { name: 'Node.js', level: 84 },
          { name: 'React', level: 78 },
          { name: 'CSS / SCSS', level: 90 },
          { name: 'Python', level: 74 },
          { name: 'GSAP Motion', level: 82 },
          { name: 'SQL / Database', level: 70 },
          { name: 'Docker', level: 66 },
          { name: 'Figma / Design', level: 72 },
          { name: 'Vite / Build', level: 85 },
          { name: 'Git / Workflow', level: 88 }
        ]
      }
    },
    en: {
      skills: {
        eyebrow: 'SKILLS',
        title: 'Skills',
        sub: 'Placeholder skill list; feel free to tweak the levels.',
        level: 'Level',
        items: [
          { name: 'Vue.js', level: 92 },
          { name: 'TypeScript', level: 88 },
          { name: 'Node.js', level: 84 },
          { name: 'React', level: 78 },
          { name: 'CSS / SCSS', level: 90 },
          { name: 'Python', level: 74 },
          { name: 'GSAP Motion', level: 82 },
          { name: 'SQL / Database', level: 70 },
          { name: 'Docker', level: 66 },
          { name: 'Figma / Design', level: 72 },
          { name: 'Vite / Build', level: 85 },
          { name: 'Git / Workflow', level: 88 }
        ]
      }
    }
  },

  graduate: {
    zh: {
      skills: {
        eyebrow: '技术能力',
        title: '专业技能',
        sub: '本科期间掌握的核心技术栈，仍在持续学习中。',
        level: '熟练度',
        items: [
          { name: 'HTML / CSS', level: 90 },
          { name: 'JavaScript (ES6+)', level: 86 },
          { name: 'Vue 3', level: 85 },
          { name: 'TypeScript', level: 80 },
          { name: 'Vite / Build', level: 78 },
          { name: 'Git / Workflow', level: 82 },
          { name: 'Node.js', level: 75 },
          { name: 'GSAP Motion', level: 74 },
          { name: 'Figma / Design', level: 72 },
          { name: 'Python', level: 70 },
          { name: 'React', level: 68 },
          { name: 'SQL / Database', level: 65 }
        ]
      }
    },
    en: {
      skills: {
        eyebrow: 'SKILLS',
        title: 'Skills',
        sub: 'Core stack learned during undergrad — still learning and growing.',
        level: 'Level',
        items: [
          { name: 'HTML / CSS', level: 90 },
          { name: 'JavaScript (ES6+)', level: 86 },
          { name: 'Vue 3', level: 85 },
          { name: 'TypeScript', level: 80 },
          { name: 'Vite / Build', level: 78 },
          { name: 'Git / Workflow', level: 82 },
          { name: 'Node.js', level: 75 },
          { name: 'GSAP Motion', level: 74 },
          { name: 'Figma / Design', level: 72 },
          { name: 'Python', level: 70 },
          { name: 'React', level: 68 },
          { name: 'SQL / Database', level: 65 }
        ]
      }
    }
  }
}
