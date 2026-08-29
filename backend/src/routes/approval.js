const express = require('express');
const store = require('../models/store');
const { verifySignature } = require('../auth/crypto');
const router = express.Router();

router.post('/request', (req, res) => {
    const approval = store.createApproval(req.body);
    res.status(202).json(approval);
});

router.post('/', (req, res) => {
    const approval = store.createApproval(req.body);
    res.status(201).json(approval);
});

router.post('/clear', (req, res) => {
    store.approvals.clear();
    res.json({ status: 'cleared' });
});

router.get('/pending', (req, res) => {
    const pending = Array.from(store.approvals.values()).filter(a => a.status === 'PENDING');
    res.json(pending);
});

router.get('/active-agents', (req, res) => {
    const approvals = Array.from(store.approvals.values());
    const agentsMap = new Map();

    // Group ONLY real live agent sessions dynamically created during runtime
    approvals.forEach(a => {
        const agentName = a.agent_name || a.device_id || 'CLI Agent';
        agentsMap.set(agentName, {
            agent: agentName,
            status: a.status === 'PENDING' ? 'RUNNING (INTERCEPTED)' : 'COMPLETED / IDLE',
            current_command: a.command,
            risk_score: a.risk_score,
            last_active: a.createdAt
        });
    });

    res.json(Array.from(agentsMap.values()));
});

router.get('/wait/:id', (req, res) => {
    const { id } = req.params;
    const approval = store.approvals.get(id);
    if (!approval) return res.status(404).json({ error: 'Not found' });
    res.json(approval);
});

router.post('/response', (req, res) => {
    const { request_id, status } = req.body;
    const approval = store.updateApprovalStatus(request_id, status);
    res.json(approval || { status: 'ok' });
});

router.post('/:id/respond', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const approval = store.updateApprovalStatus(id, status);
    res.json(approval || { status: 'ok' });
});

router.post('/reset', (req, res) => {
    store.approvals.clear();
    res.json({ status: 'cleared' });
});

module.exports = router;
