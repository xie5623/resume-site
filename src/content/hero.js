/* ============================================================
   content/hero.js — 首屏（hero）富内容（内容层 CONTENT 的一部分）
   ------------------------------------------------------------
   形状：{ templateId: { lang: { hero: {...} } } }
   来源：HeroModule.vue 原组件内 DICT + 占位统计，迁移到内容层后
   由模块用 useContent().get(version, lang, 'hero.*') 读取。
   ============================================================ */

export const HERO_CONTENT = {
  senior: {
    zh: {
      hero: {
        eyebrow: '个人简历',
        name: 'YOUR NAME',
        greeting: '你好，我是',
        tagline: '用代码把想法变成精致的数字产品。',
        ctaWork: '查看项目',
        ctaContact: '联系我',
        scroll: '向下滚动',
        badge: '开放合作',
        cardRole: '当前角色',
        cardLoc: '所在城市',
        cardMail: '邮箱',
        cardAvail: '合作状态',
        roles: ['全栈工程师', '前端开发', 'UI 动效爱好者', '开源贡献者'],
        stats: [
          { label: '年经验', value: '5+' },
          { label: '交付项目', value: '30+' },
          { label: '技术栈', value: '12' }
        ],
        placeholderMail: 'you@example.com',
        placeholderCity: '上海 · 中国'
      }
    },
    en: {
      hero: {
        eyebrow: 'PORTFOLIO',
        name: 'YOUR NAME',
        greeting: "Hi, I'm",
        tagline: 'Turning ideas into polished digital products with code.',
        ctaWork: 'View Work',
        ctaContact: 'Contact',
        scroll: 'Scroll down',
        badge: 'Open to work',
        cardRole: 'Current role',
        cardLoc: 'Location',
        cardMail: 'Email',
        cardAvail: 'Availability',
        roles: [
          'Full-Stack Developer',
          'Front-End Engineer',
          'Motion & UI Enthusiast',
          'Open Source Contributor'
        ],
        stats: [
          { label: 'Years Exp.', value: '5+' },
          { label: 'Projects', value: '30+' },
          { label: 'Skills', value: '12' }
        ],
        placeholderMail: 'you@example.com',
        placeholderCity: 'Shanghai, CN'
      }
    }
  },

  graduate: {
    zh: {
      hero: {
        eyebrow: '应届生简历',
        name: 'YOUR NAME',
        greeting: '你好，我是',
        tagline: '2025 届毕业生，期待把校园里的热情与学习能力带进团队，快速成长、踏实产出。',
        ctaWork: '查看项目',
        ctaContact: '联系我',
        scroll: '向下滚动',
        badge: '应届 · 求职中',
        cardRole: '当前角色',
        cardLoc: '所在城市',
        cardMail: '邮箱',
        cardAvail: '求职状态',
        roles: ['前端开发应届生', '前端开发', '编程爱好者', '学习型选手'],
        stats: [
          { label: '校园项目', value: '5+' },
          { label: '交付项目', value: '30+' },
          { label: '技术栈', value: '12' }
        ],
        placeholderMail: 'you@example.com',
        placeholderCity: '上海 · 中国'
      }
    },
    en: {
      hero: {
        eyebrow: 'NEW GRAD',
        name: 'YOUR NAME',
        greeting: "Hi, I'm",
        tagline: 'Class of 2025. Ready to bring campus enthusiasm and fast learning to your team — growing quickly and shipping steadily.',
        ctaWork: 'View Projects',
        ctaContact: 'Contact',
        scroll: 'Scroll down',
        badge: 'Open to new-grad roles',
        cardRole: 'Current role',
        cardLoc: 'Location',
        cardMail: 'Email',
        cardAvail: 'Status',
        roles: [
          'Frontend Developer (New Grad)',
          'Front-End Developer',
          'Coding Enthusiast',
          'Fast Learner'
        ],
        stats: [
          { label: 'Campus Projects', value: '5+' },
          { label: 'Projects', value: '30+' },
          { label: 'Skills', value: '12' }
        ],
        placeholderMail: 'you@example.com',
        placeholderCity: 'Shanghai, CN'
      }
    }
  }
}
