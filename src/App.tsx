import React from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Logs from './pages/Logs';

type PageType = 'dashboard' | 'settings' | 'logs';

function App() {
  const [currentPage, setCurrentPage] = React.useState<PageType>('dashboard');

  return (
    <div className="App">
      <aside className="sidebar">
        <div className="logo">
          <h1>OriginX</h1>
          <p>VPN</p>
        </div>
        <nav className="nav-menu">
          <button
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <span className="icon">⚡</span>
            Dashboard
          </button>
          <button
            className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentPage('settings')}
          >
            <span className="icon">⚙️</span>
            Settings
          </button>
          <button
            className={`nav-item ${currentPage === 'logs' ? 'active' : ''}`}
            onClick={() => setCurrentPage('logs')}
          >
            <span className="icon">📋</span>
            Logs
          </button>
        </nav>
      </aside>

      <main className="main-content">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'settings' && <Settings />}
        {currentPage === 'logs' && <Logs />}
      </main>
    </div>
  );
}

export default App;
