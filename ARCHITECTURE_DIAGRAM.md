# OriginX VPN - System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OriginX VPN System                                  │
└─────────────────────────────────────────────────────────────────────────────┘

                          ┌──────────────────────┐
                          │   User Devices       │
                          └──────────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
        ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
        │   macOS      │    │   Windows    │    │  iOS/Android │
        │   Desktop    │    │   Desktop    │    │   Mobile     │
        │              │    │              │    │              │
        │ Electron +   │    │ Electron +   │    │React Native  │
        │ React        │    │ React        │    │+ Native VPN  │
        └──────────────┘    └──────────────┘    └──────────────┘
                │                   │                   │
                └───────────────────┼───────────────────┘
                                    │
                        ┌───────────────────────┐
                        │   IPC Communication   │
                        │   (REST/JSON API)     │
                        └───────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │     HTTP Server Port 9999    │
                    └───────────────┬───────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
    ┌────────────┐            ┌────────────┐            ┌────────────┐
    │ /vpn/...   │            │ /vpn/...   │            │ /vpn/...   │
    │ Endpoints  │            │ Endpoints  │            │ Endpoints  │
    │            │            │            │            │            │
    │ connect    │            │ settings   │            │ logs       │
    │ disconnect │            │ servers    │            │ status     │
    └────────────┘            └────────────┘            └────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │   IPC Bridge (C++)            │
                    │   - Message routing           │
                    │   - JSON serialization        │
                    │   - Event callbacks           │
                    └───────────────┬───────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
    ┌────────────────┐      ┌────────────────┐      ┌──────────────────┐
    │  VPN Engine    │      │ OpenVPN        │      │ Settings         │
    │ (C++)          │◄────►│ Process        │      │ Management       │
    │                │      │ Management     │      │ & Storage        │
    │ • Connection   │      │                │      │                  │
    │ • Status       │      │ • Spawn/kill   │      │ • Encryption     │
    │ • Monitoring   │      │ • Config load  │      │ • DNS            │
    │ • Logging      │      │ • IPC bridge   │      │ • Kill switch    │
    └────────────────┘      └────────────────┘      └──────────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │   VPN Server Infrastructure   │
                    │   (External)                  │
                    │                               │
                    │ • OpenVPN config files        │
                    │ • Server IP database          │
                    │ • Geolocation service         │
                    │ • Speed test servers          │
                    └───────────────────────────────┘


## Communication Flow Example

### User connects to VPN server:

  1. User clicks "Connect" in UI (Desktop/Mobile)
         │
         ▼
  2. JavaScript sends HTTP POST to backend
     POST http://localhost:9999/vpn/connect
     { "serverId": "us-ny" }
         │
         ▼
  3. C++ IPC Bridge receives and routes message
     IPCBridge::handleConnect(data)
         │
         ▼
  4. VPN Engine processes connection
     VPNEngine::connect("us-ny")
         │
         ├─► Load OpenVPN config
         ├─► Spawn OpenVPN process
         ├─► Monitor connection status
         └─► Update status callback
         │
         ▼
  5. Status callback sent back to IPC Bridge
     statusCallback(newStatus)
         │
         ▼
  6. IPC Bridge sends HTTP response to UI
     HTTP 200 OK
     { "success": true, "status": { ... } }
         │
         ▼
  7. UI receives and updates display
     Dashboard shows "Connected to US (NY)"


## Data Flow Architecture

┌─────────────┐
│   User      │ (Click, Input)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  React UI   │ (Handle user interaction)
└──────┬──────┘
       │ HTTP POST/GET with JSON
       ▼
┌─────────────────────────────────┐
│  Electron IPC Handler           │ (Desktop only)
│  or Native Module Bridge        │ (Mobile)
└──────┬──────────────────────────┘
       │ HTTP to localhost:9999
       ▼
┌─────────────────────────────────┐
│  C++ HTTP Server                │
│  (IPC Bridge + VPN Engine)      │
└──────┬──────────────────────────┘
       │ Serialize JSON
       ▼
┌─────────────────────────────────┐
│  Command Handler                │
│  (e.g., handleConnect)          │
└──────┬──────────────────────────┘
       │ Execute C++ code
       ▼
┌─────────────────────────────────┐
│  VPN Engine Operations          │
│  (connect, disconnect, etc.)    │
└──────┬──────────────────────────┘
       │ System calls
       ▼
┌─────────────────────────────────┐
│  OpenVPN Process                │
│  (Actual VPN tunnel)            │
└─────────────────────────────────┘


## Security Layers

  ┌─────────────────────────────────────────┐
  │  UI Layer (React/React Native)          │  - User-facing
  │  (No direct system access)              │  - Controlled API
  └────────────┬────────────────────────────┘
               │ Secure IPC (localhost only)
  ┌────────────▼────────────────────────────┐
  │  Electron/Native Bridge                 │  - Process isolation
  │  (Context isolation enforced)           │  - No Node integration
  └────────────┬────────────────────────────┘
               │ HTTP to backend process
  ┌────────────▼────────────────────────────┐
  │  Backend Process (C++)                  │  - Separate process
  │  (Runs with elevated privileges)        │  - System-level VPN ops
  └────────────┬────────────────────────────┘
               │ Direct OpenVPN/system calls
  ┌────────────▼────────────────────────────┐
  │  System APIs (OpenVPN, Network)         │  - OS-level operations
  └─────────────────────────────────────────┘


## Deployment Architecture

Development:
  ┌─────────────────────────────────────────────┐
  │  npm run dev                                │
  │  ┌──────────────┐        ┌─────────────┐   │
  │  │ React Dev    │        │ C++ Backend │   │
  │  │ Server       │        │ (9999)      │   │
  │  │ Port 3000    │        │             │   │
  │  └──────────────┘        └─────────────┘   │
  │  ┌──────────────────────────────────────┐  │
  │  │ Electron Window                      │  │
  │  │ (Load from localhost:3000)           │  │
  │  └──────────────────────────────────────┘  │
  └─────────────────────────────────────────────┘

Production:
  ┌──────────────────────────────────────────────────┐
  │  App Bundle (Single folder)                      │
  │  ├── app/
  │  │   ├── index.html (React build)               │
  │  │   ├── main.js (Electron preload)             │
  │  │   └── resources/
  │  │       └── vpn_engine_backend (C++ binary)   │
  │  └── OriginX VPN.app (macOS) or .exe (Windows) │
  └──────────────────────────────────────────────────┘
```

## Key Benefits of This Architecture

1. **Separation of Concerns**
   - UI logic in React/React Native
   - System-level VPN operations in C++
   - Clear interface via IPC

2. **Security**
   - Backend runs in isolated process
   - No direct Node.js access from renderer
   - Minimal attack surface

3. **Performance**
   - C++ backend is fast
   - No JavaScript overhead for VPN operations
   - Async IPC doesn't block UI

4. **Cross-Platform**
   - Same C++ backend on macOS, Windows, Linux
   - Same React UI across platforms
   - Platform-specific native modules for mobile

5. **Maintainability**
   - Clear module boundaries
   - Easier to test components independently
   - Straightforward to add new features

6. **Scalability**
   - Can add new platforms (CLI, web dashboard) by just adding new frontends
   - Backend remains unchanged
   - IPC protocol is language-agnostic (can implement in any language)
