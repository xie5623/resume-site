/* ============================================================
   content/footer.js — 页脚（footer）富内容（内容层 CONTENT 的一部分）
   ------------------------------------------------------------
   形状：{ templateId: { lang: { footer: {...} } } }
   来源：FooterModule.vue 原组件内 DICT，迁移到内容层后由模块用
   useContent().get(version, lang, 'footer.*') 读取。
   ============================================================ */

export const FOOTER_CONTENT = {
  /* ===================== 资深版 ===================== */
  senior: {
    zh: {
      common: { brand: '你的名字' },
      footer: {
        tagline: '用代码把想法变成现实',
        rights: '保留所有权利',
        madeWith: '使用 Vue 3 + GSAP 构建',
        backToTop: '回到顶部',
        name: '你的名字',
        /* 页脚社交图标（数据驱动）：每项 { id, label, url, icon? }
           id 命中预设（github/x/linkedin/bilibili/xiaohongshu/douyin/csdn）
           用内置 SVG；id='custom' 用 icon（dataURL，CSS mask 渲染为主题色剪影） */
        socials: [
          { id: 'github', label: 'GitHub', url: 'https://github.com/' },
          { id: 'x', label: 'X (Twitter)', url: 'https://x.com/' },
          { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/' }
        ]
      }
    },
    en: {
      common: { brand: 'Your Name' },
      footer: {
        tagline: 'Turning ideas into code',
        rights: 'All rights reserved',
        madeWith: 'Built with Vue 3 + GSAP',
        backToTop: 'Back to top',
        name: 'Your Name',
        socials: [
          { id: 'github', label: 'GitHub', url: 'https://github.com/' },
          { id: 'x', label: 'X (Twitter)', url: 'https://x.com/' },
          { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/' }
        ]
      }
    }
  },

  /* ===================== 应届生版 ===================== */
  graduate: {
    zh: {
      common: { brand: '你的名字' },
      footer: {
        tagline: '保持好奇，持续学习',
        rights: '保留所有权利',
        madeWith: '使用 Vue 3 + GSAP 构建',
        backToTop: '回到顶部',
        name: '你的名字',
        socials: [
          { id: 'github', label: 'GitHub', url: 'https://github.com/' },
          { id: 'x', label: 'X (Twitter)', url: 'https://x.com/' },
          { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/' }
        ]
      }
    },
    en: {
      common: { brand: 'Your Name' },
      footer: {
        tagline: 'Stay curious, keep learning',
        rights: 'All rights reserved',
        madeWith: 'Built with Vue 3 + GSAP',
        backToTop: 'Back to top',
        name: 'Your Name',
        socials: [
          { id: 'github', label: 'GitHub', url: 'https://github.com/' },
          { id: 'x', label: 'X (Twitter)', url: 'https://x.com/' },
          { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/' }
        ]
      }
    }
  }
}
