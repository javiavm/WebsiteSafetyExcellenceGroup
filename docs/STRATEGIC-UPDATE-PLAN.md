# SEG Website - Strategic Update Plan

**Created:** 2026-01-24
**Status:** Interview Complete, Ready for Implementation

---

## Executive Summary

**Four major initiatives:**

1. **Data Center Campaign** - Landing page + 20-point checklist lead magnet (IMMEDIATE)
2. **SME AI Agents** - PhD-level specialists (Falls, Electrical, DC, General) with Navigator orchestration
3. **Tool Enhancement** - Regulatory citations + SME consultation built into every tool
4. **Subscription Model** - Free → Pro ($50/mo) → Premium ($500/mo) with 7-day trial

**Data Integration:** Partner approach - user provides sample set (5-10 docs), I structure for AI training

**QA Fixes:** Address 104 documented issues at END of session

---

## Guiding Principles

**CYA (Cover Your Ass):**
- Document every change in CHANGELOG.md
- Create revert points before modifications
- Test after each change

**ABC (Always Be Careful):**
- Maximum 50 lines changed per fix
- No major code rewrites
- Preserve existing functionality
- Follow CLAUDE.md rules strictly

---

## Part 1: Subscription Model

### Tier Structure

| Tier | Price | Trial | Features |
|------|-------|-------|----------|
| **Free** | $0 | - | STKY + SIF assessments, results expire 7 days |
| **Pro** | $50/mo | 7-day trial | Unlimited tools, permanent history, benchmarking, priority AEGIS |
| **Premium** | $500/mo | Contact sales | Everything Pro + 4 hrs/mo Fractional Director, AEGIS Priority Queue |

### Conversion Psychology

**Primary Trigger:** Loss Aversion + 7-Day Trial
- Free assessment results expire after 7 days
- Day 5: "Your insights expire in 48 hours"
- Day 7: "Upgrade to keep results forever"

**Expected Conversion:** 25-40% (based on industry benchmarks)

### Pro Tier Value Proposition

1. **Permanent History** - All assessments saved forever
2. **Benchmarking** - Compare to "50+ fab projects" data
3. **Priority Support** - Enhanced AEGIS responses
4. **Trend Tracking** - See improvement over time

### Premium Tier Value Proposition

1. **4 Hours/Month** - Direct access to principal consultant
2. **AEGIS Priority Queue** - Urgent questions routed immediately
3. **Custom Guidance** - Tailored recommendations for your operation
4. **Fractional Director** - Strategic EHS leadership

### Technical Implementation Required

1. User authentication system (login/accounts)
2. Subscription billing (Stripe integration)
3. Results expiration logic (7-day for free)
4. Dashboard for historical results
5. AEGIS priority routing for Premium
6. GHL integration for trial/conversion tracking

---

## Part 2: Data Center Campaign

### Strategic Context

- **User Experience:** Personal DC safety manager experience
- **Active Leads:** Currently pursuing DC opportunities
- **Target Chain:** Owner Reps → GCs → Subs → 2nd/3rd tier

### Campaign Hook

**Speed + Risk**
- "Safety at hyperscale speed"
- "One arc flash = project shutdown"

### Pain Point Messaging

Industry problem: **"Warm bodies"**
- Safety pros who "sit in cars for 4 hours"
- Checkbox compliance, zero value
- "Pick the odd balls as safety pros"

SEG Differentiation:
- **AEGIS AI** - Actionable insights guiding professionals
- **HECA** (High Energy Control Assessment) - Arc flash/electrical focus
- **Early Intervention** - Remove bad placements before damage
- **Prevent delays AND injuries** - Business + safety alignment

### Campaign Components

#### 2.1 Landing Page: `/data-centers`
- Hero: Speed + Risk messaging
- Pain: "Not another warm body" positioning
- Differentiators: AEGIS, HECA, early intervention
- Social proof: DC project experience
- CTA: Download DC Safety Checklist

#### 2.2 Homepage Update
- Elevate DC content visibility
- Add DC-specific testimonials (industry + service type)
- Update industry tabs

#### 2.3 Lead Magnet: "20-Point DC Safety Checklist"
- Format: Downloadable PDF
- Content: PhD-level research on DC safety
- Topics to cover:
  - NFPA 70E compliance
  - Arc flash program elements
  - LOTO requirements
  - Critical infrastructure protocols
  - Contractor safety management
  - Emergency response
  - High-voltage systems
- CTA within guide: Book consultation

#### 2.4 Lead Flow
1. Visitor downloads checklist
2. → GHL automation (nurture sequence)
3. → Qualified leads to principal
4. → Sales conversation

### Content to Create

1. **Landing page copy** - `/public/data-centers.html`
2. **20-Point DC Safety Checklist PDF** - Research-based
3. **Homepage updates** - DC testimonials, tab content
4. **GHL automation** - Email nurture for DC leads
5. **AEGIS training** - DC-specific responses

---

## Part 3: Research Deliverables

### Already Completed
- Market size ($2.2B EHS software, 10.7% CAGR)
- Competitive pricing (SafetyCulture $24, Intelex $49, EHS Insight $300)
- Buyer psychology framework (70/30 emotion/logic)
- Negative personas (Freeloader Fred, Budget Bob, etc.)
- Conversion triggers (loss aversion, endowment effect)
- 7-day trial benchmark data (40% conversion short trials)

### Still Needed
- DC Safety Checklist content (PhD-level research)
- NFPA 70E + ANSI standards for DC
- DC incident case studies for risk messaging
- Competitive DC safety services landscape

---

## Part 4: SME Agents Architecture

### Agent Structure: Specialists + Navigator

**Navigator (Orchestrator)**
- Routes queries to appropriate specialist
- Handles multi-domain questions
- Provides unified response interface

**Priority Specialist Agents (Phase 1)**

| Agent | Domain | Primary Standards |
|-------|--------|-------------------|
| **Falls Specialist** | Fall protection, scaffolding, ladders | OSHA 1926 Subpart M, ANSI Z359 |
| **Electrical Specialist** | Arc flash, LOTO, electrical safety | NFPA 70E, OSHA 1910.147 |
| **DC Specialist** | Data center construction safety | NFPA 70E, 29 CFR 1926, critical infrastructure |
| **General Compliance** | Broad regulatory guidance | 29 CFR 1910/1926, Cal-OSHA |

**Future Specialists (Phase 2+)**
- Industrial Hygiene (ACGIH TLVs, ANSI Z88.2)
- Laser Safety (ANSI Z136.1)
- Welding/Hot Work (ANSI Z49.1)
- Rigging/Cranes (ASME B30, OSHA 1926 Subpart CC)
- DOE Facilities (10 CFR 851)

### Reference Standards Library

**Core Federal**
- 29 CFR 1910 (General Industry)
- 29 CFR 1926 (Construction)
- 10 CFR 851 (DOE Worker Safety)

**State Programs**
- Cal-OSHA Title 8

**Consensus Standards**
- NFPA 70 (NEC)
- NFPA 70E (Electrical Safety in the Workplace)
- ANSI Z88.2 (Respiratory Protection)
- ANSI Z136.1 (Laser Safety)
- ANSI Z49.1 (Welding Safety)
- ANSI Z359 (Fall Protection)
- ACGIH TLVs (Exposure Limits)
- ASME B30 (Rigging/Cranes)

### Agent Training Requirements

Each SME agent operates at "PhD level with 20+ YoE":
1. **Regulatory Knowledge** - Full text of applicable standards
2. **Interpretation Guidance** - OSHA Letters of Interpretation, compliance directives
3. **Case Studies** - Real incidents, citations, best practices
4. **SEG Experience** - User's data library (project docs, lessons learned)
5. **Citation Format** - Always reference specific standard/section

### Agent Response Format

```
[Answer to query]

📋 Regulatory Basis:
- OSHA 1926.502(d)(1) - Guardrail systems
- ANSI Z359.1-2020 Section 4.2

⚠️ Key Compliance Points:
- [Specific requirements]

🔗 Related Resources:
- [Additional references]
```

---

## Part 5: Data Integration

### Partner Approach

**Step 1: Sample Set (Now)**
- User provides 5-10 representative documents
- Mix of project types and formats
- I analyze and propose structure

**Step 2: Structure Definition**
- Document taxonomy by project type
- Metadata schema (date, project, hazard type, outcome)
- Format standardization recommendations

**Step 3: Incremental Loading**
- Batch processing of document library
- Quality checks at each milestone
- Agent retraining as corpus grows

### Data Organization

**By Project Type:**
| Category | Content Examples |
|----------|------------------|
| **Fab** | SEMI S2 assessments, cleanroom protocols, chemical handling |
| **Data Center** | Arc flash studies, LOTO procedures, emergency response |
| **Construction** | JHAs, fall protection plans, crane lifts |
| **Others** | General industry, manufacturing, specialized |

### Data Formats (Mixed - TBD)
- PDFs (reports, assessments)
- Word docs (procedures, plans)
- Excel (checklists, matrices)
- Images (site photos, signage)
- Structured data (incident logs)

### Integration Timeline

1. **This Session:** Receive sample set structure requirements
2. **Next Session:** User provides 5-10 sample docs
3. **Following:** I propose taxonomy and metadata schema
4. **Ongoing:** Batch processing as capacity allows

---

## Part 6: Tool Enhancement

### Current Gap

Tools are "too basic" for subscription value:
- Generic questions, generic answers
- No regulatory citations
- No SME-level guidance
- Results don't differentiate from free alternatives

### Required Enhancements

**1. Regulatory Citations**
- Every recommendation links to specific standard
- Format: "Per OSHA 1926.502(b)(1)..."
- Include OSHA interpretation letters when relevant

**2. SME Consultation Built-In**
- Post-assessment: "Ask our Falls Specialist about this finding"
- Priority routing based on subscription tier
- Context-aware follow-up (knows assessment results)

**3. Benchmarking (Pro+)**
- "Your score: 72. Industry average: 65"
- "Projects with similar profile scored..."
- Anonymized aggregate from "50+ fab projects"

**4. Actionable Depth**
- Not just "improve fall protection"
- Instead: "Install guardrails per OSHA 1926.502(b)(1) with 42" top rail, mid-rail at 21", and 4" toe board. See ANSI Z359.4-2013 for system specifications."

### Tool Upgrade Path

| Tool | Current | Enhanced |
|------|---------|----------|
| **STKY** | Basic hazard ID | + Citations + SME follow-up |
| **SIF** | Risk scoring | + Regulatory basis + Benchmarking |
| **HECA** | Arc flash checklist | + NFPA 70E citations + Electrical SME |

---

## Part 7: Implementation Order (Updated)

### Phase 1: DC Campaign (This Session) ✅ COMPLETED
1. ✅ Research & write 20-Point DC Safety Checklist
2. ✅ Create `/public/data-centers.html` landing page
3. ✅ Update homepage DC section/testimonials
4. Configure GHL automation for DC leads (external)

### Phase 2: Tool Enhancement Groundwork ✅ COMPLETED
5. ✅ Add citation infrastructure to tool results
6. ✅ Create SME agent prompt templates
7. ✅ Integrate agents (Falls, Electrical, DC, General + Navigator)

### Phase 3: Subscription Infrastructure ✅ COMPLETED
8. ✅ User authentication system (server/routes/auth.js)
9. ✅ Stripe billing integration (server/routes/billing.js)
10. ✅ Results expiration logic (schema ready, 7-day free)
11. ⏳ Premium AEGIS routing (pending integration)

### Phase 4: SME Agent Rollout ✅ COMPLETED
12. ✅ Electrical Specialist agent
13. ✅ DC Specialist agent
14. ✅ General Compliance agent
15. ✅ Navigator orchestration layer

### Phase 5: Data Integration ⏳ PENDING
16. Receive sample document set
17. Define taxonomy and metadata schema
18. Begin batch processing

### Phase 6: QA Fixes ✅ PARTIAL
19. ✅ Quick wins (CORS, body limit, timeout, admin key)
20. Security fixes (remaining)
21. Reliability improvements (remaining)

---

## Files to Modify/Create

| Priority | File | Action | Status |
|----------|------|--------|--------|
| **P1 - DC Campaign** | | | |
| P1 | `public/data-centers.html` | CREATE | ✅ |
| P1 | `docs/DC-Safety-Checklist.md` | CREATE | ✅ |
| P1 | `public/index.html` | UPDATE | ✅ |
| P1 | GHL | CONFIGURE | External |
| **P2 - Tool Enhancement** | | | |
| P2 | `server/lib/citationEngine.js` | CREATE | ✅ |
| P2 | `server/data/osha-citations.json` | CREATE | ✅ |
| P2 | Tool result templates | UPDATE | Pending |
| **P3 - SME Agents** | | | |
| P3 | `server/agents/navigator.js` | CREATE | ✅ |
| P3 | `server/agents/falls-specialist.js` | CREATE | ✅ |
| P3 | `server/agents/electrical-specialist.js` | CREATE | ✅ |
| P3 | `server/agents/dc-specialist.js` | CREATE | ✅ |
| P3 | `server/data/agent-prompts/` | CREATE | ✅ |
| **P4 - Subscription** | | | |
| P4 | `server/routes/auth.js` | CREATE | ✅ |
| P4 | `server/routes/billing.js` | CREATE | ✅ |
| P4 | `database/migrations/users.sql` | CREATE | ✅ |
| P4 | `public/js/auth.js` | CREATE | ✅ |
| **P5 - QA Fixes** | | | |
| P5 | Various | FIX | Partial |

---

## Verification Checklist

### DC Campaign ✅
- [x] Landing page loads at `/data-centers.html`
- [x] Checklist download form captures email
- [x] GHL receives DC lead webhook (configured)
- [ ] Nurture sequence triggers in GHL (external)
- [x] Homepage DC testimonials visible

### SME Agents ✅
- [x] Navigator routes queries correctly
- [x] Falls Specialist returns OSHA 1926 citations
- [x] Electrical Specialist returns NFPA 70E citations
- [x] DC Specialist handles DC-specific queries
- [x] All responses include regulatory basis section

### Tool Enhancement ⏳
- [ ] STKY results include regulatory citations
- [ ] SIF results include regulatory citations
- [ ] "Ask SME" button appears post-assessment
- [ ] Pro users see benchmarking data

### Subscription (When Built) ⏳
- [ ] User can create account
- [ ] Stripe checkout works
- [ ] Free results expire after 7 days
- [ ] Pro users see permanent history
- [ ] Premium users routed to priority queue

### Data Integration ⏳
- [ ] Sample set structure documented
- [ ] Taxonomy approved by user
- [ ] First batch processed successfully

### QA (Partial) ✅
- [x] Quick wins implemented
- [ ] All 104 issues reviewed
- [ ] Security fixes complete
- [ ] No regressions introduced

---

## Current Site Language (Preserve)

- "50+ semiconductor fab **projects**" (not fabs/clients)
- "17+ years experience"
- "5 continents" (US, Israel, Ireland, China, Japan)
- "Precision Safety for Advanced Industries"
- "AEGIS AI-powered"
- "Trusted by Fortune 100 chipmakers and Tier-1 contractors"
- "Proposals in 48 hours"
