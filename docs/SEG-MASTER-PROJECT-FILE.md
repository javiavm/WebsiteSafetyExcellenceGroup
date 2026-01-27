# SAFETY EXCELLENCE GROUP
# MASTER PROJECT FILE
## Complete System Documentation

---

# PROJECT OVERVIEW

**Company:** Safety Excellence Group (SEG)
**Domain:** safety-excellence.com
**Platform:** Full-stack Node.js/Express with SQLite

**System Components:**
- AEGIS AI Chatbot (Claude-powered)
- Lead Scoring Algorithm (HOT/WARM/NURTURE)
- Candidate Scoring Algorithm (A/B/C/D fit rating)
- Candidate-Client Matching System
- Stage 2 A-Player Assessment (WHO Method)
- Opportunity Detection Engine
- Admin Dashboard with Excel Export
- GHL CRM Integration (6 webhooks)

---

# CURRENT FILE STRUCTURE

```
seg-website/
|-- .env.example                    # Environment template
|-- .gitignore                      # Git ignore patterns
|-- README.md                       # Project documentation
|-- package.json                    # Root dependencies
|
|-- algorithms/                     # Scoring & matching logic
|   |-- leadScoring.js             # Client lead scoring (0-100)
|   |-- candidateScoring.js        # Candidate fit rating (A/B/C/D)
|   |-- matchingAlgorithm.js       # Client-candidate matching
|   +-- stage2Assessment.js        # WHO Method NLP scoring
|
|-- database/                       # SQLite database
|   |-- db.js                      # Connection & all queries
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
|   |-- package.json               # Server dependencies
|   |-- routes/admin.js            # Admin API routes
|   |-- services/
|   |   +-- opportunityDetector.js # Auto-matching & alerts
|   +-- utils/excelExport.js       # Excel export utility
|
+-- docs/                           # Documentation
    |-- PROJECT-MAP.md             # Technical reference
    |-- SEG-MASTER-PROJECT-FILE.md # This file
    +-- INTEGRATION-SNIPPET.html   # Website embed code
```

---

# SYSTEM STATUS

## Completed Features

| Component | File | Status |
|-----------|------|--------|
| Express API Server | `server/index.js` | ✅ Complete |
| Lead Scoring Algorithm | `algorithms/leadScoring.js` | ✅ Complete |
| Candidate Scoring Algorithm | `algorithms/candidateScoring.js` | ✅ Complete |
| Matching Algorithm | `algorithms/matchingAlgorithm.js` | ✅ Complete |
| Stage 2 Assessment | `algorithms/stage2Assessment.js` | ✅ Complete |
| Opportunity Detector | `server/services/opportunityDetector.js` | ✅ Complete |
| SQLite Database | `database/db.js` | ✅ Complete |
| Admin Routes | `server/routes/admin.js` | ✅ Complete |
| Excel Export | `server/utils/excelExport.js` | ✅ Complete |
| AEGIS Chatbot Widget | `public/js/aegis-chatbot.js` | ✅ Complete |
| Admin Dashboard UI | `public/admin-dashboard.html` | ✅ Complete |
| Stage 2 Form UI | `public/stage2.html` | ✅ Complete |

## Production Readiness

| Task | Status |
|------|--------|
| All endpoints functional | ✅ Done |
| GHL webhooks connected | ✅ Done |
| Database persistence | ✅ Done |
| Admin authentication | ✅ Done |
| Chatbot API URL | ⚠️ Hardcoded to localhost |
| CORS configuration | ⚠️ Open (needs production config) |
| Production deployment | ❌ Not deployed |

---

# GHL WEBHOOK URLS

## Form Webhooks
```
CLIENT FORM (Request Safety Support):
https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/dd8498d0-c790-48af-a7e7-28de6a3a0def

CANDIDATE FORM (Join SEG Network):
https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/255f5c21-06a3-4b59-a5b3-6b652570a779

NEWSLETTER (Advanced Industries Safety Brief):
https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/64c3d0b5-a1fa-4574-a15b-137357fba21e
```

## Automation Webhooks
```
STAGE 2 INVITE (sent to B+ candidates when HOT client submits):
https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/ad8aa4ed-32cd-45fe-b9eb-77727b3993aa

OPPORTUNITY ALERT (admin notification for HOT lead matches):
https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/558c9693-50bc-4743-b82f-afd1912e0659

A-PLAYER CONFIRMED (when candidate scores A/A+ on Stage 2):
https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/7f5630cb-1250-4881-a91e-809a47867d80
```

---

# ALGORITHMS

## 1. CLIENT LEAD SCORING

**Purpose:** Score incoming client leads to prioritize follow-up
**File:** `algorithms/leadScoring.js`
**Input:** Request Safety Support form data
**Output:** Score (0-100) + Classification (HOT/WARM/NURTURE/LOW)

### Scoring Criteria (Max: 95 points)

| Factor | Values | Points |
|--------|--------|--------|
| **Engagement Size** | | Max: 25 |
| 250k+ | | 25 |
| 100-250k | | 20 |
| 40-100k | | 15 |
| under40k | | 5 |
| unsure | | 10 |
| **Timeline** | | Max: 25 |
| immediate | | 25 |
| 1-2weeks | | 20 |
| 30days | | 10 |
| exploring | | 5 |
| **Decision Role** | | Max: 20 |
| decision | | 20 |
| influencer | | 10 |
| research | | 5 |
| **Industry** | | Max: 15 |
| semiconductor | | 15 |
| datacenter | | 15 |
| construction | | 10 |
| manufacturing | | 10 |
| other | | 5 |
| **Project Role** | | Max: 10 |
| owner | | 10 |
| gc | | 8 |
| manufacturer | | 8 |
| sub | | 5 |
| oem | | 5 |

### Classification

| Score | Classification | Action |
|-------|----------------|--------|
| 75+ | HOT | Respond within 2 hours |
| 50-74 | WARM | Respond within 24 hours |
| 25-49 | NURTURE | Add to nurture sequence |
| <25 | LOW | Nurture or disqualify |

### Auto-Nurture Rule
- Engagement Size = under40k + Timeline = exploring → AUTO NURTURE

---

## 2. CANDIDATE SCORING

**Purpose:** Score job applicants for fit and quality
**File:** `algorithms/candidateScoring.js`
**Input:** Join the SEG Network form data
**Output:** Score (0-110) + Fit Rating (A/B/C/D) + Behavioral Score + Red Flags

### Scoring Criteria (Max: 110 points)

| Factor | Values | Points |
|--------|--------|--------|
| **Years of Experience** | | Max: 20 |
| 15+ | | 20 |
| 8-15 | | 18 |
| 5-8 | | 15 |
| 2-5 | | 10 |
| 0-2 | | 5 |
| **Certifications** | | Max: 25 (capped) |
| CSP | | 10 |
| ASP | | 8 |
| CHST | | 8 |
| OHST | | 6 |
| GSP | | 6 |
| OSHA 500 | | 5 |
| OSHA 510 | | 4 |
| OSHA 30 | | 2 |
| SEMI S2/S8 | | 8 |
| NFPA 70E | | 5 |
| First Aid/CPR | | 1 |
| **Industry Experience** | | Max: 15 |
| semiconductor | | 10 |
| datacenter | | 8 |
| construction | | 6 |
| manufacturing | | 5 |
| Multiple industries | | +5 bonus |
| **Availability** | | Max: 10 |
| immediately | | 10 |
| 2weeks | | 8 |
| 30days | | 5 |
| 60days+ | | 2 |
| **Travel** | | Max: 5 |
| national/open/relocate | | 5 |
| regional | | 3 |
| local | | 0 |
| **Shift** | | Max: 5 |
| flexible/rotating | | 5 |
| both | | 3 |
| days/nights only | | 0 |
| **Behavioral Questions** | | Max: 30 |
| Q1: Task outside job | Best: 10, Worst: 0 |
| Q2: Competitor offer | Best: 10, Worst: 0 |
| Q3: Safety skip | Best: 10, Worst: 0 |

### Fit Rating

| Score | Rating | Meaning |
|-------|--------|---------|
| 80+ | A | Top tier - prioritize |
| 65-79 | B | Good fit - follow up |
| 50-64 | C | Possible fit - review |
| <50 | D | Poor fit - archive |

### Red Flags (Auto Downgrade)

| Condition | Max Rating |
|-----------|------------|
| Q3 = 1 (follows supervisor on safety skip) | C |
| 0 certifications | C |
| 0-2 years + no certs | D |

---

## 3. CANDIDATE-CLIENT MATCHING

**Purpose:** Match candidates to client staffing needs
**File:** `algorithms/matchingAlgorithm.js`
**Input:** Client + all candidates (or candidate + all clients)
**Output:** Ranked list of matches with scores

### Matching Weights (Total: 100%)

| Factor | Weight | Description |
|--------|--------|-------------|
| Industry | 30% | Industry alignment |
| Location | 20% | Location + travel flexibility |
| Availability | 20% | Timeline alignment |
| Quality Score | 20% | Candidate's fit rating/score |
| Role Level | 10% | Support type vs role level |

### Industry Scoring

| Match Type | Score |
|------------|-------|
| Exact match | 100% |
| Related industry | 50% |
| No overlap | 10% |

### Match Levels

| Score | Level | Meaning |
|-------|-------|---------|
| 80%+ | EXCELLENT | Top-tier match |
| 65-79% | GOOD | Strong match |
| 50-64% | FAIR | Possible fit |
| <50% | LOW | Poor fit |

---

## 4. STAGE 2 A-PLAYER ASSESSMENT (WHO Method)

**Purpose:** Deep interview scoring for B+ candidates
**File:** `algorithms/stage2Assessment.js`
**Input:** 8 text responses to WHO Method questions
**Output:** Score (0-100) + Rating (A+/A/B+/B/C/D)

### Questions & Weights (Total: 100 points)

| Question | Weight |
|----------|--------|
| Career Goals (3-5 year vision) | 15 |
| Strengths (with examples) | 15 |
| Weaknesses (areas improving) | 10 |
| Boss Ratings (last 3 supervisors 1-10) | 15 |
| Accountability (mistake example) | 10 |
| Integrity (safety vs schedule choice) | 10 |
| Problem Solving (complex challenge) | 15 |
| Driving Force (motivation) | 10 |

### NLP Analysis

**Positive Signals (add points):**
- Specificity: "specifically", "for example", "percent", "reduced"
- Methodology: "process", "system", "framework", "root cause"
- Ownership: "I led", "I initiated", "I developed", "I owned"
- Growth: "learned", "improved", "feedback", "mentor"
- Safety Priority: "non-negotiable", "stop work", "refused", "escalated"
- Results: "result", "outcome", "achieved", "impact"

**Red Flags (subtract points):**
- Vagueness: "stuff", "things", "kind of", "basically"
- Blaming: "their fault", "management", "not my job"
- Safety Compromise: "had to", "no choice", "deadline", "just this once"
- Deflection: "never happened", "can't think of", "perfect record"
- Overconfidence: "always", "never", "perfect", "no weaknesses"

### Rating Thresholds

| Score | Rating | Recommendation |
|-------|--------|----------------|
| 85+ | A+ | FAST TRACK: Schedule immediately |
| 75-84 | A | PRIORITIZE: Strong fit |
| 65-74 | B+ | CONSIDER: May need coaching |
| 50-64 | B | HOLD: Revisit if specific need |
| 35-49 | C | ARCHIVE: Does not meet criteria |
| <35 | D | DECLINE: Does not align |

---

## 5. OPPORTUNITY DETECTION ENGINE

**Purpose:** Auto-detect HOT client + B+ candidate matches
**File:** `server/services/opportunityDetector.js`
**Trigger:** HOT client form submission (immediate or 1-2weeks timeline)

### Process Flow

```
1. HOT client submits form
2. System runs matching algorithm against all candidates
3. Filter for B+ or better candidates with 75%+ match score
4. For each qualified match:
   - Check if already A-rated (within 90 days) → Ready Now
   - Check if pending Stage 2 invite → Skip
   - Otherwise → Create Stage 2 invite, send via GHL
5. Send admin alert via GHL with match summary
```

### Webhook Data Sent

**Stage 2 Invite:**
- email, first_name, last_name
- stage2_link (with unique token)
- expires_in (72 hours)
- matched_client_industry

**Opportunity Alert:**
- client details (name, company, industry, timeline)
- match_count, top_match details
- ready_now_count, stage2_sent_count
- dashboard_link

**A-Player Confirmed:**
- candidate details (name, email, phone)
- stage2_score, stage2_rating
- matched_client, matched_industry
- dashboard_link

---

# DATABASE SCHEMA

## Tables

### clients
```sql
CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    company_name TEXT,
    project_role TEXT,
    industry TEXT,
    project_phase TEXT,
    location TEXT,
    support_type TEXT,
    engagement_size TEXT,
    decision_role TEXT,
    timeline TEXT,
    lead_score INTEGER,
    lead_classification TEXT,
    score_breakdown JSON,
    sent_to_ghl BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'new',
    notes TEXT
);
```

### candidates
```sql
CREATE TABLE candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    location TEXT,
    certifications TEXT,
    years_experience TEXT,
    role_level TEXT,
    industry_experience TEXT,
    availability TEXT,
    work_type_preference TEXT,
    shift_availability TEXT,
    travel_preference TEXT,
    q1_answer INTEGER,
    q2_answer INTEGER,
    q3_answer INTEGER,
    behavioral_score INTEGER,
    total_score INTEGER,
    fit_rating TEXT,
    red_flags TEXT,
    sent_to_ghl BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'new',
    notes TEXT
);
```

### stage2_results
```sql
CREATE TABLE stage2_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    token_expires DATETIME NOT NULL,
    status TEXT DEFAULT 'pending',
    responses JSON,
    score INTEGER,
    rating TEXT,
    triggered_by_client_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);
```

### opportunities
```sql
CREATE TABLE opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    status TEXT DEFAULT 'detected',
    match_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);
```

### assessments
```sql
CREATE TABLE assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email TEXT,
    name TEXT,
    company TEXT,
    industry TEXT,
    project_phase TEXT,
    team_size TEXT,
    answers JSON,
    score INTEGER,
    risk_level TEXT,
    gaps JSON,
    recommendations JSON,
    sent_to_ghl BOOLEAN DEFAULT FALSE
);
```

### newsletter_subscribers
```sql
CREATE TABLE newsletter_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name TEXT,
    company TEXT,
    email TEXT NOT NULL UNIQUE,
    sent_to_ghl BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active'
);
```

### chatbot_conversations
```sql
CREATE TABLE chatbot_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    visitor_name TEXT,
    visitor_email TEXT,
    visitor_phone TEXT,
    visitor_company TEXT,
    messages JSON,
    lead_captured BOOLEAN DEFAULT FALSE,
    booking_made BOOLEAN DEFAULT FALSE
);
```

---

# API ENDPOINTS

## Public Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health check |
| POST | `/api/chat` | AEGIS AI chatbot |
| POST | `/api/forms/client` | Client form → Score → DB → GHL |
| POST | `/api/forms/candidate` | Candidate form → Score → DB → GHL |
| POST | `/api/forms/newsletter` | Newsletter signup |
| POST | `/api/forms/assessment` | Blind Spot Finder |

## Stage 2 Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/stage2/validate?token=xxx` | Validate token, return candidate info |
| GET | `/api/stage2/questions` | Get WHO Method questions |
| POST | `/api/stage2/submit` | Submit assessment |

## Matching Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/clients/:id/matches` | Find candidates for client |
| GET | `/api/candidates/:id/matches` | Find clients for candidate |

## Admin Endpoints (require `x-admin-key` header)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/clients` | List all clients |
| PUT | `/api/admin/clients/:id/status` | Update client status |
| GET | `/api/admin/candidates` | List all candidates |
| PUT | `/api/admin/candidates/:id/status` | Update candidate status |
| GET | `/api/admin/matches/:clientId` | Get matches for client |
| GET | `/api/admin/export/clients` | Export to Excel |
| GET | `/api/admin/export/candidates` | Export to Excel |
| GET | `/api/admin/export/matches/:clientId` | Export to Excel |

---

# ENVIRONMENT VARIABLES

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional
PORT=3001
NODE_ENV=development
SITE_URL=http://localhost:3001
ADMIN_KEY=seg-admin-2025
DATABASE_URL=./database/seg.db

# GHL Webhooks (configured in code, can override)
GHL_WEBHOOK_CLIENT=https://services.leadconnectorhq.com/hooks/.../dd8498d0-...
GHL_WEBHOOK_CANDIDATE=https://services.leadconnectorhq.com/hooks/.../255f5c21-...
GHL_WEBHOOK_NEWSLETTER=https://services.leadconnectorhq.com/hooks/.../64c3d0b5-...
```

---

# BRAND REFERENCE

## Colors
```css
--SEG-yellow: #FFCF00;
--SEG-blue: #132544;
--SEG-dark-grey: #333333;
--SEG-grey: #BABABA;
--SEG-light-grey: #F4F4F4;
```

## Contact
- Phone: 469.988.4777
- Email: info@safety-excellence.com
- Domain: safety-excellence.com

---

# PRODUCTION DEPLOYMENT CHECKLIST

- [ ] Update `SITE_URL` environment variable
- [ ] Update `public/js/aegis-chatbot.js` CONFIG.apiUrl
- [ ] Set secure `ADMIN_KEY`
- [ ] Configure CORS for production domain
- [ ] Set `NODE_ENV=production`
- [ ] Ensure `.env` is not committed
- [ ] Backup database before deployment
- [ ] Test all GHL webhooks in production

---

*Master Project File for Safety Excellence Group*
*Last Updated: January 14, 2026*
