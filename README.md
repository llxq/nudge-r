# NudgeR 🦀

> **A gentle, intelligent nudge from Rust.** NudgeR 是一款专为 Windows 和 macOS 设计的轻量级桌面健康与效率助手。它利用 Rust 的极致性能与 Tauri 的灵活性，旨在平衡你的专注工作与身体健康。它不是一个冷冰冰的闹钟，而是一个懂你的“桌面合伙人”。

---

## ✨ 核心功能 (Features)

* **🧘‍♂️ 智能久坐提醒 (Smart Flow Break)**
    * **动态感知**：自动检测系统空闲状态。如果你已经离开座位（无键鼠操作），提醒计时器将自动挂起，避免产生无效骚扰。
    * **柔性提醒**：支持全屏强制休息模式或轻量级通知提醒，确保你记得站起来动动。
* **📝 简约 Todo 调度 (Task Scheduler)**
    * **即时记录**：快速新建、编辑和管理待办事项。
    * **精准触达**：支持为每个任务设置特定提醒时间，确保重要事务从不遗漏。
* **🚀 极致体验 (User Experience)**
    * **托盘化运行**：常驻系统托盘，低存在感，不占用任务栏空间。
    * **原生通知**：调用系统级通知中心，完美适配 macOS 与 Windows 的视觉风格。

---

## 🛠 技术架构 (Technical Stack)

| 组件 | 技术栈                                                                                  |
| :--- |:-------------------------------------------------------------------------------------|
| **核心引擎** | [Rust](https://www.rust-lang.org/) (High performance & Memory safe)                  |
| **GUI 框架** | [Tauri v2](https://v2.tauri.app/) (Lightweight WebView)                              |
| **异步运行** | [Tokio](https://tokio.rs/) (Async runtime)                                           |
| **本地存储** | [SQLite](https://www.sqlite.org/) / [rusqlite](https://github.com/rusqlite/rusqlite) |
| **前端界面** | React + Ang-desgin                                                                   |

---

## 🎯 为什么选择 NudgeR？

1.  **极速启动**：相比 Electron 应用，NudgeR 的安装包体积缩小 90%，内存占用极低。
2.  **智能逻辑**：它知道你在“忙碌”还是在“摸鱼”，只在合适的时机给你一个 Nudge（轻推）。
3.  **隐私优先**：所有数据均本地存储，绝不上传云端，保障你的个人隐私。

---

## 📅 开发计划 (Roadmap)

- [x] 项目概念与架构设计
- [ ] **Phase 1**: 实现基于系统 Idle 时间的久坐检测原型 (Rust 层)
- [ ] **Phase 2**: 构建 SQLite 后端数据模型与 Todo 增删改查 API
- [ ] **Phase 3**: 完成 Tauri 托盘菜单与多窗口逻辑交互
- [ ] **Phase 4**: 跨平台构建与 `.dmg` / `.exe` 打包发布

---

## 🚀 快速开始

### 准备环境
确保你的电脑已安装 Rust 和 Node.js。

### 安装依赖并运行
```bash
# 安装前端依赖
pnpm install

# 启动开发模式
pnpm tauri dev