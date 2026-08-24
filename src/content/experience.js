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
        ],
        more: { showMore: true, text: '正在丰富中' }
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
        ],
        more: { showMore: true, text: 'More coming soon' }
      }
    }
  },

  graduate: {
    zh: {
      experience: {
        eyebrow: '实习轨迹',
        title: '实习经历',
        sub: '实习经历整理中，后续将持续补充。',
        now: '至今',
        present: '近期',
        items: [],
        /* 「正在丰富中」占位卡：showMore=false 即隐藏（可选项） */
        more: { showMore: true, text: '正在丰富中' }
      }
    },
    en: {
      experience: {
        eyebrow: 'INTERNSHIP',
        title: 'Internship',
        sub: 'Internship experience is being compiled — more to come soon.',
        now: 'Present',
        present: 'Recent',
        items: [],
        more: { showMore: true, text: 'More coming soon' }
      }
    }
  }
}
