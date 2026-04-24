import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { ConfigProvider, Spin, theme as antTheme } from 'antd';
import { listen } from '@tauri-apps/api/event';
import zhCN from 'antd/locale/zh_CN';
import {
  ANT_BASE_TOKEN,
  ANT_TOKEN_BY_THEME,
  CSS_VARS_BY_THEME,
} from '../constants/theme';
import { EActionType } from '../constants/enum';
import { TAB_MAP } from '../constants/tabs';
import SessionList from '../layout/SessionList';
import {
  initializeStore,
  StoreProvider,
  useStore,
  type AppState,
} from '../store';
import styles from './App.module.scss';
import { getMovementConfig, getUserSettings, getUserTodos } from '../core/invoke';

type MovementTimerResetPayload = {
  reason: 'idle-reset' | 'resume' | 'start' | 'restart';
  startTime: number | null;
};

function Shell() {
  const { state } = useStore();
  const { token } = antTheme.useToken();

  /** 将 CSS 变量同步写入 :root，确保 Modal 等 Portal 也能读到 */
  useEffect(() => {
    const vars = CSS_VARS_BY_THEME[state.theme];
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [state.theme]);

  /** 根据当前 tab 从策略表中取出对应面板组件 */
  const Panel = TAB_MAP.get(state.tab);

  return (
    <div
      className={styles.shell}
      style={{ background: token.colorBgContainer } as CSSProperties}
    >
      <SessionList />
      <main
        className={styles.detail}
        style={{ background: token.colorBgContainer }}
      >
        {Panel && <Panel />}
      </main>
    </div>
  );
}

const init = async (): Promise<Partial<AppState>> => {
  const [userSettings, movementConfig, todos] = await Promise.all([
    getUserSettings(),
    getMovementConfig(),
    getUserTodos()
  ]);
  return {
    ...userSettings,
    ...movementConfig,
    todos,
  } as unknown as Partial<AppState>;
};

function ThemeWrapper() {
  const { state, dispatch } = useStore();
  const [loading, setLoading] = useState(true);
  const isDark = state.theme === 'dark';

  useEffect(() => {
    let mounted = true;

    init()
      .then((defaults) => {
        if (!mounted) return;
        initializeStore(dispatch, defaults);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;

    listen<MovementTimerResetPayload>('movement-timer-reset', (event) => {
      if (disposed) {
        return;
      }

      dispatch({
        type: EActionType.MOVEMENT_SYNC_START_TIME,
        payload: event.payload.startTime,
      });
    })
      .then((fn) => {
        if (disposed) {
          fn();
          return;
        }
        unlisten = fn;
      })
      .catch((error) => {
        console.error('failed to listen movement-timer-reset', error);
      });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [dispatch]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          ...ANT_BASE_TOKEN,
          ...ANT_TOKEN_BY_THEME[state.theme],
        },
      }}
    >
      {loading ? (
        <div className={styles.loadingWrap}>
          <Spin size="large" />
        </div>
      ) : (
        <Shell />
      )}
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ThemeWrapper />
    </StoreProvider>
  );
}
