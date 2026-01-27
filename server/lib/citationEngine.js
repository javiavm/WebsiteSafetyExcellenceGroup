/**
 * Citation Engine
 * Provides regulatory citation lookup for safety recommendations
 * Supports OSHA, NFPA, ANSI, and other standards
 */

const citations = require('../data/osha-citations.json');

/**
 * Get citation by standard and section
 * @param {string} standard - Standard identifier (e.g., 'osha_1926', 'nfpa_70e')
 * @param {string} section - Section number (e.g., '502', '130.5')
 * @returns {object|null} - Citation object or null
 */
function getCitation(standard, section) {
  const standardData = citations.standards[standard];
  if (!standardData) return null;

  const sectionData = standardData.sections[section];
  if (!sectionData) return null;

  return {
    standard: standard,
    standardName: standardData.name,
    section: section,
    fullRef: `${standardData.prefix}${section}`,
    title: sectionData.title,
    summary: sectionData.summary,
    url: sectionData.url || standardData.baseUrl
  };
}

/**
 * Get citations by hazard category
 * @param {string} hazardCategory - Hazard category (e.g., 'fall_protection', 'electrical')
 * @returns {array} - Array of relevant citations
 */
function getCitationsByHazard(hazardCategory) {
  const mappings = citations.hazardMappings[hazardCategory];
  if (!mappings) return [];

  return mappings.map(ref => {
    const citation = getCitation(ref.standard, ref.section);
    return citation ? { ...citation, relevance: ref.relevance, context: ref.context } : null;
  }).filter(Boolean);
}

/**
 * Format citation for display
 * @param {object} citation - Citation object
 * @param {string} format - Output format ('text', 'html', 'markdown')
 * @returns {string} - Formatted citation
 */
function formatCitation(citation, format = 'text') {
  if (!citation) return '';

  switch (format) {
    case 'html':
      return `<span class="citation" data-ref="${citation.fullRef}">
        <strong>${citation.fullRef}</strong> - ${citation.title}
        <span class="citation-summary">${citation.summary}</span>
      </span>`;

    case 'markdown':
      return `**${citation.fullRef}** - ${citation.title}\n> ${citation.summary}`;

    case 'text':
    default:
      return `${citation.fullRef} - ${citation.title}: ${citation.summary}`;
  }
}

/**
 * Get primary citation for a specific control deficiency
 * @param {string} controlType - Type of control (e.g., 'guardrails', 'loto', 'arc_flash')
 * @returns {object} - Primary citation with recommendation
 */
function getPrimaryRecommendation(controlType) {
  const controlCitations = citations.controlRecommendations[controlType];
  if (!controlCitations) return null;

  const primaryCitation = getCitation(controlCitations.primary.standard, controlCitations.primary.section);
  if (!primaryCitation) return null;

  return {
    citation: primaryCitation,
    recommendation: controlCitations.recommendation,
    specificRequirements: controlCitations.specificRequirements || [],
    relatedStandards: (controlCitations.related || []).map(ref =>
      getCitation(ref.standard, ref.section)
    ).filter(Boolean)
  };
}

/**
 * Generate citation block for assessment results
 * @param {string} hazardId - Hazard identifier from STKY/SIF
 * @param {number} score - Current score
 * @returns {object} - Citation block for results display
 */
function generateCitationBlock(hazardId, score) {
  const hazardCitations = getCitationsByHazard(hazardId);
  if (hazardCitations.length === 0) return null;

  // Get primary citation (highest relevance)
  const primaryCitation = hazardCitations
    .sort((a, b) => (b.relevance || 50) - (a.relevance || 50))[0];

  // Generate severity-appropriate recommendation
  let recommendationLevel;
  if (score < 30) {
    recommendationLevel = 'critical';
  } else if (score < 50) {
    recommendationLevel = 'high';
  } else if (score < 70) {
    recommendationLevel = 'medium';
  } else {
    recommendationLevel = 'low';
  }

  return {
    hazardId,
    score,
    recommendationLevel,
    primaryCitation: {
      reference: primaryCitation.fullRef,
      title: primaryCitation.title,
      summary: primaryCitation.summary,
      context: primaryCitation.context
    },
    additionalCitations: hazardCitations.slice(1, 4).map(c => ({
      reference: c.fullRef,
      title: c.title
    })),
    actionStatement: generateActionStatement(hazardId, recommendationLevel, primaryCitation)
  };
}

/**
 * Generate action statement with citation
 * @param {string} hazardId - Hazard identifier
 * @param {string} level - Recommendation level
 * @param {object} citation - Primary citation
 * @returns {string} - Action statement
 */
function generateActionStatement(hazardId, level, citation) {
  const templates = {
    critical: `Immediate action required. Per ${citation.fullRef}, ${citation.summary.toLowerCase()}`,
    high: `Priority improvement needed. ${citation.fullRef} requires ${citation.summary.toLowerCase()}`,
    medium: `Enhancement recommended per ${citation.fullRef}: ${citation.title}`,
    low: `For continuous improvement, reference ${citation.fullRef}`
  };

  return templates[level] || templates.medium;
}

/**
 * Get all citations for a given industry context
 * @param {string} industry - Industry identifier (e.g., 'construction', 'general_industry')
 * @returns {array} - Array of relevant standards
 */
function getIndustryCitations(industry) {
  const industryStandards = citations.industryMappings[industry];
  if (!industryStandards) return [];

  return industryStandards.map(standardId => {
    const standard = citations.standards[standardId];
    if (!standard) return null;

    return {
      id: standardId,
      name: standard.name,
      prefix: standard.prefix,
      description: standard.description,
      keyTopics: standard.keyTopics || []
    };
  }).filter(Boolean);
}

/**
 * Search citations by keyword
 * @param {string} keyword - Search term
 * @param {number} limit - Max results
 * @returns {array} - Matching citations
 */
function searchCitations(keyword, limit = 10) {
  const results = [];
  const searchTerm = keyword.toLowerCase();

  for (const [standardId, standard] of Object.entries(citations.standards)) {
    for (const [sectionId, section] of Object.entries(standard.sections)) {
      const matchScore = calculateMatchScore(section, searchTerm);
      if (matchScore > 0) {
        results.push({
          standard: standardId,
          standardName: standard.name,
          section: sectionId,
          fullRef: `${standard.prefix}${sectionId}`,
          title: section.title,
          summary: section.summary,
          matchScore
        });
      }
    }
  }

  return results
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * Calculate match score for search
 */
function calculateMatchScore(section, searchTerm) {
  let score = 0;
  const title = (section.title || '').toLowerCase();
  const summary = (section.summary || '').toLowerCase();
  const keywords = (section.keywords || []).map(k => k.toLowerCase());

  if (title.includes(searchTerm)) score += 10;
  if (summary.includes(searchTerm)) score += 5;
  if (keywords.some(k => k.includes(searchTerm))) score += 8;

  return score;
}

module.exports = {
  getCitation,
  getCitationsByHazard,
  formatCitation,
  getPrimaryRecommendation,
  generateCitationBlock,
  getIndustryCitations,
  searchCitations,
  citations
};
