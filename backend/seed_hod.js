require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function seedHOD() {
  console.log('Pushing 3 mock applications to the HOD queue...');

  const { data: apps } = await supabase.from('applications').select('id, user_id').eq('current_stage', 'lab-incharge').limit(3);

  if (!apps || apps.length === 0) {
    console.log('No applications found in Lab stage to escalate.');
    return;
  }

  const appIds = apps.map(a => a.id);

  // 1. Mark Laboratory status as Cleared
  await supabase.from('department_status')
    .update({ status: 'Cleared', flag_reason: 'Automated seed clearance', last_updated: new Date() })
    .in('application_id', appIds)
    .eq('department', 'Laboratory');

  // 2. Insert HOD status
  for (const app of apps) {
    await supabase.from('department_status').insert([
      { application_id: app.id, department: 'HOD', status: 'Pending', flag_reason: 'Awaiting HOD approval' }
    ]);
    
    // Add fake documents for verification checking
    await supabase.from('documents').insert([
      { application_id: app.id, name: 'Library_Dues.pdf', doc_type: 'Receipt', status: 'Under Review' },
      { application_id: app.id, name: 'ID_Card.png', doc_type: 'ID', status: 'Verified' }
    ]);
  }

  // 3. Move application stage to HOD
  await supabase.from('applications')
    .update({ current_stage: 'hod' })
    .in('id', appIds);

  console.log(`Escalated ${apps.length} applications to HOD queue successfully!`);
}

seedHOD();
