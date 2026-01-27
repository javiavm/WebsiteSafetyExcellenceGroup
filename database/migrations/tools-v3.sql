-- Tools V3 Migration
-- STKY + SIF Assessment Tables

CREATE TABLE IF NOT EXISTS tool_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    stky_score INTEGER,
    stky_completed BOOLEAN DEFAULT FALSE,
    sif_score INTEGER,
    sif_completed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tool_assessments_v3 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    tool TEXT NOT NULL,
    path TEXT NOT NULL,
    context JSON,
    responses JSON,
    scores JSON,
    gaps JSON,
    recommendations JSON,
    email TEXT,
    name TEXT,
    company TEXT,
    industry TEXT,
    disclaimer_accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_to_ghl BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (session_id) REFERENCES tool_sessions(session_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions ON tool_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_assessments_session ON tool_assessments_v3(session_id);
CREATE INDEX IF NOT EXISTS idx_assessments_tool ON tool_assessments_v3(tool);
