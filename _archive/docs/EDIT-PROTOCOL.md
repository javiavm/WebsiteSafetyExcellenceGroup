# Edit Protocol for SEG Website
> Rules for safe, surgical editing with AI assistance

---

## Safe Edit Rules

### 1. BEFORE ANY EDIT
- State which file you'll edit
- State which function/section (line range if known)
- State what you'll change (1-2 sentences)
- **WAIT for approval**

### 2. EDIT SIZE LIMITS
- Max 50 lines changed per edit
- If larger change needed, break into multiple edits
- Each edit = one commit-sized change

### 3. NO FULL FILE REWRITES
- Never rewrite an entire file
- Use surgical str_replace edits
- Preserve everything not explicitly being changed

### 4. VERIFY AFTER EACH EDIT
- Test the specific change
- Confirm no regressions
- Report: "Tested: [what] → [result]"

### 5. ROLLBACK READY
- Before editing, note current state
- If edit breaks something, restore immediately

---

## Prompt Template for Future Edits

Copy and use this when requesting changes:

```
I want to [GOAL].

Before writing any code:
1. Tell me which file(s) you'll modify
2. Tell me which function/section
3. Describe the change in 1-2 sentences
4. Estimate lines of change
5. Wait for my approval

Do not write code until I say 'proceed'.
```

---

## File-Specific Cautions

### `server/index.js`
- Contains API keys in environment variables - never hardcode
- AEGIS_SYSTEM_PROMPT is ~80 lines - edit specific sections only
- Test chat endpoint after any changes

### `website/seg-website-prototype-v2_7.html`
- 5700+ lines - always use line numbers
- Forms are at lines 4973, 5114, 4388
- Form submit functions at lines 5529, 5583, 5648
- CSS is embedded - changes can break layout

### `database/schema.sql`
- Changes require migration strategy
- Adding columns is safe; removing is dangerous
- Always backup `seg.db` before schema changes

### `algorithms/leadScoring.js` & `candidateScoring.js`
- Scoring constants at top of file
- Changes affect all new submissions
- Test with sample data before deploying

### `js/aegis-chatbot.js`
- CONFIG object at line 12-22
- Self-executing function - careful with scope
- Changes affect all pages using the widget

---

## Common Edit Patterns

### Pattern: Connect Form to Backend API

**Location:** `website/seg-website-prototype-v2_7.html`

**Current (direct to GHL):**
```javascript
const response = await fetch('https://services.leadconnectorhq.com/hooks/...', {
```

**Change to (via backend):**
```javascript
const response = await fetch('http://localhost:3001/api/forms/client', {
```

### Pattern: Update Chatbot API URL

**Location:** `js/aegis-chatbot.js` line 13

**Current:**
```javascript
apiUrl: 'http://localhost:3001/api',
```

**Change to:**
```javascript
apiUrl: 'https://your-production-domain.com/api',
```

### Pattern: Add New Scoring Factor

**Location:** `algorithms/leadScoring.js` SCORING object (lines 15-52)

1. Add new key to SCORING object
2. Update breakdown in `scoreClientLead()` function
3. Adjust maxScore calculation
4. Test with sample data

---

## Testing Checklist

After any edit, verify:

- [ ] No console errors in browser
- [ ] Forms still submit (check Network tab)
- [ ] Chatbot still responds
- [ ] Server starts without errors (`node server/index.js`)
- [ ] Database operations work (check server logs)

---

## Emergency Rollback

If something breaks:

1. **Git:** `git checkout -- [filename]`
2. **No Git:** Restore from backup or use Ctrl+Z in editor
3. **Database:** Restore `seg.db` from backup
4. **Server:** `Ctrl+C` and restart with `node server/index.js`

---

## Contact Points

| Issue | Check |
|-------|-------|
| Forms not submitting | Browser console, Network tab |
| Chatbot not responding | Server running? API URL correct? |
| Database errors | Server console logs |
| GHL not receiving data | Webhook URL correct? Server logs |
| Scoring wrong | Check algorithm constants |
