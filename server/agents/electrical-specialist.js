/**
 * Electrical Specialist Agent
 * PhD-level expertise in electrical safety, arc flash, LOTO
 * Primary standards: NFPA 70E, OSHA 1910.147, OSHA 1926 Subpart K
 */

const Anthropic = require('@anthropic-ai/sdk');
const citationEngine = require('../lib/citationEngine');
const fs = require('fs');
const path = require('path');

// Load system prompt
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, '../data/agent-prompts/electrical-specialist.md'),
  'utf-8'
);

const name = 'Electrical Safety Specialist';
const description = 'Expert in arc flash, NFPA 70E, lockout/tagout, and electrical safety';
const domains = ['electrical', 'arc_flash', 'loto'];

/**
 * Generate response to electrical safety query
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
      if (options.context.voltage) {
        contextPrompt += `\nVoltage level: ${options.context.voltage}V`;
      }
      if (options.context.industry) {
        contextPrompt += `\nIndustry context: ${options.context.industry}`;
      }
      if (options.context.equipment) {
        contextPrompt += `\nEquipment type: ${options.context.equipment}`;
      }
    }

    // Get relevant citations upfront
    const electricalCitations = citationEngine.getCitationsByHazard('electrical');
    const arcFlashCitations = citationEngine.getCitationsByHazard('arc_flash');
    const lotoCitations = citationEngine.getCitationsByHazard('loto');

    const citationContext = `
      Available citations for reference:
      Electrical: ${electricalCitations.map(c => c.fullRef).join(', ')}
      Arc Flash: ${arcFlashCitations.map(c => c.fullRef).join(', ')}
      LOTO: ${lotoCitations.map(c => c.fullRef).join(', ')}
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
      specialist: 'electrical',
      confidence: options.routing?.primaryDomain?.confidence || 80,
      followUp: generateFollowUp(query, answer)
    };

  } catch (error) {
    console.error('Electrical Specialist error:', error);
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
    /NFPA 70E (Article )?\d+(\.\d+)?(\([A-Z]\))?/gi,
    /29 CFR 1910\.\d+(\([a-z]\))?(\(\d+\))?/gi,
    /29 CFR 1926\.\d+(\([a-z]\))?(\(\d+\))?/gi,
    /Table 130\.\d+\([A-Z]\)/gi,
    /NEC (Article )?\d+/gi
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
  if (queryLower.includes('arc flash') && !answerLower.includes('label')) {
    followUps.push('What information is required on arc flash labels?');
  }

  if (queryLower.includes('ppe') && !answerLower.includes('inspection')) {
    followUps.push('What are the arc-rated PPE inspection requirements?');
  }

  if (queryLower.includes('loto') && !answerLower.includes('annual')) {
    followUps.push('What are the annual LOTO inspection requirements?');
  }

  if (queryLower.includes('energized work')) {
    followUps.push('What justifications are acceptable for energized work?');
  }

  if (queryLower.includes('qualified person')) {
    followUps.push('What training is required to become a qualified person?');
  }

  if (queryLower.includes('boundary')) {
    followUps.push('How do I determine approach boundaries for my equipment?');
  }

  // Default follow-ups if none generated
  if (followUps.length === 0) {
    followUps.push('What documentation is required for an electrical safety program?');
    followUps.push('When is an energized electrical work permit required?');
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
    'ppe_categories': {
      category_1: {
        incident_energy: '4 cal/cm² minimum arc rating',
        ppe: 'Arc-rated shirt and pants or coverall, face shield, hard hat, safety glasses, hearing protection, leather gloves'
      },
      category_2: {
        incident_energy: '8 cal/cm² minimum arc rating',
        ppe: 'Arc-rated shirt and pants or coverall, arc flash suit hood or face shield with balaclava, hard hat, safety glasses, hearing protection, leather gloves'
      },
      category_3: {
        incident_energy: '25 cal/cm² minimum arc rating',
        ppe: 'Arc flash suit (jacket, pants, hood), arc-rated shirt and pants, hard hat, safety glasses, hearing protection, rubber insulating gloves'
      },
      category_4: {
        incident_energy: '40 cal/cm² minimum arc rating',
        ppe: 'Arc flash suit (jacket, pants, hood), arc-rated shirt and pants, hard hat, safety glasses, hearing protection, rubber insulating gloves with leather protectors'
      }
    },
    'approach_boundaries_480v': {
      limited: '3 ft 6 in (1.07 m)',
      restricted: 'Avoid contact',
      prohibited: 'Not specified for this voltage',
      arc_flash: 'Per incident energy calculation'
    },
    'loto_steps': [
      '1. Prepare for shutdown - notify affected employees',
      '2. Machine shutdown - follow normal stopping procedure',
      '3. Machine isolation - locate all energy isolating devices',
      '4. Apply lockout/tagout devices - each authorized employee',
      '5. Release stored energy - all potentially hazardous energy',
      '6. Verify isolation - attempt to restart to verify deenergized'
    ],
    'eewp_required': {
      always_required: [
        'Work within arc flash boundary of equipment >240V',
        'Work within restricted approach boundary',
        'Any task that increases risk of arc flash'
      ],
      permit_contents: [
        'Description of work',
        'Justification for energized work',
        'Results of shock and arc flash hazard analysis',
        'PPE to be worn',
        'Means to restrict access',
        'Evidence of job briefing'
      ]
    },
    'glove_testing': {
      before_each_use: 'Air test and visual inspection',
      periodic_testing: '6 months maximum between electrical tests',
      class_ratings: {
        '00': '500V AC max use voltage',
        '0': '1,000V AC max use voltage',
        '1': '7,500V AC max use voltage',
        '2': '17,000V AC max use voltage',
        '3': '26,500V AC max use voltage',
        '4': '36,000V AC max use voltage'
      }
    }
  };

  return guidance[scenario] || null;
}

/**
 * Calculate incident energy PPE requirement
 * @param {number} incidentEnergy - Calculated incident energy in cal/cm²
 * @returns {object} - PPE category and requirements
 */
function getPPECategory(incidentEnergy) {
  if (incidentEnergy <= 4) {
    return { category: 1, minRating: 4, description: 'Arc-rated clothing with face/head protection' };
  } else if (incidentEnergy <= 8) {
    return { category: 2, minRating: 8, description: 'Arc flash hood or face shield with balaclava required' };
  } else if (incidentEnergy <= 25) {
    return { category: 3, minRating: 25, description: 'Arc flash suit required' };
  } else if (incidentEnergy <= 40) {
    return { category: 4, minRating: 40, description: 'Maximum PPE protection required' };
  } else {
    return { category: 'PROHIBITED', minRating: null, description: 'Work prohibited - incident energy exceeds PPE protection limits' };
  }
}

module.exports = {
  name,
  description,
  domains,
  respond,
  extractCitations,
  generateFollowUp,
  getQuickGuidance,
  getPPECategory
};
