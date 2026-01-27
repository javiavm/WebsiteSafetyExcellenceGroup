/**
 * STKY Assessment Scoring Engine
 * Calculates scores, identifies gaps, generates recommendations
 */

const stkyConfig = require('../data/stky-config.json');

/**
 * Get rating based on score
 * @param {number} score - Score 0-100
 * @returns {object} - { label, color }
 */
function getRating(score) {
  if (score >= 85) return { label: 'Controlled', color: '#22C55E' };
  if (score >= 70) return { label: 'Managed', color: '#FFCF00' };
  if (score >= 50) return { label: 'Developing', color: '#F97316' };
  return { label: 'Exposed', color: '#EF4444' };
}

/**
 * Identify gaps for a hazard based on responses
 * @param {string} hazardId - Hazard identifier
 * @param {object} answers - { questionId: value }
 * @returns {array} - Array of gap objects
 */
function identifyGaps(hazardId, answers) {
  const gaps = [];
  const hazard = stkyConfig.hazards[hazardId];

  if (!hazard) return gaps;

  for (const [qId, value] of Object.entries(answers)) {
    const question = hazard.questions.find(q => q.id === qId);
    if (!question) continue;

    const option = question.options.find(o => o.value === value);
    if (!option) continue;

    if (option.score < 60) {
      gaps.push({
        questionId: qId,
        question: question.question,
        current: option.label,
        currentScore: option.score,
        gap: option.score < 30 ? 'critical' : 'notable'
      });
    }
  }

  return gaps;
}

/**
 * Generate recommendations based on hazard scores and context
 * @param {object} hazardScores - { hazardId: { score, rating, gaps } }
 * @param {object} context - Context responses
 * @returns {array} - Array of recommendation objects
 */
function generateRecommendations(hazardScores, context) {
  const recs = [];

  for (const [hazardId, data] of Object.entries(hazardScores)) {
    const hazard = stkyConfig.hazards[hazardId];
    if (!hazard) continue;

    // Third-party audit recommendation
    const auditGap = data.gaps.find(g => g.question.toLowerCase().includes('audit'));
    if (data.score < 70 && (!auditGap || auditGap.current === 'Never')) {
      recs.push({
        hazard: hazard.name,
        hazardId: hazardId,
        type: 'third_party_audit',
        priority: data.score < 50 ? 'high' : 'medium',
        message: 'Third-party assessment would surface gaps internal reviews miss.'
      });
    }

    // Critical gaps recommendations
    const criticalGaps = data.gaps.filter(g => g.gap === 'critical');
    if (criticalGaps.length > 0) {
      recs.push({
        hazard: hazard.name,
        hazardId: hazardId,
        type: 'critical_gap',
        priority: 'high',
        message: `Critical gaps in: ${criticalGaps.map(g => g.question).join('; ')}`,
        gaps: criticalGaps
      });
    }

    // Contractor-specific recommendations for mixed workforce
    if (context.workforce === 'contractors' || context.workforce === 'mixed') {
      const contractorGap = data.gaps.find(g =>
        g.question.toLowerCase().includes('contractor')
      );
      if (contractorGap) {
        recs.push({
          hazard: hazard.name,
          hazardId: hazardId,
          type: 'contractor',
          priority: 'medium',
          message: 'Contractor integration gaps identified. Consider site-specific orientation enhancement.'
        });
      }
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs;
}

/**
 * Get hazards for path and industry
 * @param {string} pathId - Path identifier
 * @param {string} industry - Industry identifier
 * @returns {array} - Array of hazard IDs to assess
 */
function getHazardsForPath(pathId, industry) {
  const path = stkyConfig.paths[pathId];
  if (!path) return [];

  switch (path.flow) {
    case 'single_hazard':
      // For close_call, return top hazard for industry
      return stkyConfig.industryTopHazards[industry]?.slice(0, 1) || [];

    case 'top_hazards':
      // Return top 3 hazards for industry
      return stkyConfig.industryTopHazards[industry] || [];

    case 'all_hazards':
      // Return all hazards for industry
      return stkyConfig.industryHazards[industry] || Object.keys(stkyConfig.hazards);

    default:
      return Object.keys(stkyConfig.hazards);
  }
}

/**
 * Calculate STKY assessment scores
 * @param {object} responses - { hazards: { hazardId: { qId: value } } }
 * @param {object} context - Context responses
 * @returns {object} - Full scoring results
 */
function scoreSTKY(responses, context) {
  const hazardScores = {};
  let totalScore = 0;
  let hazardCount = 0;
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const [hazardId, answers] of Object.entries(responses.hazards || {})) {
    const hazard = stkyConfig.hazards[hazardId];
    if (!hazard) continue;

    let hazardTotal = 0;
    let questionCount = 0;

    for (const [qId, value] of Object.entries(answers)) {
      const question = hazard.questions.find(q => q.id === qId);
      if (!question) continue;

      const option = question.options.find(o => o.value === value);
      if (!option) continue;

      hazardTotal += option.score;
      questionCount++;
    }

    if (questionCount === 0) continue;

    const hazardScore = Math.round(hazardTotal / questionCount);
    const gaps = identifyGaps(hazardId, answers);

    hazardScores[hazardId] = {
      name: hazard.name,
      score: hazardScore,
      rating: getRating(hazardScore),
      questionCount,
      gaps
    };

    totalScore += hazardScore;
    hazardCount++;

    // Weighted scoring (all hazards equal weight for STKY)
    totalWeightedScore += hazardScore;
    totalWeight += 1;
  }

  const overallScore = hazardCount > 0 ? Math.round(totalScore / hazardCount) : 0;

  // Collect all gaps across hazards
  const allGaps = [];
  for (const [hazardId, data] of Object.entries(hazardScores)) {
    data.gaps.forEach(gap => {
      allGaps.push({
        ...gap,
        hazard: data.name,
        hazardId
      });
    });
  }

  // Sort gaps by severity
  allGaps.sort((a, b) => {
    if (a.gap === 'critical' && b.gap !== 'critical') return -1;
    if (a.gap !== 'critical' && b.gap === 'critical') return 1;
    return a.currentScore - b.currentScore;
  });

  const recommendations = generateRecommendations(hazardScores, context);

  return {
    overall: {
      score: overallScore,
      rating: getRating(overallScore),
      hazardCount
    },
    hazards: hazardScores,
    gaps: allGaps,
    recommendations,
    context
  };
}

/**
 * Get questions for a specific hazard
 * @param {string} hazardId - Hazard identifier
 * @returns {array} - Array of questions
 */
function getHazardQuestions(hazardId) {
  const hazard = stkyConfig.hazards[hazardId];
  return hazard ? hazard.questions : [];
}

/**
 * Get all config data (paths, context questions, etc.)
 * @returns {object} - Config data for frontend
 */
function getConfig() {
  return {
    paths: stkyConfig.paths,
    context: stkyConfig.context,
    hazards: Object.entries(stkyConfig.hazards).reduce((acc, [id, h]) => {
      acc[id] = {
        id: h.id,
        name: h.name,
        questionCount: h.questions.length
      };
      return acc;
    }, {}),
    industryHazards: stkyConfig.industryHazards,
    industryTopHazards: stkyConfig.industryTopHazards
  };
}

module.exports = {
  getRating,
  identifyGaps,
  generateRecommendations,
  getHazardsForPath,
  scoreSTKY,
  getHazardQuestions,
  getConfig,
  config: stkyConfig
};
