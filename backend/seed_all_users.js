require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function seedAllUsers() {
  console.log('Seeding authority nodes with secure cryptographic hashes...');
  
  const users = [
    { email: 'admin@college.edu', password: 'admin123', name: 'System Admin', role: 'admin', sub_role: 'admin' },
    { email: 'principal@college.edu', password: 'password123', name: 'Dr. Rao', role: 'principal', sub_role: 'principal' },
    { email: 'hod@college.edu', password: 'password123', name: 'Prof. Sharma', role: 'hod', sub_role: 'hod' },
    { email: 'lab@college.edu', password: 'password123', name: 'Mr. Gupta', role: 'lab-incharge', sub_role: 'lab-incharge' },
    { email: 'student@college.edu', password: 'password123', name: 'Test Student', role: 'student', sub_role: 'student' }
  ];

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    const { error } = await supabase.from('users').upsert({
      email: u.email,
      password: hashedPassword,
      name: u.name,
      role: u.role,
      sub_role: u.sub_role,
      is_blocked: false
    }, { onConflict: 'email' });

    if (error) console.error(`Error seeding ${u.email}:`, error);
    else console.log(`✓ Created: ${u.email} / ${u.password}`);
  }
  
  console.log('--- SEEDING COMPLETE ---');
}

seedAllUsers();
