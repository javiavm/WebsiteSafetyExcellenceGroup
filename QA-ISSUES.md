# SEG Website QA/QC Issues

**Generated:** 2026-01-23
**Total Issues:** 104

---

## CRITICAL (Fix Immediately)

### 1. Exposed API Key in Repository
- **File:** `server/.env`
- **Issue:** Live Anthropic API key committed to version control
- **Action:** Rotate key in Anthropic console, remove from git history, add .env to .gitignore

### 2. Weak Admin Authentication
- **File:** `server/routes/admin.js:17`
- **Code:** `const ADMIN_KEY = process.env.ADMIN_KEY || 'seg-admin-2025';`
- **Issue:** Default hardcoded key used if env var not set
- **Action:** Remove default fallback, implement JWT authentication

### 3. Public Data Endpoints (No Auth)
- **File:** `server/index.js:550` - `/api/clients` returns ALL clients
- **File:** `server/index.js:572` - `/api/candidates` returns ALL candidates
- **Action:** Add authentication or remove endpoints

### 4. Dashboard Publicly Queryable
- **File:** `server/routes/dashboard.js:14`
- **Issue:** Anyone can query any email's assessment history without auth
- **Action:** Add authentication

### 5. Missing Database Table
- **File:** `server/routes/metrics.js:13`
- **Issue:** References `tool_assessments` table that doesn't exist
- **Action:** Create table or change to `tool_assessments_v3`

---

## HIGH Priority

### Security
| Issue | File | Line | Action |
|-------|------|------|--------|
| CORS allows all origins | `server/index.js` | 52 | Configure allowed origins |
| Hardcoded webhook URLs | Multiple files | - | Move to env vars only |
| No rate limiting | All endpoints | - | Add express-rate-limit |
| No input validation | POST endpoints | - | Add joi/express-validator |
| PII logged unmasked | `server/index.js` | 241-246 | Mask sensitive data |
| Insecure session ID | `public/js/tool-engine.js` | 14 | Use crypto.randomUUID() |

### Reliability
| Issue | File | Action |
|-------|------|--------|
| No timeout on webhook calls | `stky.js`, `sif.js` | Add AbortController with 10s timeout |
| No timeout on Anthropic API | `sif-filter.js:50` | Add timeout config |
| No retry logic on webhooks | All webhook calls | Implement exponential backoff |
| Webhook failures silent | `server/index.js:329-338` | Log and alert on failures |
| Background task failures | `server/index.js:351-356` | Add error handling |

### Accessibility
| Issue | File | Action |
|-------|------|--------|
| Missing alt text | Multiple HTML | Add descriptive alt attributes |
| Color contrast violations | `tools-v3.css` | Fix #997a00 on yellow background |
| No ARIA live regions | Tool pages | Add aria-live="polite" for dynamic content |
| Missing form labels | `sif-scorecard.html:72-88` | Add proper labels |
| Color-only indicators | Assessment results | Add icons/text with colors |

### Database
| Issue | File | Line | Action |
|-------|------|------|--------|
| No CASCADE on FKs | `database/db.js` | 40, 49, 81 | Add ON DELETE CASCADE |
| Missing FK indexes | `database/schema.sql` | - | Add indexes |
| JSON.parse no try-catch | `dashboard.js:45`, `stky.js:145` | - | Wrap in try-catch |

---

## MEDIUM Priority

### Code Quality
- [ ] innerHTML with template literals (XSS risk) - `aegis-chatbot.js`, `tool-engine.js`, `metrics-analyzer.js`
- [ ] Inline event handlers - multiple files
- [ ] Inconsistent error response formats
- [ ] No request body size limits - add `express.json({ limit: '10kb' })`
- [ ] Z-index conflicts (values up to 99999) - standardize scale

### Algorithms
- [ ] Stage 2 Assessment: Perfect candidates score 58/100, should be 85+ (`algorithms/stage2Assessment.js:43-106`)
- [ ] STKY Question fa_2: Inverted scoring logic (`server/data/stky-config.json:174-181`)
- [ ] State extraction only covers 12 states (`algorithms/matchingAlgorithm.js:132-155`)
- [ ] Webhook payloads truncate to top 3 gaps (`server/routes/stky.js:281`)

### Frontend
- [ ] Inconsistent responsive breakpoints (480px, 520px, 640px)
- [ ] Missing semantic HTML (`<main>`, `<section>`)
- [ ] No lazy loading on images
- [ ] Large inline styles - move to CSS files

### Integration
- [ ] No CSRF protection on forms
- [ ] Webhook data uses pipe-delimited strings
- [ ] No idempotency keys on webhook calls
- [ ] No data retention policy

---

## LOW Priority

### Performance
- [ ] No script defer/async attributes
- [ ] Unoptimized inline SVGs
- [ ] Missing CSS gap fallbacks for older browsers
- [ ] No minification

### Cross-browser
- [ ] No polyfills for ES6 features (IE11)
- [ ] Incomplete vendor prefixes

### Code Cleanup
- [ ] Unused CSS classes in tools-v3.css
- [ ] Duplicate table definitions in db.js and migrations
- [ ] Inconsistent timestamp column names

---

## Files by Priority

### CRITICAL
1. `server/.env` - API key exposure
2. `server/routes/admin.js` - Auth weakness
3. `server/index.js` - Multiple issues
4. `server/routes/dashboard.js` - No auth

### HIGH
1. `server/routes/stky.js` - Webhook handling
2. `server/routes/sif.js` - Webhook handling
3. `database/db.js` - FK constraints
4. `public/js/aegis-chatbot.js` - XSS, accessibility

### MEDIUM
1. `algorithms/stage2Assessment.js` - Scoring logic
2. `public/js/tool-engine.js` - Session handling
3. `server/data/stky-config.json` - Question scoring
4. `public/css/tools-v3.css` - Accessibility

---

## Quick Wins (< 1 hour each)

1. [ ] Add `.env` to `.gitignore`
2. [ ] `app.use(express.json({ limit: '10kb' }))`
3. [ ] Configure CORS origins
4. [ ] Add `loading="lazy"` to images
5. [ ] Remove default admin key fallback
6. [ ] Add timeout to fetch calls

---

## Verification Commands

```bash
# Check for hardcoded secrets
grep -r "sk-ant" --include="*.js" .

# Check database tables
sqlite3 seg.db ".tables"

# Check foreign key status
sqlite3 seg.db "PRAGMA foreign_keys;"

# Test webhook connectivity
curl -X POST https://services.leadconnectorhq.com/hooks/... -H "Content-Type: application/json" -d '{}'
```

---

## Notes

- All webhook URLs are in CLAUDE.md for reference
- GHL location ID: `gdzuiKrnOBEej5nXBHbA`
- Server runs on port 3001
