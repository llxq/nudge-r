use std::collections::HashSet;

use crate::error::Result;
use tauri::{AppHandle, Manager, Runtime, WebviewUrl, WebviewWindowBuilder};
#[cfg(target_os = "macos")]
use tauri::ActivationPolicy;
use tauri_plugin_notification::NotificationExt;

const MAIN_WINDOW_LABEL: &str = "main";

#[tauri::command]
pub fn notice<R: Runtime>(app: AppHandle<R>, title: Option<&str>, message: &str) -> Result<()> {
    let final_title = title.unwrap_or("通知");
    // 将 HTML 转换为纯文本
    let plain_text = html2text::from_read(message.as_bytes(), 80)
        .unwrap_or_else(|_| message.to_string())
        .replace("\r", " ")
        .replace("\n", " ")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ");
    print!("plain_text: {}", plain_text);
    app.notification()
        .builder()
        .title(final_title)
        .body(&plain_text)
        .icon("icons/icon.ico")
        .show()?;
    Ok(())
}

/**
 * 打开通知全屏界面，在每个显示器上各打开一个弹框
 */
#[tauri::command]
pub fn open_notice_window<R: Runtime>(app: AppHandle<R>) -> tauri::Result<()> {
    prepare_notice_app_activation(&app);
    let monitors = app.available_monitors()?;

    // macOS 多屏去重（按 position）
    let mut seen: HashSet<(i32, i32)> = HashSet::new();
    let unique_monitors: Vec<_> = monitors
        .iter()
        .filter(|m| {
            let pos = m.position();
            seen.insert((pos.x, pos.y))
        })
        .collect();

    for (i, monitor) in unique_monitors.iter().enumerate() {
        let label = format!("notification_{}", i);
        let url = WebviewUrl::App(format!("index.html?page=notification&label={}", label).into());

        // 👉 核心修复：直接获取物理坐标和大小，去除多余的 scale 乘法
        let pos = monitor.position();
        let size = monitor.size();

        let webview = WebviewWindowBuilder::new(&app, &label, url)
            .title("通知")
            .decorations(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .resizable(false)
            .maximizable(false)
            .minimizable(false)
            .closable(true)
            .visible(false) // 先不显示
            // 可以在 builder 中直接设置（Tauri v2 支持，v1 可保留你原本的 set 方式）
            .inner_size(size.width as f64, size.height as f64) 
            .position(pos.x as f64, pos.y as f64)
            .build()?;

        // 如果你在用的是 Tauri v1 或者上面 builder 的 position/size 不生效，
        // 使用下面的方式，但必须明确指定是 Physical：
        webview.set_position(tauri::Position::Physical(*pos))?;
        webview.set_size(tauri::Size::Physical(*size))?;

        // 最后再显示（避免闪动）
        webview.show()?;
        webview.set_focus()?;
        webview.set_fullscreen(true)?;
    }

    Ok(())
}

#[tauri::command]
pub fn close_notice_windows<R: Runtime>(app: AppHandle<R>) -> Result<()> {
    let labels =
        collect_notification_window_labels(app.webview_windows().keys().map(String::as_str));

    for label in labels {
        if let Some(window) = app.get_webview_window(&label) {
            window.close()?;
        }
    }

    restore_notice_app_activation(&app);

    Ok(())
}

#[cfg(target_os = "macos")]
fn prepare_notice_app_activation<R: Runtime>(app: &AppHandle<R>) {
    let _ = app.set_activation_policy(ActivationPolicy::Regular);
}

#[cfg(not(target_os = "macos"))]
fn prepare_notice_app_activation<R: Runtime>(_: &AppHandle<R>) {}

#[cfg(target_os = "macos")]
fn restore_notice_app_activation<R: Runtime>(app: &AppHandle<R>) {
    let should_keep_regular = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .map(|window| {
            let is_visible = window.is_visible().unwrap_or(false);
            let is_minimized = window.is_minimized().unwrap_or(false);
            is_visible || is_minimized
        })
        .unwrap_or(false);

    let activation_policy = if should_keep_regular {
        ActivationPolicy::Regular
    } else {
        ActivationPolicy::Accessory
    };

    let _ = app.set_activation_policy(activation_policy);
}

#[cfg(not(target_os = "macos"))]
fn restore_notice_app_activation<R: Runtime>(_: &AppHandle<R>) {}

fn collect_notification_window_labels<'a, I>(labels: I) -> Vec<String>
where
    I: IntoIterator<Item = &'a str>,
{
    labels
        .into_iter()
        .filter(|label| label.starts_with("notification_"))
        .map(str::to_string)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::collect_notification_window_labels;

    /**
     * 应只收集活动提醒全屏窗口标签
     */
    #[test]
    fn collect_notification_window_labels_filters_by_prefix() {
        let labels = vec![
            String::from("main"),
            String::from("notification_0"),
            String::from("notification_1"),
            String::from("todo_notification"),
        ];

        let result = collect_notification_window_labels(labels.iter().map(String::as_str));

        assert_eq!(
            result,
            vec![
                String::from("notification_0"),
                String::from("notification_1")
            ]
        );
    }
}
