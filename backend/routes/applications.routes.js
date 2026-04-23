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

// GET /api/applications/mine — Full Audit DB-4.2 Payload
router.get('/mine', async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get current application
    const { data: app, error: appErr } = await supabase
      .from('applications')
      .select('*, users(name, roll_number, branch, batch, email)')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    if (appErr || !app) {
      return res.status(200).json({ success: true, application: null });
    }

    // 2. Get departments for this application (Audit Step 2)
    const { data: depts } = await supabase
      .from('department_status')
      .select('*')
      .eq('application_id', app.id)
      .order('id', { ascending: true });

    // 3. Get documents (Audit Step 3)
    const { data: docs } = await supabase
      .from('documents')
      .select('*')
      .eq('application_id', app.id)
      .order('created_at', { ascending: false });

    // 4. Get unpaid dues (Audit Step 4)
    const { data: dues } = await supabase
      .from('dues_flags')
      .select('*')
      .eq('user_id', userId)
      .eq('is_paid', false);

    // 5. Get payments (Audit Step 5)
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('paid_at', { ascending: false });

    // 6. Get notifications (Audit Step 7)
    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('application_id', app.id)
      .eq('to_role', 'student')
      .order('created_at', { ascending: false });

    // 7. Calculate days waiting (Audit Step 8)
    const submittedDate = new Date(app.submitted_at || app.created_at);
    const daysWaiting = Math.floor((new Date() - submittedDate) / (1000 * 60 * 60 * 24));

    res.status(200).json({ 
      success: true, 
      application: {
        ...app,
        days_waiting: daysWaiting,
        departments: depts || [],
        documents: docs || [],
        dueFlags: dues || [],
        payments: payments || [],
        notifications: notifs || []
      }
    });
  } catch (err) {
    console.error('[applications/mine] Audit Failure:', err);
    res.status(500).json({ error: 'Failed to fetch application payload.' });
  }
});

// POST /api/applications/submit — Atomic Submission (Audit DB-4.4)
router.post('/submit', async (req, res) => {
  try {
    const userId = req.user.id;

    // Call the database RPC function for atomic submission
    const { data, error } = await supabase.rpc('submit_clearance_application', {
      p_user_id: userId
    });

    if (error) {
      console.error('[applications/submit] RPC Error:', error);
      return res.status(500).json({ error: 'Database pipeline failure.' });
    }

    if (data.error) {
      return res.status(409).json({ error: data.error });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Application submitted successfully.',
      appId: data.app_id 
    });
  } catch (err) {
    console.error('[applications/submit] Error:', err);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});

module.exports = router;
