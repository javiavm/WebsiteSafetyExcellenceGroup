/**
 * Document Generation Engine
 * Safety Excellence Group
 *
 * Loads a script, validates inputs against its schema, fills user_input
 * slots, calls Claude for ai_generated slots (with strict prompts and
 * validation), enforces [LOCKED] sections, and returns the rendered output.
 *
 * Design principle: ZERO deviation. AI cannot touch [LOCKED] blocks; AI
 * output is constrained (max words, forbidden words, no markdown injection).
 */

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const Anthropic = require('@anthropic-ai/sdk').default || require('@anthropic-ai/sdk');

const SCRIPTS_DIR   = path.join(__dirname, '..', '..', 'scripts');
const TEMPLATES_DIR = path.join(__dirname, 'templates');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ─────────────────────────────────────────────────────────
   1. Parse a script file → { frontmatter, body }
   ───────────────────────────────────────────────────────── */
function parseScript(scriptName) {
    const filePath = path.join(SCRIPTS_DIR, `${scriptName}.md`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Script not found: ${scriptName}.md`);
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const sha = crypto.createHash('sha256').update(raw).digest('hex');

    // Split YAML frontmatter from body
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) throw new Error(`Script ${scriptName} missing YAML frontmatter`);

    const frontmatter = parseSimpleYaml(match[1]);
    const body = match[2];

    return { frontmatter, body, contentSha: sha, filePath };
}

/* Minimal YAML parser — only handles what we use (no nested arrays of
   maps, no anchors). Avoids adding a dependency for this MVP. Promote
   to `yaml` package later if scripts get more complex. */
function parseSimpleYaml(text) {
    const lines = text.split('\n');
    const out = {};
    let currentKey = null;
    let currentList = null;
    let currentItem = null;
    let blockKey = null;
    let blockLines = null;
    let blockIndent = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const stripped = line.trim();
        if (!stripped || stripped.startsWith('#')) continue;

        // Continue collecting a block scalar (|)
        if (blockLines !== null) {
            const indent = line.search(/\S/);
            if (indent >= blockIndent && stripped !== '') {
                blockLines.push(line.slice(blockIndent));
                continue;
            } else {
                // End of block
                if (currentItem) currentItem[blockKey] = blockLines.join('\n').trim();
                else out[blockKey] = blockLines.join('\n').trim();
                blockLines = null;
                blockKey = null;
            }
        }

        // List item: scalar ("- guarantee") or object ("- name: foo")
        const listMatch = line.match(/^(\s*)-\s+(.+)$/);
        if (listMatch && currentList) {
            const rest = listMatch[2];
            const kv = rest.match(/^([\w_]+):\s*(.*)$/);
            if (kv) {
                const item = {};
                item[kv[1]] = parseValue(kv[2]);
                currentList.push(item);
                currentItem = item;
            } else {
                // Scalar list item — push the parsed value directly
                currentList.push(parseValue(rest));
                currentItem = null;
            }
            continue;
        }

        // Plain "key: value" or "key:"
        const kvMatch = line.match(/^(\s*)([\w_]+):\s*(.*)$/);
        if (kvMatch) {
            const indent = kvMatch[1].length;
            const key = kvMatch[2];
            const value = kvMatch[3];

            if (indent === 0) {
                // Top-level key
                if (value === '') {
                    // Either a list or a block scalar incoming
                    currentKey = key;
                    currentList = [];
                    out[key] = currentList;
                    currentItem = null;
                } else if (value === '|') {
                    blockKey = key;
                    blockLines = [];
                    blockIndent = 2;
                    currentItem = null;
                } else {
                    out[key] = parseValue(value);
                    currentList = null;
                    currentItem = null;
                }
            } else if (currentItem) {
                // Nested key inside a list item
                if (value === '|') {
                    blockKey = key;
                    blockLines = [];
                    blockIndent = indent + 2;
                } else {
                    currentItem[key] = parseValue(value);
                }
            } else if (currentKey) {
                // Nested key inside a dict (e.g. approval.approved_by)
                if (typeof out[currentKey] !== 'object' || Array.isArray(out[currentKey])) {
                    out[currentKey] = {};
                }
                out[currentKey][key] = parseValue(value);
            }
        }
    }

    // Flush trailing block
    if (blockLines !== null && blockKey) {
        if (currentItem) currentItem[blockKey] = blockLines.join('\n').trim();
        else out[blockKey] = blockLines.join('\n').trim();
    }

    return out;
}

function parseValue(s) {
    if (s === '' || s === 'null') return null;
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (/^-?\d+$/.test(s)) return parseInt(s, 10);
    if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
    // Strip surrounding quotes
    return s.replace(/^["'](.*)["']$/, '$1');
}

/* ─────────────────────────────────────────────────────────
   2. Validate user inputs against the script's input schema
   ───────────────────────────────────────────────────────── */
function validateInputs(script, inputs) {
    const errors = [];
    const schema = script.frontmatter.inputs || [];

    for (const field of schema) {
        const value = inputs[field.name];
        if (field.required && (value === undefined || value === null || value === '')) {
            errors.push(`Missing required input: ${field.name}`);
            continue;
        }
        if (value === undefined) continue;
        if (field.type === 'number' && typeof value !== 'number' && isNaN(parseFloat(value))) {
            errors.push(`Input ${field.name} must be a number`);
        }
    }

    if (errors.length) {
        const err = new Error('Input validation failed');
        err.details = errors;
        throw err;
    }
    return true;
}

/* ─────────────────────────────────────────────────────────
   3. Generate AI-filled slots via Claude with strict prompts
   ───────────────────────────────────────────────────────── */
async function fillAiSlots(script, inputs) {
    const aiSlots = script.frontmatter.ai_slots || [];
    const results = {};

    for (const slot of aiSlots) {
        const sourceValue = inputs[slot.source_input] || '';
        const systemPrompt = [
            `You fill a single slot in a S.E.G. document template.`,
            `Slot name: ${slot.name}`,
            `Tone: ${slot.tone || 'professional'}`,
            `Max length: ${slot.max_words} words (HARD limit).`,
            `Output ONLY the slot content. No markdown headers, no bullet lists`,
            `(unless explicitly listed in source), no preamble, no quotes.`,
            `Do not invent facts not present in the source.`
        ].join('\n');

        const userPrompt = `${slot.instruction}\n\nSource input:\n"""\n${sourceValue}\n"""`;

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: Math.max(slot.max_words * 4, 200),
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }]
        });

        let text = (response.content[0] && response.content[0].text || '').trim();

        // Validate output
        validateAiOutput(text, slot, script.frontmatter.forbidden_words || []);

        results[slot.name] = text;
    }

    return results;
}

function validateAiOutput(text, slot, forbiddenWords) {
    // Word count cap
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length > slot.max_words) {
        throw new Error(
            `AI output for ${slot.name} exceeds max_words (${words.length}/${slot.max_words})`
        );
    }
    // Forbidden words
    const lower = text.toLowerCase();
    for (const word of forbiddenWords) {
        if (lower.includes(word.toLowerCase())) {
            throw new Error(`AI output contains forbidden word: "${word}"`);
        }
    }
    // No markdown injection (heuristic)
    if (/^#{1,6}\s/m.test(text)) {
        throw new Error(`AI output for ${slot.name} contains markdown headers (not allowed)`);
    }
    return true;
}

/* ─────────────────────────────────────────────────────────
   4. Verify [LOCKED] blocks are unchanged at runtime
       (compares body hash against frontmatter approval — TODO once
       legal-approved hash is stored in `approval.body_sha256`)
   ───────────────────────────────────────────────────────── */
function verifyLockedSections(body) {
    const locked = body.match(/\[LOCKED\]([\s\S]*?)\[\/LOCKED\]/g) || [];
    return locked.length;  // returns count for audit log; tamper-check via DB hash
}

/* ─────────────────────────────────────────────────────────
   5. Replace slot tokens with values
   ───────────────────────────────────────────────────────── */
function fillSlots(body, inputs, aiOutputs) {
    // {{user_input.field}}
    let out = body.replace(/\{\{user_input\.([\w_]+)\}\}/g, (_m, field) => {
        if (inputs[field] === undefined || inputs[field] === null) return '';
        return String(inputs[field]);
    });
    // {{ai_generated.field}}
    out = out.replace(/\{\{ai_generated\.([\w_]+)\}\}/g, (_m, field) => {
        return aiOutputs[field] !== undefined ? aiOutputs[field] : `[missing: ${field}]`;
    });
    // {{computed.field}} — placeholder for future
    out = out.replace(/\{\{computed\.([\w_]+)\}\}/g, (_m, field) => `[computed: ${field}]`);

    // Strip [LOCKED] markers (the content stays, just remove the tags)
    out = out.replace(/\[LOCKED\]/g, '').replace(/\[\/LOCKED\]/g, '');

    return out;
}

/* ─────────────────────────────────────────────────────────
   6. Public API: generate a document end-to-end
   ───────────────────────────────────────────────────────── */
async function generateDocument({ scriptName, inputs, generatedBy }) {
    const script = parseScript(scriptName);

    // Refuse drafts in production
    const isProduction = process.env.NODE_ENV === 'production';
    const approved = script.frontmatter.approval && script.frontmatter.approval.approved_by;
    if (isProduction && !approved) {
        throw new Error(`Script ${scriptName} is not approved for production use`);
    }

    validateInputs(script, inputs);
    const aiOutputs = await fillAiSlots(script, inputs);
    const lockedCount = verifyLockedSections(script.body);
    const filledBody = fillSlots(script.body, inputs, aiOutputs);

    // Render — depending on output_format
    const format = script.frontmatter.output_format || 'html';
    let renderedBody = filledBody;
    if (format === 'html' || format === 'html-branded') {
        renderedBody = markdownToHtml(filledBody);
    }
    if (format === 'html-branded') {
        renderedBody = wrapInBrandedTemplate(renderedBody, {
            title:      script.frontmatter.title || scriptName,
            type_label: script.frontmatter.type_label || 'Document',
            doc_id:     inputs.document_id || `SEG-${Date.now().toString(36).toUpperCase()}`,
            doc_date:   inputs.proposal_date || new Date().toISOString().slice(0, 10)
        });
    }

    const outputSha = crypto.createHash('sha256').update(renderedBody).digest('hex');

    return {
        scriptName,
        scriptVersion: script.frontmatter.version,
        outputFormat:  format,
        body: renderedBody,
        aiOutputs,
        meta: {
            contentSha:  script.contentSha,
            outputSha,
            lockedCount,
            generatedBy: generatedBy || 'anonymous',
            generatedAt: new Date().toISOString()
        }
    };
}

/* ─────────────────────────────────────────────────────────
   7. Minimal Markdown → HTML renderer
       Supports: headings (# ## ###), paragraphs, bold **x**,
       italic *x*, unordered lists, tables, horizontal rules,
       and a custom [SIGNATURE_BLOCK] token used by the proposal.
   ───────────────────────────────────────────────────────── */
function markdownToHtml(md) {
    const lines = md.split('\n');
    const out = [];
    let inTable = false;
    let inList = false;
    let inLockedGroup = false;
    let paragraph = [];

    function flushParagraph() {
        if (paragraph.length) {
            const text = paragraph.join(' ').trim();
            if (text) out.push(`<p>${inline(text)}</p>`);
            paragraph = [];
        }
    }
    function flushList() {
        if (inList) { out.push('</ul>'); inList = false; }
    }
    function flushTable() {
        if (inTable) { out.push('</tbody></table>'); inTable = false; }
    }
    function inline(t) {
        // escape HTML minimally
        t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // bold **x**
        t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        // italic *x*
        t = t.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
        return t;
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Locked section wrappers (visual marker)
        if (trimmed === '[LOCKED]') { flushParagraph(); flushList(); flushTable(); out.push('<div class="locked-section">'); inLockedGroup = true; continue; }
        if (trimmed === '[/LOCKED]') { flushParagraph(); flushList(); flushTable(); out.push('</div>'); inLockedGroup = false; continue; }

        // Custom signature block token
        if (trimmed === '[SIGNATURE_BLOCK]') { flushParagraph(); flushList(); flushTable();
            out.push(`
<div class="signature-block">
    <div class="party">
        <h4>Company</h4>
        <div class="sig-line"></div><div class="sig-label">Signature</div>
        <div class="sig-line"></div><div class="sig-label">Name</div>
        <div class="sig-line"></div><div class="sig-label">Title</div>
        <div class="sig-line"></div><div class="sig-label">Date</div>
    </div>
    <div class="party">
        <h4>Provider — Safety Excellence Group</h4>
        <div class="sig-line"></div><div class="sig-label">Signature</div>
        <div class="sig-line"></div><div class="sig-label">Name: Alex Gomez</div>
        <div class="sig-line"></div><div class="sig-label">Title: President</div>
        <div class="sig-line"></div><div class="sig-label">Date</div>
    </div>
</div>`);
            continue;
        }

        // Blank line
        if (trimmed === '') { flushParagraph(); flushList(); flushTable(); continue; }

        // Headings
        const h = trimmed.match(/^(#{1,3})\s+(.*)$/);
        if (h) { flushParagraph(); flushList(); flushTable();
            const level = h[1].length;
            out.push(`<h${level}>${inline(h[2])}</h${level}>`);
            continue;
        }

        // Horizontal rule
        if (/^-{3,}$/.test(trimmed)) { flushParagraph(); flushList(); flushTable(); out.push('<hr>'); continue; }

        // Table row (contains | and next-or-this is separator ---)
        if (/^\|.*\|$/.test(trimmed)) {
            const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());
            const isSeparator = cells.every(c => /^-{3,}:?$|^:?-{3,}:?$/.test(c));
            if (isSeparator) continue;  // skip alignment rows
            if (!inTable) {
                out.push('<table>');
                // If next non-separator line is a separator → this row is header
                const nextLine = (lines[i + 1] || '').trim();
                const nextIsSep = /^\|[-:\s|]+\|$/.test(nextLine);
                if (nextIsSep) {
                    out.push('<thead><tr>' + cells.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead>');
                    out.push('<tbody>');
                } else {
                    out.push('<tbody>');
                    out.push('<tr>' + cells.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>');
                }
                inTable = true;
                continue;
            }
            // In-table row — check for row-highlight marker
            const rowClass = cells[0].startsWith('**') && cells[0].endsWith('**') ? ' class="row-highlight"' : '';
            out.push(`<tr${rowClass}>` + cells.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>');
            continue;
        } else {
            flushTable();
        }

        // Unordered list
        const li = trimmed.match(/^[-*]\s+(.*)$/);
        if (li) { flushParagraph();
            if (!inList) { out.push('<ul>'); inList = true; }
            out.push(`<li>${inline(li[1])}</li>`);
            continue;
        } else {
            flushList();
        }

        // Default: accumulate paragraph
        paragraph.push(trimmed);
    }
    flushParagraph(); flushList(); flushTable();
    return out.join('\n');
}

/* ─────────────────────────────────────────────────────────
   8. Wrap rendered HTML body in the branded template
   ───────────────────────────────────────────────────────── */
function wrapInBrandedTemplate(bodyHtml, meta) {
    const templatePath = path.join(TEMPLATES_DIR, 'proposal-template.html');
    if (!fs.existsSync(templatePath)) {
        console.warn('[engine] template not found at ' + templatePath + ' — returning raw body');
        return bodyHtml;
    }
    let out = fs.readFileSync(templatePath, 'utf8');
    // Use split/join to replace ALL occurrences safely (avoids `$` special chars
    // in String.prototype.replace replacement strings — which could mangle
    // AI-generated content containing $ or $1 patterns).
    const subs = {
        'DOC_TITLE':      String(meta.title      || 'S.E.G. Document'),
        'DOC_TYPE_LABEL': String((meta.type_label || 'DOCUMENT')).toUpperCase(),
        'DOC_ID':         String(meta.doc_id     || '—'),
        'DOC_DATE':       String(meta.doc_date   || new Date().toISOString().slice(0, 10)),
        'DOC_BODY':       String(bodyHtml || '')
    };
    for (const [k, v] of Object.entries(subs)) {
        out = out.split('{{' + k + '}}').join(v);
    }
    // Sanity check: no placeholder tokens should remain
    const leftover = out.match(/\{\{[A-Z_]+\}\}/g);
    if (leftover && leftover.length) {
        console.warn('[engine] unreplaced placeholders in output:', [...new Set(leftover)]);
    }
    return out;
}

module.exports = {
    parseScript,
    validateInputs,
    fillAiSlots,
    fillSlots,
    generateDocument,
    markdownToHtml,
    wrapInBrandedTemplate
};
