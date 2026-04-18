require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  console.log('Fetching user ID for Hritani Joshi...');
  const { data: users, error: userError } = await supabase.from('users').select('id').eq('email', 'hritani.joshi@college.edu');
  
  if (userError || !users || users.length === 0) {
    console.error('Cannot find student:', userError);
    return;
  }
  const studentId = users[0].id;
  console.log('Student ID:', studentId);

  // 1. Create Application
  console.log('Creating Application...');
  const { data: appData, error: appError } = await supabase
    .from('applications')
    .insert([{ user_id: studentId, status: 'in-progress', current_stage: 'hod', cert_status: 'Not Ready' }])
    .select('id');
  
  if (appError) console.error('App err:', appError);
  const appId = appData[0].id;
  console.log('App ID:', appId);

  // 2. Insert Departments
  console.log('Seeding Department Statuses...');
  const departments = [
    { application_id: appId, department: 'Library', authority: 'Mr. Desai — Librarian', status: 'Action Required', flag_reason: 'Book return pending, fine of ₹340' },
    { application_id: appId, department: 'Laboratory', authority: 'Dr. Mehta', status: 'Cleared', flag_reason: 'Approved by Dr. Mehta on Jun 10' },
    { application_id: appId, department: 'Accounts', authority: 'Mr. Sharma', status: 'Pending', flag_reason: 'Awaiting accounts officer review' },
    { application_id: appId, department: 'HOD', authority: 'Prof. Sharma', status: 'Cleared', flag_reason: 'Approved by Prof. Sharma on Jun 12' },
    { application_id: appId, department: 'Principal', authority: 'Dr. Rao', status: 'Pending', flag_reason: 'Waiting for HOD chain to complete' },
    { application_id: appId, department: 'Sports', authority: 'Mr. Singh', status: 'Cleared', flag_reason: 'No dues' },
    { application_id: appId, department: 'Hostel', authority: 'Mrs. Verma', status: 'Action Required', flag_reason: 'Repair charge of ₹500 unpaid' },
  ];
  await supabase.from('department_status').insert(departments);

  // 3. Notifications
  console.log('Seeding Notifications...');
  const notifications = [
    { to_role: 'student', application_id: appId, message: '{"type":"approval","title":"HOD Approved","description":"Your application has been approved by the HOD."}', is_read: false },
    { to_role: 'student', application_id: appId, message: '{"type":"rejection","title":"Action Required: Library","description":"Library has flagged a pending book return."}', is_read: false },
    { to_role: 'student', application_id: appId, message: '{"type":"payment","title":"Payment Received","description":"Payment of ₹340 for library fine was successful."}', is_read: true },
    { to_role: 'student', application_id: appId, message: '{"type":"system","title":"Document Uploaded","description":"You successfully uploaded the Lab Manual receipt."}', is_read: true },
    { to_role: 'student', application_id: appId, message: '{"type":"system","title":"Application Submitted","description":"Your graduation clearance application workflow has started."}', is_read: true },
  ];
  await supabase.from('notifications').insert(notifications);

  // 4. Dues Flags
  console.log('Seeding Dues Flags...');
  const dues = [
    { user_id: studentId, department: 'Library', reason: 'Overdue textbook', amount: 340, is_paid: false },
    { user_id: studentId, department: 'Hostel', reason: 'Repair charge', amount: 500, is_paid: false },
  ];
  await supabase.from('dues_flags').insert(dues);

  // 5. Documents
  console.log('Seeding Documents...');
  const docs = [
    { application_id: appId, name: 'Lab_Manual_Receipt.pdf', doc_type: 'Lab Manual', file_path: 'local/lab_manual.pdf', status: 'Verified' },
    { application_id: appId, name: 'ID_Card_Scan.jpg', doc_type: 'ID Card', file_path: 'local/id_card.jpg', status: 'Under Review' },
    { application_id: appId, name: 'Library_Clearance.pdf', doc_type: 'Library Receipt', file_path: 'local/lib_clear.pdf', status: 'Rejected' },
  ];
  await supabase.from('documents').insert(docs);

  // 6. Payments
  console.log('Seeding Payments...');
  const payments = [
    { user_id: studentId, amount: 340, department: 'Library', transaction_id: 'pay1', receipt_no: 'RCPT-9921', status: 'Completed' },
  ];
  await supabase.from('payments').insert(payments);

  console.log('SEED COMPLETE!');
}

runSeed();
