require('dotenv').config();
const { generateFullCertificatePackage } = require('./services/pdfGenerator');
const supabase = require('./db/config');

async function test() {
  const { data } = await supabase.from('users').select('id').eq('role', 'student').limit(1);
  if (!data || !data.length) {
    console.log("No student found");
    return;
  }
  
  try {
    const result = await generateFullCertificatePackage(data[0].id);
    console.log("Success:", result);
  } catch (err) {
    console.error("Generator Error:", err);
  }
}

test();
