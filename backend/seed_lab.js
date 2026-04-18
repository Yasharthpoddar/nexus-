require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function seedLab() {
  console.log('Seeding dummy lab students...');

  const dummies = [
    { name: 'Rohan Patil', email: 'rohan.patil@college.edu', role: 'student', roll_number: '21CS042', batch: '2021-2025', programme: 'B.Tech CS' },
    { name: 'Priya Mehta', email: 'priya.m@college.edu', role: 'student', roll_number: '21CS031', batch: '2021-2025', programme: 'B.Tech CS' },
    { name: 'Arjun Nair', email: 'arjun.n@college.edu', role: 'student', roll_number: '21CS067', batch: '2021-2025', programme: 'B.Tech CS' },
    { name: 'Fatima Khan', email: 'fatima.k@college.edu', role: 'student', roll_number: '21CS019', batch: '2021-2025', programme: 'B.Tech CS' },
  ];

  for (const dummy of dummies) {
    let { data: users } = await supabase.from('users').select('id').eq('email', dummy.email);
    let userId;

    if (!users || users.length === 0) {
      const { data } = await supabase.from('users').insert([{ ...dummy, password: 'mock-password-hash' }]).select('id');
      userId = data[0].id;
    } else {
      userId = users[0].id;
    }

    // Check if application exists
    const { data: apps } = await supabase.from('applications').select('id').eq('user_id', userId);
    if (!apps || apps.length === 0) {
      console.log('Spawning application for ' + dummy.name);
      const { data: appData } = await supabase.from('applications').insert([{ user_id: userId, status: 'submitted', current_stage: 'lab-incharge', cert_status: 'Not Ready' }]).select('id');
      const appId = appData[0].id;

      await supabase.from('department_status').insert([
        { application_id: appId, department: 'Laboratory', status: 'Pending', flag_reason: 'Awaiting lab validation' }
      ]);

      await supabase.from('equipment_status').insert([
        { application_id: appId, lab_manual: 'Returned', equipment_kit: 'Pending', safety_deposit: 'Returned', lab_card: 'Pending' }
      ]);
      
      await supabase.from('documents').insert([
        { application_id: appId, name: 'Clearance_Form.pdf', doc_type: 'Form', status: 'Under Review' }
      ]);
    }
  }

  console.log('Lab seed successful!');
}

seedLab();
