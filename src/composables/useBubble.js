/* ============================================================
   composables/useBubble.js — 专业技能气泡图数据契约（需求 7）
   ------------------------------------------------------------
   气泡图 = SkillsModule variant 'd' 的数据模型，契约给 T7 交互层照用：
   - 数据仍来自内容层 skills.items = [{ name, level }]（level 0~100）。
   - 气泡直径【默认】由 level 映射：bubbleSizeForLevel(level)。
   - 每气泡可【独立覆盖】大小：元素级样式（useElementStyle）键
     `items.<index>` 的 size 字段优先：
       · size = number → 直径 px（推荐，T7「可调大小」写这个）
       · size = { d: number } → 兼容对象写法
   - 读取统一走 resolveBubbleSize(moduleId, index, level)，模块组件
     与 T7 交互都用它，保证「默认映射 ↔ 元素级覆盖」单点一致。

   契约（记录于 ARCHITECTURE §14）：
     setElementStyle('skills', 'items.3', { size: 96 })   // 覆盖第 4 个气泡
     resolveBubbleSize('skills', 3, 88)                    // → 96（覆盖优先）
     resolveBubbleSize('skills', 5, 88)                    // → level 映射
   - 下标式键局限：增删/重排列表后 index 可能错位（与 DEVICE 维度
     手机内容覆盖一致）；复制粘贴会自动平移下标样式。
   ============================================================ */

import { getElementStyle } from '@/composables/useElementStyle'

/** 气泡直径范围（px）与默认映射参数 */
export const BUBBLE_SIZE = { min: 48, max: 132 }

/** 默认映射：level → 直径 px（level 50→min，level 95→max，线性夹取） */
export function bubbleSizeForLevel(level) {
  const k = Math.max(0, Math.min(1, (Number(level) - 50) / 45))
  return Math.round(BUBBLE_SIZE.min + k * (BUBBLE_SIZE.max - BUBBLE_SIZE.min))
}

/**
 * resolveBubbleSize(moduleId, index, level) — 某气泡最终直径 px。
 * 元素级样式 `items.<index>.size`（number 直径 或 {d}）优先，
 * 否则按 level 映射。返回 px 整数。
 */
export function resolveBubbleSize(moduleId, index, level) {
  const style = getElementStyle(moduleId, `items.${index}`)
  const override = style?.size
  if (typeof override === 'number' && override > 0) return Math.round(override)
  if (override && typeof override === 'object' && typeof override.d === 'number' && override.d > 0) {
    return Math.round(override.d)
  }
  return bubbleSizeForLevel(level)
}

export function useBubble() {
  return { BUBBLE_SIZE, bubbleSizeForLevel, resolveBubbleSize }
}

export default useBubble
