require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../db/config');

async function run() {
  console.log('Creating document_types table...');
  
  // Insert directly - if table doesn't exist, this will fail with a clear error
  // First try a select to see the real error
  const check = await db.from('documents').select('doc_type_code').limit(1);
  console.log('documents table check:', check.error ? check.error.message : 'OK');

  // Supabase anon key can't CREATE TABLE, so we do it via the management API or use pg directly
  // Instead, let's check the .env for a service role key
  const s = require('@supabase/supabase-js');
  const adminClient = s.createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
  );

  // Create table
  const { error: createErr } = await adminClient.rpc('create_document_types_if_missing');
  if (createErr && !createErr.message.includes('does not exist')) {
    console.log('Create attempt:', createErr.message);
  }

  // Try seeding with upsert
  const rows = [
    { name: 'No Dues Certificate',   code: 'NO_DUES',   requires_lab: true,  requires_hod: true,  requires_principal: true,  generates_certificate: true,  description: 'Full clearance certificate' },
    { name: 'Library Clearance',     code: 'LIBRARY',   requires_lab: false, requires_hod: false, requires_principal: false, generates_certificate: false, description: 'Library no-dues clearance' },
    { name: 'Lab Clearance',         code: 'LAB',       requires_lab: true,  requires_hod: false, requires_principal: false, generates_certificate: false, description: 'Lab clearance' },
    { name: 'Fee Clearance',         code: 'FEE',       requires_lab: false, requires_hod: false, requires_principal: false, generates_certificate: false, description: 'Fee clearance' },
    { name: 'Bonafide Certificate',  code: 'BONAFIDE',  requires_lab: false, requires_hod: true,  requires_principal: false, generates_certificate: false, description: 'Enrollment proof' },
    { name: 'Migration Certificate', code: 'MIGRATION', requires_lab: false, requires_hod: true,  requires_principal: true,  generates_certificate: true,  description: 'Transfer certificate' },
    { name: 'Hostel Clearance',      code: 'HOSTEL',    requires_lab: false, requires_hod: false, requires_principal: false, generates_certificate: false, description: 'Hostel clearance' },
    { name: 'Sports Clearance',      code: 'SPORTS',    requires_lab: false, requires_hod: false, requires_principal: false, generates_certificate: false, description: 'Sports clearance' },
  ];

  const { data, error } = await adminClient.from('document_types').upsert(rows, { onConflict: 'code' }).select('name');
  if (error) {
    console.error('Seed error:', error.message, error.hint);
  } else {
    console.log('Seeded successfully:', data.map(r => r.name).join(', '));
  }
}

run().catch(console.error);
