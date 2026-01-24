import React, { useState, useEffect } from 'react';
import './Settings.css';

interface VPNSettings {
  killSwitch: boolean;
  encryptionLevel: 'low' | 'medium' | 'high';
  protocol: 'UDP' | 'TCP';
  dns: string;
  autoConnect: boolean;
}

declare global {
  interface Window {
    vpnAPI: any;
  }
}

export default function Settings() {
  const [settings, setSettings] = useState<VPNSettings>({
    killSwitch: false,
    encryptionLevel: 'high',
    protocol: 'UDP',
    dns: '8.8.8.8',
    autoConnect: false,
  });

  const [saved, setSaved] = useState(false);

  const handleKillSwitchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setSettings({ ...settings, killSwitch: newValue });
    await window.vpnAPI.setKillSwitch(newValue);
    showSavedMessage();
  };

  const handleEncryptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({
      ...settings,
      encryptionLevel: e.target.value as 'low' | 'medium' | 'high',
    });
  };

  const handleProtocolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({
      ...settings,
      protocol: e.target.value as 'UDP' | 'TCP',
    });
  };

  const handleDnsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, dns: e.target.value });
  };

  const handleAutoConnectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, autoConnect: e.target.checked });
  };

  const handleSave = async () => {
    try {
      await window.vpnAPI.updateSettings(settings);
      showSavedMessage();
    } catch (error) {
      alert('Failed to save settings: ' + (error as Error).message);
    }
  };

  const showSavedMessage = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>VPN Settings</h1>
        {saved && <div className="saved-message">✓ Settings saved</div>}
      </div>

      <div className="settings-group">
        <h2>Security</h2>

        <div className="setting-item">
          <div className="setting-label">
            <label>Kill Switch</label>
            <p className="setting-desc">
              Disconnect from internet if VPN connection drops
            </p>
          </div>
          <div className="setting-control">
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.killSwitch}
                onChange={handleKillSwitchChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <label>Auto-Connect</label>
            <p className="setting-desc">
              Automatically connect to VPN on startup
            </p>
          </div>
          <div className="setting-control">
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.autoConnect}
                onChange={handleAutoConnectChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h2>Connection</h2>

        <div className="setting-item">
          <div className="setting-label">
            <label>Encryption Level</label>
            <p className="setting-desc">
              Higher encryption = slower speeds but more security
            </p>
          </div>
          <div className="setting-control">
            <select
              value={settings.encryptionLevel}
              onChange={handleEncryptionChange}
            >
              <option value="low">Low (256-bit)</option>
              <option value="medium">Medium (384-bit)</option>
              <option value="high">High (256-bit AES-GCM)</option>
            </select>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <label>Protocol</label>
            <p className="setting-desc">
              UDP is faster, TCP is more stable
            </p>
          </div>
          <div className="setting-control">
            <select
              value={settings.protocol}
              onChange={handleProtocolChange}
            >
              <option value="UDP">UDP</option>
              <option value="TCP">TCP</option>
            </select>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <label>DNS Server</label>
            <p className="setting-desc">
              Custom DNS for enhanced privacy
            </p>
          </div>
          <div className="setting-control">
            <input
              type="text"
              value={settings.dns}
              onChange={handleDnsChange}
              placeholder="8.8.8.8"
            />
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button className="btn btn-primary" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  );
}
