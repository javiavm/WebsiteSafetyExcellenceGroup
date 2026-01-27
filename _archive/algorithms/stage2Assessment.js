/**
 * Stage 2 A-Player Assessment - WHO Method Implementation
 * Deep interview scoring with NLP analysis
 *
 * This runs AFTER Stage 1 (candidateScoring.js) for candidates rated B+ or higher
 * Uses WHO Method questions to identify true A-Players
 */

// Question weights (total: 100 points)
const QUESTION_WEIGHTS = {
    careerGoals: 15,      // Q1: What are you looking to accomplish in your career?
    strengths: 15,        // Q2: What are your greatest professional strengths?
    weaknesses: 10,       // Q3: What are areas you're actively working to improve?
    bossRatings: 15,      // Q4: How would your last 3 supervisors rate you 1-10?
    accountability: 10,   // Q5: Tell me about a time you made a mistake at work
    integrity: 10,        // Q6: Describe a situation where you had to choose between safety and schedule
    problemSolving: 15,   // Q7: Walk me through your approach to a complex safety challenge
    drivingForce: 10      // Q8: What motivates you to excel in safety?
};

// Positive signals in responses (add points)
const POSITIVE_SIGNALS = {
    specificity: ['specifically', 'for example', 'instance', 'quantif', 'measur', 'percent', 'reduced', 'increased', 'improved'],
    methodology: ['process', 'system', 'approach', 'method', 'framework', 'procedure', 'step-by-step', 'root cause'],
    ownership: ['I led', 'I initiated', 'I developed', 'I created', 'my responsibility', 'I took', 'I owned', 'I drove'],
    growth: ['learned', 'improved', 'developed', 'grew', 'feedback', 'mentor', 'training', 'certification'],
    safety_priority: ['non-negotiable', 'stop work', 'refused', 'escalated', 'reported', 'documented', 'zero tolerance'],
    results: ['result', 'outcome', 'achieved', 'accomplished', 'delivered', 'success', 'impact']
};

// Red flags in responses (subtract points)
const RED_FLAGS = {
    vagueness: ['stuff', 'things', 'whatever', 'you know', 'kind of', 'sort of', 'basically'],
    blaming: ['their fault', 'they didn\'t', 'management', 'wasn\'t my', 'they should have', 'not my job'],
    safety_compromise: ['had to', 'no choice', 'pressure', 'deadline', 'just this once', 'exception'],
    deflection: ['never happened', 'can\'t think of', 'not applicable', 'don\'t remember', 'perfect record'],
    overconfidence: ['always', 'never', 'perfect', '10 out of 10', 'no weaknesses', 'flawless']
};

/**
 * Score a single response using NLP analysis
 */
function scoreResponse(response, questionType) {
    const maxScore = QUESTION_WEIGHTS[questionType] || 10;
    const responseLower = (response || '').toLowerCase();
    const words = responseLower.split(/\s+/).length;

    let score = maxScore * 0.5;
    const signals = [];
    const flags = [];

    if (words < 20) {
        score -= maxScore * 0.2;
        flags.push('Response too brief');
    } else if (words > 50) {
        score += maxScore * 0.1;
        signals.push('Detailed response');
    }

    Object.entries(POSITIVE_SIGNALS).forEach(([category, keywords]) => {
        keywords.forEach(keyword => {
            if (responseLower.includes(keyword.toLowerCase())) {
                score += maxScore * 0.05;
                if (!signals.includes(category)) signals.push(category);
            }
        });
    });

    Object.entries(RED_FLAGS).forEach(([category, keywords]) => {
        keywords.forEach(keyword => {
            if (responseLower.includes(keyword.toLowerCase())) {
                score -= maxScore * 0.1;
                if (!flags.includes(category)) flags.push(category);
            }
        });
    });

    if (questionType === 'bossRatings') {
        const numbers = response.match(/\b([1-9]|10)\b/g);
        if (numbers && numbers.length >= 2) {
            const avg = numbers.map(Number).reduce((a, b) => a + b, 0) / numbers.length;
            if (avg >= 8) score += maxScore * 0.2;
            else if (avg >= 6) score += maxScore * 0.1;
            else if (avg < 5) score -= maxScore * 0.2;
            signals.push(`Boss rating avg: ${avg.toFixed(1)}`);
        }
    }

    if (questionType === 'integrity') {
        if (responseLower.includes('stop') || responseLower.includes('refused') || responseLower.includes('escalat')) {
            score += maxScore * 0.2;
            signals.push('Demonstrated stop-work authority');
        }
    }

    if (questionType === 'accountability') {
        if (responseLower.includes('my fault') || responseLower.includes('i should have') || responseLower.includes('i was responsible')) {
            score += maxScore * 0.2;
            signals.push('Took personal accountability');
        }
    }

    score = Math.min(Math.max(Math.round(score), 0), maxScore);

    return { score, maxScore, signals, flags };
}

/**
 * Score complete Stage 2 assessment
 */
function scoreStage2Assessment(responses) {
    const results = {
        questionScores: {},
        totalScore: 0,
        maxPossible: 100,
        rating: '',
        summary: '',
        strengths: [],
        concerns: [],
        recommendation: ''
    };

    Object.keys(QUESTION_WEIGHTS).forEach(questionType => {
        const response = responses[questionType] || '';
        const questionResult = scoreResponse(response, questionType);
        results.questionScores[questionType] = questionResult;
        results.totalScore += questionResult.score;

        if (questionResult.signals.length > 0 && questionResult.score >= questionResult.maxScore * 0.7) {
            results.strengths.push(...questionResult.signals);
        }
        if (questionResult.flags.length > 0) {
            results.concerns.push(...questionResult.flags);
        }
    });

    results.strengths = [...new Set(results.strengths)];
    results.concerns = [...new Set(results.concerns)];

    if (results.totalScore >= 85) {
        results.rating = 'A+';
        results.summary = 'Exceptional candidate - Top priority';
        results.recommendation = 'FAST TRACK: Schedule immediately for client matching';
    } else if (results.totalScore >= 75) {
        results.rating = 'A';
        results.summary = 'Strong A-Player candidate';
        results.recommendation = 'PRIORITIZE: Strong fit for most client needs';
    } else if (results.totalScore >= 65) {
        results.rating = 'B+';
        results.summary = 'Good candidate with some concerns';
        results.recommendation = 'CONSIDER: May need coaching or specific role matching';
    } else if (results.totalScore >= 50) {
        results.rating = 'B';
        results.summary = 'Average candidate';
        results.recommendation = 'HOLD: Revisit if specific need arises';
    } else if (results.totalScore >= 35) {
        results.rating = 'C';
        results.summary = 'Below average - significant concerns';
        results.recommendation = 'ARCHIVE: Does not meet A-Player criteria';
    } else {
        results.rating = 'D';
        results.summary = 'Poor fit';
        results.recommendation = 'DECLINE: Does not align with SEG standards';
    }

    const criticalFlags = ['safety_compromise', 'blaming'];
    const hasCriticalFlag = results.concerns.some(c => criticalFlags.includes(c));
    if (hasCriticalFlag && results.rating.startsWith('A')) {
        results.rating = 'B+';
        results.summary += ' (DOWNGRADED due to safety/accountability concerns)';
        results.recommendation = 'REVIEW: Critical concerns require manager review';
    }

    return results;
}

/**
 * Get the 8 WHO Method questions
 */
function getStage2Questions() {
    return [
        { id: 'careerGoals', question: 'What are you looking to accomplish in your career over the next 3-5 years?', weight: 15 },
        { id: 'strengths', question: 'What are your greatest professional strengths? Give me specific examples.', weight: 15 },
        { id: 'weaknesses', question: 'What are areas you\'re actively working to improve?', weight: 10 },
        { id: 'bossRatings', question: 'If I called your last three supervisors and asked them to rate you 1-10, what would they say?', weight: 15 },
        { id: 'accountability', question: 'Tell me about a time you made a mistake at work. What happened and what did you do?', weight: 10 },
        { id: 'integrity', question: 'Describe a situation where you had to choose between meeting a deadline and following safety protocols.', weight: 10 },
        { id: 'problemSolving', question: 'Walk me through your approach to solving a complex safety challenge.', weight: 15 },
        { id: 'drivingForce', question: 'What motivates you to excel in the safety profession?', weight: 10 }
    ];
}

function getAssessmentSummary(results) {
    return {
        totalScore: results.totalScore,
        rating: results.rating,
        summary: results.summary,
        recommendation: results.recommendation,
        topStrengths: results.strengths.slice(0, 3),
        topConcerns: results.concerns.slice(0, 3)
    };
}

module.exports = {
    scoreStage2Assessment,
    scoreResponse,
    getStage2Questions,
    getAssessmentSummary,
    QUESTION_WEIGHTS
};
