# Project Checkpoint

## Current Build
LAST: Brand standardization (S.E.G. with periods, reduced overuse)
NEXT: QA test all pages at localhost:3001
STATUS: ok

---

## Product Plan: FREE → PRO → PREMIUM

S.E.G. tools follow a freemium model designed to demonstrate value, then convert users to paid tiers.

| Tier | Price | Status | Features |
|------|-------|--------|----------|
| **FREE** | $0 | ✅ NOW | STKY + SIF assessments, basic results, 7-day history |
| **PRO** | $50/mo | 🔜 COMING SOON | Benchmarking, PhD recommendations, permanent history, trends, 7-day trial |
| **PREMIUM** | $500/mo | 🔜 COMING SOON | Everything PRO + 4 hrs/mo Fractional Director, AEGIS Priority Queue |

### Conversion Strategy
- **Loss Aversion:** Free results expire after 7 days
- **Day 5 Email:** "Your insights expire in 48 hours"
- **Day 7 Email:** "Upgrade to keep results forever"
- **Expected Conversion:** 25-40% (industry benchmark)

### PRO Tier Value ($50/mo)
- Permanent history (results never expire)
- Benchmarking vs 50+ fab project data
- PhD-level recommendations with OSHA/NFPA/ANSI citations
- Trend tracking (score improvement over time)
- Priority AEGIS responses

### PREMIUM Tier Value ($500/mo)
- Everything PRO
- 4 hours/month direct access to principal consultant
- AEGIS Priority Queue (urgent questions routed immediately)
- Custom guidance tailored to your operation

---

## Release Roadmap

### Phase 1: Website Launch (NOW - PRIORITY)
| Component | Status | Go-Live Blocker |
|-----------|--------|-----------------|
| Main Website (all pages) | ✅ Ready | Deploy to safety-excellence.com |
| GHL Webhooks (Client/Candidate/Newsletter) | ✅ Ready | Configure production URLs |
| AEGIS Chatbot | ✅ Ready | - |
| DC Safety Checklist | ✅ Ready | - |

### Phase 2: FREE Tools Release (Shortly After Website)
| Tool | Status | Tier | Go-Live Blocker |
|------|--------|------|-----------------|
| STKY Assessment | ✅ Ready | FREE | QA test flows |
| P-SIF Scorecard | ✅ Ready | FREE | QA test flows |
| Results Dashboard | ✅ Ready | FREE | - |
| Tool Webhooks (STKY/SIF) | ✅ Ready | - | Verify GHL delivery |
| P-SIF Classification | 🔜 Coming | FREE | Claude API integration |

### Phase 3: Algorithms & AI (Close Second - HIGH PRIORITY)
These run automatically in the background, powering the website and tools.

| Component | Status | File |
|-----------|--------|------|
| Lead Scoring | ✅ Ready | `algorithms/leadScoring.js` |
| Candidate Scoring | ✅ Ready | `algorithms/candidateScoring.js` |
| Matching Algorithm | ✅ Ready | `algorithms/matchingAlgorithm.js` |
| Stage 2 WHO Assessment | ✅ Ready | `algorithms/stage2Assessment.js` |
| Opportunity Detector | ✅ Ready | `server/services/opportunityDetector.js` |
| SME Agent Navigator | ✅ Ready | `server/agents/navigator.js` |
| Falls Specialist | ✅ Ready | `server/agents/falls-specialist.js` |
| Electrical Specialist | ✅ Ready | `server/agents/electrical-specialist.js` |
| DC Specialist | ✅ Ready | `server/agents/dc-specialist.js` |
| General Specialist | ✅ Ready | `server/agents/general-specialist.js` |
| Citation Engine | ✅ Ready | `server/lib/citationEngine.js` |
| Benchmarking Engine | ✅ Ready | `server/lib/benchmarkEngine.js` (PRO) |
| Recommendations Engine | ✅ Ready | `server/lib/recommendationsEngine.js` (PRO) |

### Phase 4: Subscription Model (COMING SOON)
Backend infrastructure is ready. Blocked by Stripe integration.

| Feature | Status | Blocker |
|---------|--------|---------|
| User Auth (register/login) | ✅ Backend Ready | Stripe keys |
| Stripe Billing | ✅ Backend Ready | Create Stripe products |
| 7-Day Results Expiration | ✅ Backend Ready | Stripe integration |
| PRO Benchmarking | ✅ Backend Ready | Stripe integration |
| PRO PhD Recommendations | ✅ Backend Ready | Stripe integration |
| PREMIUM Fractional Director | 🔜 Planned | Manual scheduling |
| PREMIUM AEGIS Priority Queue | 🔜 Planned | Routing logic |

**To Activate Subscriptions:**
1. Add Stripe keys to `.env`:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRO_PRICE_ID` ($50/mo)
   - `STRIPE_PREMIUM_PRICE_ID` ($500/mo)
2. Create products/prices in Stripe Dashboard
3. Set up Stripe webhook endpoint
4. Enable 7-day trial for PRO

---

## Brand Standardization (2026-01-27) ✅ COMPLETE

### Changes Made
- **Nav links**: "Why SEG" → "Why S.E.G." across all pages
- **Section headers**: "The SEG Difference" → "What Sets Us Apart"
- **Hero badges**: "SEG Powered by AEGIS AI" → "Powered by AEGIS AI"
- **Body copy**: Replaced "SEG" with pronouns (we/our/us) in descriptive text
- **Why S.E.G. page**: "Why SEG?" → "Why S.E.G.?" in hero

### Kept As-Is (Intentional)
- Image file names (SEG Original Logo.png, etc.)
- Structured data/JSON-LD (SEO purposes)
- Legal disclaimers (properly defined context)
- Testimonial quotes (authentic customer voice)
- CSS variables/comments (internal code)
- Admin dashboard (internal tool)

---

## DC Page Polish (2026-01-27) ✅ COMPLETE

### Psychological Triggers Added (Sales Psychology)
All data now traced to official sources—no SEG claims, no competitor attacks.

| Trigger | Implementation | Source |
|---------|----------------|--------|
| Loss Aversion | "$14M/month delay cost", "$161,323 penalties" | DCD, OSHA |
| Authority | All stats from OSHA, NFPA, BLS, NIOSH, Uptime Institute | Official |
| Specificity | 30,000 incidents, 400 fatalities, 6,750 citations, 79% | NFPA, OSHA FY2024 |
| Urgency | "12 years running", "isn't optional—it's survival" | OSHA Top 10 |

### Copy Cleaned
- ❌ Removed: "professionals who sit in cars for 4 hours a day, check boxes, and add zero value"
- ❌ Removed: "Checkbox Compliance", "Reactive Responses", competitor attacks
- ✅ Added: Data-driven pain points (arc flash stats, fall protection citations, commissioning failures)
- ✅ Added: "Performance Verification" instead of "identify and remove underperforming personnel"

### Domain Fixed
Changed `safetyexcellencegroup.com` → `safety-excellence.com` in ALL files:
- public/index.html
- public/data-centers.html
- public/why-seg.html
- public/careers.html
- public/files/DC-Safety-Checklist.html
- docs/DC-Safety-Checklist.md
- server/index.js (CORS config)

### Booking Modal Added
"Book Discovery Call" buttons now open embedded GHL calendar modal (same as homepage).

---

## DC Checklist Build (2026-01-27) ✅ COMPLETE

**Location:** Modal on `public/data-centers.html` (like Blind Spot Finder pattern)

### Features
- 20-point interactive assessment (7 sections)
- Disclaimer step with checkbox acceptance
- Project context sliders (workers, burn rate)
- **Real ROI calculation:**
  - Internal: $90/hr BCSP-Certified rate, tiered engagements
  - User-facing: OSHA Safety Pays methodology (no internal pricing exposed)
  - Risk exposure from OSHA, BLS, NIOSH, NFPA data
- **Print Report:** Generates filled-out PDF with answers marked + scores + ROI
- **Perfect Score (20/20):** Shows "Verify Before You Certify" → pushes to Audit (Uptime Institute 79% stat)
- **High Gap Warning:** Red alert when >3 critical gaps (BLS data reference)

### Engagement Tiers (INTERNAL - not shown to users)
| Gaps | Engagement | Hours | Cost |
|------|------------|-------|------|
| 0 | Verification Audit | 80 | Push to call |
| 1-5 | 3-Month Assessment | 450 | $40.5K |
| 6-10 | 4-Month Comprehensive | 600 | $54K |
| 11+ | 6-Month Rebuild | 900 | $81K |

### Test URL
http://localhost:3001/data-centers.html
1. Fill lead form → "Start Assessment" button appears
2. Complete 20 questions
3. See results with ROI (OSHA/BLS methodology shown, not internal pricing)
4. Click "Print Report" → opens filled-out checklist PDF with sources cited
5. Click "Book Discovery Call" → opens calendar modal

### Cleanup Complete
Removed unused files and routes from server/index.js

---

## Subscription Tiers
| Tier | Price | Features |
|------|-------|----------|
| FREE | $0 | STKY + SIF assessments, basic results, 7-day history |
| PRO | $50/mo | Benchmarking, PhD recommendations, permanent history, trends |
| PREMIUM | $500/mo | Everything Pro + 4 hrs/mo Fractional Director |

## PRO Features Built (Backend)
1. **Benchmarking Engine** - `server/lib/benchmarkEngine.js`
   - Compares scores to "50+ fab projects" data
   - Industry-specific percentiles
   - Hazard-by-hazard comparison
   - Strengths/weaknesses vs industry

2. **PhD-Level Recommendations** - `server/lib/recommendationsEngine.js`
   - Specific citations (OSHA, NFPA, ANSI)
   - Implementation steps
   - Prioritized by severity
   - FREE gets generic, PRO gets full detail

3. **Benchmark Data** - `server/data/benchmarks.json`
   - Overall and by-industry benchmarks
   - STKY hazard benchmarks
   - SIF scenario accuracy benchmarks

4. **Trend Tracking** - in benchmarkEngine.js
   - Score improvement over time
   - Historical timeline
   - Change analysis

## API Response Changes
- `/api/stky/assess` → includes `benchmark`, `enhancedRecommendations`, `isPro`
- `/api/sif/assess` → includes `benchmark`, `isPro`
- `/api/dashboard` → includes `trends`, `isPro`

## Active Tools
- STKY Assessment - `/tools/stky-assessment.html` (FREE)
- P-SIF Scorecard - `/tools/sif-scorecard.html` (FREE)
- Results Dashboard - `/tools/dashboard.html`

## Subscription Pages
- Tools Landing with Pricing - `/tools/index.html`
- Sign Up (Pro Trial) - `/tools/signup.html`
- Login - `/tools/login.html`
- Dashboard (tier status) - `/tools/dashboard.html`

## Coming Soon
- P-SIF Classification - `/tools/sif-filter.html`

## Backend Ready
- Auth routes - `/api/auth/*`
- Billing routes - `/api/billing/*`
- Stripe checkout integration

## GHL Webhooks (Hardcoded)
- STKY: `4781670c-aa84-46f0-8dfc-f9d4f11d4a4c`
- SIF_FREE: `bc3371cc-84f6-474e-8d88-a4455cc0b9bc`
- SIF_PAID: `ad3d5210-a42a-4d55-a467-ceb8ec5ff2f0`

## To Go Live
1. Add Stripe keys to .env:
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET
   - STRIPE_PRO_PRICE_ID
   - STRIPE_PREMIUM_PRICE_ID
   - BASE_URL
2. Create products/prices in Stripe Dashboard
3. Set up Stripe webhook endpoint

---

## Strategic Update (2026-01-24)

### Completed
| Phase | Task | Status |
|-------|------|--------|
| DC Campaign | docs/DC-Safety-Checklist.md (20-point checklist) | ✅ |
| DC Campaign | public/data-centers.html (landing page) | ✅ |
| DC Campaign | Homepage DC section update | ✅ |
| Tool Enhancement | server/lib/citationEngine.js | ✅ |
| Tool Enhancement | server/data/osha-citations.json | ✅ |
| SME Agents | server/agents/navigator.js | ✅ |
| SME Agents | server/agents/falls-specialist.js | ✅ |
| SME Agents | server/agents/electrical-specialist.js | ✅ |
| SME Agents | server/agents/dc-specialist.js | ✅ |
| SME Agents | server/agents/general-specialist.js | ✅ |
| SME Agents | Agent prompts (4 files) | ✅ |
| QA Fixes | Remove admin key default fallback | ✅ |
| QA Fixes | Add request body size limit | ✅ |
| QA Fixes | Configure CORS for production | ✅ |
| QA Fixes | Add timeout to webhook calls | ✅ |

---

## Updates Applied (SEG-TOOLS-UPDATES.md)

| Update | Description | Status |
|--------|-------------|--------|
| 001 | P-SIF Classification hidden (PAID only), SIF badge changed to FREE | Done |
| 002 | Apple design principles applied to CSS | Done |
| 003 | Info icons with slide-up modals on tool cards | Done |

---

## V3 Build Progress

| Phase | File | Status |
|-------|------|--------|
| 1 | database/migrations/tools-v3.sql | ✅ Complete |
| 2 | public/css/tools-v3.css | ✅ Complete |
| 2 | public/js/tool-engine.js | ✅ Complete |
| 3 | server/data/stky-config.json | ✅ Complete |
| 3 | server/data/sif-config.json | ✅ Complete |
| 4 | server/lib/stkyEngine.js | ✅ Complete |
| 4 | server/lib/sifEngine.js | ✅ Complete |
| 5 | server/routes/stky.js | ✅ Complete |
| 5 | server/routes/sif.js | ✅ Complete |
| 5 | server/routes/sif-filter.js | ✅ Complete |
| 6 | public/tools/stky-assessment.html | ✅ Complete |
| 6 | public/tools/sif-scorecard.html | ✅ Complete |
| 6 | public/tools/sif-filter.html | ✅ Complete |
| 7 | server/routes/dashboard.js | ✅ Complete |
| 7 | public/tools/dashboard.html | ✅ Complete |
| 8 | server/index.js integration | ✅ Complete |
| 8 | public/tools/index.html | ✅ Complete |

---

## Active Files

### Server
```
server/
├── index.js           # Main Express server
├── package.json       # Dependencies
├── .env.example       # Environment template
├── routes/
│   ├── stky.js         # STKY assessment API
│   ├── sif.js          # SIF scorecard API
│   ├── sif-filter.js   # P-SIF classification API
│   ├── dashboard.js    # User dashboard API
│   ├── metrics.js      # Metrics analyzer API
│   └── admin.js        # Admin dashboard API
├── lib/
│   ├── stkyEngine.js   # STKY scoring logic
│   └── sifEngine.js    # SIF scoring logic
├── data/
│   ├── stky-config.json
│   └── sif-config.json
├── services/
│   └── opportunityDetector.js
└── utils/
    └── excelExport.js
```

### Frontend
```
public/
├── tools/
│   ├── index.html           # Tools landing
│   ├── stky-assessment.html # STKY tool
│   ├── sif-scorecard.html   # SIF tool
│   ├── sif-filter.html      # P-SIF classifier
│   ├── dashboard.html       # User dashboard
│   └── metrics-analyzer.html
├── css/
│   ├── tools-v3.css         # Tool styles
│   └── aegis-chatbot.css
├── js/
│   ├── tool-engine.js       # Shared tool logic
│   └── aegis-chatbot.js
├── index.html
└── admin-dashboard.html
```

### Database
```
database/
├── db.js              # Connection & queries
├── schema.sql         # Core schema
├── migrations/
│   └── tools-v3.sql   # V3 tables
└── seg.db             # SQLite database (gitignored)
```

### Algorithms
```
algorithms/
├── leadScoring.js       # Client lead scoring
├── candidateScoring.js  # Candidate fit rating
├── matchingAlgorithm.js # Client-candidate matching
├── stage2Assessment.js  # Stage 2 interview scoring
└── metricsAnalyzer.js   # Safety metrics analysis
```

---

## Testing URLs
```
http://localhost:3001/tools/index.html
http://localhost:3001/tools/stky-assessment.html
http://localhost:3001/tools/sif-scorecard.html
http://localhost:3001/tools/sif-filter.html
http://localhost:3001/tools/dashboard.html
http://localhost:3001/data-centers.html          # DC Checklist modal
http://localhost:3001/api/health
http://localhost:3001/api/dashboard?email=test@example.com
```

---

## API Endpoints

### STKY Assessment
- GET /api/stky/config
- GET /api/stky/paths
- GET /api/stky/context
- GET /api/stky/hazards/:pathId/:industry
- GET /api/stky/hazard/:hazardId/questions
- POST /api/stky/session
- GET /api/stky/session/:sessionId
- POST /api/stky/assess
- POST /api/stky/capture

### SIF Scorecard
- GET /api/sif/config
- GET /api/sif/paths
- GET /api/sif/scenarios
- GET /api/sif/precursors/:pathId
- POST /api/sif/assess
- POST /api/sif/capture

### P-SIF Classification
- GET /api/sif-filter/disclaimer
- POST /api/sif-filter/classify

### Dashboard
- GET /api/dashboard?email=...
- GET /api/dashboard?session_id=...
- GET /api/dashboard/lookup?email=...
- GET /api/dashboard/assessment/:id

---

## Version
**VERSION:** 3.1.0
**STATUS:** Production Ready
**DATE:** 2026-01-27
**DOMAIN:** safety-excellence.com
