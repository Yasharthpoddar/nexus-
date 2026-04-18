require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function runSeed() {
  console.log('Generating Apex Administrator node...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const { data, error } = await supabase.from('users').upsert({
    email: 'admin@college.edu',
    password: hashedPassword,
    name: 'System Administrator',
    role: 'admin',
    sub_role: 'admin',
    is_blocked: false
  }, { onConflict: 'email' });

  if (error) console.error('Error seeding admin', error);
  else console.log('Admin account created successfully: admin@college.edu / admin123');
}

runSeed();
