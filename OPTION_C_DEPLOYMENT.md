# Option C: Toronto + Free Morocco Deployment

**Total Cost: $6/month** ✅  
**Setup Time: 15-20 minutes**

## Quick Start

### 1. Get DigitalOcean Ready
```bash
# Install doctl
brew install doctl

# Authenticate
doctl auth init
# Paste your API token when prompted

# Upload SSH key to DigitalOcean (if you haven't)
doctl compute ssh-key import mykey --public-key-file ~/.ssh/id_rsa.pub
```

### 2. Deploy Toronto Server
```bash
chmod +x scripts/deploy-toronto.sh
./scripts/deploy-toronto.sh
```

The script will:
- ✅ Create 1 droplet in Toronto ($6/month)
- ✅ Install OpenVPN with AES-256 encryption
- ✅ Extract public IP
- ✅ Update servers.json automatically
- ✅ Keep free Morocco server

**Time: ~10 minutes**

### 3. Test VPN
```bash
npm run dev
```

Open http://localhost:3000 and see:
- 🇨🇦 Toronto (Real DigitalOcean server)
- 🇲🇦 Morocco (Free VPN Gate)
- + 5 other free servers

## Your Configuration

| Server | Location | Cost | Source |
|--------|----------|------|--------|
| **Toronto** | Canada | $6/mo | DigitalOcean |
| **Morocco** | Africa | Free | VPN Gate |
| **South Africa** | Africa | Free | VPN Gate |
| **Egypt** | Africa | Free | VPN Gate |
| **Nigeria** | Africa | Free | VPN Gate |
| **Brazil** | South America | Free | VPN Gate |
| **Mexico** | North America | Free | VPN Gate |
| **India** | Asia | Free | VPN Gate |

**Total: 1 paid + 7 free servers**

## Monthly Cost Breakdown

```
DigitalOcean:  $6.00
VPN Gate:      $0.00 (free)
─────────────────────
TOTAL:         $6.00/month
```

## Setup Troubleshooting

### Issue: "doctl: command not found"
```bash
brew install doctl
```

### Issue: "doctl not authenticated"
```bash
doctl auth init
# Paste API token
```

### Issue: "No SSH keys found"
1. Go to https://cloud.digitalocean.com/settings/security
2. Click "Add SSH Key"
3. Upload your public key (`cat ~/.ssh/id_rsa.pub`)
4. Try deployment again

### Issue: Deployment hangs on SSH
The droplet may take 2-3 minutes to boot. Wait or restart:
```bash
# Check droplet status
doctl compute droplet list

# If stuck, manually terminate
doctl compute droplet delete <DROPLET_ID>
```

## What's Included

✅ Automated 1-click deployment  
✅ AES-256 encrypted tunnel  
✅ Real public IP address  
✅ Fully managed OpenVPN server  
✅ Auto-updated servers.json  
✅ Free Morocco server (stays active)  

## Next Steps

1. **Deploy:** `./scripts/deploy-toronto.sh`
2. **Test:** `npm run dev`
3. **Monitor:** Check dashboard for real servers
4. **Scale:** Easy to add more servers later ($6 each)

## Cost Comparison

- **Option A** (Toronto + Frankfurt + Free Morocco): $12/month
- **Option B** (Toronto + London): $12/month  
- **Option C** (Toronto + Free Morocco): **$6/month** ✅ YOU ARE HERE

## Support

For issues, check:
- `scripts/deploy-toronto.sh` logs
- DigitalOcean dashboard for droplet status
- `src/config/servers.json` for server list
