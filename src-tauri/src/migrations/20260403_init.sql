-- 用户设置表，存储用户的设置以 key-value 的形式
CREATE TABLE sys_user_setting (
    key TEXT PRIMARY KEY, -- 用于用户设置中的 key
    value TEXT NOT NULL, -- 用于用户设置中的 value
    update_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 更新时间
);

-- 默认配置
INSERT OR IGNORE INTO sys_user_setting (key, value) VALUES
('theme', 'light'), -- 主题，默认为 light
('language', 'zh_cn'), -- 语言，默认为中文
('tab', 'movement'), -- 默认打开的标签页，默认为活动提醒
('auto_start', '0'); -- 是否开机自启，默认为0（不自启）

-- 活动提醒配置表
CREATE TABLE sys_movement_config (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- 活动提醒配置的 id，约束必须等于1，防止插入多条
    interval_min INTEGER NOT NULL DEFAULT 30,   -- 提醒间隔（分钟）
    idle_pause_min INTEGER NOT NULL DEFAULT 5,  -- 空闲多久后暂停并重置提醒（分钟）
    activity_min INTEGER NOT NULL DEFAULT 5,    -- 每次活动时长（分钟）
    is_working   INTEGER NOT NULL DEFAULT 1,    -- 1=工作中, 0=休息中
    active       INTEGER NOT NULL DEFAULT 0,    -- 1=提醒已开启
    default_todo_remind_at TEXT NOT NULL DEFAULT "09:00:00", -- 默认待办事项提醒时间，默认为早上九点
    break_end_at INTEGER,                       -- 休息结束时间戳(ms)，NULL=不在休息
    start_time INTEGER,                         -- 活动开始时间戳(ms)，NULL=未开始
    notification_title TEXT NOT NULL DEFAULT '该起来活动啦！', -- 活动提醒标题
    notification_sub TEXT NOT NULL DEFAULT '久坐伤身，休息一下对你有好处。\n试试下面的活动，只需几分钟：', -- 活动提醒副标题
    notification_tips_json TEXT NOT NULL DEFAULT '["拉伸颈肩","起身走动","做几个深呼吸","活动手腕","远眺放松眼睛"]', -- 活动提醒建议项
    notification_button_text TEXT NOT NULL DEFAULT '好的，我去活动一下', -- 活动提醒按钮文案
    notification_emoji TEXT NOT NULL DEFAULT '🏃', -- 活动提醒图标
    notification_countdown_label TEXT NOT NULL DEFAULT '活动时间' -- 活动提醒倒计时标签
);

-- 默认配置
INSERT OR IGNORE INTO sys_movement_config (id, interval_min, idle_pause_min, activity_min, is_working, active) VALUES
(1, 30, 5, 5, 1, 0);


-- 待办事项表
CREATE TABLE user_todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- id
    title TEXT NOT NULL, -- 内容
    body TEXT DEFAULT NULL, -- 详细内容
    done INTEGER NOT NULL DEFAULT 0, -- 0=未完成，1=已完成
    remind_at INTEGER DEFAULT NULL, -- 提醒时间戳(ms),NULL=默认为早上九点提醒
    is_remind INTEGER DEFAULT 0, -- 是否已经提醒过了，0=未提醒，1=已提醒
    created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 创建时间戳(ms)
    is_deleted INTEGER NOT NULL DEFAULT 0 -- 0=未删除，1=已删除
);
