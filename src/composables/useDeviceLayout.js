/* ============================================================
   composables/useDeviceLayout.js — 模块双端布局（DEVICE 维度）
   ------------------------------------------------------------
   作用：给模块组件提供一个跟随「生效设备」的布局开关类。
   - 以 useDevice().effectiveDevice 为唯一事实来源：
       手动模拟（console 设备切换器 setDevice）优先，
       否则按真实视口推断（<768 手机；≥768 含平板→桌面）。
   - 模块根元素挂上 deviceCls（'is-mobile' | 'is-desktop'），
     各模块 scoped 样式在 .is-mobile 下写手机端专属布局。
   为什么不用 @media 当唯一开关：编辑器「手机视口」是 setDevice
   模拟 + 页面整体 scale，真实 window 宽度不变，@media 不会触发；
   用 effectiveDevice 派生的类则真实视口与模拟都一致生效。
   真实手机（<768）时 effectiveDevice 自动 = mobile，与
   @media(max-width:767px) 断点行为一致（见 tokens --bp-md）。
   ============================================================ */

import { computed } from 'vue'
import { useDevice } from '@/composables/useDevice'

export function useDeviceLayout() {
  const { effectiveDevice } = useDevice()

  const isMobile = computed(() => effectiveDevice.value === 'mobile')
  const isDesktop = computed(() => effectiveDevice.value === 'desktop')
  /** 模块根元素布局类：'is-mobile' | 'is-desktop'（永远有一个） */
  const deviceCls = computed(() => (isMobile.value ? 'is-mobile' : 'is-desktop'))

  return { effectiveDevice, isMobile, isDesktop, deviceCls }
}

export default useDeviceLayout
