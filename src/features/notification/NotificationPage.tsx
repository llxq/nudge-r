import { useMemo, useState, useEffect, type CSSProperties } from 'react';
import { MOVEMENT_THEMES } from '../../constants/movement-themes';
import {
  closeNoticeWindows,
  getMovementNotificationConfig,
  type IMovementNotificationConfig,
} from '../../core/invoke';
import styles from './NotificationPage.module.scss';

const normalizeMultilineText = (value: string): string[] => {
  return value.replace(/\\n/g, '\n').replace(/\/n/g, '\n').split('\n');
};

export default function NotificationPage() {
  const theme = useMemo(
    () => MOVEMENT_THEMES[Math.floor(Math.random() * MOVEMENT_THEMES.length)],
    []
  );

  const [config, setConfig] = useState<IMovementNotificationConfig | null>(null);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  const dismiss = async () => {
    await closeNoticeWindows();
  };

  useEffect(() => {
    let mounted = true;

    getMovementNotificationConfig().then((nextConfig) => {
      if (!mounted) {
        return;
      }
      setConfig(nextConfig);
      const nextNow = Date.now();
      setNow(nextNow);
      setEndAt(nextNow + nextConfig.activityMin * 60 * 1000);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!config || endAt == null) {
      return;
    }

    const syncNow = (): void => {
      const current = Date.now();
      setNow(current);

      if (current >= endAt) {
        void dismiss();
      }
    };

    syncNow();
    const timer = window.setInterval(syncNow, 1000);
    window.addEventListener('focus', syncNow);
    document.addEventListener('visibilitychange', syncNow);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', syncNow);
      document.removeEventListener('visibilitychange', syncNow);
    };
  }, [config, endAt]);

  useEffect(() => {
    if (!config || endAt == null) {
      return;
    }

    const delay = Math.max(0, endAt - Date.now());
    const timer = window.setTimeout(() => {
      void dismiss();
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [config, endAt]);

  const remaining = endAt == null ? 0 : Math.max(0, Math.ceil((endAt - now) / 1000));

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  if (!config) {
    return null;
  }

  const subLines = normalizeMultilineText(config.sub);

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
          {subLines.map((line, index) => (
            <span key={`${line}-${index}`}>
              {line}
              {index < subLines.length - 1 && <br />}
            </span>
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
