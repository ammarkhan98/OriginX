# Migration Guide

## From Old Stack to New Stack

### Old Stack
- Electron + React (all-in-one)
- TypeScript for all logic
- Direct OpenVPN spawning from Node.js
- IPC only for window management

### New Stack
- **Backend**: C++ for VPN engine
- **Desktop**: Electron + React for UI
- **Mobile**: React Native with native VPN modules
- **Communication**: IPC via HTTP/REST with JSON

## Migration Steps

### 1. Move VPN Logic to C++

**Before (TypeScript):**
```typescript
async connect(serverId: string) {
  const openvpnProcess = spawn('openvpn', ['--config', configPath]);
}
```

**After (C++):**
```cpp
bool VPNEngine::connect(const std::string& serverId) {
  // Implementation
}
```

### 2. Update Electron Main Process

**Before:**
```typescript
const vpnManager = new VPNManager();
// Direct access to VPN logic
```

**After:**
```typescript
// Start C++ backend
const backendProcess = spawn('vpn_engine_backend', [port]);
// Communicate via HTTP
await axios.post('http://localhost:9999/vpn/connect', {serverId});
```

### 3. Update React Components

**Before:**
```typescript
const vpnManager = require('vpnManager');
const result = await vpnManager.connect(serverId);
```

**After:**
```typescript
const result = await window.electron.vpn.connect(serverId);
```

### 4. Add Mobile Support

Create React Native project with native VPN modules for iOS/Android.

## File Migration

### Existing Files
- `src/services/vpnManager.ts` → `backend/cpp/src/vpn_engine.cpp`
- `src/main.ts` → `desktop/electron-react/main.ts` (refactored)
- `src/pages/Dashboard.tsx` → `desktop/electron-react/src/pages/Dashboard.tsx`
- `src/pages/Settings.tsx` → `desktop/electron-react/src/pages/Settings.tsx`
- `src/pages/Logs.tsx` → `desktop/electron-react/src/pages/Logs.tsx`

### New Files
- `backend/cpp/include/vpn_engine.h`
- `backend/cpp/include/ipc_bridge.h`
- `backend/cpp/CMakeLists.txt`
- `mobile/react-native/VPNService.ts`
- `mobile/react-native/ios/VPNModule.swift`
- `mobile/react-native/android/VPNModule.java`

## Configuration Changes

Update `openvpn-configs/` path references in C++ code to match your deployment structure.

## Testing

### Test Backend
```cpp
./vpn_engine_backend 9999
curl http://localhost:9999/health
```

### Test Desktop IPC
```javascript
window.electron.vpn.getStatus()
```

### Test Mobile
```javascript
VPNService.connect('us-ny')
```

## Deployment Checklist

- [ ] C++ backend compiled for all platforms (macOS, Windows, Linux)
- [ ] Electron app packaged with backend binary
- [ ] React components updated to use new IPC API
- [ ] Mobile native modules compiled
- [ ] React Native app built for iOS and Android
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Version bumped (2.0.0)
- [ ] Release notes prepared
