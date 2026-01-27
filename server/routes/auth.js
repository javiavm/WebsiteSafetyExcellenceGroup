/**
 * Auth Routes - User authentication for subscription system
 * Phase 3: Subscription Infrastructure
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();

let db;

function initAuthRoutes(dependencies) {
    db = dependencies.db;
    return router;
}

// Hash password with salt
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

// Verify password
function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(':');
    const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verify;
}

// Generate session token
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, company } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const passwordHash = hashPassword(password);
        const result = await db.run(
            'INSERT INTO users (email, password_hash, name, company) VALUES (?, ?, ?, ?)',
            [email, passwordHash, name, company]
        );

        const token = generateToken();
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await db.run(
            'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
            [result.lastID, token, expires]
        );

        res.json({ success: true, token, userId: result.lastID, tier: 'free' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user || !verifyPassword(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken();
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await db.run(
            'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
            [user.id, token, expires]
        );

        res.json({
            success: true,
            token,
            user: { id: user.id, email: user.email, name: user.name, tier: user.tier }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
        await db.run('DELETE FROM user_sessions WHERE token = ?', [token]);
    }
    res.json({ success: true });
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'No token' });

        const session = await db.get(
            `SELECT u.* FROM users u
             JOIN user_sessions s ON u.id = s.user_id
             WHERE s.token = ? AND s.expires_at > datetime('now')`,
            [token]
        );
        if (!session) return res.status(401).json({ error: 'Invalid session' });

        res.json({
            success: true,
            user: {
                id: session.id,
                email: session.email,
                name: session.name,
                company: session.company,
                tier: session.tier,
                trialEndsAt: session.trial_ends_at
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get user' });
    }
});

module.exports = { initAuthRoutes };
