const fs = require('fs');
const FormData = require('form-data');

async function run() {
  const tokens = JSON.parse(fs.readFileSync('test-tokens.json'));
  const studentToken = tokens['test student login'];
  const labToken = tokens['lab in-charge'];

  // Step 1: Upload ID Card
  console.log("=== STEP 1: Upload ===");
  const form = new FormData();
  form.append('doc_type_code', 'id_card');
  form.append('file', Buffer.from('%PDF-1.4 Mock ID Card'), {
    filename: 'test-id-card.pdf',
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
  console.log("DOC_D_ID =", docId);

  // Step 2: Lab Approves
  console.log("\n=== STEP 2: Approve (Lab) ===");
  res = await fetch(`http://localhost:5000/api/documents/${docId}/approve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${labToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment: 'ID Card is valid.' })
  });
  console.log("Lab Approve:", res.status);
  
  fs.writeFileSync('docD.id', docId);
}
run();
