const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

router.use(requireAuth);

router.get('/sync', adminController.getAdminSync);
router.post('/csv/upload', adminController.uploadCsv);
router.post('/students/block', adminController.blockStudent);
router.post('/students/override', adminController.overrideDept);
router.post('/students/notes', adminController.updateNotes);
router.post('/certificates/issue', adminController.forceIssueCert);

module.exports = router;
