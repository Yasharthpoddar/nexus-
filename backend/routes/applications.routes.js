const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.get('/mine', (req, res) => {
  res.status(200).json({ success: true, applications: [] });
});

module.exports = router;
