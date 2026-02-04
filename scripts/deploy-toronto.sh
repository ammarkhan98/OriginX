#!/bin/bash

################################################################################
# DigitalOcean VPN Server Deployment - Single Droplet (Toronto)
# 
# Deploys 1 droplet in Toronto, Canada
# Cost: $6/month
# Plus: Free Morocco server from VPN Gate
#
# Prerequisites:
#   - doctl CLI: brew install doctl
#   - jq: brew install jq
#   - DigitalOcean API token
#   - SSH key uploaded to DigitalOcean
#
# Usage:
#   chmod +x scripts/deploy-toronto.sh
#   ./scripts/deploy-toronto.sh
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVERS_CONFIG="$PROJECT_ROOT/src/config/servers.json"
DO_IMAGE="ubuntu-22-04-x64"
DO_SIZE="s-1vcpu-1gb"  # $6/month
REGION="tor1"
REGION_NAME="Toronto"
COUNTRY_CODE="CA"
TIMESTAMP=$(date +%s)

log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }

check_prerequisites() {
  log_info "Checking prerequisites..."
  
  if ! command -v doctl &> /dev/null; then
    log_error "doctl not found. Install: brew install doctl"
    exit 1
  fi
  
  if ! command -v jq &> /dev/null; then
    log_error "jq not found. Install: brew install jq"
    exit 1
  fi
  
  if ! doctl auth list &> /dev/null; then
    log_error "doctl not authenticated. Run: doctl auth init"
    exit 1
  fi
  
  log_success "Prerequisites OK"
}

get_ssh_key_id() {
  log_info "Getting SSH key ID..."
  local key_id=$(doctl compute ssh-key list --format ID --no-header | head -1)
  
  if [ -z "$key_id" ]; then
    log_error "No SSH keys found. Upload one to DigitalOcean first."
    exit 1
  fi
  
  echo "$key_id"
}

create_droplet() {
  local name="originx-vpn-${REGION}-${TIMESTAMP}"
  local ssh_key=$1
  
  log_info "Creating droplet: $name"
  
  doctl compute droplet create "$name" \
    --region "$REGION" \
    --image "$DO_IMAGE" \
    --size "$DO_SIZE" \
    --ssh-keys "$ssh_key" \
    --wait \
    --format ID,Name,PublicIPv4 \
    --no-header
}

wait_for_ssh() {
  local ip=$1
  local max_attempts=60
  local attempt=0
  
  log_info "Waiting for SSH access to $ip..."
  
  while [ $attempt -lt $max_attempts ]; do
    if ssh -o ConnectTimeout=2 -o StrictHostKeyChecking=no root@"$ip" "echo 'ready'" 2>/dev/null; then
      log_success "SSH access ready"
      return 0
    fi
    
    ((attempt++))
    echo -n "."
    sleep 2
  done
  
  log_error "SSH timeout for $ip"
  return 1
}

install_openvpn() {
  local ip=$1
  
  log_info "Installing OpenVPN on $ip..."
  
  ssh -o StrictHostKeyChecking=no root@"$ip" bash -s << 'EOFINSTALL'
set -e
apt-get update > /dev/null 2>&1
apt-get upgrade -y > /dev/null 2>&1
apt-get install -y openvpn easy-rsa > /dev/null 2>&1

curl -O https://raw.githubusercontent.com/Nyr/openvpn-install/master/openvpn-install.sh 2>/dev/null
chmod +x openvpn-install.sh

HEADLESS_MODE=1 bash openvpn-install.sh
EOFINSTALL
  
  log_success "OpenVPN installed"
}

update_servers_json() {
  local ip=$1
  
  log_info "Updating servers.json..."
  
  # Read existing servers
  local existing=$(jq '.servers // []' "$SERVERS_CONFIG")
  
  # Remove any old Toronto servers
  existing=$(echo "$existing" | jq '[.[] | select(.id != "do-ca-1")]')
  
  # Create new Toronto server entry
  local toronto_server=$(cat <<EOFSERVER
{
  "id": "do-ca-1",
  "name": "Canada - Toronto (DigitalOcean)",
  "countryCode": "CA",
  "city": "Toronto",
  "ip": "$ip",
  "protocol": "UDP",
  "load": 25,
  "ping": 10,
  "source": "digitalocean"
}
EOFSERVER
)
  
  # Add new server
  existing=$(echo "$existing" | jq --argjson server "$toronto_server" '. += [$server]')
  
  # Create updated config
  local updated=$(cat <<EOFCONFIG
{
  "servers": $existing,
  "lastUpdated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "sourceInfo": {
    "digitalocean": 1,
    "vpngate": $(echo "$existing" | jq '[.[] | select(.source == "vpngate")] | length'),
    "total": $(echo "$existing" | jq 'length'),
    "comment": "1 DigitalOcean (Toronto) + Free VPN Gate servers (Morocco, Africa, etc)"
  }
}
EOFCONFIG
)
  
  echo "$updated" > "$SERVERS_CONFIG"
  log_success "servers.json updated"
}

print_summary() {
  log_info "Deployment Summary"
  echo ""
  
  jq -r '.servers[] | select(.source == "digitalocean") | "  \(.countryCode): \(.city) - \(.ip)"' "$SERVERS_CONFIG"
  
  echo ""
  log_success "Toronto VPN server deployed!"
  echo ""
  echo "Your VPN servers:"
  echo "  🇨🇦 Toronto (DigitalOcean)  - $6/month"
  echo "  🇲🇦 Morocco (VPN Gate)      - Free"
  echo "  + 5 other free servers"
  echo ""
  echo "Total cost: \$6/month"
  echo ""
  echo "Test with: npm run dev"
}

main() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  OriginX - Toronto VPN Deployment                 ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  check_prerequisites
  
  SSH_KEY=$(get_ssh_key_id)
  log_success "SSH Key ID: $SSH_KEY"
  echo ""
  
  # Create droplet
  read -r droplet_id droplet_name public_ip < <(create_droplet "$SSH_KEY")
  log_success "Droplet created: $droplet_name (ID: $droplet_id)"
  echo ""
  
  # Wait for SSH
  if wait_for_ssh "$public_ip"; then
    # Install OpenVPN
    if install_openvpn "$public_ip"; then
      # Update servers.json
      update_servers_json "$public_ip"
      
      echo ""
      print_summary
    fi
  else
    log_error "Failed to establish SSH connection"
    exit 1
  fi
  
  echo ""
}

main "$@"
