const express = require('express');
const router = express.Router();
const lc = require('../controllers/library.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

// GET /api/library/sync
router.get('/sync', lc.getLibrarySync);

// POST /api/library/approve
router.post('/approve', lc.approveStudent);

// POST /api/library/flag
router.post('/flag', lc.flagStudent);

module.exports = router;
