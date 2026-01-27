# SEG Website & Tools Platform

Safety Excellence Group - Assessment Tools & AEGIS AI Chatbot Platform

## Overview

This platform provides:
- **AEGIS AI Chatbot** - Claude-powered safety assistant
- **STKY Assessment** - Hazard control maturity assessment tool (FREE)
- **P-SIF Scorecard** - SIF precursor recognition testing (FREE)
- **P-SIF Classification** - AI-powered near-miss classification (COMING SOON)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js 18+ / Express 4.x |
| AI | Anthropic Claude API |
| Database | SQLite 3 |
| Frontend | Vanilla JS / CSS |
| Integrations | GoHighLevel (GHL) Webhooks |

## Project Structure

```
seg-website/
├── server/                 # Backend API server
│   ├── index.js           # Main Express server (31KB)
│   ├── routes/            # API route handlers
│   │   ├── stky.js        # STKY assessment endpoints
│   │   ├── sif.js         # SIF scorecard endpoints
│   │   ├── sif-filter.js  # P-SIF AI classification
│   │   ├── metrics.js     # Metrics analyzer endpoints
│   │   └── admin.js       # Admin dashboard endpoints
│   ├── lib/               # Business logic engines
│   │   ├── stkyEngine.js  # STKY scoring (gap detection, recommendations)
│   │   └── sifEngine.js   # SIF scoring (scenarios, precursors)
│   ├── data/              # Tool configuration (JSON)
│   │   ├── stky-config.json   # Hazards, questions, scoring
│   │   └── sif-config.json    # Precursors, scenarios, weights
│   ├── services/          # Background services
│   │   └── opportunityDetector.js
│   └── utils/             # Utilities
│       └── excelExport.js
│
├── public/                # Static frontend
│   ├── tools/             # Assessment tool pages
│   │   ├── index.html     # Tools landing page
│   │   ├── stky-assessment.html  # FREE
│   │   ├── sif-scorecard.html    # FREE
│   │   ├── sif-filter.html       # COMING SOON
│   │   └── dashboard.html        # Results lookup
│   ├── css/
│   │   ├── tools-v3.css   # Tool styling (Apple-clean aesthetic)
│   │   └── aegis-chatbot.css
│   ├── js/
│   │   ├── tool-engine.js # Shared tool functionality
│   │   ├── aegis-chatbot.js
│   │   └── ...
│   ├── index.html         # Main website
│   └── admin-dashboard.html
│
├── database/
│   ├── db.js              # Database connection & queries
│   ├── schema.sql         # Core schema
│   └── migrations/
│       └── tools-v3.sql   # V3 tools tables
│
├── docs/                  # Documentation
│   ├── PROJECT-MAP.md     # API reference
│   ├── INTEGRATION-SNIPPET.html
│   └── ...
│
├── _archive/              # Legacy code (DO NOT USE)
│
├── CLAUDE.md              # AI assistant build instructions
├── SEG-TOOLS-V3.md        # Tool specifications
└── CHECKPOINT.md          # Build progress tracking
```

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm

### Installation

```bash
# Clone repository
git clone <repo-url>
cd seg-website

# Install server dependencies
npm run setup
# OR: cd server && npm install

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your ANTHROPIC_API_KEY

# Start development server
npm run dev

# Open http://localhost:3001/tools/index.html
```

### Scripts

```bash
npm start          # Production start
npm run dev        # Development with auto-reload
npm run setup      # Install all dependencies
```

## Environment Variables

Create `server/.env`:

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional (defaults shown)
PORT=3001
DATABASE_URL=../database/seg.db

# GHL Webhooks (get from GHL dashboard)
GHL_WEBHOOK_CLIENT=https://services.leadconnectorhq.com/hooks/.../webhook-trigger/...
GHL_WEBHOOK_CANDIDATE=https://services.leadconnectorhq.com/hooks/.../webhook-trigger/...
GHL_WEBHOOK_NEWSLETTER=https://services.leadconnectorhq.com/hooks/.../webhook-trigger/...
GHL_WEBHOOK_STKY=https://services.leadconnectorhq.com/hooks/.../webhook-trigger/...
GHL_WEBHOOK_SIF_FREE=https://services.leadconnectorhq.com/hooks/.../webhook-trigger/...
GHL_WEBHOOK_SIF_PAID=https://services.leadconnectorhq.com/hooks/.../webhook-trigger/...
```

## API Reference

### Health
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server health check |

### AEGIS Chatbot
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Send message to AI chatbot |

### STKY Assessment
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stky/config` | GET | Full configuration |
| `/api/stky/paths` | GET | Entry path options |
| `/api/stky/context` | GET | Context questions |
| `/api/stky/hazards/:pathId/:industry` | GET | Hazards for assessment |
| `/api/stky/hazard/:hazardId/questions` | GET | Questions for hazard |
| `/api/stky/session` | POST | Create/get session |
| `/api/stky/session/:sessionId` | GET | Session with scores |
| `/api/stky/assess` | POST | Submit & score assessment |
| `/api/stky/capture` | POST | Capture email post-assessment |

### SIF Scorecard
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sif/config` | GET | Full configuration |
| `/api/sif/paths` | GET | Entry path options |
| `/api/sif/scenarios` | GET | P-SIF classification scenarios |
| `/api/sif/precursors/:pathId` | GET | Precursors for path |
| `/api/sif/assess` | POST | Submit & score assessment |
| `/api/sif/capture` | POST | Capture email post-assessment |

### P-SIF AI Classification
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sif-filter/classify` | POST | Classify incident text |

### Forms (Legacy)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/forms/client` | POST | Client inquiry |
| `/api/forms/candidate` | POST | Candidate application |
| `/api/forms/newsletter` | POST | Newsletter signup |

## Database

### Tables

**Core:**
- `clients` - Client leads (scored HOT/WARM/NURTURE)
- `candidates` - Safety professional candidates (A/B/C/D rating)
- `assessments` - Legacy assessment data
- `newsletter_subscribers` - Email list
- `chatbot_conversations` - AEGIS chat history

**V3 Tools:**
- `tool_sessions` - Links STKY ↔ SIF assessments
- `tool_assessments_v3` - Assessment results, scores, gaps

### Migrations

Run V3 migration on fresh database:
```bash
sqlite3 database/seg.db < database/migrations/tools-v3.sql
```

## Tool Architecture

### STKY Assessment (FREE)
```
User Flow:
1. Select entry path (6 options based on why they're here)
2. Answer context questions (industry, phase, workforce, etc.)
3. Answer hazard questions (5 per hazard, industry-weighted)
4. View results (score, rating, gaps, recommendations, citations)
5. Optional: Capture email for detailed report

Scoring:
- Per-hazard scores (0-100)
- Overall weighted average
- Gap identification (critical/notable)
- Auto-generated recommendations
- Regulatory citations for low-scoring areas
```

### SIF Scorecard (FREE)
```
User Flow:
1. Select entry path
2. Classification scenarios (is it P-SIF or routine?)
3. Precursor questions
4. STKY integration (pulls existing scores if same session)
5. Results with blind spot analysis and citations

Features:
- Scenario blind spot detection
- Precursor gap analysis
- STKY data reuse (no duplicate questions)
- Regulatory citations
```

### P-SIF Classification (COMING SOON)
```
User inputs incident description → Claude analyzes → Returns:
- Classification: P-SIF or Routine
- Confidence level
- Energy sources identified
- Reasoning explanation

Status: Not yet active - redirects to tools page
```

## Development

### Code Patterns

```javascript
// Route handler pattern
router.post('/endpoint', async (req, res) => {
  try {
    const { field } = req.body;
    const result = await db.run('SQL', [params]);
    res.json({ success: true, data: result });
  } catch (e) {
    console.error('[Tag]', e.message);
    res.status(500).json({ error: 'Message' });
  }
});

// Scoring engine pattern
function scoreAssessment(responses, context) {
  // Calculate scores
  // Identify gaps
  // Generate recommendations
  return { overall, details, gaps, recommendations };
}
```

### Testing

```bash
# Health check
curl http://localhost:3001/api/health

# STKY flow
curl http://localhost:3001/api/stky/config
curl -X POST http://localhost:3001/api/stky/session \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-123"}'

# Full assessment test
curl -X POST http://localhost:3001/api/stky/assess \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "path": "audit",
    "context": {"industry": "construction"},
    "responses": {"hazards": {...}}
  }'
```

## Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production` in .env
- [ ] Configure production database path
- [ ] Set all GHL webhook URLs
- [ ] Enable HTTPS/SSL
- [ ] Set up reverse proxy (nginx)
- [ ] Configure process manager (PM2)
- [ ] Set up database backups
- [ ] Configure monitoring/logging

### Embed Chatbot
```html
<script src="https://yourdomain.com/js/aegis-chatbot.js"></script>
<script>
  AegisChatbot.init({
    apiEndpoint: 'https://yourdomain.com/api/chat'
  });
</script>
```

## Archive Notice

The `_archive/` folder contains legacy V1/V2 code preserved for reference:
- Old algorithms (now in `server/lib/`)
- Old config files (now in `server/data/`)
- Old frontend code (now updated)
- Old documentation

**Do not use archived code** - it's outdated and may not work.

## Files Reference

| File | Purpose |
|------|---------|
| `CLAUDE.md` | AI assistant instructions for builds |
| `SEG-TOOLS-V3.md` | Complete tool specifications |
| `CHECKPOINT.md` | Build progress tracking |
| `docs/PROJECT-MAP.md` | API documentation |
| `docs/INTEGRATION-SNIPPET.html` | Website embed code |

---

**Version:** 3.0.0
**Last Updated:** January 2026
**License:** Proprietary - Safety Excellence Group
