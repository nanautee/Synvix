/// <reference types="vite/client" />

import type { ElectronAPI } from "./lib/electron";

interface ImportMetaEnv {
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
