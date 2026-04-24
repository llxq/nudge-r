import { useMemo, useState, useEffect, type CSSProperties } from 'react';
import { MOVEMENT_THEMES } from '../../constants/movement-themes';
import {
  closeNoticeWindows,
  getMovementNotificationConfig,
  type IMovementNotificationConfig,
} from '../../core/invoke';
import styles from './NotificationPage.module.scss';

export default function NotificationPage() {
  const theme = useMemo(
    () => MOVEMENT_THEMES[Math.floor(Math.random() * MOVEMENT_THEMES.length)],
    []
  );

  const [config, setConfig] = useState<IMovementNotificationConfig | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    let mounted = true;

    getMovementNotificationConfig().then((nextConfig) => {
      if (!mounted) {
        return;
      }
      setConfig(nextConfig);
      setRemaining(nextConfig.activityMin * 60);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!config || remaining <= 0) {
      return;
    }
    const timer = setInterval(() => setRemaining((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [config, remaining]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const dismiss = async () => {
    await closeNoticeWindows();
  };

  if (!config) {
    return null;
  }

  return (
    <div
      className={styles.page}
      style={{
        background: theme.bg,
        '--glow1': theme.glow1,
        '--glow2': theme.glow2,
      } as CSSProperties}
    >
      <div className={styles.movementCard}>
        <div
          className={styles.illustration}
          style={{
            background: theme.illustrationBg,
            borderColor: theme.illustrationBorder,
            boxShadow: theme.illustrationShadow,
            '--pulse-shadow-1': theme.pulseShadow1,
            '--pulse-shadow-2': theme.pulseShadow2,
          } as CSSProperties}
        >
          {config.emoji}
        </div>
        <h1 className={styles.movementTitle}>{config.title}</h1>
        <p className={styles.movementSub} style={{ color: theme.subColor }}>
          {config.sub.split('\n').map((line, i) => (
            <span key={i}>{line}{i === 0 && <br />}</span>
          ))}
        </p>
        <div className={styles.activityCountdown}>
          <span className={styles.countdownLabel}>{config.countdownLabel}</span>
          <span className={styles.countdownTime}>{mm}:{ss}</span>
        </div>
        <div className={styles.tips}>
          {config.tips.map((tip) => (
            <span
              key={tip}
              className={styles.tip}
              style={{
                background: theme.tipBg,
                borderColor: theme.tipBorder,
                color: theme.tipColor,
              }}
            >
              {tip}
            </span>
          ))}
        </div>
        <button
          className={styles.dismissBtn}
          onClick={dismiss}
          style={{
            background: theme.btnBg,
            boxShadow: `0 4px 24px ${theme.btnShadow}`,
          }}
        >
          {config.buttonText}
        </button>
      </div>
    </div>
  );
}
