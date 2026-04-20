const supabase = require('../db/config');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Simulated CSV Memory Store
let mockCsvHistory = [
  { id: 'CSV-1', timestamp: new Date().toISOString(), filename: 'lib_fines_may.csv', department: 'Library', rows: 145, flagged: 12 },
  { id: 'CSV-2', timestamp: new Date(Date.now() - 86400000).toISOString(), filename: 'lab_dues_cs.csv', department: 'Laboratory', rows: 88, flagged: 0 }
];

const getAdminSync = async (req, res) => {
  try {
    // 1. Fetch all non-student users (authorities)
    const { data: authorities, error: authErr } = await supabase
      .from('users')
      .select('id, name, email, role, sub_role, created_at')
      .neq('role', 'student');

    if (authErr) throw new Error(`Authorities fetch: ${authErr.message}`);

    const authNodes = (authorities || []).map(u => ({
      id: u.id,
      name: u.name,
      role: u.sub_role || u.role,
      department: u.sub_role || 'System',
      email: u.email,
      joined: u.created_at || new Date().toISOString(),
      pendingCount: 0,
      reviewedCount: 0,
      avgTimeDays: 1,
      isOnline: true
    }));

    // 2. Fetch all students
    const { data: students, error: stuErr } = await supabase
      .from('users')
      .select('id, name, roll_number, branch, batch, email, is_blocked, created_at')
      .eq('role', 'student');

    if (stuErr) throw new Error(`Students fetch: ${stuErr.message}`);

    // 3. Fetch all applications (to look up by user_id)
    const { data: applications } = await supabase
      .from('applications')
      .select('id, user_id, admin_notes, cert_status, status, current_stage');

    // Build a map: user_id -> application
    const appMap = {};
    (applications || []).forEach(a => { appMap[a.user_id] = a; });

    // 4. Fetch all department_status rows
    const appIds = (applications || []).map(a => a.id);
    let deptMap = {};
    let docMap = {};

    if (appIds.length > 0) {
      const { data: depts } = await supabase
        .from('department_status')
        .select('id, application_id, department, authority, status, last_updated')
        .in('application_id', appIds);

      (depts || []).forEach(d => {
        if (!deptMap[d.application_id]) deptMap[d.application_id] = [];
        deptMap[d.application_id].push(d);
      });

      // 5. Fetch all documents
      const { data: docs } = await supabase
        .from('documents')
        .select('id, application_id, name, doc_type, status, date')
        .in('application_id', appIds);

      (docs || []).forEach(d => {
        if (!docMap[d.application_id]) docMap[d.application_id] = [];
        docMap[d.application_id].push(d);
      });
    }

    // 6. Fetch all payments (keyed by user_id, NOT application_id)
    const studentIds = (students || []).map(s => s.id);
    let payMap = {};
    if (studentIds.length > 0) {
      const { data: payments } = await supabase
        .from('payments')
        .select('id, user_id, amount, department, receipt_no, status, paid_at')
        .in('user_id', studentIds);

      (payments || []).forEach(p => {
        if (!payMap[p.user_id]) payMap[p.user_id] = [];
        payMap[p.user_id].push(p);
      });
    }

    // 7. Assemble student nodes
    const studentNodes = (students || []).map(s => {
      const app = appMap[s.id] || null;
      const appId = app ? app.id : null;

      const departments = (appId && deptMap[appId] ? deptMap[appId] : []).map(d => ({
        id: d.id,
        name: d.department,
        authority: d.authority || 'System',
        status: d.status,
        lastUpdated: d.last_updated || new Date().toISOString()
      }));

      const documents = (appId && docMap[appId] ? docMap[appId] : []).map(d => ({
        id: d.id,
        name: d.name,
        type: d.doc_type || 'Document',
        date: d.date || new Date().toISOString(),
        status: d.status
      }));

      const payments = (payMap[s.id] || []).map(p => ({
        id: p.id,
        date: p.paid_at || new Date().toISOString(),
        dept: p.department || 'General',
        amount: p.amount,
        receiptNo: p.receipt_no || `TXN-${p.id}`,
        status: p.status
      }));

      return {
        id: s.id,
        name: s.name,
        rollNo: s.roll_number || 'N/A',
        branch: s.branch || 'General',
        batch: s.batch || '2025',
        email: s.email,
        phone: '+91 —',
        enrollmentDate: s.created_at,
        isBlocked: s.is_blocked || false,
        adminNotes: app ? (app.admin_notes || '') : '',
        certStatus: app ? (app.cert_status || 'Not Ready') : 'Not Ready',
        departments,
        documents,
        payments
      };
    });

    res.status(200).json({
      success: true,
      data: {
        authorities: authNodes,
        students: studentNodes,
        csvHistory: mockCsvHistory,
        settings: {
          databaseOnline: true,
          emailNudgeActive: true,
          paymentGatewayActive: false,
          qrServiceOnline: true,
          pipelineOrder: ['Library', 'Laboratory', 'Accounts', 'HOD', 'Principal'],
          templates: { approval: '', rejection: '', nudge: '' }
        }
      }
    });
  } catch (err) {
    console.error('[Admin Sync Error]', err.message);
    res.status(500).json({ message: `Admin sync failed: ${err.message}` });
  }
};

const uploadCsv = async (req, res) => {
  const { department, filename } = req.body;
  // Simulate 1.5s visual network parsing delay
  setTimeout(() => {
    const newEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      filename: filename || 'unknown_upload.csv',
      department: department || 'General',
      rows: Math.floor(Math.random() * 500) + 50,
      flagged: Math.floor(Math.random() * 20)
    };
    mockCsvHistory.unshift(newEntry);
    res.status(200).json({ success: true, processed: newEntry });
  }, 1500);
};

const blockStudent = async (req, res) => {
  const { id, blocked } = req.body;
  try {
    await supabase.from('users').update({ is_blocked: blocked }).eq('id', id);
    res.status(200).json({ success: true });
  } catch (err) { res.status(500).send('Error') }
};

const overrideDept = async (req, res) => {
  const { studentId, deptName, status } = req.body;
  try {
    const { data: apps } = await supabase.from('applications').select('id').eq('user_id', studentId);
    if (!apps || apps.length === 0) return res.status(404).send('No app');
    const appId = apps[0].id;

    // Check if dept exists
    const { data: existing } = await supabase.from('department_status')
      .select('*').eq('application_id', appId).eq('department', deptName);

    if (existing && existing.length > 0) {
      await supabase.from('department_status').update({ status, flag_reason: 'Admin Override' }).eq('id', existing[0].id);
    } else {
      await supabase.from('department_status').insert([{
        application_id: appId, department: deptName, status, flag_reason: 'Admin Global Force Creation'
      }]);
    }
    res.status(200).json({ success: true });
  } catch (err) { res.status(500).send('Error') }
};

const updateNotes = async (req, res) => {
  const { id, notes } = req.body;
  try {
    const { data: apps } = await supabase.from('applications').select('id').eq('user_id', id);
    if (apps && apps.length > 0) {
      await supabase.from('applications').update({ admin_notes: notes }).eq('id', apps[0].id);
    }
    res.status(200).json({ success: true });
  } catch (err) { res.status(500).send('Error') }
};

const forceIssueCert = async (req, res) => {
  const { studentId } = req.body;
  try {
    const { data: apps } = await supabase.from('applications').select('id').eq('user_id', studentId);
    if (!apps || apps.length === 0) return res.status(404).send('No app');
    
    const hash = crypto.randomBytes(16).toString('hex');
    await supabase.from('applications').update({
       status: 'Approved', current_stage: 'completed', cert_status: 'Ready', admin_notes: `Admin Forced Cert: ${hash}`
    }).eq('id', apps[0].id);
    
    res.status(200).json({ success: true });
  } catch (err) { res.status(500).send('Error') }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that caller is admin
    const callerRole = req.user.sub_role || req.user.role;
    if (callerRole !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });

    // Supabase will CASCADE delete applications, payments, documents, and department_status automatically
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw new Error(error.message);

    res.status(200).json({ success: true, message: 'Student deleted successfully from database.' });
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const bulkRegisterStudents = async (req, res) => {
  try {
    const { students } = req.body;
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ success: false, message: 'Invalid students payload.' });
    }

    const results = { created: 0, failed: 0, errors: [] };
    const BATCH_SIZE = 100;

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);
      const batchErrors = [];
      const batchCreated = [];
      
      console.log(`[bulkRegister] Processing batch starting at index ${i}. Using bcryptjs.`);
      const bcryptLocal = require('bcryptjs');

      // Process batch rows one by one to ensure individual errors don't block the whole batch
      // and to handle multiple unique constraints (email and roll_number) properly.
      for (const s of batch) {
        try {
          const hashedPassword = await bcryptLocal.hash(s.rollNo || 'password', 10);
          
          // Use upsert on roll_number first if available, as it's the most unique UID
          const { data: newUser, error: uErr } = await supabase
            .from('users')
            .upsert({
              name: s.name,
              email: s.email,
              password: hashedPassword,
              role: 'student',
              sub_role: 'student',
              branch: s.branch,
              batch: s.batch,
              roll_number: s.rollNo,
              is_blocked: false
            }, { onConflict: 'email' }) // PostgreSQL upsert usually handles one constraint well
            .select('id')
            .single();

          if (uErr) {
            batchErrors.push({ email: s.email, error: uErr.message });
            continue;
          }

          // 3. Application Upsert
          const { error: aErr } = await supabase
            .from('applications')
            .upsert({
              user_id: newUser.id,
              status: 'submitted',
              current_stage: 'library',
              cert_status: 'Not Ready'
            }, { onConflict: 'user_id' });

          if (aErr) {
            batchErrors.push({ email: s.email, error: `App creation failed: ${aErr.message}` });
          }

          batchCreated.push(newUser.id);
        } catch (err) {
          batchErrors.push({ email: s.email, error: err.message });
        }
      }

      results.created += batchCreated.length;
      results.failed += (batch.length - batchCreated.length);
      if (batchErrors.length > 0) {
        results.errors.push({ batch: `${i}-${i+batch.length}`, errors: batchErrors });
      }
    }

    res.status(200).json({ success: true, results });
  } catch (err) {
    console.error('Bulk registration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAuthority = async (req, res) => {
  try {
    const { id } = req.params;
    const callerRole = req.user.sub_role || req.user.role;
    if (callerRole !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });

    const { error } = await supabase.from('users').delete().eq('id', id).neq('role', 'student');
    if (error) throw new Error(error.message);

    res.status(200).json({ success: true, message: 'Authority account removed.' });
  } catch (err) {
    console.error('Delete authority error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const triggerNudge = async (req, res) => {
  try {
    const callerRole = req.user.sub_role || req.user.role;
    if (callerRole !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });

    const { processNudges } = require('../services/cronJobs');
    await processNudges();
    res.status(200).json({ success: true, message: 'Nudges triggered successfully' });
  } catch (err) {
    console.error('Manual nudge trigger error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAdminSync,
  uploadCsv,
  blockStudent,
  overrideDept,
  updateNotes,
  forceIssueCert,
  deleteStudent,
  deleteAuthority,
  triggerNudge,
  bulkRegisterStudents
};
