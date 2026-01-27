/**
 * Database Connection Module
 * Safety Excellence Group
 *
 * SQLite database connection and initialization
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const DB_PATH = process.env.DATABASE_URL || path.join(__dirname, 'seg.db');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log(`Connected to SQLite database at ${DB_PATH}`);
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create Stage 2 tables
db.run(`CREATE TABLE IF NOT EXISTS stage2_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    token_expires DATETIME NOT NULL,
    status TEXT DEFAULT 'pending',
    responses JSON,
    score INTEGER,
    rating TEXT,
    triggered_by_client_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id)
)`);

db.run(`CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    status TEXT DEFAULT 'detected',
    match_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
)`);

// V3 Tools Tables
db.run(`CREATE TABLE IF NOT EXISTS tool_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    stky_score INTEGER,
    stky_completed BOOLEAN DEFAULT FALSE,
    sif_score INTEGER,
    sif_completed BOOLEAN DEFAULT FALSE
)`);

db.run(`CREATE TABLE IF NOT EXISTS tool_assessments_v3 (
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
)`);

db.run(`CREATE INDEX IF NOT EXISTS idx_sessions ON tool_sessions(session_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_assessments_session ON tool_assessments_v3(session_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_assessments_tool ON tool_assessments_v3(tool)`);

// Phase 3: Users & Subscriptions
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    company TEXT,
    tier TEXT DEFAULT 'free' CHECK(tier IN ('free', 'pro', 'premium')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    trial_started_at TIMESTAMP,
    trial_ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

db.run(`CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`);

db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token)`);

/**
 * Initialize database with schema
 */
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const schemaPath = path.join(__dirname, 'schema.sql');

        fs.readFile(schemaPath, 'utf8', (err, schema) => {
            if (err) {
                console.error('Error reading schema file:', err.message);
                reject(err);
                return;
            }

            db.exec(schema, (err) => {
                if (err) {
                    console.error('Error initializing database:', err.message);
                    reject(err);
                    return;
                }
                console.log('Database schema initialized successfully');
                resolve();
            });
        });
    });
}

/**
 * Run a query that doesn't return data (INSERT, UPDATE, DELETE)
 */
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
                return;
            }
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

/**
 * Get a single row
 */
function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
}

/**
 * Get all rows
 */
function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
}

/**
 * Close database connection
 */
function close() {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) {
                reject(err);
                return;
            }
            console.log('Database connection closed');
            resolve();
        });
    });
}

// ========================================
// CLIENT OPERATIONS
// ========================================

async function insertClient(client) {
    const sql = `
        INSERT INTO clients (
            full_name, phone, email, company_name, project_role,
            industry, project_phase, location, support_type,
            engagement_size, decision_role, timeline,
            lead_score, lead_classification, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        client.full_name,
        client.phone,
        client.email,
        client.company_name,
        client.project_role,
        client.industry,
        client.project_phase,
        client.location,
        client.support_type,
        client.engagement_size,
        client.decision_role,
        client.timeline,
        client.lead_score,
        client.lead_classification,
        client.notes
    ];
    return run(sql, params);
}

async function getClientById(id) {
    return get('SELECT * FROM clients WHERE id = ?', [id]);
}

async function getClientsByClassification(classification) {
    return all('SELECT * FROM clients WHERE lead_classification = ? ORDER BY created_at DESC', [classification]);
}

async function getAllClients() {
    return all('SELECT * FROM clients ORDER BY created_at DESC');
}

async function updateClientGHL(id, ghlContactId) {
    return run('UPDATE clients SET sent_to_ghl = TRUE, ghl_contact_id = ? WHERE id = ?', [ghlContactId, id]);
}

async function updateClientStatus(id, status, notes = null) {
    const sql = notes
        ? 'UPDATE clients SET status = ?, notes = ? WHERE id = ?'
        : 'UPDATE clients SET status = ? WHERE id = ?';
    const params = notes ? [status, notes, id] : [status, id];
    return run(sql, params);
}

// ========================================
// CANDIDATE OPERATIONS
// ========================================

async function insertCandidate(candidate) {
    const sql = `
        INSERT INTO candidates (
            full_name, phone, email, location, certifications,
            years_experience, role_level, industry_experience,
            availability, work_type_preference, shift_availability,
            travel_preference, q1_answer, q2_answer, q3_answer,
            behavioral_score, total_score, fit_rating, red_flags, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        candidate.full_name,
        candidate.phone,
        candidate.email,
        candidate.location,
        JSON.stringify(candidate.certifications),
        candidate.years_experience,
        candidate.role_level,
        JSON.stringify(candidate.industry_experience),
        candidate.availability,
        candidate.work_type_preference,
        candidate.shift_availability,
        candidate.travel_preference,
        candidate.q1_answer,
        candidate.q2_answer,
        candidate.q3_answer,
        candidate.behavioral_score,
        candidate.total_score,
        candidate.fit_rating,
        JSON.stringify(candidate.red_flags),
        candidate.notes
    ];
    return run(sql, params);
}

async function getCandidateById(id) {
    return get('SELECT * FROM candidates WHERE id = ?', [id]);
}

async function getCandidatesByRating(rating) {
    return all('SELECT * FROM candidates WHERE fit_rating = ? ORDER BY total_score DESC', [rating]);
}

async function getAllCandidates() {
    return all('SELECT * FROM candidates ORDER BY created_at DESC');
}

async function updateCandidateStatus(id, status, notes = null) {
    const sql = notes
        ? 'UPDATE candidates SET status = ?, notes = ? WHERE id = ?'
        : 'UPDATE candidates SET status = ? WHERE id = ?';
    const params = notes ? [status, notes, id] : [status, id];
    return run(sql, params);
}

// ========================================
// ASSESSMENT OPERATIONS
// ========================================

async function insertAssessment(assessment) {
    const sql = `
        INSERT INTO assessments (
            email, name, company, industry, project_phase,
            team_size, answers, score, risk_level, gaps, recommendations
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        assessment.email,
        assessment.name,
        assessment.company,
        assessment.industry,
        assessment.project_phase,
        assessment.team_size,
        JSON.stringify(assessment.answers),
        assessment.score,
        assessment.risk_level,
        JSON.stringify(assessment.gaps),
        JSON.stringify(assessment.recommendations)
    ];
    return run(sql, params);
}

async function getAssessmentById(id) {
    return get('SELECT * FROM assessments WHERE id = ?', [id]);
}

async function getAssessmentsByRiskLevel(riskLevel) {
    return all('SELECT * FROM assessments WHERE risk_level = ? ORDER BY created_at DESC', [riskLevel]);
}

async function getAllAssessments() {
    return all('SELECT * FROM assessments ORDER BY created_at DESC');
}

// ========================================
// NEWSLETTER OPERATIONS
// ========================================

async function insertSubscriber(subscriber) {
    const sql = `
        INSERT INTO newsletter_subscribers (name, company, email)
        VALUES (?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
            name = excluded.name,
            company = excluded.company,
            status = 'active'
    `;
    return run(sql, [subscriber.name, subscriber.company, subscriber.email]);
}

async function getSubscriberByEmail(email) {
    return get('SELECT * FROM newsletter_subscribers WHERE email = ?', [email]);
}

async function getAllActiveSubscribers() {
    return all("SELECT * FROM newsletter_subscribers WHERE status = 'active' ORDER BY created_at DESC");
}

async function unsubscribe(email) {
    return run("UPDATE newsletter_subscribers SET status = 'unsubscribed' WHERE email = ?", [email]);
}

// ========================================
// CHATBOT CONVERSATION OPERATIONS
// ========================================

async function insertConversation(conversation) {
    const sql = `
        INSERT INTO chatbot_conversations (
            session_id, visitor_name, visitor_email,
            visitor_phone, visitor_company, messages
        ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
        conversation.session_id,
        conversation.visitor_name,
        conversation.visitor_email,
        conversation.visitor_phone,
        conversation.visitor_company,
        JSON.stringify(conversation.messages || [])
    ];
    return run(sql, params);
}

async function updateConversation(sessionId, updates) {
    const sql = `
        UPDATE chatbot_conversations SET
            updated_at = CURRENT_TIMESTAMP,
            visitor_name = COALESCE(?, visitor_name),
            visitor_email = COALESCE(?, visitor_email),
            visitor_phone = COALESCE(?, visitor_phone),
            visitor_company = COALESCE(?, visitor_company),
            messages = ?,
            lead_captured = COALESCE(?, lead_captured),
            booking_made = COALESCE(?, booking_made)
        WHERE session_id = ?
    `;
    const params = [
        updates.visitor_name,
        updates.visitor_email,
        updates.visitor_phone,
        updates.visitor_company,
        JSON.stringify(updates.messages),
        updates.lead_captured,
        updates.booking_made,
        sessionId
    ];
    return run(sql, params);
}

async function getConversationBySessionId(sessionId) {
    return get('SELECT * FROM chatbot_conversations WHERE session_id = ?', [sessionId]);
}

async function getRecentConversations(limit = 50) {
    return all('SELECT * FROM chatbot_conversations ORDER BY created_at DESC LIMIT ?', [limit]);
}

// ========================================
// STAGE 2 ASSESSMENT OPERATIONS
// ========================================

// Generate unique token
function generateToken() {
    return require('crypto').randomBytes(32).toString('hex');
}

// Create Stage 2 invitation
function createStage2Invite(candidateId, clientId) {
    return new Promise((resolve, reject) => {
        const token = generateToken();
        const expires = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 hours

        db.run(`INSERT INTO stage2_results (candidate_id, token, token_expires, triggered_by_client_id, status)
                VALUES (?, ?, ?, ?, 'pending')`,
            [candidateId, token, expires, clientId],
            function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, token, expires });
            });
    });
}

// Get Stage 2 by token
function getStage2ByToken(token) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT s.*, c.full_name, c.email, c.phone
                FROM stage2_results s
                JOIN candidates c ON s.candidate_id = c.id
                WHERE s.token = ?`, [token], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

// Save Stage 2 responses
function saveStage2Results(token, responses, score, rating) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE stage2_results
                SET responses = ?, score = ?, rating = ?, status = 'completed', completed_at = CURRENT_TIMESTAMP
                WHERE token = ?`,
            [JSON.stringify(responses), score, rating, token],
            function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
    });
}

// Check if candidate has valid Stage 2 (within 90 days)
function getValidStage2(candidateId) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM stage2_results
                WHERE candidate_id = ?
                AND status = 'completed'
                AND completed_at > datetime('now', '-90 days')
                ORDER BY completed_at DESC LIMIT 1`,
            [candidateId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
    });
}

// Check if candidate has pending Stage 2 invite (prevent spam)
function hasPendingStage2(candidateId) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM stage2_results
                WHERE candidate_id = ?
                AND status = 'pending'
                AND token_expires > datetime('now')`,
            [candidateId], (err, row) => {
                if (err) reject(err);
                else resolve(!!row);
            });
    });
}

// Log opportunity
function createOpportunity(clientId, matchCount) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO opportunities (client_id, match_count) VALUES (?, ?)`,
            [clientId, matchCount],
            function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
    });
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
    db,
    initializeDatabase,
    run,
    get,
    all,
    close,

    // Client operations
    insertClient,
    getClientById,
    getClientsByClassification,
    getAllClients,
    getClients: getAllClients,  // Alias for admin routes
    updateClientGHL,
    updateClientStatus,

    // Candidate operations
    insertCandidate,
    getCandidateById,
    getCandidatesByRating,
    getAllCandidates,
    getCandidates: getAllCandidates,  // Alias for admin routes
    updateCandidateStatus,

    // Assessment operations
    insertAssessment,
    getAssessmentById,
    getAssessmentsByRiskLevel,
    getAllAssessments,

    // Newsletter operations
    insertSubscriber,
    getSubscriberByEmail,
    getAllActiveSubscribers,
    unsubscribe,

    // Chatbot operations
    insertConversation,
    updateConversation,
    getConversationBySessionId,
    getRecentConversations,

    // Stage 2 operations
    generateToken,
    createStage2Invite,
    getStage2ByToken,
    saveStage2Results,
    getValidStage2,
    hasPendingStage2,
    createOpportunity
};
