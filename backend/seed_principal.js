require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function seedPrincipal() {
  console.log('Validating up to 2 applications pushing them from HOD to Principal...');
  const { data: apps } = await supabase.from('applications').select('id').eq('current_stage', 'hod').limit(2);
  
  if (!apps || apps.length === 0) {
    console.log('No applications in HOD stage to escalate.');
    return;
  }
  const appIds = apps.map(a => a.id);

  // 1. Mark HOD as Cleared
  await supabase.from('department_status')
    .update({ status: 'Cleared', flag_reason: 'Automated HOD Seeder Logic', last_updated: new Date() })
    .in('application_id', appIds)
    .eq('department', 'HOD');

  // 2. Insert Principal layer tracking
  for (const app of apps) {
    await supabase.from('department_status').insert([
      { application_id: app.id, department: 'Principal', status: 'Pending', flag_reason: 'Awaiting apex cryptographic signoff.' }
    ]);
  }

  // 3. Move stage to principal
  await supabase.from('applications')
    .update({ current_stage: 'principal' })
    .in('id', appIds);

  console.log(`Pushed ${apps.length} applications to the absolute Apex Tier.`);
}

seedPrincipal();
