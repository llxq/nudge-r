// 查询系统用户设置表 sys_user_setting
pub mod sys_user_setting {
  pub const SELECT: &str = "SELECT key, value FROM sys_user_setting";
}

// 查询活动提醒表配置 sys_movement_config
pub mod sys_movement_config {
  pub const SELECT: &str = "SELECT * FROM sys_movement_config WHERE id = 1";
  pub const UPDATE: &str = "UPDATE sys_movement_config SET ";
  pub const UPDATE_START_TIME: &str = "UPDATE sys_movement_config SET start_time = ? WHERE id = 1";
}

pub mod user_todo {
  // 查询未完成列表
  pub const SELECT_NOT_DONE: &str =
    "SELECT * FROM user_todos WHERE done = 0 AND is_deleted = 0 ORDER BY remind_at ASC";
  // 查询已完成列表
  pub const SELECT_DONE: &str =
    "SELECT * FROM user_todos WHERE done = 1 AND is_deleted = 0 ORDER BY remind_at DESC";
  pub const SELECT_ALL: &str = "SELECT * FROM user_todos WHERE is_deleted = 0 ORDER BY remind_at DESC";
  // 插入一个待办
  pub const INSERT: &str =
    "INSERT INTO user_todos (title, body, remind_at) VALUES (?, ?, ?)";
  // 删除一个待办
  pub const DELETE: &str = "UPDATE user_todos SET is_deleted = 1 WHERE id = ?";
  // 更新一个待办
  pub const UPDATE: &str =
    "UPDATE user_todos SET title = ?, body = ?, remind_at = ? WHERE id = ?";

  pub const SELECT_BY_ID: &str = "SELECT * FROM user_todos WHERE id = ?";

  pub const UPDATE_DONE: &str = "UPDATE user_todos SET done = ? WHERE id = ?";
  pub const UPDATE_IS_REMIND: &str = "UPDATE user_todos SET is_remind = ? WHERE id = ?";
  // 查询所有未完成并且未提醒的数据
  pub const SELECT_NOT_DONE_AND_NOT_REMIND: &str = "SELECT * FROM user_todos WHERE done = 0 AND is_deleted = 0 AND is_remind = 0 AND remind_at IS NOT NULL AND remind_at <= ? ORDER BY remind_at ASC";
}
