# VPN Server Configuration Guide

This document explains how to manage VPN server configurations in OriginX without hard-coding IP addresses.

## Overview

OriginX uses a flexible configuration system that supports multiple sources for VPN server data:

1. **Remote API** (Highest priority) - Dynamic server updates from a backend API
2. **Local JSON File** (Secondary) - Static servers configured in `src/config/servers.json`
3. **Hard-coded Defaults** (Fallback) - Built-in servers if config is unavailable

## Configuration Methods

### Method 1: Local JSON Configuration (Recommended for Development)

#### File: `src/config/servers.json`

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
    },
    {
      "id": "uk-london-1",
      "name": "United Kingdom - London",
      "countryCode": "UK",
      "city": "London",
      "ip": "185.2.75.150",
      "protocol": "UDP",
      "load": 45,
      "ping": 85
    }
  ]
}
```

**Advantages:**
- Simple to update
- No external dependencies
- Version control friendly
- Good for testing

**How to Use:**
1. Edit `src/config/servers.json`
2. Add/update/remove servers as needed
3. Changes take effect on next app restart

---

### Method 2: Remote API Configuration (Production)

For dynamic server management, configure a remote API endpoint.

#### Setup Environment Variable

Create or edit `.env`:
```bash
VPN_SERVERS_API_URL=https://api.your-vpn-service.com/servers
```

#### API Endpoint Requirements

Your API must return the following JSON format:

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

#### Server Object Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique server identifier |
| `name` | string | ✅ | Display name |
| `countryCode` | string | ✅ | ISO country code (US, UK, FR, etc.) |
| `city` | string | ✅ | City name |
| `ip` | string | ✅ | Server IP address |
| `protocol` | string | ✅ | UDP or TCP |
| `load` | number | ✅ | Server load percentage (0-100) |
| `ping` | number | ✅ | Latency in milliseconds |

#### Features

- **Automatic Caching**: Updates cached every 1 hour
- **Fallback Support**: Falls back to local config if API fails
- **Live Updates**: Call `refreshFromRemote()` to manually refresh

**Advantages:**
- Central management
- Real-time updates
- Dynamic load balancing
- Scaling capability

---

### Method 3: Custom Configuration via API Endpoints

The backend exposes REST endpoints for server management:

#### Get All Servers
```bash
curl http://localhost:9999/vpn/servers
```

Response:
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

#### Get Servers by Country
```bash
curl http://localhost:9999/vpn/servers/country/US
```

#### Get Servers by Load (Least loaded first)
```bash
curl http://localhost:9999/vpn/servers/by-load
```

#### Get Servers by Ping (Lowest latency first)
```bash
curl http://localhost:9999/vpn/servers/by-ping
```

---

## Environment Variables

Create a `.env` file in the project root:

```bash
# Server Configuration Source
VPN_SERVERS_CONFIG_PATH=./src/config/servers.json
VPN_SERVERS_API_URL=https://api.your-vpn-service.com/servers

# Backend Settings
BACKEND_PORT=9999
BACKEND_HOST=localhost

# Frontend Settings
REACT_APP_API_URL=http://localhost:9999
REACT_APP_ENV=development

# VPN Settings
VPN_DNS_PRIMARY=8.8.8.8
VPN_DNS_SECONDARY=8.8.4.4
VPN_PROTOCOL=UDP
VPN_ENCRYPTION_LEVEL=high
```

---

## Usage in Code

### Initialize VPN Manager

```typescript
import { VPNManager } from './services/vpnManager';

const vpnManager = new VPNManager();
await vpnManager.initialize(); // Load servers from configuration
```

### Get All Servers

```typescript
const servers = vpnManager.getServers();
console.log(servers); // Array of VPN servers
```

### Filter Servers

```typescript
// Get servers by country
const usServers = serverConfigManager.getServersByCountry('US');

// Get servers by load (least loaded first)
const fastestServers = serverConfigManager.getServersByLoad();

// Get servers by ping (lowest latency first)
const lowLatencyServers = serverConfigManager.getServersByPing();
```

### Add Server Dynamically

```typescript
serverConfigManager.addServer({
  id: 'jp-tokyo-1',
  name: 'Japan - Tokyo',
  countryCode: 'JP',
  city: 'Tokyo',
  ip: '210.168.0.1',
  protocol: 'UDP',
  load: 48,
  ping: 125
});
```

### Remove Server

```typescript
serverConfigManager.removeServer('jp-tokyo-1');
```

### Refresh from Remote API

```typescript
const success = await serverConfigManager.refreshFromRemote();
if (success) {
  console.log('Servers updated from remote API');
}
```

---

## Example: Backend API Integration

The C++ backend can also provide server configuration:

### Backend Endpoint (`backend/cpp/src/main.cpp`)

```cpp
// GET /vpn/servers
std::string response = R"({
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
})";
```

---

## Adding Servers

### Step 1: Edit Configuration File

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

### Step 2: Verify the Change

```bash
# Restart the app or call:
curl http://localhost:9999/vpn/servers
```

---

## Removing Hard-Coded Defaults

Previously, servers were hard-coded in `src/data/countries.ts`. This file can now be safely removed or archived as the new configuration system supersedes it.

**Migration Steps:**

1. ✅ Export data from `countries.ts` to `servers.json`
2. ✅ Update `vpnManager.ts` to use `ServerConfigManager`
3. ✅ Test with new configuration system
4. ✅ Archive or remove `countries.ts` (optional)

---

## Best Practices

1. **Keep Configuration External**: Store servers in JSON or API, not code
2. **Use Environment Variables**: Configure API URLs via `.env`
3. **Version Control**: Include `servers.json` in git (except secrets)
4. **Cache Wisely**: Set appropriate refresh intervals for remote APIs
5. **Fallback Strategy**: Always have defaults in case of API failure
6. **Monitor Changes**: Log all configuration updates
7. **Document IPs**: Add comments explaining server purposes

---

## Troubleshooting

### Servers Not Loading

```typescript
// Check if ServerConfigManager initialized
const servers = serverConfigManager.getServers();
console.log('Servers loaded:', servers.length);
```

### API Connection Failed

The system will automatically fall back to local configuration:

```typescript
// Check logs
vpnManager.getLogs().forEach(log => console.log(log));
```

### Configuration Not Updated

Restart the application or call:

```typescript
await serverConfigManager.refreshFromRemote();
```

---

## Security Considerations

- 🔐 **Use HTTPS**: Always use encrypted connections for remote APIs
- 🔑 **API Authentication**: Add API keys if needed
- 🚫 **Validate Input**: Verify server IPs are valid
- 📝 **Audit Logs**: Log all configuration changes
- 🛡️ **Rate Limiting**: Implement rate limits on configuration endpoints

---

## Next Steps

1. Update your backend API to return servers dynamically
2. Deploy the API and configure `VPN_SERVERS_API_URL`
3. Set up CI/CD to update `servers.json` automatically
4. Monitor server health and update load/ping values
5. Add authentication to sensitive endpoints

