const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const principalController = require('../controllers/principal.controller');

router.use(requireAuth);

router.get('/sync', principalController.getPrincipalSync);
router.post('/approve', principalController.approveApp);
router.post('/flag', principalController.flagApp);
router.post('/undo', principalController.undoDecision);
router.post('/notifications/read', principalController.markNotificationRead);
router.post('/notifications/read-all', principalController.markAllRead);

module.exports = router;
