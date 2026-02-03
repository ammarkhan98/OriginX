#!/bin/bash

################################################################################
# DigitalOcean VPN Server Deployment Script for OriginX
# 
# This script automates the deployment of OpenVPN servers to DigitalOcean
# across multiple regions, then updates servers.json with the real IPs.
#
# Prerequisites:
#   - doctl CLI installed: brew install doctl
#   - DigitalOcean API token
#   - SSH key uploaded to DigitalOcean
#   - jq for JSON parsing: brew install jq
#
# Usage:
#   chmod +x scripts/deploy-digitalocean.sh
#   ./scripts/deploy-digitalocean.sh
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVERS_CONFIG="$PROJECT_ROOT/src/config/servers.json"
DEPLOYMENT_LOG="$PROJECT_ROOT/.deployment-log.json"

# DigitalOcean Configuration
DO_IMAGE="ubuntu-22-04-x64"
DO_SIZE="s-1vcpu-1gb"  # $6/month
DROPLET_PREFIX="originx-vpn"
TIMESTAMP=$(date +%s)

# Regions to deploy (region code, display name, country code)
declare -a REGIONS=(
  "nyc3:New York:US"
  "lon1:London:GB"
  "fra1:Frankfurt:DE"
  "sgp1:Singapore:SG"
  "syd1:Sydney:AU"
  "tor1:Toronto:CA"
)

################################################################################
# Helper Functions
################################################################################

log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

check_prerequisites() {
  log_info "Checking prerequisites..."
  
  # Check doctl
  if ! command -v doctl &> /dev/null; then
    log_error "doctl CLI not found. Install with: brew install doctl"
    exit 1
  fi
  
  # Check jq
  if ! command -v jq &> /dev/null; then
    log_error "jq not found. Install with: brew install jq"
    exit 1
  fi
  
  # Check doctl auth
  if ! doctl auth list &> /dev/null; then
    log_error "doctl not authenticated. Run: doctl auth init"
    exit 1
  fi
  
  log_success "All prerequisites met"
}

get_ssh_key_id() {
  log_info "Fetching SSH key ID..."
  
  local key_id=$(doctl compute ssh-key list --format ID --no-header | head -1)
  
  if [ -z "$key_id" ]; then
    log_error "No SSH keys found in DigitalOcean. Upload an SSH key first."
    log_info "Run: doctl compute ssh-key import <name> --public-key-file ~/.ssh/id_rsa.pub"
    exit 1
  fi
  
  echo "$key_id"
}

create_droplet() {
  local region=$1
  local name=$2
  local ssh_key=$3
  
  log_info "Creating droplet: $name in region: $region"
  
  local response=$(doctl compute droplet create "$name" \
    --region "$region" \
    --image "$DO_IMAGE" \
    --size "$DO_SIZE" \
    --ssh-keys "$ssh_key" \
    --wait \
    --format ID,Name,PublicIPv4,Region \
    --no-header)
  
  echo "$response"
}

wait_for_ssh() {
  local ip=$1
  local max_attempts=60
  local attempt=0
  
  log_info "Waiting for SSH access to $ip..."
  
  while [ $attempt -lt $max_attempts ]; do
    if ssh -o ConnectTimeout=2 -o StrictHostKeyChecking=no root@"$ip" "echo 'SSH ready'" 2>/dev/null; then
      log_success "SSH access established to $ip"
      return 0
    fi
    
    ((attempt++))
    echo -n "."
    sleep 2
  done
  
  log_error "SSH access timeout for $ip"
  return 1
}

install_openvpn() {
  local ip=$1
  local region=$2
  
  log_info "Installing OpenVPN on $ip ($region)..."
  
  # Download and run OpenVPN installer
  ssh -o StrictHostKeyChecking=no root@"$ip" bash -s << 'EOFINSTALL'
set -e
echo "Updating system..."
apt-get update > /dev/null 2>&1
apt-get upgrade -y > /dev/null 2>&1

echo "Installing OpenVPN..."
apt-get install -y openvpn easy-rsa > /dev/null 2>&1

echo "Configuring OpenVPN..."
# Download and run the official OpenVPN install script
curl -O https://raw.githubusercontent.com/Nyr/openvpn-install/master/openvpn-install.sh 2>/dev/null
chmod +x openvpn-install.sh

# Run installer with auto-answers
APPROVE_IP=$(hostname -I | awk '{print $1}')
export HEADLESS_MODE=1
AUTO_INSTALL=y \
ENDPOINT=$APPROVE_IP \
PROTOCOL=udp \
PORT=1194 \
DNS=1 \
DNS1="8.8.8.8" \
DNS2="8.8.4.4" \
COMPRESSION=yes \
ENCRYPT=256 \
UNINSTALL=no \
bash openvpn-install.sh

echo "OpenVPN installation complete!"
EOFINSTALL
  
  if [ $? -eq 0 ]; then
    log_success "OpenVPN installed on $ip"
    return 0
  else
    log_error "Failed to install OpenVPN on $ip"
    return 1
  fi
}

save_deployment_info() {
  local droplet_id=$1
  local name=$2
  local ip=$3
  local region=$4
  local country=$5
  
  # Append to deployment log
  local entry=$(cat <<EOF
{
  "droplet_id": "$droplet_id",
  "name": "$name",
  "public_ip": "$ip",
  "region": "$region",
  "country_code": "$country",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "deployed"
}
EOF
)
  
  echo "$entry" >> "$DEPLOYMENT_LOG"
}

update_servers_json() {
  log_info "Updating servers.json with new IPs..."
  
  if [ ! -f "$DEPLOYMENT_LOG" ]; then
    log_warning "No deployment log found"
    return 1
  fi
  
  # Read deployment log and create server entries
  local servers_array="[]"
  
  while IFS= read -r line; do
    if [ -z "$line" ] || [ "$line" = "," ]; then
      continue
    fi
    
    local ip=$(echo "$line" | jq -r '.public_ip // empty')
    local region=$(echo "$line" | jq -r '.region // empty')
    local country=$(echo "$line" | jq -r '.country_code // empty')
    local name=$(echo "$line" | jq -r '.name // empty')
    
    if [ -n "$ip" ] && [ -n "$country" ]; then
      local city="${name#*-}"
      local server_entry=$(cat <<EOFENTRY
{
  "id": "do-$(echo $country | tr '[:upper:]' '[:lower:]')-1",
  "name": "$city (DigitalOcean)",
  "countryCode": "$country",
  "city": "$city",
  "ip": "$ip",
  "protocol": "UDP",
  "load": 25,
  "ping": 50,
  "source": "digitalocean"
}
EOFENTRY
)
      
      servers_array=$(echo "$servers_array" | jq --argjson entry "$server_entry" '. += [$entry]')
    fi
  done < "$DEPLOYMENT_LOG"
  
  # Merge with existing servers.json
  if [ -f "$SERVERS_CONFIG" ]; then
    local existing=$(jq '.servers // []' "$SERVERS_CONFIG")
    # Keep non-digitalocean servers
    existing=$(echo "$existing" | jq '[.[] | select(.source != "digitalocean")]')
    servers_array=$(echo "$existing" | jq --argjson new "$servers_array" '. + $new')
  fi
  
  # Create updated servers.json
  local updated_config=$(cat <<EOFCONFIG
{
  "servers": $servers_array,
  "lastUpdated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "sourceInfo": {
    "digitalocean": $(echo "$servers_array" | jq '[.[] | select(.source == "digitalocean")] | length'),
    "total": $(echo "$servers_array" | jq 'length'),
    "comment": "Real VPN servers deployed on DigitalOcean"
  }
}
EOFCONFIG
)
  
  echo "$updated_config" > "$SERVERS_CONFIG"
  log_success "servers.json updated with $(echo "$servers_array" | jq 'length') servers"
}

cleanup_deployment_log() {
  if [ -f "$DEPLOYMENT_LOG" ]; then
    rm "$DEPLOYMENT_LOG"
  fi
}

print_summary() {
  log_info "Deployment Summary"
  echo ""
  
  if [ ! -f "$SERVERS_CONFIG" ]; then
    return
  fi
  
  echo "Deployed Servers:"
  jq -r '.servers[] | select(.source == "digitalocean") | "  \(.countryCode): \(.city) - \(.ip)"' "$SERVERS_CONFIG"
  
  echo ""
  log_success "Servers deployed and configured!"
  log_info "Next steps:"
  echo "  1. Test VPN connections with: npm run dev"
  echo "  2. Verify servers in dashboard"
  echo "  3. Monitor logs: tail -f $PROJECT_ROOT/openvpn.log"
}

################################################################################
# Main Deployment Flow
################################################################################

main() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  OriginX - DigitalOcean VPN Deployment                     ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  # Check prerequisites
  check_prerequisites
  
  # Get SSH key
  SSH_KEY=$(get_ssh_key_id)
  log_success "SSH Key ID: $SSH_KEY"
  
  echo ""
  log_info "Deploying to ${#REGIONS[@]} regions..."
  echo ""
  
  # Initialize deployment log
  > "$DEPLOYMENT_LOG"
  
  # Deploy to each region
  for region_entry in "${REGIONS[@]}"; do
    IFS=':' read -r region_code region_name country_code <<< "$region_entry"
    
    droplet_name="${DROPLET_PREFIX}-${region_code}-${TIMESTAMP}"
    
    # Create droplet
    if create_droplet "$region_code" "$droplet_name" "$SSH_KEY" > /tmp/droplet_info.txt 2>&1; then
      read -r droplet_id droplet_name_ret public_ip region_ret < /tmp/droplet_info.txt
      
      log_success "Droplet created: $droplet_name (ID: $droplet_id)"
      
      # Wait for SSH
      if wait_for_ssh "$public_ip"; then
        # Install OpenVPN
        if install_openvpn "$public_ip" "$region_code"; then
          save_deployment_info "$droplet_id" "$region_name" "$public_ip" "$region_code" "$country_code"
          log_success "Deployment complete: $region_name ($public_ip)"
        fi
      fi
    else
      log_error "Failed to create droplet in $region_name"
    fi
    
    echo ""
  done
  
  # Update servers.json
  if [ -f "$DEPLOYMENT_LOG" ] && [ -s "$DEPLOYMENT_LOG" ]; then
    update_servers_json
  fi
  
  # Cleanup
  cleanup_deployment_log
  
  # Print summary
  print_summary
  
  echo ""
}

# Run main
main "$@"
