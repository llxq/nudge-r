mod commands;
mod error;
mod db;
mod log;
pub mod background;
mod tray;

use db::init_db;
use crate::db::DbState;
use background::start_background;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    // 添加通知插件
    .plugin(tauri_plugin_notification::init())
    // 添加文件打开插件
    .plugin(tauri_plugin_opener::init())
    // 添加 SQLite 插件
    .plugin(tauri_plugin_sql::Builder::default().build())
    .setup(|app| {
      tray::setup_tray(app)?;

      // 拿到句柄，并且复制一份
      let handle = app.handle().clone();
      tauri::async_runtime::block_on(async move {
        let pool = init_db(&handle).await.expect("数据库初始化失败");
        handle.manage(DbState {pool})
      });
      start_background(app.handle().clone());
      tauri::async_runtime::block_on(async {
        let _ = tray::refresh_tray_menu(&app.handle()).await;
      });
      log::info_log("应用启动成功");
      Ok(())
    })
    .on_menu_event(tray::handle_menu_event)
    .on_tray_icon_event(tray::handle_tray_event)
    .on_window_event(tray::handle_window_event)
    .invoke_handler(register_commands!())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
  log::info_log("应用退出");
}
