import { useEffect, useState } from "react";
import { InputNumber, Slider, Switch, Button, Badge, TimePicker } from "antd";
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useStore } from "../../store";
import { EActionType } from "../../constants/enum";
import { MOVEMENT_INTERVAL_MIN, MOVEMENT_INTERVAL_MAX, MOVEMENT_INTERVAL_STEP, MOVEMENT_INTERVAL_DEFAULT, MOVEMENT_ACTIVITY_MIN, MOVEMENT_ACTIVITY_MAX } from "../../constants/movement";
import { formatRemainingTime, getMovementRemainingMs } from "../../utils/timer";
import styles from "./MovementPanel.module.scss";

export default function MovementPanel() {
  const { state, dispatch } = useStore();
  const [now, setNow] = useState(Date.now());
  const { intervalMin, isWorking, active, breakEndAt, startTime, activityMin } = state.movement;

  // 休息倒计时结束后自动恢复工作状态
  useEffect(() => {
    if (!breakEndAt) return;
    const remaining = breakEndAt - Date.now();
    if (remaining <= 0) {
      dispatch({ type: EActionType.MOVEMENT_END_BREAK });
      return;
    }
    const timer = setTimeout(() => dispatch({ type: EActionType.MOVEMENT_END_BREAK }), remaining);
    return () => clearTimeout(timer);
  }, [breakEndAt, dispatch]);

  useEffect(() => {
    if (!active || !isWorking || !startTime) return;

    setNow(Date.now());
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [active, isWorking, startTime]);

  const breakEndTime = breakEndAt ? dayjs(breakEndAt) : null;
  const breakRemainMin = breakEndAt ? Math.max(0, Math.ceil((breakEndAt - Date.now()) / 60000)) : 0;
  const isWaitingForResume = active && isWorking && !startTime;
  const reminderRemainingText = formatRemainingTime(
    getMovementRemainingMs(startTime, intervalMin, now)
  );

  const handleWorkingToggle = (v: boolean) => {
    if (v) {
      dispatch({ type: EActionType.MOVEMENT_SET_WORKING, payload: true });
    } else {
      // 切换为休息中，默认休息到1小时后
      const defaultEndAt = dayjs().add(1, 'hour').valueOf();
      dispatch({ type: EActionType.MOVEMENT_START_BREAK, payload: defaultEndAt });
    }
  };

  const handleBreakTimeChange = (time: dayjs.Dayjs | null) => {
    if (!time) return;
    // 将选择的时分设置为今天（若已过则设为明天）
    let endAt = dayjs().hour(time.hour()).minute(time.minute()).second(0).millisecond(0);
    if (endAt.isBefore(dayjs())) endAt = endAt.add(1, 'day');
    dispatch({ type: EActionType.MOVEMENT_START_BREAK, payload: endAt.valueOf() });
  };

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <h1 className={styles.title}>活动提醒</h1>
        <p className={styles.subtitle}>定时起身活动，保持健康状态</p>
      </header>

      <section className={styles.section}>
        <label className={styles.sectionLabel}>提醒间隔</label>
        <div className={styles.card}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>间隔时长</span>
            <InputNumber
              min={MOVEMENT_INTERVAL_MIN}
              max={MOVEMENT_INTERVAL_MAX}
              step={MOVEMENT_INTERVAL_STEP}
              value={intervalMin}
              onChange={(v) =>
                dispatch({ type: EActionType.MOVEMENT_SET_INTERVAL, payload: v ?? MOVEMENT_INTERVAL_DEFAULT })
              }
              addonAfter="分钟"
              size="small"
              style={{ width: 100 }}
            />
          </div>
          <div className={styles.sliderRow}>
            <Slider
              min={MOVEMENT_INTERVAL_MIN}
              max={MOVEMENT_INTERVAL_MAX}
              step={MOVEMENT_INTERVAL_STEP}
              value={intervalMin}
              onChange={(v) =>
                dispatch({ type: EActionType.MOVEMENT_SET_INTERVAL, payload: v })
              }
              marks={{ [MOVEMENT_INTERVAL_MIN]: `${MOVEMENT_INTERVAL_MIN}`, 60: "60", 120: "120", [MOVEMENT_INTERVAL_MAX]: `${MOVEMENT_INTERVAL_MAX}` }}
              tooltip={{ formatter: (v) => `${v} 分钟` }}
            />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <label className={styles.sectionLabel}>活动时长</label>
        <div className={styles.card}>
          <div className={`${styles.row} ${styles.rowNoBorder}`}>
            <span className={styles.rowLabel}>每次活动</span>
            <InputNumber
              min={MOVEMENT_ACTIVITY_MIN}
              max={MOVEMENT_ACTIVITY_MAX}
              value={activityMin}
              onChange={(v) =>
                dispatch({ type: EActionType.MOVEMENT_SET_ACTIVITY_MIN, payload: v ?? 5 })
              }
              addonAfter="分钟"
              size="small"
              style={{ width: 100 }}
            />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <label className={styles.sectionLabel}>工作状态</label>
        <div className={styles.card}>
          <div className={`${styles.row} ${isWorking ? styles.rowNoBorder : ""}`}>
            <span className={styles.rowLabel}>当前状态</span>
            <Switch
              size="small"
              checked={isWorking}
              onChange={handleWorkingToggle}
              checkedChildren="工作中"
              unCheckedChildren="休息中"
            />
          </div>
          {!isWorking && (
            <div className={`${styles.row} ${styles.rowNoBorder}`}>
              <span className={styles.rowLabel}>休息到</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TimePicker
                  format="HH:mm"
                  value={breakEndTime}
                  onChange={handleBreakTimeChange}
                  size="small"
                  allowClear={false}
                  disabled={false}
                />
                {breakEndAt && (
                  <span className={styles.breakText}>
                    还剩 {breakRemainMin} 分钟后恢复提醒
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className={styles.actions}>
        <Button
          type={active ? "default" : "primary"}
          danger={active}
          size="middle"
          icon={active ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={() => dispatch({ type: EActionType.MOVEMENT_TOGGLE_ACTIVE })}
          className={styles.actionBtn}
          disabled={!isWorking}
        >
          {active ? "停止提醒" : "开始提醒"}
        </Button>
        {active && isWorking && (
          <Button
            size="middle"
            icon={<ReloadOutlined />}
            onClick={() => dispatch({ type: EActionType.MOVEMENT_RESET })}
            className={styles.actionBtn}
          >
            重置
          </Button>
        )}
        {active && (
          <Badge
            status={isWorking ? "processing" : "default"}
            text={
              <span className={styles.statusText}>
                {isWorking
                  ? isWaitingForResume
                    ? "检测到空闲，等待恢复操作后重新开始计时"
                    : `下次提醒还有 ${reminderRemainingText}`
                  : "已暂停（休息模式）"}
              </span>
            }
          />
        )}
      </div>
    </div>
  );
}
