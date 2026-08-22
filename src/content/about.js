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
        p1: '我是 2025 届本科应届生，主修计算机科学与技术。对前端开发充满热情，能快速学习新工具，注重把想法落地成可用的产品。',
        p2: '在校期间通过课程设计、实习与个人项目积累实战经验，习惯用文档记录学习、用作品沉淀成长。',
        p3: '期待一份校招或实习转正机会：前端 / 全栈方向均可，欢迎随时联系交流。',
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
          status: '应届 · 求职中'
        },
        stat: { 1: '学习方向', 2: '个人项目', 3: '实习经历' }
      }
    },
    en: {
      about: {
        eyebrow: 'ABOUT ME',
        title: 'About Me',
        p1: "I'm a 2025 undergrad in Computer Science. Passionate about frontend development, quick to pick up new tools, and focused on shipping ideas into working products.",
        p2: "Through coursework, internships, and personal projects, I've built hands-on experience — I document what I learn and let my work show my growth.",
        p3: 'Looking for a new-grad or intern-to-full-time role in frontend/full-stack. Reach out anytime.',
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
          status: 'Open to new-grad roles'
        },
        stat: { 1: 'Focus', 2: 'Projects', 3: 'Internships' }
      }
    }
  }
}
