/**
 * Agent Routes
 * API endpoints for SME agent consultation
 */

const express = require('express');
const router = express.Router();
const navigator = require('../agents/navigator');

/**
 * GET /api/agents/specialists
 * List available specialist agents
 */
router.get('/specialists', (req, res) => {
  const specialists = navigator.getAvailableSpecialists();
  res.json({ success: true, specialists });
});

/**
 * POST /api/agents/query
 * Query the navigator (auto-routes to appropriate specialist)
 */
router.post('/query', async (req, res) => {
  const { query, context } = req.body;

  if (!query || query.length < 10) {
    return res.status(400).json({ error: 'Query must be at least 10 characters' });
  }

  try {
    const result = await navigator.processQuery(query, { context });
    res.json(result);
  } catch (e) {
    console.error('[Agent Query]', e.message);
    res.status(500).json({ error: 'Query processing failed' });
  }
});

/**
 * POST /api/agents/specialist/:id
 * Query a specific specialist directly
 */
router.post('/specialist/:id', async (req, res) => {
  const { id } = req.params;
  const { query, context } = req.body;

  if (!query || query.length < 10) {
    return res.status(400).json({ error: 'Query must be at least 10 characters' });
  }

  try {
    const result = await navigator.querySpecialist(id, query, { context });
    res.json(result);
  } catch (e) {
    console.error(`[Agent ${id}]`, e.message);
    res.status(500).json({ error: 'Query processing failed' });
  }
});

/**
 * GET /api/agents/classify
 * Classify a query's domain without processing
 */
router.get('/classify', (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  const routing = navigator.routeQuery(query);
  res.json({
    success: true,
    domains: routing.primaryDomain,
    additional: routing.additionalDomains,
    strategy: routing.strategy
  });
});

module.exports = router;
