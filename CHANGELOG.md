# CHANGELOG

All notable changes documented per CYA protocol.

---

## [2026-01-27] Brand Standardization & DC Enhancements

### Brand Standardization ✅
| File | Change | Description |
|------|--------|-------------|
| All pages | UPDATE | "Why SEG" → "Why S.E.G." in nav links |
| All pages | UPDATE | "The SEG Difference" → "What Sets Us Apart" |
| All pages | UPDATE | Hero badges simplified to "Powered by AEGIS AI" |
| All pages | UPDATE | Body copy "SEG" replaced with pronouns (we/our/us) |
| `public/why-seg.html` | UPDATE | Hero title "Why SEG?" → "Why S.E.G.?" |

**Kept As-Is (Intentional):** Image filenames, JSON-LD/structured data, legal disclaimers, testimonial quotes, CSS variables, admin dashboard.

### DC Page Polish ✅
| File | Change | Description |
|------|--------|-------------|
| `public/data-centers.html` | UPDATE | Added psychological triggers (loss aversion, authority, specificity, urgency) |
| `public/data-centers.html` | UPDATE | Cleaned copy - removed competitor attacks, added data-driven pain points |
| Multiple files | UPDATE | Fixed domain: `safetyexcellencegroup.com` → `safety-excellence.com` |
| `public/data-centers.html` | UPDATE | Added booking modal (GHL calendar) |

### DC Safety Checklist ✅
| Feature | Description |
|---------|-------------|
| Location | Modal on `public/data-centers.html` |
| Assessment | 20-point interactive checklist (7 sections) |
| ROI Calculation | OSHA Safety Pays methodology (internal pricing hidden) |
| Print Report | Generates PDF with answers, scores, ROI |
| Perfect Score | Pushes to Verification Audit (Uptime Institute 79% stat) |
| High Gap Warning | Red alert when >3 critical gaps |

### PRO Features (Backend) ✅
| File | Action | Description |
|------|--------|-------------|
| `server/lib/benchmarkEngine.js` | CREATE | Industry benchmarking vs 50+ fab projects |
| `server/lib/recommendationsEngine.js` | CREATE | PhD-level recommendations with citations |
| `server/data/benchmarks.json` | CREATE | Overall and by-industry benchmark data |

**API Response Updates:**
- `/api/stky/assess` → includes `benchmark`, `enhancedRecommendations`, `isPro`
- `/api/sif/assess` → includes `benchmark`, `isPro`
- `/api/dashboard` → includes `trends`, `isPro`

---

## [2026-01-24] Strategic Update Implementation

### Phase 1: DC Campaign ✅
| File | Action | Description |
|------|--------|-------------|
| `docs/DC-Safety-Checklist.md` | CREATE | 20-point DC safety checklist content |
| `public/data-centers.html` | CREATE | Landing page with lead capture form |
| `public/index.html` | UPDATE | Added DC section, navigation link |

### Phase 2: Tool Enhancement ✅
| File | Action | Description |
|------|--------|-------------|
| `server/lib/citationEngine.js` | CREATE | Regulatory citation lookup engine |
| `server/data/osha-citations.json` | CREATE | Citation database (OSHA, NFPA, ANSI) |

### Phase 3: Subscription Infrastructure ✅
| File | Action | Description |
|------|--------|-------------|
| `database/migrations/users.sql` | CREATE | Users & subscriptions schema |
| `server/routes/auth.js` | CREATE | User registration, login, logout, session |
| `server/routes/billing.js` | CREATE | Stripe checkout, webhook, subscription mgmt |
| `public/js/auth.js` | CREATE | Frontend auth module |
| `database/db.js` | UPDATE | Added users/user_sessions tables |
| `server/index.js` | UPDATE | Added auth/billing route handlers |

### Phase 4: SME Agents ✅
| File | Action | Description |
|------|--------|-------------|
| `server/agents/navigator.js` | CREATE | Query routing to specialists |
| `server/agents/falls-specialist.js` | CREATE | Falls protection SME agent |
| `server/agents/electrical-specialist.js` | CREATE | Electrical/arc flash SME agent |
| `server/agents/dc-specialist.js` | CREATE | Data center safety SME agent |
| `server/agents/general-specialist.js` | CREATE | General compliance SME agent |
| `server/data/agent-prompts/falls-specialist.md` | CREATE | Falls agent system prompt |
| `server/data/agent-prompts/electrical-specialist.md` | CREATE | Electrical agent system prompt |
| `server/data/agent-prompts/dc-specialist.md` | CREATE | DC agent system prompt |
| `server/data/agent-prompts/general-specialist.md` | CREATE | General agent system prompt |

### Phase 6: QA Fixes (Partial) ✅
| File | Change | Description |
|------|--------|-------------|
| `server/routes/admin.js` | SECURITY | Removed default admin key fallback |
| `server/index.js` | SECURITY | Added CORS configuration for production |
| `server/index.js` | SECURITY | Added 10kb request body size limit |
| `server/index.js` | RELIABILITY | Added 10s timeout to webhook calls |

---

## [2026-01-25] Tool Corrections

### Correction: Tool Structure Per Plan
**Active Tools (FREE):**
- STKY Assessment
- P-SIF Scorecard

**Future Tools (Coming Soon):**
- P-SIF Classification
- Metrics Analyzer (NOT on plan)

| File | Action | Description |
|------|--------|-------------|
| `public/tools/index.html` | UPDATE | Removed auth gate, show only 2 active tools + 1 coming soon |
| `public/tools/stky-assessment.html` | UPDATE | Removed auth redirect, removed Ask SME button |
| `public/tools/sif-scorecard.html` | UPDATE | Removed auth redirect, removed Ask SME button |
| `public/tools/sif-filter.html` | UPDATE | Redirect to tools page (Coming Soon) |
| `public/tools/metrics-analyzer.html` | UPDATE | Redirect to tools page (Coming Soon) |
| `public/tools/dashboard.html` | REWRITE | Simple email lookup only, no auth/subscription features |

### Citation Engine Integration ✅
| File | Action | Description |
|------|--------|-------------|
| `server/routes/stky.js` | UPDATE | Import citationEngine, add citations to assess response |
| `server/routes/sif.js` | UPDATE | Import citationEngine, add citations to assess response |
| `public/tools/stky-assessment.html` | UPDATE | Add citations container and render logic |
| `public/tools/sif-scorecard.html` | UPDATE | Add citations container and render logic |

### Agent Audit + API Integration ✅
**Audit Findings:**
| File | Status | Notes |
|------|--------|-------|
| `server/agents/navigator.js` | ✅ Good | Query router with keyword classification |
| `server/agents/falls-specialist.js` | ✅ Good | Full Claude integration, citation engine |
| `server/agents/electrical-specialist.js` | ✅ Good | NFPA 70E/LOTO expertise |
| `server/agents/dc-specialist.js` | ✅ Good | Data center construction focus |
| `server/agents/general-specialist.js` | ✅ Good | Fallback for unmatched domains |
| `server/data/agent-prompts/*.md` | ✅ Good | PhD-level prompts with response format |

**Integration Added:**
| File | Action | Description |
|------|--------|-------------|
| `server/routes/agents.js` | CREATE | API endpoints for agent queries |
| `server/index.js` | UPDATE | Import and mount agent routes |

**New API Endpoints:**
- GET /api/agents/specialists - List available SME agents
- POST /api/agents/query - Auto-routed query to best specialist
- POST /api/agents/specialist/:id - Direct query to specific agent
- GET /api/agents/classify - Classify query domain without processing

---

## Revert Instructions

To revert all changes from this session, use git:
```bash
git checkout -- .
git clean -fd
```

Note: Database changes (if any) would need separate rollback.

---

## Next Steps

1. **Go Live Requirements:**
   - Add Stripe keys to `.env`:
     - STRIPE_SECRET_KEY
     - STRIPE_WEBHOOK_SECRET
     - STRIPE_PRO_PRICE_ID
     - STRIPE_PREMIUM_PRICE_ID
   - Create products/prices in Stripe Dashboard
   - Set up Stripe webhook endpoint

2. **QA Testing:**
   - Test all pages at localhost:3001
   - Verify brand standardization (S.E.G. with periods)
   - Test DC Safety Checklist modal and print report

3. **Phase 5:** Data Integration (awaiting user sample docs)

4. Remaining QA fixes from QA-ISSUES.md
