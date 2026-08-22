/* ============================================================
   content/projects.js — 项目经验（projects）富内容（内容层 CONTENT 的一部分）
   ------------------------------------------------------------
   形状：{ templateId: { lang: { projects: {...} } } }
   来源：ProjectsModule.vue 原组件内 DICT + PROJECTS 占位数组，迁移到
   内容层后由模块用 useContent().get(version, lang, 'projects.*') 读取。
   projects.items = [{ name, desc, tags: [], year, featured }]
   （数组读写由内容 store 支持，控制台可编辑每个列表项）
   ============================================================ */

export const PROJECTS_CONTENT = {
  /* ===================== 资深版 ===================== */
  senior: {
    zh: {
      projects: {
        eyebrow: '代表作品',
        title: '项目经验',
        sub: '占位项目卡片，链接指向 # 占位。',
        demo: '在线演示',
        github: '源码',
        items: [
          {
            name: '智能简历生成器',
            desc: '输入关键词即可生成排版精致的简历站点，支持中英双语与多套主题，AI 润色一键完成。',
            tags: ['Vue 3', 'Vite', 'OpenAI', 'GSAP'],
            year: '2024',
            featured: true
          },
          {
            name: '玻璃拟态组件库',
            desc: '一套基于设计令牌的深色玻璃拟态 Vue 组件库，开箱即用，视觉一致。',
            tags: ['Vue 3', 'TypeScript', 'SCSS'],
            year: '2024'
          },
          {
            name: '实时数据看板',
            desc: '低延迟的实时指标监控大屏，支持多数据源接入与自定义布局。',
            tags: ['React', 'WebSocket', 'ECharts'],
            year: '2023'
          },
          {
            name: '电商小程序',
            desc: '覆盖商品、购物车、订单与支付流程的微信小程序，日活过万。',
            tags: ['WeChat', 'JavaScript', 'CloudBase'],
            year: '2023'
          },
          {
            name: 'Markdown 编辑器',
            desc: '极简的所见即所得 Markdown 编辑器，支持实时预览与导出。',
            tags: ['TypeScript', 'Monaco', 'Electron'],
            year: '2022'
          },
          {
            name: '天气查询应用',
            desc: '带动态背景与城市搜索的天气应用，支持多日预报与单位切换。',
            tags: ['Vue 2', 'REST', 'PWA'],
            year: '2022'
          }
        ]
      }
    },
    en: {
      projects: {
        eyebrow: 'WORK',
        title: 'Projects',
        sub: 'Placeholder cards; links point to # for now.',
        demo: 'Live Demo',
        github: 'Source',
        items: [
          {
            name: 'Smart Resume Builder',
            desc: 'Generate a beautifully typeset resume site from a few keywords — bilingual, multi-theme, one-click AI polish.',
            tags: ['Vue 3', 'Vite', 'OpenAI', 'GSAP'],
            year: '2024',
            featured: true
          },
          {
            name: 'Glassmorphism UI Kit',
            desc: 'A dark glassmorphism Vue component library driven by design tokens — consistent and ready to use.',
            tags: ['Vue 3', 'TypeScript', 'SCSS'],
            year: '2024'
          },
          {
            name: 'Real-Time Dashboard',
            desc: 'Low-latency live metrics monitoring with multi-source ingestion and custom layouts.',
            tags: ['React', 'WebSocket', 'ECharts'],
            year: '2023'
          },
          {
            name: 'E-Commerce Mini-App',
            desc: 'A WeChat mini-program covering products, cart, orders, and payments — 10k+ DAU.',
            tags: ['WeChat', 'JavaScript', 'CloudBase'],
            year: '2023'
          },
          {
            name: 'Markdown Editor',
            desc: 'A minimal WYSIWYG Markdown editor with live preview and export.',
            tags: ['TypeScript', 'Monaco', 'Electron'],
            year: '2022'
          },
          {
            name: 'Weather App',
            desc: 'A weather app with dynamic backgrounds, city search, multi-day forecasts, and unit toggles.',
            tags: ['Vue 2', 'REST', 'PWA'],
            year: '2022'
          }
        ]
      }
    }
  },

  /* ===================== 应届生版 ===================== */
  graduate: {
    zh: {
      projects: {
        eyebrow: '课程作品',
        title: '项目实践',
        sub: '课程设计、毕业设计与个人项目占位，链接指向 #。',
        demo: '在线演示',
        github: '源码',
        items: [
          {
            name: '毕业设计：校园二手交易平台',
            desc: '用 Vue 3 + Node.js 实现二手商品发布与交易流程，独立完成前后端。',
            tags: ['Vue 3', 'Vite', 'OpenAI', 'GSAP'],
            year: '2024',
            featured: true
          },
          {
            name: '课程设计：图书管理系统',
            desc: '小组课程设计，负责前端页面与交互，按需求文档完成功能迭代。',
            tags: ['Vue 3', 'TypeScript', 'SCSS'],
            year: '2024'
          },
          {
            name: '个人项目：简历网站',
            desc: '自学 Vue 3 后独立完成的个人网站，实践响应式布局与动画。',
            tags: ['React', 'WebSocket', 'ECharts'],
            year: '2023'
          },
          {
            name: '课程设计：校园活动报名系统',
            desc: '前端 + 本地存储实现活动发布与报名，练习组件化开发。',
            tags: ['WeChat', 'JavaScript', 'CloudBase'],
            year: '2023'
          },
          {
            name: '个人项目：待办与笔记应用',
            desc: '用 TypeScript + Vite 实现，练习状态管理与类型系统。',
            tags: ['TypeScript', 'Monaco', 'Electron'],
            year: '2022'
          },
          {
            name: '小组项目：数据可视化练习',
            desc: '用 ECharts 完成课堂数据的可视化展示，熟悉图表配置。',
            tags: ['Vue 2', 'REST', 'PWA'],
            year: '2022'
          }
        ]
      }
    },
    en: {
      projects: {
        eyebrow: 'PROJECTS',
        title: 'Projects',
        sub: 'Placeholder for coursework, graduation, and personal projects; links point to #.',
        demo: 'Live Demo',
        github: 'Source',
        items: [
          {
            name: 'Graduation Project: Campus Second-hand Platform',
            desc: 'Built listing & trading flows with Vue 3 and Node.js, frontend and backend solo.',
            tags: ['Vue 3', 'Vite', 'OpenAI', 'GSAP'],
            year: '2024',
            featured: true
          },
          {
            name: 'Course Project: Library Management System',
            desc: 'Group coursework — owned the frontend UI and interactions, iterating against a requirements doc.',
            tags: ['Vue 3', 'TypeScript', 'SCSS'],
            year: '2024'
          },
          {
            name: 'Personal Project: Resume Website',
            desc: 'Built solo after self-learning Vue 3, practicing responsive layouts and animation.',
            tags: ['React', 'WebSocket', 'ECharts'],
            year: '2023'
          },
          {
            name: 'Course Project: Campus Event Registration',
            desc: 'Frontend + local storage for event publishing and registration — practiced componentization.',
            tags: ['WeChat', 'JavaScript', 'CloudBase'],
            year: '2023'
          },
          {
            name: 'Personal Project: Todo & Notes App',
            desc: 'TypeScript + Vite; practiced state management and the type system.',
            tags: ['TypeScript', 'Monaco', 'Electron'],
            year: '2022'
          },
          {
            name: 'Team Project: Data Visualization',
            desc: 'Used ECharts to visualize classroom data and get familiar with chart config.',
            tags: ['Vue 2', 'REST', 'PWA'],
            year: '2022'
          }
        ]
      }
    }
  }
}
