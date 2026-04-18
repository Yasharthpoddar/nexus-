const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const hodController = require('../controllers/hod.controller');

router.use(requireAuth);

router.get('/sync', hodController.getHodSync);
router.post('/approve', hodController.approveApp);
router.post('/flag', hodController.flagApp);
router.post('/batch', hodController.batchAction);
router.post('/undo', hodController.undoDecision);
router.post('/document/verify', hodController.toggleDoc);
router.post('/notifications/read', hodController.markNotifRead);

module.exports = router;
