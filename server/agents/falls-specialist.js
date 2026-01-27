/**
 * Falls Specialist Agent
 * PhD-level expertise in fall protection, scaffolding, ladders, aerial lifts
 * Primary standards: OSHA 1926 Subpart M, ANSI Z359
 */

const Anthropic = require('@anthropic-ai/sdk');
const citationEngine = require('../lib/citationEngine');
const fs = require('fs');
const path = require('path');

// Load system prompt
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, '../data/agent-prompts/falls-specialist.md'),
  'utf-8'
);

const name = 'Falls Protection Specialist';
const description = 'Expert in fall protection, scaffolding, ladders, and aerial lifts';
const domains = ['fall_protection', 'scaffolds', 'ladders', 'aerial_lifts'];

/**
 * Generate response to fall protection query
 * @param {string} query - User query
 * @param {object} options - Response options
 * @returns {Promise<object>} - Structured response
 */
async function respond(query, options = {}) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  try {
    // Build context-aware prompt
    let contextPrompt = '';
    if (options.context) {
      if (options.context.industry) {
        contextPrompt += `\nIndustry context: ${options.context.industry}`;
      }
      if (options.context.state) {
        contextPrompt += `\nState: ${options.context.state} (note any state-specific requirements)`;
      }
    }

    // Get relevant citations upfront
    const fallCitations = citationEngine.getCitationsByHazard('fall_protection');
    const scaffoldCitations = citationEngine.getCitationsByHazard('scaffolds');

    const citationContext = `
Available citations for reference:
Fall Protection: ${fallCitations.map(c => c.fullRef).join(', ')}
Scaffolds: ${scaffoldCitations.map(c => c.fullRef).join(', ')}
`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: SYSTEM_PROMPT + citationContext,
      messages: [
        {
          role: 'user',
          content: query + contextPrompt
        }
      ]
    });

    const answer = response.content[0].text;

    // Extract citations mentioned in response
    const mentionedCitations = extractCitations(answer);

    return {
      answer,
      citations: mentionedCitations,
      specialist: 'falls',
      confidence: options.routing?.primaryDomain?.confidence || 80,
      followUp: generateFollowUp(query, answer)
    };

  } catch (error) {
    console.error('Falls Specialist error:', error);
    throw error;
  }
}

/**
 * Extract citations mentioned in response
 * @param {string} text - Response text
 * @returns {array} - Array of citation references
 */
function extractCitations(text) {
  const citations = [];
  const patterns = [
    /29 CFR 1926\.\d+(\([a-z]\))?(\(\d+\))?/gi,
    /29 CFR 1910\.\d+(\([a-z]\))?(\(\d+\))?/gi,
    /OSHA 1926\.\d+(\([a-z]\))?(\(\d+\))?/gi,
    /ANSI Z359\.\d+(-\d+)?/gi,
    /ANSI\/ASSP Z359\.\d+/gi
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      citations.push(...matches);
    }
  }

  return [...new Set(citations)]; // Remove duplicates
}

/**
 * Generate follow-up suggestions
 * @param {string} query - Original query
 * @param {string} answer - Generated answer
 * @returns {array} - Follow-up suggestions
 */
function generateFollowUp(query, answer) {
  const followUps = [];
  const queryLower = query.toLowerCase();
  const answerLower = answer.toLowerCase();

  // Context-aware follow-ups
  if (queryLower.includes('guardrail') && !answerLower.includes('toeboard')) {
    followUps.push('When are toeboards required with guardrail systems?');
  }

  if (queryLower.includes('harness') && !answerLower.includes('inspection')) {
    followUps.push('What are the harness inspection requirements?');
  }

  if (queryLower.includes('anchor') && !answerLower.includes('certified')) {
    followUps.push('When does an anchor point need engineering certification?');
  }

  if (queryLower.includes('scaffold')) {
    followUps.push('What training is required for scaffold erectors?');
  }

  if (queryLower.includes('leading edge')) {
    followUps.push('What PPE is rated for leading edge applications?');
  }

  // Default follow-ups if none generated
  if (followUps.length === 0) {
    followUps.push('What documentation is required for this program?');
    followUps.push('Are there state-specific requirements I should consider?');
  }

  return followUps.slice(0, 3);
}

/**
 * Get quick guidance for common scenarios
 * @param {string} scenario - Scenario identifier
 * @returns {object} - Quick guidance
 */
function getQuickGuidance(scenario) {
  const guidance = {
    'height_threshold': {
      construction: '6 feet per OSHA 1926.501',
      general_industry: '4 feet per OSHA 1910.28',
      shipyard: '5 feet per OSHA 1915.159'
    },
    'guardrail_specs': {
      top_rail: '42 inches (+/- 3 inches) per 1926.502(b)(1)',
      mid_rail: '21 inches per 1926.502(b)(2)',
      force_requirement: '200 lbs per 1926.502(b)(3)',
      toeboard: '4 inches when tools/materials could fall per 1926.502(j)'
    },
    'pfas_requirements': {
      anchorage: '5,000 lbs per employee per 1926.502(d)(15)',
      max_free_fall: '6 feet per 1926.502(d)(16)(iii)',
      max_arrest_force: '1,800 lbs per 1926.502(d)(16)(ii)',
      harness_only: 'Body belts prohibited for fall arrest per 1926.502(d)'
    },
    'rescue_plan': {
      requirement: 'Must be in place before work begins per 1926.502(d)(20)',
      time_limit: 'Suspension trauma can occur within 20-30 minutes',
      elements: ['Self-rescue capability', 'Assisted rescue method', 'Rescue equipment staged', 'Trained personnel identified']
    }
  };

  return guidance[scenario] || null;
}

module.exports = {
  name,
  description,
  domains,
  respond,
  extractCitations,
  generateFollowUp,
  getQuickGuidance
};
