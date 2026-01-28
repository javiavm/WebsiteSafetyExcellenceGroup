# Deployment Guide

> Quick reference for deploying S.E.G. Website to production

**Domain:** safety-excellence.com | **Version:** 3.1.0

---

## Pre-Flight Checklist

### Required Before Deploy
- [ ] Domain DNS configured (safety-excellence.com → server IP)
- [ ] SSL certificate ready (Let's Encrypt or similar)
- [ ] Anthropic API key (for AEGIS chatbot)
- [ ] GHL webhook URLs (from GoHighLevel dashboard)

### Optional (for Subscriptions - COMING SOON)
- [ ] Stripe account with products created
- [ ] Stripe webhook endpoint configured

---

## Quick Deploy (5 Steps)

### 1. Clone & Install
```bash
git clone https://github.com/safety-excellence/S.E.G._website.git
cd S.E.G._website
cd server && npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
nano .env  # Edit with your values
```

**Required .env values:**
```env
ANTHROPIC_API_KEY=sk-ant-xxxxx          # From Anthropic Console
NODE_ENV=production
PORT=3001
ADMIN_KEY=your-secure-key-here          # Generate a strong key
SITE_URL=https://safety-excellence.com
```

**GHL Webhooks (get from GHL dashboard):**
```env
GHL_WEBHOOK_CLIENT=https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/...
GHL_WEBHOOK_CANDIDATE=https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/...
GHL_WEBHOOK_NEWSLETTER=https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/...
GHL_WEBHOOK_STKY=https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/4781670c-aa84-46f0-8dfc-f9d4f11d4a4c
GHL_WEBHOOK_SIF_FREE=https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/bc3371cc-84f6-474e-8d88-a4455cc0b9bc
GHL_WEBHOOK_SIF_PAID=https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/ad3d5210-a42a-4d55-a467-ceb8ec5ff2f0
```

### 3. Initialize Database
```bash
cd ../database
sqlite3 seg.db < schema.sql
sqlite3 seg.db < migrations/tools-v3.sql
```

### 4. Start with PM2
```bash
cd ../server
npm install -g pm2
pm2 start index.js --name "seg-website"
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

### 5. Configure Nginx (Reverse Proxy)
```nginx
server {
    listen 80;
    server_name safety-excellence.com www.safety-excellence.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name safety-excellence.com www.safety-excellence.com;

    ssl_certificate /etc/letsencrypt/live/safety-excellence.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/safety-excellence.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/seg /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Verify Deployment

```bash
# Health check
curl https://safety-excellence.com/api/health

# Expected response:
# {"status":"ok","service":"SEG Backend API",...}
```

### Test URLs
| Page | URL |
|------|-----|
| Homepage | https://safety-excellence.com/ |
| Why S.E.G. | https://safety-excellence.com/why-seg.html |
| Data Centers | https://safety-excellence.com/data-centers.html |
| Tools Landing | https://safety-excellence.com/tools/index.html |
| STKY Assessment | https://safety-excellence.com/tools/stky-assessment.html |
| SIF Scorecard | https://safety-excellence.com/tools/sif-scorecard.html |

---

## File Structure (What Goes Where)

```
S.E.G._website/
├── server/              # Node.js backend (runs on port 3001)
│   ├── index.js         # Main server
│   ├── .env             # YOUR CONFIG (create from .env.example)
│   ├── routes/          # API endpoints
│   ├── lib/             # Scoring engines
│   ├── agents/          # AI specialist agents
│   └── data/            # Config JSON files
│
├── public/              # Static frontend (served by Express)
│   ├── index.html       # Homepage
│   ├── tools/           # Assessment tools
│   ├── css/             # Stylesheets
│   └── js/              # Client scripts
│
├── database/            # SQLite database
│   ├── schema.sql       # Core tables
│   ├── migrations/      # V3 tools tables
│   └── seg.db           # DATABASE FILE (auto-created)
│
└── docs/                # Documentation
```

---

## Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -i :3001

# Check logs
pm2 logs seg-website
```

### Database errors
```bash
# Rebuild database
cd database
rm seg.db
sqlite3 seg.db < schema.sql
sqlite3 seg.db < migrations/tools-v3.sql
```

### Webhooks not firing
1. Check GHL webhook URLs in `.env`
2. Verify GHL location ID: `gdzuiKrnOBEej5nXBHbA`
3. Test with: `curl -X POST https://safety-excellence.com/api/forms/client -H "Content-Type: application/json" -d '{"test":true}'`

---

## Support

- **Repo:** github.com/safety-excellence/S.E.G._website
- **Docs:** See `/docs/PROJECT-MAP.md` for API reference
- **Phone:** 469.988.4777
- **Email:** info@safety-excellence.com
