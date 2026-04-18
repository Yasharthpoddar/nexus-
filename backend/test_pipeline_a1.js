const fs = require('fs');

async function run() {
  const tokens = JSON.parse(fs.readFileSync('test-tokens.json'));
  const studentToken = tokens['test student login'];
  const labToken = tokens['lab in-charge'];

  if (!studentToken || !labToken) throw new Error("Missing tokens");

  console.log("=== STEP 1: Upload ===");
  // We need multipart/form-data for upload
  const FormData = require('form-data');
  const form = new FormData();
  form.append('doc_type_code', 'lab_manual');
  form.append('file', Buffer.from('%PDF-1.4 Mock PDF Data'), {
    filename: 'test-lab-manual.pdf',
    contentType: 'application/pdf'
  });

  let res = await fetch('http://localhost:5000/api/documents/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      ...form.getHeaders()
    },
    body: form.getBuffer()
  });

  let text = await res.text();
  console.log("Upload Status:", res.status, text.substring(0, 200));
  let docId = null;
  if (res.status === 201 || res.status === 200) {
    const json = JSON.parse(text);
    docId = json.document?.id || json.data?.id || JSON.parse(text).id;
    if(!docId && json.document) docId = json.document.id;
    console.log("DOC_A_ID =", docId);
  }

  if (!docId) return;

  console.log("\n=== STEP 2: Pending Lab Queue ===");
  res = await fetch('http://localhost:5000/api/documents/pending/lab', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${labToken}` }
  });
  text = await res.text();
  console.log("Pending Queue Status:", res.status);
  
  if (res.status === 200) {
    const json = JSON.parse(text);
    const docs = json.documents || json.data;
    const found = docs?.find(d => d.id === docId || d.document?.id === docId);
    console.log(`Doc in Queue? ${!!found}`);
  }

  // Save ID for next step
  fs.writeFileSync('docA.id', docId);
}

run();
