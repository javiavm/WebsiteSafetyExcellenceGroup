/**
 * SIF Scorecard Routes - V3
 * Path-based entry, scenarios, precursor assessment, STKY integration
 */

const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const sifEngine = require('../lib/sifEngine');
const citationEngine = require('../lib/citationEngine');
const benchmarkEngine = require('../lib/benchmarkEngine');
const recommendationsEngine = require('../lib/recommendationsEngine');

/**
 * Check if user is Pro/Premium tier
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
    // Ignore auth errors
  }
  return null;
}

const WEBHOOKS = {
  free: process.env.GHL_WEBHOOK_SIF_FREE || 'https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/bc3371cc-84f6-474e-8d88-a4455cc0b9bc',
  paid: process.env.GHL_WEBHOOK_SIF_PAID || 'https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/ad3d5210-a42a-4d55-a467-ceb8ec5ff2f0'
};

/**
 * GET /api/sif/config
 * Returns paths, context questions, precursor metadata
 */
router.get('/config', (req, res) => {
  try {
    const config = sifEngine.getConfig();
    res.json({ success: true, ...config });
  } catch (e) {
    console.error('[SIF Config]', e.message);
    res.status(500).json({ error: 'Failed to load config' });
  }
});

/**
 * GET /api/sif/paths
 * Returns available entry paths
 */
router.get('/paths', (req, res) => {
  res.json({
    success: true,
    paths: Object.values(sifEngine.config.paths)
  });
});

/**
 * GET /api/sif/context
 * Returns context questions
 */
router.get('/context', (req, res) => {
  res.json({
    success: true,
    questions: sifEngine.config.context
  });
});

/**
 * GET /api/sif/scenarios
 * Returns scenarios for classification flow
 */
router.get('/scenarios', (req, res) => {
  try {
    const scenarios = sifEngine.getScenarios();
    res.json({ success: true, scenarios });
  } catch (e) {
    console.error('[SIF Scenarios]', e.message);
    res.status(500).json({ error: 'Failed to load scenarios' });
  }
});

/**
 * GET /api/sif/precursors/:pathId
 * Returns precursors to assess based on path
 */
router.get('/precursors/:pathId', async (req, res) => {
  try {
    const { pathId } = req.params;
    const { sessionId } = req.query;

    // Check if STKY data exists for this session
    let hasSTKYData = false;
    if (sessionId) {
      const session = await db.get(
        'SELECT stky_completed FROM tool_sessions WHERE session_id = ?',
        [sessionId]
      );
      hasSTKYData = session?.stky_completed || false;
    }

    const precursorIds = sifEngine.getPrecursorsForPath(pathId, hasSTKYData);

    const precursors = precursorIds.map(id => {
      const p = sifEngine.config.precursors[id];
      return p ? {
        id: p.id,
        name: p.name,
        weight: p.weight,
        questionCount: p.questions.length,
        questions: p.questions
      } : null;
    }).filter(Boolean);

    res.json({
      success: true,
      precursors,
      stkyDataAvailable: hasSTKYData,
      stkyOverlap: sifEngine.config.stkyOverlap
    });
  } catch (e) {
    console.error('[SIF Precursors]', e.message);
    res.status(500).json({ error: 'Failed to load precursors' });
  }
});

/**
 * GET /api/sif/precursor/:precursorId/questions
 * Returns questions for a specific precursor
 */
router.get('/precursor/:precursorId/questions', (req, res) => {
  try {
    const questions = sifEngine.getPrecursorQuestions(req.params.precursorId);
    res.json({ success: true, questions });
  } catch (e) {
    console.error('[SIF Questions]', e.message);
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

/**
 * POST /api/sif/assess
 * Submit assessment and get scored results
 */
router.post('/assess', async (req, res) => {
  try {
    const { sessionId, path, context, responses, email, name, company } = req.body;

    if (!sessionId || !path || !context) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for STKY data to incorporate
    let stkyScores = null;
    const session = await db.get(
      'SELECT * FROM tool_sessions WHERE session_id = ?',
      [sessionId]
    );

    if (session?.stky_completed) {
      const stkyAssessment = await db.get(
        `SELECT scores FROM tool_assessments_v3 WHERE session_id = ? AND tool = 'stky' ORDER BY created_at DESC LIMIT 1`,
        [sessionId]
      );
      if (stkyAssessment) {
        stkyScores = JSON.parse(stkyAssessment.scores || '{}');
      }
    }

    // Score the assessment
    const results = sifEngine.scoreSIF(responses || {}, context, stkyScores);

    // Save to database
    await db.run(
      `INSERT INTO tool_assessments_v3(
        session_id, tool, path, context, responses, scores, gaps, recommendations,
        email, name, company, industry, disclaimer_accepted_at, created_at
      ) VALUES(?, 'sif', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        sessionId,
        path,
        JSON.stringify(context),
        JSON.stringify(responses || {}),
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
      `UPDATE tool_sessions SET sif_score = ?, sif_completed = 1, updated_at = datetime('now') WHERE session_id = ?`,
      [results.overall.score, sessionId]
    );

    // Determine webhook (free vs paid based on path)
    const isPaid = path === 'building_program' || path === 'predict';

    // Send to webhook if email provided
    if (email) {
      sendToWebhook({
        sessionId,
        email,
        name,
        company,
        industry: context.industry,
        path,
        results,
        isPaid
      });
    }

    // Add citations for precursors with low scores
    const citations = [];
    if (results.precursors) {
      for (const [precursorId, precursorScore] of Object.entries(results.precursors)) {
        if (precursorScore.score < 70) {
          const citationBlock = citationEngine.generateCitationBlock(precursorId, precursorScore.score);
          if (citationBlock) citations.push(citationBlock);
        }
      }
    }

    // Check if user is Pro for enhanced features
    const proUser = await checkProUser(req);
    const isProUser = !!proUser;

    // Pro features: benchmarking
    let benchmark = null;

    if (isProUser) {
      // Get SIF benchmark comparison
      benchmark = benchmarkEngine.getSIFBenchmark(
        results.overall.score,
        context.industry,
        {
          correct: results.scenarios?.correct,
          total: results.scenarios?.total,
          blindSpots: results.scenarios?.blindSpots
        }
      );
    }

    res.json({
      success: true,
      results,
      citations,
      benchmark,
      isPro: isProUser,
      proFeatures: isProUser ? {
        benchmarking: true,
        permanentHistory: true,
        trendTracking: true,
        blindSpotAnalysis: true
      } : {
        upgradeUrl: '/tools/signup.html?plan=pro',
        upgradeMessage: 'Upgrade to Pro for industry benchmarking and permanent history'
      }
    });
  } catch (e) {
    console.error('[SIF Assess]', e.message);
    res.status(500).json({ error: 'Assessment failed' });
  }
});

/**
 * POST /api/sif/capture
 * Capture email after assessment
 */
router.post('/capture', async (req, res) => {
  try {
    const { sessionId, email, name, company } = req.body;

    if (!sessionId || !email) {
      return res.status(400).json({ error: 'sessionId and email required' });
    }

    // Update assessment with email
    await db.run(
      `UPDATE tool_assessments_v3 SET email = ?, name = ?, company = ? WHERE session_id = ? AND tool = 'sif'`,
      [email, name || null, company || null, sessionId]
    );

    // Get assessment and send to webhook
    const assessment = await db.get(
      `SELECT * FROM tool_assessments_v3 WHERE session_id = ? AND tool = 'sif' ORDER BY created_at DESC LIMIT 1`,
      [sessionId]
    );

    if (assessment) {
      const results = JSON.parse(assessment.scores || '{}');
      const context = JSON.parse(assessment.context || '{}');
      const isPaid = assessment.path === 'building_program' || assessment.path === 'predict';

      sendToWebhook({
        sessionId,
        email,
        name,
        company,
        industry: context.industry,
        path: assessment.path,
        results,
        isPaid
      });
    }

    res.json({ success: true });
  } catch (e) {
    console.error('[SIF Capture]', e.message);
    res.status(500).json({ error: 'Failed to capture email' });
  }
});

/**
 * Send assessment data to GHL webhook
 */
function sendToWebhook(data) {
  const { sessionId, email, name, company, industry, path, results, isPaid } = data;
  const webhook = isPaid ? WEBHOOKS.paid : WEBHOOKS.free;

  // Build blind spots summary
  const blindSpots = results.scenarios?.blindSpots || [];

  // Build precursor summary
  const precursorSummary = Object.entries(results.precursors || {})
    .map(([id, p]) => `${p.name}: ${p.score} (${p.rating.label})`)
    .join(' | ');

  // Build critical gaps summary
  const criticalGaps = results.gaps?.filter(g => g.gap === 'critical') || [];

  fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: isPaid ? 'seg_sif_paid_v3' : 'seg_sif_free_v3',
      session_id: sessionId,
      email,
      name: name || '',
      company: company || '',
      industry: industry || '',
      entry_path: path,
      overall_score: results.overall?.score || 0,
      overall_rating: results.overall?.rating?.label || 'Unknown',
      stky_integrated: results.overall?.stkyIntegrated || false,
      precursor_count: results.overall?.precursorCount || 0,
      precursor_summary: precursorSummary,
      scenario_score: results.scenarios?.score || null,
      scenario_correct: results.scenarios?.correct || null,
      scenario_total: results.scenarios?.total || null,
      blind_spots: blindSpots.join(', ') || 'None',
      blind_spot_count: blindSpots.length,
      critical_gaps: criticalGaps.length,
      recommendations_count: results.recommendations?.length || 0,
      timestamp: new Date().toISOString()
    })
  }).catch(e => console.error('[SIF Webhook]', e.message));
}

// Legacy endpoints for backwards compatibility
router.get('/industries', (req, res) => {
  res.json({
    success: true,
    industries: sifEngine.config.context.find(c => c.id === 'industry')?.options || []
  });
});

module.exports = router;
