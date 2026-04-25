# GHL Webhook Reference

## Existing Webhooks (Configured)

| Form/Feature | Webhook ID | Status | Page |
|--------------|------------|--------|------|
| **Client Inquiry** (Request Support) | `dd8498d0-c790-48af-a7e7-28de6a3a0def` | Active | Homepage |
| **Candidate Intake** (Join Our Team) | `255f5c21-06a3-4b59-a5b3-6b652570a779` | Active | Careers |
| **Newsletter Signup** | `64c3d0b5-a1fa-4574-a15b-137357fba21e` | Active | Homepage |
| **STKY Assessment** | `4781670c-aa84-46f0-8dfc-f9d4f11d4a4c` | Active | Tools |
| **SIF Free Assessment** | `bc3371cc-84f6-474e-8d88-a4455cc0b9bc` | Active | Tools |
| **SIF Paid Assessment** | `ad3d5210-a42a-4d55-a467-ceb8ec5ff2f0` | Active | Tools |
| **Stage 2 Invite** | `ad8aa4ed-32cd-45fe-b9eb-77727b3993aa` | Active | Internal |
| **Opportunity Alert** | `558c9693-50bc-4743-b82f-afd1912e0659` | Active | Internal |
| **A-Player Confirmed** | `7f5630cb-1250-4881-a91e-809a47867d80` | Active | Internal |
| **DC Checklist Download** | `4781670c-aa84-46f0-8dfc-f9d4f11d4a4c` | Active | Data Centers (uses STKY webhook) |

---

## Assessment Lead Scoring (NEW — via Client Inquiry webhook `dd8498d0`)

These use the existing Client Inquiry webhook with `form_type` to differentiate:

### Z10 Assessment (`form_type: 'z10_assessment'`)
Sent from all 6 pages when user clicks "Email My Results".

| Field | Type | Example |
|-------|------|---------|
| `form_type` | string | `z10_assessment` |
| `full_name` | string | `John Doe` |
| `email` | string | `john@company.com` |
| `assessment_score` | number | `45` |
| `assessment_rating` | string | `Improvement Opportunities` |
| `lead_classification` | string | `HOT` / `WARM` / `NURTURE` / `LOW` |
| `industry` | string | `semiconductor` / `datacenter` / `construction` / `manufacturing` |
| `gap_summary` | string | `Leadership (§4): 50% \| Planning (§5): 0% \| ...` |
| `source_page` | string | `index.html` |
| `timestamp` | ISO string | `2026-04-22T...` |

**Lead Classification (Z10):**
- `HOT` — Score < 40 (Significant Gaps — urgent need)
- `WARM` — Score 40-59 (Improvement Opportunities)
- `NURTURE` — Score 60-79 (Good Foundation)
- `LOW` — Score 80+ (Strong Indicators)

### Sub-Contractor Scorer (`form_type: 'sub_scorer'`)
Sent from all 6 pages when user clicks "Email These Results" after scoring.

| Field | Type | Example |
|-------|------|---------|
| `form_type` | string | `sub_scorer` |
| `email` | string | `john@company.com` |
| `company_name` | string | `Acme Corp` |
| `sub_score` | number | `62` |
| `sub_risk_label` | string | `Elevated Risk` |
| `lead_classification` | string | `WARM` |
| `key_findings` | string | `✓ Good EMR (0.85) \| ⚠ Elevated TRIR (3.2) \| ...` |
| `source_page` | string | `index.html` |
| `timestamp` | ISO string | `2026-04-22T...` |

**Lead Classification (Sub-Scorer):**
- `HOT` — Score < 50 (High Risk sub — needs vetting help)
- `WARM` — Score 50-69 (Elevated Risk)
- `NURTURE` — Score 70-84 (Moderate Risk)
- `LOW` — Score 85+ (Low Risk)

---

## GHL Workflow Setup Required

To use the lead classification data, configure in GHL:

1. **Custom Fields** (Settings > Custom Fields > Contact):
   - `assessment_score` (Number)
   - `assessment_rating` (Text)
   - `lead_classification` (Dropdown: HOT, WARM, NURTURE, LOW)
   - `form_type` (Text)

2. **Workflow Trigger**: Inbound Webhook on `dd8498d0` webhook
   - Branch by `form_type`:
     - `request_safety_support` → existing client flow
     - `z10_assessment` → assessment lead flow
     - `sub_scorer` → sub-scorer lead flow
   - Branch by `lead_classification`:
     - HOT → immediate notification + assign to sales
     - WARM → 24hr follow-up email sequence
     - NURTURE → drip campaign
     - LOW → tag only, no sequence

---

## Still Needed (Dedicated Webhooks)

| Form/Feature | Fields | Notes |
|--------------|--------|-------|
| **Staffing Qualifier** (Get Matched in Seconds) | `full_name`, `company_email`, `phone`, `industry`, `role_level`, `timeline`, `duration`, `location`, `form_type` | Currently using STKY webhook as placeholder. Needs dedicated webhook. |
| **HASP Generator** | `full_name`, `company_email`, `framework`, `company`, `project`, `address` | Currently using STKY webhook as placeholder. Needs dedicated webhook. |

---

## Base URL
All webhooks use:
```
https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/{WEBHOOK_ID}
```

---

## Field Mapping Reference

### Shared Fields (align across forms for GHL)
| Field | Attribute Name | Used In |
|-------|---------------|---------|
| Name | `full_name` | Client, Candidate, Staffing, HASP |
| Email | `company_email` | Client, Staffing, HASP |
| Phone | `phone` | Client, Candidate, Staffing |
| Company | `company_name` | Client, Candidate |
| Industry | `industry` | Client, Staffing |
| Location | `location` | Client, Staffing |
| Timeline | `timeline` | Client, Staffing |

---

## Action Items
1. Create new GHL webhook for **Staffing Qualifier**
2. Create new GHL webhook for **HASP Generator**
3. ~~(Optional) Create webhook for **Sub Scorer** if lead capture needed~~ DONE — uses Client webhook with `form_type: 'sub_scorer'`
4. Create GHL Custom Fields for assessment data (see Workflow Setup above)
5. Build GHL Workflow that branches on `form_type` and `lead_classification`
