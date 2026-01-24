import React, { useState, useEffect } from 'react';
import './Dashboard.css';

interface VPNStatus {
  connected: boolean;
  currentServer?: any;
  ipAddress?: string;
  uploadSpeed: number;
  downloadSpeed: number;
  uptime: number;
}

interface VPNServer {
  id: string;
  name: string;
  country: string;
  city: string;
  load: number;
  ping: number;
}

interface IPInfo {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  isp: string;
  latitude: number;
  longitude: number;
  flag: string;
}

declare global {
  interface Window {
    vpnAPI: any;
  }
}

export default function Dashboard() {
  const [status, setStatus] = useState<VPNStatus>({
    connected: false,
    uploadSpeed: 0,
    downloadSpeed: 0,
    uptime: 0,
  });

  const [servers, setServers] = useState<VPNServer[]>([]);
  const [filteredServers, setFilteredServers] = useState<VPNServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'ping' | 'load'>('name');
  const [ipInfo, setIPInfo] = useState<IPInfo | null>(null);
  const [showIPDetails, setShowIPDetails] = useState(false);

  // Debug: Check if VPN API is available
  React.useEffect(() => {
    console.log('Dashboard mounted. VPN API available?', typeof window.vpnAPI !== 'undefined');
    if (typeof window.vpnAPI === 'undefined') {
      console.error('⚠️ window.vpnAPI is NOT available! Preload script may not be working.');
    } else {
      console.log('✅ window.vpnAPI is available');
    }
  }, []);

  useEffect(() => {
    // Add small delay to ensure IPC bridge is ready
    setTimeout(() => {
      loadServers();
      loadStatus();
    }, 500);
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Filter and sort servers based on search term and sort option
    let filtered = servers.filter((server) =>
      server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.country.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      if (sortBy === 'ping') return a.ping - b.ping;
      if (sortBy === 'load') return a.load - b.load;
      return a.name.localeCompare(b.name);
    });

    setFilteredServers(filtered);
  }, [servers, searchTerm, sortBy]);

  const loadServers = async () => {
    try {
      console.log('🔄 Loading servers...');
      if (typeof window.vpnAPI === 'undefined') {
        throw new Error('VPN API is not available');
      }
      const serverList = await window.vpnAPI.getServers();
      console.log(`✅ Loaded ${serverList ? serverList.length : 0} servers`);
      if (serverList && serverList.length > 0) {
        console.log('First 3 servers:', serverList.slice(0, 3));
      } else {
        console.warn('⚠️ No servers returned from VPN API');
      }
      setServers(serverList || []);
    } catch (error) {
      console.error('❌ Failed to load servers:', error);
    }
  };

  const loadStatus = async () => {
    try {
      const currentStatus = await window.vpnAPI.getStatus();
      setStatus(currentStatus);
      
      // Look up IP info if connected
      if (currentStatus.connected && currentStatus.ipAddress) {
        await lookupIPInfo(currentStatus.ipAddress);
      } else {
        setIPInfo(null);
      }
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const lookupIPInfo = async (ipAddress: string) => {
    try {
      // Use free IP lookup service
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      const data = await response.json();
      
      // Get country flag emoji
      const flag = data.country_code 
        ? String.fromCodePoint(...data.country_code.split('').map((c: string) => c.charCodeAt(0) + 127397))
        : '🌍';

      setIPInfo({
        ip: ipAddress,
        country: data.country_name || 'Unknown',
        countryCode: data.country_code || 'XX',
        city: data.city || 'Unknown',
        isp: data.org || 'Unknown ISP',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        flag: flag,
      });
    } catch (error) {
      console.error('Failed to lookup IP info:', error);
    }
  };

  const handleConnect = async () => {
    if (!selectedServer) {
      alert('Please select a server');
      return;
    }
    setLoading(true);
    try {
      const result = await window.vpnAPI.connect(selectedServer);
      if (result.success) {
        await loadStatus();
      } else {
        alert('Connection failed: ' + result.message);
      }
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const result = await window.vpnAPI.disconnect();
      if (result.success) {
        await loadStatus();
      } else {
        alert('Disconnection failed: ' + result.message);
      }
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="status-card">
        <div className="status-indicator">
          <div className={`indicator ${status.connected ? 'connected' : ''}`}></div>
          <span className="status-text">
            {status.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {status.connected && (
          <div className="current-server">
            <p className="server-info">
              <span className="label">Server:</span>
              <span className="value">{status.currentServer?.name}</span>
            </p>
            <p className="server-info">
              <span className="label">IP Address:</span>
              <span className="value">{status.ipAddress}</span>
            </p>
            
            {ipInfo && (
              <div className="ip-details">
                <p className="ip-detail-item">
                  <span className="flag">{ipInfo.flag}</span>
                  <span className="detail-text">{ipInfo.country} - {ipInfo.city}</span>
                </p>
                <p className="ip-detail-item">
                  <span className="label">ISP:</span>
                  <span className="detail-text">{ipInfo.isp}</span>
                </p>
                <div className="ip-actions">
                  <button 
                    className="btn btn-small"
                    onClick={() => window.open(`https://ipinfo.io/${status.ipAddress}`, '_blank')}
                  >
                    View Details
                  </button>
                  <button 
                    className="btn btn-small"
                    onClick={() => window.open(`https://maps.google.com/?q=${ipInfo.latitude},${ipInfo.longitude}`, '_blank')}
                  >
                    View on Map
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="button-group">
          {!status.connected ? (
            <button
              className="btn btn-primary"
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          ) : (
            <button
              className="btn btn-danger"
              onClick={handleDisconnect}
              disabled={loading}
            >
              {loading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          )}
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Download Speed</div>
          <div className="stat-value">{status.downloadSpeed.toFixed(2)} Mbps</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Upload Speed</div>
          <div className="stat-value">{status.uploadSpeed.toFixed(2)} Mbps</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Connection Time</div>
          <div className="stat-value">{Math.round(status.uptime / 60)}m</div>
        </div>
      </div>

      <div className="servers-section">
        <h2>Select a Server</h2>
        
        <div className="servers-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by country, city, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="sort-controls">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <option value="name">Name</option>
              <option value="ping">Ping (Low to High)</option>
              <option value="load">Load (Low to High)</option>
            </select>
          </div>
        </div>

        <div className="server-info-bar">
          {filteredServers.length} servers available
        </div>

        <div className="server-list">
          {filteredServers.length === 0 ? (
            <div className="no-servers">No servers match your search</div>
          ) : (
            filteredServers.map((server) => (
              <div
                key={server.id}
                className={`server-item ${selectedServer === server.id ? 'selected' : ''}`}
                onClick={() => setSelectedServer(server.id)}
              >
                <div className="server-header">
                  <span className="server-name">{server.name}</span>
                  <span className="server-location">{server.city}, {server.country}</span>
                </div>
                <div className="server-stats">
                  <span className="stat">Load: {server.load}%</span>
                  <span className="stat">Ping: {server.ping}ms</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
