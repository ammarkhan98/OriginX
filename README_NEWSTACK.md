# OriginX VPN 2.0

A modern, cross-platform VPN application with a revolutionary tech stack combining C++ backend, Electron + React desktop UI, and React Native mobile apps.

## 🚀 Features

- ✨ **Multi-Platform**: macOS, Windows, iOS, and Android
- 🔒 **Secure Backend**: C++ engine with isolated IPC communication
- 🎨 **Modern UI**: React-based responsive interface
- 📱 **Native Mobile**: React Native with native VPN modules
- 🌍 **Global Servers**: Connect to VPN servers worldwide
- ⚡ **Performance**: Compiled C++ backend for optimal speed
- 🛡️ **Security Features**: Kill switch, encryption levels, DNS control
- 📊 **Monitoring**: Real-time speed and connection statistics
- 📝 **Logging**: Detailed activity logs for debugging

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│              OriginX VPN 2.0                    │
├─────────────────────────────────────────────────┤
│ Desktop (Electron + React) │ Mobile (React Native)
│     │                       │         │
│     └─── HTTP IPC ──────────┼─────────┘
│                             │
│                      ┌──────▼──────┐
│                      │  C++ Backend │
│                      │  (9999)      │
│                      └──────┬───────┘
│                             │
│                      ┌──────▼───────────┐
│                      │  OpenVPN Engine  │
│                      │  & VPN Logic     │
│                      └──────────────────┘
```

**Three-Layer Architecture:**
1. **Frontend Layer**: React (Desktop) + React Native (Mobile)
2. **IPC Layer**: HTTP/REST with JSON communication
3. **Backend Layer**: C++ VPN engine with OpenVPN integration

For detailed architecture, see [ARCHITECTURE.md](ARCHITECTURE.md)

## 📁 Project Structure

```
OriginX/
├── backend/
│   └── cpp/                         # C++ VPN Engine
│       ├── include/                 # Header files
│       ├── src/                     # Implementation
│       ├── CMakeLists.txt          # Build configuration
│       └── package.json
├── desktop/
│   └── electron-react/              # Desktop Application
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── mobile/
│   └── react-native/                # Mobile Application
│       ├── ios/                     # iOS native modules
│       ├── android/                 # Android native modules
│       └── package.json
├── ARCHITECTURE.md                  # Detailed architecture
├── ARCHITECTURE_DIAGRAM.md          # Visual diagrams
├── BUILD.md                         # Build instructions
├── MIGRATION.md                     # Migration guide
└── openvpn-configs/                 # VPN server configurations
```

## 🚀 Quick Start

### Backend Development

```bash
cd backend/cpp
npm run build
./build/vpn_engine_backend 9999
```

### Desktop Development

```bash
cd desktop/electron-react
npm install
npm run dev
```

### Mobile Development (iOS)

```bash
cd mobile/react-native
npm install
npm run ios
```

### Mobile Development (Android)

```bash
cd mobile/react-native
npm install
npm run android
```

## 📦 Building

See [BUILD.md](BUILD.md) for detailed build instructions for all platforms.

### Quick build all platforms:

```bash
# Build backend
cd backend/cpp && npm run build && cd ../..

# Build desktop
cd desktop/electron-react && npm run dist && cd ../..

# Build mobile (iOS)
cd mobile/react-native && npm run build-ios && cd ../..

# Build mobile (Android)
cd mobile/react-native && npm run build-android && cd ../..
```

## 🔌 IPC API

Communication between frontend and backend happens via REST API:

### Endpoints

```
POST   /vpn/connect              # Connect to VPN server
POST   /vpn/disconnect           # Disconnect VPN
GET    /vpn/status               # Get current status
POST   /vpn/settings             # Update settings
GET    /vpn/servers              # Get available servers
GET    /vpn/logs                 # Get activity logs
POST   /vpn/killswitch           # Enable kill switch
POST   /vpn/test                 # Test connection speed
GET    /health                   # Health check
```

### Example Usage

**Desktop (JavaScript):**
```typescript
// Connect
await window.electron.vpn.connect('us-ny');

// Get status
const status = await window.electron.vpn.getStatus();

// Get servers
const servers = await window.electron.vpn.getServers();
```

**Mobile (React Native):**
```typescript
import { VPNService } from './VPNService';

// Connect
await VPNService.connect('us-ny');

// Listen to status changes
VPNService.addEventListener('vpn-status-changed', (status) => {
  console.log('VPN Status:', status);
});
```

## 🛠️ Tech Stack

### Backend
- **Language**: C++17
- **Build**: CMake 3.15+
- **JSON**: nlohmann/json
- **VPN**: OpenVPN
- **HTTP**: Native C++ (needs implementation)

### Desktop
- **Framework**: Electron 27+
- **UI**: React 18+
- **Language**: TypeScript 4.9+
- **HTTP Client**: Axios
- **Build**: react-scripts + tsc

### Mobile
- **Framework**: React Native 0.72+
- **iOS**: Swift with NetworkExtension
- **Android**: Java with Android VPN API
- **Build**: Metro + Gradle (Android) / Xcode (iOS)

## 🔒 Security

- **Process Isolation**: Backend runs in separate process
- **Context Isolation**: Electron renderer isolated from main process
- **No Node Integration**: Direct Node.js access disabled
- **IPC Communication**: Secure message passing via HTTP on localhost
- **Kill Switch**: Prevents data leaks if connection drops
- **Encryption**: Multiple encryption levels supported

## 📝 Migration from Old Stack

The project has been migrated from a monolithic Electron+React+TypeScript stack to a modern three-tier architecture.

**Key Changes:**
- VPN logic moved to C++ backend
- Electron now handles UI only
- React components refactored for new IPC API
- Mobile support added via React Native
- Native VPN modules for iOS and Android

See [MIGRATION.md](MIGRATION.md) for detailed migration guide.

## 🐛 Troubleshooting

### Backend won't start
- Check port 9999 is available: `lsof -i :9999`
- Ensure build succeeded: `cd backend/cpp && npm run build`
- Check permissions: `chmod +x backend/cpp/build/vpn_engine_backend`

### Desktop app can't connect to backend
- Verify backend is running on port 9999
- Check backend logs for errors
- Try restarting backend process

### Mobile app native modules missing
- **iOS**: Run `cd ios && pod install`
- **Android**: Run `cd android && ./gradlew clean`
- Ensure native code is properly registered

### VPN connection fails
- Check OpenVPN config files exist in `openvpn-configs/`
- Verify server ID in config filename matches connection request
- Check system permissions for VPN access

## 📚 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed architecture overview
- [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) - Visual diagrams and flows
- [BUILD.md](BUILD.md) - Complete build instructions
- [MIGRATION.md](MIGRATION.md) - Migration guide from v1 to v2

## 🤝 Contributing

When adding new features:

1. **For backend logic**: 
   - Implement in C++ (`backend/cpp/include/` and `src/`)
   - Add IPC handler in `ipc_bridge.cpp`
   - Add HTTP endpoint in `main.cpp`

2. **For desktop UI**:
   - Add React component in `desktop/electron-react/src/`
   - Use new IPC API via `window.electron.vpn`

3. **For mobile UI**:
   - Add React Native component in `mobile/react-native/`
   - Use unified `VPNService` API

4. **Testing**:
   - Test backend independently
   - Test desktop IPC handlers
   - Test mobile native modules

5. **Documentation**:
   - Update relevant docs
   - Add inline code comments
   - Update API documentation

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

## 👤 Author

OriginX VPN Team

## 🔗 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [C++ Reference](https://en.cppreference.com/)
- [CMake Documentation](https://cmake.org/documentation/)
- [OpenVPN Documentation](https://openvpn.net/community-resources/)

## 📞 Support

For issues, questions, or contributions:
1. Check existing issues on GitHub
2. Review documentation in this repository
3. Create detailed bug reports with reproduction steps

---

**Version**: 2.0.0  
**Last Updated**: February 2, 2026  
**Status**: In Development
