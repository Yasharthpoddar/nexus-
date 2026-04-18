const fs = require('fs');
const FormData = require('form-data');

async function run() {
  const tokens = JSON.parse(fs.readFileSync('test-tokens.json'));
  const studentToken = tokens['test student login'];
  const hodToken = tokens['HOD'];
  const docId = fs.readFileSync('docB.id', 'utf8').trim();

  // Step 5: Student Resubmits
  console.log("=== STEP 5: Resubmit (Student) ===");
  const form = new FormData();
  form.append('file', Buffer.from('%PDF-1.4 Mock Dept NOC - Revised'), {
    filename: 'test-dept-noc-revised.pdf',
    contentType: 'application/pdf'
  });

  let res = await fetch(`http://localhost:5000/api/documents/${docId}/resubmit`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentToken}`, ...form.getHeaders() },
    body: form.getBuffer()
  });
  let text = await res.text();
  console.log("Resubmit:", res.status);
  if(res.status !== 200) console.log(text);

  // Small delay for triggers
  await new Promise(r => setTimeout(r, 1500));

  // Step 6: HOD Approves
  console.log("\n=== STEP 6: Approve (HOD) ===");
  res = await fetch(`http://localhost:5000/api/documents/${docId}/approve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${hodToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment: 'Faculty signature now present. Approved.' })
  });
  console.log("HOD Approve:", res.status);
  if(res.status !== 200) console.log(await res.text());
}
run();
