import type { UserConfig } from "@synvix/shared";

export function isElectron(): boolean {
  return !!(window as unknown as { electronAPI?: { isElectron: boolean } }).electronAPI?.isElectron;
}

export function getElectronAPI() {
  return (window as unknown as { electronAPI?: ElectronAPI }).electronAPI;
}

export interface ElectronAPI {
  isElectron: boolean;
  platform: string;
  setContentProtection: (enabled: boolean) => Promise<boolean>;
  setOpacity: (opacity: number) => Promise<number>;
  minimize: () => Promise<void>;
  close: () => Promise<void>;
  loadConfig: () => Promise<UserConfig>;
  saveConfig: (config: UserConfig) => Promise<{ ok: boolean }>;
  getConfigPath: () => Promise<string>;
  captureScreenshot: () => Promise<{ data?: string; width?: number; height?: number; error?: string }>;
}
