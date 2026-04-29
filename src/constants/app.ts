import type { Tab } from "../store";

/**
 * 各模块的路由 key，与 store Tab 类型一一对应
 */
export const TAB_KEYS: Record<Tab, Tab> = {
  movement: "movement",
  todo: "todo",
  settings: "settings",
} as const;

/**
 * 应用名称
 */
export const APP_NAME = "NudgeR";
