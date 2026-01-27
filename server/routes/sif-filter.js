/**
 * SIF Filter Routes - V3
 * AI-powered P-SIF classification using Claude
 */

const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const sifEngine = require('../lib/sifEngine');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Get the system prompt from config
const SYSTEM_PROMPT = sifEngine.getFilterPrompt();

/**
 * GET /api/sif-filter/disclaimer
 * Returns the disclaimer text for the filter page
 */
router.get('/disclaimer', (req, res) => {
  res.json({
    success: true,
    disclaimer: `Before you paste:

Remove names, company identifiers, locations, and dates.

Example:
"John fell at Acme's Houston plant on Jan 3" should become
"Worker fell from scaffold during installation"

We analyze the event, not the people. Keep it anonymous.`,
    classification_disclaimer: `This tool provides classification guidance only. It does not replace professional incident investigation or root cause analysis. All classifications should be verified by qualified safety professionals.`
  });
});

/**
 * POST /api/sif-filter/classify
 * Classify a near-miss description
 */
router.post('/classify', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ error: 'Description too short. Please provide more detail about the event.' });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: description }]
    });

    const text = response.content[0].text;

    // Parse the response
    let result;

    // Check for PII rejection first
    if (text.toLowerCase().includes('remove identifying') || text.toLowerCase().includes('pii')) {
      result = {
        error: 'pii',
        message: 'Remove identifying details (names, companies, locations, dates) and paste again. I only need the event.'
      };
    } else {
      // Parse P-SIF classification
      const isPSIF = text.toLowerCase().includes('p-sif: yes') || text.toLowerCase().includes('**p-sif: yes**');

      // Extract energy assessment
      const energyMatch = text.match(/energy[:\s]+([^\n]+)/i);
      const energy = energyMatch ? energyMatch[1].trim() : 'Unable to assess';

      // Extract exposure assessment
      const exposureMatch = text.match(/exposure[:\s]+([^\n]+)/i);
      const exposure = exposureMatch ? exposureMatch[1].trim() : 'Unable to assess';

      // Extract control type
      const controlMatch = text.match(/control[:\s]+([^\n]+)/i);
      const control = controlMatch ? controlMatch[1].trim() : 'Unable to assess';

      // Extract action/guidance (last sentence or line)
      const lines = text.split('\n').filter(l => l.trim());
      const action = lines[lines.length - 1]?.replace(/^\*+|\*+$/g, '').trim() || 'Review with safety team.';

      result = {
        isPSIF,
        energy,
        exposure,
        control,
        action
      };
    }

    res.json({ success: true, result });
  } catch (e) {
    console.error('[SIF Filter]', e.message);
    res.status(500).json({ error: 'Classification failed. Please try again.' });
  }
});

module.exports = router;
