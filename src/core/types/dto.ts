// sys_user_setting
export interface ISysUserSetting {
  key: string;
  value: string;
  update_at?: string;
}

// sys_movement_config
export interface ISysMovementConfig {
  id: 1;
  interval_min: number;
  activity_min: number;
  is_working: 0 | 1;
  active: 0 | 1;
  default_todo_remind_at: string;
  break_end_at?: number | null;
  start_time?: number | null;
  notification_title: string;
  notification_sub: string;
  notification_tips_json: string;
  notification_button_text: string;
  notification_emoji: string;
  notification_countdown_label: string;
}

// user_todos
export interface IUserTodo {
  id?: number;
  title: string;
  body?: string | null;
  done: 0 | 1;
  remind_at?: number | null;
  created_at: number;
  is_deleted: 0 | 1;
}
