import fs from 'fs';
import path from 'path';
import axios from 'axios';

export interface VPNServerConfig {
  id: string;
  name: string;
  countryCode: string;
  city: string;
  ip: string;
  protocol: string;
  load: number;
  ping: number;
}

export interface ServersConfig {
  servers: VPNServerConfig[];
}

/**
 * Configuration Manager for VPN Servers
 * Supports loading from:
 * 1. Local JSON file (servers.json)
 * 2. Remote API endpoint
 * 3. Environment variables
 */
export class ServerConfigManager {
  private servers: VPNServerConfig[] = [];
  private configPath: string;
  private remoteApiUrl?: string;
  private lastRefreshTime: number = 0;
  private cacheExpiration: number = 3600000; // 1 hour in milliseconds

  constructor() {
    // Get config path from environment or use default
    this.configPath = process.env.VPN_SERVERS_CONFIG_PATH 
      || path.join(__dirname, '../config/servers.json');
    
    // Get remote API URL from environment
    this.remoteApiUrl = process.env.VPN_SERVERS_API_URL;
  }

  /**
   * Load servers from configuration source
   * Priority: Remote API > Local JSON > Hard-coded defaults
   */
  async loadServers(): Promise<VPNServerConfig[]> {
    try {
      // Try remote API first if configured
      if (this.remoteApiUrl) {
        const apiServers = await this.loadFromRemoteAPI();
        if (apiServers && apiServers.length > 0) {
          this.servers = apiServers;
          this.lastRefreshTime = Date.now();
          return this.servers;
        }
      }

      // Fall back to local config file
      const localServers = await this.loadFromLocalFile();
      if (localServers && localServers.length > 0) {
        this.servers = localServers;
        return this.servers;
      }

      // Fall back to hard-coded defaults
      this.servers = this.getDefaultServers();
      return this.servers;
    } catch (error) {
      console.error('Error loading servers configuration:', error);
      // Return defaults on error
      this.servers = this.getDefaultServers();
      return this.servers;
    }
  }

  /**
   * Load servers from remote API endpoint
   */
  private async loadFromRemoteAPI(): Promise<VPNServerConfig[] | null> {
    try {
      if (!this.remoteApiUrl) return null;

      // Check cache expiration
      if (this.servers.length > 0 && 
          Date.now() - this.lastRefreshTime < this.cacheExpiration) {
        return this.servers;
      }

      console.log(`Fetching servers from API: ${this.remoteApiUrl}`);
      const response = await axios.get(this.remoteApiUrl, { timeout: 5000 });
      
      if (response.data.servers && Array.isArray(response.data.servers)) {
        console.log(`Successfully loaded ${response.data.servers.length} servers from API`);
        return response.data.servers;
      }

      return null;
    } catch (error) {
      console.warn(`Failed to load from remote API: ${error}`);
      return null;
    }
  }

  /**
   * Load servers from local JSON configuration file
   */
  private async loadFromLocalFile(): Promise<VPNServerConfig[] | null> {
    try {
      // Check if file exists
      if (!fs.existsSync(this.configPath)) {
        console.warn(`Config file not found: ${this.configPath}`);
        return null;
      }

      console.log(`Loading servers from: ${this.configPath}`);
      const fileContent = fs.readFileSync(this.configPath, 'utf-8');
      const config: ServersConfig = JSON.parse(fileContent);

      if (config.servers && Array.isArray(config.servers)) {
        console.log(`Successfully loaded ${config.servers.length} servers from local config`);
        return config.servers;
      }

      return null;
    } catch (error) {
      console.warn(`Failed to load from local config: ${error}`);
      return null;
    }
  }

  /**
   * Add or update a server in the configuration
   */
  addServer(server: VPNServerConfig): void {
    const existingIndex = this.servers.findIndex(s => s.id === server.id);
    if (existingIndex >= 0) {
      this.servers[existingIndex] = server;
    } else {
      this.servers.push(server);
    }

    // Persist to file
    this.saveToLocalFile();
  }

  /**
   * Remove a server from configuration
   */
  removeServer(serverId: string): void {
    this.servers = this.servers.filter(s => s.id !== serverId);
    this.saveToLocalFile();
  }

  /**
   * Update server configuration in local file
   */
  private saveToLocalFile(): void {
    try {
      const config: ServersConfig = { servers: this.servers };
      const dir = path.dirname(this.configPath);

      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      console.log(`Servers configuration saved to: ${this.configPath}`);
    } catch (error) {
      console.error(`Failed to save servers configuration: ${error}`);
    }
  }

  /**
   * Get all servers
   */
  getServers(): VPNServerConfig[] {
    return [...this.servers];
  }

  /**
   * Get server by ID
   */
  getServer(serverId: string): VPNServerConfig | undefined {
    return this.servers.find(s => s.id === serverId);
  }

  /**
   * Get servers filtered by country code
   */
  getServersByCountry(countryCode: string): VPNServerConfig[] {
    return this.servers.filter(s => s.countryCode === countryCode);
  }

  /**
   * Get servers sorted by load (least loaded first)
   */
  getServersByLoad(): VPNServerConfig[] {
    return [...this.servers].sort((a, b) => a.load - b.load);
  }

  /**
   * Get servers sorted by ping (lowest ping first)
   */
  getServersByPing(): VPNServerConfig[] {
    return [...this.servers].sort((a, b) => a.ping - b.ping);
  }

  /**
   * Refresh servers from remote API (if configured)
   */
  async refreshFromRemote(): Promise<boolean> {
    try {
      if (!this.remoteApiUrl) {
        console.warn('Remote API URL not configured');
        return false;
      }

      const apiServers = await this.loadFromRemoteAPI();
      if (apiServers && apiServers.length > 0) {
        this.servers = apiServers;
        this.lastRefreshTime = Date.now();
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Failed to refresh from remote: ${error}`);
      return false;
    }
  }

  /**
   * Get default hard-coded servers (fallback)
   */
  private getDefaultServers(): VPNServerConfig[] {
    return [
      {
        id: 'us-ny-1',
        name: 'United States - New York',
        countryCode: 'US',
        city: 'New York',
        ip: '45.33.32.156',
        protocol: 'UDP',
        load: 35,
        ping: 12,
      },
      {
        id: 'us-la-1',
        name: 'United States - Los Angeles',
        countryCode: 'US',
        city: 'Los Angeles',
        ip: '167.99.182.125',
        protocol: 'UDP',
        load: 42,
        ping: 28,
      },
      {
        id: 'uk-london-1',
        name: 'United Kingdom - London',
        countryCode: 'UK',
        city: 'London',
        ip: '185.2.75.150',
        protocol: 'UDP',
        load: 45,
        ping: 85,
      },
      {
        id: 'au-sydney-1',
        name: 'Australia - Sydney',
        countryCode: 'AU',
        city: 'Sydney',
        ip: '203.0.113.45',
        protocol: 'UDP',
        load: 55,
        ping: 145,
      },
    ];
  }
}

// Export singleton instance
export const serverConfigManager = new ServerConfigManager();
