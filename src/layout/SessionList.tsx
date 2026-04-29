import {
  ThunderboltOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
} from "@ant-design/icons";
import { Tooltip } from "antd";
import { useStore } from "../store";
import type { Tab, AppState } from "../store";
import { EActionType } from "../constants/enum";
import {
  SESSION_ICON_COLORS,
  movementSubText,
  settingsSubText,
  todoSubText,
} from "../constants/session";
import { APP_NAME } from "../constants/app";
import logo from "../../public/logo.svg";
import styles from "./SessionList.module.scss";
import { type ReactNode } from "react"

const SESSIONS: {
  key: Tab;
  label: string;
  icon: ReactNode;
  iconBg: string;
  sub: (s: AppState) => string;
}[] = [
  {
    key: "movement",
    label: "活动提醒",
    icon: <ThunderboltOutlined />,
    iconBg: SESSION_ICON_COLORS.movement,
    sub: movementSubText,
  },
  {
    key: "todo",
    label: "待办",
    icon: <UnorderedListOutlined />,
    iconBg: SESSION_ICON_COLORS.todo,
    sub: todoSubText,
  },
  {
    key: "settings",
    label: "设置",
    icon: <SettingOutlined />,
    iconBg: SESSION_ICON_COLORS.settings,
    sub: settingsSubText,
  },
];

export default function SessionList() {
  const { state, dispatch } = useStore();
  const isDark = state.theme === "dark";
  const remindedTodoCount = state.todos.filter((todo) => !todo.done && todo.isRemind).length;

  return (
    <div className={styles.col}>
      {/* Brand header */}
      <div className={styles.brand}>
        <div className={styles.brandLeft}>
          <img src={logo} alt="NudgeR" className={styles.logoImg} />
          <span className={styles.brandName}>{APP_NAME}</span>
        </div>
        <Tooltip title={isDark ? "切换亮色" : "切换暗色"} placement="right">
          <button
            className={styles.themeBtn}
            onClick={() =>
              dispatch({ type: EActionType.SET_THEME, payload: isDark ? "light" : "dark" })
            }
          >
            {isDark ? <SunOutlined /> : <MoonOutlined />}
          </button>
        </Tooltip>
      </div>

      {/* Nav list */}
      <ul className={styles.list}>
        {SESSIONS.map((item) => {
          const active = state.tab === item.key;
          return (
            <li
              key={item.key}
              className={`${styles.item} ${active ? styles.itemActive : ""}`}
              onClick={() => dispatch({ type: EActionType.SET_TAB, payload: item.key })}
            >
              <div className={styles.icon} style={{ background: item.iconBg }}>
                {item.icon}
              </div>
              <div className={styles.info}>
                <div className={styles.nameRow}>
                  <span className={styles.name}>{item.label}</span>
                  {item.key === "todo" && remindedTodoCount > 0 && (
                    <span className={styles.countBadge}>{remindedTodoCount}</span>
                  )}
                </div>
                <span className={styles.sub}>{item.sub(state)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
