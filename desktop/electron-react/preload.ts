import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  vpn: {
    connect: (serverId: string) =>
      ipcRenderer.invoke('vpn:connect', serverId),
    disconnect: () => ipcRenderer.invoke('vpn:disconnect'),
    getStatus: () => ipcRenderer.invoke('vpn:status'),
    setSettings: (settings: any) =>
      ipcRenderer.invoke('vpn:settings', settings),
    getServers: () => ipcRenderer.invoke('vpn:servers'),
    getLogs: (count?: number) =>
      ipcRenderer.invoke('vpn:logs', count || 100),
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);

declare global {
  interface Window {
    electron: typeof electronAPI;
  }
}
