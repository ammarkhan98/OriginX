# DigitalOcean VPN Deployment Guide

## Quick Start (5 minutes)

### Step 1: Create DigitalOcean Account
1. Go to https://www.digitalocean.com/
2. Sign up (get $200 credit if using referral code)
3. Verify email

### Step 2: Generate API Token
1. Log in to DigitalOcean dashboard
2. Go to: **Account** → **API** → **Tokens**
3. Click **Generate New Token**
4. Name: `originx-vpn-deployment`
5. Permissions: Check `read` and `write`
6. Click **Generate Token**
7. **Copy the token** (you won't see it again)

### Step 3: Upload SSH Key
1. On your Mac, check for SSH key:
```bash
cat ~/.ssh/id_rsa.pub
```

If not found, create one:
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
```

2. In DigitalOcean dashboard:
   - Go to: **Account** → **Security** → **SSH keys**
   - Click **Add SSH Key**
   - Paste your public key
   - Name: `mac-deployment-key`
   - Click **Add SSH Key**

### Step 4: Install Required Tools
```bash
# Install doctl (DigitalOcean CLI)
brew install doctl

# Install jq (JSON parser)
brew install jq

# Verify installations
doctl version
jq --version
```

### Step 5: Authenticate doctl
```bash
doctl auth init
```

When prompted, paste your API token from Step 2.

### Step 6: Deploy VPN Servers
```bash
cd /path/to/OriginX

# Make script executable
chmod +x scripts/deploy-digitalocean.sh

# Run deployment
./scripts/deploy-digitalocean.sh
```

This will:
- ✅ Create 6 droplets (one per region)
- ✅ Install OpenVPN on each
- ✅ Extract public IPs
- ✅ Update `src/config/servers.json` with real IPs
- ✅ Display deployment summary

**Total time:** 15-20 minutes

---

## What Gets Deployed

| Region | Droplet | Cost/Month | Location |
|--------|---------|-----------|----------|
| `nyc3` | originx-vpn-nyc3-* | $6 | New York, USA |
| `lon1` | originx-vpn-lon1-* | $6 | London, UK |
| `fra1` | originx-vpn-fra1-* | $6 | Frankfurt, Germany |
| `sgp1` | originx-vpn-sgp1-* | $6 | Singapore, Asia |
| `syd1` | originx-vpn-syd1-* | $6 | Sydney, Australia |
| `tor1` | originx-vpn-tor1-* | $6 | Toronto, Canada |

**Total Cost:** $36/month for 6 global VPN servers

---

## Manual Steps (if script fails)

### Create a Single Droplet
```bash
# Get SSH key ID
SSH_KEY_ID=$(doctl compute ssh-key list --format ID --no-header | head -1)

# Create droplet
doctl compute droplet create originx-vpn-us \
  --region nyc3 \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-1gb \
  --ssh-keys $SSH_KEY_ID \
  --wait \
  --format ID,Name,PublicIPv4
```

### SSH into Droplet
```bash
ssh root@<PUBLIC_IP>
```

### Install OpenVPN Manually
```bash
# On the droplet:
apt-get update && apt-get upgrade -y
apt-get install -y openvpn easy-rsa

# Download installer
curl -O https://raw.githubusercontent.com/Nyr/openvpn-install/master/openvpn-install.sh
chmod +x openvpn-install.sh

# Run with auto-answers
HEADLESS_MODE=1 bash openvpn-install.sh
```

### Extract Public IP
```bash
# Get droplet IP
doctl compute droplet list --format Name,PublicIPv4 --no-header | grep originx-vpn

# Or specific region
doctl compute droplet get originx-vpn-us --format PublicIPv4 --no-header
```

---

## Troubleshooting

### ✗ "doctl not authenticated"
```bash
doctl auth init  # Re-authenticate with API token
```

### ✗ "No SSH keys found"
1. Create SSH key: `ssh-keygen -t rsa -b 4096`
2. Upload to DigitalOcean dashboard
3. Import with doctl: `doctl compute ssh-key import my-key --public-key-file ~/.ssh/id_rsa.pub`

### ✗ "Droplet creation failed"
- Check account has enough credit
- Verify region is available
- Try different region code

### ✗ "SSH timeout"
- Droplet may need more time to boot
- Check firewall rules in DigitalOcean dashboard
- Manually SSH: `ssh root@<IP>`

### ✗ "OpenVPN installation failed"
SSH into droplet and check:
```bash
apt-get install -y openvpn easy-rsa
# Check service
systemctl status openvpn
```

---

## After Deployment

### 1. Verify Servers in Dashboard
```bash
npm run dev
# Visit http://localhost:3000
# Check if all 6 servers appear in the VPN list
```

### 2. Test VPN Connection
```bash
# Get config from a server
# curl https://<VPN_IP>:1194/downloads/client.ovpn

# Or test connectivity
ping <VPN_IP>
```

### 3. Monitor Server Health
```bash
# SSH into any server
ssh root@<VPN_IP>

# Check OpenVPN status
systemctl status openvpn@server

# View logs
tail -f /var/log/openvpn/server.log

# Check connections
netstat -antp | grep 1194
```

---

## Cost Optimization

### Keep Costs Low
- Minimum droplet size: `s-1vcpu-1gb` ($6/month)
- Shared CPU is fine for VPN
- Monitor hourly charges: $0.0089/hour

### Destroy Unused Droplets
```bash
# List all originx droplets
doctl compute droplet list | grep originx-vpn

# Delete a droplet
doctl compute droplet delete <DROPLET_ID>
```

### Scale Up Later
- Start with 2-3 regions ($12-18/month)
- Add more as user base grows
- Use auto-scaling if demand increases

---

## Scripts Reference

### Deploy All Servers
```bash
./scripts/deploy-digitalocean.sh
```

### Check Deployment Status
```bash
doctl compute droplet list --format Name,Status,PublicIPv4
```

### Update servers.json After Manual Deployment
```bash
# Edit src/config/servers.json manually:
# Add droplet IP for each deployed server
# Format:
{
  "id": "do-us-1",
  "name": "USA - New York (DigitalOcean)",
  "countryCode": "US",
  "city": "New York",
  "ip": "YOUR_DROPLET_IP",
  "protocol": "UDP",
  "load": 25,
  "ping": 50,
  "source": "digitalocean"
}
```

### Retrieve All IPs
```bash
doctl compute droplet list --format Name,PublicIPv4 --no-header | \
  grep originx-vpn | \
  awk '{print $NF}'
```

---

## Security Considerations

### 1. Firewall Rules
Only allow necessary ports:
- 1194/UDP: OpenVPN
- 22/TCP: SSH (management only)
- Block everything else

### 2. SSH Access
Change root password:
```bash
# On droplet
passwd  # Set strong password
```

### 3. OpenVPN Security
- Use encryption: AES-256
- Use authentication: SHA256
- Disable compression (reduces attack surface)

### 4. Monitoring
Set up alerts in DigitalOcean for:
- High CPU usage
- High bandwidth
- Droplet down

---

## Next Steps

1. ✅ Deploy servers with script
2. ✅ Verify servers in app
3. ✅ Test VPN connections
4. 📝 Set up monitoring/alerts
5. 📝 Configure DNS (optional)
6. 📝 Add backup/redundancy
7. 📝 Scale to more regions

---

## Useful Links

- **DigitalOcean Dashboard**: https://cloud.digitalocean.com/
- **doctl Documentation**: https://docs.digitalocean.com/reference/doctl/
- **OpenVPN Documentation**: https://openvpn.net/community-resources/
- **OriginX Repo**: https://github.com/ammarkhan98/OriginX

---

## Support

If deployment fails:
1. Check error message in script output
2. Review troubleshooting section above
3. Check DigitalOcean dashboard for droplet logs
4. SSH into droplet manually for debugging

Good luck! 🚀
