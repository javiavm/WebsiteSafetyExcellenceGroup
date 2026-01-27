/**
 * Benchmark Engine
 * Compares assessment scores against 50+ fab projects database
 * PRO feature - provides industry benchmarking
 */

const benchmarks = require('../data/benchmarks.json');

/**
 * Calculate percentile rank for a score
 * @param {number} score - User's score
 * @param {object} benchmarkData - { mean, median, p25, p75, p90 }
 * @returns {object} Percentile info
 */
function calculatePercentile(score, benchmarkData) {
  const { mean, median, p25, p75, p90 } = benchmarkData;

  let percentile;
  let label;

  if (score >= p90) {
    percentile = 90 + ((score - p90) / (100 - p90)) * 10;
    label = 'Top 10%';
  } else if (score >= p75) {
    percentile = 75 + ((score - p75) / (p90 - p75)) * 15;
    label = 'Top 25%';
  } else if (score >= median) {
    percentile = 50 + ((score - median) / (p75 - median)) * 25;
    label = 'Above Average';
  } else if (score >= p25) {
    percentile = 25 + ((score - p25) / (median - p25)) * 25;
    label = 'Average';
  } else {
    percentile = (score / p25) * 25;
    label = 'Below Average';
  }

  return {
    percentile: Math.round(Math.min(99, Math.max(1, percentile))),
    label,
    comparison: score >= mean ? 'above' : 'below',
    difference: score - mean
  };
}

/**
 * Get STKY benchmark comparison
 * @param {number} overallScore - Overall STKY score
 * @param {string} industry - Industry type
 * @param {object} hazardScores - Scores by hazard { hazardId: score }
 * @returns {object} Benchmark comparison
 */
function getSTKYBenchmark(overallScore, industry, hazardScores = {}) {
  const industryKey = industry?.toLowerCase().replace(/\s+/g, '_') || 'other';
  const industryData = benchmarks.stky.byIndustry[industryKey] || benchmarks.stky.byIndustry.other;
  const overallData = benchmarks.stky.overall;

  // Overall comparison
  const overallPercentile = calculatePercentile(overallScore, overallData);
  const industryPercentile = calculatePercentile(overallScore, industryData);

  // Hazard comparisons
  const hazardBenchmarks = {};
  for (const [hazardId, score] of Object.entries(hazardScores)) {
    const hazardData = benchmarks.stky.byHazard[hazardId];
    if (hazardData) {
      hazardBenchmarks[hazardId] = {
        score,
        industryMean: hazardData.mean,
        percentile: calculatePercentile(score, hazardData)
      };
    }
  }

  // Find strengths and weaknesses relative to benchmark
  const sortedHazards = Object.entries(hazardBenchmarks)
    .map(([id, data]) => ({ id, ...data, delta: data.score - data.industryMean }))
    .sort((a, b) => b.delta - a.delta);

  const strengths = sortedHazards.filter(h => h.delta > 5).slice(0, 3);
  const weaknesses = sortedHazards.filter(h => h.delta < -5).slice(-3).reverse();

  return {
    overall: {
      score: overallScore,
      industryMean: industryData.mean,
      allProjectsMean: overallData.mean,
      percentile: overallPercentile.percentile,
      percentileLabel: overallPercentile.label,
      industryPercentile: industryPercentile.percentile,
      comparison: overallPercentile.comparison,
      difference: overallPercentile.difference
    },
    industry: {
      name: industry || 'All Industries',
      mean: industryData.mean,
      median: industryData.median
    },
    hazards: hazardBenchmarks,
    insights: {
      strengths: strengths.map(s => ({
        hazard: s.id,
        score: s.score,
        industryMean: s.industryMean,
        message: `${s.delta}+ points above industry average`
      })),
      weaknesses: weaknesses.map(w => ({
        hazard: w.id,
        score: w.score,
        industryMean: w.industryMean,
        message: `${Math.abs(w.delta)} points below industry average`
      }))
    },
    summary: generateSTKYSummary(overallScore, industryData, overallPercentile)
  };
}

/**
 * Get SIF benchmark comparison
 * @param {number} overallScore - Overall SIF score
 * @param {string} industry - Industry type
 * @param {object} scenarioResults - { correct, total, blindSpots }
 * @returns {object} Benchmark comparison
 */
function getSIFBenchmark(overallScore, industry, scenarioResults = {}) {
  const industryKey = industry?.toLowerCase().replace(/\s+/g, '_') || 'other';
  const industryData = benchmarks.sif.byIndustry[industryKey] || benchmarks.sif.byIndustry.other;
  const overallData = benchmarks.sif.overall;
  const scenarioData = benchmarks.sif.scenarioAccuracy;

  // Overall comparison
  const overallPercentile = calculatePercentile(overallScore, overallData);
  const industryPercentile = calculatePercentile(overallScore, industryData);

  // Scenario accuracy comparison
  let scenarioBenchmark = null;
  if (scenarioResults.correct !== undefined && scenarioResults.total) {
    const accuracy = (scenarioResults.correct / scenarioResults.total) * 100;
    scenarioBenchmark = {
      accuracy: Math.round(accuracy),
      industryMean: scenarioData.mean,
      comparison: accuracy >= scenarioData.mean ? 'above' : 'below',
      difference: Math.round(accuracy - scenarioData.mean)
    };
  }

  // Blind spot analysis
  const blindSpotInsights = [];
  if (scenarioResults.blindSpots?.length) {
    for (const bs of scenarioResults.blindSpots) {
      const commonBS = scenarioData.commonBlindSpots.find(c =>
        bs.toLowerCase().includes(c.type.replace(/_/g, ' ').split(' ')[0])
      );
      if (commonBS) {
        blindSpotInsights.push({
          blindSpot: bs,
          industryMissRate: commonBS.missRate,
          message: `${commonBS.missRate}% of safety programs have this same blind spot`
        });
      }
    }
  }

  return {
    overall: {
      score: overallScore,
      industryMean: industryData.mean,
      allProjectsMean: overallData.mean,
      percentile: overallPercentile.percentile,
      percentileLabel: overallPercentile.label,
      industryPercentile: industryPercentile.percentile,
      comparison: overallPercentile.comparison,
      difference: overallPercentile.difference
    },
    industry: {
      name: industry || 'All Industries',
      mean: industryData.mean,
      median: industryData.median
    },
    scenarios: scenarioBenchmark,
    blindSpotInsights,
    summary: generateSIFSummary(overallScore, industryData, overallPercentile, scenarioBenchmark)
  };
}

/**
 * Generate STKY summary text
 */
function generateSTKYSummary(score, industryData, percentile) {
  const lines = [];

  if (percentile.percentile >= 75) {
    lines.push(`Your hazard control maturity score of ${score} places you in the ${percentile.label} of all assessed programs.`);
  } else if (percentile.percentile >= 50) {
    lines.push(`Your score of ${score} is ${percentile.comparison} the industry average of ${industryData.mean}.`);
  } else {
    lines.push(`Your score of ${score} indicates significant opportunities for improvement compared to industry benchmarks.`);
  }

  if (percentile.comparison === 'above') {
    lines.push(`You're ${Math.abs(percentile.difference)} points above the industry average.`);
  } else {
    lines.push(`Closing the ${Math.abs(percentile.difference)}-point gap to industry average should be a priority.`);
  }

  return lines.join(' ');
}

/**
 * Generate SIF summary text
 */
function generateSIFSummary(score, industryData, percentile, scenarioBenchmark) {
  const lines = [];

  lines.push(`Your P-SIF recognition score of ${score} ranks in the ${percentile.label} of assessed programs.`);

  if (scenarioBenchmark) {
    if (scenarioBenchmark.comparison === 'above') {
      lines.push(`Your scenario classification accuracy of ${scenarioBenchmark.accuracy}% exceeds the industry average of ${scenarioBenchmark.industryMean}%.`);
    } else {
      lines.push(`Your scenario accuracy of ${scenarioBenchmark.accuracy}% has room for improvement vs. the ${scenarioBenchmark.industryMean}% industry average.`);
    }
  }

  return lines.join(' ');
}

/**
 * Get trend data for a user's assessments
 * @param {array} assessments - Array of past assessments
 * @returns {object} Trend analysis
 */
function getTrendAnalysis(assessments) {
  if (!assessments || assessments.length < 2) {
    return null;
  }

  // Sort by date
  const sorted = [...assessments].sort((a, b) =>
    new Date(a.created_at) - new Date(b.created_at)
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const firstScore = first.scores?.overall?.score || 0;
  const lastScore = last.scores?.overall?.score || 0;
  const change = lastScore - firstScore;

  return {
    assessmentCount: assessments.length,
    firstAssessment: {
      date: first.created_at,
      score: firstScore
    },
    latestAssessment: {
      date: last.created_at,
      score: lastScore
    },
    change: {
      points: change,
      direction: change > 0 ? 'improved' : change < 0 ? 'declined' : 'unchanged',
      percentage: firstScore > 0 ? Math.round((change / firstScore) * 100) : 0
    },
    timeline: sorted.map(a => ({
      date: a.created_at,
      score: a.scores?.overall?.score || 0
    }))
  };
}

module.exports = {
  getSTKYBenchmark,
  getSIFBenchmark,
  getTrendAnalysis,
  calculatePercentile,
  benchmarks
};
