import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import { spawn } from 'child_process';
import axios from 'axios';

let mainWindow: BrowserWindow | null = null;
let backendProcess: any = null;
const BACKEND_PORT = 9999;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

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

// Start C++ backend process
const startBackend = async () => {
  try {
    const backendPath = path.join(
      __dirname,
      '../backend/cpp/build/vpn_engine_backend'
    );

    backendProcess = spawn(backendPath, [BACKEND_PORT.toString()], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    backendProcess.stdout.on('data', (data: Buffer) => {
      console.log(`[Backend] ${data.toString()}`);
    });

    backendProcess.stderr.on('data', (data: Buffer) => {
      console.error(`[Backend Error] ${data.toString()}`);
    });

    backendProcess.on('error', (err: Error) => {
      console.error('Failed to start backend:', err);
    });

    // Wait for backend to be ready
    await waitForBackend(5000);
    console.log('Backend started successfully');
  } catch (error) {
    console.error('Error starting backend:', error);
  }
};

const waitForBackend = async (timeout: number): Promise<void> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const response = await axios.get(`${BACKEND_URL}/health`, {
        timeout: 1000,
      });
      if (response.status === 200) {
        return;
      }
    } catch (error) {
      // Backend not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Backend failed to start within timeout');
};

// IPC handlers for VPN operations
ipcMain.handle('vpn:connect', async (event, serverId: string) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/vpn/connect`, {
      serverId,
    });
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('vpn:disconnect', async () => {
  try {
    const response = await axios.post(`${BACKEND_URL}/vpn/disconnect`);
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('vpn:status', async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/vpn/status`);
    return response.data;
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle('vpn:settings', async (event, settings) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/vpn/settings`, settings);
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('vpn:servers', async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/vpn/servers`);
    return response.data;
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle('vpn:logs', async (event, count: number = 100) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/vpn/logs?count=${count}`);
    return response.data;
  } catch (error: any) {
    return { error: error.message };
  }
});

app.on('ready', async () => {
  await startBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle app quit to clean up backend
app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
