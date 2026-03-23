/**
 * Data Center Specialist Agent
 * PhD-level expertise in data center construction and operations safety
 * Primary standards: NFPA 70E, 29 CFR 1926, critical infrastructure protocols
 */

const Anthropic = require('@anthropic-ai/sdk');
const citationEngine = require('../lib/citationEngine');
const fs = require('fs');
const path = require('path');

// Load system prompt
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, '../data/agent-prompts/dc-specialist.md'),
  'utf-8'
);

const name = 'Data Center Safety Specialist';
const description = 'Expert in hyperscale data center construction and operations safety';
const domains = ['data_center', 'critical_infrastructure', 'commissioning'];

/**
 * Generate response to data center safety query
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
      if (options.context.phase) {
        contextPrompt += `\nProject phase: ${options.context.phase}`;
      }
      if (options.context.tier) {
        contextPrompt += `\nData center tier: ${options.context.tier}`;
      }
      if (options.context.powerCapacity) {
        contextPrompt += `\nPower capacity: ${options.context.powerCapacity}`;
      }
    }

    // Get relevant citations
    const electricalCitations = citationEngine.getCitationsByHazard('electrical');
    const arcFlashCitations = citationEngine.getCitationsByHazard('arc_flash');
    const lotoCitations = citationEngine.getCitationsByHazard('loto');
    const fallCitations = citationEngine.getCitationsByHazard('fall_protection');

    const citationContext = `
      Available citations for data center context:
      Electrical/Arc Flash: ${[...electricalCitations, ...arcFlashCitations].map(c => c.fullRef).join(', ')}
      LOTO: ${lotoCitations.map(c => c.fullRef).join(', ')}
      Fall Protection: ${fallCitations.map(c => c.fullRef).join(', ')}
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
      specialist: 'dc',
      confidence: options.routing?.primaryDomain?.confidence || 80,
      followUp: generateFollowUp(query, answer)
    };

  } catch (error) {
    console.error('DC Specialist error:', error);
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
    /NFPA 7\d/gi,
    /29 CFR 1910\.\d+(\([a-z]\))?(\(\d+\))?/gi,
    /29 CFR 1926\.\d+(\([a-z]\))?(\(\d+\))?/gi,
    /TIA-942/gi,
    /Uptime Institute Tier \d/gi
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
  if (queryLower.includes('commissioning') && !answerLower.includes('pre-energization')) {
    followUps.push('What safety checks are required before initial energization?');
  }

  if (queryLower.includes('ups') && !answerLower.includes('battery')) {
    followUps.push('What are the safety requirements for battery room ventilation?');
  }

  if (queryLower.includes('contractor') && !answerLower.includes('pre-qualification')) {
    followUps.push('What should our contractor pre-qualification process include?');
  }

  if (queryLower.includes('arc flash')) {
    followUps.push('How often should arc flash studies be updated in data centers?');
  }

  if (queryLower.includes('cable tray')) {
    followUps.push('What fall protection is required for overhead cable tray work?');
  }

  if (queryLower.includes('hot work')) {
    followUps.push('How do we manage fire watch when detection systems are impaired?');
  }

  // Default follow-ups if none generated
  if (followUps.length === 0) {
    followUps.push('What are the most common safety violations during DC construction?');
    followUps.push('How should we coordinate safety during multi-trade operations?');
  }

  return followUps.slice(0, 3);
}

/**
 * Get quick guidance for common DC scenarios
 * @param {string} scenario - Scenario identifier
 * @returns {object} - Quick guidance
 */
function getQuickGuidance(scenario) {
  const guidance = {
    'commissioning_safety': {
      phases: [
        'Pre-commissioning: Safety documentation review, LOTO verification, arc flash labels installed',
        'Initial energization: Exclusion zones established, qualified persons only, emergency response staged',
        'Functional testing: Coordinated shutdown/startup, hot work permits for any cutting/welding',
        'Integrated systems testing: Multi-system coordination, updated LOTO procedures for complex configurations'
      ],
      key_requirements: [
        'Arc flash risk assessment current for as-built conditions',
        'All electrical connections torque-verified and documented',
        'IR scanning scheduled for first 30 days post-energization',
        'Emergency response team briefed on DC-specific hazards'
      ]
    },
    'battery_room_safety': {
      hazards: ['Hydrogen off-gassing', 'Acid/electrolyte spills', 'Electrical shock', 'Heavy lifting'],
      requirements: [
        'Ventilation per NFPA 1 and building code',
        'Eye wash within 10 seconds of work area',
        'Spill containment and neutralization kit',
        'Hydrogen monitoring (alarm at 1% concentration)',
        'Arc-rated PPE for battery maintenance',
        'Insulated tools required'
      ]
    },
    'raised_floor_safety': {
      hazards: ['Trip hazards from open tiles', 'Falls through open panels', 'Ergonomic risks from tile lifting'],
      requirements: [
        'Covers or barricades for all open floor sections',
        'Tile lifters available (no hands-only lifting)',
        'Storage racks for removed tiles (no leaning against equipment)',
        'Inspection for damaged or cracked tiles before use'
      ]
    },
    'multi_trade_coordination': {
      daily_requirements: [
        'Morning safety coordination meeting with all trades',
        'Hot work, LOTO, and confined space activities communicated',
        'Work area boundaries clearly defined and marked',
        'Emergency egress routes verified unobstructed',
        'Conflicting activities identified and sequenced'
      ],
      documentation: [
        'Daily sign-in sheets with safety acknowledgment',
        'Hot work permits posted at work location',
        'Active LOTO log visible to all workers',
        'Emergency contact information posted'
      ]
    },
    'contractor_prequalification': {
      metrics: {
        emr_requirement: 'Less than 1.0 required, less than 0.8 preferred',
        dart_rate: 'Below industry average for 3 years',
        fatalities: 'Zero in past 5 years'
      },
      documentation: [
        'Written safety program',
        'OSHA 10/30 certificates for all workers',
        'NFPA 70E training for electrical workers',
        'Insurance certificates (workers comp, liability)',
        'Incident investigation reports (last 3 years)'
      ]
    },
    'emergency_response': {
      dc_specific: [
        'Arc flash/electrical burn response procedure',
        'Halon/clean agent suppression release protocol',
        'UPS/battery system emergency shutdown',
        'Coordination with data center operations during emergencies'
      ],
      equipment_staged: [
        'Rescue hooks and insulated blankets near high-voltage areas',
        'AED within 3-minute response time',
        'Burn kit with sterile dressings',
        'Eye wash stations at battery and chemical storage areas'
      ]
    }
  };

  return guidance[scenario] || null;
}

/**
 * Get DC-specific hazard assessment checklist
 * @param {string} phase - Project phase (construction, commissioning, operations)
 * @returns {array} - Checklist items
 */
function getPhaseChecklist(phase) {
  const checklists = {
    construction: [
      { item: 'Arc flash risk assessment complete', standard: 'NFPA 70E 130.5', critical: true },
      { item: 'LOTO procedures for all equipment types', standard: 'OSHA 1910.147', critical: true },
      { item: 'Fall protection plan for elevated work', standard: 'OSHA 1926.502', critical: true },
      { item: 'Contractor pre-qualification verified', standard: 'Best practice', critical: false },
      { item: 'Fire watch procedures established', standard: 'NFPA 51B', critical: true },
      { item: 'Emergency action plan in place', standard: 'OSHA 1926.35', critical: true },
      { item: 'Daily coordination meeting process', standard: 'OSHA 1926.16', critical: false },
      { item: 'Work area barricading standards', standard: 'OSHA 1926.202', critical: false }
    ],
    commissioning: [
      { item: 'Pre-energization safety verification complete', standard: 'NFPA 70E 120.5', critical: true },
      { item: 'Arc flash labels installed on all equipment', standard: 'NFPA 70E 130.5(G)', critical: true },
      { item: 'Energized work permits process established', standard: 'NFPA 70E 130.2', critical: true },
      { item: 'Exclusion zones marked for initial energization', standard: 'NFPA 70E 130.4', critical: true },
      { item: 'IR scanning schedule established', standard: 'Best practice', critical: false },
      { item: 'Emergency response team briefed', standard: 'NFPA 70E 110.2', critical: true },
      { item: 'Torque verification documentation complete', standard: 'Best practice', critical: false }
    ],
    operations: [
      { item: 'Arc flash study current (within 5 years)', standard: 'NFPA 70E 130.5', critical: true },
      { item: 'LOTO annual inspection current', standard: 'OSHA 1910.147(c)(6)', critical: true },
      { item: 'Electrical safety training current', standard: 'NFPA 70E 110.6', critical: true },
      { item: 'Hot work permit program maintained', standard: 'NFPA 51B', critical: false },
      { item: 'Contractor safety program oversight', standard: 'OSHA Multi-employer', critical: false },
      { item: 'Emergency response drills conducted', standard: 'Best practice', critical: false }
    ]
  };

  return checklists[phase] || checklists.construction;
}

module.exports = {
  name,
  description,
  domains,
  respond,
  extractCitations,
  generateFollowUp,
  getQuickGuidance,
  getPhaseChecklist
};
