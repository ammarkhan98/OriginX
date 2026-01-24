import React, { useState, useEffect } from 'react';
import './Logs.css';

declare global {
  interface Window {
    vpnAPI: any;
  }
}

export default function Logs() {
  const [logs, setLogs] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const loadLogs = async () => {
    try {
      const logList = await window.vpnAPI.getLogs();
      setLogs(logList);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const clearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs?')) {
      setLogs([]);
    }
  };

  const downloadLogs = () => {
    const content = logs.join('\n');
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `vpn-logs-${Date.now()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="logs">
      <div className="logs-header">
        <h1>VPN Logs</h1>
        <div className="logs-controls">
          <label className="auto-scroll">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Auto-scroll
          </label>
          <button className="btn btn-secondary" onClick={downloadLogs}>
            Download
          </button>
          <button className="btn btn-danger" onClick={clearLogs}>
            Clear
          </button>
        </div>
      </div>

      <div className="logs-container">
        <div className="logs-content">
          {logs.length === 0 ? (
            <div className="logs-empty">No logs yet</div>
          ) : (
            <>
              {logs.map((log, index) => (
                <div key={index} className="log-line">
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </>
          )}
        </div>
      </div>

      <div className="logs-footer">
        <span className="log-count">{logs.length} entries</span>
      </div>
    </div>
  );
}
