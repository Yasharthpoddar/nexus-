require('dotenv').config();
const supabase = require('./db/config');

async function checkCascade() {
  // Try to create a dummy user and app, then delete user
  const id = require('crypto').randomUUID();
  await supabase.from('users').insert([{
    id, name: 'dummy', email: `dummy_${id}@test.com`, password: 'test', role: 'student', sub_role: 'student'
  }]);
  
  await supabase.from('applications').insert([{
    user_id: id, status: 'submitted', current_stage: 'library'
  }]);
  
  const { error } = await supabase.from('users').delete().eq('id', id);
  console.log("Delete error?", error);
}
checkCascade();
