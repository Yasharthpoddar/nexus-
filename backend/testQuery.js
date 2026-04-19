require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('applications')
    .select('id, status, current_stage, updated_at, users!inner(name, roll_number)')
    .not('status', 'in', '("cleared", "flagged", "Approved", "completed")')
    .order('updated_at', { ascending: true });
    
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
run();
