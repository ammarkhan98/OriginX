# Build Instructions

## Prerequisites

### macOS
```bash
# Install Xcode command line tools
xcode-select --install

# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install cmake node
```

### Windows
- Install Visual Studio Build Tools (C++ build tools)
- Install CMake from https://cmake.org/download/
- Install Node.js from https://nodejs.org/

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install build-essential cmake nodejs npm
```

## Backend Build (C++)

### 1. Install CMake and dependencies
```bash
cd /Users/ammarkhan/Documents/VSCode\ Projects/OriginX/backend/cpp
```

### 2. Build
```bash
npm run build
# This runs: mkdir -p build && cd build && cmake .. && make
```

### 3. Output
- Binary: `build/vpn_engine_backend`
- Library: `build/libvpn_engine.a`

### 4. Test
```bash
./build/vpn_engine_backend 9999
# Server running on port 9999
```

## Desktop Build (Electron + React)

### 1. Install dependencies
```bash
cd /Users/ammarkhan/Documents/VSCode\ Projects/OriginX/desktop/electron-react
npm install
```

### 2. Development mode
```bash
npm run dev
# Starts React on port 3000 and Electron main process
```

### 3. Production build
```bash
npm run build
npm run build-electron
npm run dist
# Creates: dist/OriginX VPN-2.0.0.dmg (macOS)
#         dist/OriginX VPN Setup 2.0.0.exe (Windows)
```

## Mobile Build

### iOS

#### Prerequisites
```bash
# Install CocoaPods
sudo gem install cocoapods

# Install Xcode from App Store
```

#### Build
```bash
cd /Users/ammarkhan/Documents/VSCode\ Projects/OriginX/mobile/react-native

# Install dependencies
npm install
cd ios
pod install
cd ..

# Build via Xcode
npm run build-ios

# Or manually in Xcode
open ios/OriginXVPN.xcworkspace
```

### Android

#### Prerequisites
```bash
# Install Android Studio and SDK

# Set environment variables
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
```

#### Build
```bash
cd /Users/ammarkhan/Documents/VSCode\ Projects/OriginX/mobile/react-native
npm install

# Build APK
npm run build-android

# Output: android/app/build/outputs/apk/release/app-release.apk
```

## Complete Build Pipeline

### Build Everything (Recommended)
```bash
# 1. Build backend
cd backend/cpp
npm run build
cd ../..

# 2. Build desktop
cd desktop/electron-react
npm run dist
cd ../..

# 3. Build mobile (iOS)
cd mobile/react-native
npm run build-ios
cd ../..

# 4. Build mobile (Android)
cd mobile/react-native
npm run build-android
cd ../..
```

## Rebuild & Clean

### Clean everything
```bash
cd backend/cpp && npm run clean
cd ../desktop/electron-react && npm run build && rm -rf build dist
cd ../mobile/react-native && rm -rf node_modules build
```

### Rebuild from scratch
```bash
cd backend/cpp && npm run rebuild
```

## Troubleshooting

### Backend build fails
```bash
# Check CMake is installed
cmake --version

# Check C++ compiler
clang++ --version  # macOS
g++ --version      # Linux

# Try verbose build
cd backend/cpp/build
cmake -DCMAKE_BUILD_TYPE=Debug ..
make VERBOSE=1
```

### Electron app won't start backend
```bash
# Check if port 9999 is available
lsof -i :9999

# Check backend binary exists
ls -la backend/cpp/build/vpn_engine_backend

# Check permissions
chmod +x backend/cpp/build/vpn_engine_backend
```

### React Native build fails (iOS)
```bash
cd ios
rm -rf Pods
pod install
cd ..
npm run build-ios
```

### React Native build fails (Android)
```bash
cd android
./gradlew clean
./gradlew build
cd ..
npm run build-android
```

## Docker Build (Optional)

For cross-platform builds, use Docker:

```dockerfile
FROM node:18
RUN apt-get update && apt-get install -y build-essential cmake

WORKDIR /app
COPY . .

# Build backend
WORKDIR /app/backend/cpp
RUN npm run build

# Build desktop
WORKDIR /app/desktop/electron-react
RUN npm install
RUN npm run build
RUN npm run build-electron
RUN npm run dist

CMD ["ls", "-la", "dist/"]
```

Build with Docker:
```bash
docker build -t originx-builder .
docker run --rm -v $(pwd)/dist:/app/dist originx-builder
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build backend
        run: cd backend/cpp && npm run build
      
      - name: Build desktop
        run: cd desktop/electron-react && npm run dist
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-build
          path: desktop/electron-react/dist/
```

## Size Optimization

### Desktop App Size
- Uncompressed: ~500MB
- Compressed: ~150-200MB (with asar)

To reduce size:
```bash
# Use electron-builder compression
electron-builder --config.asarUnpack='["node_modules/**"]'

# Remove dev dependencies in production
npm prune --production
```

### Mobile App Size
- iOS: 80-120MB
- Android: 100-150MB

## Performance

### Backend
- Compiled C++ code is fast (1-5ms per operation)
- IPC communication adds ~10-20ms overhead

### Desktop
- React hot reload: ~1-2s
- Full rebuild: ~30s

### Mobile
- Metro bundler: ~5-10s
- Debug APK: ~2 minutes
- Release APK: ~3 minutes

---

For more details, see [ARCHITECTURE.md](ARCHITECTURE.md)
