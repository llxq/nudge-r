use crate::{
    db::{
        sql::{sys_movement_config, sys_user_setting, user_todo},
        DbState,
    },
    error::Result,
    tray,
};
use heck::AsLowerCamelCase;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, QueryBuilder, Row, Sqlite};
use std::{
    collections::HashMap,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager, Runtime};

// 查询 sys_user_setting 表中所有配置
#[tauri::command]
pub async fn get_user_settings<R: Runtime>(app: AppHandle<R>) -> Result<HashMap<String, String>> {
    let state = app.state::<DbState>();
    Ok(sqlx::query(sys_user_setting::SELECT)
        .fetch_all(&state.pool)
        .await?
        .into_iter()
        .map(|record| {
            (
                AsLowerCamelCase(record.get::<String, _>("key")).to_string(),
                record.get::<String, _>("value"),
            )
        })
        .collect())
}

// 更新 sys_user_setting 表中的配置项
#[tauri::command]
pub async fn update_user_settings<R: Runtime>(
    app: AppHandle<R>,
    settings: HashMap<String, String>,
) -> Result<()> {
    let state = app.state::<DbState>();
    let setting_vec: Vec<(String, String)> = settings.into_iter().collect();
    if setting_vec.is_empty() {
        return Ok(());
    }
    // 使用事务批量更新配置项
    let mut tx: sqlx::Transaction<'_, sqlx::Sqlite> = state.pool.begin().await?;
    let mut query_builder = QueryBuilder::new("INSERT INTO sys_user_setting (key, value)  ");
    query_builder.push_values(setting_vec, |mut b, (key, value)| {
        b.push_bind(key).push_bind(value);
    });
    query_builder.push(" ON CONFLICT(key) DO UPDATE SET value = excluded.value");
    query_builder.build().execute(&mut *tx).await?;
    tx.commit().await?;
    Ok(())
}

#[derive(Debug, FromRow)]
pub struct MovementConfigRow {
    // sqlLite 中只有 64 位整数
    interval_min: i64,
    activity_min: i64,
    is_working: i64,
    active: i64,
    default_todo_remind_at: String,
    break_end_at: Option<i64>,
    start_time: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MovementConfig {
    pub interval_min: i64,
    pub activity_min: i64,
    pub is_working: bool,
    pub active: bool,
    pub default_todo_remind_at: String,
    pub break_end_at: Option<i64>,
    pub start_time: Option<i64>,
}

#[derive(Debug, FromRow)]
struct MovementNotificationConfigRow {
    activity_min: i64,
    notification_title: String,
    notification_sub: String,
    notification_tips_json: String,
    notification_button_text: String,
    notification_emoji: String,
    notification_countdown_label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct MovementNotificationConfig {
    pub activity_min: i64,
    pub title: String,
    pub sub: String,
    pub tips: Vec<String>,
    pub button_text: String,
    pub emoji: String,
    pub countdown_label: String,
}

impl TryFrom<MovementNotificationConfigRow> for MovementNotificationConfig {
    type Error = crate::error::Error;

    fn try_from(row: MovementNotificationConfigRow) -> Result<Self> {
        Ok(Self {
            activity_min: row.activity_min,
            title: row.notification_title,
            sub: row.notification_sub,
            tips: serde_json::from_str(&row.notification_tips_json)?,
            button_text: row.notification_button_text,
            emoji: row.notification_emoji,
            countdown_label: row.notification_countdown_label,
        })
    }
}
impl From<MovementConfigRow> for MovementConfig {
    fn from(row: MovementConfigRow) -> Self {
        Self {
            interval_min: row.interval_min,
            activity_min: row.activity_min,
            is_working: row.is_working != 0,
            active: row.active != 0,
            default_todo_remind_at: row.default_todo_remind_at,
            break_end_at: row.break_end_at,
            start_time: row.start_time,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MovementConfigPatch {
    pub interval_min: Option<i64>,
    pub activity_min: Option<i64>,
    pub is_working: Option<bool>,
    pub active: Option<bool>,
    pub default_todo_remind_at: Option<String>,
    pub break_end_at: Option<Option<i64>>,
    pub start_time: Option<Option<i64>>,
}
// 查询活动提醒表配置 sys_movement_config
#[tauri::command]
pub async fn get_movement_config<R: Runtime>(app: AppHandle<R>) -> Result<MovementConfig> {
    let state = app.state::<DbState>();
    let row = sqlx::query_as::<_, MovementConfigRow>(sys_movement_config::SELECT)
        .fetch_one(&state.pool)
        .await?;
    Ok(row.into())
}

#[tauri::command]
pub async fn get_movement_notification_config<R: Runtime>(
    app: AppHandle<R>,
) -> Result<MovementNotificationConfig> {
    let state = app.state::<DbState>();
    fetch_movement_notification_config_from_pool(&state.pool).await
}

async fn fetch_movement_notification_config_from_pool(
    pool: &sqlx::SqlitePool,
) -> Result<MovementNotificationConfig> {
    let row = sqlx::query_as::<_, MovementNotificationConfigRow>(sys_movement_config::SELECT)
        .fetch_one(pool)
        .await?;
    row.try_into()
}

// 更新活动提醒表 sys_movement_config 中的配置项
#[tauri::command]
pub async fn update_movement_config<R: Runtime>(
    app: AppHandle<R>,
    config: MovementConfigPatch,
) -> Result<()> {
    let state = app.state::<DbState>();
    // 只要这次 patch 显式传了 active，就由后端统一接管 start_time：
    // active=true 时写入当前时间，active=false 时清空。
    let start_time_from_active = config.active.map(|is_active| {
        if is_active {
            Some(
                SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .expect("system time before unix epoch")
                    .as_millis() as i64,
            )
        } else {
            None
        }
    });
    let mut query_builder: QueryBuilder<'_, Sqlite> =
        QueryBuilder::new(sys_movement_config::UPDATE);

    let mut has_update = false;
    // 定义一个闭包来简化构建 SQL 语句的逻辑
    let mut push_set = |qb: &mut QueryBuilder<'_, Sqlite>| {
        if has_update {
            qb.push(", ");
        }
        has_update = true;
    };

    if let Some(v) = config.interval_min {
        push_set(&mut query_builder);
        query_builder.push("interval_min = ").push_bind(v);
    }
    if let Some(v) = config.activity_min {
        push_set(&mut query_builder);
        query_builder.push("activity_min = ").push_bind(v);
    }
    if let Some(v) = config.is_working {
        push_set(&mut query_builder);
        query_builder.push("is_working = ").push_bind(v as i64);
    }
    if let Some(v) = config.active {
        push_set(&mut query_builder);
        query_builder.push("active = ").push_bind(v as i64);
    }
    if let Some(v) = config.default_todo_remind_at {
        push_set(&mut query_builder);
        query_builder.push("default_todo_remind_at = ").push_bind(v);
    }
    if let Some(v) = config.break_end_at {
        push_set(&mut query_builder);
        query_builder.push("break_end_at = ").push_bind(v);
    }
    if let Some(v) = start_time_from_active.or(config.start_time) {
        push_set(&mut query_builder);
        query_builder.push("start_time = ").push_bind(v);
    }

    if query_builder.sql().len() <= sys_movement_config::UPDATE.len() {
        return Ok(());
    }
    query_builder.push(" WHERE id = 1");
    query_builder.build().execute(&state.pool).await?;
    tray::refresh_tray_menu(&app).await?;

    Ok(())
}

#[derive(Debug, FromRow)]
struct UserTodoRow {
    id: i64,
    title: String,
    body: Option<String>,
    done: i64,
    remind_at: Option<i64>,
    is_deleted: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserTodo {
    id: i64,
    title: String,
    body: Option<String>,
    done: bool,
    remind_at: Option<i64>,
    is_deleted: bool,
}

impl From<UserTodoRow> for UserTodo {
    fn from(row: UserTodoRow) -> Self {
        Self {
            id: row.id,
            title: row.title,
            body: row.body,
            done: row.done != 0,
            remind_at: row.remind_at,
            is_deleted: row.is_deleted != 0,
        }
    }
}

// 查询用户待办列表，不考虑区分完成状态，直接一个查询
#[tauri::command]
pub async fn get_user_todos<R: Runtime>(app: AppHandle<R>) -> Result<Vec<UserTodo>> {
    let state = app.state::<DbState>();

    let rows = sqlx::query_as::<_, UserTodoRow>(user_todo::SELECT_ALL)
        .fetch_all(&state.pool)
        .await?;

    Ok(rows.into_iter().map(UserTodo::from).collect())
}

// 新增：专门用于创建的结构体，不包含 id, done, is_deleted 等默认值字段
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateUserTodoPayload {
    pub title: String,
    pub body: Option<String>,
    pub remind_at: Option<i64>,
}

// 插入一个待办
#[tauri::command]
pub async fn create_user_todo<R: Runtime>(
    app: AppHandle<R>,
    todo: CreateUserTodoPayload,
) -> Result<bool> {
    let state = app.state::<DbState>();
    sqlx::query(user_todo::INSERT)
        .bind(todo.title)
        .bind(todo.body)
        .bind(todo.remind_at)
        .execute(&state.pool)
        .await?;
    tray::refresh_tray_menu(&app).await?;
    Ok(true)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserTodoPayload {
    pub id: i64,
    pub title: Option<String>,
    pub body: Option<String>,
    pub done: Option<bool>,
    pub remind_at: Option<i64>,
}

#[tauri::command]
pub async fn update_user_todo<R: Runtime>(
    app: AppHandle<R>,
    todo: UpdateUserTodoPayload,
) -> Result<bool> {
    let state = app.state::<DbState>();

    // 1. 先从数据库查出当前的数据
    let old = sqlx::query_as::<_, UserTodoRow>(user_todo::SELECT_BY_ID)
        .bind(todo.id)
        .fetch_one(&state.pool)
        .await?;

    // 2. 合并数据：如果前端传了就用新的，没传就用数据库里老的
    let title = todo.title.unwrap_or(old.title);
    let body = todo.body.or(old.body);
    let remind_at = todo.remind_at.or(old.remind_at);

    // 3. 执行更新
    sqlx::query(user_todo::UPDATE)
        .bind(title)
        .bind(body)
        .bind(remind_at)
        .bind(todo.id)
        .execute(&state.pool)
        .await?;
    tray::refresh_tray_menu(&app).await?;

    Ok(true)
}

#[tauri::command]
pub async fn done_user_todo<R: Runtime>(
    app: AppHandle<R>,
    todo: UpdateUserTodoPayload,
) -> Result<bool> {
    let state = app.state::<DbState>();
    let done = todo.done.unwrap_or(false);
    sqlx::query(user_todo::UPDATE_DONE)
        .bind(if done { 1 } else { 0 })
        .bind(todo.id)
        .execute(&state.pool)
        .await?;
    tray::refresh_tray_menu(&app).await?;
    Ok(true)
}

// 删除一个待办
#[tauri::command]
pub async fn delete_user_todo<R: Runtime>(app: AppHandle<R>, id: i64) -> Result<()> {
    let state = app.state::<DbState>();
    sqlx::query(user_todo::DELETE)
        .bind(id)
        .execute(&state.pool)
        .await?;
    tray::refresh_tray_menu(&app).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{fetch_movement_notification_config_from_pool, MovementNotificationConfig};
    use sqlx::sqlite::SqlitePoolOptions;

    /**
     * 通知页配置应完整从数据库读取
     */
    #[test]
    fn movement_notification_config_reads_from_db() {
        tauri::async_runtime::block_on(async {
            let pool = SqlitePoolOptions::new()
                .max_connections(1)
                .connect(":memory:")
                .await
                .expect("内存数据库连接失败");

            sqlx::query(
                r#"
                CREATE TABLE sys_movement_config (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    interval_min INTEGER NOT NULL,
                    activity_min INTEGER NOT NULL,
                    is_working INTEGER NOT NULL,
                    active INTEGER NOT NULL,
                    default_todo_remind_at TEXT NOT NULL,
                    break_end_at INTEGER,
                    start_time INTEGER,
                    notification_title TEXT NOT NULL,
                    notification_sub TEXT NOT NULL,
                    notification_tips_json TEXT NOT NULL,
                    notification_button_text TEXT NOT NULL,
                    notification_emoji TEXT NOT NULL,
                    notification_countdown_label TEXT NOT NULL
                )
                "#,
            )
            .execute(&pool)
            .await
            .expect("创建 sys_movement_config 失败");

            sqlx::query(
                r#"
                INSERT INTO sys_movement_config (
                    id, interval_min, activity_min, is_working, active, default_todo_remind_at,
                    break_end_at, start_time, notification_title, notification_sub,
                    notification_tips_json, notification_button_text, notification_emoji,
                    notification_countdown_label
                ) VALUES (
                    1, 30, 5, 1, 1, '09:00:00',
                    NULL, NULL, '起来活动', '先拉伸两分钟',
                    '["拉伸颈肩","起身走动"]', '好的，我现在去', '🏃', '活动时间'
                )
                "#,
            )
            .execute(&pool)
            .await
            .expect("插入通知配置失败");

            let config: MovementNotificationConfig =
                fetch_movement_notification_config_from_pool(&pool)
                    .await
                    .expect("读取通知配置失败");

            assert_eq!(config.activity_min, 5);
            assert_eq!(config.title, "起来活动");
            assert_eq!(config.sub, "先拉伸两分钟");
            assert_eq!(config.tips, vec![String::from("拉伸颈肩"), String::from("起身走动")]);
            assert_eq!(config.button_text, "好的，我现在去");
            assert_eq!(config.emoji, "🏃");
            assert_eq!(config.countdown_label, "活动时间");
        });
    }
}
