import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import { VPNManager } from './services/vpnManager';

let mainWindow: BrowserWindow | null = null;
let vpnManager: VPNManager;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', () => {
  vpnManager = new VPNManager();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for VPN operations
ipcMain.handle('vpn:connect', async (_: any, serverId: string) => {
  try {
    return await vpnManager.connect(serverId);
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('vpn:disconnect', async () => {
  try {
    return await vpnManager.disconnect();
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('vpn:status', async () => {
  return vpnManager.getStatus();
});

ipcMain.handle('vpn:servers', async () => {
  return vpnManager.getServers();
});

ipcMain.handle('vpn:settings', async (_: any, settings: any) => {
  return vpnManager.updateSettings(settings);
});

ipcMain.handle('vpn:logs', async () => {
  return vpnManager.getLogs();
});

ipcMain.handle('vpn:kill-switch', async (_: any, enabled: boolean) => {
  return vpnManager.setKillSwitch(enabled);
});
