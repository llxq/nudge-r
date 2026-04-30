export enum EActionType {
  /**
   * 切换亮色/暗色主题
   */
  SET_THEME = 'SET_THEME',
  /**
   * 切换当前激活的标签页
   */
  SET_TAB = 'SET_TAB',
  /**
   * 设置开机自启
   */
  SET_AUTO_START = 'SET_AUTO_START',
  /**
   * 设置活动提醒间隔时长（分钟）
   */
  MOVEMENT_SET_INTERVAL = 'MOVEMENT_SET_INTERVAL',
  /**
   * 手动切换工作/休息状态
   */
  MOVEMENT_SET_WORKING = 'MOVEMENT_SET_WORKING',
  /**
   * 开启或停止活动提醒
   */
  MOVEMENT_TOGGLE_ACTIVE = 'MOVEMENT_TOGGLE_ACTIVE',
  /**
   * 停止活动提醒并重置状态
   */
  MOVEMENT_RESET = 'MOVEMENT_RESET',
  /**
   * 同步后端下发的活动提醒计时起点
   */
  MOVEMENT_SYNC_START_TIME = 'MOVEMENT_SYNC_START_TIME',
  /**
   * 开始休息计时
   */
  MOVEMENT_START_BREAK = 'MOVEMENT_START_BREAK',
  /**
   * 休息结束并恢复工作状态
   */
  MOVEMENT_END_BREAK = 'MOVEMENT_END_BREAK',
  /**
   * 设置每次提醒后的活动时长（分钟）
   */
  MOVEMENT_SET_ACTIVITY_MIN = 'MOVEMENT_SET_ACTIVITY_MIN',
  /**
   * 设置空闲暂停阈值（分钟）
   */
  MOVEMENT_SET_IDLE_PAUSE_MIN = 'MOVEMENT_SET_IDLE_PAUSE_MIN',
  /**
   * 新增一条待办
   */
  TODO_ADD = 'TODO_ADD',
  /**
   * 切换待办完成状态
   */
  TODO_TOGGLE = 'TODO_TOGGLE',
  /**
   * 标记待办已提醒
   */
  TODO_MARK_REMINDED = 'TODO_MARK_REMINDED',
  /**
   * 编辑待办内容
   */
  TODO_EDIT = 'TODO_EDIT',
  /**
   * 删除指定待办
   */
  TODO_DELETE = 'TODO_DELETE',
  /**
   * 初始化 store 默认值
   */
  INITIALIZE_STORE = 'INITIALIZE_STORE',
}
