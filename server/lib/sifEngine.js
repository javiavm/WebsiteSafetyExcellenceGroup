/**
 * SIF Assessment Scoring Engine
 * Calculates precursor scores, handles STKY overlap, generates results
 */

const sifConfig = require('../data/sif-config.json');

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
 * Identify gaps for a precursor based on responses
 * @param {string} precursorId - Precursor identifier
 * @param {object} answers - { questionId: value }
 * @returns {array} - Array of gap objects
 */
function identifyGaps(precursorId, answers) {
  const gaps = [];
  const precursor = sifConfig.precursors[precursorId];

  if (!precursor) return gaps;

  for (const [qId, value] of Object.entries(answers)) {
    const question = precursor.questions.find(q => q.id === qId);
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
 * Get precursors for path (excluding STKY overlap if data available)
 * @param {string} pathId - Path identifier
 * @param {boolean} hasSTKYData - Whether STKY data is available
 * @returns {array} - Array of precursor IDs to assess
 */
function getPrecursorsForPath(pathId, hasSTKYData = false) {
  const path = sifConfig.paths[pathId];
  if (!path) return [];

  // Get all net-new precursors (not in STKY overlap)
  const netNewPrecursors = Object.keys(sifConfig.precursors);

  switch (path.flow) {
    case 'single_event':
      // For close_call classification, no precursor questions
      return [];

    case 'classification':
      // Scenarios only, no precursor questions
      return [];

    case 'full_precursors':
      // Return all net-new precursors
      return netNewPrecursors;

    default:
      return netNewPrecursors;
  }
}

/**
 * Calculate SIF assessment scores
 * @param {object} responses - { precursors: { precursorId: { qId: value } }, scenarios?: [] }
 * @param {object} context - Context responses
 * @param {object} stkyScores - Optional STKY hazard scores to incorporate
 * @returns {object} - Full scoring results
 */
function scoreSIF(responses, context, stkyScores = null) {
  const precursorScores = {};
  let totalWeightedScore = 0;
  let totalWeight = 0;

  // Score net-new precursors from responses
  for (const [precursorId, answers] of Object.entries(responses.precursors || {})) {
    const precursor = sifConfig.precursors[precursorId];
    if (!precursor) continue;

    let precursorTotal = 0;
    let questionCount = 0;

    for (const [qId, value] of Object.entries(answers)) {
      const question = precursor.questions.find(q => q.id === qId);
      if (!question) continue;

      const option = question.options.find(o => o.value === value);
      if (!option) continue;

      precursorTotal += option.score;
      questionCount++;
    }

    if (questionCount === 0) continue;

    const precursorScore = Math.round(precursorTotal / questionCount);
    const gaps = identifyGaps(precursorId, answers);

    precursorScores[precursorId] = {
      name: precursor.name,
      score: precursorScore,
      rating: getRating(precursorScore),
      weight: precursor.weight,
      questionCount,
      gaps,
      source: 'sif'
    };

    totalWeightedScore += precursorScore * precursor.weight;
    totalWeight += precursor.weight;
  }

  // Incorporate STKY scores if available (overlap categories)
  if (stkyScores && stkyScores.hazards) {
    for (const [hazardId, hazardData] of Object.entries(stkyScores.hazards)) {
      if (sifConfig.stkyOverlap.includes(hazardId)) {
        // Map STKY hazard to SIF with default weight
        const defaultWeight = 5;
        precursorScores[hazardId] = {
          name: hazardData.name,
          score: hazardData.score,
          rating: getRating(hazardData.score),
          weight: defaultWeight,
          questionCount: hazardData.questionCount,
          gaps: hazardData.gaps || [],
          source: 'stky'
        };

        totalWeightedScore += hazardData.score * defaultWeight;
        totalWeight += defaultWeight;
      }
    }
  }

  // Calculate overall weighted score
  const overallScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;

  // Score scenarios if present
  let scenarioResults = null;
  if (responses.scenarios && responses.scenarios.length > 0) {
    scenarioResults = scoreScenarios(responses.scenarios);
  }

  // Collect all gaps
  const allGaps = [];
  for (const [precursorId, data] of Object.entries(precursorScores)) {
    data.gaps.forEach(gap => {
      allGaps.push({
        ...gap,
        precursor: data.name,
        precursorId,
        weight: data.weight
      });
    });
  }

  // Sort gaps by weighted severity
  allGaps.sort((a, b) => {
    if (a.gap === 'critical' && b.gap !== 'critical') return -1;
    if (a.gap !== 'critical' && b.gap === 'critical') return 1;
    // Higher weight = more important
    if (a.weight !== b.weight) return b.weight - a.weight;
    return a.currentScore - b.currentScore;
  });

  const recommendations = generateRecommendations(precursorScores, scenarioResults, context);

  return {
    overall: {
      score: overallScore,
      rating: getRating(overallScore),
      precursorCount: Object.keys(precursorScores).length,
      stkyIntegrated: stkyScores !== null
    },
    precursors: precursorScores,
    scenarios: scenarioResults,
    gaps: allGaps,
    recommendations,
    context
  };
}

/**
 * Score scenario responses
 * @param {array} scenarios - Array of { scenarioId, answer }
 * @returns {object} - Scenario scoring results
 */
function scoreScenarios(scenarioResponses) {
  let correct = 0;
  let total = scenarioResponses.length;
  const blindSpots = [];
  const details = [];

  for (const response of scenarioResponses) {
    const scenario = sifConfig.scenarios.find(s => s.id === response.scenarioId);
    if (!scenario) continue;

    const userSaidPSIF = response.answer === 'sif';
    const isCorrect = userSaidPSIF === scenario.isPSIF;

    if (isCorrect) {
      correct++;
    } else if (scenario.isPSIF && scenario.blindSpot) {
      // Missed a P-SIF - track blind spot
      if (!blindSpots.includes(scenario.blindSpot)) {
        blindSpots.push(scenario.blindSpot);
      }
    }

    details.push({
      scenarioId: scenario.id,
      description: scenario.description,
      userAnswer: response.answer,
      correctAnswer: scenario.isPSIF ? 'sif' : 'routine',
      isCorrect,
      explanation: scenario.explanation,
      missRate: scenario.missRate
    });
  }

  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  return {
    score,
    correct,
    total,
    rating: getRating(score),
    blindSpots,
    details
  };
}

/**
 * Generate recommendations based on scores
 * @param {object} precursorScores - Precursor scoring data
 * @param {object} scenarioResults - Scenario scoring results
 * @param {object} context - Context responses
 * @returns {array} - Array of recommendations
 */
function generateRecommendations(precursorScores, scenarioResults, context) {
  const recs = [];

  // Precursor-based recommendations
  for (const [precursorId, data] of Object.entries(precursorScores)) {
    if (data.score < 50) {
      recs.push({
        precursor: data.name,
        precursorId,
        type: 'critical_precursor',
        priority: 'high',
        message: `${data.name} controls are below acceptable threshold. Immediate review recommended.`
      });
    } else if (data.score < 70) {
      recs.push({
        precursor: data.name,
        precursorId,
        type: 'improvement_needed',
        priority: 'medium',
        message: `${data.name} controls need strengthening to reach industry standard.`
      });
    }
  }

  // Scenario-based recommendations (blind spots)
  if (scenarioResults && scenarioResults.blindSpots.length > 0) {
    recs.push({
      type: 'classification_gap',
      priority: 'high',
      message: `P-SIF classification gaps identified: ${scenarioResults.blindSpots.join(', ')}`,
      blindSpots: scenarioResults.blindSpots
    });
  }

  // Classification method recommendation
  if (context.classification_method === 'gut' || context.classification_method === 'none') {
    recs.push({
      type: 'classification_system',
      priority: 'high',
      message: 'Implement energy-based P-SIF classification to replace subjective methods.'
    });
  }

  // Review process recommendation
  if (context.reviewer === 'no_one') {
    recs.push({
      type: 'review_process',
      priority: 'high',
      message: 'Establish consistent near-miss review process to identify P-SIF events.'
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs;
}

/**
 * Get questions for a specific precursor
 * @param {string} precursorId - Precursor identifier
 * @returns {array} - Array of questions
 */
function getPrecursorQuestions(precursorId) {
  const precursor = sifConfig.precursors[precursorId];
  return precursor ? precursor.questions : [];
}

/**
 * Get scenarios for classification flow
 * @returns {array} - Array of scenarios
 */
function getScenarios() {
  return sifConfig.scenarios.map(s => ({
    id: s.id,
    description: s.description,
    isPSIF: s.isPSIF,
    explanation: s.explanation,
    missRate: s.missRate,
    blindSpot: s.blindSpot
  }));
}

/**
 * Get all config data for frontend
 * @returns {object} - Config data
 */
function getConfig() {
  return {
    paths: sifConfig.paths,
    context: sifConfig.context,
    precursors: Object.entries(sifConfig.precursors).reduce((acc, [id, p]) => {
      acc[id] = {
        id: p.id,
        name: p.name,
        weight: p.weight,
        questionCount: p.questions.length
      };
      return acc;
    }, {}),
    stkyOverlap: sifConfig.stkyOverlap,
    scenarioCount: sifConfig.scenarios.length
  };
}

/**
 * Get the P-SIF filter prompt for AI classification
 * @returns {string} - System prompt
 */
function getFilterPrompt() {
  return sifConfig.filterPrompt;
}

module.exports = {
  getRating,
  identifyGaps,
  getPrecursorsForPath,
  scoreSIF,
  scoreScenarios,
  generateRecommendations,
  getPrecursorQuestions,
  getScenarios,
  getConfig,
  getFilterPrompt,
  config: sifConfig
};
