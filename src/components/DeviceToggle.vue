<script setup>
/**
 * DeviceToggle — 设备切换器（桌面版 / 手机版视口模拟，需求 3）
 * ------------------------------------------------------------
 * 读 useDevice()：setDevice('desktop' | 'mobile') 手动切换「预览设备」。
 * - 切换后模板/内容按 device 取（T1 useTemplates/useContent 已做）：
 *   模块列表、顺序、动画、字号、变体各自独立，实时切换。
 * - App.vue 依据 device 决定预览视口：桌面 = 整页等比缩放；手机 =
 *   390px 手机视口框架再等比缩放适配面板左侧空间。
 * - 手动切换持久化（resume-site.device）；样式仿 ModeToggle（玻璃分段）。
 */
import { useDevice } from '@/composables/useDevice'
import { useI18n } from '@/i18n'

const { device, setDevice } = useDevice()
const { lang } = useI18n()

const DEVICES = [
  { id: 'desktop', icon: '🖥', label: { zh: '桌面', en: 'Desktop' } },
  { id: 'mobile',  icon: '📱', label: { zh: '手机', en: 'Mobile' } }
]
function labelOf(d) {
  return d.label?.[lang.value] ?? d.label?.zh ?? d.id
}
</script>

<template>
  <div class="device-toggle glass" role="group" aria-label="切换设备 / Switch device">
    <button
      v-for="d in DEVICES"
      :key="d.id"
      type="button"
      class="device-toggle__btn"
      :class="{ 'device-toggle__btn--active': device === d.id }"
      :aria-pressed="device === d.id"
      :title="labelOf(d)"
      @click="setDevice(d.id)"
    >
      <span class="device-toggle__icon" aria-hidden="true">{{ d.icon }}</span>
      <span class="device-toggle__label">{{ labelOf(d) }}</span>
    </button>
  </div>
</template>

<style scoped>
.device-toggle {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--dur-fast) var(--ease-out);
}
.device-toggle__btn {
  min-width: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: var(--space-1) var(--space-2);
  font-size: var(--fs-sm);
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  color: var(--text-secondary);
  border-radius: var(--radius-pill);
  transition:
    color var(--dur-fast) var(--ease-out),
    background var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
}
.device-toggle__btn:hover {
  color: var(--text-primary);
  background: var(--glass-bg-hover);
}
.device-toggle__btn--active {
  color: var(--on-accent);
  background: var(--accent-gradient);
  font-weight: 700;
  box-shadow: var(--shadow-glow);
}
.device-toggle__btn--active:hover {
  filter: brightness(1.08);
  color: var(--on-accent);
}
.device-toggle__icon { font-size: 12px; line-height: 1; }

/* 窄屏 / 手机预览：收紧为图标按钮 */
@media (max-width: 1023px) {
  .device-toggle__btn { min-width: 34px; padding: var(--space-1) 6px; }
  .device-toggle__label { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .device-toggle, .device-toggle__btn { transition: none; }
  .device-toggle__btn--active { box-shadow: none; }
}
</style>
