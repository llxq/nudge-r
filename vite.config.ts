import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;
const buildTarget =
  process.env.NODE_ENV == 'development'
    ? 'chrome105'
    : process.env.TAURI_ENV_PLATFORM == 'windows'
      ? 'chrome105'
      : 'safari15.4';

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  // 防止 Vite 清除 Rust 显示的错误
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 过滤掉 tauri 的文件
      ignored: ["**/src-tauri/**"],
    },
  },
  // 添加除了 vite 之外的 tauri 的环境变量
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target: buildTarget,
  }
}));
