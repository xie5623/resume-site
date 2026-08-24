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
            demoUrl: '',
            githubUrl: '',
            featured: true
          },
          {
            name: '玻璃拟态组件库',
            desc: '一套基于设计令牌的深色玻璃拟态 Vue 组件库，开箱即用，视觉一致。',
            tags: ['Vue 3', 'TypeScript', 'SCSS'],
            year: '2024',
            demoUrl: '',
            githubUrl: '',
          },
          {
            name: '实时数据看板',
            desc: '低延迟的实时指标监控大屏，支持多数据源接入与自定义布局。',
            tags: ['React', 'WebSocket', 'ECharts'],
            year: '2023',
            demoUrl: '',
            githubUrl: '',
          },
          {
            name: '电商小程序',
            desc: '覆盖商品、购物车、订单与支付流程的微信小程序，日活过万。',
            tags: ['WeChat', 'JavaScript', 'CloudBase'],
            year: '2023',
            demoUrl: '',
            githubUrl: '',
          },
          {
            name: 'Markdown 编辑器',
            desc: '极简的所见即所得 Markdown 编辑器，支持实时预览与导出。',
            tags: ['TypeScript', 'Monaco', 'Electron'],
            year: '2022',
            demoUrl: '',
            githubUrl: '',
          },
          {
            name: '天气查询应用',
            desc: '带动态背景与城市搜索的天气应用，支持多日预报与单位切换。',
            tags: ['Vue 2', 'REST', 'PWA'],
            year: '2022',
            demoUrl: '',
            githubUrl: '',
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
            demoUrl: '',
            githubUrl: '',
            featured: true
          },
          {
            name: 'Glassmorphism UI Kit',
            desc: 'A dark glassmorphism Vue component library driven by design tokens — consistent and ready to use.',
            tags: ['Vue 3', 'TypeScript', 'SCSS'],
            year: '2024',
            demoUrl: '',
            githubUrl: '',
          },
          {
            name: 'Real-Time Dashboard',
            desc: 'Low-latency live metrics monitoring with multi-source ingestion and custom layouts.',
            tags: ['React', 'WebSocket', 'ECharts'],
            year: '2023',
            demoUrl: '',
            githubUrl: '',
          },
          {
            name: 'E-Commerce Mini-App',
            desc: 'A WeChat mini-program covering products, cart, orders, and payments — 10k+ DAU.',
            tags: ['WeChat', 'JavaScript', 'CloudBase'],
            year: '2023',
            demoUrl: '',
            githubUrl: '',
          },
          {
            name: 'Markdown Editor',
            desc: 'A minimal WYSIWYG Markdown editor with live preview and export.',
            tags: ['TypeScript', 'Monaco', 'Electron'],
            year: '2022',
            demoUrl: '',
            githubUrl: '',
          },
          {
            name: 'Weather App',
            desc: 'A weather app with dynamic backgrounds, city search, multi-day forecasts, and unit toggles.',
            tags: ['Vue 2', 'REST', 'PWA'],
            year: '2022',
            demoUrl: '',
            githubUrl: '',
          }
        ]
      }
    }
  },
  /* ===================== 应届生版 ===================== */
  graduate: {
    zh: {
      projects: {
        eyebrow: '项目实践',
        title: '项目经历',
        sub: '参与过的课程设计、竞赛或自建项目占位示例。',
        demo: '在线演示',
        github: '源码',
        items: [
          {
            name: '示例项目一（课程设计）',
            desc: '这里是一段占位项目描述：项目背景、你的职责、使用的技术、以及最终成果。可在控制台替换为你的真实项目。',
            tags: ['占位', '团队协作', '方案落地'],
            year: '2025',
            demoUrl: '',
            githubUrl: '',
            featured: true
          },
          {
            name: '示例项目二（竞赛 / 实践）',
            desc: '占位描述：说明你在其中承担的角色与产出，展示你解决实际问题的能力。',
            tags: ['占位', '实践'],
            year: '2025',
            demoUrl: '',
            githubUrl: ''
          },
          {
            name: '示例项目三（个人作品）',
            desc: '占位描述：独立完成的小项目，展示你的自驱力与完整交付能力。',
            tags: ['占位', '个人'],
            year: '2024',
            demoUrl: '',
            githubUrl: ''
          }
        ]
      }
    },
    en: {
      projects: {
        eyebrow: 'PROJECTS',
        title: 'Projects',
        sub: 'Placeholder for course projects, competitions, or personal builds.',
        demo: 'Live Demo',
        github: 'Source',
        items: [
          {
            name: 'Example Project One (Coursework)',
            desc: 'Placeholder description: background, your role, tech used, and outcome. Replace with your real project in the console.',
            tags: ['Placeholder', 'Teamwork'],
            year: '2025',
            demoUrl: '',
            githubUrl: '',
            featured: true
          },
          {
            name: 'Example Project Two (Competition / Practice)',
            desc: 'Placeholder: describe your role and deliverables to show how you solve real problems.',
            tags: ['Placeholder', 'Practice'],
            year: '2025',
            demoUrl: '',
            githubUrl: ''
          },
          {
            name: 'Example Project Three (Personal Build)',
            desc: 'Placeholder: a solo project showing initiative and end-to-end delivery.',
            tags: ['Placeholder', 'Personal'],
            year: '2024',
            demoUrl: '',
            githubUrl: ''
          }
        ]
      }
    }
  }
}
