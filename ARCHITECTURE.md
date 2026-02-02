# OriginX VPN - New Tech Stack Architecture

## Overview

OriginX VPN has been restructured with a modern, scalable architecture using:
- **Backend**: C++ VPN Engine with secure IPC bridge
- **Desktop**: Electron + React UI
- **Mobile**: React Native with native VPN modules
- **Communication**: JSON-based IPC protocol

## Project Structure

```
OriginX/
├── backend/
│   └── cpp/                          # C++ VPN Engine
│       ├── include/
│       │   ├── vpn_engine.h         # Main VPN engine interface
│       │   └── ipc_bridge.h         # IPC communication bridge
│       ├── src/
│       │   ├── vpn_engine.cpp       # VPN engine implementation
│       │   ├── ipc_bridge.cpp       # IPC bridge implementation
│       │   └── main.cpp             # Backend entry point
│       ├── CMakeLists.txt           # CMake build configuration
│       └── package.json
│
├── desktop/
│   └── electron-react/              # Electron + React Desktop App
│       ├── src/
│       │   ├── main.ts              # Electron main process
│       │   ├── preload.ts           # IPC preload bridge
│       │   ├── App.tsx              # React app component
│       │   └── pages/
│       ├── package.json
│       └── tsconfig.json
│
└── mobile/
    └── react-native/                # React Native Mobile App
        ├── ios/                     # iOS native modules
        │   └── VPNModule.swift      # Native VPN implementation
        ├── android/                 # Android native modules
        │   └── VPNModule.java       # Native VPN implementation
        ├── VPNService.ts            # Unified VPN service
        ├── package.json
        └── app.tsx
```

## Architecture Layers

### 1. Backend Layer (C++)

The C++ backend handles all VPN operations and provides secure communication:

**vpn_engine.h / vpn_engine.cpp**
- Connection management (connect/disconnect)
- Settings management
- Server management
- Speed testing
- Kill switch functionality
- Logging system
- OpenVPN process management

**ipc_bridge.h / ipc_bridge.cpp**
- JSON-based message parsing
- Command routing
- Async callback handling
- Event emission

**Key Features:**
- Low-level OpenVPN integration
- Secure IPC communication
- Thread-safe operations
- Comprehensive logging

### 2. IPC Protocol

Communication between backend and UI happens via HTTP/REST and JSON:

**Request Format:**
```json
{
  "channel": "vpn:connect",
  "data": {
    "serverId": "us-ny"
  }
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Connected",
  "status": {
    "connected": true,
    "ipAddress": "1.2.3.4",
    "uploadSpeed": 45.2,
    "downloadSpeed": 89.5,
    "uptime": 3600
  }
}
```

**Available Channels:**
- `vpn:connect` - Connect to VPN server
- `vpn:disconnect` - Disconnect VPN
- `vpn:status` - Get current VPN status
- `vpn:settings` - Update VPN settings
- `vpn:servers` - Get list of servers
- `vpn:logs` - Get activity logs
- `vpn:killswitch` - Toggle kill switch
- `vpn:test` - Test connection speed

### 3. Desktop Layer (Electron + React)

**main.ts**
- Launches Electron window
- Starts C++ backend process
- Establishes IPC communication
- Manages process lifecycle

**preload.ts**
- Exposes secure electron API
- Provides context isolation
- Handles IPC invocation

**React Components**
- Dashboard - Connection status and quick connect
- Settings - VPN configuration
- Logs - Activity monitoring
- Server Selection - Choose VPN server

**IPC Handlers:**
```typescript
window.electron.vpn.connect(serverId)
window.electron.vpn.disconnect()
window.electron.vpn.getStatus()
window.electron.vpn.setSettings(settings)
window.electron.vpn.getServers()
window.electron.vpn.getLogs(count)
```

### 4. Mobile Layer (React Native)

**Native Modules:**
- **iOS (Swift):** VPNModule using NetworkExtension framework
- **Android (Java):** VPNModule using Android VPN APIs

**VPNService.ts** - Unified interface for both platforms:
```typescript
VPNService.connect(serverId)
VPNService.disconnect()
VPNService.getStatus()
VPNService.setSettings(settings)
VPNService.getServers()
VPNService.getLogs(count)
```

**Event Emitters:**
- `vpn-status-changed` - VPN status updates
- `vpn-error` - Connection errors
- `vpn-log` - Log entries

## Security Considerations

1. **Context Isolation**: Electron renderer process isolated from main process
2. **IPC Security**: Sensitive operations require explicit handlers
3. **Process Isolation**: Backend runs in separate process
4. **No Node Integration**: Direct Node.js access disabled in renderer
5. **HTTPS**: Consider HTTPS for IPC in production

## Building and Deployment

### Backend (C++)
```bash
cd backend/cpp
npm run build
# Generates: build/vpn_engine_backend
```

### Desktop
```bash
cd desktop/electron-react
npm install
npm run dist
# Generates: dist/OriginX VPN-x.x.x.dmg (macOS)
# Generates: dist/OriginX VPN Setup x.x.x.exe (Windows)
```

### Mobile - iOS
```bash
cd mobile/react-native
npm install
npm run build-ios
# Or use Xcode to build ios/OriginXVPN.xcworkspace
```

### Mobile - Android
```bash
cd mobile/react-native
npm install
npm run build-android
# Generates: android/app/build/outputs/apk/release/app-release.apk
```

## Development Workflow

### 1. Start Backend
```bash
cd backend/cpp/build
./vpn_engine_backend 9999
```

### 2. Start Desktop (in separate terminal)
```bash
cd desktop/electron-react
npm start
```

### 3. Start Mobile (in separate terminal)
```bash
cd mobile/react-native
npm start
# For iOS: npm run ios
# For Android: npm run android
```

## Dependencies

### Backend (C++)
- CMake 3.15+
- C++17 compiler
- nlohmann/json (auto-fetched)
- OpenVPN (external)

### Desktop
- Electron 27+
- React 18+
- TypeScript 4.9+
- Axios for HTTP

### Mobile
- React Native 0.72+
- iOS 12+ (for NetworkExtension)
- Android 8+ (API 26+)

## Future Enhancements

1. **Database**: Add SQLite for local storage
2. **Protocol Support**: Add WireGuard and others
3. **Encryption**: Implement stronger encryption protocols
4. **Analytics**: Add anonymous usage analytics
5. **Auto-Update**: Implement Electron auto-updater
6. **Cloud Sync**: Sync settings across devices
7. **VPN Chaining**: Support multiple VPN chains
8. **Split Tunneling**: App-specific routing

## Troubleshooting

### Backend fails to start
- Check port 9999 is available
- Ensure C++ build completed successfully
- Check logs in backend terminal

### IPC Communication fails
- Verify backend process is running
- Check BACKEND_URL in main.ts
- Review backend logs for errors

### Mobile native modules not recognized
- Run `cd ios && pod install` for iOS
- Run `cd android && ./gradlew clean` for Android
- Ensure native code is properly registered

## Contributing

When adding new VPN features:
1. Implement in C++ backend (vpn_engine.h/cpp)
2. Add IPC handler (ipc_bridge.h/cpp)
3. Add React component/hook (desktop)
4. Add React Native binding (mobile)
5. Update this documentation

## License

MIT License - See LICENSE file for details
