import type { ThemeMode } from "../store";

/**
 * Ant Design theme
 */
export const ANT_BASE_TOKEN = {
  colorPrimary: "#1e6fff",
  borderRadius: 6,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif",
  fontSize: 13,
} as const;

export const ANT_TOKEN_BY_THEME: Record<ThemeMode, { colorBgContainer: string; colorBorderSecondary: string }> = {
  light: {
    colorBgContainer: "#ffffff",
    colorBorderSecondary: "#e8eaed",
  },
  dark: {
    colorBgContainer: "#1e2530",
    colorBorderSecondary: "#2a2f38",
  },
};

/**
 * CSS 变量
 */
export const CSS_VARS_BY_THEME: Record<ThemeMode, Record<string, string>> = {
  light: {
    "--color-border": "#e8eaed",
    "--color-surface": "#ffffff",
    "--color-hover": "#f0f4ff",
    "--color-text-primary": "#1a1f2e",
    "--color-text-secondary": "#4a5568",
    "--color-text-tertiary": "#8896a8",
    "--color-text-quaternary": "#c0cad8",
    "--color-badge-bg": "#e6f0ff",
    "--color-badge-text": "#1e6fff",
    "--color-session-bg": "#ffffff",
    "--color-session-active": "rgba(30,111,255,0.08)",
    "--color-todo-title": "#333333",
    "--color-todo-body": "#666666",
    "--color-danger": "#d9363e",
    "--color-danger-bg": "rgba(255, 77, 79, 0.14)",
  },
  dark: {
    "--color-border": "#2a2f38",
    "--color-surface": "#1e2530",
    "--color-hover": "#242b36",
    "--color-text-primary": "#dce3ed",
    "--color-text-secondary": "#8a96a8",
    "--color-text-tertiary": "#566070",
    "--color-text-quaternary": "#3a4250",
    "--color-badge-bg": "#1a2d4a",
    "--color-badge-text": "#6eaaff",
    "--color-session-bg": "#161b24",
    "--color-session-active": "rgba(30,111,255,0.15)",
    "--color-todo-title": "#dce3ed",
    "--color-todo-body": "#8a96a8",
    "--color-danger": "#d9363e",
    "--color-danger-bg": "rgba(255, 77, 79, 0.14)",
  },
};
