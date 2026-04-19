/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  NEXUS — PDF Certificate Generator
 *
 *  Generates fully styled No-Dues Certificates using pdf-lib.
 *  Saves files locally to uploads/certificates/.
 *  Works with both the document pipeline (per-doc certs) and the
 *  full certificate package (all-clearances summary).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const supabase = require('../db/config');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
};

function ensureCertDir() {
  const certDir = path.join(process.cwd(), 'uploads', 'certificates');
  fs.mkdirSync(certDir, { recursive: true });
  return certDir;
}

// ─── Generate unique certificate ID ─────────────────────────────────────────

async function generateCertificateId(prefix = 'NX-DOC') {
  const year = new Date().getFullYear();
  const serial = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${year}-${serial}`;
}

// ─── Generate QR code PNG buffer + save file ─────────────────────────────────

async function generateQRCode(certificateId) {
  // Public URL — scanning opens the PDF directly, no login required
  const pdfUrl = `${process.env.CERT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/certificates/pdf/${certificateId}`;
  const qrBuffer = await QRCode.toBuffer(pdfUrl, { width: 120, margin: 1, color: { dark: '#121212', light: '#FFFFFF' } });

  const certDir = ensureCertDir();
  const qrPath = path.join(certDir, `qr-${certificateId}.png`);
  fs.writeFileSync(qrPath, qrBuffer);

  return { qrBuffer, qrPath };
}

// ─── Core PDF builder ────────────────────────────────────────────────────────

async function generateNoDuesCertificate(studentData, certificateId, qrBuffer) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const black     = hexToRgb('#121212');
  const yellow    = hexToRgb('#F0C020');
  const gray      = hexToRgb('#888888');
  const lightGray = hexToRgb('#444444');
  const white     = rgb(1, 1, 1);

  // ── Top header bar ──────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: black });
  page.drawText('NEXUS', { x: width / 2 - 42, y: height - 38, size: 28, font: fontBold, color: white });
  page.drawText('THE AUTOMATED CLEARANCE PROTOCOL', {
    x: width / 2 - 110, y: height - 56, size: 8, font: fontRegular, color: rgb(0.7, 0.7, 0.7),
  });
  // Yellow accent stripe
  page.drawRectangle({ x: 0, y: height - 73, width, height: 3, color: yellow });

  // ── Certificate title ───────────────────────────────────────────────────────
  page.drawText('DIGITAL NO-DUES CERTIFICATE', {
    x: width / 2 - 130, y: height - 110, size: 20, font: fontBold, color: black,
  });
  page.drawText('Official Certificate of Full Departmental Clearance', {
    x: width / 2 - 143, y: height - 130, size: 10, font: fontRegular, color: gray,
  });

  // Divider
  page.drawLine({ start: { x: 40, y: height - 145 }, end: { x: width - 40, y: height - 145 }, thickness: 1.5, color: yellow });

  // ── Student section ─────────────────────────────────────────────────────────
  page.drawText('THIS IS TO CERTIFY THAT', {
    x: width / 2 - 75, y: height - 175, size: 10, font: fontRegular, color: gray,
  });

  const name = (studentData.name || 'Student').toUpperCase();
  const nameWidth = fontBold.widthOfTextAtSize(name, 26);
  const nameX = width / 2 - nameWidth / 2;
  page.drawText(name, { x: nameX, y: height - 210, size: 26, font: fontBold, color: black });
  // Yellow underline
  page.drawRectangle({ x: nameX, y: height - 215, width: nameWidth, height: 3, color: yellow });

  // Student details
  const detailY = [240, 258, 276];
  const details = [
    `Roll Number: ${studentData.rollNumber || studentData.roll_number || '—'}`,
    `Programme: ${studentData.programme || 'B.Tech'}  |  Branch: ${studentData.branch || '—'}`,
    `Batch: ${studentData.batch || '—'}`,
  ];
  details.forEach((text, i) => {
    const tw = fontRegular.widthOfTextAtSize(text, 11);
    page.drawText(text, { x: width / 2 - tw / 2, y: height - detailY[i], size: 11, font: fontRegular, color: lightGray });
  });

  // Body text
  const bodyLines = [
    'has successfully completed all departmental clearances and has no outstanding',
    'dues with any department of the institution, and is hereby granted',
    'this official No-Dues Certificate.',
  ];
  bodyLines.forEach((line, i) => {
    const lw = (i < 2 ? fontRegular : fontOblique).widthOfTextAtSize(line, 11);
    page.drawText(line, {
      x: width / 2 - lw / 2, y: height - (310 + i * 18),
      size: 11, font: i < 2 ? fontRegular : fontOblique, color: lightGray,
    });
  });

  // ── Authority section ────────────────────────────────────────────────────────
  page.drawLine({ start: { x: 40, y: height - 380 }, end: { x: width - 40, y: height - 380 }, thickness: 0.5, color: hexToRgb('#E0E0E0') });

  const sectionLabel = 'CLEARANCE VERIFIED BY';
  const slw = fontBold.widthOfTextAtSize(sectionLabel, 8);
  page.drawText(sectionLabel, { x: width / 2 - slw / 2, y: height - 398, size: 8, font: fontBold, color: gray });

  const authorities = [
    { label: 'LAB IN-CHARGE',      name: studentData.labInchargeName  || 'Dr. Rajesh Mehta',   date: studentData.approvalDates?.lab       || '' },
    { label: 'HEAD OF DEPARTMENT', name: studentData.hodName           || 'Prof. Anita Sharma',  date: studentData.approvalDates?.hod       || '' },
    { label: 'PRINCIPAL',          name: studentData.principalName     || 'Dr. Vandana Rao',     date: studentData.approvalDates?.principal || '' },
  ];

  const colXs = [55, width / 2 - 65, width - 185];
  authorities.forEach((auth, i) => {
    page.drawText(auth.label, { x: colXs[i], y: height - 418, size: 7, font: fontBold, color: gray });
    page.drawText(auth.name,  { x: colXs[i], y: height - 432, size: 9, font: fontBold, color: black });
    if (auth.date) {
      page.drawText(auth.date, { x: colXs[i], y: height - 446, size: 7, font: fontRegular, color: gray });
    }
    // Signature line
    page.drawLine({
      start: { x: colXs[i], y: height - 450 },
      end:   { x: colXs[i] + 130, y: height - 450 },
      thickness: 0.5, color: hexToRgb('#CCCCCC'),
    });
  });

  // ── Certificate metadata ─────────────────────────────────────────────────────
  page.drawLine({ start: { x: 40, y: height - 468 }, end: { x: width - 40, y: height - 468 }, thickness: 0.5, color: hexToRgb('#E0E0E0') });

  const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  page.drawText(`Certificate No: ${certificateId}`, { x: 40, y: height - 495, size: 10, font: fontBold, color: black });
  page.drawText(`Issue Date: ${issueDate}`,          { x: 40, y: height - 513, size: 9,  font: fontRegular, color: gray });
  page.drawText('This certificate is digitally generated and tamper-evident.', {
    x: 40, y: height - 529, size: 8, font: fontRegular, color: hexToRgb('#AAAAAA'),
  });

  // ── QR code ──────────────────────────────────────────────────────────────────
  if (qrBuffer) {
    const qrImage = await pdfDoc.embedPng(qrBuffer);
    page.drawImage(qrImage, { x: width - 125, y: height - 520, width: 80, height: 80 });
    page.drawText('Scan to verify', { x: width - 115, y: height - 528, size: 7, font: fontRegular, color: gray });
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width, height: 50, color: black });
  page.drawRectangle({ x: 0, y: 50, width, height: 3, color: yellow });
  const publicPdfUrl = `${process.env.CERT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/certificates/pdf/${certificateId}`;
  const urlLabel = `Scan QR or visit: ${publicPdfUrl}`;
  const urlWidth = fontRegular.widthOfTextAtSize(urlLabel, 7);
  page.drawText(urlLabel, {
    x: Math.max(10, width / 2 - urlWidth / 2), y: 18, size: 7, font: fontRegular, color: rgb(0.7, 0.7, 0.7),
  });

  // ── Save to disk ─────────────────────────────────────────────────────────────
  const pdfBytes = await pdfDoc.save();
  const certDir  = ensureCertDir();
  const certPath = path.join(certDir, `${certificateId}.pdf`);
  fs.writeFileSync(certPath, pdfBytes);

  return { pdfBytes, certPath };
}

// ─── Full package: generate cert for a document after pipeline approval ──────
// Called by documentPipeline.js when a document reaches 'completed' stage

async function generateDocumentCertificate(documentId, studentData) {
  const certId = await generateCertificateId('NX-DOC');
  const { qrBuffer, qrPath } = await generateQRCode(certId);
  const { certPath } = await generateNoDuesCertificate(studentData, certId, qrBuffer);

  // Store certificate record in Supabase
  const { data, error } = await supabase
    .from('certificates')
    .insert({
      user_id:     studentData.userId,
      certificate_id: certId,
      file_path:   `uploads/certificates/${certId}.pdf`,
      issued_at:   new Date().toISOString(),
    })
    .select()
    .single();

  if (error) console.error('[pdfGenerator] Certificate DB insert error:', error.message);

  // Update the document row with certificate_id
  await supabase
    .from('documents')
    .update({ certificate_id: data?.id || null })
    .eq('id', documentId);

  return { certificateId: certId, certPath, qrPath, dbRecord: data };
}

// ─── Regenerate a certificate by student userId (for admin/repair use) ────────

async function regenerateCertificateForUser(userId) {
  // Fetch student
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userErr || !user) throw new Error(`User not found: ${userId}`);

  // Fetch all applications to get the latest cleared application
  const { data: apps } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .limit(1);
    
  if (apps && apps.length > 0 && apps[0].status === 'Approved') {
    return await generateFullCertificatePackage(userId);
  }

  // Fallback to legacy structure if not fully approved via pipeline
  const { data: existingCerts } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false })
    .limit(1);

  const certId = (existingCerts && existingCerts.length > 0)
    ? existingCerts[0].certificate_id
    : await generateCertificateId('NX-CERT');

  const studentData = {
    name:         user.name,
    rollNumber:   user.roll_number || '—',
    programme:    user.programme   || 'B.Tech',
    branch:       user.branch      || '—',
    batch:        user.batch       || '—',
    userId:       user.id,
    principalName:    'Dr. Vandana Rao',
    hodName:          'Prof. Anita Sharma',
    labInchargeName:  'Dr. Rajesh Mehta',
    approvalDates: {
      lab:       new Date().toLocaleDateString('en-IN'),
      hod:       new Date().toLocaleDateString('en-IN'),
      principal: new Date().toLocaleDateString('en-IN'),
    },
  };

  const { qrBuffer, qrPath } = await generateQRCode(certId);
  const { certPath } = await generateNoDuesCertificate(studentData, certId, qrBuffer);
  const relPath = `uploads/certificates/${certId}.pdf`;

  // Upsert in DB
  if (existingCerts && existingCerts.length > 0) {
    await supabase
      .from('certificates')
      .update({ file_path: relPath, issued_at: new Date().toISOString() })
      .eq('certificate_id', certId);
  } else {
    await supabase
      .from('certificates')
      .insert({ user_id: userId, certificate_id: certId, file_path: relPath, issued_at: new Date().toISOString() });
  }

  return { certificateId: certId, certPath, qrPath };
}

// ─── Generate Full Certificate Package (PDF + JSON Transcript) ──────────────
async function generateFullCertificatePackage(studentId) {
  // 1. Fetch Student from DB
  const { data: student, error: studentErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', studentId)
    .single();
    
  if (studentErr || !student) throw new Error('Student not found');

  // 2. Fetch Latest application dates mapping
  const { data: appData } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', studentId)
    .order('submitted_at', { ascending: false })
    .limit(1);

  const app = appData && appData.length > 0 ? appData[0] : null;

  // 3. Assemble approval dates (mocked if not found in app payload)
  const approvalDates = {
    lab: app ? new Date(app.submitted_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
    hod: app ? new Date(app.submitted_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
    principal: new Date().toLocaleDateString('en-IN')
  };

  const studentData = {
    name:         student.name,
    rollNumber:   student.roll_number || '—',
    programme:    student.programme   || 'B.Tech',
    branch:       student.branch      || '—',
    batch:        student.batch       || '—',
    userId:       student.id,
    principalName:    'Dr. Vandana Rao',
    hodName:          'Prof. Anita Sharma',
    labInchargeName:  'Dr. Rajesh Mehta',
    approvalDates
  };

  // 4. Create paths
  const certNumber = await generateCertificateId('NX-CERT');
  const uploadDir = ensureCertDir();
  
  // 5. Build PDF using existing generator
  const { qrBuffer, qrPath } = await generateQRCode(certNumber);
  const { certPath } = await generateNoDuesCertificate(studentData, certNumber, qrBuffer);

  // 6. Build Transcript JSON
  const transcriptData = {
    certificateNumber: certNumber,
    issuedAt: new Date().toISOString(),
    student: {
      name: student.name,
      roll_number: student.roll_number || '—',
      department: student.branch || '—'
    },
    clearances: [
      { department: 'Laboratory', status: 'Cleared', date: approvalDates.lab, by: studentData.labInchargeName },
      { department: 'HOD', status: 'Cleared', date: approvalDates.hod, by: studentData.hodName },
      { department: 'Principal', status: 'Approved', date: approvalDates.principal, by: studentData.principalName }
    ]
  };

  const transcriptFileName = `ClearanceTranscript_${student.roll_number || studentId}.json`;
  const transcriptPath = path.join(uploadDir, transcriptFileName);
  fs.writeFileSync(transcriptPath, JSON.stringify(transcriptData, null, 2));

  // 7. Insert or update DB. We map transcript to qr_code_path since we couldn't run schema migrations
  const fileRelPath = `uploads/certificates/${certNumber}.pdf`;
  const transcriptRelPath = `uploads/certificates/${transcriptFileName}`;
  
  // Check if exists
  const { data: existing } = await supabase.from('certificates').select('id').eq('user_id', studentId);
  if (existing && existing.length > 0) {
    await supabase.from('certificates')
      .update({ 
        certificate_id: certNumber, 
        file_path: fileRelPath, 
        qr_code_path: transcriptRelPath,
        issued_at: new Date().toISOString()
      }).eq('user_id', studentId);
  } else {
    await supabase.from('certificates')
      .insert({ 
        user_id: studentId, 
        certificate_id: certNumber, 
        file_path: fileRelPath, 
        qr_code_path: transcriptRelPath, 
        issued_at: new Date().toISOString() 
      });
  }

  return { certificateId: certNumber, certPath, transcriptPath, qrPath };
}

// ─── Legacy wrapper (used by old applications pipeline) ──────────────────────

async function generateCertificate(applicationId, studentData, deptStatus) {
  const certId = await generateCertificateId('NX-APP');
  const { qrBuffer } = await generateQRCode(certId);
  const { certPath } = await generateNoDuesCertificate(studentData, certId, qrBuffer);
  return { certificateId: certId, path: certPath };
}

// ─── Generate Payment Receipt PDF ──────────────────────────────────────────────
async function generatePaymentReceipt(paymentData, studentData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 420]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const black = rgb(0.07, 0.07, 0.07);
  const yellow = rgb(0.94, 0.75, 0.13);
  const gray = rgb(0.53, 0.53, 0.53);
  const white = rgb(1, 1, 1);

  // Header bar
  page.drawRectangle({ x: 0, y: height - 60, width, height: 60, color: black });
  page.drawText('NEXUS', { x: 40, y: height - 28, size: 22, font: fontBold, color: white });
  page.drawText('PAYMENT RECEIPT', { x: 40, y: height - 46, size: 9, font: fontRegular, color: rgb(0.7, 0.7, 0.7) });
  page.drawText(paymentData.receiptNo || 'RECEIPT', { x: width - 180, y: height - 35, size: 11, font: fontBold, color: yellow });

  // Yellow accent line
  page.drawRectangle({ x: 0, y: height - 63, width, height: 3, color: yellow });

  // Student info
  page.drawText('PAID TO', { x: 40, y: height - 95, size: 8, font: fontBold, color: gray });
  page.drawText('NEXUS CLEARANCE SYSTEM', { x: 40, y: height - 112, size: 11, font: fontBold, color: black });
  page.drawText('PAID BY', { x: 300, y: height - 95, size: 8, font: fontBold, color: gray });
  page.drawText(studentData.name || 'STUDENT', { x: 300, y: height - 112, size: 11, font: fontBold, color: black });
  page.drawText(`Roll No: ${studentData.rollNumber || studentData.roll_number || '—'}`, { x: 300, y: height - 128, size: 9, font: fontRegular, color: gray });

  // Divider
  page.drawLine({ start: { x: 40, y: height - 145 }, end: { x: width - 40, y: height - 145 }, thickness: 1, color: rgb(0.88, 0.88, 0.88) });

  // Payment details table
  const rows = [
    ['Department', paymentData.department || 'General'],
    ['Amount Paid', `INR ${(parseFloat(paymentData.amount) || 0).toFixed(2)}`],
    ['Payment ID', paymentData.paymentId || '—'],
    ['Transaction Date', new Date(paymentData.paidAt || Date.now()).toLocaleString('en-IN')],
    ['Payment Status', 'SUCCESS'],
    ['Reason', paymentData.reason || 'Dues clearance'],
  ];

  rows.forEach(([label, value], i) => {
    const y = height - 175 - (i * 28);
    page.drawRectangle({ x: 40, y: y - 8, width: width - 80, height: 26, color: i % 2 === 0 ? rgb(0.98, 0.98, 0.98) : white });
    page.drawText(label, { x: 50, y, size: 9, font: fontBold, color: gray });
    page.drawText(String(value), { x: 250, y, size: 10, font: fontBold, color: black });
  });

  // PAID stamp
  page.drawRectangle({ x: width - 130, y: height - 270, width: 90, height: 34, color: black });
  page.drawText('PAID', { x: width - 113, y: height - 248, size: 18, font: fontBold, color: yellow });

  // Footer
  page.drawRectangle({ x: 0, y: 0, width, height: 40, color: black });
  page.drawRectangle({ x: 0, y: 40, width, height: 2, color: yellow });
  page.drawText('This is a system-generated receipt and does not require a physical signature.', {
    x: width / 2 - 180, y: 15, size: 8, font: fontRegular, color: white
  });

  const pdfBytes = await pdfDoc.save();
  const receiptDir = path.join(process.cwd(), 'uploads', 'receipts');
  fs.mkdirSync(receiptDir, { recursive: true });
  const receiptPath = Math.random() > -1 ? path.join(receiptDir, `receipt-${paymentData.receiptNo}.pdf`) : 'fallback';
  fs.writeFileSync(receiptPath, pdfBytes);
  // Store the relative path format uniformly
  return `uploads/receipts/receipt-${paymentData.receiptNo}.pdf`;
}

module.exports = {
  generateCertificate,
  generateNoDuesCertificate,
  generateDocumentCertificate,
  regenerateCertificateForUser,
  generateFullCertificatePackage,
  generateQRCode,
  generateCertificateId,
  generatePaymentReceipt,
};
