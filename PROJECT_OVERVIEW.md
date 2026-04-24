# NudgeR 项目文件总览

> NudgeR 是一个基于 **Tauri 2 + React 19 + TypeScript** 构建的桌面端健康提醒应用。前端使用 Vite 开发，UI 组件库为 Ant Design，后端由 Rust（Tauri）驱动。

---

## 目录结构概览

```
nudge-r/
├── index.html                  # HTML 入口
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置（应用代码）
├── tsconfig.node.json          # TypeScript 配置（Node/构建工具）
├── eslint.config.js            # ESLint 配置
├── package.json                # 前端依赖与脚本
├── pnpm-lock.yaml              # pnpm 锁文件
├── .gitignore                  # Git 忽略规则（根目录）
├── .husky/                     # Git hooks
├── .vscode/                    # VSCode 推荐扩展
├── public/
│   └── logo.svg                # 应用 Logo
├── src/                        # 前端源码
│   ├── main.tsx                # React 应用入口
│   ├── global.scss             # 全局样式
│   ├── app/
│   │   ├── App.tsx             # 根组件
│   │   └── App.module.scss     # 根组件样式
│   ├── store/
│   │   └── index.tsx           # 全局状态管理
│   ├── layout/
│   │   ├── SessionList.tsx     # 左侧导航列表
│   │   ├── SessionList.module.scss
│   │   ├── Sidebar.tsx         # 侧边栏（备用/旧版）
│   │   └── Sidebar.module.scss
│   ├── features/
│   │   ├── movement/
│   │   │   ├── MovementPanel.tsx        # 活动提醒面板
│   │   │   └── MovementPanel.module.scss
│   │   ├── todo/
│   │   │   ├── TodoPanel.tsx            # 待办面板
│   │   │   ├── TodoPanel.module.scss
│   │   │   ├── RichEditor.tsx           # 富文本编辑器
│   │   │   └── RichEditor.module.scss
│   │   └── reminders/
│   │       ├── RemindersPanel.tsx       # 更多提醒面板（占位）
│   │       └── RemindersPanel.module.scss
│   ├── constants/
│   │   ├── app.ts              # 应用名称常量
│   │   ├── tabs.tsx            # Tab 路由策略映射
│   │   ├── theme.ts            # 主题 token / CSS 变量
│   │   ├── movement.ts         # 活动提醒区间常量
│   │   └── session.ts          # 导航列表图标色 & 副标题函数
│   ├── core/
│   │   └── invoke.ts           # Tauri invoke 桥接
│   └── types/
│       ├── global.d.ts         # 全局类型声明
│       └── vite-env.d.ts       # Vite 环境变量类型
└── src-tauri/                  # Rust/Tauri 后端
    ├── Cargo.toml              # Rust 包配置
    ├── Cargo.lock              # Rust 依赖锁文件
    ├── build.rs                # Tauri 构建脚本
    ├── tauri.conf.json         # Tauri 应用配置
    ├── capabilities/
    │   └── default.json        # Tauri 权限能力配置
    ├── gen/schemas/            # Tauri 自动生成的 JSON Schema
    ├── icons/                  # 各平台应用图标
    └── src/
        ├── main.rs             # Rust 程序入口
        └── lib.rs              # Tauri 应用逻辑
```

---

## 文件详解

### 根目录配置文件

| 文件 | 说明 |
|------|------|
| `index.html` | Web 入口 HTML，`<div id="root">` 是 React 挂载点，Vite 从这里启动 |
| `package.json` | 项目元信息、npm scripts、前端依赖。核心依赖：React 19、Ant Design 6、Tiptap（富文本）、Tauri API |
| `pnpm-lock.yaml` | pnpm 包管理器的锁文件，确保依赖版本一致，不需手动编辑 |
| `vite.config.ts` | Vite 构建配置。固定端口 1420，过滤 `src-tauri/` 的文件监听，针对平台设置不同构建目标（Windows → chrome105，macOS → safari13） |
| `tsconfig.json` | 前端 TypeScript 配置，`strict` 模式，路径别名等 |
| `tsconfig.node.json` | 专门给 Vite 配置文件（Node 环境）使用的 TypeScript 配置 |
| `eslint.config.js` | ESLint 规则配置，使用 typescript-eslint + eslint-plugin-react-hooks |
| `.gitignore` | 忽略 `node_modules`、`dist`、`src-tauri/target` 等 |
| `.husky/pre-commit` | Git pre-commit hook，提交前自动执行 lint-staged 对暂存的 TS/TSX 文件做 ESLint 修复 |
| `.vscode/extensions.json` | 推荐安装的 VSCode 插件列表 |
| `public/logo.svg` | 应用 Logo SVG，在侧边栏和品牌区域展示 |

---

### `src/` — 前端源码

#### `src/main.tsx` — React 入口
用 `ReactDOM.createRoot` 将 `<App />` 挂载到 `index.html` 的 `#root` 节点，开启 `React.StrictMode`。

#### `src/global.scss` — 全局样式
全局 CSS reset 和基础样式，所有组件共享。

---

#### `src/app/App.tsx` — 根组件

应用的顶层组件，分三层：

1. **`StoreProvider`** — 注入全局状态 Context
2. **`ThemeWrapper`** — 读取当前主题，配置 Ant Design `ConfigProvider`（亮色/暗色算法 + token）
3. **`Shell`** — 实际布局：左侧 `SessionList`（导航） + 右侧动态面板（根据 `state.tab` 从 `TAB_MAP` 查找对应组件渲染）。同时监听主题变化，将 CSS 变量写入 `:root`，确保 Modal 等 Portal 也能读到正确颜色。

---

#### `src/store/index.tsx` — 全局状态

使用 React `useReducer` + Context 实现轻量级状态管理，无需 Redux。

**状态结构：**
- `theme`: `"light" | "dark"` — 主题模式
- `tab`: `"movement" | "todo" | "reminders"` — 当前激活的功能页
- `movement`: `{ intervalMin, isWorking, active }` — 活动提醒状态
- `todos`: `Todo[]` — 待办列表

**支持的 Action：**
- `SET_THEME` / `SET_TAB` — 切换主题/页面
- `MOVEMENT_SET_INTERVAL` / `MOVEMENT_SET_WORKING` / `MOVEMENT_TOGGLE_ACTIVE` — 控制活动提醒
- `TODO_ADD` / `TODO_TOGGLE` / `TODO_EDIT` / `TODO_DELETE` — 待办 CRUD

导出 `useStore()` hook 供所有组件使用。

---

#### `src/layout/SessionList.tsx` — 左侧导航列表

应用左侧的功能模块导航栏，类似聊天应用的会话列表风格：
- 顶部展示品牌 Logo + 应用名 + 亮暗模式切换按钮
- 列表展示三个功能模块（活动提醒、待办、更多提醒），每项有彩色图标、标题、动态副标题
- 点击切换 `state.tab`，高亮当前激活项

#### `src/layout/Sidebar.tsx` — 侧边栏（旧版）
图标式侧边栏组件（紧凑型，只有图标+Tooltip），当前布局已改用 `SessionList`，此文件可能是早期版本遗留。

---

#### `src/features/movement/MovementPanel.tsx` — 活动提醒面板

健康提醒的核心功能页：
- **间隔设置**：通过 `InputNumber` 输入框 + `Slider` 滑块设置提醒间隔（5～180 分钟，步长 5）
- **工作状态**：`Switch` 切换「工作中 / 休息中」状态
- **开始/停止**：按钮控制提醒的激活状态，激活时显示 Badge 状态文字

目前提醒逻辑（定时器触发系统通知）尚未实现，状态已准备好。

#### `src/features/todo/TodoPanel.tsx` — 待办面板

功能完整的待办管理页：
- **搜索**：实时过滤待办标题
- **Tabs 切换**：「待办」和「已完成」两个视图，各自显示数量 Badge
- **新建/编辑**：弹出 Modal，包含标题输入、提醒时间选择（DatePicker）、富文本正文（RichEditor）
- **列表项**：Checkbox 勾选完成、显示提醒时间、富文本预览、编辑/删除操作

#### `src/features/todo/RichEditor.tsx` — 富文本编辑器

基于 **Tiptap** 封装的富文本编辑器组件，支持：
- 加粗、斜体、删除线、行内代码
- 无序/有序列表
- 标题 H1/H2
- 引用块、分割线
- 占位符提示文字
- `readonly` 模式（隐藏工具栏）

输出 HTML 字符串，供 TodoPanel 保存和预览。

#### `src/features/reminders/RemindersPanel.tsx` — 更多提醒面板

占位页面，显示「敬请期待」，功能尚未实现。

---

#### `src/constants/` — 常量层

| 文件 | 内容 |
|------|------|
| `app.ts` | `APP_NAME = "NudgeR"`、`TAB_KEYS` 枚举映射 |
| `tabs.tsx` | `TAB_CONFIGS` 数组 + `TAB_MAP`（Map 结构），将 tab key 映射到对应面板组件，新增功能页只需在此注册 |
| `theme.ts` | Ant Design token 配置（`ANT_BASE_TOKEN`、`ANT_TOKEN_BY_THEME`）和 CSS 自定义变量（`CSS_VARS_BY_THEME`），亮/暗两套完整配色 |
| `movement.ts` | 活动提醒间隔的 `MIN=5`、`MAX=180`、`STEP=5`、`DEFAULT=45`（单位：分钟） |
| `session.ts` | 导航图标背景色 + `movementSubText` / `todoSubText` 函数（生成 SessionList 副标题文案） |

#### `src/core/invoke.ts` — Tauri 桥接

封装 Tauri 的 `invoke` 方法（调用 Rust 后端命令）。目前通过 `window.__TAURI__.core.invoke` 访问，用于前端调用 Rust 函数。

#### `src/types/` — 类型声明

| 文件 | 内容 |
|------|------|
| `global.d.ts` | 全局类型声明，扩展 `window.__TAURI__` 等全局对象类型 |
| `vite-env.d.ts` | Vite 环境变量（`import.meta.env`）的 TypeScript 类型声明 |

---

### `src-tauri/` — Rust/Tauri 后端

#### `src-tauri/src/main.rs` — Rust 入口

程序入口，仅一行：调用 `nudge_r_lib::run()`。`#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` 确保 Windows release 包不弹出控制台窗口。

#### `src-tauri/src/lib.rs` — Tauri 应用逻辑

Tauri 应用的核心初始化：
- 注册 `tauri-plugin-opener`（用于打开外部链接/文件）
- 注册 Rust 命令 `greet`（示例命令，返回问候字符串，可被前端 `invoke('greet', { name })` 调用）
- `run()` 启动 Tauri 事件循环

#### `src-tauri/build.rs` — 构建脚本

Rust 构建时调用 `tauri_build::build()`，生成 Tauri 所需的元数据（图标、权限 schema 等）。

#### `src-tauri/Cargo.toml` — Rust 包配置

定义 Rust 包名 `nudge-r`，依赖：
- `tauri 2` — 桌面应用框架
- `tauri-plugin-opener 2` — 打开 URL/文件插件
- `serde` + `serde_json` — JSON 序列化（前后端数据交换）

lib 编译为 `staticlib + cdylib + rlib` 三种格式，兼容 Windows 的特殊要求。

#### `src-tauri/tauri.conf.json` — Tauri 应用配置

| 配置项 | 值 | 说明 |
|--------|----|------|
| `productName` | `NudgeR` | 应用名称 |
| `identifier` | `com.chendf.nudge-r` | 应用唯一标识符 |
| `beforeDevCommand` | `pnpm dev` | 开发时先启动 Vite |
| `devUrl` | `http://localhost:1420` | Tauri WebView 加载的前端地址 |
| `beforeBuildCommand` | `pnpm build` | 构建时先打包前端 |
| `frontendDist` | `../dist` | 前端构建产物目录 |
| 窗口尺寸 | 800 × 600 | 默认窗口大小 |
| `bundle.targets` | `all` | 打包所有平台格式 |

#### `src-tauri/capabilities/default.json` — 权限配置

定义主窗口（`main`）的权限能力：
- `core:default` — Tauri 核心默认权限
- `opener:default` — opener 插件默认权限

#### `src-tauri/gen/schemas/` — 自动生成文件

Tauri 构建时自动生成的 JSON Schema 文件，用于验证配置文件格式，不需手动编辑。

#### `src-tauri/icons/` — 应用图标

各平台所需图标文件：
- `32x32.png`、`128x128.png`、`128x128@2x.png` — Linux/通用
- `icon.icns` — macOS
- `icon.ico` — Windows
- `Square*Logo.png`、`StoreLogo.png` — Windows Store / UWP 格式

---

## 如何运行

### 环境要求

- **Node.js** >= 18
- **pnpm** >= 9
- **Rust** (stable) + `cargo`
- **系统依赖**（macOS 无需额外安装；Linux 需 webkit2gtk；Windows 需 WebView2）

### 开发模式

```bash
# 安装前端依赖
pnpm install

# 启动 Tauri 开发模式（同时启动 Vite dev server + Rust 编译 + 打开应用窗口）
pnpm tauri dev
```

启动后 Tauri 会：
1. 执行 `pnpm dev` 启动 Vite（监听 `localhost:1420`）
2. 编译 Rust 后端
3. 打开桌面窗口加载前端

### 生产构建

```bash
# 构建前端 + 打包 Tauri 桌面应用
pnpm tauri build
```

产物位于 `src-tauri/target/release/bundle/`，包含各平台安装包（`.dmg`、`.exe`、`.deb` 等）。

### 仅运行前端（浏览器调试）

```bash
pnpm dev
# 访问 http://localhost:1420
```

> 注意：浏览器模式下 `window.__TAURI__` 不存在，`invoke.ts` 中的 Tauri 调用会报错。

### 代码检查

```bash
pnpm lint        # 检查
pnpm lint:fix    # 自动修复
```

---

## 技术架构总结

```
┌─────────────────────────────────────────┐
│              桌面窗口 (Tauri)            │
│  ┌───────────────────────────────────┐  │
│  │        WebView (前端)              │  │
│  │  React 19 + Ant Design + Tiptap   │  │
│  │  ┌──────────┬───────────────────┐ │  │
│  │  │SessionList│   功能面板        │ │  │
│  │  │（导航列表）│ Movement / Todo   │ │  │
│  │  │          │ / Reminders       │ │  │
│  │  └──────────┴───────────────────┘ │  │
│  │         useReducer Store          │  │
│  └──────────────┬────────────────────┘  │
│                 │ invoke()              │
│  ┌──────────────▼────────────────────┐  │
│  │         Rust 后端 (Tauri)         │  │
│  │    greet command / opener plugin  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```
