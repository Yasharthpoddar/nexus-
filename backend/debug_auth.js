require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function debugAuth() {
  console.log('Fetching users from:', process.env.SUPABASE_URL);
  const { data: users, error } = await supabase.from('users').select('email, password, role');
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log('--- USER LIST ---');
  for (const u of users) {
    const isHash = u.password.startsWith('$2');
    console.log(`Email: ${u.email}`);
    console.log(`Role:  ${u.role}`);
    console.log(`Hash?: ${isHash ? 'YES (Secure)' : 'NO (Plain Text!)'}`);
    console.log(`Value: ${u.password.substring(0, 10)}...`);
    
    if (u.email === 'admin@college.edu') {
      const match = await bcrypt.compare('admin123', u.password);
      console.log(`TEST LOGIN (admin123): ${match ? 'SUCCESS' : 'FAILED'}`);
    }
    console.log('-----------------');
  }
}

debugAuth();
