/**
 * Candidate-Client Matching Algorithm
 * Safety Excellence Group
 *
 * Matches candidates to client staffing needs based on:
 * - Industry alignment
 * - Location proximity
 * - Availability vs timeline
 * - Candidate quality (fit rating, score)
 * - Support type vs role level
 *
 * Output: Ranked list of matches with match scores
 */

// ========================================
// MATCHING WEIGHTS
// ========================================

const WEIGHTS = {
    industry: 30,        // Industry match is critical
    location: 20,        // Location matters for on-site work
    availability: 20,    // Timeline alignment
    qualityScore: 20,    // Candidate's overall quality
    roleLevel: 10        // Role level alignment
};

// ========================================
// INDUSTRY MATCHING
// ========================================

const INDUSTRY_ALIASES = {
    'semiconductor': ['semiconductor', 'semi', 'fab', 'chip', 'wafer'],
    'datacenter': ['datacenter', 'data center', 'data-center', 'dc'],
    'construction': ['construction', 'general construction', 'commercial construction'],
    'manufacturing': ['manufacturing', 'industrial', 'factory'],
    'pharma': ['pharma', 'pharmaceutical', 'biotech', 'life sciences'],
    'oil_gas': ['oil_gas', 'oil & gas', 'oil and gas', 'energy', 'petrochemical']
};

function normalizeIndustry(industry) {
    if (!industry) return null;
    const normalized = industry.toString().toLowerCase().trim();

    for (const [key, aliases] of Object.entries(INDUSTRY_ALIASES)) {
        if (aliases.some(alias => normalized.includes(alias))) {
            return key;
        }
    }
    return normalized;
}

function scoreIndustryMatch(clientIndustry, candidateIndustries) {
    if (!clientIndustry || !candidateIndustries) return 0;

    const normalizedClient = normalizeIndustry(clientIndustry);

    // Handle string or array
    let industries = candidateIndustries;
    if (typeof candidateIndustries === 'string') {
        industries = candidateIndustries.split(',').map(i => i.trim());
    }

    if (!Array.isArray(industries)) return 0;

    for (const industry of industries) {
        const normalizedCandidate = normalizeIndustry(industry);
        if (normalizedCandidate === normalizedClient) {
            return 1.0; // Perfect match
        }
    }

    // Partial match for related industries
    const relatedIndustries = {
        'semiconductor': ['manufacturing', 'datacenter'],
        'datacenter': ['construction', 'manufacturing'],
        'construction': ['manufacturing'],
        'manufacturing': ['construction']
    };

    const related = relatedIndustries[normalizedClient] || [];
    for (const industry of industries) {
        const normalizedCandidate = normalizeIndustry(industry);
        if (related.includes(normalizedCandidate)) {
            return 0.5; // Partial match
        }
    }

    return 0.1; // Minimal match for any candidate
}

// ========================================
// LOCATION MATCHING
// ========================================

function normalizeLocation(location) {
    if (!location) return null;
    return location.toString().toLowerCase().trim();
}

function scoreLocationMatch(clientLocation, candidateLocation, candidateTravel) {
    if (!clientLocation) return 0.5; // No location requirement, neutral score
    if (!candidateLocation) return 0.3;

    const normalizedClient = normalizeLocation(clientLocation);
    const normalizedCandidate = normalizeLocation(candidateLocation);

    // Same location
    if (normalizedClient === normalizedCandidate) {
        return 1.0;
    }

    // Same state check (basic)
    const clientState = extractState(normalizedClient);
    const candidateState = extractState(normalizedCandidate);

    if (clientState && candidateState && clientState === candidateState) {
        return 0.8;
    }

    // Check travel preference
    const travel = (candidateTravel || '').toString().toLowerCase();
    if (travel.includes('national') || travel.includes('open') || travel.includes('relocate')) {
        return 0.7;
    }
    if (travel.includes('regional')) {
        return 0.4;
    }

    return 0.2; // Local only, different location
}

function extractState(location) {
    if (!location) return null;

    // Common state abbreviations
    const stateMatch = location.match(/\b([A-Z]{2})\b/i);
    if (stateMatch) {
        return stateMatch[1].toUpperCase();
    }

    // State names
    const states = {
        'california': 'CA', 'texas': 'TX', 'arizona': 'AZ', 'oregon': 'OR',
        'washington': 'WA', 'nevada': 'NV', 'colorado': 'CO', 'new york': 'NY',
        'florida': 'FL', 'georgia': 'GA', 'ohio': 'OH', 'michigan': 'MI'
    };

    for (const [name, abbr] of Object.entries(states)) {
        if (location.includes(name)) {
            return abbr;
        }
    }

    return null;
}

// ========================================
// AVAILABILITY MATCHING
// ========================================

const AVAILABILITY_RANK = {
    'immediately': 1,
    'immediate': 1,
    '2weeks': 2,
    '2 weeks': 2,
    'two weeks': 2,
    '30days': 3,
    '30 days': 3,
    'one month': 3,
    '60days+': 4,
    '60+ days': 4,
    'two months': 4
};

const TIMELINE_RANK = {
    'immediately': 1,
    'immediate': 1,
    'urgent': 1,
    'asap': 1,
    '1-2 weeks': 2,
    'within 2 weeks': 2,
    '2-4 weeks': 3,
    'within a month': 3,
    '1-3 months': 4,
    'flexible': 5,
    'planning': 5
};

function scoreAvailabilityMatch(clientTimeline, candidateAvailability) {
    if (!clientTimeline || !candidateAvailability) return 0.5; // Neutral

    const normalizedTimeline = clientTimeline.toString().toLowerCase().trim();
    const normalizedAvail = candidateAvailability.toString().toLowerCase().trim();

    const timelineRank = TIMELINE_RANK[normalizedTimeline] || 3;
    const availRank = AVAILABILITY_RANK[normalizedAvail] || 3;

    // Candidate available sooner or same as timeline = good
    if (availRank <= timelineRank) {
        return 1.0;
    }

    // One rank behind
    if (availRank === timelineRank + 1) {
        return 0.7;
    }

    // Two ranks behind
    if (availRank === timelineRank + 2) {
        return 0.4;
    }

    return 0.2; // Too slow
}

// ========================================
// QUALITY SCORE
// ========================================

function scoreQuality(candidate) {
    // Use existing fit rating and score
    const fitRating = (candidate.fit_rating || '').toString().toUpperCase();
    const totalScore = parseInt(candidate.total_score) || 0;

    // Fit rating multiplier
    const ratingMultiplier = {
        'A': 1.0,
        'B': 0.8,
        'C': 0.6,
        'D': 0.3
    };

    const multiplier = ratingMultiplier[fitRating] || 0.5;

    // Normalize score (max is ~110)
    const normalizedScore = Math.min(totalScore / 110, 1.0);

    return normalizedScore * multiplier;
}

// ========================================
// ROLE LEVEL MATCHING
// ========================================

const SUPPORT_TO_ROLE = {
    'staff augmentation': ['entry', 'mid', 'senior', 'lead'],
    'staffing': ['entry', 'mid', 'senior', 'lead'],
    'program development': ['senior', 'lead', 'manager', 'director'],
    'program management': ['lead', 'manager', 'director'],
    'audits': ['senior', 'lead', 'manager'],
    'audit': ['senior', 'lead', 'manager'],
    'assessments': ['mid', 'senior', 'lead'],
    'consulting': ['senior', 'lead', 'manager', 'director'],
    'subcontractor vetting': ['mid', 'senior'],
    'training': ['mid', 'senior', 'lead']
};

function scoreRoleLevelMatch(supportType, roleLevel) {
    if (!supportType || !roleLevel) return 0.5;

    const normalizedSupport = supportType.toString().toLowerCase().trim();
    const normalizedRole = roleLevel.toString().toLowerCase().trim();

    for (const [support, roles] of Object.entries(SUPPORT_TO_ROLE)) {
        if (normalizedSupport.includes(support)) {
            if (roles.some(r => normalizedRole.includes(r))) {
                return 1.0;
            }
            return 0.3; // Support type found but role doesn't match
        }
    }

    return 0.5; // Unknown support type, neutral
}

// ========================================
// MAIN MATCHING FUNCTION
// ========================================

/**
 * Calculate match score between a client and candidate
 */
function calculateMatchScore(client, candidate) {
    const scores = {
        industry: scoreIndustryMatch(client.industry, candidate.industry_experience),
        location: scoreLocationMatch(client.location, candidate.location, candidate.travel_preference),
        availability: scoreAvailabilityMatch(client.timeline, candidate.availability),
        quality: scoreQuality(candidate),
        roleLevel: scoreRoleLevelMatch(client.support_type, candidate.role_level)
    };

    // Calculate weighted total
    const totalScore =
        (scores.industry * WEIGHTS.industry) +
        (scores.location * WEIGHTS.location) +
        (scores.availability * WEIGHTS.availability) +
        (scores.quality * WEIGHTS.qualityScore) +
        (scores.roleLevel * WEIGHTS.roleLevel);

    const maxScore = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);

    return {
        score: Math.round(totalScore),
        maxScore,
        percentage,
        breakdown: scores,
        matchLevel: getMatchLevel(percentage)
    };
}

function getMatchLevel(percentage) {
    if (percentage >= 80) return { level: 'EXCELLENT', emoji: '🌟' };
    if (percentage >= 65) return { level: 'GOOD', emoji: '✅' };
    if (percentage >= 50) return { level: 'FAIR', emoji: '🟡' };
    return { level: 'LOW', emoji: '⚪' };
}

/**
 * Find all matching candidates for a client
 */
function findMatchesForClient(client, candidates) {
    if (!client || !candidates || !Array.isArray(candidates)) {
        return [];
    }

    const matches = candidates.map(candidate => {
        const matchResult = calculateMatchScore(client, candidate);

        return {
            candidate: {
                id: candidate.id,
                name: candidate.full_name,
                email: candidate.email,
                location: candidate.location,
                fitRating: candidate.fit_rating,
                totalScore: candidate.total_score,
                certifications: candidate.certifications,
                yearsExperience: candidate.years_experience,
                industryExperience: candidate.industry_experience,
                availability: candidate.availability,
                roleLevel: candidate.role_level
            },
            match: matchResult
        };
    });

    // Sort by match score (highest first)
    matches.sort((a, b) => b.match.score - a.match.score);

    return matches;
}

/**
 * Find all matching clients for a candidate (reverse matching)
 */
function findMatchesForCandidate(candidate, clients) {
    if (!candidate || !clients || !Array.isArray(clients)) {
        return [];
    }

    const matches = clients.map(client => {
        const matchResult = calculateMatchScore(client, candidate);

        return {
            client: {
                id: client.id,
                company: client.company_name,
                contactName: client.full_name,
                email: client.email,
                industry: client.industry,
                location: client.location,
                supportType: client.support_type,
                timeline: client.timeline,
                engagementSize: client.engagement_size,
                leadScore: client.lead_score,
                leadClassification: client.lead_classification
            },
            match: matchResult
        };
    });

    // Sort by match score (highest first)
    matches.sort((a, b) => b.match.score - a.match.score);

    return matches;
}

/**
 * Get a summary of matches
 */
function getMatchSummary(matches) {
    if (!matches || matches.length === 0) {
        return 'No matches found.';
    }

    const excellent = matches.filter(m => m.match.matchLevel.level === 'EXCELLENT').length;
    const good = matches.filter(m => m.match.matchLevel.level === 'GOOD').length;
    const fair = matches.filter(m => m.match.matchLevel.level === 'FAIR').length;
    const low = matches.filter(m => m.match.matchLevel.level === 'LOW').length;

    const lines = [
        `Total Candidates: ${matches.length}`,
        `🌟 Excellent (80%+): ${excellent}`,
        `✅ Good (65-79%): ${good}`,
        `🟡 Fair (50-64%): ${fair}`,
        `⚪ Low (<50%): ${low}`,
        '',
        'Top 5 Matches:'
    ];

    matches.slice(0, 5).forEach((m, i) => {
        lines.push(`  ${i + 1}. ${m.candidate.name} - ${m.match.percentage}% ${m.match.matchLevel.emoji}`);
    });

    return lines.join('\n');
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
    findMatchesForClient,
    findMatchesForCandidate,
    calculateMatchScore,
    getMatchSummary,
    WEIGHTS
};
