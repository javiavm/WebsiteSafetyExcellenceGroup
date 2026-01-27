-- Safety Excellence Group Database Schema
-- SQLite Database
-- Last Updated: January 2025

-- ========================================
-- CLIENTS TABLE
-- Stores client lead submissions from "Request Safety Support" form
-- ========================================
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    company_name TEXT,
    project_role TEXT,
    industry TEXT,
    project_phase TEXT,
    location TEXT,
    support_type TEXT,
    engagement_size TEXT,
    decision_role TEXT,
    timeline TEXT,
    lead_score INTEGER,
    lead_classification TEXT,
    sent_to_ghl BOOLEAN DEFAULT FALSE,
    ghl_contact_id TEXT,
    notes TEXT
);

-- ========================================
-- CANDIDATES TABLE
-- Stores job applicant submissions from "Join the SEG Network" form
-- ========================================
CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    location TEXT,
    certifications TEXT,
    years_experience TEXT,
    role_level TEXT,
    industry_experience TEXT,
    availability TEXT,
    work_type_preference TEXT,
    shift_availability TEXT,
    travel_preference TEXT,
    q1_answer INTEGER,
    q2_answer INTEGER,
    q3_answer INTEGER,
    behavioral_score INTEGER,
    total_score INTEGER,
    fit_rating TEXT,
    red_flags TEXT,
    sent_to_ghl BOOLEAN DEFAULT FALSE,
    ghl_contact_id TEXT,
    notes TEXT,
    status TEXT DEFAULT 'new'
);

-- ========================================
-- ASSESSMENTS TABLE
-- Stores Blind Spot Finder assessment results
-- ========================================
CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email TEXT,
    name TEXT,
    company TEXT,
    industry TEXT,
    project_phase TEXT,
    team_size TEXT,
    answers JSON,
    score INTEGER,
    risk_level TEXT,
    gaps JSON,
    recommendations JSON,
    sent_to_ghl BOOLEAN DEFAULT FALSE
);

-- ========================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- Stores "Advanced Industries Safety Brief" signups
-- ========================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name TEXT,
    company TEXT,
    email TEXT NOT NULL UNIQUE,
    sent_to_ghl BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active'
);

-- ========================================
-- CHATBOT CONVERSATIONS TABLE
-- Stores AEGIS AI chatbot conversations
-- ========================================
CREATE TABLE IF NOT EXISTS chatbot_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    visitor_name TEXT,
    visitor_email TEXT,
    visitor_phone TEXT,
    visitor_company TEXT,
    messages JSON,
    lead_captured BOOLEAN DEFAULT FALSE,
    booking_made BOOLEAN DEFAULT FALSE
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_lead_score ON clients(lead_score);
CREATE INDEX IF NOT EXISTS idx_clients_classification ON clients(lead_classification);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_total_score ON candidates(total_score);
CREATE INDEX IF NOT EXISTS idx_candidates_fit_rating ON candidates(fit_rating);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at);

CREATE INDEX IF NOT EXISTS idx_assessments_email ON assessments(email);
CREATE INDEX IF NOT EXISTS idx_assessments_risk_level ON assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);

CREATE INDEX IF NOT EXISTS idx_chatbot_session ON chatbot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_created_at ON chatbot_conversations(created_at);
