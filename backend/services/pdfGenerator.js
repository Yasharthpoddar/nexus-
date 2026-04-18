const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const storageService = require('./storageService');
const supabase = require('../db/config');
const crypto = require('crypto');

async function generateCertificate(applicationId, studentData, deptStatus) {
  // Final Clearance Certificate logic
  const year = new Date().getFullYear();
  const serial = crypto.randomBytes(2).toString('hex').toUpperCase();
  const certId = `NX-FINAL-${year}-${serial}`;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  page.drawText('NEXUS', { x: 50, y: 760, size: 36, font: fontBold });
  page.drawText('FINAL APPLICATON CLEARANCE CERTIFICATE', { x: 50, y: 730, size: 14, font: fontReg });
  
  page.drawText(`Certificate ID: ${certId}`, { x: 50, y: 680, size: 12, font: fontBold });
  page.drawText(`Name: ${studentData.name || 'Unknown'}`, { x: 50, y: 660, size: 12, font: fontReg });
  page.drawText(`Roll No: ${studentData.roll_number || 'Unknown'}`, { x: 50, y: 640, size: 12, font: fontReg });
  
  let y = 600;
  for (const dept of deptStatus || []) {
    page.drawText(`${dept.department}: ${dept.status}`, { x: 50, y, size: 10, font: fontReg });
    y -= 20;
  }

  const pdfBytes = await pdfDoc.save();
  const Buffer = require('buffer').Buffer;
  const remotePath = await storageService.uploadToStorage(
    'nexus-certificates', 
    `${certId}.pdf`, 
    Buffer.from(pdfBytes), 
    'application/pdf'
  );

  return { certificateId: certId, path: remotePath };
}

module.exports = { generateCertificate };
