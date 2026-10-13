-- =========================================================
-- Document Generation System
-- Tables: document_scripts, documents_generated
-- Used by: server/documents/engine.js
-- =========================================================

-- Registry of available scripts (one row per name+version combo)
CREATE TABLE IF NOT EXISTS document_scripts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,           -- 'proposal', 'offer-letter', etc.
    version         TEXT    NOT NULL,           -- '1.0.0' (semver)
    file_path       TEXT    NOT NULL,           -- '/scripts/proposal.md'
    content_sha256  TEXT    NOT NULL,           -- hash of the .md file for tamper detection
    approved_by     TEXT,                       -- null = draft, value = production-ready
    approved_at     DATETIME,
    is_active       INTEGER NOT NULL DEFAULT 0, -- 1 = currently active version for this name
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, version)
);

CREATE INDEX IF NOT EXISTS idx_scripts_name_active
    ON document_scripts(name, is_active);

-- Every generated document — immutable audit trail
CREATE TABLE IF NOT EXISTS documents_generated (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    script_name     TEXT    NOT NULL,           -- 'proposal'
    script_version  TEXT    NOT NULL,           -- '1.0.0' (frozen at generation time)
    inputs_json     TEXT    NOT NULL,           -- raw form inputs (JSON)
    ai_outputs_json TEXT,                       -- AI-generated slot values (JSON)
    output_format   TEXT    NOT NULL,           -- 'pdf' | 'html' | 'docx'
    output_path     TEXT,                       -- where the rendered file lives
    output_sha256   TEXT,                       -- hash of the rendered output (defense)
    generated_by    TEXT,                       -- user/admin id
    generated_for   TEXT,                       -- client name (denormalized for search)
    status          TEXT    NOT NULL DEFAULT 'draft', -- 'draft' | 'sent' | 'signed' | 'archived'
    error_message   TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_docs_script_name ON documents_generated(script_name);
CREATE INDEX IF NOT EXISTS idx_docs_status      ON documents_generated(status);
CREATE INDEX IF NOT EXISTS idx_docs_created     ON documents_generated(created_at);
CREATE INDEX IF NOT EXISTS idx_docs_for         ON documents_generated(generated_for);
