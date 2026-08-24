/* ============================================================
   content/education.js — 教育背景（education）富内容（内容层 CONTENT 的一部分）
   ------------------------------------------------------------
   形状：{ templateId: { lang: { education: {...} } } }
   来源：EducationModule.vue 原组件内 DICT，迁移到内容层后由模块用
   useContent().get(version, lang, 'education.*') 读取。
   education.items = [{ school, major, tag, desc, period }]
   （数组读写由内容 store 支持，控制台可编辑每个列表项）
   ============================================================ */

export const EDUCATION_CONTENT = {
  /* ===================== 资深版：通用学历占位 ===================== */
  senior: {
    zh: {
      education: {
        kicker: 'EDUCATION',
        title: '教育背景',
        subtitle: '学历与专业训练（占位示例）',
        period: '时间',
        items: [
          {
            school: '示例大学',
            major: '计算机科学与技术 · 本科',
            tag: '学士学位',
            desc: '主修课程、成绩或奖学金等占位说明文字，用于展示卡片排版效果。',
            period: '2018 — 2022'
          },
          {
            school: '示例中学',
            major: '理科方向',
            tag: '高中',
            desc: '这里是一段占位描述，说明时间线卡片在中英双语下的排版表现。',
            period: '2015 — 2018'
          },
          {
            school: '线上学习平台',
            major: '前端开发 · 微专业',
            tag: '在线证书',
            desc: '持续学习能力的占位示例，体现自我驱动的学习经历。',
            period: '2023'
          }
        ]
      }
    },
    en: {
      education: {
        kicker: 'EDUCATION',
        title: 'Education',
        subtitle: 'Academic background (placeholder)',
        period: 'Period',
        items: [
          {
            school: 'Example University',
            major: 'B.S. in Computer Science',
            tag: "Bachelor's Degree",
            desc: 'Placeholder for coursework, GPA, or scholarships to demonstrate the card layout.',
            period: '2018 — 2022'
          },
          {
            school: 'Example High School',
            major: 'Science Track',
            tag: 'High School',
            desc: 'A placeholder paragraph showing how the timeline renders in both languages.',
            period: '2015 — 2018'
          },
          {
            school: 'Online Learning Platform',
            major: 'Frontend · Micro-degree',
            tag: 'Online Certificate',
            desc: 'A placeholder for self-driven learning to highlight continuous growth.',
            period: '2023'
          }
        ]
      }
    }
  },

  /* ===================== 应届生版：本科学历 ===================== */
  graduate: {
    zh: {
      education: {
        kicker: 'EDUCATION',
        title: '教育背景',
        subtitle: '示例大学 · 示例专业（占位）',
        period: '时间',
        items: [
          {
            school: '示例大学',
            major: '示例学院 · 示例专业',
            tag: '本科在读',
            desc: '主修课程等占位说明文字，用于展示教育卡片排版效果。可在控制台编辑为自己的真实学校与专业。',
            period: '2024.09 — 2028.06'
          }
        ]
      }
    },
    en: {
      education: {
        kicker: 'EDUCATION',
        title: 'Education',
        subtitle: 'Example University · Example Major (placeholder)',
        period: 'Period',
        items: [
          {
            school: 'Example University',
            major: 'Example School · Example Major',
            tag: 'Undergraduate (in progress)',
            desc: 'Placeholder for your real coursework. Edit this in the console to add your actual school and major.',
            period: 'Sep 2024 — Jun 2028'
          }
        ]
      }
    }
  }
}
