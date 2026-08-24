import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 子路径部署：资源都挂 /resume-site/（部署时可按仓库改名）
  base: '/resume-site/',
  plugins: [vue()],
  // 构建时间戳（footer 版本徽标用，便于确认线上/本地跑的是哪次构建）
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  resolve: {
    alias: {
      // @ 指向 src，方便各模块引用主题/配置/组件
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    // 强制 gsap 只保留一份实例（否则 Vite 预打包会把 gsap 与
    // gsap/ScrollTrigger 拆成两个各自内联 gsap-core 的 chunk，
    // 导致 ScrollTrigger 与 tween 的 gsap 核心不一致、scrollTrigger
    // 配置被忽略）
    dedupe: ['gsap']
  },
  optimizeDeps: {
    // gsap 走源码解析，避免预打包产生多份 gsap-core（同 dedupe）
    exclude: ['gsap', 'gsap/ScrollTrigger']
  },
  server: {
    port: 5173,
    open: false
  },
  build: {
    target: 'es2019',
    outDir: 'dist',
    sourcemap: false
  }
})
