/* ============================================================
   content/about.js — 关于我（about）富内容（内容层 CONTENT 的一部分）
   ------------------------------------------------------------
   形状：{ templateId: { lang: { about: {...} } } }
   来源：AboutModule.vue 原组件内 DICT，迁移到内容层后由模块用
   useContent().get(version, lang, 'about.*') 读取。
   结构（与组件读取路径对齐）：
     about.eyebrow / title / p1..p3
     about.card.title
     about.age / city / mail / phone / available（信息卡标签）
     about.placeholder.age / city / mail / phone / status（信息卡占位值）
     about.stat.1 / 2 / 3（variant b 统计条标签）
   ============================================================ */

export const ABOUT_CONTENT = {
  /* ===================== 资深版 ===================== */
  senior: {
    zh: {
      about: {
        eyebrow: '了解我',
        title: '关于我',
        p1: '这里是一段占位自我介绍。写清楚你是谁、做过什么、擅长什么，以及为什么值得被记住。两三句话足够，重点是真诚和具体。',
        p2: '第二段可以补充你的工作理念、你喜欢的工具链，或者你在业余时间做的事情。保持简洁，让阅读体验始终轻盈。',
        p3: '最后一段可以给出你的合作方式与期望：远程 / 全职 / 自由职业均可，随时欢迎交流。',
        card: { title: '个人档案' },
        age: '年龄',
        city: '城市',
        mail: '邮箱',
        phone: '电话',
        available: '求职状态',
        placeholder: {
          age: 'XX',
          city: '上海 · 中国',
          mail: 'you@example.com',
          phone: '+86 138 0000 0000',
          status: '正在寻找机会'
        },
        stat: { 1: '专注领域', 2: '技术文章', 3: '开源项目' }
      }
    },
    en: {
      about: {
        eyebrow: 'ABOUT ME',
        title: 'About Me',
        p1: 'This is a placeholder intro. Describe who you are, what you have built, and what you are great at. A few honest, concrete sentences are enough.',
        p2: 'A second paragraph can cover your working philosophy, your favorite toolchain, or what you do in your spare time. Keep it short and light.',
        p3: 'Wrap up with how you like to collaborate: remote, full-time, or freelance — all welcome. Reach out anytime.',
        card: { title: 'Profile' },
        age: 'Age',
        city: 'Location',
        mail: 'Email',
        phone: 'Phone',
        available: 'Status',
        placeholder: {
          age: 'XX',
          city: 'Shanghai, CN',
          mail: 'you@example.com',
          phone: '+86 138 0000 0000',
          status: 'Open to opportunities'
        },
        stat: { 1: 'Focus', 2: 'Articles', 3: 'OSS Projects' }
      }
    }
  },

  /* ===================== 应届生版 ===================== */
  graduate: {
    zh: {
      about: {
        eyebrow: '关于我',
        title: '关于我',
        p1: '这里是一段占位自我介绍。写清楚你是谁、在读什么专业、做过什么、擅长什么，以及为什么值得被记住。两三句话足够，重点是真诚和具体。',
        p2: '第二段可以补充你的校园经历、参与的竞赛或项目、掌握的工程软件，或者你在业余时间做的事情。保持简洁，让阅读体验始终轻盈。',
        p3: '最后一段可以给出你的求职期望：实习 / 校招均可，随时欢迎联系交流。',
        card: { title: '个人档案' },
        age: '年龄',
        city: '城市',
        mail: '邮箱',
        phone: '电话',
        available: '求职状态',
        placeholder: {
          age: 'XX',
          city: '城市 · 中国',
          mail: 'you@example.com',
          phone: '+86 138 0000 0000',
          status: '在校学生 · 实习求职中'
        },
        stat: { 1: '主修方向', 2: '工程软件', 3: '实战经历' }
      }
    },
    en: {
      about: {
        eyebrow: 'ABOUT ME',
        title: 'About Me',
        p1: "This is a placeholder intro. Describe who you are, what you're studying, what you have built, and what you are great at. A few honest, concrete sentences are enough.",
        p2: 'A second paragraph can cover campus activities, competitions or projects you joined, engineering tools you know, or what you do in your spare time. Keep it short and light.',
        p3: 'Wrap up with what you are looking for: internships and new-grad roles — reach out anytime.',
        card: { title: 'Profile' },
        age: 'Age',
        city: 'Location',
        mail: 'Email',
        phone: 'Phone',
        available: 'Status',
        placeholder: {
          age: 'XX',
          city: 'City, CN',
          mail: 'you@example.com',
          phone: '+86 138 0000 0000',
          status: 'Student · Open to internships'
        },
        stat: { 1: 'Focus', 2: 'Engineering Tools', 3: 'Projects' }
      }
    }
  }
}
