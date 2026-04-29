import type { AppState } from "../store";

/**
 * 各导航模块对应的图标背景色
 */
export const SESSION_ICON_COLORS = {
  movement: "#07c160",
  todo: "#1e6fff",
  settings: "#7a7f87",
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
  const reminded = s.todos.filter((t) => !t.done && t.isRemind).length;
  if (left === 0) {
    return "全部完成 ✓";
  }
  return reminded > 0 ? `${left} 项待完成 · 已提醒 ${reminded}` : `${left} 项待完成`;
}

/**
 * 设置模块在会话列表中的副标题文案
 */
export function settingsSubText(s: AppState): string {
  return s.autoStart ? "已开启开机自启" : "应用与启动设置";
}
