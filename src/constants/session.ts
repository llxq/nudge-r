import type { AppState } from "../store";

/**
 * 各导航模块对应的图标背景色
 */
export const SESSION_ICON_COLORS = {
  movement: "#07c160",
  todo: "#1e6fff",
  reminders: "#fa541c",
} as const;

/**
 * 活动提醒模块在会话列表中的副标题文案
 */
export function movementSubText(s: AppState): string {
  return s.movement.active
    ? `每 ${s.movement.intervalMin} min 提醒`
    : "未开启";
}

/**
 * 待办模块在会话列表中的副标题文案
 */
export function todoSubText(s: AppState): string {
  const left = s.todos.filter((t) => !t.done).length;
  return left > 0 ? `${left} 项待完成` : "全部完成 ✓";
}
