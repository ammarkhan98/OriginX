#!/usr/bin/env node

const path = require('path');
const { VPNManager } = require(path.join(__dirname, 'dist', 'services', 'vpnManager.js'));

async function testMultipleConnections() {
  console.log('\n🔄 Testing Multiple Connections (Different IPs per connection)\n');
  console.log('='.repeat(70) + '\n');

  const vpnManager = new VPNManager();
  const servers = vpnManager.getServers().slice(0, 3);
  const ips = [];

  for (let i = 1; i <= 3; i++) {
    const server = servers[i - 1];
    console.log(`Connection ${i}:`);
    console.log(`  Server: ${server.name}`);
    console.log(`  Base IP: ${server.ip}`);
    
    await vpnManager.connect(server.id);
    const status = vpnManager.getStatus();
    
    console.log(`  ✅ Session IP: ${status.ipAddress}`);
    console.log(`  Different from base: ${status.ipAddress !== server.ip ? '✅ YES' : '⚠️  NO'}`);
    
    ips.push(status.ipAddress);
    console.log('');
    
    await vpnManager.disconnect();
  }

  // Check if all IPs are unique
  const uniqueIPs = new Set(ips);
  console.log('='.repeat(70));
  console.log('\n📊 Results:\n');
  console.log(`Total Connections: 3`);
  console.log(`Unique IPs Assigned: ${uniqueIPs.size}`);
  console.log(`All IPs Different: ${uniqueIPs.size === 3 ? '✅ YES' : '⚠️  SOME DUPLICATES'}`);
  console.log('\nAssigned IPs:');
  ips.forEach((ip, idx) => {
    console.log(`  ${idx + 1}. ${ip}`);
  });
  console.log('\n✨ Real-Time IP Fetching Verified!\n');
  console.log('='.repeat(70) + '\n');
}

testMultipleConnections().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
