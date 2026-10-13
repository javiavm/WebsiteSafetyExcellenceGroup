/**
 * Documents API
 * Safety Excellence Group
 *
 * Endpoints:
 *   POST /api/documents/generate
 *   GET  /api/documents/scripts          - list available scripts
 *   GET  /api/documents/scripts/:name    - inspect a script's schema (for UI rendering)
 */

const express = require('express');
const fs   = require('fs');
const path = require('path');
const router = express.Router();

const engine = require('../documents/engine');
const db     = require('../../database/db');

const SCRIPTS_DIR = path.join(__dirname, '..', '..', 'scripts');

/* ─────────────────────────────────────────────────────────
   List all scripts in /scripts (skip README and underscore-prefixed)
   ───────────────────────────────────────────────────────── */
router.get('/scripts', (req, res) => {
    try {
        const files = fs.readdirSync(SCRIPTS_DIR)
            .filter(f => f.endsWith('.md') && f !== 'README.md');
        const out = [];
        for (const f of files) {
            const name = f.replace(/\.md$/, '');
            try {
                const script = engine.parseScript(name);
                out.push({
                    name,
                    version: script.frontmatter.version,
                    title: script.frontmatter.title,
                    output_format: script.frontmatter.output_format,
                    approved: !!(script.frontmatter.approval && script.frontmatter.approval.approved_by),
                    draft: name.startsWith('_')
                });
            } catch (e) {
                out.push({ name, error: e.message });
            }
        }
        res.json({ scripts: out });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ─────────────────────────────────────────────────────────
   Inspect a single script's input schema (for the UI form)
   ───────────────────────────────────────────────────────── */
router.get('/scripts/:name', (req, res) => {
    try {
        const script = engine.parseScript(req.params.name);
        res.json({
            name: req.params.name,
            version: script.frontmatter.version,
            title: script.frontmatter.title,
            output_format: script.frontmatter.output_format,
            inputs: script.frontmatter.inputs || [],
            ai_slots: (script.frontmatter.ai_slots || []).map(s => ({
                name: s.name, max_words: s.max_words, tone: s.tone
            })),
            approved: !!(script.frontmatter.approval && script.frontmatter.approval.approved_by)
        });
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

/* ─────────────────────────────────────────────────────────
   Generate a document
   Body: { script: "proposal", inputs: { client_name: "...", ... } }
   ───────────────────────────────────────────────────────── */
router.post('/generate', async (req, res) => {
    const { script: scriptName, inputs, generatedBy } = req.body || {};
    if (!scriptName) return res.status(400).json({ error: 'script is required' });
    if (!inputs || typeof inputs !== 'object') {
        return res.status(400).json({ error: 'inputs object is required' });
    }

    try {
        const result = await engine.generateDocument({
            scriptName,
            inputs,
            generatedBy: generatedBy || (req.headers['x-admin-key'] ? 'admin' : 'anonymous')
        });

        // Persist audit trail
        let docId = null;
        try {
            const row = await db.insertGeneratedDocument({
                script_name:     result.scriptName,
                script_version:  result.scriptVersion,
                inputs:          inputs,
                ai_outputs:      result.aiOutputs,
                output_format:   result.outputFormat,
                output_body:     result.body,
                output_sha256:   result.meta.outputSha,
                template_sha256: result.meta.contentSha,
                generated_by:    result.meta.generatedBy,
                generated_for:   inputs.client_company || inputs.client_name || null,
                status:          'draft'
            });
            docId = row.lastID;
        } catch (dbErr) {
            console.error('Failed to persist generated document:', dbErr);
        }

        res.json({ ...result, id: docId });
    } catch (err) {
        const code = err.details ? 400 : 500;
        res.status(code).json({
            error: err.message,
            details: err.details || undefined
        });
    }
});

/* Serve the rendered HTML for viewing/printing in the browser */
router.get('/view/:id', async (req, res) => {
    try {
        const row = await db.getGeneratedDocumentById(req.params.id);
        if (!row) return res.status(404).send('Document not found');
        if (row.output_format === 'html-branded' || row.output_format === 'html') {
            res.set('Content-Type', 'text/html; charset=utf-8').send(row.output_body);
        } else {
            res.json(row);
        }
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

/* List recent generated docs (admin dashboard) */
router.get('/generated', async (req, res) => {
    try {
        const rows = await db.listGeneratedDocuments(parseInt(req.query.limit) || 50);
        res.json({ documents: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
