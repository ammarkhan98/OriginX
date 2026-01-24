import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { COUNTRIES_DATA } from '../data/countries';

const execPromise = promisify(exec);

export interface VPNServer {
  id: string;
  name: string;
  country: string;
  city: string;
  protocol: string;
  ip: string;
  load: number;
  ping: number;
}

export interface VPNSettings {
  killSwitch: boolean;
  encryptionLevel: 'low' | 'medium' | 'high';
  protocol: 'UDP' | 'TCP';
  dns: string;
  autoConnect: boolean;
}

export interface VPNStatus {
  connected: boolean;
  currentServer?: VPNServer;
  ipAddress?: string;
  uploadSpeed: number;
  downloadSpeed: number;
  uptime: number;
}

export class VPNManager {
  private settings: VPNSettings;
  private logs: string[] = [];
  private isConnected: boolean = false;
  private currentServer?: VPNServer;
  private logFile: string;

  constructor() {
    this.settings = {
      killSwitch: false,
      encryptionLevel: 'high',
      protocol: 'UDP',
      dns: '8.8.8.8',
      autoConnect: false,
    };

    this.logFile = path.join(__dirname, '../logs/vpn.log');
    this.ensureLogFile();
  }

  private ensureLogFile() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private log(message: string) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);

    fs.appendFileSync(this.logFile, logEntry + '\n');

    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500);
    }
  }

  async connect(serverId: string): Promise<{ success: boolean; message: string }> {
    try {
      this.log(`Attempting to connect to server: ${serverId}`);

      // Find server in list
      const servers = this.getServers();
      const server = servers.find((s) => s.id === serverId);

      if (!server) {
        throw new Error(`Server ${serverId} not found`);
      }

      // Simulate OpenVPN connection
      // In production, this would call actual OpenVPN CLI
      await this.executeOpenVPN(server);

      this.isConnected = true;
      this.currentServer = server;
      this.log(`Successfully connected to ${server.name}`);

      return { success: true, message: `Connected to ${server.name}` };
    } catch (error) {
      this.log(`Connection failed: ${(error as Error).message}`);
      return { success: false, message: (error as Error).message };
    }
  }

  async disconnect(): Promise<{ success: boolean; message: string }> {
    try {
      this.log('Disconnecting from VPN');

      // Simulate OpenVPN disconnection
      await this.executeOpenVPNDisconnect();

      this.isConnected = false;
      this.currentServer = undefined;
      this.log('Successfully disconnected');

      return { success: true, message: 'Disconnected from VPN' };
    } catch (error) {
      this.log(`Disconnection failed: ${(error as Error).message}`);
      return { success: false, message: (error as Error).message };
    }
  }

  private async executeOpenVPN(server: VPNServer): Promise<void> {
    // This would execute actual OpenVPN commands
    // For now, simulating the connection
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  }

  private async executeOpenVPNDisconnect(): Promise<void> {
    // This would execute actual OpenVPN disconnect
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }

  getStatus(): VPNStatus {
    return {
      connected: this.isConnected,
      currentServer: this.currentServer,
      ipAddress: this.isConnected ? '192.0.2.1' : undefined,
      uploadSpeed: this.isConnected ? Math.random() * 100 : 0,
      downloadSpeed: this.isConnected ? Math.random() * 500 : 0,
      uptime: this.isConnected ? Math.random() * 86400 : 0,
    };
  }

  getServers(): VPNServer[] {
    // Return real server list from countries data
    return COUNTRIES_DATA.map((country) => ({
      id: country.id,
      name: country.name,
      country: country.countryCode,
      city: country.city,
      protocol: 'OpenVPN',
      ip: country.ip,
      load: Math.floor(Math.random() * 100),
      ping: Math.floor(Math.random() * 150) + 10,
    }));
  }

  updateSettings(newSettings: Partial<VPNSettings>): VPNSettings {
    this.settings = { ...this.settings, ...newSettings };
    this.log(`Settings updated: ${JSON.stringify(newSettings)}`);
    return this.settings;
  }

  getLogs(): string[] {
    return this.logs;
  }

  setKillSwitch(enabled: boolean): { success: boolean; message: string } {
    this.settings.killSwitch = enabled;
    this.log(`Kill switch ${enabled ? 'enabled' : 'disabled'}`);
    return { success: true, message: `Kill switch ${enabled ? 'enabled' : 'disabled'}` };
  }
}
