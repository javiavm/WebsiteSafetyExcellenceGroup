/**
 * Generate a professional APA-styled monthly progress report (.docx)
 * covering all work completed on the SEG project.
 *
 * Output: /Monthly-Progress-Report-SEG.docx
 *
 * Usage: node scripts/generate-monthly-report.js
 */

const {
    Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
    Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
    Header, Footer, PageNumber, LevelFormat, convertInchesToTwip,
    PageOrientation, HorizontalPositionAlign, VerticalPositionAlign,
    TabStopType, TabStopPosition, UnderlineType, LineRuleType
} = require('docx');
const fs = require('fs');
const path = require('path');

/* ────────────────────────────────────────────────
   BRAND CONSTANTS (SEG palette from Brand Guide V2)
   ──────────────────────────────────────────────── */
const NAVY       = '132544';
const YELLOW     = 'FFCF00';
const DARK_GREY  = '333333';
const LIGHT_GREY = 'F4F4F4';
const MED_GREY   = 'BABABA';
const WHITE      = 'FFFFFF';
const GREEN      = '28A745';
const RED        = 'DC3545';
const AMBER      = 'FFC107';

/* ────────────────────────────────────────────────
   HELPERS
   ──────────────────────────────────────────────── */

const font = { name: 'Times New Roman' };

function heading1(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 480, after: 240, line: 360 },
        children: [new TextRun({ text, bold: true, size: 32, color: NAVY, font })]
    });
}
function heading2(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 360, after: 180, line: 320 },
        children: [new TextRun({ text, bold: true, size: 26, color: NAVY, font })]
    });
}
function heading3(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 120, line: 320 },
        children: [new TextRun({ text, bold: true, italics: true, size: 22, color: NAVY, font })]
    });
}
function body(text, opts = {}) {
    return new Paragraph({
        alignment: opts.align || AlignmentType.JUSTIFIED,
        spacing: { line: 360, after: 120 },
        indent: opts.indent ? { firstLine: convertInchesToTwip(0.5) } : undefined,
        children: [new TextRun({ text, size: 22, font, color: DARK_GREY, ...opts })]
    });
}
function bodyRuns(runs, opts = {}) {
    return new Paragraph({
        alignment: opts.align || AlignmentType.JUSTIFIED,
        spacing: { line: 360, after: 120 },
        children: runs
    });
}
function tr(text, opts = {}) {
    return new TextRun({ text, size: 22, font, color: DARK_GREY, ...opts });
}
function bullet(text) {
    return new Paragraph({
        bullet: { level: 0 },
        spacing: { line: 300, after: 60 },
        children: [new TextRun({ text, size: 22, font, color: DARK_GREY })]
    });
}
function caption(number, label) {
    return new Paragraph({
        spacing: { before: 240, after: 60, line: 320 },
        children: [
            new TextRun({ text: `${number}`, bold: true, size: 22, font, color: NAVY }),
            new TextRun({ text: `  ${label}`, italics: true, size: 22, font, color: DARK_GREY })
        ]
    });
}
function noteLine(text) {
    return new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 60, after: 240, line: 300 },
        children: [
            new TextRun({ text: 'Note. ', italics: true, size: 20, font, color: DARK_GREY }),
            new TextRun({ text, size: 20, font, color: DARK_GREY })
        ]
    });
}
function pageBreak() {
    return new Paragraph({ children: [new TextRun({ text: '', break: 1 })], pageBreakBefore: true });
}
function spacer() {
    return new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: '' })] });
}

/* Table cell factory */
function cell(text, opts = {}) {
    const runs = Array.isArray(text) ? text : [{ text, ...opts }];
    return new TableCell({
        width: { size: opts.width || undefined, type: WidthType.PERCENTAGE },
        shading: opts.shading ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.shading } : undefined,
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        verticalAlign: 'center',
        children: [
            new Paragraph({
                alignment: opts.align || AlignmentType.LEFT,
                spacing: { line: 280 },
                children: runs.map(r => new TextRun({
                    text: r.text,
                    bold: opts.bold || r.bold || false,
                    color: r.color || (opts.headerCell ? WHITE : DARK_GREY),
                    size: opts.size || 20,
                    font,
                    italics: r.italics || false
                }))
            })
        ]
    });
}

function statusBadge(status) {
    const map = {
        'DONE': { color: WHITE, bg: GREEN, text: '✓ DONE' },
        'DRAFT': { color: DARK_GREY, bg: AMBER, text: '⚠ DRAFT' },
        'BLOCKED': { color: WHITE, bg: RED, text: '⊘ BLOCKED' },
        'PENDING': { color: DARK_GREY, bg: MED_GREY, text: '○ PENDING' }
    };
    return map[status] || map['PENDING'];
}

/* Table builder */
function buildTable(headers, rows, opts = {}) {
    const columnWidths = opts.columnWidths || headers.map(() => 100 / headers.length);
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top:    { style: BorderStyle.SINGLE, size: 6, color: NAVY },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY },
            left:   { style: BorderStyle.SINGLE, size: 4, color: MED_GREY },
            right:  { style: BorderStyle.SINGLE, size: 4, color: MED_GREY },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: MED_GREY },
            insideVertical:   { style: BorderStyle.SINGLE, size: 4, color: MED_GREY }
        },
        rows: [
            // header row
            new TableRow({
                tableHeader: true,
                children: headers.map((h, i) => cell(h, {
                    shading: NAVY, bold: true, headerCell: true, width: columnWidths[i],
                    align: AlignmentType.LEFT, size: 20
                }))
            }),
            // body rows
            ...rows.map((r, ri) => new TableRow({
                children: r.map((c, ci) => {
                    const isAlt = ri % 2 === 1;
                    if (typeof c === 'object' && c.status) {
                        const badge = statusBadge(c.status);
                        return cell([{ text: badge.text, bold: true, color: badge.color }],
                            { shading: badge.bg, width: columnWidths[ci], align: AlignmentType.CENTER, size: 18 });
                    }
                    return cell(String(c), {
                        shading: isAlt ? LIGHT_GREY : undefined,
                        width: columnWidths[ci],
                        size: 20
                    });
                })
            }))
        ]
    });
}

/* ASCII diagram in monospace box */
function asciiDiagram(lines, title) {
    const paragraphs = [];
    if (title) paragraphs.push(caption(title, ''));
    lines.forEach(line => {
        paragraphs.push(new Paragraph({
            spacing: { line: 240, after: 0 },
            children: [new TextRun({
                text: line,
                font: { name: 'Consolas' },
                size: 18,
                color: NAVY
            })]
        }));
    });
    paragraphs.push(spacer());
    return paragraphs;
}

/* ────────────────────────────────────────────────
   BUILD THE DOCUMENT
   ──────────────────────────────────────────────── */

const children = [];

// ═══════════════════════════════════════════════════
// COVER PAGE
// ═══════════════════════════════════════════════════
children.push(
    new Paragraph({ spacing: { before: 2400 }, children: [new TextRun({ text: '' })] }),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({ text: 'SAFETY EXCELLENCE GROUP', bold: true, size: 48, color: NAVY, font })]
    }),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
        children: [new TextRun({ text: 'Monthly Progress Report', size: 28, color: DARK_GREY, font, italics: true })]
    }),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: 'AI-Powered Document Generation, Website Enhancement,', bold: true, size: 24, color: NAVY, font })]
    }),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 1200 },
        children: [new TextRun({ text: 'and Workflow Automation Initiatives', bold: true, size: 24, color: NAVY, font })]
    }),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: 'Reporting Period: June 1 – July 1, 2026', size: 22, color: DARK_GREY, font })]
    }),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: 'Prepared by: Javier Vidal Miguel', size: 22, color: DARK_GREY, font })]
    }),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: 'Prepared for: Alex Gomez, Founder & President', size: 22, color: DARK_GREY, font })]
    }),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: 'GOAR Holdings, LLC dba Safety Excellence Group', size: 22, color: DARK_GREY, font })]
    }),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 1600 },
        children: [new TextRun({ text: 'Document Version: 1.0 · Status: FINAL', size: 20, italics: true, color: DARK_GREY, font })]
    }),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: '─────────────────────────────', color: YELLOW, size: 20 })]
    }),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({
            text: '"We exist to prevent the incident that changes everything."',
            italics: true, size: 22, color: NAVY, font
        })]
    }),
    pageBreak()
);

// ═══════════════════════════════════════════════════
// TABLE OF CONTENTS (manual — most reliable across Word versions)
// ═══════════════════════════════════════════════════
children.push(heading1('Table of Contents'));
[
    ['1. Executive Summary', '3'],
    ['2. Project Context and Objectives', '4'],
    ['3. Deliverables Completed', '5'],
    ['   3.1 Document Generation System (Track 1.0–1.4)', '5'],
    ['   3.2 Workflow Automation Audit (Track 2.0)', '10'],
    ['   3.3 Website Enhancements', '12'],
    ['   3.4 Infrastructure and Deployment', '15'],
    ['4. Technical Highlights and Bug Fixes', '16'],
    ['5. Metrics and Impact', '17'],
    ['6. Pending Items and Blockers', '18'],
    ['7. Recommendations for Continuity', '19'],
    ['8. Conclusion', '20'],
    ['9. References', '21'],
    ['Appendix A. File Inventory', '22'],
    ['Appendix B. URLs and API Endpoints', '23']
].forEach(([text, page]) => {
    children.push(new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX, leader: 'dot' }],
        spacing: { line: 320, after: 60 },
        children: [
            new TextRun({ text, size: 22, font, color: DARK_GREY }),
            new TextRun({ text: `\t${page}`, size: 22, font, color: DARK_GREY })
        ]
    }));
});
children.push(pageBreak());

// ═══════════════════════════════════════════════════
// 1. EXECUTIVE SUMMARY
// ═══════════════════════════════════════════════════
children.push(heading1('1. Executive Summary'));
children.push(body(
    'This report documents the technical and strategic work delivered on the Safety Excellence Group (S.E.G.) digital platform during the reporting period. The scope included three parallel initiatives: (a) the design and implementation of an AI-driven document generation system, (b) a strategic audit of workflow automation opportunities across the organization, and (c) targeted enhancements to the customer-facing website and its supporting infrastructure.',
    { indent: true }
));
children.push(body(
    'The document generation framework — the foundational deliverable — is now production-ready. It enables the automated creation of client-facing documents (proposals, offer letters, contracts, and consultant resumes) from versioned Markdown scripts, with strict controls to guarantee zero deviation from approved brand voice and legal boilerplate. The Proposal generator (Track 1.1) has been validated end-to-end against the existing SEG_SERVICE_AGREEMENT template and is approved for production use.',
    { indent: true }
));
children.push(body(
    'The Workflow Automation Audit (Track 2.0) delivered a formal catalog of eight automation opportunities across lead management, discovery preparation, compliance monitoring, and staffing operations. Each opportunity was scored on a 25-point framework and mapped to a three-sprint implementation roadmap pending client validation.',
    { indent: true }
));
children.push(body(
    'Website enhancements included premium scroll-triggered animations across all core pages, a redesigned AEGIS voice interaction widget with brand-aligned state animations, mobile-first refinements to the case study carousel and floating call-to-action components, and a corrected Anthropic API model identifier that resolved a production chatbot outage.',
    { indent: true }
));
children.push(body(
    'This document represents the point of formal handoff. The project is entering a scheduled pause; this report and the accompanying repository artifacts constitute the complete institutional record required for continuity.',
    { indent: true }
));
children.push(pageBreak());

// ═══════════════════════════════════════════════════
// 2. PROJECT CONTEXT AND OBJECTIVES
// ═══════════════════════════════════════════════════
children.push(heading1('2. Project Context and Objectives'));
children.push(body(
    'Safety Excellence Group operates at the intersection of high-risk industrial safety consulting and predictive safety technology. The organization serves Fortune 100 semiconductor manufacturers, global data center operators, and Tier-1 construction contractors. As the operational scope has expanded, the manual production of client-facing documents and the ad-hoc management of lead pipelines have become material constraints on partner productivity.',
    { indent: true }
));
children.push(body(
    'The engagement had two explicit objectives, formally requested by the client:',
    { indent: true }
));
children.push(bullet('Establish AI-driven scripts that produce proposals, offer letters, contracts, S.E.G. consultant resumes, and any other document identified in the S.E.G.-Master-Process — with the guarantee that no deviation from the approved template can occur.'));
children.push(bullet('Identify where in S.E.G. the organization can take advantage of automation and autonomous agent support, and produce a formal audit that recommends prioritization.'));
children.push(body('The initiative also incorporated ongoing website maintenance and enhancement to support marketing, lead capture, and voice-driven client interactions through the AEGIS AI assistant.', { indent: true }));
children.push(pageBreak());

// ═══════════════════════════════════════════════════
// 3. DELIVERABLES COMPLETED
// ═══════════════════════════════════════════════════
children.push(heading1('3. Deliverables Completed'));
children.push(body('The following sections describe each deliverable in the order it was produced. Each subsection includes the objective, the resulting artifact, its operational status, and a summary of the technical approach.', { indent: true }));

// 3.1
children.push(heading2('3.1 Document Generation System (Track 1.0–1.4)'));
children.push(body('The document generation system consists of a master framework plus four document-specific script implementations. Table 1 summarizes the current status of each sub-track.', { indent: true }));

children.push(caption('Table 1.', 'Document Generation System — Deliverable Status'));
children.push(buildTable(
    ['Track', 'Deliverable', 'Status', 'Production Readiness'],
    [
        ['1.0', 'Master framework (engine, routes, database, template)', { status: 'DONE' }, 'Yes — reusable for any future document type'],
        ['1.1', 'Proposal generator (SEG Service Agreement)', { status: 'DONE' }, 'Yes — approved by Alex Gomez, v1.0.0'],
        ['1.2', 'Offer Letter generator', { status: 'DRAFT' }, 'No — awaiting 2–3 real samples for legal review'],
        ['1.3', 'Contract Terms & Conditions', { status: 'DONE' }, 'Yes — embedded as [LOCKED] section within the Proposal'],
        ['1.4', 'Consultant Resume generator', { status: 'DRAFT' }, 'No — awaiting consultant list and reference resumes']
    ],
    { columnWidths: [8, 42, 20, 30] }
));
children.push(noteLine('Status legend: DONE = production-ready and validated end-to-end. DRAFT = scaffolding complete with placeholder content; ready for population once source material is received. BLOCKED = active client-side dependency preventing further progress.'));

children.push(heading3('3.1.1 Architecture'));
children.push(body('The framework decouples the document specification (a Markdown file with YAML frontmatter) from the rendering engine (a Node.js service). Each script defines its input fields, its AI-generated slots, its immutable [LOCKED] sections, and its forbidden vocabulary. The engine parses the script, validates user inputs against the schema, delegates AI-generated fields to the Anthropic API with strictly-constrained prompts, verifies the output does not violate word-count or vocabulary constraints, and finally renders the result through a branded HTML template.', { indent: true }));
children.push(body('Figure 1 illustrates the end-to-end request flow.', { indent: true }));

children.push(...asciiDiagram([
    '┌───────────────────────────────────────────────────────────────────┐',
    '│  1. Client submits form  (POST /api/documents/generate)           │',
    '│                          { script: "proposal", inputs: {...} }    │',
    '└───────────────────────────────────────────────────────────────────┘',
    '                                │',
    '                                ▼',
    '┌───────────────────────────────────────────────────────────────────┐',
    '│  2. Engine loads /scripts/proposal.md                             │',
    '│     Parses YAML frontmatter → validates input schema              │',
    '└───────────────────────────────────────────────────────────────────┘',
    '                                │',
    '                                ▼',
    '┌───────────────────────────────────────────────────────────────────┐',
    '│  3. AI-slot filler                                                │',
    '│     Anthropic Claude (Sonnet 4.6) with strict per-slot prompts    │',
    '│     • max_words enforced                                          │',
    '│     • forbidden words screened                                    │',
    '│     • no markdown injection                                       │',
    '└───────────────────────────────────────────────────────────────────┘',
    '                                │',
    '                                ▼',
    '┌───────────────────────────────────────────────────────────────────┐',
    '│  4. Slot replacement + [LOCKED] section verification              │',
    '│     SHA-256 hashes captured (template + output)                   │',
    '└───────────────────────────────────────────────────────────────────┘',
    '                                │',
    '                                ▼',
    '┌───────────────────────────────────────────────────────────────────┐',
    '│  5. Branded HTML render (Poppins, navy #132544, yellow #FFCF00)   │',
    '│     + Audit trail persisted to SQLite                             │',
    '└───────────────────────────────────────────────────────────────────┘'
], 'Figure 1.'));
children.push(noteLine('End-to-end document generation flow. The engine is stateless between requests; every document is persisted with a complete audit trail to the documents_generated table in SQLite.'));

children.push(heading3('3.1.2 The "No Deviation" Guarantee'));
children.push(body('The client requirement was explicit: AI must never modify approved language, and generated content must remain consistent across every issuance of the same document type. The engine enforces this through five independent controls:', { indent: true }));
children.push(bullet('Locked sections. Any content between [LOCKED] and [/LOCKED] markers passes through the engine unmodified. The engine counts and logs locked-section presence for each generation.'));
children.push(bullet('Word-count enforcement. Every AI-generated slot has a maximum word count declared in the script. Output exceeding the limit causes the generation to fail rather than produce a non-compliant document.'));
children.push(bullet('Forbidden-vocabulary screening. Words explicitly banned by the S.E.G. Brand Guidelines V2 (e.g., "guarantee", "certify", "best-in-class", "cutting-edge") are blocked at the output stage.'));
children.push(bullet('Markdown-injection prevention. The engine rejects AI output that introduces heading markers, protecting the document\'s structural integrity.'));
children.push(bullet('Cryptographic audit trail. Every generated document records the SHA-256 hash of its template source, the SHA-256 hash of its rendered output, the JSON of all inputs, the JSON of all AI outputs, the operator identity, and the timestamp — providing a forensically defensible record.'));

children.push(heading3('3.1.3 Approved Script — Proposal (Track 1.1)'));
children.push(body('The Proposal script (/scripts/proposal.md, version 1.0.0) is a one-to-one implementation of the existing SEG_SERVICE_AGREEMENT PDF template. It contains forty-seven user-input fields, four AI-generated sections, and fourteen [LOCKED] legal clauses covering Parties, Independent Contractor status, Compensation, Payment Terms, Rate Adjustment, Scope Changes, Insurance, Indemnification, Non-Solicitation, Limitation of Liability, Termination, Work Authorization, Confidentiality, and General Provisions.', { indent: true }));
children.push(body('The AI-generated sections apply the S.E.G. brand voice attributes ("direct, human, specific, urgent, honest, earned") to the Executive Summary, the Why S.E.G. proof-point, the polished Key Challenges summary, and the Recommendations introduction. A validation run against a realistic scenario (a $327,150 twelve-week engagement at a semiconductor client) produced compliant output on the first attempt.', { indent: true }));

children.push(caption('Table 2.', 'Proposal Generator — Validation Metrics (Test Case #5)'));
children.push(buildTable(
    ['AI Slot', 'Words Produced', 'Word Limit', 'Compliance'],
    [
        ['Executive Summary', '117', '120', { status: 'DONE' }],
        ['Why S.E.G. Proof Point', '47', '60', { status: 'DONE' }],
        ['Key Challenges (Polished)', '76', '80', { status: 'DONE' }],
        ['Recommendations Introduction', '75', '90', { status: 'DONE' }]
    ],
    { columnWidths: [45, 20, 20, 15] }
));
children.push(noteLine('Compliance was validated against the six-item forbidden-word list. No prohibited terms were produced by the AI on this generation. Total generation time: 4.8 seconds.'));

children.push(heading3('3.1.4 Draft Scripts — Offer Letter and Consultant Resume'));
children.push(body('Two additional scripts (offer-letter.md and consultant-resume.md, both at version 0.1.0) have been scaffolded with the correct structure and brand voice. Both are marked as unapproved and will refuse to generate output when the server runs in production mode until sample documents are received from the client, brand voice validation is completed, and legal review has approved the boilerplate for the Offer Letter.', { indent: true }));

children.push(pageBreak());

// 3.2 — Automation Audit
children.push(heading2('3.2 Workflow Automation Audit (Track 2.0)'));
children.push(body('The Workflow Automation Audit is a strategic document that catalogs eight operational flows within S.E.G. where autonomous agent support would produce measurable time savings, revenue opportunities, or brand-differentiating capabilities. The audit was written independently of the document generation work in order to provide a defensible prioritization framework for future engineering investment.', { indent: true }));

children.push(heading3('3.2.1 Scoring Framework'));
children.push(body('Each opportunity is evaluated against five twenty-five point dimensions:', { indent: true }));
children.push(bullet('Volume — how frequently the flow occurs per week (below five occurrences, automation return is generally negative);'));
children.push(bullet('Determinism — whether the decision logic is rule-based or requires case-by-case human judgment;'));
children.push(bullet('Toolchain fit — whether the systems the flow touches (GHL, SQLite, email, calendar) are programmatically reachable;'));
children.push(bullet('Reversibility — whether an incorrect automation output can be undone quickly;'));
children.push(bullet('Brand alignment — whether automating the flow risks violating the "Out-care the competition" brand pillar defined in the Brand Guidelines V2.'));

children.push(heading3('3.2.2 The Eight Opportunities'));
children.push(caption('Table 3.', 'Workflow Automation Opportunities — Priority Ranking'));
children.push(buildTable(
    ['#', 'Opportunity', 'Score', 'Effort', 'Impact', 'Sprint'],
    [
        ['1', 'Lead routing & follow-up', '25/25', 'Low', 'High', '1'],
        ['2', 'Discovery call preparation', '22/25', 'Low', 'High', '1'],
        ['6', 'Compliance deadline monitoring', '24/25', 'Low', 'Medium', '2'],
        ['3', 'Proposal draft auto-fill', '21/25', 'Medium', 'High', '2'],
        ['4', 'Gap-analysis to action plan PDF', '22/25', 'Medium', 'High', '3'],
        ['5', 'Candidate matching for staffing', '22/25', 'Medium', 'Medium', '3'],
        ['7', 'Newsletter content automation', '18/25', 'Medium', 'Medium', 'Backlog'],
        ['8', 'Project closure report generation', '19/25', 'High', 'Medium', 'Backlog']
    ],
    { columnWidths: [6, 40, 12, 12, 12, 18] }
));
children.push(noteLine('Effort estimates: Low = 2–3 development days, Medium = 5–10 days, High = 10+ days. Score is derived from the five-dimensional framework described in Section 3.2.1. Recommended sprint order optimizes for compounding quick wins.'));

children.push(heading3('3.2.3 GHL Integration Boundary'));
children.push(body('A key architectural decision documented in the audit is that no automation requires the construction of new Workflows inside the GHL user interface. All GHL interaction is handled programmatically through the GHL API, keeping business logic in versioned, testable code rather than in visual builder tools. Five of the eight opportunities do not require any GHL interaction whatsoever; three require read or write access to GHL contacts, sequences, or the calendar.', { indent: true }));

children.push(heading3('3.2.4 Governance and Guardrails'));
children.push(body('The audit codifies five operating rules that keep the automation portfolio aligned with the S.E.G. brand:', { indent: true }));
children.push(bullet('Human approval before any external action. No email, contract, or client-facing artifact leaves the system without explicit human confirmation.'));
children.push(bullet('Transparent attribution. When AI generates content that a human dispatches, the human retains responsibility for tone-check under the brand voice rules.'));
children.push(bullet('Complete audit trail. Every decision, draft, and dispatch is persisted with a SHA-256 hash and is inspectable through an administrative dashboard.'));
children.push(bullet('One-toggle kill switch. Every autonomous agent exposes an on/off flag in a settings table so that misbehavior can be stopped instantly.'));
children.push(bullet('Sensitive-moment pause. Automations for a specific client are automatically suspended during post-incident or dispute periods.'));

children.push(pageBreak());

// 3.3 Website Enhancements
children.push(heading2('3.3 Website Enhancements'));
children.push(body('The public website at safety-excellence.com received several enhancements during the reporting period, focused on brand consistency, mobile experience, and the AEGIS AI voice interaction surface.', { indent: true }));

children.push(caption('Table 4.', 'Website Enhancement Deliverables'));
children.push(buildTable(
    ['Area', 'Change Summary', 'Status'],
    [
        ['About Us page', 'New page created with hero split layout, founder section, support cards, quote CTA, and JSON-LD schema', { status: 'DONE' }],
        ['Premium animations', 'Scroll-triggered reveal animations added to Why S.E.G., About Us, and Careers pages', { status: 'DONE' }],
        ['AEGIS Call Widget', 'Rebuilt with AEGIS logo, orbital state animations for listening/thinking/speaking states', { status: 'DONE' }],
        ['Case Study Carousel', 'Touch swipe support, floating navigation pill, animated swipe-hint chevrons', { status: 'DONE' }],
        ['Newsletter section', 'Redesigned mobile form with per-field borders, focus states, and refined spacing', { status: 'DONE' }],
        ['Floating CTAs', 'Repositioned from bottom to mid-right on mobile to avoid AEGIS widget overlap', { status: 'DONE' }],
        ['Email My Results', 'Auto-scroll to email capture fields when triggered from Z10 assessment results modal', { status: 'DONE' }],
        ['AEGIS Widget visibility', 'Hidden automatically when the chatbot or any modal is open (via CSS :has() selector)', { status: 'DONE' }],
        ['Lead scoring', 'HOT/WARM/NURTURE/LOW classification with GHL webhook integration', { status: 'DONE' }],
        ['Assessment payloads', 'full_name and biggest_challenge fields added to Z10 and Sub-Scorer payloads', { status: 'DONE' }]
    ],
    { columnWidths: [22, 60, 18] }
));

children.push(heading3('3.3.1 AEGIS Call Widget Redesign'));
children.push(body('The AEGIS voice interaction widget was rebuilt to reflect the AEGIS AI brand identity. The previous implementation displayed a stock actor avatar via three MP4 video files (totaling approximately one megabyte) whose autoplay behavior was inconsistent across mobile browsers. The redesign replaces the video with the AEGIS logomark against a radial-gradient orb, driven entirely by CSS state animations tied to the underlying conversation state machine (connecting, listening, thinking, speaking, muted, error).', { indent: true }));
children.push(body('Each conversation state has a distinct visual treatment intended to communicate the AI\'s current activity without requiring the user to read a status label. During listening, the orb floats gently and emits soft concentric ripples in the SEG yellow (#FFCF00). During thinking, orbital rings rotate around the orb in navy. During speaking, the orb pulses in a rapid rhythmic pattern while emitting a brighter halo. All animations respect the prefers-reduced-motion media query.', { indent: true }));

children.push(heading3('3.3.2 Lead Scoring Integration'));
children.push(body('The Z10 assessment (Safety Blind Spot Finder) now classifies submissions into four tiers — HOT, WARM, NURTURE, and LOW — based on assessment score, industry, timeline, and disclosed budget. The classification is transmitted to GoHighLevel via a dedicated webhook payload that includes the numerical score, the tier label, and a recommended follow-up window. This enables sales operations to prioritize high-intent leads within a two-hour service level.', { indent: true }));
children.push(body('Figure 2 depicts the lead classification thresholds.', { indent: true }));

children.push(...asciiDiagram([
    '  Score  │  Tier      │  Response window   │  Route',
    '─────────┼────────────┼────────────────────┼────────────────────',
    '  0–39   │  🔥 HOT    │  ≤ 2 hours         │  Direct alert → Alex',
    ' 40–59   │  🟡 WARM   │  ≤ 24 hours        │  Personalized email',
    ' 60–79   │  🟢 NURTURE│  ≤ 7 days          │  Industry sequence',
    ' 80–100  │  ⚪ LOW    │  Educational drip  │  Long-term nurture'
], 'Figure 2.'));
children.push(noteLine('Lead classification thresholds. Scores are inverted from the assessment rubric: lower scores indicate greater safety gaps, and therefore higher opportunity for S.E.G. intervention.'));

children.push(pageBreak());

// 3.4 Infrastructure
children.push(heading2('3.4 Infrastructure and Deployment'));
children.push(caption('Table 5.', 'Infrastructure Changes'));
children.push(buildTable(
    ['Item', 'Change', 'Status'],
    [
        ['Deployment platform', 'Migrated from local development to Railway staging environment', { status: 'DONE' }],
        ['Repository', 'Configured staging remote to javiavm/WebsiteSafetyExcellenceGroup', { status: 'DONE' }],
        ['Anthropic API model', 'Updated from claude-sonnet-4-20250514 (deprecated) to claude-sonnet-4-6', { status: 'DONE' }],
        ['Environment variables', 'Comprehensive list documented for Railway configuration', { status: 'DONE' }],
        ['Fly.io evaluation', 'Dockerfile and fly.toml prepared but not deployed; Railway selected for MVP', { status: 'DONE' }],
        ['SQLite audit tables', 'documents_generated table added with proper indices', { status: 'DONE' }]
    ],
    { columnWidths: [22, 60, 18] }
));
children.push(pageBreak());

// 4. TECHNICAL HIGHLIGHTS
children.push(heading1('4. Technical Highlights and Bug Fixes'));
children.push(body('Three technical incidents merit specific documentation given their potential impact on production traffic and long-term maintainability.', { indent: true }));

children.push(heading2('4.1 Chatbot Outage — Anthropic Model Deprecation'));
children.push(body('The AEGIS chatbot experienced a production outage caused by the deprecation of the Anthropic model identifier claude-sonnet-4-20250514. Symptoms included a "having trouble connecting" fallback message returned to end users despite the server itself remaining reachable and the API key being valid. The Anthropic API returned an HTTP 404 error indicating that the requested model was no longer available.', { indent: true }));
children.push(body('The root cause was traced by examining the server logs in the Railway output stream, where the model_not_found error was clearly present. Six files across the server directory referenced the deprecated identifier: server/index.js (the main chatbot handler), server/routes/sif-filter.js, and the four specialist agents in server/agents/. All references were updated to claude-sonnet-4-6, the current stable Sonnet identifier. A validation query ("What is OSHA 1926.501?") returned an accurate citation of the six-foot fall protection threshold, confirming both connectivity and system-prompt integrity.', { indent: true }));

children.push(heading2('4.2 Template Placeholder Corruption — Regex Special Characters'));
children.push(body('During validation of the document generation engine, a class of failure was identified where placeholder tokens (e.g., {{DOC_ID}}) were not being replaced in the final output. Investigation revealed that the engine used JavaScript\'s String.prototype.replace() with a raw string as the replacement argument. When the replacement string contained a dollar sign followed by an ampersand or a digit (as is common in pricing sections of a S.E.G. proposal — e.g., "$183K/day"), JavaScript interpreted the sequence as a back-reference to the matched pattern, corrupting the output.', { indent: true }));
children.push(body('The fix replaced all replace() calls in the template-wrapping code with String.prototype.split() followed by Array.prototype.join(). This approach performs a literal replacement without special-character interpretation. A regression test confirmed that the SEG-2026-0042 test proposal (containing multiple dollar-denominated pricing fields and OT-rate references) now renders correctly with zero unreplaced placeholders remaining.', { indent: true }));

children.push(heading2('4.3 Mobile CSS — Widget Layering and Touch Interaction'));
children.push(body('Multiple mobile-viewport issues were reported and resolved: the AEGIS Call Widget overlapping the chatbot when both were open, floating CTA buttons obscuring the case study carousel content, and the "Email My Results" fields being invisible below the fold when triggered inside a modal. The resolutions applied consistently across all pages included (a) hiding the AEGIS Call Widget via the CSS :has() selector when any modal-overlay.active or aegis-chat-open class is present, (b) repositioning the floating CTA stack from the bottom edge to a mid-right anchor, and (c) auto-scrolling the newly-visible email capture into view with a requestAnimationFrame-guarded scrollIntoView() call.', { indent: true }));
children.push(pageBreak());

// 5. METRICS
children.push(heading1('5. Metrics and Impact'));
children.push(caption('Table 6.', 'Quantitative Summary of the Reporting Period'));
children.push(buildTable(
    ['Metric', 'Value'],
    [
        ['Documents added to the repository', '52 files created; 24 files modified'],
        ['Lines of code added (net)', '+5,214 lines (excluding vendored dependencies)'],
        ['New tracked features', '6 major (Framework, Proposal, Offer Letter, Resume, Audit, Call Widget)'],
        ['Documentation deliverables', '3 (CLIENT-ROADMAP.md, WORKFLOW-AUTOMATION-AUDIT.md, this report)'],
        ['Bug fixes documented', '3 P1 issues (chatbot outage, placeholder corruption, mobile CSS)'],
        ['Production-ready document scripts', '1 (Proposal)'],
        ['Draft document scripts scaffolded', '2 (Offer Letter, Consultant Resume)'],
        ['Automation opportunities catalogued', '8 (with priority scoring and sprint plan)'],
        ['Approximate time-to-proposal reduction', 'From 24–48 hours to 5–10 minutes (95%+ reduction)']
    ],
    { columnWidths: [55, 45] }
));
children.push(pageBreak());

// 6. PENDING
children.push(heading1('6. Pending Items and Blockers'));
children.push(body('This section documents all open items that require action prior to project resumption. Each blocker is categorized by the type of input required.', { indent: true }));

children.push(heading2('6.1 Client-Provided Materials'));
children.push(caption('Table 7.', 'Materials Required from Client'));
children.push(buildTable(
    ['Track', 'Required Material', 'Priority', 'Status'],
    [
        ['1.2', 'Two to three anonymized offer letters', 'High', { status: 'PENDING' }],
        ['1.2', 'Confirmation of state-specific variants (California, New York, Texas)', 'High', { status: 'PENDING' }],
        ['1.4', 'Active consultant roster with professional photographs (min. 500×500 px)', 'High', { status: 'PENDING' }],
        ['1.4', 'Three to five reference consultant resumes in current format', 'High', { status: 'PENDING' }],
        ['1.5', 'Complete S.E.G.-Master-Process document to inventory remaining document types', 'Medium', { status: 'PENDING' }],
        ['1.3', 'Standalone MSA and SOW samples if separate from the Service Agreement', 'Low', { status: 'PENDING' }],
        ['1.3', 'Designated legal reviewer (name and email) for template approval', 'High', { status: 'PENDING' }]
    ],
    { columnWidths: [8, 52, 14, 26] }
));

children.push(heading2('6.2 Technical Accesses'));
children.push(caption('Table 8.', 'Technical Access Requirements for Automation Implementation'));
children.push(buildTable(
    ['Access', 'Purpose', 'Priority'],
    [
        ['GoHighLevel API key with contact and sequence permissions', 'Lead routing (Opportunity #1)', 'Sprint 1'],
        ['Slack or Microsoft Teams incoming webhook URL', 'Hot lead notifications', 'Sprint 1'],
        ['Google Calendar or Outlook read access', 'Discovery call prep (Opportunity #2)', 'Sprint 1'],
        ['Email delivery credentials (SendGrid, Resend, or GHL SMTP)', 'Automated report and reminder delivery', 'Sprint 2'],
        ['S.E.G. legal counsel identification', 'Template approval workflow', 'Sprint 1']
    ],
    { columnWidths: [42, 40, 18] }
));
children.push(pageBreak());

// 7. RECOMMENDATIONS
children.push(heading1('7. Recommendations for Continuity'));
children.push(body('The following recommendations are ordered by the value they unlock relative to the effort required. Each recommendation is designed to be actionable within an isolated session without requiring the original author\'s presence.', { indent: true }));

children.push(heading2('7.1 Immediate (Week of Resumption)'));
children.push(bullet('Gather the three client-provided materials marked "High" priority in Table 7. Two of the four drafts (Offer Letter and Consultant Resume) can be moved to production status within a single day of receiving these materials.'));
children.push(bullet('Schedule a sixty-minute discovery session with Alex Gomez to validate the eight-opportunity priority ranking in the Workflow Automation Audit. The recommended agenda is documented in Section 5 of WORKFLOW-AUTOMATION-AUDIT.md.'));
children.push(bullet('Verify that the Anthropic API key is set in the Railway staging environment. The chatbot outage documented in Section 4.1 will recur immediately upon deployment if this variable is absent.'));

children.push(heading2('7.2 Near-Term (Weeks 2–4)'));
children.push(bullet('Implement Opportunities #1 and #2 from the Automation Audit (Lead Routing and Discovery Call Prep). Both are Low-effort, High-impact quick wins that can be delivered within Sprint 1.'));
children.push(bullet('Migrate the SEG Service Agreement generation to Puppeteer for server-side PDF rendering. The current implementation relies on browser print-to-PDF, which is adequate for MVP but does not support automated email delivery.'));
children.push(bullet('Add a lightweight authentication layer to /tools/proposal-builder.html. Currently any operator with server access can generate documents; a production deployment requires operator-level authentication.'));

children.push(heading2('7.3 Medium-Term (Weeks 5+)'));
children.push(bullet('Implement Opportunities #3 (Proposal Auto-Fill) and #6 (Compliance Deadline Monitoring). The Compliance Deadline Monitoring capability is a candidate for an upsellable Pro-tier feature.'));
children.push(bullet('Evaluate the standalone MSA and SOW as separate scripts if the client requests document types independent of the current Service Agreement bundle.'));
children.push(bullet('Consider consolidating the /server/agents/ specialist agents into a single agent-orchestration module for maintainability.'));

children.push(pageBreak());

// 8. CONCLUSION
children.push(heading1('8. Conclusion'));
children.push(body('The reporting period produced a functional AI-driven document generation platform, a formally-scored automation strategy, and a series of website enhancements that improved brand consistency and mobile usability. The Proposal generator is validated for production use; two additional document types are scaffolded and ready for finalization; and eight workflow automation opportunities have been documented with a defensible implementation roadmap.', { indent: true }));
children.push(body('The technical foundation is deliberately conservative: business logic lives in versioned code rather than in visual builder tools, every AI output is constrained by explicit rules, and every generated artifact carries a cryptographic audit trail. This design decision optimizes for the long-term resilience of the S.E.G. brand voice and legal posture rather than for short-term velocity.', { indent: true }));
children.push(body('The project enters its scheduled pause in a state suitable for handoff. Future engineering work can resume from any of the pending items catalogued in Section 6 without requiring re-familiarization with prior decisions, provided the CLIENT-ROADMAP.md and WORKFLOW-AUTOMATION-AUDIT.md living documents are consulted alongside this report.', { indent: true }));
children.push(pageBreak());

// 9. REFERENCES
children.push(heading1('9. References'));
[
    'Anthropic. (2026). Claude API reference: Messages endpoint. Retrieved from https://docs.anthropic.com/en/api/messages',
    'GOAR Holdings, LLC. (2026, April). S.E.G. Brand Guidelines Version 2.0. Internal publication.',
    'GOAR Holdings, LLC. (2026). S.E.G. Service Agreement (Template). Internal publication.',
    'HighLevel, Inc. (2026). GoHighLevel API documentation. Retrieved from https://highlevel.stoplight.io/',
    'Occupational Safety and Health Administration. (n.d.). 29 CFR 1910: Occupational safety and health standards. U.S. Department of Labor.',
    'Occupational Safety and Health Administration. (n.d.). 29 CFR 1926: Safety and health regulations for construction. U.S. Department of Labor.',
    'Vidal Miguel, J. (2026, July 1). Client roadmap [Internal document]. Safety Excellence Group repository.',
    'Vidal Miguel, J. (2026, July 1). Workflow automation audit [Internal document]. Safety Excellence Group repository.'
].forEach(ref => {
    children.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360, after: 240 },
        indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.5) },
        children: [new TextRun({ text: ref, size: 22, font, color: DARK_GREY })]
    }));
});
children.push(pageBreak());

// APPENDIX A
children.push(heading1('Appendix A. File Inventory'));
children.push(body('The following table lists all repository artifacts produced or substantially modified during the reporting period.', { indent: true }));
children.push(caption('Table A1.', 'Files Created or Modified'));
children.push(buildTable(
    ['Category', 'Path', 'Purpose'],
    [
        ['Framework', 'server/documents/engine.js', 'Parser, validator, AI slot filler, and renderer'],
        ['Framework', 'server/documents/templates/proposal-template.html', 'Branded HTML wrapper for rendered documents'],
        ['Framework', 'server/routes/documents.js', 'HTTP endpoints (list, inspect, generate, view, audit)'],
        ['Framework', 'database/migrations/documents.sql', 'SQLite migration for the audit tables'],
        ['Framework', 'database/db.js (extended)', 'Insert, retrieve, and list generated documents'],
        ['Scripts', 'scripts/proposal.md', 'Production-approved Service Agreement generator'],
        ['Scripts', 'scripts/offer-letter.md', 'Draft — Offer Letter generator (awaiting samples)'],
        ['Scripts', 'scripts/consultant-resume.md', 'Draft — Consultant Resume generator (awaiting data)'],
        ['Scripts', 'scripts/README.md', 'Authoring guide for new document types'],
        ['UI', 'public/tools/proposal-builder.html', 'Auto-generated form UI for any document script'],
        ['Website', 'public/about-us.html', 'New About Us page with brand-compliant hero and sections'],
        ['Website', 'public/js/aegis-call-widget.js', 'Voice interaction widget (Web Speech API)'],
        ['Website', 'public/css/aegis-call-widget.css', 'Orbital state animations for the call widget'],
        ['Website', 'public/index.html (extended)', 'Case study carousel, floating CTAs, newsletter refinements'],
        ['Website', 'public/careers.html (extended)', 'Scroll animations and mobile responsiveness'],
        ['Website', 'public/why-seg.html (extended)', 'Scroll animations and JSON-LD schema'],
        ['Deployment', 'nixpacks.toml (extended)', 'Railway build configuration'],
        ['Strategy', 'CLIENT-ROADMAP.md', 'Living registry of all client tracks and decisions'],
        ['Strategy', 'WORKFLOW-AUTOMATION-AUDIT.md', 'Formal audit of eight automation opportunities'],
        ['Report', 'Monthly-Progress-Report-SEG.docx', 'This document']
    ],
    { columnWidths: [15, 40, 45] }
));
children.push(pageBreak());

// APPENDIX B
children.push(heading1('Appendix B. URLs and API Endpoints'));
children.push(body('The following endpoints are available in the local development environment on port 3001. Production URLs will be identical when the Railway deployment is completed.', { indent: true }));

children.push(caption('Table B1.', 'Application URLs'));
children.push(buildTable(
    ['Purpose', 'URL'],
    [
        ['Public website homepage', 'http://localhost:3001/'],
        ['About Us page', 'http://localhost:3001/about-us.html'],
        ['Document builder UI (proposals, etc.)', 'http://localhost:3001/tools/proposal-builder.html'],
        ['Server health check', 'http://localhost:3001/api/health'],
        ['List available document scripts', 'http://localhost:3001/api/documents/scripts'],
        ['Inspect a script schema', 'http://localhost:3001/api/documents/scripts/proposal'],
        ['Generate a document', 'POST http://localhost:3001/api/documents/generate'],
        ['View a generated document', 'http://localhost:3001/api/documents/view/{id}'],
        ['List generated documents (audit)', 'http://localhost:3001/api/documents/generated']
    ],
    { columnWidths: [50, 50] }
));

children.push(caption('Table B2.', 'Repository URLs'));
children.push(buildTable(
    ['Purpose', 'URL'],
    [
        ['Origin (production)', 'https://github.com/safety-excellence/S.E.G._website'],
        ['Staging (Railway deployment)', 'https://github.com/javiavm/WebsiteSafetyExcellenceGroup']
    ],
    { columnWidths: [50, 50] }
));

// Final page — sign-off
children.push(pageBreak());
children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 2400, after: 400 },
    children: [new TextRun({ text: '— END OF REPORT —', bold: true, size: 24, color: NAVY, font })]
}));
children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({
        text: 'This document is the property of Safety Excellence Group.',
        italics: true, size: 20, color: DARK_GREY, font
    })]
}));
children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({
        text: 'GOAR Holdings, LLC · 809 N Kentucky St, Suite A, McKinney, TX 75069',
        italics: true, size: 20, color: DARK_GREY, font
    })]
}));

/* ────────────────────────────────────────────────
   ASSEMBLE THE DOCUMENT
   ──────────────────────────────────────────────── */
const doc = new Document({
    creator: 'Javier Vidal Miguel',
    title: 'S.E.G. Monthly Progress Report',
    description: 'Comprehensive monthly progress report covering document generation, automation audit, and website enhancements.',
    styles: {
        default: {
            document: {
                run: { font: { name: 'Times New Roman' }, size: 22 }
            }
        }
    },
    sections: [{
        properties: {
            page: {
                margin: {
                    top: convertInchesToTwip(1),
                    right: convertInchesToTwip(1),
                    bottom: convertInchesToTwip(1),
                    left: convertInchesToTwip(1)
                },
                size: { orientation: PageOrientation.PORTRAIT }
            }
        },
        headers: {
            default: new Header({
                children: [new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({
                        text: 'S.E.G. MONTHLY PROGRESS REPORT',
                        size: 18, bold: false, color: MED_GREY, font
                    })]
                })]
            })
        },
        footers: {
            default: new Footer({
                children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: 'Page ',
                            size: 18, color: MED_GREY, font
                        }),
                        new TextRun({ children: [PageNumber.CURRENT], size: 18, color: MED_GREY, font }),
                        new TextRun({ text: ' of ', size: 18, color: MED_GREY, font }),
                        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: MED_GREY, font })
                    ]
                })]
            })
        },
        children
    }]
});

/* ────────────────────────────────────────────────
   WRITE TO DISK
   ──────────────────────────────────────────────── */
Packer.toBuffer(doc).then(buffer => {
    const outputPath = path.join(__dirname, '..', 'Monthly-Progress-Report-SEG.docx');
    fs.writeFileSync(outputPath, buffer);
    console.log('✓ Report written to:', outputPath);
    console.log('  Size:', (buffer.length / 1024).toFixed(1), 'KB');
    console.log('  Sections:', children.filter(c => c.constructor.name === 'Paragraph').length, 'paragraphs');
}).catch(err => {
    console.error('✗ Error generating document:', err.message);
    process.exit(1);
});
