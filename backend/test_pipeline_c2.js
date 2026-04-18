const fs = require('fs');
const FormData = require('form-data');

async function run() {
  const tokens = JSON.parse(fs.readFileSync('test-tokens.json'));
  const studentToken = tokens['test student login'];
  const principalToken = tokens['Principal'];
  const docId = fs.readFileSync('docC.id', 'utf8').trim();

  // Step 5: Student Resubmits
  console.log("=== STEP 5: Resubmit (Student) ===");
  const form = new FormData();
  form.append('file', Buffer.from('%PDF-1.4 Mock Final NOC - Revised'), {
    filename: 'test-final-noc-revised.pdf',
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

  await new Promise(r => setTimeout(r, 1500));

  // Step 6: Principal Approves
  console.log("\n=== STEP 6: Approve (Principal) ===");
  res = await fetch(`http://localhost:5000/api/documents/${docId}/approve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${principalToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment: 'Accounts stamp is now present. Final Full Clearance Approved.' })
  });
  console.log("Principal Approve:", res.status);
  if(res.status !== 200) console.log(await res.text());
}
run();
