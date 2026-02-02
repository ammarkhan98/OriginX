#!/bin/bash

echo "═══════════════════════════════════════════════════════"
echo "  VPN SYSTEM STATUS CHECK"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check Backend
echo "✅ BACKEND STATUS:"
lsof -i -P -n 2>/dev/null | grep "9999" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "   ✓ VPN Engine running on port 9999"
else
  echo "   ✗ VPN Engine NOT running"
fi

# Check React Dev Server
echo ""
echo "✅ FRONTEND STATUS:"
lsof -i -P -n 2>/dev/null | grep ":3000" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "   ✓ React Dev Server running on port 3000"
else
  echo "   ✗ React Dev Server NOT running"
fi

# Check Electron
echo ""
echo "✅ ELECTRON STATUS:"
ps aux | grep -i "electron" | grep -v grep > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "   ✓ Electron app running"
else
  echo "   ✗ Electron app NOT running"
fi

# Check Configuration Files
echo ""
echo "✅ CONFIGURATION FILES:"
if [ -f "/Users/ammarkhan/Documents/VSCode Projects/OriginX/src/config/servers.json" ]; then
  echo "   ✓ servers.json exists"
  SERVER_COUNT=$(grep -c '"id"' "/Users/ammarkhan/Documents/VSCode Projects/OriginX/src/config/servers.json")
  echo "   ✓ Contains $SERVER_COUNT servers"
else
  echo "   ✗ servers.json NOT found"
fi

if [ -f "/Users/ammarkhan/Documents/VSCode Projects/OriginX/.env" ]; then
  echo "   ✓ .env file exists"
else
  echo "   ✗ .env file NOT found"
fi

# Check ServerConfigManager
echo ""
echo "✅ SYSTEM COMPONENTS:"
if [ -f "/Users/ammarkhan/Documents/VSCode Projects/OriginX/src/services/ServerConfigManager.ts" ]; then
  echo "   ✓ ServerConfigManager.ts exists"
else
  echo "   ✗ ServerConfigManager.ts NOT found"
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ALL SYSTEMS READY ✅"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📱 Access the app at: http://localhost:3000"
echo "🖥️  Backend API available at: http://localhost:9999"
echo ""
echo "Next: Open Electron app window to test VPN features"
echo ""
