import { BellOutlined } from "@ant-design/icons";
import styles from "./RemindersPanel.module.scss";

export default function RemindersPanel() {
  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <h1 className={styles.title}>更多提醒</h1>
        <p className={styles.subtitle}>即将推出更多提醒类型</p>
      </header>
      <div className={styles.placeholder}>
        <BellOutlined className={styles.icon} />
        <span className={styles.placeholderText}>敬请期待</span>
      </div>
    </div>
  );
}
