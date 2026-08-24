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
        eyebrow: '技能能力',
        title: '掌握技能',
        sub: '熟练使用办公与工程软件，掌握 AIGC 与 vibecoding 编程，持续拓展 Web 开发。',
        level: '熟练度',
        items: [
          { name: 'WPS / 办公软件', level: 92 },
          { name: 'AIGC 应用', level: 88 },
          { name: 'SolidWorks 三维建模', level: 86 },
          { name: 'vibecoding 编程', level: 84 },
          { name: 'AutoCAD 工程制图', level: 82 },
          { name: '网页开发 (Web)', level: 76 },
          { name: '单片机开发', level: 74 }
        ]
      }
    },
    en: {
      skills: {
        eyebrow: 'SKILLS',
        title: 'Skills',
        sub: 'Proficient with office & engineering software, skilled in AIGC and vibecoding, and growing in web development.',
        level: 'Level',
        items: [
          { name: 'WPS / Office Suite', level: 92 },
          { name: 'AIGC Applications', level: 88 },
          { name: 'SolidWorks 3D Modeling', level: 86 },
          { name: 'Vibecoding', level: 84 },
          { name: 'AutoCAD Engineering Drawing', level: 82 },
          { name: 'Web Development', level: 76 },
          { name: 'Microcontroller Development', level: 74 }
        ]
      }
    }
  }
}
