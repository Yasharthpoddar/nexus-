const fs = require('fs');
const FormData = require('form-data');

async function run() {
  const tokens = JSON.parse(fs.readFileSync('test-tokens.json'));
  const studentToken = tokens['test student login'];
  const labToken = tokens['lab in-charge'];
  const hodToken = tokens['HOD'];

  // Step 1: Upload Dept NOC
  console.log("=== STEP 1: Upload ===");
  const form = new FormData();
  form.append('doc_type_code', 'dept_noc');
  form.append('file', Buffer.from('%PDF-1.4 Mock Dept NOC'), {
    filename: 'test-dept-noc.pdf',
    contentType: 'application/pdf'
  });

  let res = await fetch('http://localhost:5000/api/documents/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentToken}`, ...form.getHeaders() },
    body: form.getBuffer()
  });
  let text = await res.text();
  console.log("Upload:", res.status);
  
  if(res.status !== 200 && res.status !== 201) return;
  const docId = JSON.parse(text).document?.id || JSON.parse(text).data?.id || JSON.parse(text).id;
  fs.writeFileSync('docB.id', docId);
  console.log("DOC_B_ID =", docId);

  // Step 2: Lab In-charge Approves
  console.log("\n=== STEP 2: Approve (Lab) ===");
  res = await fetch(`http://localhost:5000/api/documents/${docId}/approve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${labToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment: 'Lab cleared.' })
  });
  console.log("Lab Approve:", res.status);
  if(res.status !== 200) {
    console.log(await res.text());
  }

  // Step 3: HOD Rejects
  console.log("\n=== STEP 3: Reject (HOD) ===");
  res = await fetch(`http://localhost:5000/api/documents/${docId}/reject`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${hodToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestedChanges: 'Please attach the faculty signature on page 2.',
      comment: 'Missing faculty signature.'
    })
  });
  console.log("HOD Reject:", res.status);
  if(res.status !== 200) {
    console.log(await res.text());
  }
}
run();
