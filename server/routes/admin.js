/**
 * Admin API Routes - Protected with x-admin-key header
 */

const express = require('express');
const router = express.Router();

let db, excelExport, matchingAlgorithm;

function initAdminRoutes(dependencies) {
    db = dependencies.db;
    excelExport = dependencies.excelExport;
    matchingAlgorithm = dependencies.matchingAlgorithm;
    return router;
}

// SECURITY: Admin key must be set in environment - no default fallback
const ADMIN_KEY = process.env.ADMIN_KEY;
if (!ADMIN_KEY) {
    console.warn('WARNING: ADMIN_KEY not set in environment. Admin routes will be inaccessible.');
}

function requireAdminAuth(req, res, next) {
    // If no admin key configured, reject all requests
    if (!ADMIN_KEY) {
        return res.status(503).json({ error: 'Admin authentication not configured' });
    }
    const providedKey = req.headers['x-admin-key'];
    if (!providedKey) return res.status(401).json({ error: 'Admin key required' });
    if (providedKey !== ADMIN_KEY) return res.status(403).json({ error: 'Invalid admin key' });
    next();
}

router.use(requireAdminAuth);

// Dashboard summary
router.get('/dashboard', async (req, res) => {
    try {
        const clients = await db.getAllClients();
        const candidates = await db.getAllCandidates();

        res.json({
            success: true,
            stats: {
                clients: {
                    total: clients.length,
                    hot: clients.filter(c => c.lead_classification === 'HOT').length,
                    warm: clients.filter(c => c.lead_classification === 'WARM').length,
                    nurture: clients.filter(c => c.lead_classification === 'NURTURE').length
                },
                candidates: {
                    total: candidates.length,
                    aRated: candidates.filter(c => c.fit_rating && c.fit_rating.startsWith('A')).length,
                    available: candidates.filter(c => c.availability === 'immediately' || c.availability === '2weeks').length
                }
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Dashboard failed' });
    }
});

// Clients
router.get('/clients', async (req, res) => {
    try {
        const clients = await db.getAllClients();
        res.json({ success: true, clients });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get clients' });
    }
});

router.put('/clients/:id/status', async (req, res) => {
    try {
        const { status, notes } = req.body;
        const result = await db.updateClientStatus(req.params.id, status, notes);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Candidates
router.get('/candidates', async (req, res) => {
    try {
        const candidates = await db.getAllCandidates();
        res.json({ success: true, candidates });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get candidates' });
    }
});

router.put('/candidates/:id/status', async (req, res) => {
    try {
        const { status, notes } = req.body;
        const result = await db.updateCandidateStatus(req.params.id, status, notes);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Matches
router.get('/matches/:clientId', async (req, res) => {
    try {
        const clients = await db.getAllClients();
        const client = clients.find(c => c.id === parseInt(req.params.clientId));
        if (!client) return res.status(404).json({ error: 'Client not found' });

        const candidates = await db.getAllCandidates();
        const matches = matchingAlgorithm.findMatchesForClient(client, candidates);
        res.json({ success: true, client, matches });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get matches' });
    }
});

// Excel Exports
router.get('/export/clients', async (req, res) => {
    try {
        const clients = await db.getAllClients();
        const buffer = excelExport.exportClientsToExcel(clients);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="SEG_Clients_${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: 'Export failed' });
    }
});

router.get('/export/candidates', async (req, res) => {
    try {
        const candidates = await db.getAllCandidates();
        const buffer = excelExport.exportCandidatesToExcel(candidates);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="SEG_Candidates_${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: 'Export failed' });
    }
});

router.get('/export/matches/:clientId', async (req, res) => {
    try {
        const clients = await db.getAllClients();
        const client = clients.find(c => c.id === parseInt(req.params.clientId));
        if (!client) return res.status(404).json({ error: 'Client not found' });

        const candidates = await db.getAllCandidates();
        const matches = matchingAlgorithm.findMatchesForClient(client, candidates);
        const buffer = excelExport.exportMatchesToExcel(client, matches);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="SEG_Matches_${client.id}.xlsx"`);
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: 'Export failed' });
    }
});

// Auth check
router.get('/auth-check', (req, res) => {
    res.json({ success: true, message: 'Authenticated' });
});

module.exports = { initAdminRoutes };
