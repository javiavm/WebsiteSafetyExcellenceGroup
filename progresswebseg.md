# SEG Website V1 — Progress Report
**Date:** 2026-02-23
**Version:** 3.1.0 — Production Ready
**Branch:** main

---

## Build Phases (CLAUDE.md)

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Database (tools-v3.sql, users.sql) | ✅ Complete |
| **Phase 2** | Shared CSS + tool-engine.js | ✅ Complete |
| **Phase 3** | Data configs (stky-config.json, sif-config.json) | ✅ Complete |
| **Phase 4** | Algorithms (stkyEngine, sifEngine, benchmarkEngine, citationEngine, recommendationsEngine) | ✅ Complete |
| **Phase 5** | Routes (9 handlers: stky, sif, sif-filter, auth, billing, admin, dashboard, metrics, agents) | ✅ Complete |
| **Phase 6** | Frontend Tools (8 pages under /tools/) | ✅ Complete |
| **Phase 7** | Dashboard (API + UI) | ✅ Complete |
| **Phase 8** | Integration (routes in index.js, nav updated) | ✅ Complete |

---

## Tool Pages (/public/tools/)

| File | Purpose | Tier |
|------|---------|------|
| index.html | Tools landing page + pricing | FREE |
| stky-assessment.html | STKY safety assessment | FREE |
| sif-scorecard.html | P-SIF precursor scorecard | FREE |
| sif-filter.html | P-SIF classification | PAID |
| dashboard.html | Results history | FREE/PRO |
| login.html | User authentication | — |
| signup.html | PRO trial signup | — |
| metrics-analyzer.html | Safety metrics analysis | PRO |

---

## Algorithms

### /algorithms/
| File | Purpose |
|------|---------|
| leadScoring.js | Client lead scoring |
| candidateScoring.js | Candidate rating |
| matchingAlgorithm.js | Client-candidate matching |
| stage2Assessment.js | Stage 2 interview scoring |
| metricsAnalyzer.js | Safety metrics analysis |

### /server/lib/
| File | Purpose |
|------|---------|
| stkyEngine.js | STKY scoring logic |
| sifEngine.js | SIF scoring logic |
| benchmarkEngine.js | Industry benchmarking (PRO) |
| citationEngine.js | OSHA/NFPA citation generation |
| recommendationsEngine.js | PhD-level recommendations (PRO) |

---

## Server Routes (server/index.js)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/stky` | Router | STKY assessment endpoints |
| `/api/sif` | Router | SIF scorecard endpoints |
| `/api/sif-filter` | Router | P-SIF classification |
| `/api/dashboard` | Router | Results dashboard |
| `/api/metrics` | Router | Metrics analyzer |
| `/api/agents` | Router | SME agent routing |
| `/api/auth` | Router | Authentication |
| `/api/billing` | Router | Stripe integration |
| `/api/admin` | Router | Admin panel |
| `/api/chat` | POST | AEGIS chatbot messages |
| `/api/lead` | POST | Chatbot lead capture |
| `/api/forms/client` | POST | Client inquiry form |
| `/api/forms/candidate` | POST | Candidate registration |
| `/api/forms/newsletter` | POST | Newsletter signup |
| `/api/forms/assessment` | POST | Assessment form |
| `/api/clients` | GET | List clients |
| `/api/candidates` | GET | List candidates |
| `/api/assessments` | GET | List assessments |
| `/api/stage2/questions` | GET | Stage 2 interview questions |
| `/api/stage2/assess` | POST | Stage 2 scoring |
| `/api/stage2/submit` | POST | Stage 2 results submission |
| `/api/health` | GET | Health check |

---

## Active Webhooks

### General Forms (server/index.js)

| Name | Trigger ID |
|------|-----------|
| Client Inquiry | `dd8498d0-c790-48af-a7e7-28de6a3a0def` |
| Candidate | `255f5c21-06a3-4b59-a5b3-6b652570a779` |
| Newsletter | `64c3d0b5-a1fa-4574-a15b-137357fba21e` |

### Tools (server/routes/)

| Name | Trigger ID | File |
|------|-----------|------|
| STKY Assessment | `4781670c-aa84-46f0-8dfc-f9d4f11d4a4c` | routes/stky.js |
| SIF Free | `bc3371cc-84f6-474e-8d88-a4455cc0b9bc` | routes/sif.js |
| SIF Paid | `ad3d5210-a42a-4d55-a467-ceb8ec5ff2f0` | routes/sif.js |

### Opportunities (server/services/opportunityDetector.js)

| Name | Trigger ID |
|------|-----------|
| Stage2 Invite | `ad8aa4ed-32cd-45fe-b9eb-77727b3993aa` |
| Opportunity Alert | `558c9693-58bc-4743-b82f-afd1912e0659` |
| A-Player Confirmed | `7f5630cb-1258-4881-a91e-809a47867d80` |

> **Base URL for all webhooks:**
> `https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/{trigger-id}`

---

## Database

| File | Purpose |
|------|---------|
| database/schema.sql | Core schema |
| database/migrations/tools-v3.sql | V3 tool tables |
| database/migrations/users.sql | Users and subscription tables |
| database/db.js | Connection and query layer |
| database/run-migration.js | Migration runner (untracked) |

- **Engine:** SQLite (`database/seg.db`, gitignored)
- **Initialization:** Automatic on server startup

---

## Config Data (server/data/)

| File | Size | Purpose |
|------|------|---------|
| stky-config.json | 16.9 KB | STKY paths, contexts, hazards, questions, and scoring |
| sif-config.json | 16.2 KB | SIF paths, precursors, scenarios, questions, and scoring |
| benchmarks.json | 2.5 KB | Industry benchmarks (50+ fab projects) |
| osha-citations.json | 26.6 KB | OSHA citations database |
| agent-prompts/ | — | SME agent prompts |

---

## Subscription Model

| Tier | Price | Includes |
|------|-------|---------|
| **FREE** | $0 | STKY + SIF assessments, 7-day history |
| **PRO** | $50/mo | Benchmarking, PhD recommendations, permanent history |
| **PREMIUM** | $500/mo | Everything PRO + 4 hrs/mo fractional director |

---

## New Untracked Files (git untracked)

| File | Purpose |
|------|---------|
| database/run-migration.js | Migration runner |
| nixpacks.toml | Railway deployment config |
| railway.json | Railway project config |
| public/industries.html | New industries page |
| public/services.html | New services page |
| public/images/ (various) | New site images |

---

## Required Environment Variables

```
GHL_WEBHOOK_CLIENT
GHL_WEBHOOK_CANDIDATE
GHL_WEBHOOK_NEWSLETTER
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
ANTHROPIC_API_KEY
```

---

## Notes

- The **"Client Inquiry – Webhook"** workflow in GHL uses trigger `dd8498d0-c790-48af-a7e7-28de6a3a0def`, mapped to `/api/forms/client` on the server.
- To activate the trigger in GHL, set the trigger type to **"Inbound Webhook"** in the workflow builder.
- The site can be tested locally at `http://localhost:3001` by running `cd server && node index.js`.
