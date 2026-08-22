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
      footer: {
        tagline: '用代码把想法变成现实（占位标语）',
        rights: '保留所有权利',
        madeWith: '使用 Vue 3 + GSAP 构建',
        backToTop: '回到顶部',
        name: '你的名字（占位）'
      }
    },
    en: {
      footer: {
        tagline: 'Turning ideas into code (placeholder)',
        rights: 'All rights reserved',
        madeWith: 'Built with Vue 3 + GSAP',
        backToTop: 'Back to top',
        name: 'Your Name (placeholder)'
      }
    }
  },

  /* ===================== 应届生版：标语换成学习口吻 ===================== */
  graduate: {
    zh: {
      footer: {
        tagline: '保持好奇，持续学习（占位标语）',
        rights: '保留所有权利',
        madeWith: '使用 Vue 3 + GSAP 构建',
        backToTop: '回到顶部',
        name: '你的名字（占位）'
      }
    },
    en: {
      footer: {
        tagline: 'Stay curious, keep learning (placeholder)',
        rights: 'All rights reserved',
        madeWith: 'Built with Vue 3 + GSAP',
        backToTop: 'Back to top',
        name: 'Your Name (placeholder)'
      }
    }
  }
}
