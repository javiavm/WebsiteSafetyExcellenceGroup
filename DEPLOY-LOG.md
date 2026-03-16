# SEG Website — Deployment Log
**Project:** Safety Excellence Group Website V1
**URL:** https://safety-excellence.com
**Date:** 2026-03-06
**Executed by:** Javier Vidal
**Reviewed by:** ___________________

---

## EXECUTIVE SUMMARY

The Safety Excellence Group website was migrated from a WordPress template to a fully custom Node.js/Express project, deployed on AWS EC2. The site includes the AEGIS chatbot (Claude AI), forms connected to GoHighLevel (GHL), a SQLite database, and assessment tools (STKY, SIF).

---

## TECH STACK

| Component | Technology |
|-----------|-----------|
| Server | AWS EC2 t3.micro — Ubuntu 24.04 LTS |
| Runtime | Node.js 20 + Express 4.21 |
| Database | SQLite 3 |
| Proxy | Nginx 1.24 |
| Process Manager | PM2 |
| SSL | Let's Encrypt (Certbot) — Auto-renewal |
| Static IP | Elastic IP: 54.201.132.161 |
| DNS | Squarespace DNS |
| AI | Anthropic Claude API (AEGIS chatbot) |
| CRM | GoHighLevel webhooks |

---

## PHASE 1 — LOCAL PREPARATION

### 1.1 Source Code
- **Repository:** `https://github.com/safety-excellence/S.E.G._website.git`
- **Production branch:** `release/website-v1`
- Pre-deploy changes include: mobile adjustments in `industries.html`, `services.html`, `index.html` (stats bar, lifecycle grid, nav buttons)

### 1.2 Fix Applied Before Deploy
- **Issue:** `company_email` field sent by the frontend did not match the `email` field expected by the backend in the "Request Support" form
- **File modified:** `server/index.js` lines 303, 309, 330
- **Fix:** Added `formData.company_email` as a fallback when reading the email field

---

## PHASE 2 — AWS INFRASTRUCTURE

### 2.1 EC2 Instance Created
- **Name:** seg-website
- **AMI:** Ubuntu Server 24.04 LTS (HVM), SSD Volume Type
- **Type:** t3.micro
- **Storage:** 20 GB gp3
- **Key Pair:** SEG-WEBSITE.pem (stored at `C:\dev\SEG-WEBSITE.pem`)

### 2.2 Security Group Configured
| Port | Protocol | Source |
|------|----------|--------|
| 22 | SSH | My IP |
| 80 | HTTP | Anywhere (0.0.0.0/0) |
| 443 | HTTPS | Anywhere (0.0.0.0/0) |

### 2.3 Elastic IP Assigned
- **IP:** `54.201.132.161`
- Permanently associated with the `seg-website` instance

---

## PHASE 3 — SERVER CONFIGURATION

### 3.1 SSH Connection
```bash
ssh -i /c/dev/SEG-WEBSITE.pem ubuntu@54.201.132.161
```

### 3.2 Dependencies Installed
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx sqlite3
sudo npm install -g pm2
```
- Node.js 20 ✓
- Nginx 1.24 ✓
- SQLite3 ✓
- PM2 ✓

### 3.3 Code Deployed
The repository was private. Code was transferred using `scp` from the local machine:
```bash
# From local PC
scp -i /c/dev/SEG-WEBSITE.pem seg-website.tar.gz ubuntu@54.201.132.161:/home/ubuntu/
# On EC2
mkdir seg-website && cd seg-website
tar xzf ../seg-website.tar.gz
npm install
cd server && npm install
```

### 3.4 Environment Variables (.env)
File created at `/home/ubuntu/seg-website/server/.env`:

```
NODE_ENV=production
PORT=3001
DATABASE_URL=../database/seg.db
ADMIN_KEY=***************
SITE_URL=https://safety-excellence.com
BASE_URL=https://safety-excellence.com
ANTHROPIC_API_KEY=sk-ant-****** (configured)
GHL_WEBHOOK_CLIENT=...dd8498d0-c790-48af-a7e7-28de6a3a0def
GHL_WEBHOOK_CANDIDATE=...255f5c21-06a3-4b59-a5b3-6b652570a779
GHL_WEBHOOK_NEWSLETTER=...64c3d0b5-a1fa-4574-a15b-137357fba21e
GHL_WEBHOOK_STKY=...4781670c-aa84-46f0-8dfc-f9d4f11d4a4c
GHL_WEBHOOK_SIF_FREE=...bc3371cc-84f6-474e-8d88-a4455cc0b9bc
GHL_WEBHOOK_SIF_PAID=...ad3d5210-a42a-4d55-a467-ceb8ec5ff2f0
```

### 3.5 Database Initialized
```bash
cd /home/ubuntu/seg-website/database
sqlite3 seg.db < schema.sql
sqlite3 seg.db < migrations/tools-v3.sql
sqlite3 seg.db < migrations/users.sql
```
- Tables created: `clients`, `candidates`, `assessments`, `newsletter_subscribers`, `chatbot_conversations`, `stage2_results`, `tool_results`, `users`

### 3.6 Server Started with PM2
```bash
cd /home/ubuntu/seg-website/server
pm2 start index.js --name seg-website
pm2 save
pm2 startup  # Auto-start on reboot configured
```
- Verification: `curl http://localhost:3001/api/health` → `{"status":"ok",...}` ✓

---

## PHASE 4 — NGINX (REVERSE PROXY)

File created at `/etc/nginx/sites-available/seg-website`:
- Proxies requests to Node.js at `127.0.0.1:3001`
- Static asset caching (30 days)
- Proxy headers configured

```bash
sudo ln -s /etc/nginx/sites-available/seg-website /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```
- Result: `syntax is ok` / `test is successful` ✓

---

## PHASE 5 — DNS (SQUARESPACE)

### DNS Records Before Change
| Type | Name | Value |
|------|------|-------|
| A | @ | 198.12.238.211 (WordPress) |
| MX | @ | safetyexcellence-com01e.mail.protection.outlook.com |
| TXT | @ | v=spf1 include:spf.protection.outlook.com -all |
| TXT | @ | MS=ms37296279 |
| TXT | @ | anthropic-domain-verification-tmnyy4=... |

### Changes Made in Squarespace DNS
| Action | Type | Name | Value |
|--------|------|------|-------|
| MODIFIED | A | @ | 198.12.238.211 → **54.201.132.161** |

### Records Preserved (unchanged)
- MX → Outlook (corporate email unaffected)
- TXT SPF → Outlook
- TXT MS → Microsoft 365 verification
- TXT Anthropic → domain verification

### DNS Verification
```bash
dig @ns01.squarespacedns.com safety-excellence.com A +short
# → 54.201.132.161 ✓

dig @8.8.8.8 safety-excellence.com A +short
# → 54.201.132.161 ✓
```

---

## PHASE 6 — SSL / HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d safety-excellence.com -d www.safety-excellence.com
```

- Certificate issued by: **Let's Encrypt**
- Valid until: **2026-06-04**
- Auto-renewal: configured via `certbot.timer` (systemd)
- HTTPS active at: `https://safety-excellence.com` and `https://www.safety-excellence.com`

---

## PHASE 7 — POST-DEPLOY FIXES

### 7.1 Admin Dashboard
- **Issue:** `API_BASE = 'http://localhost:3001'` was hardcoded in `admin-dashboard.html`
- **Fix applied on EC2:**
```bash
sed -i "s|const API_BASE = 'http://localhost:3001'|const API_BASE = ''|" \
  /home/ubuntu/seg-website/public/admin-dashboard.html
```
- **Result:** Admin dashboard connects correctly ✓

### 7.2 Client Form Email Field
- **Issue:** `email: undefined` → `SQLITE_CONSTRAINT: NOT NULL` error
- **Root cause:** Frontend sends `company_email`, backend expected `email`
- **Fix:** `server/index.js` updated with `formData.company_email` fallback
- **Fix deployed:**
```bash
# From local PC
scp -i /c/dev/SEG-WEBSITE.pem server/index.js ubuntu@54.201.132.161:/home/ubuntu/seg-website/server/index.js
# On EC2
pm2 restart seg-website
```

---

## FINAL VERIFICATION

| Check | Status |
|-------|--------|
| `https://safety-excellence.com` | ✅ Online |
| `https://www.safety-excellence.com` | ✅ Online |
| SSL (green padlock) | ✅ Let's Encrypt |
| `https://safety-excellence.com/api/health` | ✅ `{"status":"ok"}` |
| `https://safety-excellence.com/industries.html` | ✅ |
| `https://safety-excellence.com/services.html` | ✅ |
| `https://safety-excellence.com/why-seg.html` | ✅ |
| `https://safety-excellence.com/careers.html` | ✅ |
| `https://safety-excellence.com/data-centers.html` | ✅ |
| AEGIS Chatbot | ✅ Responding via Claude AI |
| Newsletter signup | ✅ Registered in GHL (verified in logs) |
| Request Support form | ✅ Fix applied |
| Admin Dashboard | ✅ Fix applied |
| PM2 auto-start on reboot | ✅ Configured |
| SSL auto-renewal | ✅ Certbot timer active |
| Corporate email (Outlook) | ✅ Unaffected |

---

## OPERATIONS REFERENCE

### Monitoring
```bash
ssh -i /c/dev/SEG-WEBSITE.pem ubuntu@54.201.132.161

pm2 status                        # Process status
pm2 logs seg-website --lines 50   # Recent logs
pm2 monit                         # Real-time monitor
curl https://safety-excellence.com/api/health  # Health check
```

### Deploying Updates
```bash
# 1. From local PC — push changes to GitHub
git add .
git commit -m "description of change"
git push origin release/website-v1

# 2. On EC2 — pull and apply changes
ssh -i /c/dev/SEG-WEBSITE.pem ubuntu@54.201.132.161
cd /home/ubuntu/seg-website
git pull origin release/website-v1
cd server && npm install
pm2 restart seg-website
```

### If the Server Goes Down
```bash
ssh -i /c/dev/SEG-WEBSITE.pem ubuntu@54.201.132.161
pm2 resurrect         # Restore saved processes
pm2 restart all       # Or restart manually
```

### Manually Renew SSL (if needed)
```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## ACCESS INFORMATION

| Resource | Value |
|----------|-------|
| Production URL | https://safety-excellence.com |
| Server IP | 54.201.132.161 |
| SSH User | ubuntu |
| SSH Key | SEG-WEBSITE.pem (at C:\dev\) |
| Admin Dashboard | https://safety-excellence.com/admin-dashboard.html |
| Admin Key | Stored in server .env file |
| PM2 Process Name | seg-website |
| Project Path | /home/ubuntu/seg-website/ |
| PM2 Logs | /home/ubuntu/.pm2/logs/ |
| Nginx Config | /etc/nginx/sites-available/seg-website |
| SSL Certificate | /etc/letsencrypt/live/safety-excellence.com/ |

---

## IMPORTANT NOTES

1. **SEG-WEBSITE.pem** is the only SSH access key. Store it securely. If lost, a new key pair must be created from the AWS Console and reassigned to the instance.
2. **The .env file** must never be committed to GitHub. It contains production API keys and webhook URLs.
3. **Corporate email (Outlook/Microsoft 365)** was not affected. MX and SPF records were preserved intact throughout the DNS migration.
4. **SQLite** stores all leads, candidates, and chatbot conversations at `/home/ubuntu/seg-website/database/seg.db`. Regular backups are recommended.
5. **The SSL certificate** expires on 2026-06-04 but renews automatically via certbot.timer.

---

*Document generated on 2026-03-06*
