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

  useEffect(() => {
    loadServers();
    loadStatus();
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
      const serverList = await window.vpnAPI.getServers();
      setServers(serverList);
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  };

  const loadStatus = async () => {
    try {
      const currentStatus = await window.vpnAPI.getStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error('Failed to load status:', error);
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
