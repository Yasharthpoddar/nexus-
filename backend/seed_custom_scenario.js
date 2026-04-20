require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function seedScenario() {
  console.log('--- STARTING CUSTOM SCENARIO SEED ---');
  
  const userData = [
    { name: 'Arjun P', email: 'arjun@nexus.dev', password: 'test1234', role: 'student', sub_role: 'student' },
    { name: 'John Doe', email: 'student1@gmail.com', password: 'student@1234', role: 'student', sub_role: 'student' },
    { name: 'Nexus Admin', email: 'admin@nexus.edu', password: 'Admin@Nexus2026', role: 'admin', sub_role: 'admin' },
    { name: 'Lab Incharge', email: 'lab1@gmail.com', password: 'lab@1234', role: 'lab-incharge', sub_role: 'lab-incharge' },
    { name: 'HOD Admin', email: 'hod1@gamil.com', password: 'hod@1234', role: 'hod', sub_role: 'hod' },
    { name: 'Principal Officer', email: 'principal@gmail.com', password: 'principal@1234', role: 'principal', sub_role: 'principal' }
  ];

  const depNames = ['Library', 'Laboratory', 'Accounts', 'HOD', 'Principal', 'Sports', 'Hostel'];

  for (const info of userData) {
    console.log(`Processing user: ${info.email}`);
    const hash = await bcrypt.hash(info.password, 10);
    
    // 1. Create User
    const { data: user, error: uErr } = await supabase.from('users').upsert({
      email: info.email,
      password: hash,
      name: info.name,
      role: info.role,
      sub_role: info.sub_role,
      is_blocked: false
    }, { onConflict: 'email' }).select('id').single();

    if (uErr) {
      console.error(`Error creating ${info.email}:`, uErr);
      continue;
    }

    const userId = user.id;

    // 2. Handle Application State for Students
    if (info.role === 'student') {
      if (info.email === 'arjun@nexus.dev') {
        // SCENARIO: Fully Cleared (Certificate Visible)
        console.log('Seeding Arjun: Completed State');
        const { data: app } = await supabase.from('applications').upsert({
          user_id: userId,
          status: 'completed',
          current_stage: 'principal',
          cert_status: 'Ready'
        }, { onConflict: 'user_id' }).select('id').single();

        if (app) {
          // Clear all departments
          for (const d of depNames) {
            await supabase.from('department_status').upsert({
              application_id: app.id,
              department: d,
              status: 'Cleared',
              authority: `System (${d})`,
              flag_reason: 'Automated Clearance'
            }, { onConflict: 'application_id,department' });
          }
        }
      } else if (info.email === 'student1@gmail.com') {
        // SCENARIO: General Submit
        console.log('Seeding Student 1: Submitted State');
        const { data: app } = await supabase.from('applications').upsert({
          user_id: userId,
          status: 'submitted',
          current_stage: 'library',
          cert_status: 'Not Ready'
        }, { onConflict: 'user_id' }).select('id').single();

        if (app) {
          // All pending
          for (const d of depNames) {
            await supabase.from('department_status').upsert({
              application_id: app.id,
              department: d,
              status: 'Pending',
              authority: 'Awaiting Review'
            }, { onConflict: 'application_id,department' });
          }
        }
      }
    }
  }

  console.log('--- CUSTOM SCENARIO SEED COMPLETE ---');
}

seedScenario();
