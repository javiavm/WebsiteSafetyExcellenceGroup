# AEGIS AI Migration Reference & TODO
> Expert Full Stack / Program Manager Reference File
> Created: 2026-01-18

---

## AEGIS AI Platform Tech Stack (Target)

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router + Turbopack) |
| **API** | tRPC + React Query + superjson |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | Better Auth |
| **AI** | Vercel AI SDK + OpenAI |
| **UI** | Tailwind CSS 4 + shadcn/ui + Radix UI |
| **Forms** | react-hook-form + Zod validation |
| **State** | Component state, URL params (nuqs), Zustand stores |
| **Testing** | Vitest (integration) + Playwright (E2E) |
| **Package Manager** | pnpm |
| **Port** | 8080 |

### AEGIS AI Directory Structure
```
src/
├── app/                    # Next.js App Router (pages/layouts only)
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (protected)/       # Routes requiring auth
│   └── api/               # API routes (ai/, auth/, trpc/, cron/)
├── server/
│   ├── api/routers/       # tRPC routers (one per resource)
│   ├── api/trpc.ts        # Procedures and middleware
│   └── db.ts              # Prisma client
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── misc/              # Custom reusable
│   ├── features/          # Feature-specific (by feature)
│   └── providers/         # Context providers
├── schemas/               # Zod validation schemas
├── lib/                   # Shared utilities
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
└── trpc/                  # tRPC client (react.tsx, server.ts)
```

### AEGIS AI Conventions
- Named exports only (no default exports)
- TypeScript strict (no `any`)
- File naming: kebab-case (`jha-message.tsx`)
- Schema naming: camelCase + `Schema` suffix (`signUpSchema`)
- State in URL for shareable pages

---

## AEGIS AI Branding (Tools Must Match)

| Element | Value |
|---------|-------|
| **Primary Color** | Orange #ff5d00 |
| **Theme** | Dark mode (NOT pure black) |
| **Font** | Monospace (JetBrains Mono / Fira Code) |
| **Success Color** | Green (dark mode friendly) |
| **Background** | Original dark theme |

### Current SEG Website (To Be Updated)
| Element | Current | Target |
|---------|---------|--------|
| Accent | Yellow #FFCF00 | Orange #ff5d00 |
| Primary | Navy #132544 | Dark background |
| Theme | Light (Apple-clean) | Dark |
| Font | System fonts | Monospace |

---

## SEG Website Current Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vanilla HTML + CSS + JS |
| **Backend** | Node.js + Express |
| **Database** | SQLite (via db.js) |
| **API** | REST routes |
| **Port** | 3001 |

---

## Migration Readiness Scores

### Can Reuse (7+/10)
| File | Score | Action |
|------|-------|--------|
| `server/lib/stkyEngine.js` | 7/10 | Copy to `src/lib/engines/stky.ts`, add types |
| `server/lib/sifEngine.js` | 7/10 | Copy to `src/lib/engines/sif.ts`, add types |
| `server/data/stky-config.json` | 7.5/10 | Convert to Prisma seed or typed config |
| `server/data/sif-config.json` | 7.5/10 | Convert to Prisma seed or typed config |
| `public/css/tools-v3.css` | 8.5/10 | Extract theme values to Tailwind config |

### Needs Refactoring (5/10)
| File | Score | Issue |
|------|-------|-------|
| `server/routes/stky.js` | 5/10 | Mixed concerns (DB + validation + webhooks) |
| `server/routes/sif.js` | 5/10 | Same - needs service layer extraction |
| `server/routes/sif-filter.js` | 5/10 | Claude API call needs abstraction |
| `server/routes/dashboard.js` | 5/10 | JSON parsing scattered |

### Requires Complete Rewrite (2-3/10)
| File | Score | Reason |
|------|-------|--------|
| `public/tools/stky-assessment.html` | 2/10 | 300+ lines inline JS, incompatible with React |
| `public/tools/sif-scorecard.html` | 2/10 | 400+ lines inline JS |
| `public/tools/sif-filter.html` | 3/10 | Vanilla JS, simpler but still needs React |
| `public/js/tool-engine.js` | 3/10 | DOM manipulation, convert to React hooks |
| `public/js/tool-utils.js` | 3/10 | Small, rewrite as typed utilities |

---

## File Mapping: SEG Website → AEGIS AI

### Backend
```
server/lib/stkyEngine.js      →  src/lib/engines/stky.ts
server/lib/sifEngine.js       →  src/lib/engines/sif.ts
server/routes/stky.js         →  src/server/api/routers/stky.ts
server/routes/sif.js          →  src/server/api/routers/sif.ts
server/routes/sif-filter.js   →  src/server/api/routers/sif-filter.ts
server/routes/dashboard.js    →  src/server/api/routers/tools-dashboard.ts
server/data/stky-config.json  →  src/lib/config/stky-config.ts (or Prisma seed)
server/data/sif-config.json   →  src/lib/config/sif-config.ts (or Prisma seed)
```

### Frontend
```
public/tools/stky-assessment.html  →  src/app/(public)/tools/stky/page.tsx
public/tools/sif-scorecard.html    →  src/app/(public)/tools/sif/page.tsx
public/tools/sif-filter.html       →  src/app/(public)/tools/sif-filter/page.tsx
public/tools/index.html            →  src/app/(public)/tools/page.tsx
public/tools/dashboard.html        →  src/app/(protected)/tools/dashboard/page.tsx
public/js/tool-engine.js           →  src/hooks/useStepNavigation.ts + useSession.ts
public/js/tool-utils.js            →  src/lib/utils/tools.ts
public/css/tools-v3.css            →  tailwind.config.ts theme values
```

### Database
```
database/migrations/tools-v3.sql  →  prisma/app_db/schema.prisma (add models)
```

---

## TODO: Pre-Migration Tasks (SEG Website)

### Phase 1: Backend Prep
- [ ] Extract service layer from `server/routes/stky.js`
  - Create `server/services/stky.service.js`
  - Move scoring, DB, webhook logic out of route handlers
  - Routes become thin wrappers (2-3 lines each)
- [ ] Extract service layer from `server/routes/sif.js`
- [ ] Add Zod schemas for all API inputs
  - `schemas/stky.schema.js`
  - `schemas/sif.schema.js`
- [ ] Move webhook URLs to environment variables
  - Currently hardcoded in config JSONs
- [ ] Add TypeScript types to engines (or JSDoc for now)

### Phase 2: Branding Update
- [ ] Update `public/css/tools-v3.css` to AEGIS AI branding
  - Primary: #ff5d00 (orange)
  - Dark theme background
  - Monospace fonts
- [ ] Update tool pages with AEGIS AI logo/branding
- [ ] Add "Powered by AEGIS AI" to results pages

### Phase 3: Code Quality
- [ ] Add error handling to webhook calls (currently fire-and-forget)
- [ ] Add input validation on frontend before API calls
- [ ] Test all tool flows end-to-end

---

## TODO: Migration to AEGIS AI Platform

### Phase 1: Engines (Reusable)
- [ ] Copy `stkyEngine.js` to AEGIS AI `src/lib/engines/stky.ts`
- [ ] Copy `sifEngine.js` to AEGIS AI `src/lib/engines/sif.ts`
- [ ] Add TypeScript types to both engines
- [ ] Add Zod validation for inputs/outputs

### Phase 2: tRPC Routers
- [ ] Create `src/server/api/routers/stky.ts`
  - Wrap `scoreSTKY()` in `publicProcedure`
  - Add session management
- [ ] Create `src/server/api/routers/sif.ts`
  - Wrap `scoreSIF()` in `publicProcedure`
- [ ] Create `src/server/api/routers/sif-filter.ts`
  - AI classification endpoint
- [ ] Register routers in `src/server/api/root.ts`

### Phase 3: Database (Prisma)
- [ ] Add models to `prisma/app_db/schema.prisma`:
  ```prisma
  model ToolSession {
    id          String   @id @default(cuid())
    tool        String   // "stky" | "sif"
    createdAt   DateTime @default(now())
    completedAt DateTime?
    email       String?
    results     Json?
  }

  model ToolAssessment {
    id          String   @id @default(cuid())
    sessionId   String
    tool        String
    path        String
    context     Json
    responses   Json
    scores      Json
    createdAt   DateTime @default(now())
  }
  ```
- [ ] Create seed script for stky/sif configs
- [ ] Run migrations

### Phase 4: Frontend (React)
- [ ] Create shared components:
  - `src/components/features/tools/PathSelector.tsx`
  - `src/components/features/tools/ContextQuestions.tsx`
  - `src/components/features/tools/QuestionnaireStep.tsx`
  - `src/components/features/tools/ResultsDisplay.tsx`
  - `src/components/features/tools/EmailCapture.tsx`
- [ ] Create custom hooks:
  - `src/hooks/useStepNavigation.ts`
  - `src/hooks/useToolSession.ts`
  - `src/hooks/useAssessment.ts`
- [ ] Build pages:
  - `src/app/(public)/tools/page.tsx` (landing)
  - `src/app/(public)/tools/stky/page.tsx`
  - `src/app/(public)/tools/sif/page.tsx`
  - `src/app/(public)/tools/sif-filter/page.tsx`
  - `src/app/(protected)/tools/dashboard/page.tsx`

### Phase 5: Integration
- [ ] Configure webhooks (GoHighLevel) via env vars
- [ ] Implement async job queue for webhooks (BullMQ or pg-boss)
- [ ] Add error tracking (Sentry)
- [ ] E2E tests with Playwright

---

## Webhook URLs (Reference)

```
STKY:     https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/4781670c-aa84-46f0-8dfc-f9d4f11d4a4c

SIF_FREE: https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/bc3371cc-84f6-474e-8d88-a4455cc0b9bc

SIF_PAID: https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/ad3d5210-a42a-4d55-a467-ceb8ec5ff2f0
```

---

## Key Decisions Made

1. **SEG Website stays separate** - Marketing/lead gen site for S.E.G. Consulting
2. **Tools branded as AEGIS AI** - Orange/dark/monospace aesthetic
3. **Tools will eventually migrate to AEGIS AI platform** - But work standalone for now
4. **Scoring engines are portable** - Pure functions, can lift directly
5. **Frontend requires full rewrite** - Vanilla JS → React components
6. **Webhooks stay** - GoHighLevel integration for lead capture

---

## Notes

- AEGIS AI Platform repo: `aegis-ai-org/aegis-ai-platform`
- AEGIS AI runs on port 8080
- SEG Website runs on port 3001
- Both can run simultaneously during migration

---

*Last updated: 2026-01-18*
