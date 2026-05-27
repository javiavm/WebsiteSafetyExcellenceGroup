/**
 * Client Lead Scoring Algorithm
 * Safety Excellence Group
 *
 * Scores incoming client leads to prioritize follow-up
 * Based on "Request Safety Support" form data
 *
 * Output: Score (0-100) + Classification (HOT/WARM/NURTURE/LOW)
 */

// ========================================
// SCORING CRITERIA
// ========================================

const SCORING = {
    engagementSize: {
        '250k+': 25,
        '100-250k': 20,
        '40-100k': 15,
        'under40k': 5,
        'unsure': 10
    },

    timeline: {
        'immediate': 25,
        '1-2weeks': 20,
        '30days': 10,
        'exploring': 5
    },

    decisionRole: {
        'decision': 20,
        'influencer': 10,
        'research': 0
    },

    industry: {
        'semiconductor': 15,
        'datacenter': 15,
        'construction': 10,
        'manufacturing': 10,
        'other': 0
    },

    projectRole: {
        'owner': 10,
        'gc': 8,
        'manufacturer': 8,
        'sub': 5,
        'oem': 5
    }
};

// ========================================
// CLASSIFICATION THRESHOLDS
// ========================================

const CLASSIFICATION = {
    HOT: { min: 75, label: 'HOT', action: 'Respond within 2 hours', emoji: '🔥' },
    WARM: { min: 50, label: 'WARM', action: 'Respond within 24 hours', emoji: '🟡' },
    NURTURE: { min: 25, label: 'NURTURE', action: 'Add to nurture sequence', emoji: '🟢' },
    LOW: { min: 0, label: 'LOW', action: 'Nurture or disqualify', emoji: '⚪' }
};

// ========================================
// VALIDATION
// ========================================

/**
 * Validate email format
 */
function isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone (basic check for digits)
 */
function isValidPhone(phone) {
    if (!phone) return false;
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10;
}

// ========================================
// SCORING FUNCTIONS
// ========================================

/**
 * Get score for a specific factor
 */
function getFactorScore(factor, value) {
    if (!value || !SCORING[factor]) return 0;
    const normalizedValue = value.toLowerCase().trim();
    return SCORING[factor][normalizedValue] || 0;
}

/**
 * Get classification based on score (strict score-based, no overrides)
 */
function getClassification(score) {
    if (score >= CLASSIFICATION.HOT.min) {
        return { ...CLASSIFICATION.HOT };
    } else if (score >= CLASSIFICATION.WARM.min) {
        return { ...CLASSIFICATION.WARM };
    } else if (score >= CLASSIFICATION.NURTURE.min) {
        return { ...CLASSIFICATION.NURTURE };
    } else {
        return { ...CLASSIFICATION.LOW };
    }
}

// ========================================
// MAIN SCORING FUNCTION
// ========================================

/**
 * Score a client lead
 *
 * @param {Object} formData - Client form submission data
 * @param {string} formData.full_name - Client name
 * @param {string} formData.email - Client email
 * @param {string} formData.phone - Client phone
 * @param {string} formData.company_name - Company name
 * @param {string} formData.project_role - Role on project (owner, gc, sub, oem, manufacturer)
 * @param {string} formData.industry - Industry (semiconductor, datacenter, construction, manufacturing, other)
 * @param {string} formData.engagement_size - Budget range (250k+, 100-250k, 40-100k, under40k, unsure)
 * @param {string} formData.decision_role - Decision authority (decision, influencer, research)
 * @param {string} formData.timeline - Timeline (immediate, 1-2weeks, 30days, exploring)
 *
 * @returns {Object} Scoring result with score, classification, and breakdown
 */
function scoreClientLead(formData) {
    const data = formData || {};
    const breakdown = {
        engagementSize: { value: data.engagement_size, points: 0, maxPoints: 25 },
        timeline: { value: data.timeline, points: 0, maxPoints: 25 },
        decisionRole: { value: data.decision_role, points: 0, maxPoints: 20 },
        industry: { value: data.industry, points: 0, maxPoints: 15 },
        projectRole: { value: data.project_role, points: 0, maxPoints: 10 }
    };

    // Validation checks
    const validation = {
        hasValidEmail: isValidEmail(data.email),
        hasValidPhone: isValidPhone(data.phone),
        isQualified: true,
        issues: []
    };

    if (!validation.hasValidEmail) {
        validation.issues.push('Invalid or missing email');
        validation.isQualified = false;
    }

    if (!validation.hasValidPhone) {
        validation.issues.push('Invalid or missing phone');
        validation.isQualified = false;
    }

    // Calculate scores for each factor
    breakdown.engagementSize.points = getFactorScore('engagementSize', data.engagement_size);
    breakdown.timeline.points = getFactorScore('timeline', data.timeline);
    breakdown.decisionRole.points = getFactorScore('decisionRole', data.decision_role);
    breakdown.industry.points = getFactorScore('industry', data.industry);
    breakdown.projectRole.points = getFactorScore('projectRole', data.project_role);

    // Calculate total score
    const totalScore = Object.values(breakdown).reduce((sum, factor) => sum + factor.points, 0);

    // Get classification (strict score-based)
    const classification = getClassification(totalScore);

    // Build result
    const result = {
        score: totalScore,
        maxScore: 95,
        percentage: Math.round((totalScore / 95) * 100),
        classification: classification.label,
        classificationEmoji: classification.emoji,
        action: classification.action,
        breakdown,
        validation,
        metadata: {
            scoredAt: new Date().toISOString(),
            formData: {
                fullName: data.full_name,
                email: data.email,
                phone: data.phone,
                companyName: data.company_name,
                location: data.location,
                projectPhase: data.project_phase,
                supportType: data.support_type
            }
        }
    };

    // If not qualified, override classification
    if (!validation.isQualified) {
        result.classification = 'UNQUALIFIED';
        result.classificationEmoji = '❌';
        result.action = 'Review and request missing information';
    }

    return result;
}

/**
 * Get a summary string for the lead score
 */
function getScoreSummary(result) {
    const lines = [
        `Lead Score: ${result.score}/${result.maxScore} (${result.percentage}%)`,
        `Classification: ${result.classificationEmoji} ${result.classification}`,
        `Action: ${result.action}`,
        '',
        'Breakdown:'
    ];

    for (const [factor, data] of Object.entries(result.breakdown)) {
        const factorName = factor.replace(/([A-Z])/g, ' $1').trim();
        lines.push(`  - ${factorName}: ${data.points}/${data.maxPoints} pts (${data.value || 'not provided'})`);
    }

    if (!result.validation.isQualified) {
        lines.push('', '❌ Qualification Issues:');
        result.validation.issues.forEach(issue => {
            lines.push(`  - ${issue}`);
        });
    }

    return lines.join('\n');
}

/**
 * Batch score multiple leads
 */
function scoreMultipleLeads(leads) {
    return leads.map(lead => ({
        input: lead,
        result: scoreClientLead(lead)
    })).sort((a, b) => b.result.score - a.result.score);
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
    scoreClientLead,
    getScoreSummary,
    scoreMultipleLeads,
    SCORING,
    CLASSIFICATION,
    isValidEmail,
    isValidPhone
};
