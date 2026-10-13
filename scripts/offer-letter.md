---
name: offer-letter
version: 0.1.0
title: "S.E.G. Offer Letter (Draft)"
type_label: "Offer Letter"
output_format: html-branded
inputs:
  - name: offer_date
    type: date
    required: true
    label: "Offer Date"
  - name: candidate_name
    type: text
    required: true
    label: "Candidate Full Name"
  - name: candidate_email
    type: text
    required: true
    label: "Candidate Email"
  - name: role_title
    type: text
    required: true
    label: "Role Title"
    placeholder: "Senior EHS Consultant"
  - name: reports_to
    type: text
    required: true
    label: "Reports To"
    placeholder: "Alex Gomez, President"
  - name: start_date
    type: date
    required: true
    label: "Anticipated Start Date"
  - name: work_location
    type: text
    required: true
    label: "Primary Work Location"
    placeholder: "Client site — Austin, TX"
  - name: employment_type
    type: text
    required: true
    label: "Employment Type"
    placeholder: "W-2 Employee / 1099 Consultant / Contract"
  - name: base_rate
    type: text
    required: true
    label: "Base Rate"
    placeholder: "$85,000/year or $75/hr"
  - name: rate_basis
    type: text
    required: true
    label: "Rate Basis"
    placeholder: "annual salary / hourly / project-based"
  - name: bonus_summary
    type: textarea
    required: false
    label: "Bonus / Incentives (if any)"
  - name: benefits_summary
    type: textarea
    required: false
    label: "Benefits summary (raw notes — AI polishes)"
  - name: state_of_employment
    type: text
    required: true
    label: "State of Employment"
    placeholder: "Texas"
    description: "Some at-will language varies by state — confirm with legal for CA/NY/MA"
  - name: welcome_note_raw
    type: textarea
    required: false
    label: "Personal welcome note (raw — AI polishes to brand voice)"
ai_slots:
  - name: welcome_paragraph
    source_input: welcome_note_raw
    max_words: 80
    tone: warm, direct, no BS
    instruction: |
      Rewrite the raw welcome note in S.E.G. voice from Brand Guidelines V2:
      warm, clear, no throat-clearing. Address the candidate by name. Reference
      why they matter to the mission ("We exist to prevent the incident that
      changes everything"). Avoid: personnel, resources, contractor, customer,
      best-in-class, cutting-edge, synergy, leverage. Use: people, consultant,
      client, protect. Output plain prose, 1-2 short paragraphs, no headers.
  - name: benefits_polished
    source_input: benefits_summary
    max_words: 90
    tone: direct, specific
    instruction: |
      Rewrite the raw benefits notes into a concise polished paragraph or short
      bullet list (max 6 bullets). If the raw is empty, output "Benefits eligibility
      per S.E.G. standard consultant policy — separate benefits document to follow."
      Plain prose or simple bullets only.
forbidden_words:
  - guarantee
  - certify
  - best-in-class
  - cutting-edge
  - synergy
approval:
  legal_review: false
  approved_by: null
  approved_at: null
  notes: |
    DRAFT — awaiting sample offer letters from client (Track 1.2) to finalize
    boilerplate legal language. At-will employment and NDA clauses are placeholders
    until legal review. Not for production use.
---

# Offer of Employment — S.E.G.

**Date:** {{user_input.offer_date}}

**To:** {{user_input.candidate_name}}
**Email:** {{user_input.candidate_email}}

---

Dear {{user_input.candidate_name}},

{{ai_generated.welcome_paragraph}}

## Role details

| Field | Detail |
|-------|--------|
| Title | {{user_input.role_title}} |
| Reports to | {{user_input.reports_to}} |
| Anticipated start | {{user_input.start_date}} |
| Work location | {{user_input.work_location}} |
| Employment type | {{user_input.employment_type}} |
| State of employment | {{user_input.state_of_employment}} |

## Compensation

**Base rate:** {{user_input.base_rate}} ({{user_input.rate_basis}})

**Bonus / Incentives:** {{user_input.bonus_summary}}

## Benefits

{{ai_generated.benefits_polished}}

---

[LOCKED]
## Standard Terms

**At-will employment.** Unless a separate written agreement states otherwise, employment with S.E.G. is at-will. Either you or S.E.G. may end the relationship at any time, with or without cause or notice, subject to applicable law.

**Confidentiality.** As a condition of employment, you will sign S.E.G.'s standard Confidentiality and Invention Assignment Agreement covering client information, proprietary methods, and any work product created during your engagement.

**Work authorization.** This offer is contingent on your ability to provide proof of legal authorization to work in the United States (Form I-9) on or before your start date.

**Background & references.** This offer is contingent on satisfactory completion of a standard background check and reference verification.

**No conflicting obligations.** By accepting this offer, you represent that no other agreement (non-compete, non-solicit, etc.) prevents you from performing this role for S.E.G.
[/LOCKED]

---

## Acceptance

If you accept these terms, please sign and return by {{user_input.offer_date}} + 7 days.

[SIGNATURE_BLOCK]

*S.E.G. — 809 N Kentucky St, Suite A, McKinney, TX 75069 · (469) 988-4777 · agomez@safety-excellence.com*

---

> ⚠ **DRAFT TEMPLATE** — Not for production use. Legal review required before first send.
> Sample offer letters from client are pending (Track 1.2 unblocker).
