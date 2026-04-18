const fs = require('fs');
const bcrypt = require('bcryptjs');

async function test() {
  const accounts = [
    { name: 'test student', url: 'register', body: { name: 'Test Student', email: 'test.student@college.edu', password: 'test1234', role: 'student', roll_number: '21CS999', batch: '2021-2025', programme: 'B.Tech CS' } },
    { name: 'test student login', url: 'login', body: { email: 'test.student@college.edu', password: 'test1234' } },
    { name: 'lab in-charge', url: 'login', body: { email: 'lab.mehta@college.edu', password: 'lab1234' } },
    { name: 'HOD', url: 'login', body: { email: 'prof.sharma@college.edu', password: 'hod1234' } },
    { name: 'Principal', url: 'login', body: { email: 'principal@college.edu', password: 'principal1234' } },
    { name: 'Admin', url: 'login', body: { email: 'admin@nexus.edu', password: 'admin1234' } }
  ];

  const results = {};
  for (const acc of accounts) {
    let res, text;
    try {
      res = await fetch(`http://localhost:5000/api/auth/${acc.url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(acc.body)
      });
      text = await res.text();
    } catch(err) {
      console.log(`[${acc.name}] Failed request:`, err.message);
      continue;
    }

    console.log(`[${acc.name}] ${res.status}: ${text}`);
    if (res.status === 200 || res.status === 201) {
      try {
        const json = JSON.parse(text);
        if (json.token) results[acc.name] = json.token;
      } catch(e) {}
    } else if (res.status === 401 || res.status === 400 || res.status === 404 || res.status === 500) {
      const hash = bcrypt.hashSync(acc.body.password, 10);
      console.log(`[FIX] Need to update DB for ${acc.body.email}. Hash to use: ${hash}`);
    }
  }
  fs.writeFileSync('test-tokens.json', JSON.stringify(results, null, 2));
}

test();
