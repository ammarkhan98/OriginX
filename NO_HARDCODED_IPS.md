# OriginX VPN - Server Configuration System (No Hard-Coded IPs)

## Summary of Changes

You no longer need hard-coded IP addresses! ✅ 

This document summarizes the new flexible configuration system that allows you to manage VPN servers dynamically.

---

## What Was Changed

### ❌ Removed Hard-Coding

Previously, VPN servers were hard-coded in:
- `src/data/countries.ts` - Full list of servers with IPs

### ✅ New System

Now servers are loaded from:

1. **Remote API** (if configured) → `VPN_SERVERS_API_URL`
2. **Local JSON File** (default) → `src/config/servers.json`
3. **Hard-coded Defaults** (fallback only)

---

## New Files Created

### 1. Configuration Manager
📁 **`src/services/ServerConfigManager.ts`**
- Intelligent configuration loader
- Supports multiple data sources
- Caching and refresh logic
- Server filtering methods

### 2. Configuration Files
📁 **`src/config/servers.json`**
- Local server definitions
- Easy to update
- Git-friendly

📁 **`.env`**
- Environment variables
- Configuration URLs
- Backend settings

📁 **`.env.example`**
- Template for setup

### 3. Documentation
📄 **`SERVER_CONFIGURATION.md`** (Full detailed guide)

### 4. Backend API Server
📁 **`backend-api.ts`**
- Express.js REST API
- Server CRUD operations
- Filtering/sorting endpoints

---

## How It Works

### Priority Order

```
1. Remote API (VPN_SERVERS_API_URL)
   ↓ (if fails)
2. Local JSON (src/config/servers.json)
   ↓ (if fails)
3. Hard-coded Defaults
```

### Configuration Flow

```
┌─────────────────────────────────────────┐
│  App Start / Initialize VPNManager       │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  ServerConfigManager.loadServers()      │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        ↓             ↓
  ┌──────────┐  ┌──────────────┐
  │ Remote   │  │ Local JSON   │
  │ API?     │→ │ Config?      │→ Hard-coded
  └──────────┘  └──────────────┘
        ↓             ↓
        └─────┬───────┘
              ↓
     ┌──────────────────────┐
     │  Return Servers List │
     └──────────────────────┘
```

---

## Usage

### Initialize VPN Manager

```typescript
import { VPNManager } from './services/vpnManager';

const vpnManager = new VPNManager();
await vpnManager.initialize(); // Loads servers from config

const servers = vpnManager.getServers();
```

### Server Configuration File

Edit `src/config/servers.json`:

```json
{
  "servers": [
    {
      "id": "us-ny-1",
      "name": "United States - New York",
      "countryCode": "US",
      "city": "New York",
      "ip": "45.33.32.156",
      "protocol": "UDP",
      "load": 35,
      "ping": 12
    }
  ]
}
```

### Environment Variables

Create `.env`:

```bash
# Local config file
VPN_SERVERS_CONFIG_PATH=./src/config/servers.json

# OR remote API
VPN_SERVERS_API_URL=https://api.your-service.com/servers

# Backend
BACKEND_PORT=9999
REACT_APP_API_URL=http://localhost:9999

# VPN Settings
VPN_DNS_PRIMARY=8.8.8.8
```

---

## Examples

### Add a New Server

**Method 1: Edit JSON**

Edit `src/config/servers.json`:

```json
{
  "servers": [
    {
      "id": "de-berlin-1",
      "name": "Germany - Berlin",
      "countryCode": "DE",
      "city": "Berlin",
      "ip": "185.10.127.50",
      "protocol": "UDP",
      "load": 40,
      "ping": 95
    }
  ]
}
```

**Method 2: Use API**

```bash
curl -X POST http://localhost:9999/vpn/servers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "de-berlin-1",
    "name": "Germany - Berlin",
    "countryCode": "DE",
    "city": "Berlin",
    "ip": "185.10.127.50",
    "protocol": "UDP",
    "load": 40,
    "ping": 95
  }'
```

**Method 3: Code**

```typescript
import { serverConfigManager } from './services/ServerConfigManager';

serverConfigManager.addServer({
  id: "de-berlin-1",
  name: "Germany - Berlin",
  countryCode: "DE",
  city: "Berlin",
  ip: "185.10.127.50",
  protocol: "UDP",
  load: 40,
  ping: 95
});
```

### Get Servers

```typescript
// All servers
const servers = serverConfigManager.getServers();

// By country
const usServers = serverConfigManager.getServersByCountry('US');

// Least loaded
const fastServers = serverConfigManager.getServersByLoad();

// Lowest ping
const lowLatencyServers = serverConfigManager.getServersByPing();
```

### Get Specific Server

```bash
curl http://localhost:9999/vpn/servers/us-ny-1
```

### Remove Server

```bash
curl -X DELETE http://localhost:9999/vpn/servers/us-ny-1
```

---

## Server Configuration Options

### Local JSON (Recommended for Dev)

**Advantages:**
- ✅ Simple to update
- ✅ No external dependencies
- ✅ Version control friendly
- ✅ Works offline
- ✅ Fast loading

**Disadvantages:**
- ❌ Static (requires restart)
- ❌ Need to manage IPs manually

### Remote API (Recommended for Production)

**Advantages:**
- ✅ Dynamic updates
- ✅ Centralized management
- ✅ Can update without restart
- ✅ Real-time load data
- ✅ Easy to scale

**Disadvantages:**
- ❌ Requires external service
- ❌ Network dependency
- ❌ API failures possible

**API Endpoint Format:**

```json
{
  "servers": [
    {
      "id": "us-ny-1",
      "name": "United States - New York",
      "countryCode": "US",
      "city": "New York",
      "ip": "45.33.32.156",
      "protocol": "UDP",
      "load": 35,
      "ping": 12
    }
  ]
}
```

---

## Environment Setup

### Step 1: Create `.env` file

```bash
cp .env.example .env
```

### Step 2: Configure Servers Source

**Option A: Use Local Config (Development)**

```bash
VPN_SERVERS_CONFIG_PATH=./src/config/servers.json
# Uncomment to use remote API:
# VPN_SERVERS_API_URL=https://api.your-service.com/servers
```

**Option B: Use Remote API (Production)**

```bash
VPN_SERVERS_API_URL=https://api.your-vpn-service.com/servers
VPN_SERVERS_CONFIG_PATH=./src/config/servers.json  # Fallback
```

### Step 3: Update Servers

**For Local Config:**
- Edit `src/config/servers.json`
- Restart the app

**For Remote API:**
- Update your API
- Changes take effect on next refresh (automatic every hour)

---

## Backend API Server

### Optional: Run Separate API Server

```bash
# Install dependencies
npm install

# Run on port 9998
npx ts-node backend-api.ts 9998

# Or on custom port
npx ts-node backend-api.ts 8080
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/servers` | All servers |
| GET | `/servers/:id` | Get server |
| POST | `/servers` | Add server |
| PUT | `/servers/:id` | Update server |
| DELETE | `/servers/:id` | Delete server |
| POST | `/servers/bulk` | Add multiple |
| GET | `/servers/country/:code` | Filter by country |
| GET | `/servers/sort/load` | Sort by load |
| GET | `/servers/sort/ping` | Sort by ping |
| POST | `/servers/refresh` | Reload config |

---

## Troubleshooting

### Servers Not Loading

**Check:**
```typescript
const servers = serverConfigManager.getServers();
console.log('Loaded:', servers.length);
```

**View logs:**
```typescript
vpnManager.getLogs();
```

### Wrong Configuration File

**Set path:**
```bash
export VPN_SERVERS_CONFIG_PATH=/path/to/servers.json
```

### API Connection Failed

**Fallback to local:**
- Ensure `src/config/servers.json` exists
- System automatically uses it if API fails

### Manual Refresh

```typescript
await serverConfigManager.refreshFromRemote();
```

---

## Next Steps

1. ✅ Update `src/config/servers.json` with your server IPs
2. ✅ Test server loading with `vpnManager.getServers()`
3. ⏳ Set up remote API for dynamic server management (optional)
4. ⏳ Deploy to production with API endpoint

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/services/ServerConfigManager.ts` | Configuration loader |
| `src/services/vpnManager.ts` | VPN manager (updated) |
| `src/config/servers.json` | Server definitions |
| `.env` | Environment variables |
| `.env.example` | Setup template |
| `SERVER_CONFIGURATION.md` | Full documentation |
| `backend-api.ts` | Optional REST API |

---

## Security Notes

🔐 **Use HTTPS for remote APIs**
- Prevent man-in-the-middle attacks
- Keep IPs private

🔑 **API Authentication**
- Use API keys if needed
- Restrict access

📝 **Log Changes**
- Track who updates servers
- Audit trail

🛡️ **Validate Input**
- Check IP addresses
- Verify country codes

---

## Questions?

Refer to `SERVER_CONFIGURATION.md` for complete details.

