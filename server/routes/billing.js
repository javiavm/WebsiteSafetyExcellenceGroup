/**
 * Billing Routes - Stripe subscription integration
 * Phase 3: Subscription Infrastructure
 */

const express = require('express');
const router = express.Router();

let db;
let stripe;

// Price IDs (set in Stripe Dashboard)
const PRICES = {
    pro: process.env.STRIPE_PRO_PRICE_ID,
    premium: process.env.STRIPE_PREMIUM_PRICE_ID
};

function initBillingRoutes(dependencies) {
    db = dependencies.db;
    if (process.env.STRIPE_SECRET_KEY) {
        stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    }
    return router;
}

// Auth middleware
async function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const session = await db.get(
        `SELECT u.* FROM users u
         JOIN user_sessions s ON u.id = s.user_id
         WHERE s.token = ? AND s.expires_at > datetime('now')`,
        [token]
    );
    if (!session) return res.status(401).json({ error: 'Invalid session' });
    req.user = session;
    next();
}

// Create checkout session
router.post('/checkout', requireAuth, async (req, res) => {
    try {
        if (!stripe) return res.status(503).json({ error: 'Billing not configured' });

        const { tier } = req.body;
        if (!['pro', 'premium'].includes(tier)) {
            return res.status(400).json({ error: 'Invalid tier' });
        }

        // Create/get Stripe customer
        let customerId = req.user.stripe_customer_id;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: req.user.email,
                name: req.user.name,
                metadata: { userId: req.user.id }
            });
            customerId = customer.id;
            await db.run('UPDATE users SET stripe_customer_id = ? WHERE id = ?',
                [customerId, req.user.id]);
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: PRICES[tier], quantity: 1 }],
            success_url: `${process.env.BASE_URL}/tools/dashboard.html?upgraded=true`,
            cancel_url: `${process.env.BASE_URL}/tools/dashboard.html?canceled=true`,
            subscription_data: { trial_period_days: tier === 'pro' ? 7 : undefined }
        });

        res.json({ success: true, url: session.url });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ error: 'Checkout failed' });
    }
});

// Get subscription status
router.get('/status', requireAuth, async (req, res) => {
    res.json({
        success: true,
        tier: req.user.tier,
        trialEndsAt: req.user.trial_ends_at,
        stripeCustomerId: req.user.stripe_customer_id ? true : false
    });
});

// Webhook handler (Stripe events)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) return res.status(503).send();

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle subscription events
    if (event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated') {
        const sub = event.data.object;
        const tier = sub.items.data[0].price.id === PRICES.premium ? 'premium' : 'pro';
        await db.run(
            `UPDATE users SET tier = ?, stripe_subscription_id = ?,
             trial_ends_at = ? WHERE stripe_customer_id = ?`,
            [tier, sub.id, sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
             sub.customer]
        );
    }

    if (event.type === 'customer.subscription.deleted') {
        const sub = event.data.object;
        await db.run(
            `UPDATE users SET tier = 'free', stripe_subscription_id = NULL
             WHERE stripe_customer_id = ?`,
            [sub.customer]
        );
    }

    res.json({ received: true });
});

// Cancel subscription
router.post('/cancel', requireAuth, async (req, res) => {
    try {
        if (!stripe || !req.user.stripe_subscription_id) {
            return res.status(400).json({ error: 'No active subscription' });
        }
        await stripe.subscriptions.cancel(req.user.stripe_subscription_id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Cancel failed' });
    }
});

module.exports = { initBillingRoutes };
