# Quick Reference: No Hard-Coded IPs

## 🎯 What Changed?

VPN server IP addresses are **NO LONGER HARD-CODED**. They're now loaded dynamically from configuration files or APIs.

---

## 🚀 Quick Start

### 1. Edit Server List (Easiest)

Edit `src/config/servers.json`:

```json
{
  "servers": [
    {
      "id": "us-ny-1",
      "name": "United States - New York",
      "countryCode": "US",
      "city": "New York",
      "ip": "YOUR_IP_ADDRESS_HERE",
      "protocol": "UDP",
      "load": 35,
      "ping": 12
    }
  ]
}
```

### 2. Restart App

The servers will be automatically loaded from the JSON file.

### 3. That's It! ✅

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/config/servers.json` | Your VPN server list |
| `.env` | Configuration settings |
| `src/services/ServerConfigManager.ts` | Handles loading servers |
| `SERVER_CONFIGURATION.md` | Full documentation |

---

## 🔧 Configuration Options

### Option 1: Local JSON (Development)

**File:** `src/config/servers.json`

```bash
VPN_SERVERS_CONFIG_PATH=./src/config/servers.json
```

### Option 2: Remote API (Production)

**Set in `.env`:**

```bash
VPN_SERVERS_API_URL=https://api.your-service.com/servers
```

**Your API should return:**

```json
{
  "servers": [
    {
      "id": "us-ny-1",
      "name": "US - NY",
      "countryCode": "US",
      "city": "New York",
      "ip": "1.2.3.4",
      "protocol": "UDP",
      "load": 35,
      "ping": 12
    }
  ]
}
```

---

## 🎮 Add Server (3 Methods)

### Method 1: JSON File

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

### Method 2: REST API

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

### Method 3: Code

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

---

## 📊 Query Servers

```bash
# All servers
curl http://localhost:9999/vpn/servers

# Specific server
curl http://localhost:9999/vpn/servers/us-ny-1

# By country
curl http://localhost:9999/vpn/servers/country/US

# Sorted by load (best first)
curl http://localhost:9999/vpn/servers/sort/load

# Sorted by ping (fastest first)
curl http://localhost:9999/vpn/servers/sort/ping
```

---

## ✏️ Update Server

**REST API:**

```bash
curl -X PUT http://localhost:9999/vpn/servers/us-ny-1 \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "45.33.32.157",
    "load": 40,
    "ping": 14
  }'
```

---

## 🗑️ Delete Server

```bash
curl -X DELETE http://localhost:9999/vpn/servers/us-ny-1
```

---

## 🔄 Refresh Servers

```bash
# Manual refresh from API
curl -X POST http://localhost:9999/vpn/servers/refresh
```

---

## 🐛 Troubleshooting

### Servers not loading?

```typescript
const servers = serverConfigManager.getServers();
console.log('Servers:', servers.length);
```

### Check logs:

```typescript
vpnManager.getLogs();
```

### Reset to defaults:

Delete `src/config/servers.json` → Falls back to hard-coded defaults

---

## 📋 Server Object Schema

```typescript
{
  id: string;           // Unique ID (e.g., "us-ny-1")
  name: string;         // Display name
  countryCode: string;  // Country code (US, UK, FR, etc.)
  city: string;         // City name
  ip: string;          // IP address
  protocol: string;    // "UDP" or "TCP"
  load: number;        // Load % (0-100)
  ping: number;        // Latency in ms
}
```

---

## 🌐 Environment Variables

```bash
# Config source
VPN_SERVERS_CONFIG_PATH=./src/config/servers.json
VPN_SERVERS_API_URL=https://api.your-service.com/servers

# Backend
BACKEND_PORT=9999
REACT_APP_API_URL=http://localhost:9999

# VPN
VPN_DNS_PRIMARY=8.8.8.8
VPN_DNS_SECONDARY=8.8.4.4
VPN_PROTOCOL=UDP
```

---

## 🆘 Need Help?

- **Full Guide:** `SERVER_CONFIGURATION.md`
- **Overview:** `NO_HARDCODED_IPS.md`
- **Code:** `src/services/ServerConfigManager.ts`

