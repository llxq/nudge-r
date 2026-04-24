import type { ReactNode } from 'react';
import {
  ThunderboltOutlined,
  UnorderedListOutlined,
  BellOutlined,
  SunOutlined,
  MoonOutlined,
} from "@ant-design/icons";
import { Tooltip } from "antd";
import { useStore } from "../store";
import type { Tab } from "../store";
import { EActionType } from "../constants/enum";
import styles from "./Sidebar.module.scss";
import logo from "../../public/logo.svg";

const NAV_ITEMS: { key: Tab; icon: ReactNode; label: string }[] = [
  { key: "movement", icon: <ThunderboltOutlined />, label: "活动提醒" },
  { key: "todo", icon: <UnorderedListOutlined />, label: "待办" },
  { key: "reminders", icon: <BellOutlined />, label: "更多提醒" },
];

export default function Sidebar() {
  const { state, dispatch } = useStore();
  const isDark = state.theme === "dark";

  return (
    <aside className={styles.sidebar}>
      {/* Logo + title */}
      <div className={styles.brand}>
        <img src={logo} alt="NudgeR" className={styles.logoImg} />
        <span className={styles.brandName}>NudgeR</span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = state.tab === item.key;
          return (
            <Tooltip key={item.key} title={item.label} placement="right">
              <button
                className={`${styles.navBtn} ${active ? styles.navBtnActive : ""}`}
                onClick={() => dispatch({ type: EActionType.SET_TAB, payload: item.key })}
              >
                {item.icon}
              </button>
            </Tooltip>
          );
        })}
      </nav>

      <div className={styles.bottom}>
        <Tooltip title={isDark ? "切换亮色" : "切换暗色"} placement="right">
          <button
            className={styles.navBtn}
            onClick={() =>
              dispatch({ type: EActionType.SET_THEME, payload: isDark ? "light" : "dark" })
            }
          >
            {isDark ? <SunOutlined /> : <MoonOutlined />}
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}
