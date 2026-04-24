import { message } from 'antd';

export const $success = (text: string) => {
  return message.success(text);
}

export const $error = (text: string) => {
  return message.error(text);
}