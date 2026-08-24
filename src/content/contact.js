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
        formHint: '点击发送会打开你的邮件客户端，留言将直接发到作者邮箱。',
        formDone: '已打开邮件客户端，确认发送即可！',
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
        formHint: "Clicking send opens your mail app — the message goes straight to the author's inbox.",
        formDone: 'Mail app opened — just hit send!',
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
        subtitle: '欢迎联系交流（实习 / 校招均可）',
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
        formHint: '点击发送会打开你的邮件客户端，留言将直接发到作者邮箱。',
        formDone: '已打开邮件客户端，确认发送即可！',
        values: ['you@example.com', '你的微信ID', '+86 138 0000 0000', 'github.com/yourname']
      }
    },
    en: {
      contact: {
        kicker: 'CONTACT',
        title: 'Contact',
        subtitle: "I'd love to connect — internships and new-grad roles welcome",
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
        formHint: "Clicking send opens your mail app — the message goes straight to the author's inbox.",
        formDone: 'Mail app opened — just hit send!',
        values: ['you@example.com', 'YourWeChatID', '+86 138 0000 0000', 'github.com/yourname']
      }
    }
  }
}
