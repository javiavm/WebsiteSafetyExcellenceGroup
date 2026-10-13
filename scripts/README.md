# Document Scripts — Authoring Guide

This directory holds the **master scripts** for every document type S.E.G. generates (Proposals, Offer Letters, Contracts, Resumes, etc.).

A script is the *single source of truth* for how a document looks. The engine guarantees zero deviation: AI fills only what we mark as AI-fillable, and `[LOCKED]` sections cannot be modified.

---

## File format

Each script is a Markdown file with YAML frontmatter:

```markdown
---
name: proposal                          # short id (no spaces)
version: 1.0.0                          # semver — increment on changes
title: "S.E.G. Project Proposal"        # human label
output_format: pdf                       # pdf | html | docx
inputs:                                  # what the user fills in the form
  - name: client_name
    type: text
    required: true
    label: "Client Name"
    placeholder: "Acme Corp"
  - name: project_scope_raw
    type: textarea
    required: true
    label: "Project scope (raw notes — AI will polish)"
ai_slots:                                # AI-filled fields (validated)
  - name: scope_summary
    source_input: project_scope_raw      # input that feeds the prompt
    max_words: 80
    tone: professional
    instruction: |
      Rewrite the raw scope notes into 2-3 concise paragraphs.
      Output only the rewritten text. No markdown, no headers.
forbidden_words:                         # safety net for AI output
  - guarantee
  - certify
approval:                                # who signed off + when
  legal_review: null
  approved_by: null
  approved_at: null
---

# {{user_input.client_name}} — Project Proposal

## Executive Summary

{{ai_generated.scope_summary}}

## Investment

Total: $`{{user_input.pricing_total}}` USD

[LOCKED]
## Standard Terms

All work performed under this proposal is subject to S.E.G.'s standard
master services agreement. Any deviation requires written approval...
(legal boilerplate — never modified by anyone but legal)
[/LOCKED]
```

---

## Slot syntax

| Token | Meaning | Example |
|---|---|---|
| `{{user_input.field}}` | Replaced with user form value | `{{user_input.client_name}}` |
| `{{ai_generated.field}}` | Replaced with validated AI output | `{{ai_generated.scope_summary}}` |
| `{{computed.field}}` | Replaced with calculated value | `{{computed.tax_amount}}` |
| `[LOCKED]...[/LOCKED]` | Inviolable section — the engine refuses if anyone tries to modify | legal boilerplate |

---

## Rules (no deviations)

1. **`[LOCKED]` blocks are immutable** at runtime. The engine compares against a hash on disk; any tampering aborts generation.
2. **AI output is validated**: word count cap, forbidden words list, no markdown injection.
3. **Every generated document is audited**: `template_version`, `inputs`, `ai_outputs`, `pdf_sha256`, `generated_by`, `timestamp` saved to SQLite.
4. **Scripts must have a `version`** — old documents always re-render against the version they were created with.
5. **A script with `approval.approved_by: null` is `draft`** and cannot be used in production (only by admin in `?dev=1` mode).

---

## How to add a new document type

1. Copy `_example.md` to `<name>.md` (e.g. `offer-letter.md`)
2. Define `inputs` (form fields) and `ai_slots` (AI-filled sections)
3. Write the body in Markdown with the slot syntax above
4. Mark immutable sections with `[LOCKED]...[/LOCKED]`
5. Set `approval.approved_by` once legal/Javier signs off
6. Test via `POST /api/documents/generate` with `{ "script": "<name>", "inputs": {...} }`

---

## Versioning policy

- **Patch** (1.0.x): typo fixes, formatting only
- **Minor** (1.x.0): new optional field, copy changes
- **Major** (x.0.0): structural change, removed field, legal language change → requires new approval

The engine refuses to use a script unless `version` is present and `approval.approved_by` is set (production mode).
