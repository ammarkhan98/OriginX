# OriginX VPN

A modern, cross-platform VPN application built with Electron and React, featuring OpenVPN support.

## Features

- ✨ **Cross-Platform**: Works on macOS and Windows
- 🔒 **Security**: Multiple encryption levels, kill switch protection
- 🗺️ **Server Selection**: Browse and connect to multiple VPN servers
- ⚡ **Performance Monitoring**: Real-time speed and connection stats
- 🔧 **Advanced Settings**: Encryption, protocol, DNS, and auto-connect options
- 📊 **Logging**: Complete activity logs for debugging and monitoring
- 🎨 **Modern UI**: Sleek dark theme with intuitive controls

## Project Structure

```
OriginX/
├── src/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # IPC bridge
│   ├── services/
│   │   └── vpnManager.ts    # VPN connection logic
│   ├── pages/
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── Settings.tsx     # Settings page
│   │   └── Logs.tsx         # Activity logs
│   ├── App.tsx              # Main app component
│   ├── index.tsx            # React entry point
│   └── index.css            # Global styles
├── public/
│   └── index.html           # HTML template
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript config
```

## Prerequisites

- Node.js 16+
- npm or yarn
- macOS 10.10+ or Windows 7+

## Installation

1. Install dependencies:

```bash
npm install
```

2. For macOS, you'll need OpenVPN installed:

```bash
brew install openvpn
```

3. For Windows, download OpenVPN from [openvpn.net](https://openvpn.net)

## Development

Start the development server:

```bash
npm run dev
```

This starts both the React dev server and Electron application.

## Building

### Development Build

```bash
npm run pack
```

### Production Build

```bash
npm run dist
```

This creates installers for macOS (.dmg) and Windows (.exe).

## Technology Stack

- **Frontend**: React 18, TypeScript
- **Desktop**: Electron 27+
- **VPN**: OpenVPN
- **Styling**: CSS3
- **Build**: electron-builder

## Architecture

### Main Process (Electron)

- Manages application lifecycle
- Handles system integration
- Provides IPC bridge to renderer

### VPN Manager

- Manages OpenVPN connections
- Tracks connection state and statistics
- Handles settings persistence
- Maintains activity logs

### UI (React)

- **Dashboard**: Connection status and server selection
- **Settings**: Configuration for encryption, protocol, DNS
- **Logs**: Real-time activity monitoring

## OpenVPN Integration

The app communicates with OpenVPN via command-line interface. On macOS, it uses the system OpenVPN binary. On Windows, it expects OpenVPN to be installed in the default location.

## License

MIT
