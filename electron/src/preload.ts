import { contextBridge, ipcRenderer } from "electron";

export interface ElectronAPI {
  isElectron: boolean;
  platform: string;
  setContentProtection: (enabled: boolean) => Promise<boolean>;
  setOpacity: (opacity: number) => Promise<number>;
  minimize: () => Promise<void>;
  close: () => Promise<void>;
  loadConfig: () => Promise<Record<string, unknown>>;
  saveConfig: (config: Record<string, unknown>) => Promise<{ ok: boolean }>;
  getConfigPath: () => Promise<string>;
}

const electronAPI: ElectronAPI = {
  isElectron: true,
  platform: process.platform,
  setContentProtection: (enabled) => ipcRenderer.invoke("set-content-protection", enabled),
  setOpacity: (opacity) => ipcRenderer.invoke("set-opacity", opacity),
  minimize: () => ipcRenderer.invoke("minimize"),
  close: () => ipcRenderer.invoke("close"),
  loadConfig: () => ipcRenderer.invoke("config:load"),
  saveConfig: (config) => ipcRenderer.invoke("config:save", config),
  getConfigPath: () => ipcRenderer.invoke("config:get-path"),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
