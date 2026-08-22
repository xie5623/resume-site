/* ============================================================
   content/portfolio.js — 作品集（portfolio）富内容（内容层 CONTENT 的一部分）
   ------------------------------------------------------------
   形状：{ templateId: { lang: { portfolio: {...} } } }
   来源：PortfolioModule.vue 原组件内 DICT，迁移到内容层后由模块用
   useContent().get(version, lang, 'portfolio.*') 读取。
   portfolio.items = [{ title, tag }]（封面/序号由组件派生）
   （数组读写由内容 store 支持，控制台可编辑每个列表项）
   ============================================================ */

export const PORTFOLIO_CONTENT = {
  /* ===================== 资深版 ===================== */
  senior: {
    zh: {
      portfolio: {
        kicker: 'PORTFOLIO',
        title: '作品集',
        subtitle: '代表性项目（占位示例 · 纯渐变占位图）',
        view: '查看详情',
        items: [
          { title: '电商平台重构', tag: 'Web 应用' },
          { title: '数据可视化大屏', tag: '可视化' },
          { title: '移动端点餐小程序', tag: '小程序' },
          { title: '开源组件库', tag: '开源' },
          { title: '品牌官网', tag: '官网' },
          { title: '游戏化学习应用', tag: '游戏化' }
        ]
      }
    },
    en: {
      portfolio: {
        kicker: 'PORTFOLIO',
        title: 'Portfolio',
        subtitle: 'Selected work (placeholder · CSS gradient covers)',
        view: 'View project',
        items: [
          { title: 'E-commerce Platform Redesign', tag: 'Web App' },
          { title: 'Data Visualization Dashboard', tag: 'Visualization' },
          { title: 'Mobile Food-ordering Mini App', tag: 'Mini App' },
          { title: 'Open-source Component Library', tag: 'Open Source' },
          { title: 'Brand Website', tag: 'Website' },
          { title: 'Gamified Learning App', tag: 'Gamified' }
        ]
      }
    }
  },

  /* ===================== 应届生版 ===================== */
  graduate: {
    zh: {
      portfolio: {
        kicker: 'PORTFOLIO',
        title: '作品集',
        subtitle: '课程与个人作品（占位示例 · 纯渐变占位图）',
        view: '查看详情',
        items: [
          { title: '课程设计：图书管理系统', tag: 'Web 应用' },
          { title: '毕业设计：校园平台', tag: '全栈' },
          { title: '个人简历网站', tag: '前端' },
          { title: '数据可视化练习', tag: '可视化' },
          { title: '团队项目作品', tag: '协作' },
          { title: '个人练习作品', tag: '前端' }
        ]
      }
    },
    en: {
      portfolio: {
        kicker: 'PORTFOLIO',
        title: 'Portfolio',
        subtitle: 'Coursework & personal work (placeholder · CSS gradient covers)',
        view: 'View project',
        items: [
          { title: 'Coursework: Library System', tag: 'Web App' },
          { title: 'Graduation: Campus Platform', tag: 'Full-stack' },
          { title: 'Personal Resume Site', tag: 'Frontend' },
          { title: 'Data Visualization', tag: 'Visualization' },
          { title: 'Team Project', tag: 'Team' },
          { title: 'Personal Practice', tag: 'Frontend' }
        ]
      }
    }
  }
}
