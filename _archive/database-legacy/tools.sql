CREATE TABLE IF NOT EXISTS tool_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_name TEXT NOT NULL,
    session_id TEXT NOT NULL,
    email TEXT,
    name TEXT,
    company TEXT,
    phone TEXT,
    industry TEXT,
    inputs JSON NOT NULL,
    results JSON NOT NULL,
    score REAL,
    rating TEXT,
    disclaimer_accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_to_ghl BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tool_assessments_email ON tool_assessments(email);
CREATE INDEX IF NOT EXISTS idx_tool_assessments_tool ON tool_assessments(tool_name);
