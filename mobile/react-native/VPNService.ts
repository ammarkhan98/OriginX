import { NativeModules, NativeEventEmitter } from 'react-native';

const { VPNModule } = NativeModules;

export const VPNService = {
  connect: (serverId: string) => VPNModule.connect(serverId),
  disconnect: () => VPNModule.disconnect(),
  getStatus: () => VPNModule.getStatus(),
  setSettings: (settings: any) => VPNModule.setSettings(settings),
  getServers: () => VPNModule.getServers(),
  getLogs: (count: number = 100) => VPNModule.getLogs(count),
  
  // Event listeners
  addEventListener: (eventName: string, handler: (data: any) => void) => {
    const eventEmitter = new NativeEventEmitter(VPNModule);
    return eventEmitter.addListener(eventName, handler);
  },
};
