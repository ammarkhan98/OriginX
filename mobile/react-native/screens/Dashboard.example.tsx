import React, { useState } from 'react';
import { VPNService } from '../VPNService';
import '../Dashboard.css';

interface VPNStatus {
  connected: boolean;
  ipAddress?: string;
  uploadSpeed?: number;
  downloadSpeed?: number;
}

interface VPNServer {
  id: string;
  name: string;
  country: string;
  city: string;
  ping: number;
}

export const DashboardMobile: React.FC = () => {
  const [status, setStatus] = useState<VPNStatus>({ connected: false });
  const [servers, setServers] = useState<VPNServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    // Load servers
    VPNService.getServers().then((data: { servers: any; }) => {
      setServers(data.servers || []);
    });

    // Load initial status
    VPNService.getStatus().then(setStatus);

    // Listen to status changes
    const statusListener = VPNService.addEventListener('vpn-status-changed', (newStatus) => {
      setStatus(newStatus);
    });

    // Listen to errors
    const errorListener = VPNService.addEventListener('vpn-error', (error) => {
      console.error('VPN Error:', error);
      alert('VPN Error: ' + error.message);
    });

    return () => {
      statusListener?.remove();
      errorListener?.remove();
    };
  }, []);

  const handleConnect = async () => {
    if (!selectedServer) return;

    setLoading(true);
    try {
      await VPNService.connect(selectedServer);
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await VPNService.disconnect();
    } catch (error) {
      console.error('Disconnection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-mobile">
      {/* Status Display */}
      <div className={`status-badge ${status.connected ? 'connected' : 'disconnected'}`}>
        {status.connected ? '🔒 Connected' : '🔓 Disconnected'}
      </div>

      {status.connected && status.ipAddress && (
        <div className="ip-display">
          <p>Your IP: {status.ipAddress}</p>
        </div>
      )}

      {/* Server Selection */}
      <div className="server-picker">
        <h3>Choose Server</h3>
        <select
          value={selectedServer}
          onChange={(e) => setSelectedServer(e.target.value)}
          disabled={status.connected || loading}
        >
          <option value="">Select a VPN server...</option>
          {servers.map((server) => (
            <option key={server.id} value={server.id}>
              {server.name} ({server.country})
            </option>
          ))}
        </select>
      </div>

      {/* Action Button */}
      <button
        className={`action-btn ${status.connected ? 'disconnect' : 'connect'}`}
        onClick={status.connected ? handleDisconnect : handleConnect}
        disabled={(!status.connected && !selectedServer) || loading}
      >
        {loading ? 'Processing...' : status.connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
};

export default DashboardMobile;
