use crate::{
  db::{sql::{sys_movement_config, user_todo}, DbState},
  error::Result,
};
use serde::Serialize;
use sqlx::FromRow;
use std::sync::atomic::{AtomicBool, AtomicI64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use tauri::{
  Monitor,
  Rect,
  Size,
  tray::{MouseButtonState, TrayIconEvent},
  ActivationPolicy,
  AppHandle,
  Emitter,
  Listener,
  Manager,
  PhysicalPosition,
  Position,
  Runtime,
  WebviewUrl,
  WebviewWindow,
  WebviewWindowBuilder,
  Window,
  WindowEvent,
};

/**
 * 托盘图标 id
 */
const TRAY_ID: &str = "main_tray";

/**
 * 托盘详情窗口标签
 */
const TRAY_DETAIL_WINDOW_LABEL: &str = "tray_detail";

/**
 * 托盘详情窗口宽度
 */
const TRAY_DETAIL_WINDOW_WIDTH: f64 = 320.0;

/**
 * 托盘详情窗口高度
 */
const TRAY_DETAIL_WINDOW_HEIGHT: f64 = 500.0;

/**
 * 托盘详情窗口与图标的垂直间距
 */
const TRAY_DETAIL_WINDOW_GAP: f64 = 12.0;

/**
 * 托盘待办预览数量上限
 */
const TRAY_TODO_PREVIEW_LIMIT: usize = 5;

/**
 * 主窗口标签
 */
const MAIN_WINDOW_LABEL: &str = "main";

/**
 * 托盘详情更新事件
 */
const TRAY_DETAIL_UPDATED_EVENT: &str = "tray-detail-updated";
const TRAY_DETAIL_READY_EVENT: &str = "tray-detail-ready";

/**
 * 应用退出状态
 */
pub struct AppExitState {
  quitting: AtomicBool,
  suppress_tray_detail_blur_until: AtomicI64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum TrayClickAction {
  ShowMainWindow,
  ShowTrayDetail,
}

#[derive(Debug, Clone, Copy)]
struct TrayMonitorBounds {
  monitor_left: f64,
  monitor_top: f64,
  monitor_right: f64,
  monitor_bottom: f64,
  work_left: f64,
  work_top: f64,
  work_right: f64,
  work_bottom: f64,
}

#[derive(Debug, FromRow)]
struct TrayMovementSnapshotRow {
  interval_min: i64,
  is_working: i64,
  active: i64,
  start_time: Option<i64>,
}

#[derive(Debug, FromRow)]
struct TrayTodoRow {
  title: String,
  is_remind: i64,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TrayDetailMovementState {
  status_text: String,
  interval_min: i64,
  is_working: bool,
  active: bool,
  start_time: Option<i64>,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TrayDetailTodoItem {
  title: String,
  is_remind: bool,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TrayDetailSnapshot {
  movement: TrayDetailMovementState,
  todos: Vec<TrayDetailTodoItem>,
  reminded_count: usize,
  overflow_count: usize,
}

/**
 * 初始化托盘
 */
pub fn setup_tray(app: &mut tauri::App) -> tauri::Result<()> {
  let tray_icon = app.default_window_icon().cloned();

  tauri::tray::TrayIconBuilder::with_id(TRAY_ID)
    .show_menu_on_left_click(false)
    .icon(tray_icon.expect("默认应用图标不存在"))
    .build(app)?;

  app.manage(AppExitState {
    quitting: AtomicBool::new(false),
    suppress_tray_detail_blur_until: AtomicI64::new(0),
  });

  Ok(())
}

/**
 * 处理菜单点击事件
 */
pub fn handle_menu_event(_: &AppHandle, _: tauri::menu::MenuEvent) {}

/**
 * 处理托盘点击事件，统一切换自定义详情窗
 */
pub fn handle_tray_event(app: &AppHandle, event: TrayIconEvent) {
  if let Some(tray_rect) = resolve_tray_click_rect(&event) {
    let _ = handle_tray_click(app, tray_rect);
  }
}

/**
 * 处理窗口关闭与失焦事件
 */
pub fn handle_window_event(window: &Window, event: &WindowEvent) {
  match window.label() {
    MAIN_WINDOW_LABEL => {
      if let WindowEvent::CloseRequested { api, .. } = event {
        if let Some(exit_state) = window.try_state::<AppExitState>() {
          if exit_state.quitting.load(Ordering::SeqCst) {
            return;
          }
        }

        api.prevent_close();
        let _ = window.hide();
        set_dock_visibility(&window.app_handle(), false);
      }
    }
    TRAY_DETAIL_WINDOW_LABEL => {
      if let WindowEvent::Focused(false) = event {
        if let Some(exit_state) = window.try_state::<AppExitState>() {
          if current_timestamp_millis() <= exit_state.suppress_tray_detail_blur_until.load(Ordering::SeqCst) {
            return;
          }
        }
        let _ = window.close();
      }
    }
    _ => {}
  }
}

/**
 * 托盘详情页读取当前快照
 */
#[tauri::command]
pub async fn get_tray_detail_snapshot<R: Runtime>(
  app: AppHandle<R>,
) -> Result<TrayDetailSnapshot> {
  fetch_tray_snapshot(&app).await
}

/**
 * 托盘详情页打开主窗口
 */
#[tauri::command]
pub fn show_main_window_from_tray<R: Runtime>(app: AppHandle<R>) -> Result<()> {
  show_main_window(&app)?;
  if let Some(window) = app.get_webview_window(TRAY_DETAIL_WINDOW_LABEL) {
    window.close()?;
  }
  Ok(())
}

/**
 * 托盘详情页退出应用
 */
#[tauri::command]
pub fn quit_app<R: Runtime>(app: AppHandle<R>) -> Result<()> {
  if let Some(exit_state) = app.try_state::<AppExitState>() {
    exit_state.quitting.store(true, Ordering::SeqCst);
  }
  app.exit(0);
  Ok(())
}

/**
 * 刷新托盘详情快照，并向详情页广播
 */
pub async fn refresh_tray_menu<R: Runtime>(app: &AppHandle<R>) -> Result<()> {
  let snapshot = fetch_tray_snapshot(app).await?;
  app.emit(TRAY_DETAIL_UPDATED_EVENT, snapshot)?;
  Ok(())
}

/**
 * 显示并聚焦主窗口
 */
fn show_main_window<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
  if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
    set_dock_visibility(app, true);
    window.show()?;
    window.unminimize()?;
    window.set_focus()?;
  }

  Ok(())
}

/**
 * 根据托盘点击切换详情窗口
 */
fn toggle_tray_detail_window(
  app: &AppHandle,
  tray_rect: Rect,
) -> tauri::Result<()> {
  set_dock_visibility(app, false);

  if let Some(exit_state) = app.try_state::<AppExitState>() {
    exit_state
      .suppress_tray_detail_blur_until
      .store(current_timestamp_millis() + 300, Ordering::SeqCst);
  }

  if let Some(window) = app.get_webview_window(TRAY_DETAIL_WINDOW_LABEL) {
    position_tray_detail_window(app, &window, tray_rect)?;
    window.show()?;
    window.set_focus()?;
    return Ok(());
  }

  let window = WebviewWindowBuilder::new(
    app,
    TRAY_DETAIL_WINDOW_LABEL,
    WebviewUrl::App("index.html?page=tray-detail".into()),
  )
  .title("托盘详情")
  .inner_size(TRAY_DETAIL_WINDOW_WIDTH, TRAY_DETAIL_WINDOW_HEIGHT)
  .resizable(false)
  .maximizable(false)
  .minimizable(false)
  .closable(true)
  .decorations(false)
  .always_on_top(true)
  .skip_taskbar(true)
  .visible(false)
  .build()?;

  position_tray_detail_window(app, &window, tray_rect)?;
  let app_handle = app.clone();
  let window_label = String::from(TRAY_DETAIL_WINDOW_LABEL);
  app.once(TRAY_DETAIL_READY_EVENT, move |_| {
    if let Some(window) = app_handle.get_webview_window(&window_label) {
      let _ = position_tray_detail_window(&app_handle, &window, tray_rect);
      let _ = window.show();
      let _ = window.set_focus();
    }
  });

  Ok(())
}

/**
 * 托盘点击时按主窗口状态决定展示主窗口或托盘详情
 */
fn handle_tray_click(app: &AppHandle, tray_rect: Rect) -> tauri::Result<()> {
  match resolve_tray_click_action_from_app(app) {
    TrayClickAction::ShowMainWindow => {
      if let Some(window) = app.get_webview_window(TRAY_DETAIL_WINDOW_LABEL) {
        let _ = window.close();
      }
      show_main_window(app)
    }
    TrayClickAction::ShowTrayDetail => toggle_tray_detail_window(app, tray_rect),
  }
}

/**
 * 解析托盘点击位置，统一用鼠标抬起时展开详情窗
 */
fn resolve_tray_click_rect(event: &TrayIconEvent) -> Option<Rect> {
  match event {
    TrayIconEvent::Click {
      rect,
      button_state: MouseButtonState::Up,
      ..
    } => Some(*rect),
    _ => None,
  }
}

fn resolve_tray_click_action_from_app(app: &AppHandle) -> TrayClickAction {
  let Some(main_window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
    return TrayClickAction::ShowTrayDetail;
  };

  let is_visible = main_window.is_visible().unwrap_or(false);
  let is_minimized = main_window.is_minimized().unwrap_or(false);

  resolve_tray_click_action(is_visible, is_minimized)
}

fn resolve_tray_click_action(
  is_main_window_visible: bool,
  is_main_window_minimized: bool,
) -> TrayClickAction {
  if is_main_window_visible || is_main_window_minimized {
    TrayClickAction::ShowMainWindow
  } else {
    TrayClickAction::ShowTrayDetail
  }
}

/**
 * 详情窗口定位到托盘图标附近
 */
fn position_tray_detail_window<R: Runtime>(
  app: &AppHandle<R>,
  window: &WebviewWindow<R>,
  tray_rect: Rect,
) -> tauri::Result<()> {
  let monitors = app.available_monitors()?;
  let position = compute_tray_detail_window_position(tray_rect, &monitors);

  window.set_position(Position::Physical(position))
}

fn compute_tray_detail_window_position(
  tray_rect: Rect,
  monitors: &[Monitor],
) -> PhysicalPosition<i32> {
  let monitor_bounds = monitors
    .iter()
    .map(build_tray_monitor_bounds)
    .collect::<Vec<_>>();

  compute_tray_detail_window_position_with_monitor_bounds(tray_rect, &monitor_bounds)
}

fn compute_tray_detail_window_position_with_monitor_bounds(
  tray_rect: Rect,
  monitor_bounds: &[TrayMonitorBounds],
) -> PhysicalPosition<i32> {
  let (tray_x, tray_y) = match tray_rect.position {
    Position::Physical(position) => (f64::from(position.x), f64::from(position.y)),
    Position::Logical(position) => (position.x, position.y),
  };
  let (tray_width, tray_height) = match tray_rect.size {
    Size::Physical(size) => (f64::from(size.width), f64::from(size.height)),
    Size::Logical(size) => (size.width, size.height),
  };

  let tray_center_x = tray_x + (tray_width / 2.0);
  let tray_center = (tray_center_x, tray_y + (tray_height / 2.0));
  let below_y = tray_y + tray_height + TRAY_DETAIL_WINDOW_GAP;
  let above_y = tray_y - TRAY_DETAIL_WINDOW_HEIGHT - TRAY_DETAIL_WINDOW_GAP;

  let x = tray_center_x - (TRAY_DETAIL_WINDOW_WIDTH / 2.0);
  let (x, y) = match find_monitor_bounds_for_tray_center(tray_center, &monitor_bounds) {
    Some(bounds) => clamp_tray_detail_position_to_monitor(x, below_y, above_y, bounds),
    None => (x, below_y),
  };

  PhysicalPosition::new(x.round() as i32, y.round() as i32)
}

fn find_monitor_bounds_for_tray_center<'a>(
  tray_center: (f64, f64),
  monitor_bounds: &'a [TrayMonitorBounds],
) -> Option<&'a TrayMonitorBounds> {
  monitor_bounds
    .iter()
    .find(|bounds| is_point_in_monitor_bounds(tray_center, bounds))
    .or_else(|| {
      monitor_bounds.iter().min_by(|left, right| {
        squared_distance_to_monitor_bounds(tray_center, left)
          .total_cmp(&squared_distance_to_monitor_bounds(tray_center, right))
      })
    })
}

fn build_tray_monitor_bounds(monitor: &Monitor) -> TrayMonitorBounds {
  let position = monitor.position();
  let size = monitor.size();
  let work_area = monitor.work_area();

  TrayMonitorBounds {
    monitor_left: f64::from(position.x),
    monitor_top: f64::from(position.y),
    monitor_right: f64::from(position.x) + f64::from(size.width),
    monitor_bottom: f64::from(position.y) + f64::from(size.height),
    work_left: f64::from(work_area.position.x),
    work_top: f64::from(work_area.position.y),
    work_right: f64::from(work_area.position.x) + f64::from(work_area.size.width),
    work_bottom: f64::from(work_area.position.y) + f64::from(work_area.size.height),
  }
}

fn is_point_in_monitor_bounds(point: (f64, f64), bounds: &TrayMonitorBounds) -> bool {
  point.0 >= bounds.monitor_left
    && point.0 <= bounds.monitor_right
    && point.1 >= bounds.monitor_top
    && point.1 <= bounds.monitor_bottom
}

fn squared_distance_to_monitor_bounds(point: (f64, f64), bounds: &TrayMonitorBounds) -> f64 {
  let dx = if point.0 < bounds.monitor_left {
    bounds.monitor_left - point.0
  } else if point.0 > bounds.monitor_right {
    point.0 - bounds.monitor_right
  } else {
    0.0
  };
  let dy = if point.1 < bounds.monitor_top {
    bounds.monitor_top - point.1
  } else if point.1 > bounds.monitor_bottom {
    point.1 - bounds.monitor_bottom
  } else {
    0.0
  };

  (dx * dx) + (dy * dy)
}

fn clamp_tray_detail_position_to_monitor(
  preferred_x: f64,
  preferred_below_y: f64,
  preferred_above_y: f64,
  bounds: &TrayMonitorBounds,
) -> (f64, f64) {
  let max_x = (bounds.work_right - TRAY_DETAIL_WINDOW_WIDTH).max(bounds.work_left);
  let clamped_x = preferred_x.clamp(bounds.work_left, max_x);

  let fits_below = preferred_below_y + TRAY_DETAIL_WINDOW_HEIGHT <= bounds.work_bottom;
  let y = if fits_below {
    preferred_below_y.max(bounds.work_top)
  } else {
    preferred_above_y.max(bounds.work_top)
  };

  (clamped_x, y)
}

/**
 * 从数据库生成托盘详情快照
 */
async fn fetch_tray_snapshot<R: Runtime>(app: &AppHandle<R>) -> Result<TrayDetailSnapshot> {
  let pool = app.state::<DbState>().pool.clone();

  let movement = sqlx::query_as::<_, TrayMovementSnapshotRow>(sys_movement_config::SELECT)
    .fetch_one(&pool)
    .await?;
  let todos = sqlx::query_as::<_, TrayTodoRow>(user_todo::SELECT_NOT_DONE)
    .fetch_all(&pool)
    .await?;

  Ok(build_tray_detail_snapshot(&movement, &todos, current_timestamp_millis()))
}

/**
 * 组装托盘详情快照
 */
fn build_tray_detail_snapshot(
  movement: &TrayMovementSnapshotRow,
  todos: &[TrayTodoRow],
  now: i64,
) -> TrayDetailSnapshot {
  TrayDetailSnapshot {
    movement: TrayDetailMovementState {
      status_text: format_movement_status_label(movement, now),
      interval_min: movement.interval_min,
      is_working: movement.is_working != 0,
      active: movement.active != 0,
      start_time: movement.start_time,
    },
    todos: todos
      .iter()
      .take(TRAY_TODO_PREVIEW_LIMIT)
      .map(|todo| TrayDetailTodoItem {
        title: todo.title.clone(),
        is_remind: todo.is_remind != 0,
      })
      .collect(),
    reminded_count: todos.iter().filter(|todo| todo.is_remind != 0).count(),
    overflow_count: todos.len().saturating_sub(TRAY_TODO_PREVIEW_LIMIT),
  }
}

/**
 * 生成活动提醒状态文案
 */
fn format_movement_status_label(movement: &TrayMovementSnapshotRow, now: i64) -> String {
  if movement.active == 0 {
    return String::from("活动提醒未开启");
  }

  if movement.is_working == 0 {
    return String::from("当前处于休息中");
  }

  let Some(start_time) = movement.start_time else {
    return String::from("等待恢复操作后重新开始计时");
  };

  let total_seconds = movement.interval_min.max(0) * 60;
  let elapsed_seconds = ((now - start_time).max(0) / 1000).min(total_seconds);
  let remaining_seconds = total_seconds.saturating_sub(elapsed_seconds);

  format!("距离下次提醒还有 {}", format_seconds_as_clock(remaining_seconds))
}

/**
 * 秒数格式化为 mm:ss
 */
fn format_seconds_as_clock(total_seconds: i64) -> String {
  let minutes = total_seconds / 60;
  let seconds = total_seconds % 60;
  format!("{minutes:02}:{seconds:02}")
}

/**
 * 获取当前时间戳
 */
fn current_timestamp_millis() -> i64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .expect("system time before unix epoch")
    .as_millis() as i64
}

/**
 * 同步 macOS Dock 图标显示状态
 */
#[cfg(target_os = "macos")]
fn set_dock_visibility<R: Runtime>(app: &AppHandle<R>, visible: bool) {
  let activation_policy = if visible {
    ActivationPolicy::Regular
  } else {
    ActivationPolicy::Accessory
  };

  let _ = app.set_activation_policy(activation_policy);
}

/**
 * 非 macOS 平台忽略 Dock 状态切换
 */
#[cfg(not(target_os = "macos"))]
fn set_dock_visibility<R: Runtime>(_: &AppHandle<R>, _: bool) {}

#[cfg(test)]
mod tests {
  use super::{
    build_tray_detail_snapshot, compute_tray_detail_window_position_with_monitor_bounds,
    resolve_tray_click_action,
    format_movement_status_label, format_seconds_as_clock,
    TrayClickAction, TrayMonitorBounds, TrayMovementSnapshotRow, TrayTodoRow,
    TRAY_TODO_PREVIEW_LIMIT,
  };
  use tauri::{PhysicalPosition, PhysicalSize, Rect};

  /**
   * 倒计时文案应展示剩余时间
   */
  #[test]
  fn movement_status_label_shows_remaining_time() {
    let movement = TrayMovementSnapshotRow {
      interval_min: 30,
      is_working: 1,
      active: 1,
      start_time: Some(60_000),
    };

    let label = format_movement_status_label(&movement, 5 * 60_000);

    assert_eq!(label, "距离下次提醒还有 26:00");
    assert_eq!(format_seconds_as_clock(65), "01:05");
  }

  /**
   * 托盘详情应限制最多展示五条待办并保留溢出数量
   */
  #[test]
  fn tray_snapshot_todo_preview_is_limited() {
    let movement = TrayMovementSnapshotRow {
      interval_min: 30,
      is_working: 1,
      active: 1,
      start_time: Some(0),
    };
    let todos = (1..=7)
      .map(|index| TrayTodoRow {
        title: format!("待办 {index}"),
        is_remind: if index % 2 == 0 { 1 } else { 0 },
      })
      .collect::<Vec<_>>();

    let snapshot = build_tray_detail_snapshot(&movement, &todos, 0);

    assert_eq!(snapshot.todos.len(), TRAY_TODO_PREVIEW_LIMIT);
    assert_eq!(snapshot.todos[0].title, "待办 1");
    assert!(!snapshot.todos[0].is_remind);
    assert_eq!(snapshot.todos[4].title, "待办 5");
    assert!(!snapshot.todos[4].is_remind);
    assert_eq!(snapshot.reminded_count, 3);
    assert_eq!(snapshot.overflow_count, 2);
  }

  /**
   * 多屏场景下应保留副屏负坐标，不能强行夹回主屏
   */
  #[test]
  fn tray_window_position_keeps_negative_monitor_coordinates() {
    let tray_rect = Rect {
      position: PhysicalPosition::new(-1200.0, 40.0).into(),
      size: PhysicalSize::new(20, 20).into(),
    };

    let position = compute_tray_detail_window_position_with_monitor_bounds(tray_rect, &[]);

    assert!(position.x < 0);
    assert_eq!(position.y, 72);
  }

  /**
   * 托盘详情应优先显示在图标下方，若下方放不下则翻到上方
   */
  #[test]
  fn tray_window_position_prefers_below_then_flips_above_within_monitor() {
    let tray_rect = Rect {
      position: PhysicalPosition::new(1450.0, 10.0).into(),
      size: PhysicalSize::new(20, 20).into(),
    };
    let monitor_bounds = vec![TrayMonitorBounds {
      monitor_left: 1280.0,
      monitor_top: 0.0,
      monitor_right: 3008.0,
      monitor_bottom: 1117.0,
      work_left: 1280.0,
      work_top: 24.0,
      work_right: 3008.0,
      work_bottom: 1077.0,
    }];

    let position = compute_tray_detail_window_position_with_monitor_bounds(tray_rect, &monitor_bounds);

    assert_eq!(position.x, 1300);
    assert_eq!(position.y, 42);
  }

  /**
   * 主窗口仍在显示链路中时，托盘点击应回到主窗口
   */
  #[test]
  fn tray_click_action_shows_main_window_when_main_window_is_visible_or_minimized() {
    assert!(matches!(resolve_tray_click_action(true, false), TrayClickAction::ShowMainWindow));
    assert!(matches!(resolve_tray_click_action(false, true), TrayClickAction::ShowMainWindow));
    assert!(matches!(resolve_tray_click_action(false, false), TrayClickAction::ShowTrayDetail));
  }
}
