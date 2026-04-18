/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  NEXUS — Document Pipeline Routes
 *
 *  Role-gated endpoints with multer file upload support.
 *  Student routes require role='student'.
 *  Authority routes require role != 'student' (admin/hod/principal/lab-incharge).
 *  Shared routes require only authentication.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth.middleware');
const dc = require('../controllers/documents.controller');

// ─── Multer Configuration ────────────────────────────────────────────────────
const uploadsDir = path.resolve(__dirname, '..', 'uploads', 'documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed. Accepted: ${allowed.join(', ')}`));
    }
  }
});

// ─── Role Guard Middleware ───────────────────────────────────────────────────

/** Only students (role='student') */
function studentOnly(req, res, next) {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied. Student role required.' });
  }
  next();
}

/** Only authorities (role != 'student') — lab-incharge, hod, principal, admin */
function authorityOnly(req, res, next) {
  if (req.user.role === 'student') {
    return res.status(403).json({ message: 'Access denied. Authority role required.' });
  }
  next();
}

// All routes require authentication
router.use(requireAuth);

// ═══════════════════════════════════════════════════════════════════════════════
//  SHARED ROUTES (any authenticated user)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/documents/types — list all document types
router.get('/types', dc.getDocumentTypes);

// ═══════════════════════════════════════════════════════════════════════════════
//  STUDENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/documents/upload — upload a new document
// Multer field name: 'file'
router.post('/upload', studentOnly, upload.single('file'), dc.uploadDocument);

// GET /api/documents/mine — get all my documents with full history
router.get('/mine', studentOnly, dc.getMyDocuments);

// POST /api/documents/:id/resubmit — resubmit a rejected document
router.post('/:id/resubmit', studentOnly, upload.single('file'), dc.resubmitDocument);

// GET /api/documents/:id/certificate — download document certificate PDF
router.get('/:id/certificate', studentOnly, dc.getDocumentCertificate);

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTHORITY ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/documents/pending/:stage — get documents pending at a stage
router.get('/pending/:stage', authorityOnly, dc.getPendingForStage);

// POST /api/documents/:id/approve — approve a document at current stage
router.post('/:id/approve', authorityOnly, dc.approveDocument);

// POST /api/documents/:id/reject — reject a document at current stage
router.post('/:id/reject', authorityOnly, dc.rejectDocument);


// ═══════════════════════════════════════════════════════════════════════════════
//  SHARED ROUTES (any authenticated user)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/documents/preview/:documentId — serve the raw file bytes for inline preview
router.get('/preview/:documentId', async (req, res) => {
  try {
    const supabase = require('../db/config');
    const { documentId } = req.params;

    const { data: doc, error } = await supabase
      .from('documents')
      .select('id, name, file_path')
      .eq('id', documentId)
      .single();

    if (error || !doc) return res.status(404).json({ error: 'Document not found' });
    if (!doc.file_path) return res.status(404).json({ error: 'No file on record for this document' });

    // Always reconstruct from filename only — ignore any stored Windows absolute path
    const filename = path.basename(doc.file_path);
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server', filename, uploadsDir });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf':  'application/pdf',
      '.jpg':  'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png':  'image/png',
      '.doc':  'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.sendFile(filePath);
  } catch (err) {
    console.error('[preview] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/:id/history — view full verification trail
router.get('/:id/history', dc.getDocumentHistory);


module.exports = router;
