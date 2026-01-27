/**
 * General Compliance Specialist Agent
 * Broad regulatory guidance for queries not matching specific specialist domains
 * Primary standards: 29 CFR 1910/1926, general safety principles
 */

const Anthropic = require('@anthropic-ai/sdk');
const citationEngine = require('../lib/citationEngine');
const fs = require('fs');
const path = require('path');

// Load system prompt
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, '../data/agent-prompts/general-specialist.md'),
  'utf-8'
);

const name = 'General Compliance Specialist';
const description = 'Broad regulatory guidance and general safety program consultation';
const domains = ['general', 'compliance', 'programs', 'training'];

/**
 * Generate response to general safety query
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
        contextPrompt += `\nIndustry: ${options.context.industry}`;
      }
      if (options.context.state) {
        contextPrompt += `\nState: ${options.context.state}`;
      }
      if (options.context.companySize) {
        contextPrompt += `\nCompany size: ${options.context.companySize} employees`;
      }
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
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
      specialist: 'general',
      confidence: options.routing?.primaryDomain?.confidence || 60,
      followUp: generateFollowUp(query, answer)
    };

  } catch (error) {
    console.error('General Specialist error:', error);
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
    /29 CFR 1910\.\d+(\([a-z]\))?(\(\d+\))?/gi,
    /29 CFR 1926\.\d+(\([a-z]\))?(\(\d+\))?/gi,
    /OSHA 19\d{2}\.\d+(\([a-z]\))?(\(\d+\))?/gi,
    /Cal-OSHA Title 8/gi,
    /ANSI [A-Z]\d+(\.\d+)?/gi,
    /NFPA \d+/gi
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

  // Context-aware follow-ups based on general topics
  if (queryLower.includes('program')) {
    followUps.push('What documentation is required for this program?');
    followUps.push('How often should this program be reviewed?');
  }

  if (queryLower.includes('training')) {
    followUps.push('What records must be maintained for training?');
    followUps.push('How often is refresher training required?');
  }

  if (queryLower.includes('inspection')) {
    followUps.push('What should be documented during inspections?');
  }

  if (queryLower.includes('incident') || queryLower.includes('accident')) {
    followUps.push('What are the OSHA reporting requirements?');
    followUps.push('What should an incident investigation include?');
  }

  if (queryLower.includes('osha')) {
    followUps.push('Are there state-specific requirements beyond federal OSHA?');
  }

  // Default follow-ups if none generated
  if (followUps.length === 0) {
    followUps.push('What documentation should we maintain?');
    followUps.push('Would you like me to connect you with a specialist on this topic?');
  }

  return followUps.slice(0, 3);
}

/**
 * Get list of state OSHA programs
 * @returns {object} - State plan information
 */
function getStatePlans() {
  return {
    state_plans: [
      'Alaska', 'Arizona', 'California', 'Hawaii', 'Indiana', 'Iowa',
      'Kentucky', 'Maryland', 'Michigan', 'Minnesota', 'Nevada',
      'New Mexico', 'North Carolina', 'Oregon', 'Puerto Rico',
      'South Carolina', 'Tennessee', 'Utah', 'Vermont', 'Virginia',
      'Washington', 'Wyoming'
    ],
    public_sector_only: [
      'Connecticut', 'Illinois', 'Maine', 'New Jersey', 'New York', 'Virgin Islands'
    ],
    note: 'State plans must be at least as effective as federal OSHA but may have additional or stricter requirements'
  };
}

/**
 * Get common recordkeeping requirements
 * @returns {object} - Recordkeeping information
 */
function getRecordkeepingRequirements() {
  return {
    osha_300_log: {
      applies_to: 'Employers with 11+ employees (with exemptions)',
      retention: '5 years following year of record',
      requirements: [
        'Log 300 - Record of injuries/illnesses',
        'Form 300A - Summary posted Feb 1 - Apr 30',
        'Form 301 - Individual incident reports'
      ]
    },
    training_records: {
      general: 'Maintain records demonstrating training completion',
      typical_contents: ['Employee name', 'Training date', 'Topics covered', 'Trainer qualification', 'Competency verification']
    },
    equipment_inspections: {
      retention: 'Varies by standard, typically until replaced or superseded',
      examples: [
        'Fire extinguisher monthly inspections',
        'Fall protection equipment inspection logs',
        'Crane/hoist inspection records',
        'PPE inspection documentation'
      ]
    },
    exposure_records: {
      medical: '30 years after employment ends',
      monitoring: '30 years'
    }
  };
}

/**
 * Get OSHA reporting requirements
 * @returns {object} - Reporting timelines
 */
function getReportingRequirements() {
  return {
    immediate_report: {
      trigger: 'Fatality',
      timeline: '8 hours from learning of event',
      method: 'Call OSHA (800-321-OSHA) or report online'
    },
    within_24_hours: {
      triggers: [
        'Hospitalization of one or more employees',
        'Amputation',
        'Loss of an eye'
      ],
      timeline: '24 hours from learning of event',
      method: 'Call OSHA (800-321-OSHA) or report online'
    },
    notes: [
      'Only work-related events require reporting',
      'Motor vehicle accidents on public roads generally exempt',
      'Heart attacks reportable if work-related'
    ]
  };
}

module.exports = {
  name,
  description,
  domains,
  respond,
  extractCitations,
  generateFollowUp,
  getStatePlans,
  getRecordkeepingRequirements,
  getReportingRequirements
};
