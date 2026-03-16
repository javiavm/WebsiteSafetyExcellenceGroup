/**
 * SEG Backend Server
 * Safety Excellence Group
 *
 * Handles:
 * - AEGIS Chatbot API (Claude)
 * - Form submissions with scoring
 * - Database storage
 * - GHL webhook forwarding
 */

const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

// Database and algorithms
const db = require('../database/db');
const { scoreClientLead } = require('../algorithms/leadScoring');
const { scoreCandiate } = require('../algorithms/candidateScoring');
const { findMatchesForClient, findMatchesForCandidate, getMatchSummary } = require('../algorithms/matchingAlgorithm');

// Stage 2 Assessment
const { scoreStage2Assessment, getStage2Questions } = require('../algorithms/stage2Assessment');

// Admin routes and utilities
const { initAdminRoutes } = require('./routes/admin');
const excelExport = require('./utils/excelExport');

// Opportunity Detection
const opportunityDetector = require('./services/opportunityDetector');

// Tool Routes
const stkyRoutes = require('./routes/stky');
const sifRoutes = require('./routes/sif');
const sifFilterRoutes = require('./routes/sif-filter');
const dashboardRoutes = require('./routes/dashboard');
// const verifierRoutes = require('./routes/verifier'); // Removed - consultant verifier disabled
const metricsRoutes = require('./routes/metrics');
const agentRoutes = require('./routes/agents');

// Auth & Billing Routes (Phase 3)
const { initAuthRoutes } = require('./routes/auth');
const { initBillingRoutes } = require('./routes/billing');

const app = express();
const PORT = process.env.PORT || 3001;

// GHL Webhook URLs
const GHL_WEBHOOKS = {
    client: process.env.GHL_WEBHOOK_CLIENT || 'https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/dd8498d0-c790-48af-a7e7-28de6a3a0def',
    candidate: process.env.GHL_WEBHOOK_CANDIDATE || 'https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/255f5c21-06a3-4b59-a5b3-6b652570a779',
    newsletter: process.env.GHL_WEBHOOK_NEWSLETTER || 'https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/64c3d0b5-a1fa-4574-a15b-137357fba21e'
};

// Middleware
// CORS configuration - restrict origins in production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://safety-excellence.com', 'https://www.safety-excellence.com']
        : true, // Allow all in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-admin-key', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// Request body size limit to prevent DoS
app.use(express.json({ limit: '10kb' }));
app.use(express.static('../public'));

// Tool API Routes
app.use('/api/stky', stkyRoutes);
app.use('/api/sif', sifRoutes);
app.use('/api/sif-filter', sifFilterRoutes);
app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/verifier', verifierRoutes); // Removed - consultant verifier disabled
app.use('/api/metrics', metricsRoutes);
app.use('/api/agents', agentRoutes);
const path = require('path');
app.use('/tools', express.static(path.join(__dirname, '../public/tools')));

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize database on startup
db.initializeDatabase()
    .then(() => console.log('Database initialized'))
    .catch(err => console.error('Database initialization failed:', err));

// AEGIS System Prompt
const AEGIS_SYSTEM_PROMPT = `You are AEGIS, the AI safety assistant for Safety Excellence Group (SEG).

## RESPONSE STYLE - CRITICAL:
- BREVITY IS KEY: 1-2 sentences for simple questions, 3 max
- NO fluff: Skip "Great question!" "Happy to help!" "Certainly!"
- NO repetition: State info once
- Lead with the answer, not context
- One clear CTA per response
- Use bullets ONLY for 3+ items

## BOOKING CALLS - CRITICAL:
- NEVER mention Calendly, booking links, or URLs
- NEVER say "Book your discovery call here" or provide any links
- When user wants to book/schedule, say: "I can help you book a discovery call right now. Just click the '📅 Book a discovery call' button below to get started."
- The booking calendar is built into this chat - don't send them elsewhere

## EXAMPLES OF GOOD VS BAD:
BAD: "Great question! Safety Excellence Group offers a range of services including staffing solutions, assessments and audits, program development, and subcontractor vetting. We've been serving the industry for 18+ years..."
GOOD: "We offer staffing, audits, program development, and subcontractor vetting. What's your biggest safety challenge right now?"

BAD: "[Book your discovery call here](https://calendly.com/...)"
GOOD: "I can help you schedule that now. Click '📅 Book a discovery call' below to pick a time."

## STANDARDS EXPERTISE:
You have knowledge of these safety standards. Always cite the specific standard when relevant.

### OSHA Federal Standards:
- **29 CFR 1910** - General Industry Safety Standards
- **29 CFR 1926** - Construction Safety Standards

### DOE Standards (ASK if project is DOE before citing):
- **10 CFR 851** - DOE Worker Safety and Health Program

### State OSHA (ASK which state when relevant):
- **Cal-OSHA Title 8, Subchapter 4** - California Construction Safety Orders (Sections 1500-1962)

### Industrial Hygiene:
- **ACGIH TLVs** - Threshold Limit Values for Chemical Substances and Physical Agents
  - Note: When ACGIH TLV differs from OSHA PEL, mention both and note which is more protective

### NFPA Standards:
- **NFPA 70** - National Electrical Code (NEC)
- **NFPA 70E** - Standard for Electrical Safety in the Workplace

### ANSI Standards:
- **ANSI Z88.2** - Practices for Respiratory Protection
- **ANSI Z136.1** - Safe Use of Lasers
- **ANSI Z49.1** - Safety in Welding, Cutting, and Allied Processes
- **ANSI/ASSP Z10** - Occupational Health and Safety Management Systems

### ASME Standards:
- **ASME B30** - Safety Standard for Cableways, Cranes, Derricks, Hoists, Hooks, Jacks, and Slings

### Semiconductor Industry:
- **SEMI S2** - Environmental, Health, and Safety Guideline for Semiconductor Manufacturing Equipment
- **SEMI S8** - Safety Guidelines for Ergonomics Engineering of Semiconductor Manufacturing Equipment

## RULES FOR CITING STANDARDS:
1. Always cite the specific standard (e.g., "Per 29 CFR 1926.502...")
2. NEVER give definitive compliance advice - use "The standard requires..." or "Per [standard]..."
3. For state-specific questions, ASK which state first
4. For DOE projects, CONFIRM it's a DOE project before citing 10 CFR 851
5. When ACGIH TLV differs from OSHA PEL, mention both and note which is more protective
6. Recommend consulting with SEG experts for site-specific compliance guidance

## GENERAL RULES:
1. Never give direct advice - use "OSHA requires..." or "Per NFPA 70E..." or "Best practice is..."
2. Never say "you should/must/need to"
3. Pricing questions → "That depends on scope. A quick discovery call will get you a custom quote within 48 hours."
4. Complex compliance questions → Connect to experts via discovery call
5. ALWAYS push toward booking a discovery call using the button in the chat

## SEG QUICK FACTS:
- 18+ years, 50+ fabs, 5 continents
- Services: Staffing, Audits, Program Development, Subcontractor Vetting
- Industries: Semiconductor, Data Center, Construction, Manufacturing
- 48-hour proposals, certified experts (CSP, ASP, CHST)

## BOOKING FLOW:
Discovery Call (15 min) → Custom Proposal (48 hrs) → Kick-off

GOAL: Short answers. Cite standards. Qualify fast. Book calls using the in-chat booking system.`;


// Store conversation history (in production, use Redis or database)
const conversations = new Map();

// ========================================
// CHATBOT ENDPOINTS
// ========================================

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get or create conversation history
        if (!conversations.has(sessionId)) {
            conversations.set(sessionId, []);
        }
        const history = conversations.get(sessionId);

        // Add user message to history
        history.push({
            role: 'user',
            content: message
        });

        // Call Claude API
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: AEGIS_SYSTEM_PROMPT,
            messages: history
        });

        const assistantMessage = response.content[0].text;

        // Add assistant response to history
        history.push({
            role: 'assistant',
            content: assistantMessage
        });

        // Keep only last 20 messages to manage context
        if (history.length > 20) {
            history.splice(0, history.length - 20);
        }

        // Save conversation to database
        try {
            const existingConvo = await db.getConversationBySessionId(sessionId);
            if (existingConvo) {
                await db.updateConversation(sessionId, { messages: history });
            } else {
                await db.insertConversation({ session_id: sessionId, messages: history });
            }
        } catch (dbErr) {
            console.error('Failed to save conversation:', dbErr);
        }

        res.json({
            message: assistantMessage,
            sessionId
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            error: 'Something went wrong. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Legacy lead capture endpoint (for chatbot)
app.post('/api/lead', async (req, res) => {
    try {
        const { name, email, phone, company, industry, service, timeline, conversationHistory, sessionId } = req.body;

        console.log('=== CHATBOT LEAD CAPTURED ===');
        console.log('Name:', name);
        console.log('Email:', email);
        console.log('Phone:', phone);
        console.log('Company:', company);
        console.log('============================');

        // Update conversation with lead info
        if (sessionId) {
            try {
                await db.updateConversation(sessionId, {
                    visitor_name: name,
                    visitor_email: email,
                    visitor_phone: phone,
                    visitor_company: company,
                    lead_captured: true,
                    messages: conversationHistory
                });
            } catch (dbErr) {
                console.error('Failed to update conversation:', dbErr);
            }
        }

        res.json({ success: true, message: 'Lead captured successfully' });

    } catch (error) {
        console.error('Lead capture error:', error);
        res.status(500).json({ error: 'Failed to capture lead' });
    }
});

// ========================================
// FORM SUBMISSION ENDPOINTS
// ========================================

/**
 * Client Form - "Request Safety Support"
 * Scores the lead and saves to database
 */
app.post('/api/forms/client', async (req, res) => {
    try {
        const formData = req.body;

        console.log('=== CLIENT FORM SUBMISSION ===');
        console.log('Name:', formData.full_name);
        console.log('Email:', formData.email || formData.company_email);
        console.log('Company:', formData.company_name);

        // Run lead scoring algorithm
        const scoreResult = scoreClientLead({
            full_name: formData.full_name || formData['full name'] || formData.name,
            email: formData.email || formData.company_email || formData['company email'],
            phone: formData.phone,
            company_name: formData.company_name || formData['company name'] || formData.company,
            project_role: formData.project_role || formData['Your_Role_on_This_Project'],
            industry: formData.industry,
            project_phase: formData.project_phase,
            location: formData.location,
            support_type: formData.support_type || formData.type_of_support_needed,
            engagement_size: formData.engagement_size || formData.estimated_engagement_size,
            decision_role: formData.decision_role || formData.your_role_in_selecting_partners,
            timeline: formData.timeline
        });

        console.log('Lead Score:', scoreResult.score);
        console.log('Classification:', scoreResult.classification);
        console.log('==============================');

        // Save to database
        const dbResult = await db.insertClient({
            full_name: formData.full_name || formData['full name'] || formData.name,
            phone: formData.phone,
            email: formData.email || formData.company_email || formData['company email'],
            company_name: formData.company_name || formData['company name'] || formData.company,
            project_role: formData.project_role || formData['Your_Role_on_This_Project'],
            industry: formData.industry,
            project_phase: formData.project_phase,
            location: formData.location,
            support_type: formData.support_type || formData.type_of_support_needed,
            engagement_size: formData.engagement_size || formData.estimated_engagement_size,
            decision_role: formData.decision_role || formData.your_role_in_selecting_partners,
            timeline: formData.timeline,
            lead_score: scoreResult.score,
            lead_classification: scoreResult.classification,
            notes: JSON.stringify(scoreResult.breakdown)
        });

        // Forward to GHL webhook
        try {
            await forwardToGHL(GHL_WEBHOOKS.client, {
                ...formData,
                form_type: 'request_safety_support',
                lead_score: scoreResult.score,
                lead_classification: scoreResult.classification
            });
        } catch (ghlErr) {
            console.error('GHL webhook failed:', ghlErr.message);
        }

        // Trigger opportunity detection for HOT clients
        const savedClient = {
            id: dbResult.lastID,
            full_name: formData.full_name || formData['full name'] || formData.name,
            company_name: formData.company_name || formData['company name'] || formData.company,
            industry: formData.industry,
            timeline: formData.timeline,
            support_type: formData.support_type || formData.type_of_support_needed,
            lead_classification: scoreResult.classification
        };

        if (formData.timeline === 'immediate' || formData.timeline === '1-2weeks' || scoreResult.classification === 'HOT') {
            // Run opportunity detection asynchronously (don't block response)
            opportunityDetector.detectOpportunities(savedClient, db, require('../algorithms/matchingAlgorithm'))
                .then(result => console.log('Opportunity detection:', result))
                .catch(err => console.error('Opportunity detection error:', err));
        }

        res.json({
            success: true,
            message: 'Form submitted successfully',
            id: dbResult.lastID,
            scoring: {
                score: scoreResult.score,
                classification: scoreResult.classification,
                action: scoreResult.action
            }
        });

    } catch (error) {
        console.error('Client form error:', error);
        res.status(500).json({ error: 'Failed to process form submission' });
    }
});

/**
 * Candidate Form - "Join the SEG Network"
 * Scores the candidate and saves to database
 */
app.post('/api/forms/candidate', async (req, res) => {
    try {
        const formData = req.body;

        console.log('=== CANDIDATE FORM SUBMISSION ===');
        console.log('Name:', formData.full_name);
        console.log('Email:', formData.email);

        // Run candidate scoring algorithm
        const scoreResult = scoreCandiate({
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            location: formData.location,
            certifications: formData.certifications,
            years_experience: formData.years_experience || formData.years_of_experience,
            role_level: formData.role_level || formData.role_level_sought,
            industry_experience: formData.industry_experience,
            availability: formData.availability || formData.when_can_you_start,
            work_type_preference: formData.work_type_preference,
            shift_availability: formData.shift_availability,
            travel_preference: formData.travel_preference || formData['willing_to_travel_Relocate?'],
            q1_answer: parseInt(formData.q1_answer) || null,
            q2_answer: parseInt(formData.q2_answer) || null,
            q3_answer: parseInt(formData.q3_answer) || null
        });

        console.log('Candidate Score:', scoreResult.score);
        console.log('Fit Rating:', scoreResult.fitRating);
        console.log('Behavioral Score:', scoreResult.behavioralScore);
        console.log('Red Flags:', scoreResult.redFlags.length);
        console.log('=================================');

        // Save to database
        const dbResult = await db.insertCandidate({
            full_name: formData.full_name,
            phone: formData.phone,
            email: formData.email,
            location: formData.location,
            certifications: formData.certifications,
            years_experience: formData.years_experience || formData.years_of_experience,
            role_level: formData.role_level || formData.role_level_sought,
            industry_experience: formData.industry_experience,
            availability: formData.availability || formData.when_can_you_start,
            work_type_preference: formData.work_type_preference,
            shift_availability: formData.shift_availability,
            travel_preference: formData.travel_preference || formData['willing_to_travel_Relocate?'],
            q1_answer: parseInt(formData.q1_answer) || null,
            q2_answer: parseInt(formData.q2_answer) || null,
            q3_answer: parseInt(formData.q3_answer) || null,
            behavioral_score: scoreResult.behavioralScore,
            total_score: scoreResult.score,
            fit_rating: scoreResult.fitRating,
            red_flags: scoreResult.redFlags
        });

        // Forward to GHL webhook
        try {
            await forwardToGHL(GHL_WEBHOOKS.candidate, {
                ...formData,
                form_type: 'join_seg_network',
                candidate_score: scoreResult.score,
                fit_rating: scoreResult.fitRating
            });
        } catch (ghlErr) {
            console.error('GHL webhook failed:', ghlErr.message);
        }

        res.json({
            success: true,
            message: 'Application submitted successfully',
            id: dbResult.lastID,
            scoring: {
                score: scoreResult.score,
                fitRating: scoreResult.fitRating,
                behavioralScore: scoreResult.behavioralScore,
                hasRedFlags: scoreResult.hasRedFlags
            }
        });

    } catch (error) {
        console.error('Candidate form error:', error);
        res.status(500).json({ error: 'Failed to process application' });
    }
});

/**
 * Newsletter Form - "Advanced Industries Safety Brief"
 */
app.post('/api/forms/newsletter', async (req, res) => {
    try {
        const { name, company, email } = req.body;

        console.log('=== NEWSLETTER SIGNUP ===');
        console.log('Name:', name);
        console.log('Email:', email);
        console.log('=========================');

        // Save to database
        const dbResult = await db.insertSubscriber({ name, company, email });

        // Forward to GHL webhook
        try {
            await forwardToGHL(GHL_WEBHOOKS.newsletter, {
                name,
                company,
                email,
                form_type: 'newsletter'
            });
        } catch (ghlErr) {
            console.error('GHL webhook failed:', ghlErr.message);
        }

        res.json({
            success: true,
            message: 'Successfully subscribed to newsletter',
            id: dbResult.lastID
        });

    } catch (error) {
        console.error('Newsletter form error:', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});

/**
 * Assessment Form - "Blind Spot Finder"
 */
app.post('/api/forms/assessment', async (req, res) => {
    try {
        const { email, name, company, industry, project_phase, team_size, answers, score, risk_level, gaps, recommendations } = req.body;

        console.log('=== ASSESSMENT SUBMISSION ===');
        console.log('Name:', name);
        console.log('Company:', company);
        console.log('Score:', score);
        console.log('Risk Level:', risk_level);
        console.log('=============================');

        // Save to database
        const dbResult = await db.insertAssessment({
            email,
            name,
            company,
            industry,
            project_phase,
            team_size,
            answers,
            score,
            risk_level,
            gaps,
            recommendations
        });

        res.json({
            success: true,
            message: 'Assessment saved successfully',
            id: dbResult.lastID
        });

    } catch (error) {
        console.error('Assessment form error:', error);
        res.status(500).json({ error: 'Failed to save assessment' });
    }
});

// ========================================
// DATA RETRIEVAL ENDPOINTS
// ========================================

// Get all clients (for internal dashboard)
app.get('/api/clients', async (req, res) => {
    try {
        const clients = await db.getAllClients();
        res.json({ success: true, data: clients });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

// Get clients by classification
app.get('/api/clients/classification/:classification', async (req, res) => {
    try {
        const clients = await db.getClientsByClassification(req.params.classification.toUpperCase());
        res.json({ success: true, data: clients });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

// Get all candidates
app.get('/api/candidates', async (req, res) => {
    try {
        const candidates = await db.getAllCandidates();
        res.json({ success: true, data: candidates });
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({ error: 'Failed to fetch candidates' });
    }
});

// Get candidates by fit rating
app.get('/api/candidates/rating/:rating', async (req, res) => {
    try {
        const candidates = await db.getCandidatesByRating(req.params.rating.toUpperCase());
        res.json({ success: true, data: candidates });
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({ error: 'Failed to fetch candidates' });
    }
});

// Match candidates to a client
app.get('/api/clients/:id/matches', async (req, res) => {
    try {
        const client = await db.getClientById(req.params.id);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        const candidates = await db.getAllCandidates();
        const matches = findMatchesForClient(client, candidates);

        console.log(`=== MATCHING: Client #${req.params.id} ===`);
        console.log(getMatchSummary(matches));

        res.json({
            success: true,
            client: { id: client.id, company: client.company_name, industry: client.industry },
            matchCount: matches.length,
            matches: matches.slice(0, 20) // Top 20
        });
    } catch (error) {
        console.error('Error matching candidates:', error);
        res.status(500).json({ error: 'Failed to match candidates' });
    }
});

// Match clients to a candidate (reverse matching)
app.get('/api/candidates/:id/matches', async (req, res) => {
    try {
        const candidate = await db.getCandidateById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const clients = await db.getAllClients();
        const matches = findMatchesForCandidate(candidate, clients);

        console.log(`=== REVERSE MATCHING: Candidate #${req.params.id} ===`);
        console.log(`Found ${matches.length} potential client matches`);

        res.json({
            success: true,
            candidate: { id: candidate.id, name: candidate.full_name, fitRating: candidate.fit_rating },
            matchCount: matches.length,
            matches: matches.slice(0, 20) // Top 20
        });
    } catch (error) {
        console.error('Error matching clients:', error);
        res.status(500).json({ error: 'Failed to match clients' });
    }
});

// Get all assessments
app.get('/api/assessments', async (req, res) => {
    try {
        const assessments = await db.getAllAssessments();
        res.json({ success: true, data: assessments });
    } catch (error) {
        console.error('Error fetching assessments:', error);
        res.status(500).json({ error: 'Failed to fetch assessments' });
    }
});

// Get all newsletter subscribers
app.get('/api/subscribers', async (req, res) => {
    try {
        const subscribers = await db.getAllActiveSubscribers();
        res.json({ success: true, data: subscribers });
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        res.status(500).json({ error: 'Failed to fetch subscribers' });
    }
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Forward form data to GHL webhook with timeout
 * @param {string} webhookUrl - Webhook URL
 * @param {object} data - Data to send
 * @param {number} timeoutMs - Timeout in milliseconds (default 10s)
 */
async function forwardToGHL(webhookUrl, data, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`GHL webhook returned ${response.status}`);
        }

        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('GHL webhook timed out');
        }
        throw error;
    }
}

// ============================================
// AUTH & BILLING ROUTES (Phase 3)
// ============================================
const authRouter = initAuthRoutes({ db });
const billingRouter = initBillingRoutes({ db });
app.use('/api/auth', authRouter);
app.use('/api/billing', billingRouter);

// ============================================
// ADMIN ROUTES (Protected)
// ============================================
const adminRouter = initAdminRoutes({
    db: db,
    excelExport: excelExport,
    matchingAlgorithm: require('../algorithms/matchingAlgorithm')
});
app.use('/api/admin', adminRouter);

// ============================================
// STAGE 2 ASSESSMENT
// ============================================
app.get('/api/stage2/questions', (req, res) => {
    try {
        res.json({ success: true, questions: getStage2Questions() });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get questions' });
    }
});

app.post('/api/stage2/assess', (req, res) => {
    try {
        const { candidateId, responses } = req.body;
        if (!responses || Object.keys(responses).length < 8) {
            return res.status(400).json({ error: 'All 8 questions required' });
        }
        const results = scoreStage2Assessment(responses);
        console.log(`Stage 2: Candidate ${candidateId} = ${results.rating} (${results.totalScore})`);
        res.json({ success: true, candidateId, results });
    } catch (error) {
        res.status(500).json({ error: 'Assessment failed' });
    }
});

// ============================================
// STAGE 2 PUBLIC ENDPOINTS (No Auth Required)
// ============================================

// Validate Stage 2 token
app.get('/api/stage2/validate', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.json({ valid: false, error: 'No token provided' });
        }

        const stage2 = await db.getStage2ByToken(token);

        if (!stage2) {
            return res.json({ valid: false, error: 'Invalid token' });
        }

        if (new Date(stage2.token_expires) < new Date()) {
            return res.json({ valid: false, error: 'Token expired' });
        }

        if (stage2.status === 'completed') {
            return res.json({ valid: false, error: 'Already completed' });
        }

        res.json({
            valid: true,
            candidate: {
                name: stage2.full_name,
                email: stage2.email
            }
        });
    } catch (error) {
        console.error('Stage 2 validate error:', error);
        res.status(500).json({ valid: false, error: 'Server error' });
    }
});

// Submit Stage 2 assessment
app.post('/api/stage2/submit', async (req, res) => {
    try {
        const { token, responses } = req.body;

        if (!token || !responses) {
            return res.status(400).json({ success: false, error: 'Missing token or responses' });
        }

        // Validate token
        const stage2 = await db.getStage2ByToken(token);
        if (!stage2 || new Date(stage2.token_expires) < new Date()) {
            return res.status(400).json({ success: false, error: 'Invalid or expired token' });
        }

        // Score the assessment
        const results = scoreStage2Assessment(responses);

        // Save results
        await db.saveStage2Results(token, responses, results.totalScore, results.rating);

        // Process completion (send alerts if A-Player)
        await opportunityDetector.processStage2Completion(token, results.totalScore, results.rating, db);

        console.log(`Stage 2 completed: ${stage2.full_name} = ${results.rating} (${results.totalScore})`);

        res.json({ success: true, rating: results.rating });
    } catch (error) {
        console.error('Stage 2 submit error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ========================================
// HEALTH & STATUS
// ========================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'SEG Backend API',
        features: ['chatbot', 'forms', 'scoring', 'database'],
        timestamp: new Date().toISOString()
    });
});

// API info
app.get('/api', (req, res) => {
    res.json({
        name: 'Safety Excellence Group API',
        version: '1.0.0',
        endpoints: {
            chat: 'POST /api/chat',
            lead: 'POST /api/lead',
            forms: {
                client: 'POST /api/forms/client',
                candidate: 'POST /api/forms/candidate',
                newsletter: 'POST /api/forms/newsletter',
                assessment: 'POST /api/forms/assessment'
            },
            data: {
                clients: 'GET /api/clients',
                candidates: 'GET /api/candidates',
                assessments: 'GET /api/assessments',
                subscribers: 'GET /api/subscribers'
            },
            health: 'GET /api/health'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║     SEG Backend Server                     ║
║     Port: ${PORT}                              ║
╠════════════════════════════════════════════╣
║  Endpoints:                                ║
║  • POST /api/chat          - AEGIS Chat    ║
║  • POST /api/forms/client  - Client Form   ║
║  • POST /api/forms/candidate - Candidate   ║
║  • POST /api/forms/newsletter - Newsletter ║
║  • POST /api/forms/assessment - Assessment ║
║  • GET  /api/health        - Health Check  ║
╚════════════════════════════════════════════╝
    `);
});
