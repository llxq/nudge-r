pub mod sql;

use crate::log;
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::{sqlite::SqlitePool, Pool, Sqlite};
use std::fs;
use tauri::{AppHandle, Manager, Runtime};

// 定义一个结构体，用于保存数据库连接池
pub struct DbState {
    pub pool: Pool<Sqlite>,
}

pub async fn init_db<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<Pool<Sqlite>, Box<dyn std::error::Error>> {
    // 获取应用专用的数据目录
    let app_dir = app.path().app_data_dir()?;
    if !app_dir.exists() {
        // 递归创建
        fs::create_dir_all(&app_dir)?;
    }
    // 数据库文件路径
    let db_path = app_dir.join("nudge_r.db");

    // 使用 SqliteConnectOptions
    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true); // 如果不存在就创建

    // 创建连接池
    let pool = SqlitePool::connect_with(options).await?;

    // 建库和表
    sqlx::migrate!("src/migrations").run(&pool).await?;

    log::info_log("数据库初始化成功");

    Ok(pool)
}
