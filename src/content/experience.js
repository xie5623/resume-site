/* ============================================================
   content/experience.js — 工作经历 / 实习经历（experience）富内容
   ------------------------------------------------------------
   形状：{ templateId: { lang: { experience: {...} } } }
   来源：ExperienceModule.vue 原组件内 DICT + JOBS，迁移到内容层后
   由模块用 useContent().get(version, lang, 'experience.*') 读取。
   experience.items = [{ period, company, role, desc, tags: [] }]
   ============================================================ */

export const EXPERIENCE_CONTENT = {
  senior: {
    zh: {
      experience: {
        eyebrow: '职业轨迹',
        title: '工作经历',
        sub: '占位经历，按时间倒序排列。',
        now: '至今',
        present: '现任',
        items: [
          {
            period: '2022 — 至今',
            company: '某科技公司',
            role: '高级前端工程师',
            desc: '负责核心产品的前端架构与性能优化，主导设计系统落地，带领 4 人前端小组。占位描述，替换为你的真实职责与成果。',
            tags: ['Vue 3', 'TypeScript', 'Vite', 'GSAP']
          },
          {
            period: '2020 — 2022',
            company: '某互联网公司',
            role: '前端开发工程师',
            desc: '参与多条业务线 Web 端开发，搭建组件库与自动化构建流水线，显著提升交付效率。',
            tags: ['React', 'Node.js', 'Webpack', 'CI/CD']
          },
          {
            period: '2018 — 2020',
            company: '某设计工作室',
            role: '全栈工程师',
            desc: '从零搭建工作室官网与作品展示系统，独立完成前后端与部署，支撑品牌线上形象。',
            tags: ['Vue 2', 'Express', 'MongoDB', 'Nginx']
          },
          {
            period: '2017 — 2018',
            company: '某初创团队',
            role: 'Web 开发实习生',
            desc: '负责移动端 H5 页面开发与数据可视化图表实现，快速学习并落地多个小功能。',
            tags: ['JavaScript', 'ECharts', 'jQuery']
          }
        ]
      }
    },
    en: {
      experience: {
        eyebrow: 'CAREER',
        title: 'Experience',
        sub: 'Placeholder history, newest first.',
        now: 'Present',
        present: 'Current',
        items: [
          {
            period: '2022 — Present',
            company: 'Tech Company A',
            role: 'Senior Front-End Engineer',
            desc: 'Own the front-end architecture and performance of the flagship product, lead the design-system rollout, and mentor a 4-person FE team. Placeholder — replace with your real work.',
            tags: ['Vue 3', 'TypeScript', 'Vite', 'GSAP']
          },
          {
            period: '2020 — 2022',
            company: 'Internet Company B',
            role: 'Front-End Developer',
            desc: 'Built web features across several product lines, set up a component library and automated build pipeline, and visibly improved delivery speed.',
            tags: ['React', 'Node.js', 'Webpack', 'CI/CD']
          },
          {
            period: '2018 — 2020',
            company: 'Design Studio C',
            role: 'Full-Stack Engineer',
            desc: 'Built the studio website and portfolio system from scratch — front-end, back-end, and deployment done solo.',
            tags: ['Vue 2', 'Express', 'MongoDB', 'Nginx']
          },
          {
            period: '2017 — 2018',
            company: 'Startup D',
            role: 'Web Developer Intern',
            desc: 'Developed mobile H5 pages and data-visualization charts; picked things up fast and shipped several small features.',
            tags: ['JavaScript', 'ECharts', 'jQuery']
          }
        ]
      }
    }
  },

  graduate: {
    zh: {
      experience: {
        eyebrow: '实习轨迹',
        title: '实习经历',
        sub: '本科期间的实习与项目实战，快速学习、结果导向。',
        now: '至今',
        present: '近期',
        items: [
          {
            period: '2024.06 — 2024.09',
            company: '某互联网公司 · 前端实习',
            role: '前端开发实习生',
            desc: '参与核心产品前端开发，独立完成 3 个功能模块并接入 CI/CD；将首屏加载耗时降低 40%，获 mentor 好评。',
            tags: ['Vue 3', 'TypeScript', 'Vite', 'GSAP']
          },
          {
            period: '2023.09 — 2024.01',
            company: '某科技公司 · 全栈实习',
            role: '全栈开发实习生',
            desc: '参与内部管理系统前后端开发，用 Vue 3 + Node.js 完成数据看板模块，熟悉团队研发流程与代码规范。',
            tags: ['React', 'Node.js', 'Webpack', 'CI/CD']
          },
          {
            period: '2023.06 — 2023.08',
            company: '某创业团队 · 开发实习',
            role: 'Web 开发实习生',
            desc: '从 0 到 1 搭建团队官网与落地页，负责移动端 H5 适配与动效实现，上线后支撑了首次产品推广活动。',
            tags: ['Vue 2', 'Express', 'MongoDB', 'Nginx']
          },
          {
            period: '2022.07 — 2022.09',
            company: '某工作室 · 设计实习',
            role: '前端开发实习生',
            desc: '制作 UI 组件与页面原型，学习设计与开发协作方式，沉淀了第一个可展示的个人作品集页面。',
            tags: ['JavaScript', 'ECharts', 'jQuery']
          }
        ]
      }
    },
    en: {
      experience: {
        eyebrow: 'INTERNSHIP',
        title: 'Internship',
        sub: 'Internships and hands-on projects during undergrad — fast learner, results-driven.',
        now: 'Present',
        present: 'Recent',
        items: [
          {
            period: 'Jun 2024 — Sep 2024',
            company: 'Internet Company A · Frontend Intern',
            role: 'Front-End Developer Intern',
            desc: 'Built core product features, shipped 3 modules on my own with CI/CD; cut first-load time by 40% and got strong mentor feedback.',
            tags: ['Vue 3', 'TypeScript', 'Vite', 'GSAP']
          },
          {
            period: 'Sep 2023 — Jan 2024',
            company: 'Tech Company B · Full-stack Intern',
            role: 'Full-Stack Developer Intern',
            desc: 'Worked on the admin system end to end (Vue 3 + Node.js), shipped a data-dashboard module, and learned the team’s engineering process.',
            tags: ['React', 'Node.js', 'Webpack', 'CI/CD']
          },
          {
            period: 'Jun 2023 — Aug 2023',
            company: 'Startup C · Dev Intern',
            role: 'Web Developer Intern',
            desc: 'Built the team website and landing pages from scratch, handled mobile H5 and animations, and supported the first launch campaign.',
            tags: ['Vue 2', 'Express', 'MongoDB', 'Nginx']
          },
          {
            period: 'Jul 2022 — Sep 2022',
            company: 'Studio D · Design/Dev Intern',
            role: 'Front-End Developer Intern',
            desc: 'Built UI components and page prototypes, learned design–dev collaboration, and shipped my first presentable portfolio page.',
            tags: ['JavaScript', 'ECharts', 'jQuery']
          }
        ]
      }
    }
  }
}
