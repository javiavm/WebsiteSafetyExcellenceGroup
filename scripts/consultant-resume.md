---
name: consultant-resume
version: 0.1.0
title: "S.E.G. Consultant Profile"
type_label: "Consultant Profile"
output_format: html-branded
inputs:
  - name: consultant_name
    type: text
    required: true
    label: "Consultant Full Name"
  - name: consultant_title
    type: text
    required: true
    label: "Title / Role"
    placeholder: "Senior EHS Consultant"
  - name: consultant_photo_url
    type: text
    required: false
    label: "Photo URL (relative to /public)"
    placeholder: "/images/consultants/john-doe.jpg"
  - name: years_experience
    type: number
    required: true
    label: "Years of Experience"
  - name: certifications
    type: textarea
    required: true
    label: "Certifications (one per line — BCSP CSP, OSHA 30, etc.)"
  - name: specialties
    type: textarea
    required: true
    label: "Specialties (one per line — Electrical Safety, Confined Space, etc.)"
  - name: experience_raw
    type: textarea
    required: true
    label: "Experience notes (raw — AI polishes into brand voice)"
  - name: projects_raw
    type: textarea
    required: false
    label: "Notable projects (raw notes — AI polishes)"
  - name: education
    type: textarea
    required: false
    label: "Education (one per line)"
ai_slots:
  - name: experience_polished
    source_input: experience_raw
    max_words: 150
    tone: earned, specific, honest
    instruction: |
      Rewrite the raw experience notes in S.E.G. voice (Brand Guidelines V2):
      earned, specific, honest. Lead with what they've done, not what they will do.
      Name industries, environments, and outcomes with numbers where possible.
      No corporate cliché. No "best-in-class" or "cutting-edge". Use: people,
      consultant, client, site, incident, protect. Output plain prose in 2-3
      short paragraphs, no headers.
  - name: projects_polished
    source_input: projects_raw
    max_words: 100
    tone: specific, story-led
    instruction: |
      Rewrite the projects list as a bulleted set of 3-5 project highlights.
      Each bullet: [Industry] · [Scope] · [Outcome with metric if available].
      Anonymize client names if not authorized (use "Fortune 100 semiconductor
      manufacturer" etc.). Output only the bullets, no intro/outro.
forbidden_words:
  - guarantee
  - certify
  - best-in-class
  - cutting-edge
approval:
  legal_review: false
  approved_by: null
  approved_at: null
  notes: |
    DRAFT — awaiting consultant list, photos, and 3-5 sample resumes from client
    to finalize (Track 1.4). Photo hosting path to be confirmed (Google Drive vs
    local /public/images/consultants/).
---

# {{user_input.consultant_name}}

**{{user_input.consultant_title}}**

*{{user_input.years_experience}} years in advanced-industry safety consulting*

---

## Overview

{{ai_generated.experience_polished}}

## Certifications

{{user_input.certifications}}

## Specialties

{{user_input.specialties}}

## Selected projects

{{ai_generated.projects_polished}}

## Education

{{user_input.education}}

---

[LOCKED]
## About S.E.G.

Safety Excellence Group is a people-first safety consulting firm. We exist to
prevent the incident that changes everything. We pair experienced EHS consultants
— placed on-site, embedded with your trades — with our own predictive systems,
AegisAI, that surface what humans miss.

We don't scale by adding headcount. We scale by setting a standard our clients
can't get anywhere else.
[/LOCKED]

---

*S.E.G. · 809 N Kentucky St, Suite A, McKinney, TX 75069 · (469) 988-4777 · safety-excellence.com*

---

> ⚠ **DRAFT TEMPLATE** — Not for production use. Awaiting consultant profile data.
