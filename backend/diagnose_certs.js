const supabase = require('./db/config');
const fs = require('fs');
const path = require('path');

async function diagnose() {
  console.log("--- CHECK 1: Database rows ---");
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, name, roll_number, email, role,
      applications:applications(id, status, current_stage),
      certificates:certificates(id, certificate_id, file_path, transcript_path, qr_code_path)
    `)
    .eq('role', 'student');

  if (error) {
    console.error("Query 1 failed:", error);
    return;
  }

  const certData = [];
  data.forEach(u => {
    const app = u.applications && u.applications[0];
    const cert = u.certificates && u.certificates[0];
    console.log(`Student: ${u.name} | AppStatus: ${app?.status} | Stage: ${app?.current_stage} | Cert: ${cert?.certificate_id} | CertPath: ${cert?.file_path}`);
    if (cert) certData.push(cert);
  });

  console.log("\n--- CHECK 2: File System Checks ---");
  certData.forEach(c => {
    if (c.file_path) {
      const p = path.resolve(__dirname, '..', c.file_path.startsWith('uploads') ? c.file_path : `uploads/certificates/${c.file_path}`);
      console.log(`Cert ${c.certificate_id} PDF exists: ${fs.existsSync(p)} | path: ${c.file_path}`);
    } else {
      console.log(`Cert ${c.certificate_id} MISSING file_path`);
    }
  });

  console.log("\n--- CHECK 8: File Listing ---");
  console.log("Certificates folder:", fs.existsSync('../uploads/certificates') ? fs.readdirSync('../uploads/certificates').length + " files" : "MISSING");
  console.log("Documents folder:", fs.existsSync('../uploads/documents') ? fs.readdirSync('../uploads/documents').length + " files" : "MISSING");
  console.log("Receipts folder:", fs.existsSync('../uploads/receipts') ? fs.readdirSync('../uploads/receipts').length + " files" : "MISSING");
}
diagnose().catch(console.error);
