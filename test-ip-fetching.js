#!/usr/bin/env node

/**
 * Test script for real-time IP fetching functionality
 * Tests the fetchRealTimeIP method and API calls
 */

const axios = require('axios');

const TIMEOUT = 5000;

// Test APIs used by fetchRealTimeIP
const apis = [
  {
    name: 'ipify.org',
    url: 'https://api.ipify.org?format=json',
    parser: (data) => data.ip,
  },
  {
    name: 'bigdatacloud.net',
    url: 'https://api.bigdatacloud.net/data/ip-geolocation-full?key=bdc_demo',
    parser: (data) => data.ipString,
  },
  {
    name: 'ipapi.co',
    url: 'https://ipapi.co/json/',
    parser: (data) => data.ip,
  },
];

function isValidPublicIP(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;

  const octet1 = parseInt(parts[0], 10);
  const octet2 = parseInt(parts[1], 10);

  return (
    octet1 !== 0 &&
    octet1 !== 10 &&
    octet1 !== 127 &&
    !(octet1 === 172 && octet2 >= 16 && octet2 <= 31) &&
    !(octet1 === 192 && octet2 === 168) &&
    octet1 < 224
  );
}

async function testFetchRealTimeIP() {
  console.log('\n📡 Testing Real-Time IP Fetching...\n');

  for (const api of apis) {
    try {
      console.log(`🔍 Testing ${api.name}...`);
      const response = await axios.get(api.url, { timeout: TIMEOUT });
      const ip = api.parser(response.data);

      if (ip && isValidPublicIP(ip)) {
        console.log(`✅ ${api.name}: ${ip}\n`);
      } else {
        console.log(`⚠️ ${api.name}: Invalid IP format: ${ip}\n`);
      }
    } catch (error) {
      console.log(`❌ ${api.name}: ${error.message}\n`);
    }
  }

  console.log('✨ Real-time IP fetching test complete!');
}

async function testMultipleConnections() {
  console.log('\n🔄 Simulating Multiple Connections (Different IPs)...\n');

  for (let i = 1; i <= 3; i++) {
    console.log(`Connection ${i}:`);
    
    for (const api of apis) {
      try {
        const response = await axios.get(api.url, { timeout: TIMEOUT });
        const ip = api.parser(response.data);

        if (ip && isValidPublicIP(ip)) {
          console.log(`  ✅ ${api.name}: ${ip}`);
          break; // Use first successful API
        }
      } catch (error) {
        // Try next API
      }
    }
    
    if (i < 3) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between connections
    }
    console.log('');
  }

  console.log('✨ Multiple connection test complete!');
}

async function runTests() {
  try {
    await testFetchRealTimeIP();
    await testMultipleConnections();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

runTests();
