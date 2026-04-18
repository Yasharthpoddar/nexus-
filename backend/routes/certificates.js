/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  NEXUS — Certificate Routes
 *
 *  GET  /api/certificates/mine              — list student's own certs
 *  GET  /api/certificates/download/:certId  — download PDF by certificate_id
 *  GET  /api/certificates/verify/:certId    — public verify endpoint
 *  POST /api/certificates/admin/regenerate/:userId — admin: rebuild PDF on disk
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const supabase = require('../db/config');
const { requireAuth } = require('../middleware/auth.middleware');
const { regenerateCertificateForUser } = require('../services/pdfGenerator');

const router = express.Router();

// ─── GET /api/certificates/pdf/:certificateId — PUBLIC, no auth ───────────────
// This is the URL encoded in the QR code inside the PDF.
// Anyone who scans the QR gets the PDF rendered inline in their browser/phone.
router.get('/pdf/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;

    const { data: cert, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('certificate_id', certificateId)
      .single();

    if (error || !cert) {
      return res.status(404).send('Certificate not found.');
    }

    let filePath = cert.file_path;
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(process.cwd(), filePath);
    }

    // Auto-regenerate if file missing
    if (!fs.existsSync(filePath)) {
      console.log(`[certificates/pdf] File missing, regenerating for cert ${certificateId}`);
      try {
        const result = await regenerateCertificateForUser(cert.user_id);
        filePath = result.certPath;
      } catch (genErr) {
        return res.status(500).send('Certificate file unavailable.');
      }
    }

    // Serve inline so phone browsers render the PDF directly
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${certificateId}.pdf"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.sendFile(path.resolve(filePath));
  } catch (err) {
    console.error('[certificates/pdf]', err);
    res.status(500).send(err.message);
  }
});

// All routes below require authentication
router.use(requireAuth);

// ─── GET /api/certificates/mine — list certs for current student ─────────────
router.get('/mine', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', req.user.id)
      .order('issued_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, certificates: data || [] });
  } catch (err) {
    console.error('[certificates/mine]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/certificates/download/:certificateId — download PDF ────────────
router.get('/download/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;

    // Fetch record — allow student to get their own, allow admin/authority to get any
    const isAuthority = ['admin', 'hod', 'principal', 'lab-incharge'].includes(req.user.role);
    let query = supabase.from('certificates').select('*').eq('certificate_id', certificateId);
    if (!isAuthority) {
      query = query.eq('user_id', req.user.id);
    }

    const { data: cert, error } = await query.single();

    if (error || !cert) {
      return res.status(404).json({ error: 'Certificate not found or access denied.' });
    }

    // Resolve file path — handle both relative and absolute paths
    let filePath = cert.file_path;
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(process.cwd(), filePath);
    }

    // If file missing, regenerate it now
    if (!fs.existsSync(filePath)) {
      console.log(`[certificates/download] File missing at ${filePath}, regenerating...`);
      try {
        const result = await regenerateCertificateForUser(cert.user_id);
        filePath = result.certPath;
      } catch (genErr) {
        console.error('[certificates/download] Regeneration failed:', genErr.message);
        return res.status(500).json({ error: 'Certificate file not found and regeneration failed.' });
      }
    }

    const fileName = `NoDuesCertificate-${cert.certificate_id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.sendFile(path.resolve(filePath));
  } catch (err) {
    console.error('[certificates/download]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/certificates/verify/:certificateId — public verify (no auth) ───
// Note: this is added WITHOUT router.use(requireAuth) applying to it
// We handle it here but it will 401 — add a separate unprotected route in server.js
// For now: return cert metadata only
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const { data: cert, error } = await supabase
      .from('certificates')
      .select('certificate_id, issued_at, user_id')
      .eq('certificate_id', req.params.certificateId)
      .single();

    if (error || !cert) return res.status(404).json({ valid: false, error: 'Certificate not found.' });

    const { data: user } = await supabase
      .from('users')
      .select('name, roll_number, branch, batch')
      .eq('id', cert.user_id)
      .single();

    res.json({
      valid: true,
      certificateId: cert.certificate_id,
      issuedAt: cert.issued_at,
      student: user || {},
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/certificates/admin/regenerate/:userId — admin repair ───────────
router.post('/admin/regenerate/:userId', async (req, res) => {
  try {
    const callerRole = req.user.role || req.user.sub_role;
    if (callerRole !== 'admin') {
      return res.status(403).json({ error: 'Admin only.' });
    }

    const { userId } = req.params;
    const result = await regenerateCertificateForUser(userId);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[certificates/admin/regenerate]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/certificates/admin/regenerate-by-cert/:certificateId ──────────
// Regenerate using certificate_id (more convenient since we know CERT-NX-2026-8809)
router.post('/admin/regenerate-by-cert/:certificateId', async (req, res) => {
  try {
    const callerRole = req.user.role || req.user.sub_role;
    if (callerRole !== 'admin') {
      return res.status(403).json({ error: 'Admin only.' });
    }

    const { certificateId } = req.params;

    // Find the cert record and get user_id
    const { data: cert, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('certificate_id', certificateId)
      .single();

    if (error || !cert) return res.status(404).json({ error: 'Certificate record not found.' });

    const result = await regenerateCertificateForUser(cert.user_id);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[certificates/admin/regenerate-by-cert]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
