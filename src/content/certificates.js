/* ============================================================
   content/certificates.js — 证书认证（certificates）富内容（内容层 CONTENT 的一部分）
   ------------------------------------------------------------
   形状：{ templateId: { lang: { certificates: {...} } } }
   来源：CertificatesModule.vue 原组件内 DICT，迁移到内容层后由模块用
   useContent().get(version, lang, 'certificates.*') 读取。
   certificates.items = [{ name, issuer, year }]
   （数组读写由内容 store 支持，控制台可编辑每个列表项）
   ============================================================ */

export const CERTIFICATES_CONTENT = {
  /* ===================== 资深版 ===================== */
  senior: {
    zh: {
      certificates: {
        kicker: 'CERTIFICATES',
        title: '证书认证',
        subtitle: '专业资格与荣誉（占位示例）',
        issuedBy: '颁发方',
        items: [
          { name: '高级前端工程师认证', issuer: '示例认证机构', year: '2023' },
          { name: '全栈开发训练营优秀学员', issuer: '示例训练营', year: '2022' },
          { name: 'UI 设计基础认证', issuer: '示例设计学院', year: '2021' },
          { name: '英语六级（CET-6）', issuer: '教育考试中心', year: '2020' },
          { name: '云计算工程师（初级）', issuer: '示例云厂商', year: '2023' },
          { name: '项目管理（PMP 备考）', issuer: '示例培训中心', year: '2024' }
        ]
      }
    },
    en: {
      certificates: {
        kicker: 'CERTIFICATES',
        title: 'Certificates',
        subtitle: 'Professional credentials & honors (placeholder)',
        issuedBy: 'Issued by',
        items: [
          { name: 'Senior Frontend Engineer Certification', issuer: 'Example Institute', year: '2023' },
          { name: 'Full-stack Bootcamp Honor', issuer: 'Example Bootcamp', year: '2022' },
          { name: 'UI Design Fundamentals', issuer: 'Example Design School', year: '2021' },
          { name: 'CET-6 English Proficiency', issuer: 'National Exam Center', year: '2020' },
          { name: 'Cloud Engineer (Associate)', issuer: 'Example Cloud Vendor', year: '2023' },
          { name: 'Project Management (PMP prep)', issuer: 'Example Training Center', year: '2024' }
        ]
      }
    }
  },

  /* ===================== 应届生版：四六级 / 普通话 / 专业证书 ===================== */
  graduate: {
    zh: {
      certificates: {
        kicker: 'CERTIFICATES',
        title: '证书认证',
        subtitle: '英语、普通话与专业证书（占位示例）',
        issuedBy: '颁发方',
        items: [
          { name: '英语六级（CET-6）', issuer: '教育部', year: '2024' },
          { name: '普通话水平测试 · 二级甲等', issuer: '国家语委', year: '2023' },
          { name: '计算机等级考试 · 二级 C 语言', issuer: '教育部考试中心', year: '2023' },
          { name: '前端开发微专业证书', issuer: '示例在线学习平台', year: '2024' },
          { name: 'Vue 3 实战训练营', issuer: '示例训练营', year: '2023' },
          { name: '计算机等级考试 · 二级 Office', issuer: '教育部考试中心', year: '2022' }
        ]
      }
    },
    en: {
      certificates: {
        kicker: 'CERTIFICATES',
        title: 'Certificates',
        subtitle: 'English, Mandarin & professional certifications (placeholder)',
        issuedBy: 'Issued by',
        items: [
          { name: 'CET-6 English Proficiency', issuer: 'Ministry of Education', year: '2024' },
          { name: 'Mandarin Proficiency · Level 2A', issuer: 'State Language Commission', year: '2023' },
          { name: 'NCRE Level 2 · C Language', issuer: 'Ministry of Education Exam Center', year: '2023' },
          { name: 'Frontend Micro-degree Certificate', issuer: 'Example Online Platform', year: '2024' },
          { name: 'Vue 3 Bootcamp', issuer: 'Example Bootcamp', year: '2023' },
          { name: 'NCRE Level 2 · Office', issuer: 'Ministry of Education Exam Center', year: '2022' }
        ]
      }
    }
  }
}
