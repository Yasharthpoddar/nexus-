const supabase = require('../db/config');

const getHodSync = async (req, res) => {
  try {
    // Determine the HOD's department if they are logged in. We'll default to "HOD" checks.
    const { data: apps, error } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        submitted_at,
        current_stage,
        admin_notes,
        users ( name, roll_number, branch, batch, email ),
        department_status ( status, flag_reason, department ),
        documents ( id, name, doc_type, status ),
        application_history ( id, actor, role, action, comment, date )
      `);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Filter to applications that exist in the HOD queue
    // Meaning: Their application 'current_stage' is 'hod', OR they have a clear department_status for HOD.
    const hodApps = apps.filter(app => 
      app.department_status && app.department_status.some(d => d.department === 'HOD')
    ).map(app => {
      const dept = app.department_status.find(d => d.department === 'HOD');
      
      return {
        id: app.id,
        studentName: app.users.name,
        rollNo: app.users.roll_number,
        branch: app.users.branch,
        batch: app.users.batch,
        email: app.users.email,
        submissionDate: app.submitted_at,
        daysWaiting: Math.floor((new Date() - new Date(app.submitted_at)) / (1000 * 60 * 60 * 24)),
        status: dept.status,
        decisionDate: null, 
        decisionComment: dept.flag_reason,
        documents: app.documents.map(d => ({ 
          id: d.id, name: d.name, type: d.doc_type, size: 'Unknown', isVerified: d.status === 'Verified', date: app.submitted_at 
        })),
        history: app.application_history.map(h => ({
          id: h.id, actor: 'System ID ' + h.actor, role: h.role, action: h.action, comment: h.comment, date: h.date
        }))
      };
    });

    const pendingApps = hodApps.filter(app => app.status === 'Pending' && app.daysWaiting >= 0);
    const reviewedApps = hodApps.filter(app => app.status !== 'Pending');

    const { data: notifs } = await supabase.from('notifications')
      .select('*')
      .eq('to_role', 'hod')
      .order('created_at', { ascending: false });

    res.status(200).json({
      success: true,
      data: {
        pendingApps,
        reviewedApps,
        notifications: (notifs || []).map(n => {
          let payload = { type: 'system', title: 'Notification', description: '' };
          try { payload = JSON.parse(n.message); } catch(e){}
          return {
            id: n.id,
            type: payload.type || 'system',
            title: payload.title,
            description: payload.description,
            timestamp: n.created_at,
            read: n.is_read
          };
        })
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error fetching HOD sync payload.' });
  }
};

const approveApp = async (req, res) => {
  const { appId, comment } = req.body;
  const adminId = req.user.id;

  try {
    await supabase.from('department_status')
      .update({ status: 'Cleared', flag_reason: comment || 'Verified backlogs and academic standing.', actioned_by: adminId, last_updated: new Date() })
      .eq('application_id', appId)
      .eq('department', 'HOD');

    await supabase.from('application_history').insert([{
      application_id: appId,
      actor: adminId,
      role: 'hod',
      action: 'approved',
      comment: `HOD Approved - ${comment || ''}`
    }]);

    await supabase.from('applications').update({ current_stage: 'principal' }).eq('id', appId);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error approving application' });
  }
};

const flagApp = async (req, res) => {
  const { appId, comment } = req.body;
  const adminId = req.user.id;

  try {
    await supabase.from('department_status')
      .update({ status: 'Action Required', flag_reason: comment, actioned_by: adminId, last_updated: new Date() })
      .eq('application_id', appId)
      .eq('department', 'HOD');

    await supabase.from('application_history').insert([{
      application_id: appId,
      actor: adminId,
      role: 'hod',
      action: 'flagged',
      comment: `HOD Flagged - ${comment}`
    }]);

    await supabase.from('notifications').insert([{
      to_role: 'student',
      application_id: appId,
      message: JSON.stringify({ type: 'rejection', title: 'Action Required: HOD', description: comment }),
      is_read: false
    }]);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error flagging' });
  }
};

const batchAction = async (req, res) => {
  const { ids, action } = req.body; // action: 'Approve' | 'Flag'
  const adminId = req.user.id;

  try {
    for (const appId of ids) {
       await supabase.from('department_status')
        .update({ status: action === 'Approve' ? 'Cleared' : 'Action Required', actioned_by: adminId, last_updated: new Date() })
        .eq('application_id', appId)
        .eq('department', 'HOD');
        
       if (action === 'Approve') {
         await supabase.from('applications').update({ current_stage: 'principal' }).eq('id', appId);
       }
    }
    res.status(200).json({ success: true });
  } catch(e) { res.status(500).json({ message: 'Err' }); }
};

const undoDecision = async (req, res) => {
  const { appId } = req.body;
  try {
    await supabase.from('department_status')
      .update({ status: 'Pending', flag_reason: '' })
      .eq('application_id', appId)
      .eq('department', 'HOD');

    res.status(200).json({ success: true });
  } catch(e) { res.status(500).json({ message: 'Err' }); }
};

const toggleDoc = async (req, res) => {
  const { docId } = req.body;
  try {
    const { data: docs } = await supabase.from('documents').select('status').eq('id', docId);
    if (docs && docs.length > 0) {
       const newStatus = docs[0].status === 'Verified' ? 'Under Review' : 'Verified';
       await supabase.from('documents').update({ status: newStatus }).eq('id', docId);
    }
    res.status(200).json({ success: true });
  } catch(e) { res.status(500).json({ message: 'Err' }); }
};

const markNotifRead = async (req, res) => {
  const { notifId } = req.body;
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    res.status(200).json({ success: true });
  } catch(e) { res.status(500).json({ message: 'Err' }); }
};

module.exports = {
  getHodSync,
  approveApp,
  flagApp,
  batchAction,
  undoDecision,
  toggleDoc,
  markNotifRead
};
