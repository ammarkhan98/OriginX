# Deploy Real VPN Servers on DigitalOcean

## Prerequisites
- DigitalOcean account (create at https://www.digitalocean.com)
- SSH key pair on your machine
- `doctl` CLI tool installed (`brew install doctl` on macOS)

## Step 1: Install & Configure DigitalOcean CLI

```bash
# Install doctl
brew install doctl

# Authenticate with DigitalOcean (get API token from account settings)
doctl auth init
# When prompted, paste your DigitalOcean API token
```

## Step 2: Create Droplets in Multiple Regions

Create a droplet (virtual server) in each region. Use Ubuntu 22.04 LTS as the OS.

### Option A: Manual Creation (One at a time)
1. Go to https://cloud.digitalocean.com
2. Click "Create" → "Droplets"
3. Select **Ubuntu 22.04 LTS**
4. Choose region: New York, London, Frankfurt, Singapore, Sydney, Toronto, etc.
5. Size: **$6/month** (1GB RAM, 1vCPU)
6. Add your SSH key for authentication
7. Click "Create Droplet"

### Option B: Script to Create Multiple Droplets at Once

```bash
#!/bin/bash

# Create droplets in different regions
REGIONS=("nyc3" "lon1" "fra1" "sgp1" "syd1" "tor1")
REGION_NAMES=("US-NY" "UK-London" "DE-Frankfurt" "SG-Singapore" "AU-Sydney" "CA-Toronto")

for i in "${!REGIONS[@]}"; do
    REGION="${REGIONS[$i]}"
    NAME="vpn-${REGION_NAMES[$i]}-$(date +%s)"
    
    echo "Creating droplet in $REGION: $NAME"
    
    doctl compute droplet create "$NAME" \
        --region "$REGION" \
        --image ubuntu-22-04-x64 \
        --size s-1vcpu-1gb \
        --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
        --wait
done

# List all created droplets with IPs
echo "Created droplets:"
doctl compute droplet list --format Name,PublicIPv4,Region --no-header
```

Save this as `create-droplets.sh` and run:
```bash
chmod +x create-droplets.sh
./create-droplets.sh
```

## Step 3: Install OpenVPN on Each Droplet

Once your droplets are running, SSH into each and install OpenVPN:

```bash
# SSH into the droplet (replace IP with actual droplet IP)
ssh root@DROPLET_IP

# On the droplet, run this one-liner to install OpenVPN
curl -O https://raw.githubusercontent.com/Nyr/openvpn-install/master/openvpn-install.sh
chmod +x openvpn-install.sh
./openvpn-install.sh

# The script will ask:
# - Which IP/hostname? (choose public IP)
# - Which port? (default 1194)
# - Which protocol? (UDP recommended for VPN)
# - Which DNS provider? (8.8.8.8 or Cloudflare)
# - Compress? (yes)
```

## Step 4: Extract Server IPs

After all droplets are created, list them:

```bash
doctl compute droplet list --format Name,PublicIPv4,Region --no-header
```

Output will look like:
```
vpn-US-NY-1706814234          45.55.123.45    nyc3
vpn-UK-London-1706814234      167.99.182.45   lon1
vpn-DE-Frankfurt-1706814234   161.35.200.45   fra1
vpn-SG-Singapore-1706814234   164.92.70.45    sgp1
vpn-AU-Sydney-1706814234      203.135.45.45   syd1
vpn-CA-Toronto-1706814234     149.56.6.45     tor1
```

## Step 5: Update servers.json with Real IPs

Take the IPs from step 4 and update your `servers.json`:

```json
{
  "servers": [
    {
      "id": "us-ny-1",
      "name": "USA - New York",
      "countryCode": "US",
      "city": "New York",
      "ip": "45.55.123.45",
      "protocol": "UDP",
      "load": 20,
      "ping": 15
    },
    {
      "id": "gb-london-1",
      "name": "UK - London",
      "countryCode": "GB",
      "city": "London",
      "ip": "167.99.182.45",
      "protocol": "UDP",
      "load": 25,
      "ping": 80
    },
    // ... repeat for other servers
  ]
}
```

## Step 6: Test VPN Connections

Once OpenVPN is running on each server, you can test connectivity:

```bash
# Ping a server
ping -c 2 45.55.123.45

# Download OpenVPN config and connect (advanced)
# scp root@45.55.123.45:/root/client.ovpn ./
# openvpn client.ovpn
```

## Cost Breakdown
- **$6/month per droplet** × 6 regions = **$36/month**
- All droplets include 1TB/month bandwidth (adequate for development)

## Region Codes Reference
| Region | Code | Location |
|--------|------|----------|
| New York | nyc3 | USA - East Coast |
| London | lon1 | UK |
| Frankfurt | fra1 | Germany |
| Singapore | sgp1 | Asia |
| Sydney | syd1 | Australia |
| Toronto | tor1 | Canada |
| Amsterdam | ams3 | Netherlands |
| San Francisco | sfo3 | USA - West Coast |

## Next Steps
1. Create DigitalOcean account
2. Generate API token from account settings
3. Run `doctl auth init` and authenticate
4. Run the droplet creation script
5. SSH into each droplet and install OpenVPN
6. Extract IPs and update `servers.json`
7. Test connectivity with ping/curl

## Troubleshooting
- **API token error**: Verify token at https://cloud.digitalocean.com/account/api/tokens
- **SSH key not found**: Create SSH key first: `ssh-keygen -t ed25519`
- **Droplet creation slow**: DigitalOcean can take 1-2 minutes per droplet
- **OpenVPN install fails**: Try: `apt update && apt upgrade -y` first
