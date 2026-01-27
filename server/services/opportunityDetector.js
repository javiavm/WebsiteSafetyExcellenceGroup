/**
 * Opportunity Detection Engine
 * Auto-detects HOT client + B+ candidate matches
 * Triggers Stage 2 invites and admin alerts
 */

const fetch = require('node-fetch');

const GHL_WEBHOOKS = {
    stage2Invite: 'https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/ad8aa4ed-32cd-45fe-b9eb-77727b3993aa',
    opportunityAlert: 'https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/558c9693-50bc-4743-b82f-afd1912e0659',
    aPlayerConfirmed: 'https://services.leadconnectorhq.com/hooks/gdzuiKrnOBEej5nXBHbA/webhook-trigger/7f5630cb-1250-4881-a91e-809a47867d80'
};

const SITE_URL = process.env.SITE_URL || 'http://localhost:3001';

/**
 * Check if client is HOT (immediate/72hrs timeline)
 */
function isHotClient(client) {
    const hotTimelines = ['immediate', '1-2weeks'];
    return hotTimelines.includes(client.timeline) || client.lead_classification === 'HOT';
}

/**
 * Send webhook to GHL
 */
async function sendToGHL(webhookUrl, data) {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        console.log(`GHL Webhook sent: ${response.status}`);
        return response.ok;
    } catch (error) {
        console.error('GHL Webhook error:', error);
        return false;
    }
}

/**
 * Process a new HOT client submission
 * Called automatically when a client form is submitted with immediate timeline
 */
async function detectOpportunities(client, db, matchingAlgorithm) {
    console.log(`\n=== OPPORTUNITY DETECTION ===`);
    console.log(`Client: ${client.company_name} (${client.timeline})`);

    // Only process HOT clients
    if (!isHotClient(client)) {
        console.log('Not a HOT client, skipping opportunity detection');
        return { processed: false, reason: 'not_hot' };
    }

    // Get all candidates
    const candidates = await db.getAllCandidates();
    if (!candidates || candidates.length === 0) {
        console.log('No candidates in database');
        return { processed: false, reason: 'no_candidates' };
    }

    // Run matching algorithm
    const matches = matchingAlgorithm.findMatchesForClient(client, candidates);

    // Filter for B+ or better with 75+ match score
    const qualifiedMatches = matches.filter(m => {
        const goodRating = ['A+', 'A', 'B+'].includes(m.candidate.fitRating);
        const highScore = m.match.percentage >= 75;
        return goodRating && highScore;
    });

    console.log(`Found ${qualifiedMatches.length} qualified matches`);

    if (qualifiedMatches.length === 0) {
        // Alert admin: HOT lead but no good matches
        await sendToGHL(GHL_WEBHOOKS.opportunityAlert, {
            to_email: 'info@safety-excellence.com',
            alert_type: 'no_matches',
            client_name: client.full_name,
            client_company: client.company_name,
            client_industry: client.industry,
            client_timeline: client.timeline,
            client_service: client.support_type,
            match_count: 0,
            top_match_name: 'None',
            top_match_rating: 'N/A',
            top_match_score: 0,
            dashboard_link: `${SITE_URL}/admin-dashboard.html`
        });
        return { processed: true, matches: 0, alerts: ['no_matches'] };
    }

    // Log opportunity
    await db.createOpportunity(client.id, qualifiedMatches.length);

    // Process each qualified match
    const results = {
        processed: true,
        matches: qualifiedMatches.length,
        stage2Sent: [],
        readyNow: [],
        alerts: []
    };

    for (const match of qualifiedMatches) {
        const candidate = match.candidate;

        // Check if candidate already has valid A rating (within 90 days)
        const existingStage2 = await db.getValidStage2(candidate.id);

        if (existingStage2 && (existingStage2.rating === 'A' || existingStage2.rating === 'A+')) {
            // A-Player ready NOW - no need for Stage 2
            console.log(`${candidate.name}: Already A-rated, READY NOW`);
            results.readyNow.push(candidate.name);
            continue;
        }

        // Check if already has pending invite (prevent spam)
        const hasPending = await db.hasPendingStage2(candidate.id);
        if (hasPending) {
            console.log(`${candidate.name}: Already has pending Stage 2`);
            continue;
        }

        // Create Stage 2 invite
        const invite = await db.createStage2Invite(candidate.id, client.id);
        const stage2Link = `${SITE_URL}/stage2.html?token=${invite.token}`;

        // Send Stage 2 invite via GHL
        await sendToGHL(GHL_WEBHOOKS.stage2Invite, {
            email: candidate.email,
            first_name: candidate.name.split(' ')[0],
            last_name: candidate.name.split(' ').slice(1).join(' ') || '',
            stage2_link: stage2Link,
            expires_in: '72 hours',
            matched_client_industry: client.industry
        });

        console.log(`${candidate.name}: Stage 2 invite sent`);
        results.stage2Sent.push(candidate.name);
    }

    // Send Opportunity Alert to admin
    const topMatch = qualifiedMatches[0];
    await sendToGHL(GHL_WEBHOOKS.opportunityAlert, {
        to_email: 'info@safety-excellence.com',
        alert_type: 'opportunity_detected',
        client_name: client.full_name,
        client_company: client.company_name,
        client_industry: client.industry,
        client_timeline: client.timeline,
        client_service: client.support_type,
        match_count: qualifiedMatches.length,
        top_match_name: topMatch.candidate.name,
        top_match_rating: topMatch.candidate.fitRating,
        top_match_score: topMatch.match.percentage,
        ready_now_count: results.readyNow.length,
        stage2_sent_count: results.stage2Sent.length,
        dashboard_link: `${SITE_URL}/admin-dashboard.html`
    });
    results.alerts.push('opportunity_detected');

    console.log(`=== DETECTION COMPLETE ===\n`);
    return results;
}

/**
 * Called when candidate completes Stage 2
 */
async function processStage2Completion(token, score, rating, db) {
    const stage2 = await db.getStage2ByToken(token);
    if (!stage2) return { success: false, error: 'Invalid token' };

    // Get the client that triggered this
    let client = null;
    if (stage2.triggered_by_client_id) {
        client = await db.getClientById(stage2.triggered_by_client_id);
    }

    // If A-Player, send alert
    if (rating === 'A' || rating === 'A+') {
        await sendToGHL(GHL_WEBHOOKS.aPlayerConfirmed, {
            to_email: 'info@safety-excellence.com',
            alert_type: 'a_player_ready',
            candidate_name: stage2.full_name,
            candidate_email: stage2.email,
            candidate_phone: stage2.phone || 'Not provided',
            stage2_score: score,
            stage2_rating: rating,
            matched_client: client ? client.company_name : 'General Pool',
            matched_industry: client ? client.industry : 'Multiple',
            dashboard_link: `${SITE_URL}/admin-dashboard.html`
        });
    }

    return { success: true, rating, alerted: rating === 'A' || rating === 'A+' };
}

module.exports = {
    detectOpportunities,
    processStage2Completion,
    sendToGHL,
    isHotClient,
    GHL_WEBHOOKS
};
