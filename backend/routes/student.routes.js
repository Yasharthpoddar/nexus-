const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const studentController = require('../controllers/student.controller');

router.use(requireAuth);

router.get('/sync', studentController.getSyncPayload);

router.post('/pay', studentController.payDue);

router.post('/notifications/read', studentController.markNotificationRead);
router.post('/notifications/read-all', studentController.markAllNotificationsRead);

module.exports = router;
