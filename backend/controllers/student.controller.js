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
    if (!dueReq) return res.status(404).json({ message: 'Due not found.' });

    // Mark as paid
    await supabase.from('dues_flags').delete().eq('id', dueId);

    // Create payment receipt
    const receipt_no = `RCPT-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: payment } = await supabase.from('payments').insert([{
      user_id: userId,
      amount: dueReq.amount,
      department: dueReq.department,
      transaction_id: `pay_${Date.now()}`,
      receipt_no,
      status: 'Completed'
    }]).select('*').single();

    // Revert department status from Action Required to Pending if applicable
    const { data: apps } = await supabase.from('applications').select('id').eq('user_id', userId).limit(1);
    if (apps && apps.length > 0) {
       await supabase.from('department_status')
         .update({ status: 'Pending', flag_reason: 'Payment received. Awaiting admin clearance.' })
         .eq('application_id', apps[0].id)
         .eq('department', dueReq.department);
    }

    res.status(200).json({ success: true, payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error processing payment' });
  }
};

const uploadDocument = async (req, res) => {
  const { name, doc_type, size } = req.body;
  const userId = req.user.id;

  try {
    const { data: apps } = await supabase.from('applications').select('id').eq('user_id', userId).limit(1);
    if (!apps || apps.length === 0) return res.status(400).json({ message: 'No active application.' });

    const appId = apps[0].id;

    // We fake the upload in the DB layout since real file uploads assume S3 buckets.
    const newDoc = {
      application_id: appId,
      name,
      doc_type,
      file_path: 'local/' + name,
      status: 'Under Review'
    };

    const { data: docData } = await supabase.from('documents').insert([newDoc]).select('*').single();
    
    // Also inject a notification that the file was uploaded
    await supabase.from('notifications').insert([{
      to_role: 'student',
      application_id: appId,
      message: JSON.stringify({ type: 'system', title: 'Document Uploaded', description: `You successfully uploaded ${name}.` }),
      is_read: false
    }]);

    res.status(200).json({ success: true, doc: docData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error uploading document' });
  }
};

const deleteDocument = async (req, res) => {
  const { docId } = req.params;
  try {
    await supabase.from('documents').delete().eq('id', docId);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete' });
  }
};

const markNotificationRead = async (req, res) => {
  const { notifId } = req.body;
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed update notif' });
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
    res.status(500).json({ message: 'Failed update all notifs' });
  }
};

module.exports = {
  getSyncPayload,
  payDue,
  uploadDocument,
  deleteDocument,
  markNotificationRead,
  markAllNotificationsRead
};
