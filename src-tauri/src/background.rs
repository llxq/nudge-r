use crate::commands::notice::notice;
use crate::log::debug_log;
use crate::{
    commands::notice::open_notice_window,
    db::{
        sql::{sys_movement_config, user_todo},
        DbState,
    },
    error::Result,
    log::info_log,
};
use serde::Serialize;
use sqlx::{FromRow, SqlitePool};
use std::{
    process::Command,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tauri::{async_runtime, AppHandle, Emitter, Manager, Runtime};
use tokio::time::interval;
// 导入 tokio 的时间库

const POLL_INTERVAL: Duration = Duration::from_secs(1);

#[derive(Debug, FromRow)]
struct MovementConfigSnapshot {
    interval_min: i64,
    activity_min: i64,
    is_working: i64,
    active: i64,
    start_time: Option<i64>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct MovementTimerEvent {
    reason: &'static str,
    start_time: Option<i64>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TodoRemindedEvent {
    id: i64,
}

pub fn start_background<R: Runtime>(app: AppHandle<R>) {
    let movement_app = app.clone();
    async_runtime::spawn(async move {
        run_movement_loop(movement_app).await;
    });
    async_runtime::spawn(async move {
        run_check_todo_remind(app).await;
    });
}

async fn run_movement_loop<R: Runtime>(app: AppHandle<R>) {
    let mut waiting_for_resume = false;
    let mut interval = interval(POLL_INTERVAL);

    info_log("活动提醒后台循环已启动");

    loop {
        let config = match fetch_movement_config(&app).await {
            Ok(config) => config,
            Err(err) => {
                info_log(&format!("读取活动提醒配置失败: {}", err));
                interval.tick().await;
                continue;
            }
        };

        if config.active == 0 {
            waiting_for_resume = false;
            interval.tick().await;
            continue;
        }

        if config.is_working == 0 {
            waiting_for_resume = false;
            interval.tick().await;
            continue;
        }

        let idle_limit_ms = config.activity_min * 60 * 1000;
        let interval_ms = config.interval_min * 60 * 1000;

        if let Some(idle_ms) = current_idle_millis() {
            if idle_ms >= idle_limit_ms {
                if config.start_time.is_some() {
                    if let Err(err) = persist_start_time(&app, None).await {
                        info_log(&format!("清空 start_time 失败: {}", err));
                    } else {
                        waiting_for_resume = true;
                        if let Err(err) = emit_timer_event(&app, "idle-reset", None) {
                            info_log(&format!("发送倒计时重置事件失败: {}", err));
                        }
                        info_log("用户长时间未操作，暂停活动提醒倒计时");
                    }
                }
                interval.tick().await;
                continue;
            }
        }

        let now = current_timestamp_millis();
        let start_time = match config.start_time {
            Some(start_time) => {
                waiting_for_resume = false;
                start_time
            }
            None => {
                if let Err(err) = persist_start_time(&app, Some(now)).await {
                    info_log(&format!("初始化 start_time 失败: {}", err));
                } else {
                    let reason = if waiting_for_resume { "resume" } else { "start" };
                    waiting_for_resume = false;
                    if let Err(err) = emit_timer_event(&app, reason, Some(now)) {
                        info_log(&format!("发送倒计时启动事件失败: {}", err));
                    }
                    if reason == "resume" {
                        info_log("检测到用户恢复操作，重新开始活动提醒倒计时");
                    }
                }
                interval.tick().await;
                continue;
            }
        };

        if now - start_time >= interval_ms {
            if let Err(err) = open_notice_window(app.clone()) {
                info_log(&format!("发送活动提醒通知失败: {}", err));
            }

            let next_start_time = current_timestamp_millis();
            if let Err(err) = persist_start_time(&app, Some(next_start_time)).await {
                info_log(&format!("更新 start_time 失败: {}", err));
            } else {
                if let Err(err) = emit_timer_event(&app, "restart", Some(next_start_time)) {
                    info_log(&format!("发送倒计时重启事件失败: {}", err));
                }
                info_log("活动提醒已发送，开始下一轮倒计时");
            }
        }

        interval.tick().await;
    }
}

async fn fetch_movement_config<R: Runtime>(app: &AppHandle<R>) -> Result<MovementConfigSnapshot> {
    let pool = app.state::<DbState>().pool.clone();
    fetch_movement_config_from_pool(&pool).await
}

async fn fetch_movement_config_from_pool(pool: &SqlitePool) -> Result<MovementConfigSnapshot> {
    sqlx::query_as::<_, MovementConfigSnapshot>(sys_movement_config::SELECT)
        .fetch_one(pool)
        .await
        .map_err(Into::into)
}

async fn persist_start_time<R: Runtime>(
    app: &AppHandle<R>,
    start_time: Option<i64>,
) -> Result<()> {
    let pool = app.state::<DbState>().pool.clone();
    update_start_time(&pool, start_time).await
}

async fn update_start_time(pool: &SqlitePool, start_time: Option<i64>) -> Result<()> {
    sqlx::query(sys_movement_config::UPDATE_START_TIME)
        .bind(start_time)
        .execute(pool)
        .await?;
    Ok(())
}

fn emit_timer_event<R: Runtime>(
    app: &AppHandle<R>,
    reason: &'static str,
    start_time: Option<i64>,
) -> Result<()> {
    app.emit(
        "movement-timer-reset",
        MovementTimerEvent { reason, start_time },
    )?;
    Ok(())
}
// 获取当前时间戳
fn current_timestamp_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system time before unix epoch")
        .as_millis() as i64
}

#[cfg(target_os = "macos")]
fn current_idle_millis() -> Option<i64> {
    // macOS 下通过 IOHIDSystem 的 HIDIdleTime 读取系统空闲时长，单位是纳秒。
    let output = Command::new("ioreg")
        .args(["-c", "IOHIDSystem"])
        .output()
        .ok()?;
    let stdout = String::from_utf8(output.stdout).ok()?;
    let idle_line = stdout.lines().find(|line| line.contains("HIDIdleTime"))?;
    let nanos = idle_line
        .chars()
        .filter(|ch| ch.is_ascii_digit())
        .collect::<String>()
        .parse::<u128>()
        .ok()?;
    Some((nanos / 1_000_000) as i64)
}

#[cfg(not(target_os = "macos"))]
fn current_idle_millis() -> Option<i64> {
    None
}

#[cfg(test)]
mod tests {
    use super::{fetch_movement_config_from_pool, update_start_time, MovementConfigSnapshot};
    use sqlx::sqlite::SqlitePoolOptions;

    /**
     * 活动提醒配置应能从数据库正确读取，并支持更新 start_time
     */
    #[test]
    fn movement_config_round_trip_start_time() {
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
                    start_time INTEGER
                )
                "#,
            )
            .execute(&pool)
            .await
            .expect("创建 sys_movement_config 失败");

            sqlx::query(
                r#"
                INSERT INTO sys_movement_config (id, interval_min, activity_min, is_working, active, start_time)
                VALUES (1, 30, 5, 1, 1, NULL)
                "#,
            )
            .execute(&pool)
            .await
            .expect("插入默认配置失败");

            let initial_config: MovementConfigSnapshot = fetch_movement_config_from_pool(&pool)
                .await
                .expect("首次读取配置失败");
            assert_eq!(initial_config.start_time, None);

            update_start_time(&pool, Some(123_456))
                .await
                .expect("更新 start_time 失败");

            let updated_config: MovementConfigSnapshot = fetch_movement_config_from_pool(&pool)
                .await
                .expect("二次读取配置失败");
            assert_eq!(updated_config.start_time, Some(123_456));
        });
    }
}

#[derive(Debug, FromRow)]
struct UserTodoRow {
    id: i64,
    title: String,
    body: Option<String>,
}

async fn run_check_todo_remind<R: Runtime>(app: AppHandle<R>) {
    let mut interval = interval(POLL_INTERVAL);

    loop {
        let state = app.state::<DbState>();
        match sqlx::query_as::<_, UserTodoRow>(user_todo::SELECT_NOT_DONE_AND_NOT_REMIND)
            .bind(current_timestamp_millis())
            .fetch_all(&state.pool)
            .await
        {
            Ok(rows) => {
                for row in rows {
                    if let Err(err) = notice(
                        app.clone(),
                        Some(row.title.as_str()),
                        row.body.as_deref().unwrap_or(row.title.as_str()),
                    ) {
                        info_log(&format!("发送待办提醒失败(id={}): {}", row.id, err));
                        continue;
                    }

                    if let Err(err) = sqlx::query(user_todo::UPDATE_IS_REMIND)
                        .bind(1)
                        .bind(row.id)
                        .execute(&state.pool)
                        .await
                    {
                        info_log(&format!("更新待办提醒状态失败(id={}): {}", row.id, err));
                        continue;
                    }

                    let _ = app.emit("todo-reminded", TodoRemindedEvent { id: row.id });
                    let _ = crate::tray::refresh_tray_menu(&app).await;
                    debug_log(row.title.as_str());
                }
            }
            Err(err) => {
                info_log(&format!("查询待办提醒失败: {}", err));
            }
        }

        interval.tick().await;
    }
}
