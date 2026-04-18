const { parse } = require('csv-parse/sync');
const supabase = require('../db/config');

async function parseAndInsertDues(csvBuffer, uploaderId) {
  const records = parse(csvBuffer, {
    columns: true,
    skip_empty_lines: true
  });
  
  let inserted = 0;
  for (const record of records) {
    // Assuming CSV has: roll_number, amount, description, department
    const { roll_number, amount, description, department } = record;
    if (!roll_number || !amount) continue;

    // Look up user
    const { data: users } = await supabase.from('users').select('id').eq('roll_number', roll_number).limit(1);
    if (!users || users.length === 0) continue;

    const userId = users[0].id;
    await supabase.from('dues_flags').insert([{
      user_id: userId,
      flagged_by: uploaderId,
      amount: parseFloat(amount),
      reason: description || 'Bulk upload dues',
      status: 'unpaid',
      department: department || 'General'
    }]);
    inserted++;
  }
  return inserted;
}

module.exports = { parseAndInsertDues };
