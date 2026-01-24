import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('vpnAPI', {
  connect: (serverId: string) => ipcRenderer.invoke('vpn:connect', serverId),
  disconnect: () => ipcRenderer.invoke('vpn:disconnect'),
  getStatus: () => ipcRenderer.invoke('vpn:status'),
  getServers: () => ipcRenderer.invoke('vpn:servers'),
  updateSettings: (settings: any) => ipcRenderer.invoke('vpn:settings', settings),
  getLogs: () => ipcRenderer.invoke('vpn:logs'),
  setKillSwitch: (enabled: boolean) => ipcRenderer.invoke('vpn:kill-switch', enabled),
});
