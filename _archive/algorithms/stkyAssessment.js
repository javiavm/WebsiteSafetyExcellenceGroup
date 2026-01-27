const DATA = require('../data/stky-hazards.json');

function getHazardsForIndustry(industry) {
    const hazardIds = DATA.industryHazards[industry] || DATA.industryHazards.construction;
    return hazardIds.map(id => ({
        id,
        name: DATA.hazards[id].name,
        icon: DATA.hazards[id].icon
    }));
}

function getIndustryStat(industry) {
    return DATA.industryStats[industry] || 10;
}

function getInsight(hazardId) {
    return DATA.insights[hazardId] || '';
}

function getQuestion(hazardId) {
    return DATA.questions[hazardId] || { main: '', followUp: [] };
}

function assessSTKY(responses, industry) {
    const total = responses.length;
    let controlled = 0, exposed = 0, uncertain = 0;
    const exposures = [];

    responses.forEach(r => {
        if (r.status === 'controlled') controlled++;
        else if (r.status === 'exposed') {
            exposed++;
            exposures.push(r.hazardId);
        } else {
            uncertain++;
            exposures.push(r.hazardId); // uncertain counts as exposure
        }
    });

    const score = total > 0 ? Math.round((controlled / total) * 100) : 0;
    const rating = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 50 ? 'Fair' : 'Critical';

    // Top exposure is first exposed/uncertain hazard
    const topExposure = exposures[0] || responses[0]?.hazardId;

    return {
        score,
        rating,
        total,
        controlled,
        exposed,
        uncertain,
        exposures,
        topExposure,
        insight: getInsight(topExposure),
        question: getQuestion(topExposure),
        hazardName: DATA.hazards[topExposure]?.name || '',
        hazardIcon: DATA.hazards[topExposure]?.icon || '',
        industryStat: getIndustryStat(industry),
        message: score < 75
            ? "You're in the same range as sites that had fatalities last year."
            : "Solid control. But one gap is all it takes."
    };
}

function generateEmail(user, results) {
    const q = results.question;
    return `${user.name},

You scored ${results.score}%. Your top exposure: ${results.hazardName}.

Here's what I'd ask if I walked your site tomorrow:

THE QUESTION: ${q.main}

Two more:

1. ${q.followUp[0]}
2. ${q.followUp[1]}

If you hesitated on any of these, that's your signal.

— Safety Excellence Group
469.988.4777`;
}

module.exports = {
    assessSTKY,
    getHazardsForIndustry,
    getIndustryStat,
    getInsight,
    getQuestion,
    generateEmail,
    DATA
};
