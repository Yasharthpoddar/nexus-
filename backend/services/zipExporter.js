const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const supabase = require('../db/config');

async function bundleStudentRecords(userId) {
  const tmpZipPath = path.resolve(__dirname, '..', 'uploads', `bundle-${userId}-${Date.now()}.zip`);
  const output = fs.createWriteStream(tmpZipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  const errors = [];
  let fileCount = 0;

  const addFileToZip = (filePath, zipPath) => {
    if (!filePath) {
      errors.push(`Missing path for ${zipPath}`);
      return;
    }
    
    // Resolve absolute path
    const resolvedPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
      
    if (fs.existsSync(resolvedPath)) {
      archive.file(resolvedPath, { name: zipPath });
      fileCount++;
    } else {
      // For Supabase public URLs, we'd need to fetch and pipe. To simplify local bundle:
      if (filePath.startsWith('http')) {
        errors.push(`Remote storage file skipped in local bundle: ${filePath}`);
      } else {
        errors.push(`File not found on disk: ${filePath}`);
      }
    }
  };

  return new Promise(async (resolve, reject) => {
    output.on('close', () => resolve({ archivePath: tmpZipPath, fileCount, errors }));
    archive.on('error', (err) => reject(err));
    archive.pipe(output);

    try {
      // 1 — UPLOADED DOCUMENTS (Verified)
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'Verified')
        .order('created_at', { ascending: true });

      for (const doc of (docs || [])) {
        const filename = doc.name || path.basename(doc.file_path || `document-${doc.id}.pdf`);
        const typeName = (doc.type || 'document').replace(/\s+/g, '_');
        const zipPath = `01_Documents/${typeName}__Verified__${filename}`;
        
        // Favour local file_path if it exists
        addFileToZip(doc.file_path || doc.storage_path, zipPath);
      }

      // 2 — PAYMENT RECEIPTS
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'Completed')
        .order('paid_at', { ascending: true });

      for (const payment of (payments || [])) {
        if (payment.receipt_path) {
          const filename = `Receipt_${payment.receipt_no || payment.transaction_id}.pdf`;
          addFileToZip(payment.receipt_path, `02_Payment_Receipts/${filename}`);
        } else {
          errors.push(`No receipt file for payment ${payment.transaction_id || payment.id}`);
        }
      }

      // 3 — NO-DUES CERTIFICATE
      const { data: certs } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId);

      for (const cert of (certs || [])) {
        if (cert.file_path) {
          addFileToZip(cert.file_path, `03_Certificates/NoDuesCertificate_${cert.certificate_id}.pdf`);
        }
      }

      // 4 — README inside ZIP
      const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
      
      const readmeContent = `NEXUS DIGITAL LOCKER EXPORT
==============================
Student: ${user?.name || 'Student'}
Roll No: ${user?.roll_number || '—'}
Programme: ${user?.programme || '—'}
Batch: ${user?.batch || '—'}
Export Date: ${new Date().toLocaleString('en-IN')}

CONTENTS:
01_Documents/     — All verified clearance documents (${(docs || []).length} files)
02_Payment_Receipts/ — Payment receipts for cleared dues (${(payments || []).length} receipts)
03_Certificates/  — No-Dues Certificate (${(certs || []).length} certificates)

VERIFICATION:
Scan the QR code on the certificate or visit ${process.env.CERT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/certificates/verify/<certificate_number>
to verify the authenticity of your No-Dues Certificate.

FILES WITH ERRORS (not included):
${errors.length ? errors.join('\n') : 'None — all expected files included.'}
`;

      archive.append(readmeContent, { name: 'README.txt' });
      
      // We must await archive.finalize() so it writes out the ZIP.
      await archive.finalize();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { bundleStudentRecords };
