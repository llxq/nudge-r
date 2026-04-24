use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),

  #[error("tauri error: {0}")]
  TauriError(#[from] tauri::Error),

  // 添加这一行！
  #[error("通知插件错误: {0}")]
  NotificationError(#[from] tauri_plugin_notification::Error),

  #[error("数据库错误: {0}")]
  SqlxError(#[from] sqlx::Error),

  #[error("JSON 解析错误: {0}")]
  SerdeJsonError(#[from] serde_json::Error),
}

/// 让 Error 可以被 Tauri command 序列化返回给前端
impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_str())
    }
}

pub type Result<T> = std::result::Result<T, Error>;
