const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { requireAuth } = require('../middleware/auth.middleware');
const { parseAndInsertDues } = require('../services/csvParser');
const supabase = require('../db/config');

// Multer — store file in memory so we can pass buffer to csvParser
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are accepted'));
    }
  },
});

// ─── GET /api/dues/flagged — list all dues (admin use) ────────────────────────
router.get('/flagged', requireAuth, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('dues_flags')
      .select('*, users(name, roll_number, branch)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, dues: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/dues/upload-csv — receive CSV, parse, insert dues ──────────────
router.post('/upload-csv', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const department = (req.body.department || 'library').toLowerCase();
    const result     = await parseAndInsertDues(req.file.buffer, department);

    res.json({
      success:  true,
      inserted: result.inserted,
      flagged:  result.flagged,
      errors:   result.errors,
      message:  `Processed ${result.inserted} records. ${result.flagged} students flagged. ${result.errors} rows skipped.`,
    });
  } catch (err) {
    console.error('[dues/upload-csv]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/dues/:id/pay — mark a due as paid ────────────────────────────
router.patch('/:id/pay', requireAuth, async (req, res) => {
  try {
    const { data: due, error } = await supabase
      .from('dues_flags')
      .update({ is_paid: true })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !due) {
      return res.status(404).json({ error: 'Due not found' });
    }

    res.json({ success: true, due });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
