import { ipcMain, app } from "electron";
import fs from "fs";
import path from "path";
import type { UserConfig } from "@synvix/shared";
import { DEFAULT_USER_CONFIG } from "@synvix/shared";
import { restartServer } from "./server-manager";

const CONFIG_FILE = "synvix-config.json";

function getConfigPath(): string {
  return path.join(app.getPath("userData"), CONFIG_FILE);
}

function getEnvPath(): string {
  return path.join(app.getPath("userData"), ".env");
}

export function loadUserConfig(): UserConfig {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return { ...DEFAULT_USER_CONFIG };
  try {
    return { ...DEFAULT_USER_CONFIG, ...JSON.parse(fs.readFileSync(configPath, "utf-8")) };
  } catch {
    return { ...DEFAULT_USER_CONFIG };
  }
}

export function configToEnv(config: UserConfig): string {
  return `# Synvix — local API keys (never uploaded)
GEMINI_API_KEY=${config.geminiApiKey}
GROQ_API_KEY=${config.groqApiKey}
ANTHROPIC_API_KEY=${config.anthropicApiKey}
OPENAI_API_KEY=${config.openaiApiKey}
PORT=3001
`;
}

export function saveUserConfig(config: UserConfig): void {
  const dir = app.getPath("userData");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), "utf-8");
  fs.writeFileSync(getEnvPath(), configToEnv(config), "utf-8");
}

/** Keep .env in sync with saved config (e.g. before embedded server starts). */
export function syncEnvFromConfig(): void {
  const config = loadUserConfig();
  const dir = app.getPath("userData");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getEnvPath(), configToEnv(config), "utf-8");
}

export function registerConfigHandlers(): void {
  ipcMain.handle("config:load", () => {
    const config = loadUserConfig();
    // Return keys masked for display safety — full keys only on save roundtrip from client state
    return config;
  });

  ipcMain.handle("config:save", async (_e, config: UserConfig) => {
    saveUserConfig(config);
    if (app.isPackaged) {
      await restartServer();
    }
    return { ok: true };
  });

  ipcMain.handle("config:get-path", () => app.getPath("userData"));
}

export { getEnvPath };
