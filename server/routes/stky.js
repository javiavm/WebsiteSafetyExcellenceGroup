/**
 * STKY Assessment Routes - V3
 * Path-based entry, context questions, hazard assessment
 */

const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const stkyEngine = require('../lib/stkyEngine');
const citationEngine = require('../lib/citationEngine');
const benchmarkEngine = require('../lib/benchmarkEngine');
const recommendationsEngine = require('../lib/recommendationsEngine');

const WEBHOOK = process.env.GHL_WEBHOOK_STKY || 'https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/4781670c-aa84-46f0-8dfc-f9d4f11d4a4c';

/**
 * Check if user is Pro/Premium tier
 * @param {object} req - Express request
 * @returns {object|null} User object if Pro+, null otherwise
 */
async function checkProUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;

  try {
    const user = await db.get(
      `SELECT u.* FROM users u
       JOIN user_sessions s ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`,
      [token]
    );
    if (user && (user.tier === 'pro' || user.tier === 'premium')) {
      return user;
    }
  } catch (e) {
    // Ignore auth errors, just treat as free user
  }
  return null;
}

/**
 * GET /api/stky/config
 * Returns paths, context questions, hazard metadata
 */
router.get('/config', (req, res) => {
  try {
    const config = stkyEngine.getConfig();
    res.json({ success: true, ...config });
  } catch (e) {
    console.error('[STKY Config]', e.message);
    res.status(500).json({ error: 'Failed to load config' });
  }
});

/**
 * GET /api/stky/paths
 * Returns available entry paths
 */
router.get('/paths', (req, res) => {
  res.json({
    success: true,
    paths: Object.values(stkyEngine.config.paths)
  });
});

/**
 * GET /api/stky/context
 * Returns context questions
 */
router.get('/context', (req, res) => {
  res.json({
    success: true,
    questions: stkyEngine.config.context
  });
});

/**
 * GET /api/stky/hazards/:pathId/:industry
 * Returns hazards to assess based on path and industry
 */
router.get('/hazards/:pathId/:industry', (req, res) => {
  try {
    const { pathId, industry } = req.params;
    const hazardIds = stkyEngine.getHazardsForPath(pathId, industry);

    const hazards = hazardIds.map(id => {
      const h = stkyEngine.config.hazards[id];
      return h ? {
        id: h.id,
        name: h.name,
        questionCount: h.questions.length,
        questions: h.questions
      } : null;
    }).filter(Boolean);

    res.json({ success: true, hazards });
  } catch (e) {
    console.error('[STKY Hazards]', e.message);
    res.status(500).json({ error: 'Failed to load hazards' });
  }
});

/**
 * GET /api/stky/hazard/:hazardId/questions
 * Returns questions for a specific hazard
 */
router.get('/hazard/:hazardId/questions', (req, res) => {
  try {
    const questions = stkyEngine.getHazardQuestions(req.params.hazardId);
    res.json({ success: true, questions });
  } catch (e) {
    console.error('[STKY Questions]', e.message);
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

/**
 * POST /api/stky/session
 * Creates or updates a session
 */
router.post('/session', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId required' });
    }

    // Check if session exists
    const existing = await db.get(
      'SELECT * FROM tool_sessions WHERE session_id = ?',
      [sessionId]
    );

    if (!existing) {
      // Create new session
      await db.run(
        `INSERT INTO tool_sessions(session_id, created_at) VALUES(?, datetime('now'))`,
        [sessionId]
      );
    }

    res.json({ success: true, sessionId });
  } catch (e) {
    console.error('[STKY Session]', e.message);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

/**
 * GET /api/stky/session/:sessionId
 * Returns session data including STKY scores if completed
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const session = await db.get(
      'SELECT * FROM tool_sessions WHERE session_id = ?',
      [req.params.sessionId]
    );

    if (!session) {
      return res.json({ success: true, data: null });
    }

    // Get STKY assessment if exists
    let assessment = null;
    if (session.stky_completed) {
      assessment = await db.get(
        `SELECT * FROM tool_assessments_v3 WHERE session_id = ? AND tool = 'stky' ORDER BY created_at DESC LIMIT 1`,
        [req.params.sessionId]
      );
      if (assessment) {
        assessment.scores = JSON.parse(assessment.scores || '{}');
        assessment.gaps = JSON.parse(assessment.gaps || '[]');
        assessment.recommendations = JSON.parse(assessment.recommendations || '[]');
      }
    }

    res.json({
      success: true,
      data: {
        ...session,
        assessment,
        scores: assessment?.scores || null
      }
    });
  } catch (e) {
    console.error('[STKY Get Session]', e.message);
    res.status(500).json({ error: 'Failed to load session' });
  }
});

/**
 * POST /api/stky/assess
 * Submit assessment and get scored results
 */
router.post('/assess', async (req, res) => {
  try {
    const { sessionId, path, context, responses, email, name, company } = req.body;

    if (!sessionId || !path || !context || !responses) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Score the assessment
    const results = stkyEngine.scoreSTKY(responses, context);

    // Save to database
    await db.run(
      `INSERT INTO tool_assessments_v3(
        session_id, tool, path, context, responses, scores, gaps, recommendations,
        email, name, company, industry, disclaimer_accepted_at, created_at
      ) VALUES(?, 'stky', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        sessionId,
        path,
        JSON.stringify(context),
        JSON.stringify(responses),
        JSON.stringify(results),
        JSON.stringify(results.gaps),
        JSON.stringify(results.recommendations),
        email || null,
        name || null,
        company || null,
        context.industry || null
      ]
    );

    // Update session
    await db.run(
      `UPDATE tool_sessions SET stky_score = ?, stky_completed = 1, updated_at = datetime('now') WHERE session_id = ?`,
      [results.overall.score, sessionId]
    );

    // Send to webhook if email provided
    if (email) {
      sendToWebhook({
        sessionId,
        email,
        name,
        company,
        industry: context.industry,
        path,
        results
      });
    }

    // Add citations for each hazard with low scores
    const citations = [];
    if (results.hazards) {
      for (const [hazardId, hazardScore] of Object.entries(results.hazards)) {
        if (hazardScore.score < 70) {
          const citationBlock = citationEngine.generateCitationBlock(hazardId, hazardScore.score);
          if (citationBlock) citations.push(citationBlock);
        }
      }
    }

    // Check if user is Pro for enhanced features
    const proUser = await checkProUser(req);
    const isPro = !!proUser;

    // Build hazard scores map for benchmarking
    const hazardScores = {};
    if (results.hazards) {
      for (const [hazardId, hazardData] of Object.entries(results.hazards)) {
        hazardScores[hazardId] = hazardData.score;
      }
    }

    // Pro features: benchmarking and enhanced recommendations
    let benchmark = null;
    let enhancedRecommendations = null;

    if (isPro) {
      // Get benchmark comparison
      benchmark = benchmarkEngine.getSTKYBenchmark(
        results.overall.score,
        context.industry,
        hazardScores
      );

      // Get PhD-level recommendations
      enhancedRecommendations = recommendationsEngine.getEnhancedRecommendations(
        results,
        'stky',
        true
      );
    } else {
      // Free users get basic recommendations with upgrade prompts
      enhancedRecommendations = recommendationsEngine.getEnhancedRecommendations(
        results,
        'stky',
        false
      );
    }

    res.json({
      success: true,
      results,
      citations,
      benchmark,
      enhancedRecommendations,
      isPro,
      proFeatures: isPro ? {
        benchmarking: true,
        permanentHistory: true,
        trendTracking: true,
        phdRecommendations: true
      } : {
        upgradeUrl: '/tools/signup.html?plan=pro',
        upgradeMessage: 'Upgrade to Pro for industry benchmarking, permanent history, and PhD-level recommendations'
      }
    });
  } catch (e) {
    console.error('[STKY Assess]', e.message);
    res.status(500).json({ error: 'Assessment failed' });
  }
});

/**
 * POST /api/stky/capture
 * Capture email after assessment (for delayed capture flow)
 */
router.post('/capture', async (req, res) => {
  try {
    const { sessionId, email, name, company } = req.body;

    if (!sessionId || !email) {
      return res.status(400).json({ error: 'sessionId and email required' });
    }

    // Update assessment with email
    await db.run(
      `UPDATE tool_assessments_v3 SET email = ?, name = ?, company = ? WHERE session_id = ? AND tool = 'stky'`,
      [email, name || null, company || null, sessionId]
    );

    // Get the assessment results
    const assessment = await db.get(
      `SELECT * FROM tool_assessments_v3 WHERE session_id = ? AND tool = 'stky' ORDER BY created_at DESC LIMIT 1`,
      [sessionId]
    );

    if (assessment) {
      const results = JSON.parse(assessment.scores || '{}');
      const context = JSON.parse(assessment.context || '{}');

      sendToWebhook({
        sessionId,
        email,
        name,
        company,
        industry: context.industry,
        path: assessment.path,
        results
      });
    }

    res.json({ success: true });
  } catch (e) {
    console.error('[STKY Capture]', e.message);
    res.status(500).json({ error: 'Failed to capture email' });
  }
});

/**
 * Send assessment data to GHL webhook
 */
function sendToWebhook(data) {
  const { sessionId, email, name, company, industry, path, results } = data;

  // Build critical gaps summary
  const criticalGaps = results.gaps?.filter(g => g.gap === 'critical') || [];
  const gapSummary = criticalGaps.slice(0, 3).map(g => `${g.hazard}: ${g.question}`).join(' | ');

  // Build hazard summary
  const hazardSummary = Object.entries(results.hazards || {})
    .map(([id, h]) => `${h.name}: ${h.score} (${h.rating.label})`)
    .join(' | ');

  fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'seg_stky_v3',
      session_id: sessionId,
      email,
      name: name || '',
      company: company || '',
      industry: industry || '',
      entry_path: path,
      overall_score: results.overall?.score || 0,
      overall_rating: results.overall?.rating?.label || 'Unknown',
      hazard_count: results.overall?.hazardCount || 0,
      hazard_summary: hazardSummary,
      critical_gaps: criticalGaps.length,
      gap_summary: gapSummary || 'None',
      recommendations_count: results.recommendations?.length || 0,
      timestamp: new Date().toISOString()
    })
  }).catch(e => console.error('[STKY Webhook]', e.message));
}

// Legacy endpoints for backwards compatibility
router.get('/industries', (req, res) => {
  res.json({
    success: true,
    industries: stkyEngine.config.context.find(c => c.id === 'industry')?.options || []
  });
});

router.get('/hazards/:industry', (req, res) => {
  try {
    const hazardIds = stkyEngine.config.industryHazards[req.params.industry] || [];
    const hazards = hazardIds.map(id => {
      const h = stkyEngine.config.hazards[id];
      return h ? { id: h.id, name: h.name } : null;
    }).filter(Boolean);
    res.json({ success: true, hazards });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load hazards' });
  }
});

module.exports = router;
