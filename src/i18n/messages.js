/* ============================================================
   messages.js — 内容层基础数据（CONTENT base）
   ------------------------------------------------------------
   三层分离中的【内容层】基础数据源，被 src/content/index.js
   导入合并进 CONTENT（common + 尚未模块改造的命名空间）。
   已做模块改造的命名空间（hero/skills/experience）以
   src/content/<module>.js 的富内容为准（此处同名 namespace 会被覆盖）。
   组件读取一律走 useContent()（src/content/useContent.js），
   不要直接 import 本文件。

   键名按模块命名空间组织：
     hero.* / about.* / skills.* / experience.* / projects.* /
     education.* / certificates.* / portfolio.* / contact.* /
     footer.* / common.*
   结构按【模板】分两层（资深版 senior / 应届生版 graduate），
   每个模板内再按语言分 zh / en 两套：
     export const MESSAGES = {
       senior:   { zh: { ... }, en: { ... } },   // 资深版（默认）
       graduate: { zh: { ... }, en: { ... } }    // 应届生版
     }
   - 资深版口吻：在职全栈工程师，突出经验与资历（占位风格：
     中文「你的名字 / 全栈工程师」，英文「YOUR NAME / Full-Stack
     Developer」）。
   - 应届生版口吻：本科学历 / 校招 / 实习经历，突出可塑性、学习
     能力、新鲜血液（占位风格：中文「你的名字 / 前端开发应届生」，
     英文「YOUR NAME / Frontend Developer (New Grad)」）。
   值可以是字符串，也可以是数组（数组用于列表类占位，如
   skills.groups、experience.items、projects.items）。
   新增文案/新模块：在对应版本的 zh/en 里加键即可，组件调用方式
   不用改。i18n/index.js 的 t(key) 会根据当前模板+语言自动取用。
   ============================================================ */

export const MESSAGES = {
  /* ==========================================================
     资深版（senior）— 默认版本，在职全栈工程师口吻
     ========================================================== */
  senior: {
    zh: {
      /* ================= 通用 / 导航 ================= */
      common: {
        brand: '我的简历',
        navAria: '页面导航',
        langAria: '切换语言',
        langLabelZh: '中文',
        langLabelEn: 'English',
        menuOpen: '打开导航菜单',
        menuClose: '关闭导航菜单',
        backToTop: '回到顶部',
        placeholderNote: '占位组件 · 等待实现'
      },

      /* ================= hero 首屏 ================= */
      hero: {
        eyebrow: '你好，我是',
        name: '你的名字',
        role: '全栈工程师',
        tagline: '用代码把想法变成可靠的产品，注重细节与用户体验。',
        location: '上海 · 中国',
        status: '开放合作',
        ctaContact: '联系我',
        ctaWork: '查看作品'
      },

      /* ================= about 关于我 ================= */
      about: {
        title: '关于我',
        subtitle: 'About',
        lead: '一段关于你的简介，讲讲你是谁、做什么、在乎什么。',
        body: '这里放你的完整自我介绍。可以讲成长经历、技术信念、工作方式，以及你希望读者记住你的点。',
        metaLocation: '所在地',
        metaEmail: '邮箱',
        metaPhone: '电话',
        interests: ['开源', '写作', '摄影', '旅行']
      },

      /* ================= skills 专业技能 ================= */
      skills: {
        title: '专业技能',
        subtitle: 'Skills',
        groups: [
          { name: '前端', items: ['Vue 3', 'TypeScript', 'Vite', 'CSS / 动画'] },
          { name: '后端', items: ['Node.js', 'Go', 'PostgreSQL', 'Redis'] },
          { name: '工具与协作', items: ['Git', 'Docker', 'CI/CD', 'Figma'] }
        ]
      },

      /* ================= experience 工作经历 ================= */
      experience: {
        title: '工作经历',
        subtitle: 'Experience',
        items: [
          {
            role: '资深前端工程师',
            company: '某某科技 · 全栈组',
            period: '2022 — 至今',
            desc: '负责核心产品的前端架构与性能优化，主导从 0 到 1 的功能迭代。'
          },
          {
            role: '前端工程师',
            company: '某某网络',
            period: '2020 — 2022',
            desc: '参与多个中后台系统的开发，沉淀通用组件库，提升团队交付效率。'
          }
        ]
      },

      /* ================= projects 项目 ================= */
      projects: {
        title: '项目',
        subtitle: 'Projects',
        items: [
          { name: '项目一', tag: '全栈', desc: '一句话描述这个项目解决了什么问题，用了什么技术。', links: ['演示', '源码'] },
          { name: '项目二', tag: '前端', desc: '一句话描述这个项目解决了什么问题，用了什么技术。', links: ['演示', '源码'] },
          { name: '项目三', tag: '工具', desc: '一句话描述这个项目解决了什么问题，用了什么技术。', links: ['演示', '源码'] }
        ]
      },

      /* ================= education 教育背景 ================= */
      education: {
        title: '教育背景',
        subtitle: 'Education',
        items: [
          { school: '某某大学', degree: '计算机科学与技术 · 本科', period: '2016 — 2020', note: 'GPA 3.8/4.0 · 校优秀毕业生' },
          { school: '某某中学', degree: '高中', period: '2013 — 2016', note: '' }
        ]
      },

      /* ================= certificates 证书认证 ================= */
      certificates: {
        title: '证书认证',
        subtitle: 'Certificates',
        items: [
          { name: 'AWS 认证解决方案架构师', issuer: 'Amazon Web Services', year: '2023' },
          { name: 'CKA：Kubernetes 管理员', issuer: 'CNCF', year: '2022' },
          { name: '英语六级 CET-6', issuer: '教育部', year: '2018' }
        ]
      },

      /* ================= portfolio 作品集 ================= */
      portfolio: {
        title: '作品集',
        subtitle: 'Portfolio',
        items: [
          { title: '作品 A', category: 'Web 应用', desc: '一段简短的作品说明。' },
          { title: '作品 B', category: '可视化', desc: '一段简短的作品说明。' },
          { title: '作品 C', category: '开源项目', desc: '一段简短的作品说明。' }
        ]
      },

      /* ================= contact 联系方式 ================= */
      contact: {
        title: '联系方式',
        subtitle: 'Contact',
        intro: '对我的工作感兴趣？欢迎给我发消息，我通常会在 24 小时内回复。',
        formName: '姓名',
        formEmail: '邮箱',
        formMessage: '留言',
        phName: '你的称呼',
        phEmail: 'you@example.com',
        phMessage: '写点什么…',
        submit: '发送',
        submitNote: '占位表单——接入后端前不会真的发送。',
        email: 'you@example.com'
      },

      /* ================= footer 页脚 ================= */
      footer: {
        tagline: '以热爱驱动，用代码创造。',
        madeWith: '由 Vue 3 · Vite · GSAP 构建',
        copyright: '© 你的名字。保留所有权利。',
        backToTop: '回到顶部'
      }
    },

    en: {
      /* ================= Common / Nav ================= */
      common: {
        brand: 'My Resume',
        navAria: 'Page navigation',
        langAria: 'Switch language',
        langLabelZh: '中文',
        langLabelEn: 'English',
        menuOpen: 'Open navigation menu',
        menuClose: 'Close navigation menu',
        backToTop: 'Back to top',
        placeholderNote: 'Placeholder · Coming soon'
      },

      /* ================= hero ================= */
      hero: {
        eyebrow: "Hi, I'm",
        name: 'YOUR NAME',
        role: 'Full-Stack Developer',
        tagline: 'Turning ideas into reliable products with code, with a strong eye for detail and user experience.',
        location: 'Shanghai, China',
        status: 'Open to work',
        ctaContact: 'Contact Me',
        ctaWork: 'View My Work'
      },

      /* ================= about ================= */
      about: {
        title: 'About Me',
        subtitle: 'About',
        lead: 'A short introduction about who you are, what you do, and what you care about.',
        body: 'Your full self-introduction goes here — growth story, technical beliefs, how you work, and what you want readers to remember.',
        metaLocation: 'Location',
        metaEmail: 'Email',
        metaPhone: 'Phone',
        interests: ['Open Source', 'Writing', 'Photography', 'Traveling']
      },

      /* ================= skills ================= */
      skills: {
        title: 'Skills',
        subtitle: 'Skills',
        groups: [
          { name: 'Frontend', items: ['Vue 3', 'TypeScript', 'Vite', 'CSS / Animation'] },
          { name: 'Backend', items: ['Node.js', 'Go', 'PostgreSQL', 'Redis'] },
          { name: 'Tools & Workflow', items: ['Git', 'Docker', 'CI/CD', 'Figma'] }
        ]
      },

      /* ================= experience ================= */
      experience: {
        title: 'Experience',
        subtitle: 'Experience',
        items: [
          {
            role: 'Senior Frontend Engineer',
            company: 'Acme Tech · Full-stack Team',
            period: '2022 — Present',
            desc: 'Own the frontend architecture and performance of the core product; led features from 0 to 1.'
          },
          {
            role: 'Frontend Engineer',
            company: 'Acme Network',
            period: '2020 — 2022',
            desc: 'Built multiple admin systems, extracted a shared component library, and improved team delivery.'
          }
        ]
      },

      /* ================= projects ================= */
      projects: {
        title: 'Projects',
        subtitle: 'Projects',
        items: [
          { name: 'Project One', tag: 'Full-stack', desc: 'One sentence on the problem it solves and the tech behind it.', links: ['Demo', 'Source'] },
          { name: 'Project Two', tag: 'Frontend', desc: 'One sentence on the problem it solves and the tech behind it.', links: ['Demo', 'Source'] },
          { name: 'Project Three', tag: 'Tooling', desc: 'One sentence on the problem it solves and the tech behind it.', links: ['Demo', 'Source'] }
        ]
      },

      /* ================= education ================= */
      education: {
        title: 'Education',
        subtitle: 'Education',
        items: [
          { school: 'Some University', degree: 'B.S. Computer Science', period: '2016 — 2020', note: 'GPA 3.8/4.0 · Outstanding Graduate' },
          { school: 'Some High School', degree: 'High School', period: '2013 — 2016', note: '' }
        ]
      },

      /* ================= certificates ================= */
      certificates: {
        title: 'Certificates',
        subtitle: 'Certificates',
        items: [
          { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', year: '2023' },
          { name: 'CKA: Certified Kubernetes Administrator', issuer: 'CNCF', year: '2022' },
          { name: 'CET-6 English', issuer: 'Ministry of Education', year: '2018' }
        ]
      },

      /* ================= portfolio ================= */
      portfolio: {
        title: 'Portfolio',
        subtitle: 'Portfolio',
        items: [
          { title: 'Work A', category: 'Web App', desc: 'A short description of the work.' },
          { title: 'Work B', category: 'Data Visualization', desc: 'A short description of the work.' },
          { title: 'Work C', category: 'Open Source', desc: 'A short description of the work.' }
        ]
      },

      /* ================= contact ================= */
      contact: {
        title: 'Contact',
        subtitle: 'Contact',
        intro: 'Interested in my work? Send me a message — I usually reply within 24 hours.',
        formName: 'Name',
        formEmail: 'Email',
        formMessage: 'Message',
        phName: 'Your name',
        phEmail: 'you@example.com',
        phMessage: 'Write something…',
        submit: 'Send',
        submitNote: 'Placeholder form — nothing is sent until wired to a backend.',
        email: 'you@example.com'
      },

      /* ================= footer ================= */
      footer: {
        tagline: 'Driven by passion, built with code.',
        madeWith: 'Built with Vue 3 · Vite · GSAP',
        copyright: '© YOUR NAME. All rights reserved.',
        backToTop: 'Back to top'
      }
    }
  },

  /* ==========================================================
     应届生版（graduate）— 本科学历 / 校招 / 实习经历口吻
     ----------------------------------------------------------
     口吻：应届生 / 校园求职，突出可塑性、学习能力、新鲜血液。
     - education 前移为卖点（本科学历，强调 GPA / 奖学金）
     - experience 改为「实习经历」（Internship），强调实习产出
       与导师评价
     - projects 为课程设计 / 毕业设计 / 个人项目口吻
     - certificates 为四六级 / 普通话 / 专业证书
     - skills 增加「正在学习」分组，体现学习能力
     所有内容均为占位符/示例，不含真实个人信息。
     ========================================================== */
  graduate: {
    zh: {
      /* ================= 通用 / 导航 ================= */
      common: {
        brand: '应届生简历',
        navAria: '页面导航',
        langAria: '切换语言',
        langLabelZh: '中文',
        langLabelEn: 'English',
        menuOpen: '打开导航菜单',
        menuClose: '关闭导航菜单',
        backToTop: '回到顶部',
        placeholderNote: '占位组件 · 等待实现'
      },

      /* ================= hero 首屏 ================= */
      hero: {
        eyebrow: '你好，我是',
        name: '你的名字',
        role: '前端开发应届生',
        tagline: '2025 届毕业生，期待把校园里的热情与学习能力带进团队，快速成长、踏实产出。',
        location: '上海 · 中国',
        status: '应届 · 求职中',
        ctaContact: '联系我',
        ctaWork: '查看项目'
      },

      /* ================= about 关于我 ================= */
      about: {
        title: '关于我',
        subtitle: 'About',
        lead: '一名即将毕业的本科生，对技术充满好奇，擅长快速学习与动手实践。',
        body: '这里放你的应届生自我介绍：学校经历、学习能力、项目实践，以及你希望面试官记住你的点。',
        metaLocation: '所在地',
        metaEmail: '邮箱',
        metaPhone: '电话',
        interests: ['编程', '开源', '篮球', '摄影']
      },

      /* ================= skills 专业技能 ================= */
      skills: {
        title: '专业技能',
        subtitle: 'Skills',
        groups: [
          { name: '前端', items: ['HTML / CSS', 'JavaScript (ES6+)', 'Vue 3', 'TypeScript'] },
          { name: '基础与工具', items: ['Git', 'Vite', 'Node.js', 'Figma'] },
          { name: '正在学习', items: ['React', 'Docker', 'CI/CD', '性能优化'] }
        ]
      },

      /* ================= experience 实习经历 ================= */
      experience: {
        title: '实习经历',
        subtitle: 'Internship',
        items: [
          {
            role: '前端实习生',
            company: '某某科技 · 前端组',
            period: '2024.06 — 2024.09',
            desc: '参与官网与后台界面开发，完成多个模块迭代；导师评价：上手快、沟通顺畅、交付稳定。'
          },
          {
            role: '研发实习生',
            company: '某某互联网公司',
            period: '2023.07 — 2023.09',
            desc: '协助搭建组件库与接口联调，编写开发文档，在实践中熟悉团队开发流程。'
          }
        ]
      },

      /* ================= projects 项目（课程/毕设/个人） ================= */
      projects: {
        title: '项目',
        subtitle: 'Projects',
        items: [
          { name: '毕业设计：校园二手交易平台', tag: '全栈', desc: '毕设作品。用 Vue 3 + Node.js 实现二手商品发布与交易流程。', links: ['演示', '源码'] },
          { name: '课程设计：图书管理系统', tag: '前端', desc: '小组课程设计。负责前端页面与交互，按需求文档完成功能迭代。', links: ['演示', '源码'] },
          { name: '个人项目：简历网站', tag: '工具', desc: '自学 Vue 3 后独立完成的个人网站，实践响应式布局与动画。', links: ['演示', '源码'] }
        ]
      },

      /* ================= education 教育背景（本科前移） ================= */
      education: {
        title: '教育背景',
        subtitle: 'Education',
        items: [
          { school: 'XX大学', degree: '计算机科学与技术 · 本科', period: '2021 — 2025', note: 'GPA 3.6/4.0 · 校级奖学金 · 优秀学生干部' }
        ]
      },

      /* ================= certificates 证书认证 ================= */
      certificates: {
        title: '证书认证',
        subtitle: 'Certificates',
        items: [
          { name: '英语六级 CET-6', issuer: '教育部', year: '2024' },
          { name: '普通话水平测试 · 二级甲等', issuer: '国家语委', year: '2023' },
          { name: '全国计算机等级考试 · 二级 C 语言', issuer: '教育部考试中心', year: '2023' }
        ]
      },

      /* ================= portfolio 作品集 ================= */
      portfolio: {
        title: '作品集',
        subtitle: 'Portfolio',
        items: [
          { title: '课程作品 A', category: 'Web 应用', desc: '一段简短的作品说明。' },
          { title: '毕业设计 B', category: '全栈', desc: '一段简短的作品说明。' },
          { title: '个人练习 C', category: '前端', desc: '一段简短的作品说明。' }
        ]
      },

      /* ================= contact 联系方式 ================= */
      contact: {
        title: '联系方式',
        subtitle: 'Contact',
        intro: '期待加入你的团队！欢迎聊聊实习转正或校招机会，我会尽快回复。',
        formName: '姓名',
        formEmail: '邮箱',
        formMessage: '留言',
        phName: '你的称呼',
        phEmail: 'you@example.com',
        phMessage: '写点什么…',
        submit: '发送',
        submitNote: '占位表单——接入后端前不会真的发送。',
        email: 'you@example.com'
      },

      /* ================= footer 页脚 ================= */
      footer: {
        tagline: '保持好奇，持续学习。',
        madeWith: '由 Vue 3 · Vite · GSAP 构建',
        copyright: '© 你的名字。保留所有权利。',
        backToTop: '回到顶部'
      }
    },

    en: {
      /* ================= Common / Nav ================= */
      common: {
        brand: 'Graduate Resume',
        navAria: 'Page navigation',
        langAria: 'Switch language',
        langLabelZh: '中文',
        langLabelEn: 'English',
        menuOpen: 'Open navigation menu',
        menuClose: 'Close navigation menu',
        backToTop: 'Back to top',
        placeholderNote: 'Placeholder · Coming soon'
      },

      /* ================= hero ================= */
      hero: {
        eyebrow: "Hi, I'm",
        name: 'YOUR NAME',
        role: 'Frontend Developer (New Grad)',
        tagline: 'Class of 2025. Ready to bring campus enthusiasm and fast learning to your team — growing quickly and shipping steadily.',
        location: 'Shanghai, China',
        status: 'Open to new-grad roles',
        ctaContact: 'Contact Me',
        ctaWork: 'View My Projects'
      },

      /* ================= about ================= */
      about: {
        title: 'About Me',
        subtitle: 'About',
        lead: 'A soon-to-graduate undergrad who is curious about technology, quick to learn, and hands-on.',
        body: 'Your new-grad introduction goes here — school experience, learning ability, project practice, and what you want interviewers to remember.',
        metaLocation: 'Location',
        metaEmail: 'Email',
        metaPhone: 'Phone',
        interests: ['Coding', 'Open Source', 'Basketball', 'Photography']
      },

      /* ================= skills ================= */
      skills: {
        title: 'Skills',
        subtitle: 'Skills',
        groups: [
          { name: 'Frontend', items: ['HTML / CSS', 'JavaScript (ES6+)', 'Vue 3', 'TypeScript'] },
          { name: 'Fundamentals & Tools', items: ['Git', 'Vite', 'Node.js', 'Figma'] },
          { name: 'Currently Learning', items: ['React', 'Docker', 'CI/CD', 'Performance'] }
        ]
      },

      /* ================= experience ================= */
      experience: {
        title: 'Internship',
        subtitle: 'Internship',
        items: [
          {
            role: 'Frontend Intern',
            company: 'Acme Tech · Frontend Team',
            period: 'Jun 2024 — Sep 2024',
            desc: 'Built UI for the official site and admin panels, shipped several module iterations. Mentor feedback: fast to ramp up, clear communication, reliable delivery.'
          },
          {
            role: 'R&D Intern',
            company: 'Acme Internet Co.',
            period: 'Jul 2023 — Sep 2023',
            desc: 'Helped set up a component library and API integration, wrote dev docs, and practiced the team development workflow.'
          }
        ]
      },

      /* ================= projects ================= */
      projects: {
        title: 'Projects',
        subtitle: 'Projects',
        items: [
          { name: 'Graduation Project: Campus Second-hand Platform', tag: 'Full-stack', desc: 'Final-year project. Built listing & trading flows with Vue 3 and Node.js.', links: ['Demo', 'Source'] },
          { name: 'Course Project: Library Management System', tag: 'Frontend', desc: 'Group coursework. Owned the frontend UI and interactions, iterating against a requirements doc.', links: ['Demo', 'Source'] },
          { name: 'Personal Project: Resume Website', tag: 'Tooling', desc: 'Built solo after self-learning Vue 3, practicing responsive layouts and animation.', links: ['Demo', 'Source'] }
        ]
      },

      /* ================= education ================= */
      education: {
        title: 'Education',
        subtitle: 'Education',
        items: [
          { school: 'XX University', degree: 'B.S. Computer Science', period: '2021 — 2025', note: 'GPA 3.6/4.0 · University Scholarship · Student Leader' }
        ]
      },

      /* ================= certificates ================= */
      certificates: {
        title: 'Certificates',
        subtitle: 'Certificates',
        items: [
          { name: 'CET-6 (College English Test Band 6)', issuer: 'Ministry of Education', year: '2024' },
          { name: 'Mandarin Proficiency Test · Level 2A', issuer: 'State Language Commission', year: '2023' },
          { name: 'NCRE Level 2 · C Language', issuer: 'Ministry of Education', year: '2023' }
        ]
      },

      /* ================= portfolio ================= */
      portfolio: {
        title: 'Portfolio',
        subtitle: 'Portfolio',
        items: [
          { title: 'Coursework A', category: 'Web App', desc: 'A short description of the work.' },
          { title: 'Graduation Project B', category: 'Full-stack', desc: 'A short description of the work.' },
          { title: 'Practice C', category: 'Frontend', desc: 'A short description of the work.' }
        ]
      },

      /* ================= contact ================= */
      contact: {
        title: 'Contact',
        subtitle: 'Contact',
        intro: "I'd love to join your team! Reach out about intern-to-full-time or new-grad opportunities — I reply quickly.",
        formName: 'Name',
        formEmail: 'Email',
        formMessage: 'Message',
        phName: 'Your name',
        phEmail: 'you@example.com',
        phMessage: 'Write something…',
        submit: 'Send',
        submitNote: 'Placeholder form — nothing is sent until wired to a backend.',
        email: 'you@example.com'
      },

      /* ================= footer ================= */
      footer: {
        tagline: 'Stay curious, keep learning.',
        madeWith: 'Built with Vue 3 · Vite · GSAP',
        copyright: '© YOUR NAME. All rights reserved.',
        backToTop: 'Back to top'
      }
    }
  }
}

/* 向后兼容别名：老代码 `import messages from '@/i18n/messages'`
   取到的仍是资深版（默认版本）的 { zh, en }，形状与旧版一致。 */
export const messages = MESSAGES.senior

export default MESSAGES
