import {
  ClockCircleOutlined,
  CloseCircleFilled,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Tabs,
  Tag,
  Tooltip,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useState } from 'react';
import { EActionType } from '../../constants/enum';
import { createUserTodo, updateUserTodo } from '../../core/invoke.ts';
import { useStore } from '../../store';
import { $success } from '../../utils/message.ts';
import RichEditor from './RichEditor';
import styles from './TodoPanel.module.scss';

export default function TodoPanel() {
  const { state, dispatch } = useStore();
  const { todos } = state;

  // search
  const [searchQuery, setSearchQuery] = useState('');

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftRemindAt, setDraftRemindAt] = useState<Dayjs | null>(null);
  const [titleError, setTitleError] = useState(false);

  const openNew = () => {
    setEditId(null);
    setDraftTitle('');
    setDraftBody('');
    setDraftRemindAt(null);
    setTitleError(false);
    setModalOpen(true);
  };

  const openEdit = (id: number) => {
    const t = todos.find((x) => x.id === id);
    if (!t) return;
    setEditId(id);
    setDraftTitle(t.title);
    setDraftBody(t.body ?? '');
    setDraftRemindAt(t.remindAt ? dayjs(t.remindAt) : null);
    setTitleError(false);
    setModalOpen(true);
  };

  const handleSave = () => {
    const title = draftTitle.trim();
    if (!title) {
      setTitleError(true);
      return;
    }
    const remindAt = draftRemindAt ? draftRemindAt.valueOf() : undefined;
    if (editId === null) {
      void createUserTodo({
        title,
        body: draftBody,
        remindAt,
      });
      dispatch({
        type: EActionType.TODO_ADD,
        payload: title,
        body: draftBody,
        remindAt,
      });
    } else {
      void updateUserTodo({
        id: editId,
        title,
        body: draftBody,
        remindAt,
      });
      dispatch({
        type: EActionType.TODO_EDIT,
        payload: { id: editId, title, body: draftBody, remindAt },
      });
    }
    void $success('操作成功');
    setModalOpen(false);
  };

  // ─── Derived lists ────────────────────────────────────────
  const q = searchQuery.trim().toLowerCase();
  const isSearching = q.length > 0;

  const filtered = isSearching
    ? todos.filter((t) => t.title.toLowerCase().includes(q))
    : null;

  const pendingList = todos.filter((t) => !t.done);
  const doneList = todos.filter((t) => t.done);

  const doneCount = doneList.length;
  const totalCount = todos.length;

  // ─── Render helpers ───────────────────────────────────────
  const renderItem = (t: (typeof todos)[0]) => (
    <li key={t.id} className={styles.item}>
      <Checkbox
        checked={t.done}
        onChange={() =>
          dispatch({ type: EActionType.TODO_TOGGLE, payload: t.id })
        }
      />
      <div className={styles.itemBody}>
        <span
          className={styles.text}
          style={{
            textDecoration: t.done ? 'line-through' : 'none',
            opacity: t.done ? 0.4 : 1,
          }}
        >
          {t.title}
        </span>
        {t.remindAt && (
          <span className={styles.remindTime}>
            <ClockCircleOutlined style={{ marginRight: 3 }} />
            {dayjs(t.remindAt).format('MM-DD HH:mm')}
          </span>
        )}
        {t.body && t.body !== '<p></p>' && (
          <div
            className={styles.richPreview}
            dangerouslySetInnerHTML={{ __html: t.body }}
          />
        )}
      </div>
      <div className={styles.itemActions}>
        {!t.done && (
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(t.id)}
            />
          </Tooltip>
        )}
        <Popconfirm
          title="删除此待办？"
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true, size: 'small' }}
          onConfirm={() =>
            dispatch({ type: EActionType.TODO_DELETE, payload: t.id })
          }
        >
          <Tooltip title="删除">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      </div>
    </li>
  );

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>待办</h1>
          {totalCount > 0 && (
            <Tag
              color={doneCount === totalCount ? 'success' : 'processing'}
              style={{ margin: 0, fontSize: 11 }}
            >
              {doneCount} / {totalCount}
            </Tag>
          )}
        </div>
        <p className={styles.subtitle}>记录需要完成的小事</p>
      </header>

      {/* 搜索框 + 新建按钮 */}
      <div className={styles.toolbar}>
        <Input
          prefix={
            <SearchOutlined style={{ color: 'var(--color-text-quaternary)' }} />
          }
          suffix={
            searchQuery ? (
              <CloseCircleFilled
                style={{
                  color: 'var(--color-text-quaternary)',
                  cursor: 'pointer',
                }}
                onClick={() => setSearchQuery('')}
              />
            ) : null
          }
          placeholder="搜索待办…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear={false}
          style={{ borderRadius: 8, flex: 1 }}
        />
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={openNew}
          style={{ borderRadius: 8, height: 32, flexShrink: 0 }}
        >
          新建
        </Button>
      </div>

      {/* 列表区域 */}
      <div className={styles.listWrap}>
        {todos.length === 0 ? (
          <Empty
            description={
              <span className={styles.emptyText}>暂无待办，点击上方新建</span>
            }
            className={styles.empty}
          />
        ) : isSearching ? (
          filtered!.length === 0 ? (
            <Empty
              description={<span className={styles.emptyText}>无匹配结果</span>}
              className={styles.empty}
            />
          ) : (
            <ul className={styles.list}>{filtered!.map(renderItem)}</ul>
          )
        ) : (
          <Tabs
            defaultActiveKey="pending"
            size="small"
            className={styles.tabs}
            items={[
              {
                key: 'pending',
                label: (
                  <span>
                    待办
                    {pendingList.length > 0 && (
                      <Tag
                        style={{ marginLeft: 6, fontSize: 11 }}
                        color="processing"
                      >
                        {pendingList.length}
                      </Tag>
                    )}
                  </span>
                ),
                children:
                  pendingList.length === 0 ? (
                    <div className={styles.allDone}>所有任务已完成 🎉</div>
                  ) : (
                    <ul className={styles.list}>
                      {pendingList.map(renderItem)}
                    </ul>
                  ),
              },
              {
                key: 'done',
                label: (
                  <span>
                    已完成
                    {doneList.length > 0 && (
                      <Tag style={{ marginLeft: 6, fontSize: 11 }}>
                        {doneList.length}
                      </Tag>
                    )}
                  </span>
                ),
                children:
                  doneList.length === 0 ? (
                    <Empty
                      description={
                        <span className={styles.emptyText}>暂无已完成任务</span>
                      }
                      className={styles.empty}
                    />
                  ) : (
                    <ul className={styles.list}>{doneList.map(renderItem)}</ul>
                  ),
              },
            ]}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editId === null ? '新建待办' : '编辑待办'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText="保存"
        cancelText="取消"
        width={560}
        destroyOnHidden
        centered
        styles={{
          body: {
            padding: '12px 0 0',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(80vh - 110px)',
            overflow: 'hidden',
          },
        }}
      >
        <div className={styles.modalBody}>
          <Form.Item
            validateStatus={titleError ? 'error' : ''}
            help={titleError ? '标题不能为空' : undefined}
            style={{ margin: 0 }}
          >
            <input
              className={`${styles.titleInput} ${titleError ? styles.titleInputError : ''}`}
              placeholder="待办标题…"
              value={draftTitle}
              onChange={(e) => {
                setDraftTitle(e.target.value);
                if (titleError) setTitleError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </Form.Item>
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            placeholder="设置提醒时间（可选）"
            value={draftRemindAt}
            onChange={(v) => setDraftRemindAt(v)}
            style={{ borderRadius: 7, width: '100%' }}
            allowClear
          />
          <RichEditor
            key={editId ?? 'new'}
            content={draftBody}
            onChange={setDraftBody}
            placeholder="添加详细描述（支持富文本）…"
          />
        </div>
      </Modal>
    </div>
  );
}
