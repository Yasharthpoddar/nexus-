/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  NEXUS — Smart Document Verification Pipeline
 *  
 *  The brain of the document clearance system.
 *  Handles verification path resolution, multi-stage approvals,
 *  intelligent rejections (return-to-rejecting-stage only),
 *  resubmission routing, Supabase Storage persistence,
 *  and automatic PDF certificate generation via pdf-lib.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const supabase = require('../db/config');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const storageService = require('./storageService');

const CERT_PUBLIC_BASE_URL = process.env.CERT_PUBLIC_BASE_URL || 'https://nexus.college.edu/verify';
const SUPABASE_URL = process.env.SUPABASE_URL;

// ─── Local cache for document_types to avoid repeated DB hits ────────────────
let docTypeCache = null;
let docTypeCacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

async function getDocTypeByCode(code) {
  // Refresh cache if stale
  if (!docTypeCache || Date.now() - docTypeCacheTime > CACHE_TTL) {
    const { data, error } = await supabase
      .from('document_types')
      .select('*');
    if (error) throw new Error(`Failed to fetch document_types: ${error.message}`);
    docTypeCache = data;
    docTypeCacheTime = Date.now();
  }
  const found = docTypeCache.find(dt => dt.code === code);
  if (!found) throw new Error(`Unknown document type code: "${code}"`);
  return found;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FUNCTION 1 — getVerificationPath(docTypeCode)
//
//  Queries document_types table for the given code.
//  Returns an ordered array of stages the document must pass through.
//
//  Examples:
//    lab_manual     →  ['lab']
//    dept_noc       →  ['lab', 'hod']
//    final_no_dues  →  ['lab', 'hod', 'principal']
//    id_card        →  ['lab']  (generates_certificate = false)
// ═══════════════════════════════════════════════════════════════════════════════

async function getVerificationPath(docTypeCode) {
  const docType = await getDocTypeByCode(docTypeCode);

  const stages = [];
  if (docType.requires_lab)       stages.push('lab');
  if (docType.requires_hod)       stages.push('hod');
  if (docType.requires_principal) stages.push('principal');

  return {
    stages,
    generates_certificate: docType.generates_certificate,
    docType
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FUNCTION 2 — getNextStage(docTypeCode, currentStage)
//
//  Given the document type and current stage, returns the next stage
//  in the path, or null if there is no next stage (fully approved).
// ═══════════════════════════════════════════════════════════════════════════════

async function getNextStage(docTypeCode, currentStage) {
  const { stages } = await getVerificationPath(docTypeCode);
  const idx = stages.indexOf(currentStage);

  if (idx === -1) return null;           // stage not in path — shouldn't happen
  if (idx === stages.length - 1) return null; // last stage — fully done

  return stages[idx + 1];
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FUNCTION 3 — processApproval(documentId, approvingUserId, comment)
//
//  Main approval handler. Flow:
//    1. Fetch document + doc_type
//    2. Verify approving user's sub_role matches current_stage
//    3. Insert approved verification record
//    4. Advance to next stage (or mark fully approved + auto-cert)
//    5. Return updated document with full verification history
// ═══════════════════════════════════════════════════════════════════════════════

async function processApproval(documentId, approvingUserId, comment) {
  // 1. Fetch the document with its doc_type and student info
  const { data: docs, error: docErr } = await supabase
    .from('documents')
    .select('*, applications!inner(users(name))')
    .eq('id', documentId);

  if (docErr || !docs || docs.length === 0) {
    throw new Error('Document not found');
  }
  const doc = docs[0];

  if (!doc.doc_type_code) {
    throw new Error('Document has no type code (doc_type_code). Cannot resolve verification path.');
  }

  // 2. Verify the approving user's sub_role matches the document's current_stage
  const { data: users, error: userErr } = await supabase
    .from('users')
    .select('id, name, sub_role, role')
    .eq('id', approvingUserId);

  if (userErr || !users || users.length === 0) {
    throw new Error('Approving user not found');
  }
  const approver = users[0];

  // Map sub_role to stage: 'lab-incharge' matches stage 'lab'
  const roleStageMap = {
    'lab-incharge': 'lab',
    'lab':          'lab',
    'hod':          'hod',
    'principal':    'principal',
    'admin':        doc.current_stage  // admin can approve at any stage
  };
  const approverStage = roleStageMap[approver.sub_role] || roleStageMap[approver.role];

  if (approverStage !== doc.current_stage) {
    throw new Error(
      `Role mismatch: user has sub_role "${approver.sub_role}" ` +
      `(maps to stage "${approverStage}") but document is at stage "${doc.current_stage}"`
    );
  }

  // 3. Insert approved verification record
  const now = new Date().toISOString();
  const { error: verErr } = await supabase
    .from('document_verifications')
    .insert([{
      document_id: documentId,
      stage: doc.current_stage,
      status: 'approved',
      actioned_by: approvingUserId,
      comment: comment || null,
      actioned_at: now
    }]);

  if (verErr) throw new Error(`Failed to insert verification: ${verErr.message}`);

  // 4. Determine next stage
  const nextStage = await getNextStage(doc.doc_type_code, doc.current_stage);

  if (nextStage) {
    // ── Advance to next stage ────────────────────────────────────────────
    await supabase
      .from('documents')
      .update({
        current_stage: nextStage,
        overall_status: 'in_progress',
        status: 'Pending',
        rejected_at_stage: null
      })
      .eq('id', documentId);

    const studentName = doc.applications?.users?.name || 'Student';
    let notifMsg = `Document "${doc.doc_type}" has been approved at ${doc.current_stage} stage and is now awaiting your review.`;
    if (doc.current_stage === 'lab' && nextStage === 'hod') {
      notifMsg = `${doc.doc_type} from ${studentName} has been cleared by Lab In-charge and is ready for your review.`;
    } else if (doc.current_stage === 'hod' && nextStage === 'principal') {
      notifMsg = `${doc.doc_type} from ${studentName} has been cleared by HOD and is ready for your final review.`;
    }

    // Create a notification for the next stage authority
    await supabase.from('notifications').insert([{
      to_role: nextStage === 'lab' ? 'lab-incharge' : nextStage,
      application_id: doc.application_id,
      message: notifMsg,
      is_read: false
    }]);

  } else {
    // ── All stages passed — fully approved ───────────────────────────────
    await supabase
      .from('documents')
      .update({
        current_stage: 'completed',
        overall_status: 'approved',
        status: 'Verified',
        rejected_at_stage: null
      })
      .eq('id', documentId);

    // Trigger post-approval pipeline (storage + cert)
    await handleFullyApproved(documentId);
  }

  // 5. Fetch and return the updated document with full verification history
  const { data: updatedDoc } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId);

  const { data: history } = await supabase
    .from('document_verifications')
    .select('*, users!document_verifications_actioned_by_fkey(id, name, sub_role)')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true });

  return {
    document: updatedDoc?.[0] || null,
    history: history || [],
    nextStage: nextStage,
    fullyApproved: !nextStage
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FUNCTION 4 — processRejection(documentId, rejectingUserId, requestedChanges, comment)
//
//  Smart rejection: returns document ONLY to the stage that rejected it.
//  
//  Flow:
//    1. Fetch document
//    2. Insert rejected verification record
//    3. Set overall_status = 'needs_resubmission'
//    4. Set rejected_at_stage = current_stage (the KEY field)
//    5. Increment resubmission_count
//    6. Notify student with requested_changes
// ═══════════════════════════════════════════════════════════════════════════════

async function processRejection(documentId, rejectingUserId, requestedChanges, comment) {
  // 1. Fetch the document and rejecting authority info
  const { data: docs, error: docErr } = await supabase
    .from('documents')
    .select('*, applications!inner(users(name))')
    .eq('id', documentId);

  if (docErr || !docs || docs.length === 0) {
    throw new Error('Document not found');
  }
  const doc = docs[0];

  // 2. Insert rejected verification record
  const now = new Date().toISOString();
  const { error: verErr } = await supabase
    .from('document_verifications')
    .insert([{
      document_id: documentId,
      stage: doc.current_stage,
      status: 'rejected',
      actioned_by: rejectingUserId,
      comment: comment || null,
      requested_changes: requestedChanges || null,
      actioned_at: now
    }]);

  if (verErr) throw new Error(`Failed to insert rejection record: ${verErr.message}`);

  // 3-5. Update document: mark rejected, record which stage, increment count
  const { error: updErr } = await supabase
    .from('documents')
    .update({
      overall_status: 'needs_resubmission',
      status: 'Rejected',
      rejected_at_stage: doc.current_stage,   // ← THE KEY FIELD
      resubmission_count: (doc.resubmission_count || 0) + 1
    })
    .eq('id', documentId);

  if (updErr) throw new Error(`Failed to update document: ${updErr.message}`);

  // 6. Notify the student
  const { data: authData } = await supabase.from('users').select('name').eq('id', rejectingUserId).limit(1);
  const authorityName = authData?.[0]?.name || 'Authority';
  const stageName = doc.current_stage === 'lab' ? 'Lab In-charge' : doc.current_stage === 'hod' ? 'HOD' : 'Principal';
  
  if (doc.application_id) {
    await supabase.from('notifications').insert([{
      to_role: 'student',
      application_id: doc.application_id,
      message: `Your ${doc.doc_type} was reviewed by ${authorityName} (${stageName}) and requires changes: ${requestedChanges}. Please resubmit with the corrections.`,
      is_read: false
    }]);
  }

  // Return updated document
  const { data: updatedDoc } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId);

  return {
    document: updatedDoc?.[0] || null,
    rejectedAtStage: doc.current_stage,
    requestedChanges
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FUNCTION 5 — processResubmission(documentId, studentId, newFilePath)
//
//  Called when a student uploads a revised version of a rejected document.
//  Sends document back ONLY to the stage that rejected it — not back to lab.
//
//  Flow:
//    1. Fetch document, verify it belongs to studentId, status is needs_resubmission
//    2. Update file_path and storage_path
//    3. Set current_stage = rejected_at_stage (the magic)
//    4. Set overall_status = pending, clear rejected_at_stage
//    5. Increment resubmission_count
//    6. Notify the authority at the target stage
// ═══════════════════════════════════════════════════════════════════════════════

async function processResubmission(documentId, studentId, newFilePath) {
  // 1. Fetch the document
  const { data: docs, error: docErr } = await supabase
    .from('documents')
    .select('*, applications!inner(user_id, users(name))')
    .eq('id', documentId);

  if (docErr || !docs || docs.length === 0) {
    throw new Error('Document not found');
  }
  const doc = docs[0];

  // Verify ownership
  const ownerUserId = doc.applications?.user_id;
  if (ownerUserId !== studentId) {
    throw new Error('Document does not belong to this student');
  }

  // Verify status
  if (doc.overall_status !== 'needs_resubmission') {
    throw new Error(`Document is not in needs_resubmission state (current: ${doc.overall_status})`);
  }

  const targetStage = doc.rejected_at_stage || doc.current_stage;

  // 2-5. Update the document
  const { error: updErr } = await supabase
    .from('documents')
    .update({
      file_path: newFilePath,
      storage_path: newFilePath,
      current_stage: targetStage,         // ← Send BACK to rejecting stage only
      overall_status: 'pending',
      status: 'Pending',
      rejected_at_stage: null,            // Clear the rejection marker
      resubmission_count: (doc.resubmission_count || 0) + 1
    })
    .eq('id', documentId);

  if (updErr) throw new Error(`Failed to update document: ${updErr.message}`);

  // Insert a new pending verification record at the target stage
  await supabase.from('document_verifications').insert([{
    document_id: documentId,
    stage: targetStage,
    status: 'pending',
    comment: 'Resubmission by student'
  }]);

  // 6. Notify the authority at the target stage
  const studentName = doc.applications?.users?.name || 'Student';
  const resubCount = (doc.resubmission_count || 0) + 1;
  const notifyRole = targetStage === 'lab' ? 'lab-incharge' : targetStage;
  
  await supabase.from('notifications').insert([{
    to_role: notifyRole,
    application_id: doc.application_id,
    message: `${studentName} has resubmitted their ${doc.doc_type} with the requested changes. This is resubmission ${resubCount}. Please review.`,
    is_read: false
  }]);

  // Return updated document
  const { data: updatedDoc } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId);

  return {
    document: updatedDoc?.[0] || null,
    resubmittedToStage: targetStage
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FUNCTION 6 — handleFullyApproved(documentId)
//
//  Called automatically when ALL required stages have approved.
//
//  Flow:
//    1. Fetch document with doc_type
//    2. Save file to Supabase Storage bucket "nexus-documents"
//       Path: [studentRollNo]/[docTypeCode]/[timestamp]-[filename]
//    3. Update documents.storage_path with permanent URL
//    4. If generates_certificate → generateDocumentCertificate()
//    5. If not → just notify student that doc is verified and saved
// ═══════════════════════════════════════════════════════════════════════════════

async function handleFullyApproved(documentId) {
  // 1. Fetch document
  const { data: docs } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId);

  if (!docs || docs.length === 0) throw new Error('Document not found for post-approval');
  const doc = docs[0];

  // Fetch doc type
  let docType = null;
  if (doc.doc_type_code) {
    docType = await getDocTypeByCode(doc.doc_type_code);
  }

  // Fetch student info via application
  const { data: appData } = await supabase
    .from('applications')
    .select('user_id, users(id, name, roll_number)')
    .eq('id', doc.application_id);

  const student = appData?.[0]?.users || null;
  const rollNo = student?.roll_number || 'UNKNOWN';

  // 2. Save file to Supabase Storage
  let permanentUrl = null;
  const storagePath = `${rollNo}/${doc.doc_type_code || 'general'}/${Date.now()}-${doc.name || 'document'}`;

  try {
    if (doc.file_path) {
      const localPath = path.resolve(__dirname, '..', doc.file_path);
      if (fs.existsSync(localPath)) {
        const fileBuffer = fs.readFileSync(localPath);
        const remotePath = await storageService.uploadToStorage('nexus-documents', storagePath, fileBuffer, 'application/pdf');
        permanentUrl = `${SUPABASE_URL}/storage/v1/object/public/nexus-documents/${remotePath}`;
      } else {
        console.warn(`[handleFullyApproved] Local file not found: ${localPath}.`);
        permanentUrl = `${SUPABASE_URL}/storage/v1/object/public/nexus-documents/${storagePath}`;
      }
    } else {
      permanentUrl = `${SUPABASE_URL}/storage/v1/object/public/nexus-documents/${storagePath}`;
    }
  } catch (storageErr) {
    console.error('[handleFullyApproved] Storage error:', storageErr.message);
    permanentUrl = `storage-pending://${storagePath}`;
  }

  // 3. Update storage path on document
  await supabase
    .from('documents')
    .update({ storage_path: permanentUrl })
    .eq('id', documentId);

  // Build exact notification template based on stages length AND certificate flag
  const generatesCert = docType?.generates_certificate ?? true;

  let notifMsg;
  if (!generatesCert) {
    // Non-certificate documents: verified and saved message, no mention of certificate
    notifMsg = `Your ${docType?.name || doc.doc_type} has been verified and approved. Your document is permanently saved.`;
  } else {
    // Certificate documents: use stage-count-aware templates
    notifMsg = `Your ${docType?.name || doc.doc_type} has been verified and approved. Your document certificate is ready to download.`;
    if (doc.doc_type_code) {
      try {
        const { stages } = await getVerificationPath(doc.doc_type_code);
        if (stages.length === 2) {
          notifMsg = `Your ${docType?.name || doc.doc_type} has been verified by Lab In-charge and HOD. Your document certificate is ready to download.`;
        } else if (stages.length === 3) {
          notifMsg = `Your ${docType?.name || doc.doc_type} has received full clearance from all authorities. Your document certificate is ready to download.`;
        }
      } catch(e) {}
    }
  }

  // 4/5. Certificate generation or simple notification
  if (generatesCert) {
    await generateDocumentCertificate(documentId, notifMsg);
  } else {
    // No certificate needed — just notify student
    await supabase.from('notifications').insert([{
      to_role: 'student',
      application_id: doc.application_id,
      message: notifMsg,
      is_read: false
    }]);
  }

  return {
    documentId,
    storagePath: permanentUrl,
    certificateGenerated: docType?.generates_certificate || false
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FUNCTION 7 — generateDocumentCertificate(documentId)
//
//  Generates a PDF certificate for a verified document.
//  Different from the full No-Dues Certificate — this is per-document.
//
//  Certificate contents:
//    • Nexus header
//    • "Document Verification Certificate" subtitle
//    • Student name + roll number
//    • Document type name
//    • All stages passed with authority names and dates
//    • Issue date + certificate ID (NX-DOC-YYYY-XXXX)
//    • QR code encoding verification URL
// ═══════════════════════════════════════════════════════════════════════════════

async function generateDocumentCertificate(documentId, notifMsg = '') {
  // ── Fetch all required data ────────────────────────────────────────────────
  const { data: docs } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId);

  if (!docs || docs.length === 0) throw new Error('Document not found for certificate generation');
  const doc = docs[0];

  // Fetch doc type
  let docType = null;
  if (doc.doc_type_code) {
    docType = await getDocTypeByCode(doc.doc_type_code);
  }

  // Fetch student via application
  const { data: appData } = await supabase
    .from('applications')
    .select('user_id, users(id, name, roll_number, branch, batch)')
    .eq('id', doc.application_id);

  const student = appData?.[0]?.users || { name: 'Unknown Student', roll_number: 'N/A', branch: 'N/A', batch: 'N/A' };

  // Fetch full verification history with approver names
  const { data: history } = await supabase
    .from('document_verifications')
    .select('stage, status, actioned_at, comment, users!document_verifications_actioned_by_fkey(name, sub_role)')
    .eq('document_id', documentId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  // ── Generate Certificate ID ────────────────────────────────────────────────
  const year = new Date().getFullYear();
  const serial = crypto.randomBytes(2).toString('hex').toUpperCase();
  const certificateId = `NX-DOC-${year}-${serial}`;
  const verifyUrl = `${CERT_PUBLIC_BASE_URL}/doc/${certificateId}`;

  // ── Generate QR Code as PNG buffer ─────────────────────────────────────────
  let qrPngBuffer;
  try {
    qrPngBuffer = await QRCode.toBuffer(verifyUrl, {
      width: 120,
      margin: 1,
      color: { dark: '#121212', light: '#FFFFFF' }
    });
  } catch (qrErr) {
    console.warn('[generateDocumentCertificate] QR generation failed:', qrErr.message);
    qrPngBuffer = null;
  }

  // ── Build PDF with pdf-lib ─────────────────────────────────────────────────
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  const black = rgb(0.07, 0.07, 0.07);
  const blue = rgb(0.063, 0.25, 0.753);
  const gold = rgb(0.94, 0.75, 0.13);
  const grey = rgb(0.4, 0.4, 0.4);

  let y = height - 60;

  // ── Decorative top border ──────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: black });
  page.drawRectangle({ x: 0, y: height - 14, width, height: 4, color: gold });

  // ── Header ─────────────────────────────────────────────────────────────────
  y -= 20;
  page.drawText('NEXUS', {
    x: 50, y,
    size: 36,
    font: fontBold,
    color: black
  });

  page.drawText('THE AUTOMATED CLEARANCE PROTOCOL', {
    x: 50, y: y - 22,
    size: 9,
    font: fontRegular,
    color: grey
  });

  // ── Title ──────────────────────────────────────────────────────────────────
  y -= 70;
  page.drawText('DOCUMENT VERIFICATION CERTIFICATE', {
    x: 50, y,
    size: 18,
    font: fontBold,
    color: blue
  });

  // ── Horizontal divider ─────────────────────────────────────────────────────
  y -= 16;
  page.drawRectangle({ x: 50, y, width: width - 100, height: 3, color: black });

  // ── Student Info ───────────────────────────────────────────────────────────
  y -= 35;
  const leftCol = 50;
  const valCol = 200;

  const drawField = (label, value, yPos) => {
    page.drawText(label, { x: leftCol, y: yPos, size: 10, font: fontBold, color: grey });
    page.drawText(String(value || '—'), { x: valCol, y: yPos, size: 11, font: fontRegular, color: black });
  };

  drawField('Student Name:', student.name, y);
  drawField('Roll Number:', student.roll_number, y - 22);
  drawField('Branch / Batch:', `${student.branch || '—'} / ${student.batch || '—'}`, y - 44);
  drawField('Document Type:', docType?.name || doc.doc_type || '—', y - 66);
  drawField('Certificate ID:', certificateId, y - 88);
  drawField('Issue Date:', new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }), y - 110);

  // ── Verification Trail ─────────────────────────────────────────────────────
  y -= 155;
  page.drawText('VERIFICATION TRAIL', {
    x: leftCol, y,
    size: 13,
    font: fontBold,
    color: black
  });

  y -= 8;
  page.drawRectangle({ x: 50, y, width: width - 100, height: 2, color: gold });

  // Table header
  y -= 22;
  const cols = { stage: 55, authority: 170, date: 340, status: 460 };
  page.drawText('STAGE', { x: cols.stage, y, size: 8, font: fontBold, color: grey });
  page.drawText('AUTHORITY', { x: cols.authority, y, size: 8, font: fontBold, color: grey });
  page.drawText('DATE', { x: cols.date, y, size: 8, font: fontBold, color: grey });
  page.drawText('STATUS', { x: cols.status, y, size: 8, font: fontBold, color: grey });

  y -= 4;
  page.drawRectangle({ x: 50, y, width: width - 100, height: 1, color: rgb(0.85, 0.85, 0.85) });

  // Table rows
  const approvedStages = history || [];
  for (const ver of approvedStages) {
    y -= 20;
    if (y < 120) break; // prevent overflow

    const stageName = (ver.stage || '').toUpperCase();
    const authorityName = ver.users?.name || 'System';
    const dateStr = ver.actioned_at
      ? new Date(ver.actioned_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

    page.drawText(stageName, { x: cols.stage, y, size: 10, font: fontBold, color: black });
    page.drawText(authorityName, { x: cols.authority, y, size: 10, font: fontRegular, color: black });
    page.drawText(dateStr, { x: cols.date, y, size: 10, font: fontMono, color: black });
    page.drawText('APPROVED', { x: cols.status, y, size: 9, font: fontBold, color: blue });
  }

  // ── QR Code ────────────────────────────────────────────────────────────────
  if (qrPngBuffer) {
    try {
      const qrImage = await pdfDoc.embedPng(qrPngBuffer);
      const qrSize = 90;
      page.drawImage(qrImage, {
        x: width - 50 - qrSize,
        y: 50,
        width: qrSize,
        height: qrSize
      });
      page.drawText('Scan to verify', {
        x: width - 50 - qrSize + 10,
        y: 38,
        size: 7,
        font: fontRegular,
        color: grey
      });
    } catch (embedErr) {
      console.warn('[generateDocumentCertificate] QR embed failed:', embedErr.message);
    }
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  page.drawText(certificateId, {
    x: 50, y: 55,
    size: 9,
    font: fontMono,
    color: grey
  });
  page.drawText('This is a digitally generated certificate by the Nexus Clearance Protocol.', {
    x: 50, y: 38,
    size: 7,
    font: fontRegular,
    color: grey
  });
  page.drawText('Verify authenticity by scanning the QR code or visiting the verification URL.', {
    x: 50, y: 28,
    size: 7,
    font: fontRegular,
    color: grey
  });

  // Bottom decorative bar
  page.drawRectangle({ x: 0, y: 12, width, height: 4, color: gold });
  page.drawRectangle({ x: 0, y: 0, width, height: 8, color: black });

  // ── Save PDF to Storage ───────────────────────────────────────────────────
  const pdfBytes = await pdfDoc.save();
  const pdfFilename = `${certificateId}.pdf`;
  let remotePath = pdfFilename;
  
  try {
    const Buffer = require('buffer').Buffer;
    remotePath = await storageService.uploadToStorage(
      'nexus-certificates', 
      pdfFilename, 
      Buffer.from(pdfBytes), 
      'application/pdf'
    );
  } catch (err) {
    console.error('[generateDocumentCertificate] Storage upload error:', err.message);
  }

  // ── Persist to certificates table ──────────────────────────────────────────
  const { data: certRow, error: certErr } = await supabase
    .from('certificates')
    .insert([{
      user_id: student.id || appData?.[0]?.user_id,
      certificate_id: certificateId,
      file_path: remotePath
    }])
    .select('id');

  if (certErr) {
    console.error('[generateDocumentCertificate] Certificate DB insert error:', certErr.message);
  }

  // Update documents.certificate_id
  if (certRow && certRow.length > 0) {
    await supabase
      .from('documents')
      .update({ certificate_id: certRow[0].id })
      .eq('id', documentId);
  }

  // ── Notify student ────────────────────────────────────────────────────────
  let finalNotifMsg = notifMsg;
  if (!finalNotifMsg) {
    finalNotifMsg = `Your ${docType?.name || doc.doc_type} has been verified and approved. Your document certificate is ready to download.`;
    if (doc.doc_type_code) {
      try {
        const { stages } = await getVerificationPath(doc.doc_type_code);
        if (stages.length === 2) {
          finalNotifMsg = `Your ${docType?.name || doc.doc_type} has been verified by Lab In-charge and HOD. Your document certificate is ready to download.`;
        } else if (stages.length === 3) {
          finalNotifMsg = `Your ${docType?.name || doc.doc_type} has received full clearance from all authorities. Your document certificate is ready to download.`;
        }
      } catch (e) {}
    }
  }

  await supabase.from('notifications').insert([{
    to_role: 'student',
    application_id: doc.application_id,
    message: finalNotifMsg,
    is_read: false
  }]);

  console.log(`[CERT] Generated ${certificateId} for document "${doc.name}" → ${remotePath}`);

  return {
    certificateId,
    filePath: remotePath,
    dbId: certRow?.[0]?.id || null
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  getVerificationPath,
  getNextStage,
  processApproval,
  processRejection,
  processResubmission,
  handleFullyApproved,
  generateDocumentCertificate
};
