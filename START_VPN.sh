#!/bin/bash
# OriginX VPN - Quick Start Guide

echo "╔════════════════════════════════════════════════════════╗"
echo "║      OriginX VPN - Complete Setup Instructions        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Define colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 QUICK REFERENCE${NC}"
echo ""

echo -e "${YELLOW}1. START ALL SERVICES${NC}"
echo "   Run in separate terminals:"
echo ""
echo "   Terminal 1 - Backend VPN Engine:"
echo "   $ cd backend/cpp/build && ./vpn_engine_test 9999"
echo ""
echo "   Terminal 2 - Frontend (React + Electron):"
echo "   $ npm run dev"
echo ""

echo -e "${YELLOW}2. ACCESS THE APPLICATION${NC}"
echo "   • Desktop App: Electron window (auto-opens)"
echo "   • Web Browser: http://localhost:3000"
echo "   • Backend API: http://localhost:9999"
echo ""

echo -e "${YELLOW}3. VERIFY EVERYTHING IS RUNNING${NC}"
echo "   $ bash check-status.sh"
echo ""

echo -e "${YELLOW}4. CONFIGURATION FILES${NC}"
echo "   • Server List: src/config/servers.json (10 servers)"
echo "   • Settings: .env"
echo "   • Manager: src/services/ServerConfigManager.ts"
echo ""

echo -e "${YELLOW}5. AVAILABLE SERVERS${NC}"
echo ""
echo "   🌍 North America:"
echo "      • US - New York (45.33.32.156)"
echo "      • US - Los Angeles (167.99.182.125)"
echo "      • US - Chicago (104.131.103.137)"
echo "      • Canada - Toronto (149.56.6.10)"
echo ""
echo "   🌍 Europe:"
echo "      • UK - London (185.2.75.150)"
echo "      • France - Paris (80.241.216.66)"
echo "      • Germany - Berlin (185.10.127.50)"
echo ""
echo "   🌍 Asia Pacific:"
echo "      • Australia - Sydney (203.0.113.45)"
echo "      • Japan - Tokyo (210.168.0.1)"
echo "      • Singapore (164.92.73.1)"
echo ""

echo -e "${YELLOW}6. USEFUL COMMANDS${NC}"
echo ""
echo "   Check running processes:"
echo "   $ ps aux | grep -E 'vpn_engine|npm run dev|electron'"
echo ""
echo "   Check port usage:"
echo "   $ lsof -i -P -n | grep -E ':3000|:9999'"
echo ""
echo "   Stop everything:"
echo "   $ pkill -9 vpn_engine_test && pkill -9 'npm run dev'"
echo ""
echo "   View VPN logs:"
echo "   $ tail -f src/logs/vpn.log"
echo ""
echo "   View dev server logs:"
echo "   $ tail -f dev.log"
echo ""

echo -e "${YELLOW}7. ADD NEW SERVER${NC}"
echo "   Edit: src/config/servers.json"
echo ""
echo "   Example:"
echo "   {"
echo "     \"id\": \"my-server\","
echo "     \"name\": \"My VPN Server\","
echo "     \"countryCode\": \"US\","
echo "     \"city\": \"New York\","
echo "     \"ip\": \"1.2.3.4\","
echo "     \"protocol\": \"UDP\","
echo "     \"load\": 30,"
echo "     \"ping\": 50"
echo "   }"
echo ""
echo "   Then restart the app (Ctrl+C and run npm run dev again)"
echo ""

echo -e "${GREEN}✅ SYSTEM STATUS${NC}"
echo ""
echo "   Backend VPN Engine:"
bash -c 'ps aux | grep "vpn_engine_test" | grep -v grep > /dev/null && echo "      ✓ Running (Port 9999)" || echo "      ✗ Not running"'
echo ""
echo "   React Dev Server:"
bash -c 'lsof -i :3000 > /dev/null 2>&1 && echo "      ✓ Running (Port 3000)" || echo "      ✗ Not running"'
echo ""
echo "   Electron App:"
bash -c 'ps aux | grep "Electron" | grep -v grep > /dev/null && echo "      ✓ Running" || echo "      ✗ Not running"'
echo ""
echo "   Configuration:"
bash -c '[ -f "src/config/servers.json" ] && echo "      ✓ servers.json found" || echo "      ✗ servers.json missing"'
bash -c '[ -f ".env" ] && echo "      ✓ .env file found" || echo "      ✗ .env file missing"'
echo ""

echo -e "${BLUE}📚 DOCUMENTATION${NC}"
echo ""
echo "   • QUICK_REFERENCE.md - 5-minute guide"
echo "   • SERVER_CONFIGURATION.md - Complete documentation"
echo "   • NO_HARDCODED_IPS.md - Configuration overview"
echo "   • SYSTEM_RUNNING.md - Current system status"
echo ""

echo "╔════════════════════════════════════════════════════════╗"
echo "║            Ready to start development! 🚀              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
