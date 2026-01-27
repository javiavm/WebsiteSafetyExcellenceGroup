/**
 * Candidate Scoring Algorithm
 * Safety Excellence Group
 *
 * Scores job applicants for fit and quality
 * Based on "Join the SEG Network" form data
 *
 * Output: Score (0-100) + Fit Rating (A/B/C/D) + Behavioral Score + Red Flags
 */

// ========================================
// SCORING CRITERIA
// ========================================

const SCORING = {
    yearsExperience: {
        '15+': 20,
        '8-15': 18,
        '5-8': 15,
        '2-5': 10,
        '0-2': 5
    },

    certifications: {
        'csp': 10,
        'asp': 8,
        'chst': 8,
        'ohst': 6,
        'gsp': 6,
        'osha500': 5,
        'osha510': 4,
        'osha30': 2,
        'semis2': 8,
        'nfpa70e': 5,
        'firstaid': 1
    },
    certificationMaxPoints: 25,

    industryExperience: {
        'semiconductor': 10,
        'datacenter': 8,
        'construction': 6,
        'manufacturing': 5,
        'pharma': 5,
        'oil_gas': 5,
        'other': 2
    },
    multipleIndustriesBonus: 5,

    availability: {
        'immediately': 10,
        '2weeks': 8,
        '30days': 5,
        '60days+': 2
    },

    travel: {
        'national': 5,
        'open': 5,
        'relocate': 5,
        'regional': 3,
        'local': 0
    },

    shift: {
        'flexible': 5,
        'rotating': 5,
        'both': 3,
        'days': 0,
        'nights': 0
    }
};

// ========================================
// BEHAVIORAL QUESTIONS SCORING
// ========================================

const BEHAVIORAL = {
    q1: {
        // Task outside job description
        description: 'Task outside job description',
        scores: {
            4: { points: 10, answer: 'Do it without being asked' },
            3: { points: 7, answer: 'Do it if asked' },
            2: { points: 3, answer: 'Suggest someone else' },
            1: { points: 0, answer: 'Explain not your responsibility' }
        }
    },
    q2: {
        // Competitor offers 10% more
        description: 'Competitor offers 10% more pay',
        scores: {
            4: { points: 10, answer: 'Decline - made commitment' },
            3: { points: 8, answer: 'Weigh growth, team, commitment' },
            2: { points: 3, answer: 'Use to negotiate raise' },
            1: { points: 0, answer: 'Take the offer' }
        }
    },
    q3: {
        // Skip safety step
        description: 'Supervisor asks to skip safety step',
        scores: {
            4: { points: 10, answer: 'Refuse and document' },
            3: { points: 5, answer: 'Complete but report after' },
            2: { points: 2, answer: 'Push back but comply' },
            1: { points: 0, answer: 'Follow supervisor\'s lead' }
        }
    }
};

// ========================================
// FIT RATING THRESHOLDS
// ========================================

const FIT_RATING = {
    A: { min: 80, label: 'A', meaning: 'Top tier - prioritize', emoji: '🌟' },
    B: { min: 65, label: 'B', meaning: 'Good fit - follow up', emoji: '✅' },
    C: { min: 50, label: 'C', meaning: 'Possible fit - review', emoji: '🟡' },
    D: { min: 0, label: 'D', meaning: 'Poor fit - archive', emoji: '⚪' }
};

// ========================================
// RED FLAG DEFINITIONS
// ========================================

const RED_FLAGS = {
    SAFETY_COMPLIANCE: {
        code: 'SAFETY_COMPLIANCE',
        description: 'Would follow supervisor to skip safety step',
        severity: 'HIGH',
        maxRating: 'C'
    },
    NO_CERTIFICATIONS: {
        code: 'NO_CERTIFICATIONS',
        description: 'No safety certifications',
        severity: 'MEDIUM',
        maxRating: 'C'
    },
    INEXPERIENCED_UNCERTIFIED: {
        code: 'INEXPERIENCED_UNCERTIFIED',
        description: '0-2 years experience with no certifications',
        severity: 'HIGH',
        maxRating: 'D'
    }
};

// ========================================
// SCORING FUNCTIONS
// ========================================

/**
 * Score years of experience
 */
function scoreExperience(years) {
    if (!years) return { points: 0, value: null };
    const normalized = years.toString().toLowerCase().trim();
    const points = SCORING.yearsExperience[normalized] || 0;
    return { points, value: years, maxPoints: 20 };
}

/**
 * Score certifications (capped at max points)
 */
function scoreCertifications(certifications) {
    if (!certifications || !Array.isArray(certifications) || certifications.length === 0) {
        // Handle string input (comma-separated)
        if (typeof certifications === 'string') {
            certifications = certifications.split(',').map(c => c.trim().toLowerCase());
        } else {
            return { points: 0, count: 0, certs: [], maxPoints: SCORING.certificationMaxPoints };
        }
    }

    let totalPoints = 0;
    const scoredCerts = [];

    for (const cert of certifications) {
        const normalized = cert.toString().toLowerCase().trim();
        const points = SCORING.certifications[normalized] || 0;
        if (points > 0) {
            scoredCerts.push({ cert: normalized, points });
            totalPoints += points;
        }
    }

    // Cap at max points
    const cappedPoints = Math.min(totalPoints, SCORING.certificationMaxPoints);

    return {
        points: cappedPoints,
        rawPoints: totalPoints,
        count: scoredCerts.length,
        certs: scoredCerts,
        capped: totalPoints > SCORING.certificationMaxPoints,
        maxPoints: SCORING.certificationMaxPoints
    };
}

/**
 * Score industry experience
 */
function scoreIndustryExperience(industries) {
    if (!industries) return { points: 0, count: 0, industries: [], maxPoints: 15 };

    // Handle string input
    if (typeof industries === 'string') {
        industries = industries.split(',').map(i => i.trim().toLowerCase());
    }

    if (!Array.isArray(industries) || industries.length === 0) {
        return { points: 0, count: 0, industries: [], maxPoints: 15 };
    }

    // Get highest scoring industry
    let highestPoints = 0;
    const scoredIndustries = [];

    for (const industry of industries) {
        const normalized = industry.toString().toLowerCase().trim();
        const points = SCORING.industryExperience[normalized] || 0;
        scoredIndustries.push({ industry: normalized, points });
        if (points > highestPoints) {
            highestPoints = points;
        }
    }

    // Add bonus for multiple industries
    const multipleBonus = industries.length > 1 ? SCORING.multipleIndustriesBonus : 0;
    const totalPoints = highestPoints + multipleBonus;

    return {
        points: totalPoints,
        basePoints: highestPoints,
        multipleBonus,
        count: industries.length,
        industries: scoredIndustries,
        maxPoints: 15 // 10 (highest) + 5 (bonus)
    };
}

/**
 * Score availability
 */
function scoreAvailability(availability) {
    if (!availability) return { points: 0, value: null, maxPoints: 10 };
    const normalized = availability.toString().toLowerCase().trim();
    const points = SCORING.availability[normalized] || 0;
    return { points, value: availability, maxPoints: 10 };
}

/**
 * Score travel flexibility
 */
function scoreTravel(travel) {
    if (!travel) return { points: 0, value: null, maxPoints: 5 };
    const normalized = travel.toString().toLowerCase().trim();
    const points = SCORING.travel[normalized] || 0;
    return { points, value: travel, maxPoints: 5 };
}

/**
 * Score shift flexibility
 */
function scoreShift(shift) {
    if (!shift) return { points: 0, value: null, maxPoints: 5 };
    const normalized = shift.toString().toLowerCase().trim();
    const points = SCORING.shift[normalized] || 0;
    return { points, value: shift, maxPoints: 5 };
}

/**
 * Score behavioral questions
 */
function scoreBehavioral(q1, q2, q3) {
    const result = {
        q1: { answer: q1, points: 0, maxPoints: 10 },
        q2: { answer: q2, points: 0, maxPoints: 10 },
        q3: { answer: q3, points: 0, maxPoints: 10 },
        totalPoints: 0,
        maxPoints: 30
    };

    // Score Q1
    if (q1 && BEHAVIORAL.q1.scores[q1]) {
        result.q1.points = BEHAVIORAL.q1.scores[q1].points;
        result.q1.answerText = BEHAVIORAL.q1.scores[q1].answer;
    }

    // Score Q2
    if (q2 && BEHAVIORAL.q2.scores[q2]) {
        result.q2.points = BEHAVIORAL.q2.scores[q2].points;
        result.q2.answerText = BEHAVIORAL.q2.scores[q2].answer;
    }

    // Score Q3
    if (q3 && BEHAVIORAL.q3.scores[q3]) {
        result.q3.points = BEHAVIORAL.q3.scores[q3].points;
        result.q3.answerText = BEHAVIORAL.q3.scores[q3].answer;
    }

    result.totalPoints = result.q1.points + result.q2.points + result.q3.points;

    return result;
}

/**
 * Detect red flags
 */
function detectRedFlags(data, certScore, behavioralScore) {
    const flags = [];

    // Check Q3 safety compliance
    if (data.q3_answer === 1 || data.q3_answer === '1') {
        flags.push(RED_FLAGS.SAFETY_COMPLIANCE);
    }

    // Check no certifications
    if (certScore.count === 0) {
        flags.push(RED_FLAGS.NO_CERTIFICATIONS);
    }

    // Check inexperienced + uncertified
    const isInexperienced = data.years_experience === '0-2';
    if (isInexperienced && certScore.count === 0) {
        flags.push(RED_FLAGS.INEXPERIENCED_UNCERTIFIED);
    }

    return flags;
}

/**
 * Get fit rating based on score and red flags
 */
function getFitRating(score, redFlags) {
    // Determine max allowed rating based on red flags
    let maxRating = 'A';
    for (const flag of redFlags) {
        if (flag.maxRating === 'D') {
            maxRating = 'D';
            break;
        } else if (flag.maxRating === 'C' && maxRating !== 'D') {
            maxRating = 'C';
        }
    }

    // Get rating based on score
    let rating;
    if (score >= FIT_RATING.A.min) {
        rating = FIT_RATING.A;
    } else if (score >= FIT_RATING.B.min) {
        rating = FIT_RATING.B;
    } else if (score >= FIT_RATING.C.min) {
        rating = FIT_RATING.C;
    } else {
        rating = FIT_RATING.D;
    }

    // Apply max rating cap from red flags
    const ratingOrder = ['A', 'B', 'C', 'D'];
    const currentIndex = ratingOrder.indexOf(rating.label);
    const maxIndex = ratingOrder.indexOf(maxRating);

    if (currentIndex < maxIndex) {
        // Downgrade to max allowed rating
        const downgradedRating = FIT_RATING[maxRating];
        return {
            ...downgradedRating,
            downgraded: true,
            originalRating: rating.label,
            downgradedDueTo: redFlags.filter(f => f.maxRating === maxRating).map(f => f.description)
        };
    }

    return { ...rating, downgraded: false };
}

// ========================================
// MAIN SCORING FUNCTION
// ========================================

/**
 * Score a candidate
 *
 * @param {Object} formData - Candidate form submission data
 * @returns {Object} Scoring result with score, fitRating, behavioralScore, redFlags, and breakdown
 */
function scoreCandiate(formData) {
    const data = formData || {};

    // Score each factor
    const experienceScore = scoreExperience(data.years_experience);
    const certificationScore = scoreCertifications(data.certifications);
    const industryScore = scoreIndustryExperience(data.industry_experience);
    const availabilityScore = scoreAvailability(data.availability || data.when_can_you_start);
    const travelScore = scoreTravel(data.travel_preference || data.willing_to_travel);
    const shiftScore = scoreShift(data.shift_availability);

    // Score behavioral questions
    const behavioralScore = scoreBehavioral(
        data.q1_answer,
        data.q2_answer,
        data.q3_answer
    );

    // Build breakdown
    const breakdown = {
        experience: experienceScore,
        certifications: certificationScore,
        industryExperience: industryScore,
        availability: availabilityScore,
        travel: travelScore,
        shift: shiftScore,
        behavioral: behavioralScore
    };

    // Calculate total score
    const totalScore =
        experienceScore.points +
        certificationScore.points +
        industryScore.points +
        availabilityScore.points +
        travelScore.points +
        shiftScore.points +
        behavioralScore.totalPoints;

    const maxScore = 20 + 25 + 15 + 10 + 5 + 5 + 30; // 110

    // Detect red flags
    const redFlags = detectRedFlags(data, certificationScore, behavioralScore);

    // Get fit rating
    const fitRating = getFitRating(totalScore, redFlags);

    // Build result
    const result = {
        score: totalScore,
        maxScore,
        percentage: Math.round((totalScore / maxScore) * 100),
        fitRating: fitRating.label,
        fitRatingEmoji: fitRating.emoji,
        fitRatingMeaning: fitRating.meaning,
        behavioralScore: behavioralScore.totalPoints,
        behavioralMaxScore: behavioralScore.maxPoints,
        redFlags: redFlags.map(f => ({
            code: f.code,
            description: f.description,
            severity: f.severity
        })),
        hasRedFlags: redFlags.length > 0,
        breakdown,
        metadata: {
            scoredAt: new Date().toISOString(),
            candidate: {
                fullName: data.full_name,
                email: data.email,
                phone: data.phone,
                location: data.location,
                roleLevel: data.role_level,
                workTypePreference: data.work_type_preference
            }
        }
    };

    // Add downgrade info if applicable
    if (fitRating.downgraded) {
        result.ratingDowngraded = true;
        result.originalRating = fitRating.originalRating;
        result.downgradedDueTo = fitRating.downgradedDueTo;
    }

    return result;
}

/**
 * Get a summary string for the candidate score
 */
function getScoreSummary(result) {
    const lines = [
        `Candidate Score: ${result.score}/${result.maxScore} (${result.percentage}%)`,
        `Fit Rating: ${result.fitRatingEmoji} ${result.fitRating} - ${result.fitRatingMeaning}`,
        `Behavioral Score: ${result.behavioralScore}/${result.behavioralMaxScore}`,
        ''
    ];

    if (result.ratingDowngraded) {
        lines.push(`⚠️ Rating downgraded from ${result.originalRating} due to:`);
        result.downgradedDueTo.forEach(reason => lines.push(`   - ${reason}`));
        lines.push('');
    }

    if (result.hasRedFlags) {
        lines.push('🚩 Red Flags:');
        result.redFlags.forEach(flag => {
            lines.push(`   - [${flag.severity}] ${flag.description}`);
        });
        lines.push('');
    }

    lines.push('Breakdown:');
    lines.push(`  - Experience: ${result.breakdown.experience.points}/${result.breakdown.experience.maxPoints} pts`);
    lines.push(`  - Certifications: ${result.breakdown.certifications.points}/${result.breakdown.certifications.maxPoints} pts (${result.breakdown.certifications.count} certs)`);
    lines.push(`  - Industry: ${result.breakdown.industryExperience.points}/${result.breakdown.industryExperience.maxPoints} pts`);
    lines.push(`  - Availability: ${result.breakdown.availability.points}/${result.breakdown.availability.maxPoints} pts`);
    lines.push(`  - Travel: ${result.breakdown.travel.points}/${result.breakdown.travel.maxPoints} pts`);
    lines.push(`  - Shift: ${result.breakdown.shift.points}/${result.breakdown.shift.maxPoints} pts`);
    lines.push(`  - Behavioral: ${result.breakdown.behavioral.totalPoints}/${result.breakdown.behavioral.maxPoints} pts`);

    return lines.join('\n');
}

/**
 * Batch score multiple candidates
 */
function scoreMultipleCandidates(candidates) {
    return candidates.map(candidate => ({
        input: candidate,
        result: scoreCandiate(candidate)
    })).sort((a, b) => b.result.score - a.result.score);
}

/**
 * Get candidates by fit rating
 */
function filterByFitRating(scoredCandidates, rating) {
    return scoredCandidates.filter(c => c.result.fitRating === rating);
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
    scoreCandiate,
    getScoreSummary,
    scoreMultipleCandidates,
    filterByFitRating,
    SCORING,
    BEHAVIORAL,
    FIT_RATING,
    RED_FLAGS
};
