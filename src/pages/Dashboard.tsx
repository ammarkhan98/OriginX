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
  const [loading, setLoading] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string>('us-east-1');

  useEffect(() => {
    loadServers();
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

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
        <div className="server-list">
          {servers.map((server) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
