import React, { useState, useEffect } from 'react';
import '../Dashboard.css';

interface VPNStatus {
  connected: boolean;
  currentServer?: {
    name: string;
    country: string;
    city: string;
  };
  ipAddress: string;
  uploadSpeed: number;
  downloadSpeed: number;
  uptime: number;
}

interface VPNServer {
  id: string;
  name: string;
  country: string;
  city: string;
  protocol: string;
  ip: string;
  load: number;
  ping: number;
}

export const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<VPNStatus>({
    connected: false,
    ipAddress: '',
    uploadSpeed: 0,
    downloadSpeed: 0,
    uptime: 0,
  });

  const [servers, setServers] = useState<VPNServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Load status and servers on mount
  useEffect(() => {
    loadStatus();
    loadServers();

    // Refresh status every 2 seconds
    const interval = setInterval(loadStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const newStatus = await window.electron.vpn.getStatus();
      setStatus(newStatus);
    } catch (error) {
      console.error('Failed to get status:', error);
    }
  };

  const loadServers = async () => {
    try {
      const data = await window.electron.vpn.getServers();
      setServers(data.servers || []);
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  };

  const handleConnect = async () => {
    if (!selectedServer) return;

    setLoading(true);
    try {
      await window.electron.vpn.connect(selectedServer);
      await loadStatus();
    } catch (error) {
      console.error('Connection failed:', error);
      alert('Failed to connect: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await window.electron.vpn.disconnect();
      await loadStatus();
    } catch (error) {
      console.error('Disconnection failed:', error);
      alert('Failed to disconnect: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      {/* Connection Status Card */}
      <div className="status-card">
        <div className={`status-indicator ${status.connected ? 'connected' : 'disconnected'}`}>
          <div className="pulse"></div>
          <span>{status.connected ? 'Connected' : 'Disconnected'}</span>
        </div>

        {status.connected && status.currentServer && (
          <div className="connection-info">
            <h3>{status.currentServer.name}</h3>
            <p>
              {status.currentServer.city}, {status.currentServer.country}
            </p>
            <div className="ip-display">
              <span>IP: {status.ipAddress}</span>
            </div>
            <div className="uptime-display">
              <span>Uptime: {formatUptime(status.uptime)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Speed Stats Card */}
      <div className="stats-card">
        <div className="stat">
          <label>Download Speed</label>
          <span>{status.downloadSpeed.toFixed(2)} Mbps</span>
        </div>
        <div className="stat">
          <label>Upload Speed</label>
          <span>{status.uploadSpeed.toFixed(2)} Mbps</span>
        </div>
      </div>

      {/* Server Selection Card */}
      <div className="server-selection-card">
        <h3>Select VPN Server</h3>
        <select
          value={selectedServer}
          onChange={(e) => setSelectedServer(e.target.value)}
          disabled={status.connected || loading}
        >
          <option value="">Choose a server...</option>
          {servers.map((server) => (
            <option key={server.id} value={server.id}>
              {server.name} ({server.country}) - Ping: {server.ping}ms
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        {!status.connected ? (
          <button
            className="btn btn-connect"
            onClick={handleConnect}
            disabled={!selectedServer || loading}
          >
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        ) : (
          <button className="btn btn-disconnect" onClick={handleDisconnect} disabled={loading}>
            {loading ? 'Disconnecting...' : 'Disconnect'}
          </button>
        )}
      </div>
    </div>
  );
};

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export default Dashboard;
