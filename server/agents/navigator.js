/**
 * Navigator Agent - Query Router
 * Routes incoming queries to appropriate SME specialist agents
 * Handles multi-domain questions by coordinating responses
 */

const Anthropic = require('@anthropic-ai/sdk');
const fallsSpecialist = require('./falls-specialist');
const electricalSpecialist = require('./electrical-specialist');
const dcSpecialist = require('./dc-specialist');
const generalSpecialist = require('./general-specialist');

// Agent registry
const AGENTS = {
  falls: fallsSpecialist,
  electrical: electricalSpecialist,
  dc: dcSpecialist,
  general: generalSpecialist
};

// Domain keywords for routing
const DOMAIN_KEYWORDS = {
  falls: [
    'fall protection', 'fall arrest', 'harness', 'lanyard', 'guardrail',
    'scaffold', 'scaffolding', 'aerial lift', 'ladder', 'leading edge',
    'anchor point', 'anchorage', 'SRL', 'self-retracting', 'PFAS',
    'walking surface', 'elevated work', 'roof work', 'floor opening',
    '6 foot', 'six foot', '1926.501', '1926.502', 'Z359', 'toeboard'
  ],
  electrical: [
    'arc flash', 'electrical', 'NFPA 70E', 'shock hazard', 'energized',
    'lockout tagout', 'LOTO', 'voltage', 'incident energy', 'PPE category',
    'qualified person', 'approach boundary', 'EEWP', 'deenergize',
    'GFCi', 'grounding', 'circuit', 'panel', 'switchgear', 'transformer',
    '1910.147', 'rubber gloves', 'arc-rated', 'cal/cm'
  ],
  dc: [
    'data center', 'datacenter', 'hyperscale', 'colocation', 'colo',
    'UPS', 'battery room', 'critical infrastructure', 'server room',
    'cooling system', 'raised floor', 'cable tray', 'commissioning',
    'power distribution', 'PDU', 'hot aisle', 'cold aisle', 'uptime'
  ]
};

/**
 * Classify query domain based on keywords
 * @param {string} query - User query
 * @returns {array} - Array of relevant domains
 */
function classifyQuery(query) {
  const queryLower = query.toLowerCase();
  const domains = [];

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const keyword of keywords) {
      if (queryLower.includes(keyword.toLowerCase())) {
        if (!domains.includes(domain)) {
          domains.push(domain);
        }
      }
    }
  }

  // Default to general if no specific domain matched
  if (domains.length === 0) {
    domains.push('general');
  }

  return domains;
}

/**
 * Get confidence score for domain match
 * @param {string} query - User query
 * @param {string} domain - Domain to check
 * @returns {number} - Confidence score 0-100
 */
function getDomainConfidence(query, domain) {
  const queryLower = query.toLowerCase();
  const keywords = DOMAIN_KEYWORDS[domain] || [];

  let matches = 0;
  for (const keyword of keywords) {
    if (queryLower.includes(keyword.toLowerCase())) {
      matches++;
    }
  }

  // Calculate confidence based on keyword density
  return Math.min(100, matches * 25);
}

/**
 * Route query to appropriate specialist(s)
 * @param {string} query - User query
 * @param {object} context - Additional context (industry, user tier, etc.)
 * @returns {object} - Routing decision
 */
function routeQuery(query, context = {}) {
  const domains = classifyQuery(query);

  // Calculate confidence for each domain
  const domainScores = domains.map(domain => ({
    domain,
    confidence: getDomainConfidence(query, domain),
    agent: AGENTS[domain] ? domain : 'general'
  }));

  // Sort by confidence
  domainScores.sort((a, b) => b.confidence - a.confidence);

  // Determine routing strategy
  let strategy = 'single';
  if (domainScores.length > 1 && domainScores[1].confidence > 50) {
    strategy = 'multi';
  }

  return {
    query,
    primaryDomain: domainScores[0],
    additionalDomains: domainScores.slice(1),
    strategy,
    context
  };
}

/**
 * Process query through specialist agent
 * @param {string} query - User query
 * @param {object} options - Processing options
 * @returns {Promise<object>} - Agent response
 */
async function processQuery(query, options = {}) {
  const routing = routeQuery(query, options.context || {});

  // Get primary agent
  const primaryAgent = AGENTS[routing.primaryDomain.domain] || AGENTS.general;

  try {
    // Get response from primary agent
    const response = await primaryAgent.respond(query, {
      ...options,
      routing
    });

    // If multi-domain query, get supplementary responses
    let supplementaryResponses = [];
    if (routing.strategy === 'multi' && options.includeSupplementary) {
      for (const additional of routing.additionalDomains.slice(0, 2)) {
        const agent = AGENTS[additional.domain];
        if (agent && agent !== primaryAgent) {
          const supplementary = await agent.respond(query, {
            ...options,
            routing,
            supplementary: true
          });
          supplementaryResponses.push({
            domain: additional.domain,
            response: supplementary
          });
        }
      }
    }

    return {
      success: true,
      routing,
      response: response,
      supplementary: supplementaryResponses,
      metadata: {
        primaryAgent: routing.primaryDomain.domain,
        confidence: routing.primaryDomain.confidence,
        strategy: routing.strategy
      }
    };

  } catch (error) {
    console.error('Navigator processQuery error:', error);
    return {
      success: false,
      error: error.message,
      routing,
      response: {
        answer: 'I apologize, but I encountered an issue processing your question. Please try rephrasing or contact SEG directly for assistance.',
        citations: []
      }
    };
  }
}

/**
 * Get available specialists
 * @returns {array} - Array of specialist info
 */
function getAvailableSpecialists() {
  return Object.entries(AGENTS).map(([id, agent]) => ({
    id,
    name: agent.name,
    description: agent.description,
    domains: agent.domains
  }));
}

/**
 * Direct query to specific specialist
 * @param {string} specialistId - Agent ID
 * @param {string} query - User query
 * @param {object} options - Processing options
 * @returns {Promise<object>} - Agent response
 */
async function querySpecialist(specialistId, query, options = {}) {
  const agent = AGENTS[specialistId];

  if (!agent) {
    return {
      success: false,
      error: `Unknown specialist: ${specialistId}`,
      availableSpecialists: Object.keys(AGENTS)
    };
  }

  try {
    const response = await agent.respond(query, options);
    return {
      success: true,
      specialist: specialistId,
      response
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      specialist: specialistId
    };
  }
}

module.exports = {
  classifyQuery,
  getDomainConfidence,
  routeQuery,
  processQuery,
  getAvailableSpecialists,
  querySpecialist,
  AGENTS,
  DOMAIN_KEYWORDS
};
