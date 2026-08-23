/* ============================================================
   composables/useDevice.js — DEVICE 维度（第四层）运行时状态
   ------------------------------------------------------------
   作用：全局「当前设备」状态 + 真实设备推断。
   - 桌面版 / 手机版两套模板 + 内容覆盖的切分依据（DEVICE 维度）。
   - device：'desktop' | 'mobile'（编辑器「预览设备模拟」改它）
   - 手动覆盖【会话内】有效（不持久化；旧 localStorage key resume-site.device 已弃用）
   - 真实设备规则（供预览端自动选模板；手动切换优先）：
       ≥1024 桌面；768–1023 平板 → 桌面；<768 手机
   - 手动切换（编辑器模拟视口）优先于真实推断：
       setDevice('mobile') 后本会话一直按 mobile 渲染，
       直到 clearDeviceOverride() 回到「按真实视口自动推断」；
       刷新/重新打开后按真实视口重新自动推断。

   API：
     useDevice() → {
       device,              // ref<'desktop'|'mobile'> 手动模拟设备（会话内有效，不持久化）
       setDevice(next),     // 手动切换设备（编辑器切桌面/手机视口）；标记手动覆盖
       clearDeviceOverride(), // 清除手动覆盖 → 按真实视口自动推断
       isDesktop,           // computed<boolean>
       isMobile,            // computed<boolean>
       inferDeviceFromWidth(width), // 真实设备规则（<768 手机，否则桌面）
       effectiveDevice,     // computed：手动优先，否则按真实视口推断
       manual,              // ref<boolean> 是否手动覆盖
       STORAGE_KEY
     }
   ============================================================ */

import { ref, computed } from 'vue'
import { DEVICE_IDS, DEFAULT_DEVICE } from '@/config/site.config'

export const STORAGE_KEY = 'resume-site.device'

const store = typeof localStorage !== 'undefined' ? localStorage : null

/* 是否手动切换过（模拟视口）：true → 用 device；false → 按真实视口推断 */
const manual = ref(false)

/* 手动设备覆盖改为【会话内】有效（不持久化）：
   每次打开按真实视口自动推断——手机→mobile、桌面→desktop，
   避免上次残留的桌面覆盖让手机端一直渲染桌面布局（用户设计要求）。 */
function detectInitial() {
  return DEFAULT_DEVICE
}

/** 当前设备（手动模拟优先；不持久化） */
export const device = ref(detectInitial())

/* 真实视口宽度（resize 跟踪，供 effectiveDevice 自动推断） */
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => { viewportWidth.value = window.innerWidth })
}

/**
 * 真实设备推断规则：<768 手机；否则桌面（含 768–1023 平板→桌面，≥1024 桌面）。
 * 供预览端自动选模板（无手动切换时）。宽度非法/未提供 → 默认桌面。
 */
export function inferDeviceFromWidth(width) {
  if (typeof width !== 'number' || !Number.isFinite(width) || width <= 0) return DEFAULT_DEVICE
  return width < 768 ? 'mobile' : 'desktop'
}

/** 生效设备：手动模拟优先，否则按真实视口推断（响应式） */
export const effectiveDevice = computed(() =>
  manual.value ? device.value : inferDeviceFromWidth(viewportWidth.value)
)

/** 手动切换设备（编辑器切桌面/手机视口）；同时标记手动覆盖 */
export function setDevice(next) {
  if (!DEVICE_IDS.includes(next)) return
  manual.value = true
  device.value = next
}

/** 清除手动覆盖：回到按真实视口自动推断（平板归桌面） */
export function clearDeviceOverride() {
  manual.value = false
  store?.removeItem(STORAGE_KEY)
}

export const isDesktop = computed(() => device.value === 'desktop')
export const isMobile = computed(() => device.value === 'mobile')

/* ---------- composable ---------- */
export function useDevice() {
  return {
    device,
    setDevice,
    clearDeviceOverride,
    isDesktop,
    isMobile,
    inferDeviceFromWidth,
    effectiveDevice,
    manual,
    STORAGE_KEY
  }
}

export default useDevice
