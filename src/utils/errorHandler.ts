import { $error } from './message.ts';

export function setupErrorHandlers() {
  window.addEventListener('error', (e) => {
    void $error(`发生错误：${e.message}`);
  });

  window.addEventListener('unhandledrejection', (e) => {
    void $error(`发生错误：${String(e.reason)}`);
  });
}
