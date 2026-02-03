#!/usr/bin/env node

/**
 * Fetch VPN Gate servers and convert to OriginX format
 * VPN Gate: https://www.vpngate.net/en/
 * 
 * Usage: node scripts/fetch-vpngate-servers.js [--output servers.json] [--limit 50]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let outputFile = 'src/config/servers.json';
let limit = 100; // Fetch top N servers

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' && args[i + 1]) {
    outputFile = args[i + 1];
    i++;
  }
  if (args[i] === '--limit' && args[i + 1]) {
    limit = parseInt(args[i + 1]);
    i++;
  }
}

const VPNGATE_API = 'https://www.vpngate.net/api/iphone/';

// Country code mapping and info
const COUNTRY_INFO = {
  'JP': { name: 'Japan', continent: 'Asia' },
  'US': { name: 'USA', continent: 'North America' },
  'CN': { name: 'China', continent: 'Asia' },
  'GB': { name: 'UK', continent: 'Europe' },
  'FR': { name: 'France', continent: 'Europe' },
  'DE': { name: 'Germany', continent: 'Europe' },
  'SG': { name: 'Singapore', continent: 'Asia' },
  'AU': { name: 'Australia', continent: 'Oceania' },
  'CA': { name: 'Canada', continent: 'North America' },
  'BR': { name: 'Brazil', continent: 'South America' },
  'MX': { name: 'Mexico', continent: 'North America' },
  'IN': { name: 'India', continent: 'Asia' },
  'RU': { name: 'Russia', continent: 'Europe/Asia' },
  'TR': { name: 'Turkey', continent: 'Europe/Asia' },
  'KR': { name: 'South Korea', continent: 'Asia' },
  'TH': { name: 'Thailand', continent: 'Asia' },
  'VN': { name: 'Vietnam', continent: 'Asia' },
  'ID': { name: 'Indonesia', continent: 'Asia' },
  'MY': { name: 'Malaysia', continent: 'Asia' },
  'PH': { name: 'Philippines', continent: 'Asia' },
  'NZ': { name: 'New Zealand', continent: 'Oceania' },
  'ZA': { name: 'South Africa', continent: 'Africa' },
  'EG': { name: 'Egypt', continent: 'Africa' },
  'NG': { name: 'Nigeria', continent: 'Africa' },
  'KE': { name: 'Kenya', continent: 'Africa' },
  'MA': { name: 'Morocco', continent: 'Africa' },
  'IT': { name: 'Italy', continent: 'Europe' },
  'ES': { name: 'Spain', continent: 'Europe' },
  'NL': { name: 'Netherlands', continent: 'Europe' },
  'SE': { name: 'Sweden', continent: 'Europe' },
  'NO': { name: 'Norway', continent: 'Europe' },
  'CH': { name: 'Switzerland', continent: 'Europe' },
  'AT': { name: 'Austria', continent: 'Europe' },
  'PL': { name: 'Poland', continent: 'Europe' },
  'CZ': { name: 'Czech Republic', continent: 'Europe' },
  'UA': { name: 'Ukraine', continent: 'Europe' },
  'AR': { name: 'Argentina', continent: 'South America' },
  'CL': { name: 'Chile', continent: 'South America' },
  'CO': { name: 'Colombia', continent: 'South America' },
  'PE': { name: 'Peru', continent: 'South America' },
  'TW': { name: 'Taiwan', continent: 'Asia' },
  'HK': { name: 'Hong Kong', continent: 'Asia' },
  'TH': { name: 'Thailand', continent: 'Asia' },
  'PK': { name: 'Pakistan', continent: 'Asia' },
  'BD': { name: 'Bangladesh', continent: 'Asia' },
  'LK': { name: 'Sri Lanka', continent: 'Asia' },
};

function fetchVPNGateServers() {
  return new Promise((resolve, reject) => {
    console.log('📡 Fetching VPN Gate server list...');
    
    https.get(VPNGATE_API, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const servers = parseVPNGateData(data, limit);
          console.log(`✅ Successfully fetched ${servers.length} servers from VPN Gate`);
          resolve(servers);
        } catch (err) {
          reject(new Error(`Failed to parse VPN Gate data: ${err.message}`));
        }
      });
    }).on('error', (err) => {
      reject(new Error(`Failed to fetch from VPN Gate: ${err.message}`));
    });
  });
}

function parseVPNGateData(data, limit) {
  const lines = data.trim().split('\n');
  const servers = [];
  let serverCount = 0;
  
  for (let i = 0; i < lines.length && serverCount < limit; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and header comments
    if (!line || line.startsWith('*')) {
      continue;
    }
    
    try {
      const parts = line.split(',').map(p => p.trim());
      
      if (parts.length < 13) {
        continue;
      }
      
      const ip = parts[0];
      const protocol = parts[1]; // TCP
      const numSessions = parseInt(parts[2]) || 0;
      const uptimeHours = parseInt(parts[3]) || 0;
      const totalUsers = parseInt(parts[4]) || 0;
      const countryCode = parts[7] || 'XX';
      const countryName = parts[8] || 'Unknown';
      const ping = parseInt(parts[10]) || 100;
      
      // Validate IP
      if (!isValidIP(ip)) {
        continue;
      }
      
      // Calculate load
      const load = Math.min(100, Math.max(0, Math.floor(numSessions / 5 + totalUsers / 100)));
      
      const server = {
        id: `vpngate-${countryCode.toLowerCase()}-${serverCount}`,
        name: `${countryName} (VPN Gate)`,
        countryCode: countryCode,
        city: countryName,
        ip: ip,
        protocol: 'UDP',
        load: load,
        ping: ping,
        source: 'vpngate',
        uptime: uptimeHours,
        users: totalUsers,
        sessions: numSessions
      };
      
      servers.push(server);
      serverCount++;
      
    } catch (err) {
      continue;
    }
  }
  
  return servers;
}

function isValidIP(ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) {
    return false;
  }
  
  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part);
    return num >= 0 && num <= 255;
  });
}

function loadExistingServers(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      // Filter out existing VPN Gate servers
      return data.servers.filter(s => s.source !== 'vpngate');
    } catch (err) {
      console.warn('⚠️  Could not read existing servers:', err.message);
      return [];
    }
  }
  return [];
}

function mergeServers(existingServers, vpnGateServers) {
  // Keep existing servers first (dedicated/paid servers)
  // Then add VPN Gate servers as backup/free options
  return [...existingServers, ...vpnGateServers];
}

function saveServers(filePath, servers) {
  const output = {
    servers: servers,
    lastUpdated: new Date().toISOString(),
    sourceInfo: {
      dedicated: servers.filter(s => s.source !== 'vpngate').length,
      vpngate: servers.filter(s => s.source === 'vpngate').length,
      total: servers.length
    }
  };
  
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
  console.log(`✅ Saved ${servers.length} servers to ${filePath}`);
}

function printStats(servers) {
  console.log('\n📊 Server Statistics:');
  console.log(`Total servers: ${servers.length}`);
  
  // Group by country
  const byCountry = {};
  servers.forEach(s => {
    if (!byCountry[s.countryCode]) {
      byCountry[s.countryCode] = 0;
    }
    byCountry[s.countryCode]++;
  });
  
  // Show top 10 countries
  const sorted = Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log('\nTop 10 countries:');
  sorted.forEach(([code, count]) => {
    const name = COUNTRY_INFO[code]?.name || code;
    console.log(`  ${code}: ${name} (${count} servers)`);
  });
  
  // Check for African servers
  const africans = servers.filter(s => {
    const info = COUNTRY_INFO[s.countryCode];
    return info && info.continent === 'Africa';
  });
  console.log(`\n🌍 African servers: ${africans.length}`);
  africans.slice(0, 5).forEach(s => {
    console.log(`  - ${s.countryCode}: ${s.name} (${s.ping}ms)`);
  });
}

async function main() {
  try {
    console.log('🚀 VPN Gate Server Fetcher\n');
    
    // Fetch VPN Gate servers
    const vpnGateServers = await fetchVPNGateServers();
    
    // Load existing dedicated servers
    const existingServers = loadExistingServers(outputFile);
    console.log(`📦 Loaded ${existingServers.length} existing dedicated servers`);
    
    // Merge servers
    const allServers = mergeServers(existingServers, vpnGateServers);
    
    // Save to file
    saveServers(outputFile, allServers);
    
    // Print statistics
    printStats(allServers);
    
    console.log('\n✨ Done! Your VPN now has global coverage with free servers.');
    console.log(`💾 Output: ${outputFile}`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
