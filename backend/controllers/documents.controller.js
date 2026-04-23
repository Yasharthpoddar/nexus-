/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  NEXUS — Document Verification Controller
 *
 *  HTTP layer for the smart document pipeline.
 *  Handles request parsing, role gating, file handling (multer),
 *  and delegates all business logic to services/documentPipeline.js.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const supabase = require('../db/config');
const pipeline = require('../services/documentPipeline');
const gemini = require('../services/geminiService');
const path = require('path');
const fs = require('fs');
const storageService = require('../services/storageService');

// ─── GET DOCUMENT TYPES (shared) ─────────────────────────────────────────────
// GET /api/documents/types
const getDocumentTypes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('document_types')
      .select('*')
      .order('name');
    if (error) throw error;
    res.status(200).json({ success: true, documentTypes: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── UPLOAD / SUBMIT A DOCUMENT (student only) ──────────────────────────────
// POST /api/documents/upload
// Accepts multipart via multer. Body: { doc_type_code, name? }
const uploadDocument = async (req, res) => {
  const userId = req.user.id;
  const { doc_type_code, name } = req.body;

  try {
    // 1. Validate doc type exists and get its verification path
    if (!doc_type_code) {
      return res.status(400).json({ message: 'doc_type_code is required.' });
    }

    const { stages, generates_certificate, docType } = await pipeline.getVerificationPath(doc_type_code);
    const firstStage = stages[0] || 'lab';

    // 2. Get student's active application
    const { data: apps } = await supabase
      .from('applications')
      .select('id, users!inner(name, roll_number)')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(1);

    if (!apps || apps.length === 0) {
      return res.status(400).json({ message: 'No active application found for this student.' });
    }
    const applicationId = apps[0].id;
    const student = apps[0].users;

    // 3. Resolve file path from multer upload
    let filePath = null;
    let originalName = name || 'document';

    if (req.file) {
      filePath = req.file.path;                      // e.g. uploads/documents/1713...-file.pdf
      originalName = name || req.file.originalname;
    } else if (req.body.filePath) {
      filePath = req.body.filePath;                   // Fallback: manual path in body
    }

    // 4. Insert into documents table
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .insert([{
        application_id: applicationId,
        name: originalName,
        doc_type: docType.name,
        doc_type_code,
        file_path: filePath,
        status: 'Pending',
        overall_status: 'pending',
        current_stage: firstStage,
        resubmission_count: 0
      }])
      .select('*');

    if (docErr || !doc) throw docErr || new Error('Failed to insert document');

    const uploadedDocId = doc[0].id;

    // 5. AUTO-VERIFICATION: Gemini AI Check
    console.log(`[AI-Check] Triggering analysis for ${originalName}...`);
    const aiResult = await gemini.analyzeDocument(filePath, student.name, student.roll_number);

    if (aiResult.success) {
      const { match, reason, extracted_name, extracted_id } = aiResult.analysis;
      
      // Update document with AI metadata
      await supabase
        .from('documents')
        .update({
          ai_verification_status: match ? 'verified' : 'mismatch',
          ai_verification_details: aiResult.analysis
        })
        .eq('id', uploadedDocId);

      if (!match) {
        console.log(`[AI-Reject] Mismatch detected: ${reason}`);
        
        // AUTO-REJECT: Delegate to pipeline rejection
        const SYSTEM_AI_ID = '6c1aa7ac-265d-40ea-960a-67e714f32bf6'; 
        
        await pipeline.processRejection(
          uploadedDocId, 
          SYSTEM_AI_ID, 
          `Auto-rejected by Nexus AI: ${reason}`,
          `Extracted: Name="${extracted_name}", ID="${extracted_id}"`
        );

        return res.status(200).json({
          success: true,
          status: 'Auto-Rejected',
          message: `AI Verification Failed: ${reason}`,
          document: doc[0]
        });
      }
      console.log(`[AI-Verified] Document matches student profile.`);
    } else {
      console.warn(`[AI-Warning] Verification failed/skipped: ${aiResult.error}`);
    }

    // 6. Create first pending verification record (if not auto-rejected)
    await supabase.from('document_verifications').insert([{
      document_id: uploadedDocId,
      stage: firstStage,
      status: 'pending'
    }]);

    // 7. Notify lab-incharge
    await supabase.from('notifications').insert([{
      to_role: 'lab-incharge',
      application_id: applicationId,
      message: `New ${docType.name} uploaded by ${student.name} (${student.roll_number}) is waiting for your verification. [AI Status: ${aiResult.success && aiResult.analysis.match ? 'Verified' : 'Manual Check Req'}]`,
      is_read: false
    }]);

    res.status(200).json({
      success: true,
      document: doc[0],
      ai_status: aiResult.success ? aiResult.analysis : { error: aiResult.error },
      verificationPath: stages,
      currentStage: firstStage,
      totalStages: stages.length,
      generates_certificate
    });

  } catch (err) {
    console.error('[uploadDocument]', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ─── APPROVE A DOCUMENT (authority only) ─────────────────────────────────────
// POST /api/documents/:id/approve
const approveDocument = async (req, res) => {
  const { id: documentId } = req.params;
  const { comment } = req.body;
  const actorId = req.user.id;

  try {
    const result = await pipeline.processApproval(documentId, actorId, comment);

    res.status(200).json({
      success: true,
      message: result.fullyApproved
        ? 'Document fully verified. Certificate generated if applicable.'
        : `Document approved at current stage and advanced to ${result.nextStage}.`,
      document: result.document,
      history: result.history,
      nextStage: result.nextStage,
      fullyApproved: result.fullyApproved
    });

  } catch (err) {
    console.error('[approveDocument]', err.message);
    const status = err.message.includes('mismatch') ? 403
                 : err.message.includes('not found') ? 404
                 : 500;
    res.status(status).json({ message: err.message });
  }
};

// ─── REJECT A DOCUMENT (authority only) ──────────────────────────────────────
// POST /api/documents/:id/reject
const rejectDocument = async (req, res) => {
  const { id: documentId } = req.params;
  const { requestedChanges, comment } = req.body;
  const actorId = req.user.id;

  try {
    const result = await pipeline.processRejection(documentId, actorId, requestedChanges, comment);

    res.status(200).json({
      success: true,
      message: `Document rejected at ${result.rejectedAtStage} stage. Student must resubmit to this stage only.`,
      document: result.document,
      rejectedAtStage: result.rejectedAtStage,
      requestedChanges: result.requestedChanges
    });

  } catch (err) {
    console.error('[rejectDocument]', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ─── RESUBMIT A REJECTED DOCUMENT (student only) ────────────────────────────
// POST /api/documents/:id/resubmit
const resubmitDocument = async (req, res) => {
  const { id: documentId } = req.params;
  const studentId = req.user.id;

  try {
    // Resolve new file path from multer or body
    let newFilePath = null;
    if (req.file) {
      newFilePath = req.file.path;
    } else if (req.body.filePath) {
      newFilePath = req.body.filePath;
    }

    if (!newFilePath) {
      return res.status(400).json({ message: 'A new file (or filePath) is required for resubmission.' });
    }

    const result = await pipeline.processResubmission(documentId, studentId, newFilePath);

    res.status(200).json({
      success: true,
      message: `Document resubmitted to ${result.resubmittedToStage} stage for re-review.`,
      document: result.document,
      resubmittedToStage: result.resubmittedToStage
    });

  } catch (err) {
    console.error('[resubmitDocument]', err.message);
    const status = err.message.includes('not belong') ? 403
                 : err.message.includes('not in') ? 400
                 : err.message.includes('not found') ? 404
                 : 500;
    res.status(status).json({ message: err.message });
  }
};

// ─── GET MY DOCUMENTS (student only) ─────────────────────────────────────────
// GET /api/documents/mine
const getMyDocuments = async (req, res) => {
  const userId = req.user.id;
  console.log('[DEBUG] getMyDocuments Start:', { userId });

  try {
    // Get student's application
    const { data: apps, error: appError } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(1);

    if (appError) {
      console.error('[DEBUG] getMyDocuments appError:', appError);
      throw appError;
    }
    
    console.log('[DEBUG] getMyDocuments found apps:', apps?.length);

    if (!apps || apps.length === 0) {
      return res.status(200).json({ success: true, documents: [] });
    }
    const applicationId = apps[0].id;

    // Fetch all documents with verification history and type info
    console.log('[DEBUG] getMyDocuments Fetching documents for appId:', applicationId);
    const { data, error } = await supabase
      .from('documents')
      .select(`
        id, name, doc_type, doc_type_code, current_stage, overall_status,
        status, resubmission_count, rejected_at_stage, date, storage_path,
        file_path, certificate_id,
        document_types!documents_doc_type_code_fkey(
          name, code, requires_lab, requires_hod, requires_principal, generates_certificate
        ),
        document_verifications(
          id, stage, status, comment, requested_changes, actioned_at,
          users!document_verifications_actioned_by_fkey(id, name, sub_role)
        )
      `)
      .eq('application_id', applicationId)
      .order('date', { ascending: false });

    if (error) {
      console.error('[DEBUG] getMyDocuments docsQuery error:', error);
      throw error;
    }
    
    console.log('[DEBUG] getMyDocuments found docs:', data?.length);

    // Enrich each document with computed progress
    const enriched = await Promise.all((data || []).map(async (doc) => {
      let verificationPath = ['lab'];

      if (doc.doc_type_code) {
        try {
          const pathResult = await pipeline.getVerificationPath(doc.doc_type_code);
          verificationPath = pathResult.stages;
        } catch (e) { /* use default */ }
      }

      const completedStages = [...new Set(
        (doc.document_verifications || [])
          .filter(v => v.status === 'approved')
          .map(v => v.stage)
      )];

      return {
        ...doc,
        verificationPath,
        completedStages,
        totalStages: verificationPath.length,
        completedCount: completedStages.length,
        progressPercent: Math.round((completedStages.length / verificationPath.length) * 100)
      };
    }));

    res.status(200).json({ success: true, documents: enriched });

  } catch (err) {
    console.error('[getMyDocuments]', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ─── GET DOCUMENT HISTORY (student + authority) ──────────────────────────────
// GET /api/documents/:id/history
const getDocumentHistory = async (req, res) => {
  const { id: documentId } = req.params;

  try {
    // Fetch the document with its type and the student info
    const { data: docData, error: docErr } = await supabase
      .from('documents')
      .select('*, document_types(*), applications!inner(id, user_id, users!inner(id, name, roll_number, branch, batch, email))')
      .eq('id', documentId);

    if (docErr) throw docErr;
    if (!docData || docData.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }
    const doc = docData[0];

    // Fetch full verification history with actor info
    const { data: history, error: histErr } = await supabase
      .from('document_verifications')
      .select('*, users!document_verifications_actioned_by_fkey(id, name, role, sub_role)')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });

    if (histErr) throw histErr;

    // Compute verification path
    let verificationPath = [];
    if (doc.doc_type_code) {
      const pathResult = await pipeline.getVerificationPath(doc.doc_type_code);
      verificationPath = pathResult.stages;
    }

    res.status(200).json({
      success: true,
      document: doc,
      verificationPath,
      history: history || []
    });

  } catch (err) {
    console.error('[getDocumentHistory]', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ─── GET PENDING DOCUMENTS FOR A STAGE (authority only) ──────────────────────
// GET /api/documents/pending/:stage
const getPendingForStage = async (req, res) => {
  const { stage } = req.params;

  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        id, name, doc_type, doc_type_code, current_stage, overall_status,
        resubmission_count, rejected_at_stage, date, file_path,
        document_verifications(id, stage, status, comment, requested_changes, actioned_at),
        applications!inner(
          id, user_id,
          users!inner(id, name, roll_number, branch, batch, email)
        )
      `)
      .eq('current_stage', stage)
      .in('overall_status', ['pending', 'in_progress']);

    if (error) throw error;

    // Enrich with verification path
    const enriched = await Promise.all((data || []).map(async (doc) => {
      let verificationPath = ['lab'];
      if (doc.doc_type_code) {
        try {
          const pathResult = await pipeline.getVerificationPath(doc.doc_type_code);
          verificationPath = pathResult.stages;
        } catch (e) { /* use default */ }
      }
      const completedStages = [...new Set(
        (doc.document_verifications || [])
          .filter(v => v.status === 'approved')
          .map(v => v.stage)
      )];
      return {
        ...doc,
        verificationPath,
        completedStages,
        totalStages: verificationPath.length,
        completedCount: completedStages.length
      };
    }));

    res.status(200).json({ success: true, documents: enriched });

  } catch (err) {
    console.error('[getPendingForStage]', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ─── GET / SERVE DOCUMENT CERTIFICATE PDF (student only) ─────────────────────
// GET /api/documents/:id/certificate
const getDocumentCertificate = async (req, res) => {
  const { id: documentId } = req.params;
  const userId = req.user.id;

  try {
    // Fetch the document
    const { data: docs } = await supabase
      .from('documents')
      .select('*, applications!inner(user_id)')
      .eq('id', documentId);

    if (!docs || docs.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }
    const doc = docs[0];

    // Verify ownership (student can only download their own)
    if (req.user.role === 'student' && doc.applications?.user_id !== userId) {
      return res.status(403).json({ message: 'You do not have access to this certificate.' });
    }

    // Check if certificate exists
    if (!doc.certificate_id) {
      return res.status(404).json({ message: 'No certificate has been generated for this document yet.' });
    }

    // Fetch certificate record
    const { data: certs } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', doc.certificate_id);

    if (!certs || certs.length === 0) {
      return res.status(404).json({ message: 'Certificate record not found.' });
    }
    const cert = certs[0];

    // Serve via Signed URL
    const signedUrl = await storageService.getSignedUrl('nexus-certificates', cert.file_path, 3600);
    return res.redirect(signedUrl);

  } catch (err) {
    console.error('[getDocumentCertificate]', err.message);
    res.status(500).json({ message: err.message });
  }
};


module.exports = {
  getDocumentTypes,
  uploadDocument,
  approveDocument,
  rejectDocument,
  resubmitDocument,
  getMyDocuments,
  getDocumentHistory,
  getPendingForStage,
  getDocumentCertificate
};
