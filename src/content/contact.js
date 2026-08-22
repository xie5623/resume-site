/* ============================================================
   content/contact.js — 联系方式（contact）富内容（内容层 CONTENT 的一部分）
   ------------------------------------------------------------
   形状：{ templateId: { lang: { contact: {...} } } }
   来源：ContactModule.vue 原组件内 DICT，迁移到内容层后由模块用
   useContent().get(version, lang, 'contact.*') 读取。
   contact.values = [邮箱, 微信, 电话, GitHub]（4 个直达通道值，数组可编辑）
   ============================================================ */

export const CONTACT_CONTENT = {
  /* ===================== 资深版 ===================== */
  senior: {
    zh: {
      contact: {
        kicker: 'CONTACT',
        title: '联系方式',
        subtitle: '欢迎交流合作（占位示例）',
        linksHead: '直达通道',
        email: '邮箱',
        wechat: '微信',
        phone: '电话',
        github: 'GitHub',
        formHead: '给我留言',
        formName: '姓名',
        formNamePh: '请输入您的姓名',
        formEmail: '邮箱',
        formEmailPh: 'you@example.com',
        formMessage: '留言内容',
        formMessagePh: '简单介绍一下您的需求…',
        formSubmit: '发送留言',
        formHint: '表单为占位示例，点击不会真的提交。',
        formDone: '已收到！(占位提示：演示环境未发送)',
        values: ['hello@example.com', 'YourWeChatID', '+86 138 0000 0000', 'github.com/yourname']
      }
    },
    en: {
      contact: {
        kicker: 'CONTACT',
        title: 'Contact',
        subtitle: "Let's connect (placeholder)",
        linksHead: 'Direct channels',
        email: 'Email',
        wechat: 'WeChat',
        phone: 'Phone',
        github: 'GitHub',
        formHead: 'Send a message',
        formName: 'Name',
        formNamePh: 'Your name',
        formEmail: 'Email',
        formEmailPh: 'you@example.com',
        formMessage: 'Message',
        formMessagePh: 'Briefly describe what you need…',
        formSubmit: 'Send message',
        formHint: 'This form is a placeholder — nothing is submitted.',
        formDone: 'Received! (placeholder: nothing was sent)',
        values: ['hello@example.com', 'YourWeChatID', '+86 138 0000 0000', 'github.com/yourname']
      }
    }
  },

  /* ===================== 应届生版：校招 / 实习语境 ===================== */
  graduate: {
    zh: {
      contact: {
        kicker: 'CONTACT',
        title: '联系方式',
        subtitle: '期待加入你的团队（占位示例）',
        linksHead: '直达通道',
        email: '邮箱',
        wechat: '微信',
        phone: '电话',
        github: 'GitHub',
        formHead: '给我留言',
        formName: '姓名',
        formNamePh: '请输入您的姓名',
        formEmail: '邮箱',
        formEmailPh: 'you@example.com',
        formMessage: '留言内容',
        formMessagePh: '简单介绍一下校招或实习机会…',
        formSubmit: '发送留言',
        formHint: '表单为占位示例，点击不会真的提交。',
        formDone: '已收到！(占位提示：演示环境未发送)',
        values: ['hello@example.com', 'YourWeChatID', '+86 138 0000 0000', 'github.com/yourname']
      }
    },
    en: {
      contact: {
        kicker: 'CONTACT',
        title: 'Contact',
        subtitle: "I'd love to join your team (placeholder)",
        linksHead: 'Direct channels',
        email: 'Email',
        wechat: 'WeChat',
        phone: 'Phone',
        github: 'GitHub',
        formHead: 'Send a message',
        formName: 'Name',
        formNamePh: 'Your name',
        formEmail: 'Email',
        formEmailPh: 'you@example.com',
        formMessage: 'Message',
        formMessagePh: 'Briefly describe the new-grad or intern opportunity…',
        formSubmit: 'Send message',
        formHint: 'This form is a placeholder — nothing is submitted.',
        formDone: 'Received! (placeholder: nothing was sent)',
        values: ['hello@example.com', 'YourWeChatID', '+86 138 0000 0000', 'github.com/yourname']
      }
    }
  }
}
