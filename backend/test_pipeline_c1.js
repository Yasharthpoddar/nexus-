const fs = require('fs');
const FormData = require('form-data');

async function run() {
  const tokens = JSON.parse(fs.readFileSync('test-tokens.json'));
  const studentToken = tokens['test student login'];
  const labToken = tokens['lab in-charge'];
  const hodToken = tokens['HOD'];
  const principalToken = tokens['Principal'];

  // Step 1: Upload Final No Dues
  console.log("=== STEP 1: Upload ===");
  const form = new FormData();
  form.append('doc_type_code', 'final_no_dues');
  form.append('file', Buffer.from('%PDF-1.4 Mock Final NOC'), {
    filename: 'test-final-noc.pdf',
    contentType: 'application/pdf'
  });

  let res = await fetch('http://localhost:5000/api/documents/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentToken}`, ...form.getHeaders() },
    body: form.getBuffer()
  });
  let text = await res.text();
  console.log("Upload:", res.status);
  if (res.status !== 200 && res.status !== 201) return console.log(text);
  
  const docId = JSON.parse(text).document?.id || JSON.parse(text).data?.id || JSON.parse(text).id;
  console.log("DOC_C_ID =", docId);

  // Step 2: Lab Approves
  console.log("\n=== STEP 2: Approve (Lab) ===");
  res = await fetch(`http://localhost:5000/api/documents/${docId}/approve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${labToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment: 'Lab clearance okay.' })
  });
  console.log("Lab Approve:", res.status);

  // Step 3: HOD Approves
  console.log("\n=== STEP 3: Approve (HOD) ===");
  res = await fetch(`http://localhost:5000/api/documents/${docId}/approve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${hodToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment: 'HOD clearance okay.' })
  });
  console.log("HOD Approve:", res.status);

  // Step 4: Principal Rejects
  console.log("\n=== STEP 4: Reject (Principal) ===");
  res = await fetch(`http://localhost:5000/api/documents/${docId}/reject`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${principalToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestedChanges: 'Accounts clearance stamp is missing. Please get it signed by accounts officer.',
      comment: 'Missing accounts stamp.'
    })
  });
  console.log("Principal Reject:", res.status);

  fs.writeFileSync('docC.id', docId);
}
run();
