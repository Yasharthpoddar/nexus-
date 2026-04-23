const supabase = require('../db/config');

const getSyncPayload = async (req, res) => {
  const userId = req.user.id;
  try {
    // 1. Applications (Fetch active one)
    const { data: apps } = await supabase.from('applications').select('*').eq('user_id', userId).order('submitted_at', { ascending: false }).limit(1);
    let app = null;
    let departments = [];
    let documents = [];
    let notifications = [];

    if (apps && apps.length > 0) {
      app = apps[0];
      const appId = app.id;
      
      const [deptRes, docsRes, notifRes] = await Promise.all([
        supabase.from('department_status').select('*').eq('application_id', appId),
        supabase.from('documents').select('*').eq('application_id', appId),
        supabase.from('notifications').select('*').eq('application_id', appId).eq('to_role', 'student')
      ]);

      departments = deptRes.data || [];
      documents = docsRes.data || [];
      notifications = notifRes.data || [];
    }

    // 2. Dues and Payments (tied to user_id, not application_id)
    const [duesRes, payRes] = await Promise.all([
      supabase.from('dues_flags').select('*').eq('user_id', userId),
      supabase.from('payments').select('*').eq('user_id', userId)
    ]);

    const dues = duesRes.data || [];
    const payments = payRes.data || [];

    res.status(200).json({
      success: true,
      data: {
        application: app,
        departments,
        documents,
        notifications,
        dues,
        payments
      }
    });

  } catch (error) {
    console.error('getSyncPayload error:', error);
    res.status(500).json({ message: 'Internal Server Error fetching sync payload.' });
  }
};

const payDue = async (req, res) => {
  const { dueId } = req.body;
  const userId = req.user.id;

  try {
    const { data: dueReq } = await supabase.from('dues_flags').select('*').eq('id', dueId).single();
    if (!dueReq) return res.status(404).json({ error: 'Due not found.' });

    // Mark as paid - AUDIT FIX: DO NOT DELETE, UPDATE STATUS
    await supabase.from('dues_flags').update({ is_paid: true, paid_at: new Date() }).eq('id', dueId);

    // Create payment receipt
    const receipt_no = `NX-PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: payment } = await supabase.from('payments').insert([{
      user_id: userId,
      amount: dueReq.amount,
      department: dueReq.department,
      transaction_id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      receipt_no,
      status: 'Completed',
      paid_at: new Date()
    }]).select('*').single();

    // Revert department status from Blocked to Pending if applicable
    const { data: apps } = await supabase.from('applications').select('id').eq('user_id', userId).limit(1);
    if (apps && apps.length > 0) {
       await supabase.from('department_status')
         .update({ status: 'Pending', flag_reason: 'Payment received. Awaiting review.' })
         .eq('application_id', apps[0].id)
         .eq('department', dueReq.department)
         .eq('status', 'Blocked');
    }

    res.status(200).json({ success: true, payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error processing payment' });
  }
};

const markNotificationRead = async (req, res) => {
  const { notifId } = req.body;
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
};

const markAllNotificationsRead = async (req, res) => {
  const userId = req.user.id;
  try {
    const { data: apps } = await supabase.from('applications').select('id').eq('user_id', userId).limit(1);
    if (apps && apps.length > 0) {
       await supabase.from('notifications').update({ is_read: true }).eq('application_id', apps[0].id).eq('to_role', 'student');
    }
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update all notifications.' });
  }
};

module.exports = {
  getSyncPayload,
  payDue,
  markNotificationRead,
  markAllNotificationsRead
};
