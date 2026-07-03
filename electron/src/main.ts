import {
  app,
  BrowserWindow,
  ipcMain,
  session,
  desktopCapturer,
  screen,
} from "electron";

app.disableHardwareAcceleration();
import path from "path";
import { startServer, stopServer, SERVER_PORT } from "./server-manager";
import { registerConfigHandlers, loadUserConfig, syncEnvFromConfig } from "./config-store";

const isDev = !app.isPackaged;
const VITE_URL = process.env.VITE_DEV_URL || "http://localhost:5173";

const WINDOW = {
  defaultWidth: 360,
  defaultHeight: 500,
  minWidth: 300,
  minHeight: 340,
  maxWidth: 440,
  maxHeight: 640,
  margin: 12,
};

let mainWindow: BrowserWindow | null = null;

function getClientPath(): string {
  if (isDev) {
    return path.join(__dirname, "../../client/dist/index.html");
  }
  return path.join(process.resourcesPath, "client", "index.html");
}

function getWindowBounds() {
  const display = screen.getPrimaryDisplay();
  const { width: areaW, height: areaH } = display.workAreaSize;
  const { x: areaX, y: areaY } = display.workArea;

  const width = Math.min(WINDOW.defaultWidth, areaW - WINDOW.margin * 2);
  const height = Math.min(WINDOW.defaultHeight, areaH - WINDOW.margin * 2);

  return {
    width: Math.max(width, WINDOW.minWidth),
    height: Math.max(height, WINDOW.minHeight),
    x: areaX + areaW - width - WINDOW.margin,
    y: areaY + WINDOW.margin,
  };
}

function createWindow() {
  const bounds = getWindowBounds();
  const config = loadUserConfig();

  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: WINDOW.minWidth,
    minHeight: WINDOW.minHeight,
    maxWidth: WINDOW.maxWidth,
    maxHeight: WINDOW.maxHeight,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    minimizable: true,
    maximizable: false,
    fullscreenable: false,
    thickFrame: false,
    hasShadow: false,
    backgroundColor: "#080808",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setContentProtection(config.stealthMode);
  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.setOpacity(config.windowOpacity);

  if (isDev) {
    mainWindow.loadURL(VITE_URL);
  } else {
    mainWindow.loadFile(getClientPath());
  }

  mainWindow.once("ready-to-show", () => mainWindow?.show());

  screen.on("display-metrics-changed", () => {
    if (!mainWindow) return;
    const [wx, wy] = mainWindow.getPosition();
    const [ww, wh] = mainWindow.getSize();
    const display = screen.getDisplayNearestPoint({ x: wx, y: wy });
    const { x: ax, y: ay, width: aw, height: ah } = display.workArea;
    const cx = Math.max(ax, Math.min(wx, ax + aw - ww));
    const cy = Math.max(ay, Math.min(wy, ay + ah - wh));
    if (cx !== wx || cy !== wy) mainWindow.setPosition(cx, cy);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

registerConfigHandlers();

app.whenReady().then(async () => {
  session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: { width: 1, height: 1 },
      });
      callback(sources[0] ? { video: sources[0], audio: "loopback" } : {});
    } catch {
      callback({});
    }
  });

  if (!isDev) {
    try {
      syncEnvFromConfig();
      await startServer();
    } catch (err) {
      console.error("Failed to start server:", err);
    }
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopServer();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => stopServer());

ipcMain.handle("get-platform", () => process.platform);
ipcMain.handle("get-server-port", () => SERVER_PORT);
ipcMain.handle("is-electron", () => true);

ipcMain.handle("set-content-protection", (_e, enabled: boolean) => {
  mainWindow?.setContentProtection(enabled);
  return enabled;
});

ipcMain.handle("set-opacity", (_e, opacity: number) => {
  const v = Math.max(0.55, Math.min(1, opacity));
  mainWindow?.setOpacity(v);
  return v;
});

ipcMain.handle("minimize", () => mainWindow?.minimize());
ipcMain.handle("close", () => mainWindow?.close());
