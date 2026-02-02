/**
 * OriginX VPN Server Configuration API
 * 
 * This Node.js/Express server provides a REST API for managing VPN server configurations.
 * It can be used as an alternative or complementary backend to the C++ VPN engine.
 * 
 * Usage:
 *   node backend-api.js [PORT]
 * 
 * Example:
 *   node backend-api.js 9998
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

interface VPNServer {
  id: string;
  name: string;
  countryCode: string;
  city: string;
  ip: string;
  protocol: string;
  load: number;
  ping: number;
}

interface ServersConfig {
  servers: VPNServer[];
}

const app: Express = express();
const PORT = process.argv[2] ? parseInt(process.argv[2]) : 9998;

// Middleware
app.use(cors());
app.use(express.json());

// Server configuration storage
let serversConfig: ServersConfig = { servers: [] };

/**
 * Load servers from configuration file
 */
function loadServersConfig(): void {
  try {
    const configPath = path.join(process.cwd(), 'src/config/servers.json');
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      serversConfig = JSON.parse(fileContent);
      console.log(`✅ Loaded ${serversConfig.servers.length} servers from config`);
    } else {
      console.warn(`⚠️  Config file not found: ${configPath}`);
      serversConfig = { servers: getDefaultServers() };
    }
  } catch (error) {
    console.error('❌ Error loading servers config:', error);
    serversConfig = { servers: getDefaultServers() };
  }
}

/**
 * Default servers (fallback)
 */
function getDefaultServers(): VPNServer[] {
  return [
    {
      id: 'us-ny-1',
      name: 'United States - New York',
      countryCode: 'US',
      city: 'New York',
      ip: '45.33.32.156',
      protocol: 'UDP',
      load: 35,
      ping: 12,
    },
    {
      id: 'us-la-1',
      name: 'United States - Los Angeles',
      countryCode: 'US',
      city: 'Los Angeles',
      ip: '167.99.182.125',
      protocol: 'UDP',
      load: 42,
      ping: 28,
    },
    {
      id: 'uk-london-1',
      name: 'United Kingdom - London',
      countryCode: 'UK',
      city: 'London',
      ip: '185.2.75.150',
      protocol: 'UDP',
      load: 45,
      ping: 85,
    },
  ];
}

/**
 * ENDPOINTS
 */

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    servers: serversConfig.servers.length,
  });
});

/**
 * GET /servers
 * Get all VPN servers
 */
app.get('/servers', (req: Request, res: Response) => {
  res.json({
    servers: serversConfig.servers,
    total: serversConfig.servers.length,
  });
});

/**
 * GET /servers/:id
 * Get specific server by ID
 */
app.get('/servers/:id', (req: Request, res: Response) => {
  const server = serversConfig.servers.find((s) => s.id === req.params.id);

  if (!server) {
    return res.status(404).json({ error: `Server ${req.params.id} not found` });
  }

  res.json(server);
});

/**
 * GET /servers/country/:countryCode
 * Get servers by country code
 */
app.get('/servers/country/:countryCode', (req: Request, res: Response) => {
  const country = req.params.countryCode.toUpperCase();
  const servers = serversConfig.servers.filter((s) => s.countryCode === country);

  if (servers.length === 0) {
    return res.status(404).json({ error: `No servers found for country ${country}` });
  }

  res.json({
    country,
    servers,
    total: servers.length,
  });
});

/**
 * GET /servers/sort/load
 * Get servers sorted by load (least loaded first)
 */
app.get('/servers/sort/load', (req: Request, res: Response) => {
  const sorted = [...serversConfig.servers].sort((a, b) => a.load - b.load);
  res.json({
    servers: sorted,
    total: sorted.length,
    sortBy: 'load (ascending)',
  });
});

/**
 * GET /servers/sort/ping
 * Get servers sorted by ping (lowest latency first)
 */
app.get('/servers/sort/ping', (req: Request, res: Response) => {
  const sorted = [...serversConfig.servers].sort((a, b) => a.ping - b.ping);
  res.json({
    servers: sorted,
    total: sorted.length,
    sortBy: 'ping (ascending)',
  });
});

/**
 * POST /servers
 * Add new server
 */
app.post('/servers', (req: Request, res: Response) => {
  const { id, name, countryCode, city, ip, protocol, load, ping } = req.body;

  // Validation
  if (!id || !name || !countryCode || !city || !ip) {
    return res.status(400).json({
      error: 'Missing required fields: id, name, countryCode, city, ip',
    });
  }

  // Check if server ID already exists
  if (serversConfig.servers.some((s) => s.id === id)) {
    return res.status(409).json({ error: `Server with ID ${id} already exists` });
  }

  const newServer: VPNServer = {
    id,
    name,
    countryCode: countryCode.toUpperCase(),
    city,
    ip,
    protocol: protocol || 'UDP',
    load: load || 0,
    ping: ping || 0,
  };

  serversConfig.servers.push(newServer);
  res.status(201).json({
    message: 'Server added successfully',
    server: newServer,
  });
});

/**
 * PUT /servers/:id
 * Update existing server
 */
app.put('/servers/:id', (req: Request, res: Response) => {
  const index = serversConfig.servers.findIndex((s) => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: `Server ${req.params.id} not found` });
  }

  const { name, countryCode, city, ip, protocol, load, ping } = req.body;

  serversConfig.servers[index] = {
    ...serversConfig.servers[index],
    ...(name && { name }),
    ...(countryCode && { countryCode: countryCode.toUpperCase() }),
    ...(city && { city }),
    ...(ip && { ip }),
    ...(protocol && { protocol }),
    ...(load !== undefined && { load }),
    ...(ping !== undefined && { ping }),
  };

  res.json({
    message: 'Server updated successfully',
    server: serversConfig.servers[index],
  });
});

/**
 * DELETE /servers/:id
 * Delete server
 */
app.delete('/servers/:id', (req: Request, res: Response) => {
  const index = serversConfig.servers.findIndex((s) => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: `Server ${req.params.id} not found` });
  }

  const deletedServer = serversConfig.servers.splice(index, 1)[0];
  res.json({
    message: 'Server deleted successfully',
    server: deletedServer,
  });
});

/**
 * POST /servers/bulk
 * Add multiple servers
 */
app.post('/servers/bulk', (req: Request, res: Response) => {
  const { servers } = req.body;

  if (!Array.isArray(servers)) {
    return res.status(400).json({ error: 'Expected servers to be an array' });
  }

  const addedServers: VPNServer[] = [];
  const errors: string[] = [];

  servers.forEach((server: any) => {
    if (!server.id || !server.name || !server.ip) {
      errors.push(`Invalid server: missing required fields`);
      return;
    }

    if (serversConfig.servers.some((s) => s.id === server.id)) {
      errors.push(`Server ${server.id} already exists`);
      return;
    }

    const newServer: VPNServer = {
      id: server.id,
      name: server.name,
      countryCode: (server.countryCode || 'XX').toUpperCase(),
      city: server.city || '',
      ip: server.ip,
      protocol: server.protocol || 'UDP',
      load: server.load || 0,
      ping: server.ping || 0,
    };

    serversConfig.servers.push(newServer);
    addedServers.push(newServer);
  });

  res.status(201).json({
    message: `Added ${addedServers.length} server(s)`,
    added: addedServers,
    errors,
  });
});

/**
 * POST /servers/refresh
 * Refresh server list from configuration file
 */
app.post('/servers/refresh', (req: Request, res: Response) => {
  loadServersConfig();
  res.json({
    message: 'Server configuration refreshed',
    servers: serversConfig.servers.length,
  });
});

/**
 * Error handling
 */
app.use((err: any, req: Request, res: Response) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

/**
 * Start server
 */
loadServersConfig();

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  OriginX VPN Server Configuration API   ║
╚════════════════════════════════════════╝

📡 Server running on: http://localhost:${PORT}

📝 Available Endpoints:

  ✅ Health Check
    GET  /health

  📊 Server Management
    GET    /servers                    - Get all servers
    GET    /servers/:id                - Get server by ID
    POST   /servers                    - Add new server
    PUT    /servers/:id                - Update server
    DELETE /servers/:id                - Delete server
    POST   /servers/bulk               - Add multiple servers
    POST   /servers/refresh            - Reload config

  🌍 Filtering
    GET  /servers/country/:code        - Get by country
    GET  /servers/sort/load            - Sort by load
    GET  /servers/sort/ping            - Sort by ping

📖 Example Commands:

  # Get all servers
  curl http://localhost:${PORT}/servers

  # Get US servers
  curl http://localhost:${PORT}/servers/country/US

  # Get servers by load
  curl http://localhost:${PORT}/servers/sort/load

  # Add new server
  curl -X POST http://localhost:${PORT}/servers \\
    -H "Content-Type: application/json" \\
    -d '{
      "id": "jp-tokyo-1",
      "name": "Japan - Tokyo",
      "countryCode": "JP",
      "city": "Tokyo",
      "ip": "210.168.0.1",
      "protocol": "UDP",
      "load": 48,
      "ping": 125
    }'

🔄 Configuration File: src/config/servers.json
🌐 Port: ${PORT}
  `);
});
