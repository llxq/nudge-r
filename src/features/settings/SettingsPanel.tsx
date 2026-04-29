import { AppstoreOutlined } from '@ant-design/icons';
import { Alert, Card, Switch } from 'antd';
import { useState } from 'react';
import { EActionType } from '../../constants/enum';
import { setAutoStart } from '../../core/invoke';
import { useStore } from '../../store';
import { $success } from '../../utils/message.ts';
import styles from './SettingsPanel.module.scss';

export default function SettingsPanel() {
  const { state, dispatch } = useStore();
  const [savingAutoStart, setSavingAutoStart] = useState(false);

  const handleAutoStartChange = async (checked: boolean): Promise<void> => {
    setSavingAutoStart(true);
    try {
      await setAutoStart(checked);
      dispatch({ type: EActionType.SET_AUTO_START, payload: checked });
      void $success(checked ? '已开启开机自启' : '已关闭开机自启');
    } finally {
      setSavingAutoStart(false);
    }
  };

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <h1 className={styles.title}>设置</h1>
        <p className={styles.subtitle}>配置应用启动方式与基础行为</p>
      </header>

      <Card className={styles.card} bordered={false}>
        <div className={styles.cardHead}>
          <div className={styles.iconWrap}>
            <AppstoreOutlined />
          </div>
          <div className={styles.copy}>
            <div className={styles.cardTitle}>开机自启</div>
            <div className={styles.cardSub}>开启后，系统登录时自动启动，并默认仅展示托盘</div>
          </div>
          <Switch
            checked={state.autoStart}
            loading={savingAutoStart}
            onChange={(checked) => {
              void handleAutoStartChange(checked);
            }}
          />
        </div>
      </Card>

      <Alert
        className={styles.alert}
        type="info"
        showIcon
        message="说明"
        description="开启开机自启后，应用由系统自动拉起时不会直接展示主窗口，而是先驻留在托盘。"
      />
    </div>
  );
}
