# SEG Website Project Map
> Updated: 2026-01-25 | Technical reference for development

---

## File Structure

```
seg-website/
|-- .env.example                    # Environment template
|-- .gitignore                      # Git ignore patterns
|-- README.md                       # Project documentation
|-- package.json                    # Root dependencies
|
|-- algorithms/                     # Scoring & matching logic
|   |-- leadScoring.js             # Client lead scoring (0-100, HOT/WARM/NURTURE)
|   |-- candidateScoring.js        # Candidate fit rating (A/B/C/D)
|   |-- matchingAlgorithm.js       # Client-candidate matching (weighted)
|   +-- stage2Assessment.js        # WHO Method interview scoring
|
|-- database/                       # SQLite database
|   |-- db.js                      # Connection, queries, all DB operations
|   |-- schema.sql                 # Table definitions
|   +-- seg.db                     # Database file (gitignored)
|
|-- public/                         # Frontend (served by Express)
|   |-- index.html                 # Main website
|   |-- admin-dashboard.html       # Admin interface
|   |-- stage2.html                # Stage 2 assessment form
|   |-- aegis-demo.html            # Chatbot demo page
|   |-- css/aegis-chatbot.css      # Chatbot styles
|   |-- js/aegis-chatbot.js        # Chatbot widget
|   +-- images/                    # Static images
|
|-- server/                         # Express API server
|   |-- index.js                   # Main server, all routes
|   |-- .env                       # API keys (not committed)
|   |-- .env.example               # Environment template
|   |-- package.json               # Server dependencies
|   |-- routes/
|   |   +-- admin.js               # Admin API routes
|   |-- services/
|   |   +-- opportunityDetector.js # Auto-matching & notifications
|   +-- utils/
|       +-- excelExport.js         # Excel export utility
|
+-- docs/                           # Documentation
    |-- PROJECT-MAP.md             # This file
    |-- SEG-MASTER-PROJECT-FILE.md # Full project specification
    +-- INTEGRATION-SNIPPET.html   # Website embed code
```

---

## Component Status

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Express Server | `server/index.js` | ✅ Working | All endpoints functional |
| Lead Scoring | `algorithms/leadScoring.js` | ✅ Working | HOT/WARM/NURTURE classification |
| Candidate Scoring | `algorithms/candidateScoring.js` | ✅ Working | A/B/C/D fit rating |
| Matching Algorithm | `algorithms/matchingAlgorithm.js` | ✅ Working | Weighted scoring |
| Stage 2 Assessment | `algorithms/stage2Assessment.js` | ✅ Working | WHO Method NLP scoring |
| Opportunity Detector | `server/services/opportunityDetector.js` | ✅ Working | Auto-triggers on HOT leads |
| Database | `database/db.js` | ✅ Working | SQLite with all tables |
| Admin Routes | `server/routes/admin.js` | ✅ Working | Protected with x-admin-key |
| Chatbot Widget | `public/js/aegis-chatbot.js` | ⚠️ Partial | API URL hardcoded to localhost |
| Admin Dashboard | `public/admin-dashboard.html` | ✅ Working | Requires admin key |

---

## Safety Assessment Tools (V3)

### Active Tools
| Tool | File | Status | Description |
|------|------|--------|-------------|
| STKY Assessment | `public/tools/stky-assessment.html` | ✅ FREE | Hazard control maturity assessment |
| P-SIF Scorecard | `public/tools/sif-scorecard.html` | ✅ FREE | P-SIF recognition test |
| Results Dashboard | `public/tools/dashboard.html` | ✅ FREE | Email-based results lookup |

### Future Tools (Coming Soon)
| Tool | File | Status | Notes |
|------|------|--------|-------|
| P-SIF Classification | `public/tools/sif-filter.html` | 🔜 Coming Soon | AI near-miss classifier |

### Tool API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/stky/config` | STKY config (paths, hazards, questions) |
| POST | `/api/stky/assess` | Submit STKY assessment |
| POST | `/api/stky/capture` | Capture email after assessment |
| GET | `/api/sif/config` | SIF config (paths, scenarios, precursors) |
| POST | `/api/sif/assess` | Submit SIF assessment |
| POST | `/api/sif/capture` | Capture email after assessment |
| GET | `/api/dashboard?email=...` | Get user's assessments |

### Tool Files
```
public/tools/
├── index.html              # Tools landing page
├── stky-assessment.html    # STKY tool (FREE)
├── sif-scorecard.html      # SIF tool (FREE)
├── sif-filter.html         # P-SIF classifier (Coming Soon)
├── metrics-analyzer.html   # NOT on plan (Coming Soon)
└── dashboard.html          # Results lookup

server/routes/
├── stky.js                 # STKY API with citation integration
├── sif.js                  # SIF API with citation integration
├── sif-filter.js           # P-SIF Claude API (inactive)
├── dashboard.js            # Results API
└── agents.js               # SME agent API (future use)

server/lib/
├── stkyEngine.js           # STKY scoring logic
├── sifEngine.js            # SIF scoring logic
└── citationEngine.js       # Regulatory citations

server/data/
├── stky-config.json        # STKY paths/hazards/questions
├── sif-config.json         # SIF paths/scenarios/precursors
└── osha-citations.json     # Citation database
```

---

## API Endpoints

### Public Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health check |
| POST | `/api/chat` | AEGIS AI chatbot (Claude) |
| POST | `/api/forms/client` | Client form → Score → DB → GHL |
| POST | `/api/forms/candidate` | Candidate form → Score → DB → GHL |
| POST | `/api/forms/newsletter` | Newsletter signup → DB → GHL |
| POST | `/api/forms/assessment` | Blind Spot Finder results |

### Stage 2 Assessment

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/stage2/validate` | Validate token, return candidate info |
| GET | `/api/stage2/questions` | Get WHO Method questions |
| POST | `/api/stage2/submit` | Submit assessment → Score → DB → GHL |

### Matching

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/clients/:id/matches` | Find candidates for client |
| GET | `/api/candidates/:id/matches` | Find clients for candidate |

### Admin Endpoints (require `x-admin-key` header)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/dashboard` | Dashboard summary stats |
| GET | `/api/admin/clients` | List all clients |
| PUT | `/api/admin/clients/:id/status` | Update client status |
| GET | `/api/admin/candidates` | List all candidates |
| PUT | `/api/admin/candidates/:id/status` | Update candidate status |
| GET | `/api/admin/matches/:clientId` | Get matches for client |
| GET | `/api/admin/export/clients` | Export clients to Excel |
| GET | `/api/admin/export/candidates` | Export candidates to Excel |
| GET | `/api/admin/export/matches/:clientId` | Export matches to Excel |
| GET | `/api/admin/auth-check` | Verify admin authentication |

---

## Database Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `clients` | Client lead submissions | full_name, email, company_name, industry, timeline, lead_score, lead_classification |
| `candidates` | Job applicant submissions | full_name, email, certifications, years_experience, fit_rating, total_score |
| `assessments` | Blind Spot Finder results | user_id, score, risk_level, responses |
| `newsletter_subscribers` | Newsletter signups | email, source, subscribed_at |
| `chatbot_conversations` | AEGIS chat history | session_id, messages, lead_captured |
| `stage2_results` | Stage 2 assessments | candidate_id, token, responses, score, rating |
| `opportunities` | Detected opportunities | client_id, match_count, status |

---

## GHL Webhooks

| Purpose | Webhook ID |
|---------|------------|
| Client Form | `dd8498d0-c790-48af-a7e7-28de6a3a0def` |
| Candidate Form | `255f5c21-06a3-4b59-a5b3-6b652570a779` |
| Newsletter | `64c3d0b5-a1fa-4574-a15b-137357fba21e` |
| Stage 2 Invite | `ad8aa4ed-32cd-45fe-b9eb-77727b3993aa` |
| Opportunity Alert | `558c9693-50bc-4743-b82f-afd1912e0659` |
| A-Player Confirmed | `7f5630cb-1250-4881-a91e-809a47867d80` |

Base URL: `https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/`

---

## Data Flow

### Client Form Submission
```
User submits form
    → POST /api/forms/client
    → leadScoring.scoreClientLead()
    → db.insertClient()
    → GHL webhook (client form)
    → IF HOT: opportunityDetector.detectOpportunities()
        → Find B+ candidates with 75%+ match
        → Send Stage 2 invites via GHL
        → Alert admin via GHL
```

### Stage 2 Assessment
```
Candidate clicks Stage 2 link
    → GET /api/stage2/validate?token=xxx
    → Candidate completes assessment
    → POST /api/stage2/submit
    → stage2Assessment.scoreStage2Assessment()
    → db.saveStage2Results()
    → IF A/A+: GHL webhook (a-player confirmed)
```

---

## Scoring Algorithms

### Lead Scoring (0-100 points)
| Factor | Max Points |
|--------|------------|
| Engagement Size | 25 |
| Timeline | 25 |
| Decision Role | 20 |
| Industry | 15 |
| Project Role | 10 |

**Classification:** HOT (75+), WARM (50-74), NURTURE (25-49), LOW (<25)

### Candidate Scoring (0-110 points)
| Factor | Max Points |
|--------|------------|
| Experience | 20 |
| Certifications | 25 |
| Industry | 15 |
| Availability | 10 |
| Travel | 5 |
| Shift | 5 |
| Behavioral | 30 |

**Fit Rating:** A (80+), B (65-79), C (50-64), D (<50)

### Matching Algorithm (100% weighted)
| Factor | Weight |
|--------|--------|
| Industry | 30% |
| Location | 20% |
| Availability | 20% |
| Quality Score | 20% |
| Role Level | 10% |

### Stage 2 WHO Method (100 points)
| Question | Weight |
|----------|--------|
| Career Goals | 15 |
| Strengths | 15 |
| Weaknesses | 10 |
| Boss Ratings | 15 |
| Accountability | 10 |
| Integrity | 10 |
| Problem Solving | 15 |
| Driving Force | 10 |

**Rating:** A+ (85+), A (75-84), B+ (65-74), B (50-64), C (35-49), D (<35)

---

## Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional
PORT=3001
NODE_ENV=development
SITE_URL=http://localhost:3001
ADMIN_KEY=seg-admin-2025
DATABASE_URL=./database/seg.db
```

---

## Production Deployment Checklist

- [ ] Update `SITE_URL` to production domain
- [ ] Update `public/js/aegis-chatbot.js` CONFIG.apiUrl
- [ ] Set secure `ADMIN_KEY`
- [ ] Configure CORS in `server/index.js`
- [ ] Set `NODE_ENV=production`
- [ ] Ensure `.env` is not committed
