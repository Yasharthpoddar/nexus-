const supabase = require('./db/config');

async function runDiagnostics() {
  console.log('--- CHECK 1: Users having Docs/Payments/Certs ---');
  const [usersRes, docsRes, payRes, certRes] = await Promise.all([
    supabase.from('users').select('id, name, roll_number').eq('role', 'student'),
    supabase.from('documents').select('id, user_id'),
    supabase.from('payments').select('id, user_id'),
    supabase.from('certificates').select('id, user_id')
  ]);
  
  const users = usersRes.data || [];
  
  users.forEach(u => {
    const docs = (docsRes.data || []).filter(d => d.user_id === u.id).length;
    const pays = (payRes.data || []).filter(p => p.user_id === u.id).length;
    const certs = (certRes.data || []).filter(c => c.user_id === u.id).length;
    if (docs > 0 || pays > 0 || certs > 0) {
      console.log(`${u.name} (${u.roll_number}) - Docs: ${docs}, Payments: ${pays}, Certs: ${certs}`);
    }
  });

  console.log('\n--- CHECK 3: Payments Receipt Path ---');
  const payLimits = await supabase.from('payments').select('id, transaction_id, receipt_no, status').limit(5);
  console.log(payLimits.data);

  console.log('\n--- CHECK 4: Documents File Path ---');
  const dLimits = await supabase.from('documents').select('id, name, file_path, status, storage_path').limit(5);
  console.log(dLimits.data);

  console.log('\n--- CHECK 5: Certificates File Path ---');
  const cLimits = await supabase.from('certificates').select('id, certificate_id, file_path').limit(5);
  console.log(cLimits.data);
}

runDiagnostics().catch(console.error);
