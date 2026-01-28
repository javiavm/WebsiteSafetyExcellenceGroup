# S.E.G. Website & Tools Platform

Safety Excellence Group - Assessment Tools & AEGIS AI Chatbot Platform

**Version:** 3.1.0 | **Domain:** safety-excellence.com | **Updated:** 2026-01-27

## Overview

This platform provides:
- **AEGIS AI Chatbot** - Claude-powered safety assistant
- **STKY Assessment** - Hazard control maturity assessment tool (FREE)
- **P-SIF Scorecard** - SIF precursor recognition testing (FREE)
- **P-SIF Classification** - AI-powered near-miss classification (COMING SOON)
- **DC Safety Checklist** - 20-point interactive assessment with ROI calculator

---

## Release Roadmap

### Phase 1: Website Launch (PRIORITY)
| Component | Status | Description |
|-----------|--------|-------------|
| Main Website | ✅ Ready | Homepage, Why S.E.G., Careers, Data Centers pages |
| GHL Webhooks | ✅ Ready | Client, Candidate, Newsletter forms → GHL automation |
| Lead Scoring | ✅ Ready | HOT/WARM/NURTURE classification |
| Candidate Scoring | ✅ Ready | A/B/C/D fit rating |
| AEGIS Chatbot | ✅ Ready | Claude-powered safety assistant |
| DC Safety Checklist | ✅ Ready | 20-point assessment with ROI |

**Go-Live Requirements:**
- [ ] Deploy to safety-excellence.com
- [ ] Configure production GHL webhook URLs
- [ ] SSL/HTTPS enabled
- [ ] DNS configured

### Phase 2: Tools Release (Shortly After Website)
| Tool | Status | Description |
|------|--------|-------------|
| STKY Assessment | ✅ Ready | Hazard control maturity (FREE) |
| P-SIF Scorecard | ✅ Ready | SIF precursor recognition (FREE) |
| Results Dashboard | ✅ Ready | Email-based results lookup |
| P-SIF Classification | 🔜 Coming | AI near-miss classifier |

**Go-Live Requirements:**
- [ ] QA test all tool flows
- [ ] Verify webhook delivery to GHL
- [ ] Add Tools link to main nav

### Phase 3: Algorithms & AI Enhancement (Close Second)
| Component | Status | Priority | Description |
|-----------|--------|----------|-------------|
| **Lead Scoring Algorithm** | ✅ Ready | HIGH | 0-100 scoring → HOT/WARM/NURTURE |
| **Candidate Scoring Algorithm** | ✅ Ready | HIGH | Certifications, experience → A/B/C/D rating |
| **Matching Algorithm** | ✅ Ready | HIGH | Client-candidate weighted matching |
| **Stage 2 WHO Assessment** | ✅ Ready | HIGH | Behavioral interview scoring |
| **Opportunity Detector** | ✅ Ready | HIGH | Auto-triggers on HOT leads |
| **SME Agent Navigator** | ✅ Ready | HIGH | Routes queries to specialist agents |
| **Falls Specialist Agent** | ✅ Ready | HIGH | Fall protection SME (Claude) |
| **Electrical Specialist Agent** | ✅ Ready | HIGH | Arc flash/LOTO SME (Claude) |
| **DC Specialist Agent** | ✅ Ready | HIGH | Data center safety SME (Claude) |
| **General Specialist Agent** | ✅ Ready | HIGH | Compliance fallback (Claude) |
| **Citation Engine** | ✅ Ready | MEDIUM | OSHA/NFPA/ANSI regulatory citations |
| **Benchmarking Engine** | ✅ Ready | MEDIUM | Industry comparison (PRO feature) |
| **Recommendations Engine** | ✅ Ready | MEDIUM | PhD-level recommendations (PRO) |

---

## Algorithms & AI (Core Differentiator)

Our proprietary algorithms and AI agents are what set S.E.G. apart. These run automatically in the background.

### Scoring Algorithms
```
algorithms/
├── leadScoring.js        # Client leads → HOT/WARM/NURTURE (0-100)
├── candidateScoring.js   # Candidates → A/B/C/D rating (0-110)
├── matchingAlgorithm.js  # Client ↔ Candidate weighted matching
├── stage2Assessment.js   # WHO Method behavioral interview scoring
└── metricsAnalyzer.js    # Safety metrics analysis
```

### AI Support Tools (Claude-Powered)
```
server/agents/
├── navigator.js              # Query router → best specialist
├── falls-specialist.js       # Fall protection SME
├── electrical-specialist.js  # Arc flash, LOTO, NFPA 70E
├── dc-specialist.js          # Data center construction safety
└── general-specialist.js     # General compliance fallback

server/lib/
├── citationEngine.js         # Regulatory citation lookup
├── benchmarkEngine.js        # Industry benchmarking (PRO)
└── recommendationsEngine.js  # PhD-level recommendations (PRO)
```

### How They Work Together
```
Client submits form
    → leadScoring.js scores (0-100)
    → IF HOT: opportunityDetector.js triggers
        → matchingAlgorithm.js finds B+ candidates
        → Stage 2 invites sent via GHL
        → Admin alerted

User asks AEGIS a question
    → navigator.js classifies domain
    → Routes to specialist agent (falls/electrical/dc/general)
    → Agent queries citationEngine.js for regulations
    → Returns PhD-level response with citations
```

---

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

## Subscription Tiers

| Tier | Price | Features |
|------|-------|----------|
| **FREE** | $0 | STKY + SIF assessments, basic results, 7-day history |
| **PRO** | $50/mo | Benchmarking, PhD recommendations, permanent history, trends |
| **PREMIUM** | $500/mo | Everything PRO + 4 hrs/mo Fractional Director |

## PRO Features (Backend Ready)

| Feature | File | Description |
|---------|------|-------------|
| Benchmarking Engine | `server/lib/benchmarkEngine.js` | Compare scores to 50+ fab project data |
| PhD Recommendations | `server/lib/recommendationsEngine.js` | Specific citations (OSHA, NFPA, ANSI) |
| Benchmark Data | `server/data/benchmarks.json` | Industry-specific percentiles |
| Trend Tracking | `server/lib/benchmarkEngine.js` | Score improvement over time |

**To Go Live:** Add Stripe keys to `.env` (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRO_PRICE_ID, STRIPE_PREMIUM_PRICE_ID)

## DC Safety Checklist

Interactive 20-point assessment modal on `/data-centers.html`:
- 7 sections covering DC-specific safety requirements
- Disclaimer step with checkbox acceptance
- Project context sliders (workers, burn rate)
- ROI calculation using OSHA Safety Pays methodology
- Print report with filled-out answers + scores
- Perfect score (20/20) pushes to Verification Audit

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

**Version:** 3.1.0
**Last Updated:** 2026-01-27
**License:** Proprietary - Safety Excellence Group
