import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { ClockCircleOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from './NotificationPage.module.scss';

interface TodoParams {
  id: string;
  title: string;
  body?: string;
  remindAt?: string;
}

export default function TodoNotificationPage() {
  const [todo, setTodo] = useState<TodoParams | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setTodo({
      id: search.get('id') ?? '',
      title: search.get('title') ?? '',
      body: search.get('body') ?? undefined,
      remindAt: search.get('remindAt') ?? undefined,
    });
  }, []);

  const dismiss = () => window.close();

  if (!todo) return null;

  return (
    <div className={styles.page}>
      <div className={styles.todoCard}>
        <div className={styles.todoHeader}>
          <div className={styles.todoIcon}>📌</div>
          <div className={styles.todoHeaderText}>
            <span className={styles.todoLabel}>待办提醒</span>
            <h2 className={styles.todoTitle}>{todo.title}</h2>
          </div>
        </div>

        {todo.body && todo.body !== '<p></p>' && (
          <div className={styles.todoBody}>
            <div
              className={styles.todoContent}
              dangerouslySetInnerHTML={{ __html: todo.body }}
            />
          </div>
        )}

        {todo.remindAt && (
          <div className={styles.todoMeta}>
            <ClockCircleOutlined />
            <span>{dayjs(Number(todo.remindAt)).format('YYYY-MM-DD HH:mm')}</span>
          </div>
        )}

        <div className={styles.todoFooter}>
          <Button onClick={dismiss}>稍后再说</Button>
          <Button type="primary" icon={<CheckOutlined />} onClick={dismiss}>
            标记完成
          </Button>
        </div>
      </div>
    </div>
  );
}
