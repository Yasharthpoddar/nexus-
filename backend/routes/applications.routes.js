const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const supabase = require('../db/config');

router.use(requireAuth);

const PIPELINE_DEPARTMENTS = [
  { department: 'Library',    authority: 'Librarian' },
  { department: 'Laboratory', authority: 'Lab In-charge' },
  { department: 'Accounts',   authority: 'Accounts Officer' },
  { department: 'HOD',        authority: 'Head of Department' },
  { department: 'Principal',  authority: 'Principal' },
];

// GET /api/applications/mine
router.get('/mine', async (req, res) => {
  try {
    const { data: apps } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('submitted_at', { ascending: false });
    res.status(200).json({ success: true, applications: apps || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/applications/submit — create application + seed department_status rows
router.post('/submit', async (req, res) => {
  const userId = req.user.id;
  try {
    // Check for existing active application
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['submitted', 'in_progress'])
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'You already have an active application.' });
    }

    // Create the application
    const { data: app, error: appErr } = await supabase
      .from('applications')
      .insert([{ user_id: userId, status: 'submitted', current_stage: 'library' }])
      .select('*')
      .single();

    if (appErr || !app) throw new Error(appErr?.message || 'Failed to create application');

    // Seed all department_status rows
    const deptRows = PIPELINE_DEPARTMENTS.map(p => ({
      application_id: app.id,
      department:     p.department,
      authority:      p.authority,
      status:         'Pending',
      flag_reason:    null,
    }));
    await supabase.from('department_status').insert(deptRows);

    // Notify student
    await supabase.from('notifications').insert([{
      to_role:        'student',
      application_id: app.id,
      message:        JSON.stringify({
        type:        'system',
        title:       'Application Submitted',
        description: 'Your No-Dues clearance application has been submitted successfully.'
      }),
      is_read: false,
    }]);

    res.status(201).json({ success: true, application: app });
  } catch (err) {
    console.error('[applications/submit]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
