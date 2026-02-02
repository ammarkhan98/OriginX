# OriginX VPN 2.0 - Tech Stack Quick Reference

## 🎯 Quick Overview

| Component | Old Stack | New Stack |
|-----------|-----------|-----------|
| **VPN Engine** | TypeScript (Node.js) | C++ |
| **Desktop UI** | Electron + React | Electron + React |
| **Mobile UI** | ❌ Not available | React Native |
| **Communication** | Direct imports | HTTP REST / IPC |
| **Backend Process** | Integrated | Separate (port 9999) |
| **Performance** | Good | Excellent |
| **Security** | Medium | High |
| **Maintainability** | Monolithic | Modular |

## 🚀 Getting Started (All Platforms)

### 1. Clone & Install
```bash
cd /Users/ammarkhan/Documents/VSCode\ Projects/OriginX

# Backend
cd backend/cpp && npm install

# Desktop
cd ../../desktop/electron-react && npm install

# Mobile
cd ../../mobile/react-native && npm install
```

### 2. Start Development
```bash
# Terminal 1: Backend
cd backend/cpp/build && ./vpn_engine_backend 9999

# Terminal 2: Desktop
cd desktop/electron-react && npm run dev

# Terminal 3: Mobile (iOS)
cd mobile/react-native && npm run ios

# Or Mobile (Android)
cd mobile/react-native && npm run android
```

### 3. Build for Production
```bash
# Desktop
cd desktop/electron-react && npm run dist

# Mobile iOS
cd mobile/react-native && npm run build-ios

# Mobile Android
cd mobile/react-native && npm run build-android
```

## 🔌 IPC API Cheat Sheet

### Desktop Usage
```typescript
// Connect to server
await window.electron.vpn.connect('us-ny');

// Disconnect
await window.electron.vpn.disconnect();

// Get status
const status = await window.electron.vpn.getStatus();

// Get servers
const servers = await window.electron.vpn.getServers();

// Update settings
await window.electron.vpn.setSettings({
  killSwitch: true,
  encryptionLevel: 'high',
  protocol: 'UDP',
  dns: '8.8.8.8'
});

// Get logs
const logs = await window.electron.vpn.getLogs(50);
```

### Mobile Usage
```typescript
import { VPNService } from './VPNService';

// Connect
await VPNService.connect('us-ny');

// Disconnect
await VPNService.disconnect();

// Get status
const status = await VPNService.getStatus();

// Listen to events
VPNService.addEventListener('vpn-status-changed', (status) => {
  console.log('Status changed:', status);
});

VPNService.addEventListener('vpn-error', (error) => {
  console.error('VPN Error:', error);
});

VPNService.addEventListener('vpn-log', (log) => {
  console.log('Log:', log);
});
```

## 📂 File Structure Quick Guide

```
backend/cpp/
├── include/vpn_engine.h        ← Main VPN interface
├── include/ipc_bridge.h        ← IPC message handling
├── src/vpn_engine.cpp          ← VPN implementation
├── src/ipc_bridge.cpp          ← IPC implementation
├── src/main.cpp                ← HTTP server entry
└── CMakeLists.txt              ← Build config

desktop/electron-react/
├── src/main.ts                 ← Electron main process
├── src/preload.ts              ← IPC bridge
├── src/App.tsx                 ← React root
└── src/pages/
    ├── Dashboard.tsx           ← Connection UI
    ├── Settings.tsx            ← Configuration
    └── Logs.tsx                ← Activity logs

mobile/react-native/
├── ios/VPNModule.swift         ← iOS native module
├── android/VPNModule.java      ← Android native module
├── VPNService.ts               ← Unified interface
└── app.tsx                     ← React Native root
```

## 🔄 Data Flow Examples

### Connect to VPN
```
User clicks "Connect"
    ↓
React calls window.electron.vpn.connect('us-ny')
    ↓
Electron IPC handler processes request
    ↓
HTTP POST to localhost:9999/vpn/connect
    ↓
C++ IPC Bridge routes to VPNEngine::connect()
    ↓
VPNEngine spawns OpenVPN process with config
    ↓
Status callback fires → HTTP response
    ↓
Electron receives response
    ↓
React updates UI with new status
```

### Mobile Connect
```
User taps "Connect"
    ↓
React Native calls VPNService.connect('us-ny')
    ↓
Native bridge (Swift/Java) invokes native VPN API
    ↓
iOS VPNModule or Android VPNModule handles connection
    ↓
Event emitted: 'vpn-status-changed'
    ↓
React Native listener updates UI
```

## 🛠️ Common Commands

### Backend
```bash
cd backend/cpp

npm run build                # Build C++ code
npm run rebuild             # Clean and rebuild
npm run clean               # Remove build files
```

### Desktop
```bash
cd desktop/electron-react

npm install                 # Install dependencies
npm run dev                 # Start dev (React + Electron)
npm run dev-react          # Start React dev server only
npm run build-electron     # Compile TypeScript
npm run dist               # Create installer/bundle
npm run test               # Run tests
```

### Mobile
```bash
cd mobile/react-native

npm install                # Install dependencies

# iOS
npm run ios               # Run on iOS simulator
npm run build-ios         # Build iOS app

# Android
npm run android           # Run on Android emulator
npm run build-android     # Build Android APK
npm start                 # Start Metro bundler
```

## 🔒 Security Reminders

✅ **DO:**
- Keep backend process running separately
- Use context isolation in Electron
- Validate all IPC messages
- Handle errors gracefully
- Keep dependencies updated

❌ **DON'T:**
- Expose backend HTTP endpoint publicly
- Enable Node integration in Electron renderer
- Pass sensitive data in URLs
- Store credentials in plaintext
- Run backend with elevated privileges unnecessarily

## 🐛 Debug Tips

### Backend Debugging
```bash
# Start with verbose logging
cd backend/cpp/build
./vpn_engine_backend 9999 --verbose

# Test API endpoint
curl http://localhost:9999/health
curl http://localhost:9999/vpn/status
```

### Desktop Debugging
```bash
# Enable Electron dev tools (already enabled in dev mode)
# Check console for errors
mainWindow.webContents.openDevTools();

# Check IPC communication
console.log('Calling IPC:', window.electron.vpn.getStatus());
```

### Mobile Debugging
```bash
# Enable React Native dev menu
# Android: Shake device or press MENU
# iOS: Shake device or Ctrl+Cmd+Z

# Check native module logs in Xcode/Android Studio
```

## 📊 Performance Targets

- Backend response: < 50ms
- UI update: < 100ms
- Desktop app startup: < 3s
- Mobile app startup: < 2s
- VPN connection: < 5s

## 🎓 Learning Resources

### For C++ Backend
- [Modern C++ Best Practices](https://en.cppreference.com/)
- [CMake Tutorial](https://cmake.org/cmake-tutorial/)
- [nlohmann JSON library](https://github.com/nlohmann/json)

### For Electron + React
- [Electron Security](https://www.electronjs.org/docs/tutorial/security)
- [React Hooks](https://react.dev/reference/react/hooks)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### For React Native
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Native Modules (iOS)](https://reactnative.dev/docs/native-modules-ios)
- [Native Modules (Android)](https://reactnative.dev/docs/native-modules-android)

## ✅ Checklist for New Feature

- [ ] Implemented in C++ backend
- [ ] Added IPC handler
- [ ] Created HTTP endpoint
- [ ] Updated Electron IPC handler
- [ ] Added React component
- [ ] Added React Native component
- [ ] Tested on desktop
- [ ] Tested on iOS
- [ ] Tested on Android
- [ ] Updated documentation
- [ ] Added error handling

## 📞 Support Resources

1. **Documentation**: See README_NEWSTACK.md, ARCHITECTURE.md, BUILD.md
2. **Diagrams**: See ARCHITECTURE_DIAGRAM.md
3. **Migration Help**: See MIGRATION.md
4. **GitHub Issues**: Check for similar problems
5. **Stack Overflow**: Tag with `electron`, `react-native`, `c++`

## 🚀 Next Steps

1. Review [README_NEWSTACK.md](README_NEWSTACK.md) for full overview
2. Check [ARCHITECTURE.md](ARCHITECTURE.md) for detailed design
3. Read [BUILD.md](BUILD.md) for build instructions
4. Start with backend: `cd backend/cpp && npm run build`
5. Then desktop: `cd desktop/electron-react && npm run dev`
6. Finally mobile when ready

---

**Last Updated**: February 2, 2026  
**Version**: 2.0.0  
**Status**: Ready for Development
