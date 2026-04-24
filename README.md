# NudgeR

NudgeR 是一个基于 `Tauri 2 + React 19 + TypeScript + Rust` 构建的桌面端提醒应用，目标是把「活动提醒」「待办提醒」「托盘常驻」整合成一个低打扰、可持续使用的个人效率工具。

当前仓库已经具备可运行的桌面端基础能力，包括本地数据库、托盘交互、系统通知、活动提醒计时和待办管理；README 下面会按“已实现 / 规划中”拆开说明，避免和代码状态不一致。

## 功能概览

### 已实现

- 活动提醒
  - 支持设置提醒间隔、活动时长
  - 支持开始提醒、停止提醒、重置计时
  - 支持工作中 / 休息中状态切换
  - 休息状态可设置“休息到几点”后自动恢复
  - 后台循环定时检查，并在提醒触发时打开通知窗口
- 空闲检测
  - 当前在 macOS 下支持系统空闲时长检测
  - 用户长时间未操作时，会自动暂停当前提醒倒计时
  - 恢复操作后重新开始计时，避免无效提醒
- Todo 管理
  - 新建、编辑、完成、删除待办
  - 支持标题、提醒时间、正文内容
  - 正文使用富文本编辑器，支持基础格式
  - 支持搜索、按完成状态分组查看
  - 到点后后台自动触发待办通知
- 托盘能力
  - 应用可通过托盘交互展示主窗口或托盘详情页
  - 托盘详情页可查看活动提醒状态和待办摘要
  - 关闭主窗口时转为隐藏，而不是直接退出应用
- 本地持久化
  - 用户设置、活动提醒配置、Todo 数据写入本地 SQLite
  - 启动时自动初始化数据库并恢复状态
- 界面体验
  - 内置亮色 / 暗色主题
  - 采用 Ant Design 组件体系
  - 使用独立通知页、托盘详情页和主窗口多视图组织界面

### 规划中

- 更多提醒类型
- 更完整的跨平台空闲检测支持
- 提醒策略和文案可配置化
- 更丰富的托盘快捷操作
- 发布打包与安装分发流程优化

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 桌面壳 | Tauri 2 |
| 前端 | React 19 + TypeScript + Vite |
| UI | Ant Design 6 |
| 富文本 | Tiptap |
| 后端 | Rust |
| 数据库 | SQLite |
| 前后端通信 | Tauri `invoke` / event |

## 项目结构

```text
nudge-r/
├── src/                 # React 前端
│   ├── app/             # 应用入口与主题装配
│   ├── features/        # 业务模块：movement / todo / reminders / notification / tray
│   ├── layout/          # 主界面布局与导航
│   ├── core/            # Tauri invoke 封装
│   ├── constants/       # 常量与枚举
│   └── utils/           # 计时、消息等工具
├── src-tauri/           # Rust / Tauri 端
│   ├── src/commands/    # Tauri 命令
│   ├── src/background.rs# 后台轮询与提醒调度
│   ├── src/tray.rs      # 托盘窗口与托盘事件
│   └── src/db.rs        # 数据库初始化
├── PROJECT_OVERVIEW.md  # 代码结构说明
└── README.md
```

## 开发脚本

当前 `package.json` 中可直接使用的脚本如下：

| 脚本 | 说明 |
| --- | --- |
| `pnpm dev` | 启动前端 Vite 开发服务 |
| `pnpm tauri` | 启动 Tauri 桌面开发模式 |
| `pnpm build` | 构建桌面应用产物 |
| `pnpm preview` | 本地预览前端构建结果 |
| `pnpm lint` | 检查 `src` 下的 `ts/tsx` 代码 |
| `pnpm lint:fix` | 自动修复可处理的 ESLint 问题 |
| `pnpm prepare` | 初始化 Husky |
| `pnpm delete:db` | 删除本机应用数据库目录（当前脚本针对 macOS） |

如果你更习惯 `npm`，也可以执行等价命令，例如 `npm run tauri`、`npm run lint`。

## 快速开始

### 1. 环境准备

需要先安装：

- Node.js
- pnpm
- Rust toolchain
- Tauri 2 所需的系统依赖

macOS 下通常还需要安装 Xcode Command Line Tools。

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动桌面开发模式

```bash
pnpm tauri
```

这条命令会先启动前端开发服务，再由 Tauri 拉起桌面应用。

### 4. 只调前端页面

```bash
pnpm dev
```

如果只想看前端静态页面或做样式调试，可以单独启动 Vite。

### 5. 构建应用

```bash
pnpm build
```

构建时会同时打包前端资源和 Tauri 桌面应用。

## 数据与运行机制

- 应用启动后会初始化本地 SQLite 数据库
- Rust 后台任务会持续轮询活动提醒与 Todo 提醒状态
- 活动提醒配置变化后，会同步刷新托盘摘要
- Todo 到达提醒时间后，会触发系统通知并标记提醒状态
- 主窗口关闭时默认隐藏到托盘，退出需通过托盘或应用内部逻辑触发

## 当前状态说明

这个仓库已经不是一个纯概念原型，而是有完整运行链路的桌面应用雏形。相对成熟的部分是：

- 活动提醒基础闭环
- Todo 本地存储与提醒
- 托盘详情页与主窗口切换
- 前后端状态同步

仍在持续补齐的部分主要是：

- 更多提醒场景
- 跨平台细节打磨
- 发布与安装体验

## 代码检查

```bash
pnpm lint
```

如果需要顺手修复一部分问题：

```bash
pnpm lint:fix
```

Rust 侧目前仓库中带有部分单元测试，前端尚未接入完整测试框架。

## 相关文件

- `PROJECT_OVERVIEW.md`：更详细的代码结构导览
- `src/core/invoke.ts`：前端调用 Rust 命令的入口
- `src-tauri/src/background.rs`：活动提醒与 Todo 提醒后台调度
- `src-tauri/src/tray.rs`：托盘行为与托盘详情页逻辑

## Roadmap

- [x] 本地 SQLite 存储接入
- [x] 活动提醒基础配置与后台计时
- [x] Todo 管理与提醒通知
- [x] 托盘详情页与主窗口联动
- [ ] 更多提醒类型
- [ ] 更完整的跨平台兼容性支持
- [ ] 打包发布与安装体验完善
