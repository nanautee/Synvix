import { spawn, type ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import { app } from "electron";
import { getEnvPath, loadUserConfig, saveUserConfig } from "./config-store";

const SERVER_PORT = 3001;
let serverProcess: ChildProcess | null = null;

export function ensureEnvFile(): void {
  const envPath = getEnvPath();
  if (fs.existsSync(envPath)) return;
  saveUserConfig(loadUserConfig());
}

function getServerScript(): string {
  const isDev = !app.isPackaged;
  return isDev
    ? path.join(__dirname, "../../server/dist/bundle.js")
    : path.join(process.resourcesPath, "server", "bundle.js");
}

function spawnServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    ensureEnvFile();
    const serverScript = getServerScript();

    if (!fs.existsSync(serverScript)) {
      reject(new Error(`Server bundle not found: ${serverScript}`));
      return;
    }

    const env = {
      ...process.env,
      PORT: String(SERVER_PORT),
      ELECTRON_RUN_AS_NODE: "1",
      DOTENV_CONFIG_PATH: getEnvPath(),
    };

    serverProcess = spawn(process.execPath, [serverScript], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let started = false;

    serverProcess.stdout?.on("data", (data: Buffer) => {
      const line = data.toString();
      console.log("[synvix]", line.trim());
      if (!started && line.includes("Server running")) {
        started = true;
        resolve();
      }
    });

    serverProcess.stderr?.on("data", (data: Buffer) => {
      console.error("[synvix]", data.toString().trim());
    });

    serverProcess.on("error", reject);
    serverProcess.on("exit", (code) => {
      console.log(`Server exited: ${code}`);
      serverProcess = null;
    });

    setTimeout(() => {
      if (!started) {
        started = true;
        resolve();
      }
    }, 5000);
  });
}

export function startServer(): Promise<void> {
  return spawnServer();
}

export async function restartServer(): Promise<void> {
  stopServer();
  await new Promise((r) => setTimeout(r, 500));
  return spawnServer();
}

export function stopServer(): void {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

export { SERVER_PORT };
