const fs = require('fs');

async function run() {
  const tokens = JSON.parse(fs.readFileSync('test-tokens.json'));
  const studentToken = tokens['test student login'];
  const labToken = tokens['lab in-charge'];
  const docId = fs.readFileSync('docA.id', 'utf8').trim();

  console.log("=== STEP 3: Approve (Lab) ===");
  let res = await fetch(`http://localhost:5000/api/documents/${docId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${labToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ comment: 'Lab manual is complete and verified.' })
  });
  let text = await res.text();
  console.log("Approve Status:", res.status, text.substring(0, 300));
  
  if (res.status === 200) {
    const json = JSON.parse(text);
    console.log("Overall Status:", json.document?.overall_status);
  }

  // Sleep occasionally to ensure DB triggers finish
  await new Promise(r => setTimeout(r, 2000));

  console.log("\n=== STEP 4: Download Certificate ===");
  res = await fetch(`http://localhost:5000/api/documents/${docId}/certificate`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` },
    redirect: 'manual' // Wait! We want to see if it gives us the signed URL (302 redirect)
  });
  
  // Notice: 'redirect: "manual"' returns the 302 response directly without following it.
  console.log("Download Status:", res.status);
  console.log("Download Headers (Location):", res.headers.get('location'));
}

run();
