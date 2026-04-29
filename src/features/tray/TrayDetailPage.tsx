import { emit, listen } from '@tauri-apps/api/event';
import { useEffect, useState, type CSSProperties } from 'react';
import {
  getTrayDetailSnapshot,
  quitApp,
  showMainWindowFromTray,
  type ITrayDetailMovementState,
  type ITrayDetailSnapshot,
} from '../../core/invoke';
import styles from './TrayDetailPage.module.scss';

type TrayDetailUpdatedPayload = ITrayDetailSnapshot;
const TRAY_DETAIL_READY_EVENT = 'tray-detail-ready';
const TRAY_DETAIL_THEME = {
  bg: 'linear-gradient(180deg, #f8fbff 0%, #f2f7ff 100%)',
  glow1: 'rgba(85, 150, 255, 0.14)',
  glow2: 'rgba(154, 210, 255, 0.18)',
  illustrationBg: 'linear-gradient(135deg, rgba(72, 130, 255, 0.14), rgba(112, 195, 255, 0.12))',
  illustrationBorder: 'rgba(116, 166, 245, 0.24)',
  illustrationShadow: '0 10px 26px rgba(85, 145, 255, 0.16)',
  tipBg: 'rgba(91, 145, 255, 0.08)',
  tipBorder: 'rgba(121, 167, 246, 0.18)',
  tipColor: 'rgba(37, 77, 144, 0.92)',
  btnBg: 'linear-gradient(135deg, #2f74ff 0%, #4aa3ff 100%)',
  btnShadow: 'rgba(64, 132, 255, 0.22)',
  subColor: 'rgba(86, 114, 160, 0.78)',
};

const countRemainingSeconds = (
  movement: ITrayDetailMovementState,
  now: number,
): number | null => {
  if (!movement.active || !movement.isWorking || movement.startTime == null) {
    return null;
  }

  const totalSeconds = Math.max(movement.intervalMin, 0) * 60;
  const elapsedSeconds = Math.max(0, Math.floor((now - movement.startTime) / 1000));
  return Math.max(0, totalSeconds - elapsedSeconds);
};

const formatSecondsAsClock = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function TrayDetailPage() {
  const [snapshot, setSnapshot] = useState<ITrayDetailSnapshot | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    let mounted = true;
    let unlisten: (() => void) | undefined;

    getTrayDetailSnapshot().then((nextSnapshot) => {
      if (!mounted) {
        return;
      }
      setSnapshot(nextSnapshot);
      setNow(Date.now());
    });

    listen<TrayDetailUpdatedPayload>('tray-detail-updated', (event) => {
      if (!mounted) {
        return;
      }
      setSnapshot(event.payload);
      setNow(Date.now());
    }).then((dispose) => {
      if (!mounted) {
        dispose();
        return;
      }
      unlisten = dispose;
    });

    void emit(TRAY_DETAIL_READY_EVENT);

    const timer = window.setInterval(() => {
      if (!mounted) {
        return;
      }
      setNow(Date.now());
    }, 1000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
      unlisten?.();
    };
  }, []);

  const remainingSeconds = snapshot ? countRemainingSeconds(snapshot.movement, now) : null;
  const countdownText =
    remainingSeconds == null ? snapshot?.movement.statusText ?? '--:--' : formatSecondsAsClock(remainingSeconds);
  const todoCount = snapshot ? snapshot.todos.length + snapshot.overflowCount : 0;
  const remindedCount = snapshot?.remindedCount ?? 0;

  const handleOpenMain = async (): Promise<void> => {
    await showMainWindowFromTray();
  };

  const handleQuit = async (): Promise<void> => {
    await quitApp();
  };

  return (
    <div
      className={styles.shell}
      style={{
        background: TRAY_DETAIL_THEME.bg,
        '--glow1': TRAY_DETAIL_THEME.glow1,
        '--glow2': TRAY_DETAIL_THEME.glow2,
      } as CSSProperties}
    >
      <div className={styles.panel}>
        <section className={`${styles.section} ${styles.summarySection}`}>
          <div className={styles.summaryContent}>
            <div className={styles.sectionTitle}>下次提醒</div>
            <div className={styles.countdown}>{countdownText}</div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.todoSection}`}>
          <div className={styles.sectionRow}>
            <span className={styles.sectionTitle}>待办</span>
            <div className={styles.todoMeta}>
              {remindedCount > 0 && <span className={styles.remindedCount}>已提醒 {remindedCount}</span>}
              <span className={styles.meta}>{todoCount} 条</span>
            </div>
          </div>

          {!snapshot ? (
            <div className={styles.todoList}>
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className={styles.todoSkeleton} />
              ))}
            </div>
          ) : snapshot.todos.length === 0 ? (
            <div className={styles.empty}>暂无未完成待办</div>
          ) : (
            <div className={styles.todoList}>
              {snapshot.todos.map((todo) => (
                <div
                  key={todo.title}
                  className={styles.todoItem}
                  style={{
                    background: TRAY_DETAIL_THEME.tipBg,
                    borderColor: TRAY_DETAIL_THEME.tipBorder,
                    color: TRAY_DETAIL_THEME.tipColor,
                  }}
                >
                  <span className={styles.todoDot} />
                  <span className={`${styles.todoText} ${todo.isRemind ? styles.todoTextReminded : ''}`}>
                    {todo.title}
                  </span>
                </div>
              ))}
            </div>
          )}

          {snapshot != null && snapshot.overflowCount > 0 && (
            <div className={styles.more}>还有 {snapshot.overflowCount} 条未完成</div>
          )}
        </section>

        <div className={styles.footer}>
          <button className={styles.secondaryBtn} onClick={handleQuit}>
            退出
          </button>
          <button
            className={styles.primaryBtn}
            onClick={handleOpenMain}
            style={{
              background: TRAY_DETAIL_THEME.btnBg,
              boxShadow: `0 10px 30px ${TRAY_DETAIL_THEME.btnShadow}`,
            }}
          >
            打开主窗口
          </button>
        </div>
      </div>
    </div>
  );
}
