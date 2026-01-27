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

## NEW Webhooks Needed

| Form/Feature | Fields | Notes |
|--------------|--------|-------|
| **Staffing Qualifier** (Get Matched in Seconds) | `full_name`, `company_email`, `phone`, `industry`, `role_level`, `timeline`, `duration`, `location`, `form_type` | Currently using STKY webhook as placeholder. Needs dedicated webhook. |
| **HASP Generator** | `full_name`, `company_email`, `framework`, `company`, `project`, `address` | Currently using STKY webhook as placeholder. Needs dedicated webhook. |
| **Sub Scorer** | `company_name`, `emr`, `trir`, `dart`, `years`, `citations`, `written_program`, `prequalification` | Currently no webhook. Needs dedicated webhook if lead capture desired. |

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
3. (Optional) Create webhook for **Sub Scorer** if lead capture needed
4. Update `public/index.html` with new webhook URLs once created
