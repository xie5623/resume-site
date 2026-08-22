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

  /* ===================== 应届生版：本科学历占位 ===================== */
  graduate: {
    zh: {
      education: {
        kicker: 'EDUCATION',
        title: '教育背景',
        subtitle: '本科学历 · 计算机科学与技术（2021—2025）',
        period: '时间',
        items: [
          {
            school: 'XX大学',
            major: '计算机科学与技术 · 本科',
            tag: '学士学位',
            desc: '主修数据结构、操作系统、计算机网络；GPA 3.6/4.0，获校级学业奖学金。',
            period: '2021 — 2025'
          },
          {
            school: 'XX中学',
            major: '理科方向',
            tag: '高中',
            desc: '理科背景，数学基础扎实，编程启蒙阶段。',
            period: '2018 — 2021'
          },
          {
            school: '在线学习平台',
            major: '前端开发 · 微专业',
            tag: '在线证书',
            desc: '系统性自学 Vue / TypeScript / 工程化，完成多个实战项目。',
            period: '2024'
          }
        ]
      }
    },
    en: {
      education: {
        kicker: 'EDUCATION',
        title: 'Education',
        subtitle: 'B.S. in Computer Science (2021—2025)',
        period: 'Period',
        items: [
          {
            school: 'XX University',
            major: 'B.S. in Computer Science',
            tag: "Bachelor's Degree",
            desc: 'Coursework: data structures, OS, computer networks. GPA 3.6/4.0, merit scholarship.',
            period: '2021 — 2025'
          },
          {
            school: 'XX High School',
            major: 'Science Track',
            tag: 'High School',
            desc: 'Science background with solid math foundations and early programming interest.',
            period: '2018 — 2021'
          },
          {
            school: 'Online Learning Platform',
            major: 'Frontend · Micro-degree',
            tag: 'Online Certificate',
            desc: 'Self-paced learning of Vue / TypeScript / engineering, with several hands-on projects.',
            period: '2024'
          }
        ]
      }
    }
  }
}
