const DATA = require('../data/sif-scenarios.json');

function getScenarios(count = 5) {
    // Shuffle and pick scenarios
    const shuffled = [...DATA.scenarios].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function assessSIF(responses, industry) {
    let correct = 0;
    const missed = [];
    const blindSpots = {};

    responses.forEach(r => {
        const scenario = DATA.scenarios.find(s => s.id === r.scenarioId);
        if (!scenario) return;

        const userSaidPSIF = r.answer === 'sif';
        const isCorrect = userSaidPSIF === scenario.isPSIF;

        if (isCorrect) {
            correct++;
        } else {
            missed.push({
                scenarioId: scenario.id,
                description: scenario.description,
                actualPSIF: scenario.isPSIF,
                explanation: scenario.explanation
            });

            // Track blind spots (only for P-SIFs they missed)
            if (scenario.isPSIF && scenario.blindSpot) {
                blindSpots[scenario.blindSpot] = (blindSpots[scenario.blindSpot] || 0) + 1;
            }
        }
    });

    const total = responses.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Sort blind spots by frequency
    const sortedBlindSpots = Object.entries(blindSpots)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name);

    // Get industry stats for blind spots
    const industryStats = DATA.blindSpotStats[industry] || DATA.blindSpotStats.construction;
    const blindSpotPercentages = sortedBlindSpots.map(bs => ({
        name: bs,
        industryPercent: industryStats[bs] || 20
    }));

    // Calculate total industry SIF percentage from blind spots
    const totalIndustryPercent = blindSpotPercentages.reduce((sum, bs) => sum + bs.industryPercent, 0);

    return {
        score,
        correct,
        missed: missed.length,
        total,
        blindSpots: sortedBlindSpots.slice(0, 3),
        blindSpotDetails: blindSpotPercentages.slice(0, 3),
        industryPercent: Math.min(totalIndustryPercent, 85),
        message: correct === total
            ? "You see P-SIFs others miss. You're in the top 12%."
            : "You see near-misses the way most safety managers do."
    };
}

function getBlindSpotStats(industry) {
    return DATA.blindSpotStats[industry] || DATA.blindSpotStats.construction;
}

module.exports = {
    getScenarios,
    assessSIF,
    getBlindSpotStats,
    DATA
};
