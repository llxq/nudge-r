pub mod notice;
pub mod sql;

// 定义一个宏，用于把所有命令都打包
#[macro_export]
macro_rules! register_commands {
    () => {
        tauri::generate_handler![
          crate::commands::notice::notice,
          crate::commands::notice::open_notice_window,
          crate::commands::notice::close_notice_windows,
          crate::tray::get_tray_detail_snapshot,
          crate::tray::show_main_window_from_tray,
          crate::tray::quit_app,
          crate::commands::sql::get_user_settings,
          crate::commands::sql::get_movement_config,
          crate::commands::sql::get_movement_notification_config,
          crate::commands::sql::update_user_settings,
          crate::commands::sql::update_movement_config,
          crate::commands::sql::get_user_todos,
          crate::commands::sql::create_user_todo,
          crate::commands::sql::update_user_todo,
          crate::commands::sql::delete_user_todo,
          crate::commands::sql::done_user_todo
        ]
    };
}
