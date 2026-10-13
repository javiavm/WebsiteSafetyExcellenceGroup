---
name: proposal
version: 1.0.0
title: "S.E.G. Service Agreement"
type_label: "Service Agreement"
output_format: html-branded
inputs:
  - name: document_id
    type: text
    required: false
    label: "Document ID"
    placeholder: "SEG-2026-0042 (auto-generated if empty)"
  - name: proposal_date
    type: date
    required: true
    label: "Proposal Date"
  - name: valid_until
    type: date
    required: true
    label: "Valid Until"
  - name: project_name
    type: text
    required: true
    label: "Project Name"
    placeholder: "Semiconductor Fab Expansion Ph. 2"
  - name: client_company
    type: text
    required: true
    label: "Client Company"
    placeholder: "Acme Corp"
  - name: client_address
    type: text
    required: true
    label: "Client Address"
    placeholder: "123 Main St, Austin, TX 78701"
  - name: project_location
    type: text
    required: true
    label: "Project Location"
    placeholder: "Austin, TX"
  - name: effective_date
    type: date
    required: true
    label: "Effective Date"
  - name: role_1
    type: text
    required: true
    label: "Role 1"
    placeholder: "Senior EHS Consultant"
  - name: qty_1
    type: number
    required: true
    label: "Role 1 Qty"
  - name: rate_1
    type: number
    required: true
    label: "Role 1 Bill Rate ($/hr)"
  - name: ot_rate_1
    type: number
    required: true
    label: "Role 1 OT Rate ($/hr)"
  - name: hours_1
    type: number
    required: true
    label: "Role 1 Weekly Hours"
  - name: role_2
    type: text
    required: false
    label: "Role 2 (optional)"
  - name: qty_2
    type: number
    required: false
    label: "Role 2 Qty"
  - name: rate_2
    type: number
    required: false
    label: "Role 2 Bill Rate"
  - name: ot_rate_2
    type: number
    required: false
    label: "Role 2 OT Rate"
  - name: hours_2
    type: number
    required: false
    label: "Role 2 Weekly Hours"
  - name: role_3
    type: text
    required: false
    label: "Role 3 (optional)"
  - name: qty_3
    type: number
    required: false
    label: "Role 3 Qty"
  - name: rate_3
    type: number
    required: false
    label: "Role 3 Bill Rate"
  - name: ot_rate_3
    type: number
    required: false
    label: "Role 3 OT Rate"
  - name: hours_3
    type: number
    required: false
    label: "Role 3 Weekly Hours"
  - name: ot_multiplier
    type: text
    required: true
    label: "OT Multiplier (1.3, 1.5, etc.)"
    placeholder: "1.5"
  - name: reg_hours
    type: number
    required: true
    label: "Total Regular Hours"
  - name: reg_total
    type: number
    required: true
    label: "Total Regular Dollars"
  - name: ot_hours
    type: number
    required: false
    label: "Total OT Hours"
  - name: ot_total
    type: number
    required: false
    label: "Total OT Dollars"
  - name: grand_total
    type: number
    required: true
    label: "Grand Total ($)"
  - name: duration_weeks
    type: number
    required: true
    label: "Duration (weeks)"
  - name: environment_type
    type: text
    required: true
    label: "Environment Type"
    placeholder: "advanced semiconductor manufacturing"
  - name: work_environment
    type: textarea
    required: true
    label: "Work Environment description"
  - name: safety_oversight
    type: textarea
    required: true
    label: "Current safety oversight (raw notes)"
  - name: compliance_pressure
    type: text
    required: true
    label: "Compliance pressure"
  - name: operational_complexity
    type: text
    required: true
    label: "Operational complexity"
  - name: key_challenges_raw
    type: textarea
    required: true
    label: "Key challenges (raw notes — AI polishes)"
  - name: gap_oversight_state
    type: text
    required: true
    label: "Gap — Safety Oversight (current state)"
  - name: gap_oversight_risk
    type: text
    required: true
    label: "Gap — Safety Oversight (risk)"
  - name: gap_documentation
    type: text
    required: true
    label: "Gap — Documentation (current state)"
  - name: gap_documentation_risk
    type: text
    required: true
    label: "Gap — Documentation (risk)"
  - name: gap_training
    type: text
    required: true
    label: "Gap — Training (current state)"
  - name: gap_training_risk
    type: text
    required: true
    label: "Gap — Training (risk)"
  - name: gap_reporting
    type: text
    required: false
    label: "Gap — Reporting (current state)"
  - name: gap_reporting_risk
    type: text
    required: false
    label: "Gap — Reporting (risk)"
  - name: gap_accountability
    type: text
    required: false
    label: "Gap — Accountability (current state)"
  - name: gap_accountability_risk
    type: text
    required: false
    label: "Gap — Accountability (risk)"
  - name: option_good_desc
    type: text
    required: true
    label: "Pricing option GOOD — description"
  - name: option_good_price
    type: text
    required: true
    label: "Pricing option GOOD — investment"
  - name: option_good_fit
    type: text
    required: true
    label: "Pricing option GOOD — best fit"
  - name: option_better_desc
    type: text
    required: true
    label: "Pricing option BETTER — description"
  - name: option_better_price
    type: text
    required: true
    label: "Pricing option BETTER — investment"
  - name: option_better_fit
    type: text
    required: true
    label: "Pricing option BETTER — best fit"
  - name: option_best_desc
    type: text
    required: true
    label: "Pricing option BEST — description"
  - name: option_best_price
    type: text
    required: true
    label: "Pricing option BEST — investment"
  - name: option_best_fit
    type: text
    required: true
    label: "Pricing option BEST — best fit"
  - name: standdown_cost_day
    type: text
    required: false
    label: "Stand-down cost per day"
    placeholder: "$183K"
  - name: injury_cost
    type: text
    required: false
    label: "Average injury cost"
    placeholder: "$42K"
  - name: productivity_loss
    type: text
    required: false
    label: "Productivity loss from incident"
  - name: onboarding_weeks
    type: number
    required: true
    label: "Onboarding weeks"
  - name: onboarding_activities
    type: text
    required: true
    label: "Onboarding activities"
  - name: active_support_duration
    type: text
    required: true
    label: "Active Support duration"
  - name: active_support_activities
    type: text
    required: true
    label: "Active Support activities"
  - name: transition_duration
    type: text
    required: true
    label: "Transition duration"
  - name: transition_activities
    type: text
    required: true
    label: "Transition activities"
  - name: invoicing_frequency
    type: text
    required: true
    label: "Invoicing frequency"
    placeholder: "Bi-weekly"
  - name: proposed_call_date_time
    type: text
    required: false
    label: "Proposed review call"
    placeholder: "Tue Jul 8, 2:00 PM CT"
ai_slots:
  - name: executive_summary
    source_input: key_challenges_raw
    max_words: 120
    tone: direct, specific, urgent
    instruction: |
      Write the Executive Summary for a S.E.G. Service Agreement. Voice: direct, specific,
      urgent — no throat-clearing, no "we pride ourselves". Lead with what the client told us
      matters. Reference the environment, the pain, and how S.E.G. addresses it in 2 short
      paragraphs. Do NOT use: guarantee, certify, best-in-class, cutting-edge, solutions,
      synergy, leverage, personnel, resources, contractor, customer, facility. Use: people,
      consultant, client, site, incident, protect. Output plain prose only, no headers,
      no bullets, no quotes.
  - name: why_seg_proof_point
    source_input: environment_type
    max_words: 60
    tone: earned, specific, honest
    instruction: |
      Write the "Why S.E.G." proof-point paragraph. Reference the environment type given.
      Lead with what S.E.G. has done, not what it will do. One tight paragraph. No hype.
      Avoid: guarantee, certify, best-in-class, cutting-edge. Output plain prose only.
  - name: key_challenges_polished
    source_input: key_challenges_raw
    max_words: 80
    tone: direct, specific
    instruction: |
      Rewrite the raw challenges into a concise polished paragraph suitable for the
      Current State table's "Key Challenges" cell. Plain prose, single paragraph, no
      bullets. Avoid corporate jargon.
  - name: recommendations_intro
    source_input: key_challenges_raw
    max_words: 90
    tone: direct, specific
    instruction: |
      Write a short recommendations intro (2-3 sentences) that leads into the pricing
      options. Anchor to the client's specific pain points from the source input.
      Plain prose only. Avoid: guarantee, certify, best-in-class, cutting-edge.
forbidden_words:
  - guarantee
  - certify
  - best-in-class
  - cutting-edge
  - synergy
  - stakeholder alignment
approval:
  legal_review: true
  approved_by: "Alex Gomez"
  approved_at: "2026-07-01"
---

# S.E.G. Service Agreement

**Project:** {{user_input.project_name}}
**Client:** {{user_input.client_company}}
**Location:** {{user_input.project_location}}

**Document ID:** {{user_input.document_id}} · **Date:** {{user_input.proposal_date}} · **Valid Until:** {{user_input.valid_until}}

---

## Personnel & Rates

| Role | Qty | Bill Rate | OT Rate | Weekly Hours |
|------|-----|-----------|---------|--------------|
| {{user_input.role_1}} | {{user_input.qty_1}} | ${{user_input.rate_1}}/hr | ${{user_input.ot_rate_1}}/hr | {{user_input.hours_1}} |
| {{user_input.role_2}} | {{user_input.qty_2}} | ${{user_input.rate_2}}/hr | ${{user_input.ot_rate_2}}/hr | {{user_input.hours_2}} |
| {{user_input.role_3}} | {{user_input.qty_3}} | ${{user_input.rate_3}}/hr | ${{user_input.ot_rate_3}}/hr | {{user_input.hours_3}} |

**Overtime:** {{user_input.ot_multiplier}}x after 40 hrs/week.

## Financial Summary

| Line Item | Amount |
|-----------|--------|
| Regular Hours ({{user_input.reg_hours}} hrs) | ${{user_input.reg_total}} |
| Overtime Hours ({{user_input.ot_hours}} hrs) | ${{user_input.ot_total}} |
| **ESTIMATED TOTAL** | **${{user_input.grand_total}}** |
| Duration | {{user_input.duration_weeks}} weeks |

## Why S.E.G.

{{ai_generated.why_seg_proof_point}}

Whether it's {{user_input.environment_type}}, the pattern is the same: novel technology, real hazards, complex regulations, no template. **That's what we're built for — not bodies, but expertise.**

---

## Next Steps

To proceed, let's schedule a proposal review call. I never send proposals into the void — live review ensures I can answer questions in real-time and we're aligned on scope.

**Proposed review call:** {{user_input.proposed_call_date_time}}

**Alex Gomez** · (469) 988-4777 · agomez@safety-excellence.com

*This proposal is valid until {{user_input.valid_until}}. Pricing subject to change after expiration.*

---

# Part A: Service Proposal

## A.1 Executive Summary

{{ai_generated.executive_summary}}

## A.2 Current State

| Field | Detail |
|-------|--------|
| Work Environment | {{user_input.work_environment}} |
| Current Safety Oversight | {{user_input.safety_oversight}} |
| Compliance Pressure | {{user_input.compliance_pressure}} |
| Operational Complexity | {{user_input.operational_complexity}} |
| Key Challenges | {{ai_generated.key_challenges_polished}} |

## A.3 Gaps & Risks

| Area | Current State | Risk if Unaddressed |
|------|---------------|---------------------|
| Safety Oversight | {{user_input.gap_oversight_state}} | {{user_input.gap_oversight_risk}} |
| Documentation | {{user_input.gap_documentation}} | {{user_input.gap_documentation_risk}} |
| Training | {{user_input.gap_training}} | {{user_input.gap_training_risk}} |
| Reporting | {{user_input.gap_reporting}} | {{user_input.gap_reporting_risk}} |
| Accountability | {{user_input.gap_accountability}} | {{user_input.gap_accountability_risk}} |

## A.4 Recommendations

{{ai_generated.recommendations_intro}}

## A.5 Pricing Options

| Option | Description | Investment | Best For |
|--------|-------------|------------|----------|
| GOOD | {{user_input.option_good_desc}} | {{user_input.option_good_price}} | {{user_input.option_good_fit}} |
| **BETTER** | {{user_input.option_better_desc}} | {{user_input.option_better_price}} | {{user_input.option_better_fit}} |
| BEST | {{user_input.option_best_desc}} | {{user_input.option_best_price}} | {{user_input.option_best_fit}} |

## A.6 Value Context

**The cost of NOT having dedicated safety support:**

- Stand-down cost: {{user_input.standdown_cost_day}}/day
- Average injury cost: {{user_input.injury_cost}}
- Productivity loss from incident: {{user_input.productivity_loss}}

## A.7 Project Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| Onboarding | {{user_input.onboarding_weeks}} weeks | {{user_input.onboarding_activities}} |
| Active Support | {{user_input.active_support_duration}} | {{user_input.active_support_activities}} |
| Transition | {{user_input.transition_duration}} | {{user_input.transition_activities}} |

---

# Part B: Terms and Conditions

[LOCKED]
### B.1 Parties

This Service Agreement ("Agreement") is entered into as of {{user_input.effective_date}} by and between:

**PROVIDER:** GOAR Holdings LLC dba Safety Excellence Group, a Texas Corporation, with its principal office at 809 N Kentucky St, Suite A, McKinney, TX 75069

**COMPANY:** {{user_input.client_company}}, having an office at {{user_input.client_address}}

### B.2 Independent Contractor

Provider is an independent contractor, not an employee or agent of Company. Provider shall be solely responsible for all payroll taxes, workers' compensation insurance, employee benefits, and employment-related claims for Provider's personnel. Company shall direct the objectives and deliverables of services but shall not control the manner or method of Provider's work.

### B.3 Compensation

**Standard Rate:** As specified in the Personnel & Rates table.

**Overtime Rate:** {{user_input.ot_multiplier}}x standard rate for hours exceeding 40 per week.

**Invoice Frequency:** {{user_input.invoicing_frequency}}

**Invoice Contents:** Consultant name, hours worked by date, project assignment.

### B.4 Payment Terms

Payment is due Net 30 days from receipt of proper invoice.

**Late Payment:** Unpaid amounts shall accrue interest at 1.5% per month (18% annually). Invoice disputes must be raised in writing within 10 business days of receipt; undisputed portions remain due.

### B.5 Rate Adjustment

Provider may adjust rates annually with sixty (60) days' written notice. Standard annual adjustment shall not exceed 3.57% unless mutually agreed. Rate changes shall apply to all future work under this Agreement.

### B.6 Scope Changes

Changes to scope, personnel, or duration require written approval from both parties. Provider reserves the right to re-evaluate costs for significant scope changes.

### B.7 Insurance

Provider shall maintain the following insurance coverages throughout the term:

| Coverage Type | Minimum Limit |
|---------------|---------------|
| Commercial General Liability | $1,000,000 per occurrence / $2,000,000 aggregate |
| Workers' Compensation | Statutory limits |
| Employer's Liability | $1,000,000 per accident |
| Commercial Auto Liability | $1,000,000 combined single limit |

Certificate of Insurance provided upon request. Company shall be named as additional insured on CGL and Auto policies.

### B.8 Indemnification

**Provider Indemnification:** Provider shall indemnify, defend, and hold harmless Company from claims arising from: (a) Provider's negligent acts or omissions; (b) Provider's breach of this Agreement; (c) claims by Provider's personnel relating to their employment.

**Company Indemnification:** Company shall indemnify, defend, and hold harmless Provider from claims arising from: (a) unsafe worksite conditions not caused by Provider; (b) Company's negligent acts or omissions; (c) Company's breach of this Agreement.

### B.9 Non-Solicitation

During the term and for twelve (12) months thereafter, neither party shall directly solicit for employment any employee of the other party who was involved in providing or receiving services under this Agreement.

**Conversion Fee:** If Company hires any Provider personnel who performed services under this Agreement:

- During term or within 6 months of last service: 100% of individual's projected annual billing
- 6-12 months after last service: 50% of individual's projected annual billing

This fee constitutes liquidated damages representing Provider's investment in recruiting, training, and developing qualified personnel.

### B.10 Limitation of Liability

NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES.

EXCEPT FOR INDEMNIFICATION OBLIGATIONS AND BREACHES OF CONFIDENTIALITY, PROVIDER'S TOTAL LIABILITY SHALL NOT EXCEED FEES PAID UNDER THIS AGREEMENT IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.

### B.11 Termination

**For Convenience:** Either party may terminate upon thirty (30) days' prior written notice.

**For Cause:** Either party may terminate immediately if the other party commits a material breach that remains uncured for ten (10) business days after written notice.

**Definition of Cause:** Material breach includes: (a) non-payment within 15 days of invoice due date; (b) failure to provide safe working conditions; (c) unauthorized disclosure of confidential information; (d) insolvency or bankruptcy filing.

**Effect of Termination:** Upon termination, Company shall pay for all services rendered through the termination date.

### B.12 Work Authorization

Provider represents that all personnel assigned to perform services under this Agreement are authorized to work in the United States. Provider shall be responsible for maintaining valid work authorization throughout the engagement and shall promptly notify Company of any changes affecting assigned personnel's work authorization status.

### B.13 Confidentiality

Each party agrees to hold in confidence all Confidential Information disclosed by the other party. Confidential Information excludes information that is publicly available, was known prior to disclosure, or is independently developed. This obligation survives termination for three (3) years.

### B.14 General Provisions

**Governing Law:** This Agreement shall be governed by the laws of the State of Texas.

**Dispute Resolution:** Disputes shall be resolved first by good-faith negotiation. If unresolved within thirty (30) days, disputes shall be submitted to binding arbitration in Dallas, Texas under AAA rules.

**Force Majeure:** Neither party is liable for delays caused by events beyond reasonable control. If force majeure exceeds ninety (90) days (or thirty (30) days for short-term staffing), either party may terminate.

**Entire Agreement:** This Agreement constitutes the entire agreement and supersedes all prior understandings.

**Amendment:** Changes must be in writing signed by authorized representatives of both parties.

**Assignment:** Neither party may assign without prior written consent, except Provider may assign to an affiliate or successor.
[/LOCKED]

---

# Part C: Authorization

IN WITNESS WHEREOF, the Parties have caused this Agreement to be signed by their duly authorized representatives as of the Effective Date.

[SIGNATURE_BLOCK]
