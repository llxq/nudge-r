import App from './App';
import NotificationPage from '../features/notification/NotificationPage';
import TodoNotificationPage from '../features/notification/TodoNotificationPage';
import TrayDetailPage from '../features/tray/TrayDetailPage';
import type { FC } from 'react';

/**
 * 页面渲染策略
 */
const PAGE_MAP: Record<string, FC> = {
  notification: NotificationPage,
  'todo-notification': TodoNotificationPage,
  'tray-detail': TrayDetailPage,
};

export function getPageComponent(): FC {
  const page = new URLSearchParams(window.location.search).get('page') ?? '';
  return PAGE_MAP[page] ?? App;
}
