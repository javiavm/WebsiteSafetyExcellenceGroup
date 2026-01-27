/**
 * Dashboard Routes - V3
 * View past assessments by session or email
 * PRO features: trend tracking, benchmarking
 */

const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const benchmarkEngine = require('../lib/benchmarkEngine');

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

/**
 * GET /api/dashboard
 * Returns assessments by email or session_id
 */
router.get('/', async (req, res) => {
  try {
    const { email, session_id } = req.query;

    if (!email && !session_id) {
      return res.status(400).json({ error: 'email or session_id required' });
    }

    let assessments;
    let session = null;

    if (email) {
      assessments = await db.all(
        `SELECT * FROM tool_assessments_v3 WHERE email = ? ORDER BY created_at DESC`,
        [email]
      );
    } else if (session_id) {
      assessments = await db.all(
        `SELECT * FROM tool_assessments_v3 WHERE session_id = ? ORDER BY created_at DESC`,
        [session_id]
      );

      session = await db.get(
        `SELECT * FROM tool_sessions WHERE session_id = ?`,
        [session_id]
      );
    }

    // Parse JSON fields
    const parsed = assessments.map(a => ({
      ...a,
      context: JSON.parse(a.context || '{}'),
      scores: JSON.parse(a.scores || '{}'),
      gaps: JSON.parse(a.gaps || '[]'),
      recommendations: JSON.parse(a.recommendations || '[]')
    }));

    // Check if user is Pro for enhanced features
    const proUser = await checkProUser(req);
    const isPro = !!proUser;

    // Pro feature: trend tracking
    let trends = null;
    if (isPro && parsed.length >= 2) {
      const stkyAssessments = parsed.filter(a => a.tool === 'stky');
      const sifAssessments = parsed.filter(a => a.tool === 'sif');

      trends = {
        stky: benchmarkEngine.getTrendAnalysis(stkyAssessments),
        sif: benchmarkEngine.getTrendAnalysis(sifAssessments)
      };
    }

    res.json({
      success: true,
      assessments: parsed,
      session,
      summary: {
        stky_score: session?.stky_score || null,
        stky_completed: session?.stky_completed || false,
        sif_score: session?.sif_score || null,
        sif_completed: session?.sif_completed || false
      },
      trends,
      isPro,
      proFeatures: isPro ? {
        trendTracking: true,
        permanentHistory: true
      } : {
        upgradeUrl: '/tools/signup.html?plan=pro',
        upgradeMessage: 'Upgrade to Pro for trend tracking and permanent history'
      }
    });
  } catch (e) {
    console.error('[Dashboard]', e.message);
    res.status(500).json({ error: 'Failed to load assessments' });
  }
});

/**
 * GET /api/dashboard/lookup
 * Lookup past results by email (for returning users)
 */
router.get('/lookup', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'email required' });
    }

    // Get most recent session for this email
    const latest = await db.get(
      `SELECT session_id FROM tool_assessments_v3 WHERE email = ? ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (!latest) {
      return res.json({ success: true, found: false });
    }

    // Get session summary
    const session = await db.get(
      `SELECT * FROM tool_sessions WHERE session_id = ?`,
      [latest.session_id]
    );

    // Get all assessments for this email
    const count = await db.get(
      `SELECT COUNT(*) as total FROM tool_assessments_v3 WHERE email = ?`,
      [email]
    );

    res.json({
      success: true,
      found: true,
      session_id: latest.session_id,
      stky_score: session?.stky_score || null,
      sif_score: session?.sif_score || null,
      total_assessments: count.total
    });
  } catch (e) {
    console.error('[Dashboard Lookup]', e.message);
    res.status(500).json({ error: 'Lookup failed' });
  }
});

/**
 * GET /api/dashboard/assessment/:id
 * Get full details for a specific assessment
 */
router.get('/assessment/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await db.get(
      `SELECT * FROM tool_assessments_v3 WHERE id = ?`,
      [id]
    );

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json({
      success: true,
      assessment: {
        ...assessment,
        context: JSON.parse(assessment.context || '{}'),
        responses: JSON.parse(assessment.responses || '{}'),
        scores: JSON.parse(assessment.scores || '{}'),
        gaps: JSON.parse(assessment.gaps || '[]'),
        recommendations: JSON.parse(assessment.recommendations || '[]')
      }
    });
  } catch (e) {
    console.error('[Dashboard Assessment]', e.message);
    res.status(500).json({ error: 'Failed to load assessment' });
  }
});

module.exports = router;
