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
router.delete('/students/:id', adminController.deleteStudent);
router.delete('/authorities/:id', adminController.deleteAuthority);
router.post('/students/bulk', adminController.bulkRegisterStudents);
router.post('/trigger-nudge', adminController.triggerNudge);

module.exports = router;
