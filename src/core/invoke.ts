import { invoke } from '@tauri-apps/api/core';
import type { AppState, MovementState, Todo } from '../store';

type UserSettings = Pick<AppState, 'theme' | 'tab'>;
export interface IMovementNotificationConfig {
  activityMin: number;
  title: string;
  sub: string;
  tips: string[];
  buttonText: string;
  emoji: string;
  countdownLabel: string;
}

export interface ITrayDetailMovementState {
  statusText: string;
  intervalMin: number;
  isWorking: boolean;
  active: boolean;
  startTime: number | null;
}

export interface ITrayDetailSnapshot {
  movement: ITrayDetailMovementState;
  todos: string[];
  overflowCount: number;
}

/**
 * 获取用户设置
 */
export const getUserSettings = async (): Promise<Partial<UserSettings>> => {
  const settings = await invoke<Partial<UserSettings>>('get_user_settings');
  return settings;
};

/**
 * 更新用户设置
 * @param settings
 */
export const updateUserSettings = async (settings: Partial<UserSettings>) => {
  await invoke('update_user_settings', { settings });
};

/**
 * 获取默认的配置
 */
export const getMovementConfig = async (): Promise<Partial<AppState>> => {
  const config = await invoke<MovementState>('get_movement_config');
  return {
    movement: config,
  };
};

/**
 * 获取活动提醒通知页配置
 */
export const getMovementNotificationConfig =
  async (): Promise<IMovementNotificationConfig> => {
    return await invoke<IMovementNotificationConfig>('get_movement_notification_config');
  };

/**
 * 更新默认的配置
 * @param config
 */
export const updateMovementConfig = async (config: Partial<MovementState>) => {
  await invoke('update_movement_config', { config });
};

/**
 * 获取待办列表
 */
export const getUserTodos = async (): Promise<Todo[]> => {
  return await invoke<Todo[]>('get_user_todos');
};

/**
 * 更新待办列表
 * @param todo
 */
export const updateUserTodo = async (todo: Partial<Todo>) => {
  await invoke('update_user_todo', { todo });
};

/**
 * 添加待办
 * @param todo
 */
export const createUserTodo = async (todo: Partial<Todo>) => {
  await invoke('create_user_todo', { todo });
};

/**
 * 删除待办
 * @param todo
 */
export const deleteUserTodo = async (todo: Partial<Todo>) => {
  await invoke('delete_user_todo', { todo });
};

/**
 * 完成待办
 */
export const doneUserTodo = async (todo: Partial<Todo>) => {
  await invoke('done_user_todo', {todo});
}

/**
 * 关闭所有活动提醒窗口
 */
export const closeNoticeWindows = async (): Promise<void> => {
  await invoke('close_notice_windows');
};

/**
 * 获取托盘详情快照
 */
export const getTrayDetailSnapshot = async (): Promise<ITrayDetailSnapshot> => {
  return await invoke<ITrayDetailSnapshot>('get_tray_detail_snapshot');
};

/**
 * 从托盘详情打开主窗口
 */
export const showMainWindowFromTray = async (): Promise<void> => {
  await invoke('show_main_window_from_tray');
};

/**
 * 退出应用
 */
export const quitApp = async (): Promise<void> => {
  await invoke('quit_app');
};
