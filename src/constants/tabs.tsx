import type { ComponentType } from 'react';
import type { Tab } from "../store";
import MovementPanel from "../features/movement/MovementPanel";
import TodoPanel from "../features/todo/TodoPanel";
import RemindersPanel from "../features/reminders/RemindersPanel";

/**
 * 单个 Tab 面板的策略配置
 */
export interface TabConfig {
  /** Tab key，与 store.Tab 类型一致 */
  key: Tab;
  /** 该 Tab 渲染的面板组件 */
  component: ComponentType;
}

/**
 * Tab 面板策略映射表
 * 新增模块只需在此处注册，Shell 无需改动
 */
export const TAB_CONFIGS: TabConfig[] = [
  { key: "movement", component: MovementPanel },
  { key: "todo",     component: TodoPanel },
  { key: "reminders", component: RemindersPanel },
];

/**
 * 以 key 为索引的 Tab 策略 Map，用于 O(1) 查找
 */
export const TAB_MAP = new Map<Tab, ComponentType>(
  TAB_CONFIGS.map(({ key, component }) => [key, component])
);
