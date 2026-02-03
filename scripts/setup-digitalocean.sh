#!/bin/bash

# DigitalOcean VPN Deployment - Quick Setup Checklist
# Follow these 5 steps to deploy real VPN servers

echo "
╔════════════════════════════════════════════════════════════╗
║  OriginX - DigitalOcean VPN Quick Setup                   ║
╚════════════════════════════════════════════════════════════╝

This script will guide you through the setup process.

"

# Step 1: Create account
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Create DigitalOcean Account"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Visit: https://www.digitalocean.com/"
echo "2. Sign up with your email"
echo "3. Verify email"
echo "4. Add payment method"
echo ""
read -p "Press ENTER once account is created..."
echo ""

# Step 2: API Token
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Generate API Token"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Log in to DigitalOcean dashboard"
echo "2. Click 'Account' (top right) → 'API'"
echo "3. Click 'Generate New Token'"
echo "4. Name: originx-vpn-deployment"
echo "5. Check: read, write"
echo "6. Click 'Generate Token'"
echo "7. COPY the token (you won't see it again!)"
echo ""
read -p "Paste your API token: " DO_TOKEN

if [ -z "$DO_TOKEN" ]; then
  echo "❌ No token provided. Exiting."
  exit 1
fi

echo "✓ Token saved"
echo ""

# Step 3: SSH Key
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Set Up SSH Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f ~/.ssh/id_rsa.pub ]; then
  echo "✓ SSH key found: ~/.ssh/id_rsa.pub"
else
  echo "No SSH key found. Creating one..."
  ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
  echo "✓ SSH key created"
fi

echo ""
echo "Now upload to DigitalOcean:"
echo "1. Go to: Account → Security → SSH keys"
echo "2. Click 'Add SSH Key'"
echo "3. Paste contents of:"
cat ~/.ssh/id_rsa.pub | sed 's/^/   /'
echo ""
echo "4. Name: mac-deployment-key"
echo "5. Click 'Add SSH Key'"
echo ""
read -p "Press ENTER once SSH key is uploaded..."
echo ""

# Step 4: Install tools
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Install Required Tools"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Install doctl
if command -v doctl &> /dev/null; then
  echo "✓ doctl already installed"
else
  echo "Installing doctl..."
  brew install doctl
  echo "✓ doctl installed"
fi

# Install jq
if command -v jq &> /dev/null; then
  echo "✓ jq already installed"
else
  echo "Installing jq..."
  brew install jq
  echo "✓ jq installed"
fi

echo ""

# Step 5: Authenticate
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5: Authenticate doctl"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Authenticating with token..."
echo "$DO_TOKEN" | doctl auth init --access-token

if doctl auth list &> /dev/null; then
  echo "✓ Authentication successful"
else
  echo "❌ Authentication failed"
  exit 1
fi

echo ""

# Step 6: Deploy
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 6: Deploy VPN Servers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ready to deploy 6 VPN servers to DigitalOcean:"
echo ""
echo "  🇺🇸 New York       (USA)       - $6/month"
echo "  🇬🇧 London        (UK)        - $6/month"
echo "  🇩🇪 Frankfurt      (Germany)   - $6/month"
echo "  🇸🇬 Singapore      (Asia)      - $6/month"
echo "  🇦🇺 Sydney        (Australia) - $6/month"
echo "  🇨🇦 Toronto       (Canada)    - $6/month"
echo ""
echo "Total Cost: \$36/month"
echo ""

read -p "Ready to deploy? (yes/no): " DEPLOY_CONFIRM

if [ "$DEPLOY_CONFIRM" != "yes" ]; then
  echo "Cancelled."
  exit 0
fi

echo ""
echo "Starting deployment..."
echo ""

# Run deployment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"
./scripts/deploy-digitalocean.sh

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ Deployment complete!"
  echo ""
  echo "Next steps:"
  echo "  1. View servers: npm run dev"
  echo "  2. Test connection: Check dashboard at http://localhost:3000"
  echo "  3. Manage servers: doctl compute droplet list"
  echo ""
else
  echo ""
  echo "❌ Deployment failed. Check errors above."
  exit 1
fi
