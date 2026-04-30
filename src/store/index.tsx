import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from 'react';
import { EActionType } from '../constants/enum';
import { doneUserTodo, updateMovementConfig, updateUserSettings } from '../core/invoke';

// ─── Types ────────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark';
export type Tab = 'movement' | 'todo' | 'settings';

export interface Todo {
  id: number;
  title: string;
  body?: string;
  done: boolean;
  isRemind: boolean;
  createdAt: number;
  remindAt?: number;
}

export interface MovementState {
  intervalMin: number;
  idlePauseMin: number;
  isWorking: boolean;
  active: boolean;
  breakEndAt: number | null;
  startTime: number | null;
  activityMin: number;
}

export interface AppState {
  theme: ThemeMode;
  tab: Tab;
  autoStart: boolean;
  movement: MovementState;
  todos: Todo[];
}

// ─── Actions ──────────────────────────────────────────────
export type Action =
  | { type: EActionType.SET_THEME; payload: ThemeMode }
  | { type: EActionType.SET_TAB; payload: Tab }
  | { type: EActionType.SET_AUTO_START; payload: boolean }
  | { type: EActionType.MOVEMENT_SET_INTERVAL; payload: number }
  | { type: EActionType.MOVEMENT_SET_WORKING; payload: boolean }
  | { type: EActionType.MOVEMENT_TOGGLE_ACTIVE }
  | { type: EActionType.MOVEMENT_RESET }
  | { type: EActionType.MOVEMENT_SYNC_START_TIME; payload: number | null }
  | { type: EActionType.MOVEMENT_START_BREAK; payload: number }
  | { type: EActionType.MOVEMENT_END_BREAK }
  | { type: EActionType.MOVEMENT_SET_ACTIVITY_MIN; payload: number }
  | { type: EActionType.MOVEMENT_SET_IDLE_PAUSE_MIN; payload: number }
  | {
  type: EActionType.TODO_ADD;
  payload: string;
  body?: string;
  remindAt?: number;
}
  | { type: EActionType.TODO_TOGGLE; payload: number }
  | { type: EActionType.TODO_MARK_REMINDED; payload: number }
  | {
  type: EActionType.TODO_EDIT;
  payload: {
    id: number;
    title: string;
    body?: string;
    remindAt?: number;
  };
}
  | { type: EActionType.TODO_DELETE; payload: number }
  | { type: EActionType.INITIALIZE_STORE; payload: Partial<AppState> };

// ─── Initial State ────────────────────────────────────────
const initialState: AppState = {
  theme: 'light',
  tab: 'movement',
  autoStart: false,
  movement: {
    intervalMin: 30,
    idlePauseMin: 5,
    isWorking: true,
    active: false,
    breakEndAt: null,
    startTime: null,
    activityMin: 5,
  },
  todos: [],
};

// ─── Reducer ──────────────────────────────────────────────
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    /**
     * 切换亮色/暗色主题
     */
    case EActionType.SET_THEME:
      return { ...state, theme: action.payload };
    /**
     * 切换当前激活的标签页
     */
    case EActionType.SET_TAB:
      return { ...state, tab: action.payload };
    /**
     * 设置是否开机自启
     */
    case EActionType.SET_AUTO_START:
      return { ...state, autoStart: action.payload };
    /**
     * 设置活动提醒间隔时长（分钟）
     */
    case EActionType.MOVEMENT_SET_INTERVAL:
      return {
        ...state,
        movement: {
          ...state.movement,
          intervalMin: action.payload,
          startTime:
            state.movement.active && state.movement.isWorking
              ? Date.now()
              : state.movement.startTime,
        },
      };
    /**
     * 手动切换工作/休息状态，切换到休息时传入结束时间戳立即开始计时
     */
    case EActionType.MOVEMENT_SET_WORKING:
      if (action.payload) {
        // 恢复工作
        return {
          ...state,
          movement: {
            ...state.movement,
            isWorking: true,
            active: true,
            breakEndAt: null,
            startTime: Date.now(),
          },
        };
      }
      return {
        ...state,
        movement: { ...state.movement, isWorking: false, startTime: null },
      };
    /**
     * 开启或停止活动提醒
     */
    case EActionType.MOVEMENT_TOGGLE_ACTIVE:
      return {
        ...state,
        movement: {
          ...state.movement,
          active: !state.movement.active,
          startTime: state.movement.active ? null : Date.now(),
        },
      };
    /**
     * 停止活动提醒并重置状态
     */
    case EActionType.MOVEMENT_RESET:
      return {
        ...state,
        movement: {
          ...state.movement,
          active: true,
          startTime: Date.now(),
        },
      };
    /**
     * 同步后端下发的倒计时起点，避免再次写回数据库形成回环
     */
    case EActionType.MOVEMENT_SYNC_START_TIME:
      return {
        ...state,
        movement: {
          ...state.movement,
          startTime: action.payload,
        },
      };
    /**
     * 开始休息计时，payload 为休息结束的时间戳
     */
    case EActionType.MOVEMENT_START_BREAK:
      return {
        ...state,
        movement: {
          ...state.movement,
          isWorking: false,
          breakEndAt: action.payload,
          startTime: null,
        },
      };
    /**
     * 休息结束，恢复工作状态并清除计时
     */
    case EActionType.MOVEMENT_END_BREAK:
      return {
        ...state,
        movement: {
          ...state.movement,
          isWorking: true,
          breakEndAt: null,
          startTime: state.movement.active ? Date.now() : null,
        },
      };
    /**
     * 设置每次提醒后的活动时长（分钟）
     */
    case EActionType.MOVEMENT_SET_ACTIVITY_MIN:
      return {
        ...state,
        movement: { ...state.movement, activityMin: action.payload },
      };
    /**
     * 设置空闲暂停阈值（分钟）
     */
    case EActionType.MOVEMENT_SET_IDLE_PAUSE_MIN:
      return {
        ...state,
        movement: { ...state.movement, idlePauseMin: action.payload },
      };
    /**
     * 新增一条待办
     */
    case EActionType.TODO_ADD:
      return {
        ...state,
        todos: [
          ...state.todos,
          {
            id: Date.now(),
            title: action.payload,
            body: action.body,
            remindAt: action.remindAt,
            isRemind: false,
            done: false,
            createdAt: Date.now(),
          },
        ],
      };
    /**
     * 切换待办完成状态
     */
    case EActionType.TODO_TOGGLE:
    {
      const updateId = action.payload;
      const todo = state.todos.find(it => it.id === updateId)
      const done =!todo?.done
      void doneUserTodo({
        id: updateId,
        done
      })
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.payload ? { ...t, done } : t
        ),
      };
    }
    /**
     * 标记待办已提醒
     */
    case EActionType.TODO_MARK_REMINDED:
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.payload ? { ...t, isRemind: true } : t
        ),
      };
    /**
     * 编辑待办内容
     */
    case EActionType.TODO_EDIT:
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.payload.id
            ? {
              ...t,
              title: action.payload.title,
              body: action.payload.body,
              remindAt: action.payload.remindAt,
              isRemind:
                action.payload.remindAt !== t.remindAt ? false : t.isRemind,
            }
            : t
        ),
      };
    /**
     * 删除指定待办
     */
    case EActionType.TODO_DELETE:
      return {
        ...state,
        todos: state.todos.filter((t) => t.id !== action.payload),
      };
    /**
     * 初始化 store 默认值（仅入口，实际值可在外部获取后 dispatch）
     */
    case EActionType.INITIALIZE_STORE:
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────
interface StoreCtx {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const StoreContext = createContext<StoreCtx>(null!);

export function initializeStore(
  dispatch: Dispatch<Action>,
  defaults: Partial<AppState>
) {
  dispatch({ type: EActionType.INITIALIZE_STORE, payload: defaults });
}

const updateUserSettingsActions = [
  EActionType.SET_THEME,
  EActionType.SET_TAB,
  EActionType.SET_AUTO_START,
];
const updateMovementSettingsActions = [
  EActionType.MOVEMENT_SET_INTERVAL,
  EActionType.MOVEMENT_SET_WORKING,
  EActionType.MOVEMENT_TOGGLE_ACTIVE,
  EActionType.MOVEMENT_RESET,
  EActionType.MOVEMENT_START_BREAK,
  EActionType.MOVEMENT_END_BREAK,
  EActionType.MOVEMENT_SET_ACTIVITY_MIN,
  EActionType.MOVEMENT_SET_IDLE_PAUSE_MIN,
];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer((state: AppState, action: Action) => {
    const data = reducer(state, action);
    // 更新系统配置
    if (updateUserSettingsActions.includes(action.type as EActionType)) {
      void updateUserSettings({
        theme: data.theme,
        tab: data.tab,
        autoStart: data.autoStart,
      });
    }
    if (updateMovementSettingsActions.includes(action.type as EActionType)) {
      // 更新运动配置
      void updateMovementConfig(data.movement);
    }
    return data;
  }, initialState);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
