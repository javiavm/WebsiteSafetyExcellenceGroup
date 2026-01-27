# CLAUDE.md
## SEG Tools Prototype Build

---

## MISSION
Build STKY (free) + SIF (freemium) prototypes. Apple-clean UX. Connected data. Local only.

Read SEG-TOOLS-V3.md for all specs.

---

## FIRST: READ EXISTING PATTERNS
```bash
cat server/index.js
cat database/db.js
cat public/css/*.css
```
Match these patterns.

---

## CHECKPOINT SYSTEM
After each file, update CHECKPOINT.md:
```
LAST: [filename]
NEXT: [filename]
STATUS: ok/error
```

---

## BUILD ORDER

**Phase 1: Database**
1. database/migrations/tools-v3.sql

**Phase 2: Shared**
2. public/css/tools-v3.css (Apple-clean aesthetic)
3. public/js/tool-engine.js (shared logic, path routing, data connection)

**Phase 3: Data**
4. data/stky-config.json (paths, context, hazards, questions, scoring)
5. data/sif-config.json (paths, context, precursors, questions, scoring)

**Phase 4: Algorithms**
6. algorithms/stkyEngine.js
7. algorithms/sifEngine.js

**Phase 5: Routes**
8. server/routes/stky.js
9. server/routes/sif.js
10. server/routes/sif-filter.js (Claude API for P-SIF classification)

**Phase 6: Frontend**
11. public/tools/stky.html
12. public/tools/sif.html
13. public/tools/sif-filter.html

**Phase 7: Dashboard**
14. server/routes/dashboard.js (user results by session/email)
15. public/tools/dashboard.html (view past assessments)

**Phase 8: Integration**
16. Append routes to server/index.js
17. public/tools/index.html (tools landing page)
18. Update main site navigation (add Tools link)

---

## WEBHOOKS (LIVE)
```
STKY: https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/4781670c-aa84-46f0-8dfc-f9d4f11d4a4c

SIF_FREE: https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/bc3371cc-84f6-474e-8d88-a4455cc0b9bc

SIF_PAID: https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/ad3d5210-a42a-4d55-a467-ceb8ec5ff2f0
```

---

## UX REQUIREMENTS

**Apple-clean:**
- White space is a feature
- One question visible at a time on mobile
- Smooth transitions (300ms ease)
- Progress subtle but clear
- Typography: System fonts, hierarchy clear
- Colors: #FFCF00 (accent), #132544 (primary), #333 (text), #F4F4F4 (bg)

**No clutter:**
- No unnecessary labels
- Options are tappable cards, not dropdowns
- Selected state obvious
- Forward momentum always clear

---

## DISCLAIMERS (appear on results)
```
This assessment provides general guidance only. It does not constitute professional safety consulting or site-specific advice. Verify all findings against applicable local, state, and federal requirements. Consult qualified safety professionals before implementation.
```

---

## RULES
- NO deploy, NO push, NO delete existing
- Append only to index.js
- Match existing code patterns
- Test each phase before moving on

---

## VERIFY
```bash
node -c [file.js]
cd server && node index.js
# http://localhost:3001/tools/stky.html
# http://localhost:3001/tools/sif.html
```
