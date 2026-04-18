const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const labController = require('../controllers/lab.controller');

router.use(requireAuth);

router.get('/sync', labController.getLabSync);
router.post('/approve', labController.approveStudent);
router.post('/flag', labController.flagStudent);
router.post('/equipment', labController.toggleEquipment);
router.post('/equipment/bulk', labController.executeBulk);
router.post('/undo', labController.undoDecision);

module.exports = router;
