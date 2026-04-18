const supabase = require('../db/config');
const crypto = require('crypto');

const getPrincipalSync = async (req, res) => {
  try {
    const { data: apps, error } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        submitted_at,
        current_stage,
        cert_status,
        users ( name, roll_number, branch, batch, email ),
        department_status ( status, flag_reason, department ),
        application_history ( id, actor, role, action, comment, date )
      `);

    if (error) return res.status(500).json({ error: error.message });

    const principalApps = apps.filter(app =>
      app.current_stage === 'principal' || app.status === 'Approved'
    ).map(app => {
      const dept = app.department_status.find(d => d.department === 'Principal') || { status: 'Pending', flag_reason: '' };
      return {
        id: app.id,
        studentName: app.users.name,
        rollNo: app.users.roll_number,
        branch: app.users.branch,
        batch: app.users.batch,
        status: app.status === 'Approved' ? 'Approved' : dept.status,
        certStatus: app.cert_status,
        decisionComment: dept.flag_reason,
        submissionDate: app.submitted_at,
        daysWaiting: Math.floor((new Date() - new Date(app.submitted_at)) / (1000 * 60 * 60 * 24)),
        departments: app.department_status,
        history: app.application_history.map(h => ({
          id: h.id, actor: 'ID ' + h.actor, role: h.role, action: h.action, comment: h.comment, date: h.date
        }))
      };
    });

    const pendingApps = principalApps.filter(app => app.status !== 'Approved' && app.status !== 'Flagged');
    const reviewedApps = principalApps.filter(app => app.status === 'Approved' || app.status === 'Flagged');

    // Fetch notifications addressed to the principal role
    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('to_role', 'principal')
      .order('created_at', { ascending: false })
      .limit(50);

    res.status(200).json({
      success: true,
      data: {
        pendingApps,
        reviewedApps,
        notifications: notifs || [],
        stats: {
          total: apps.length,
          approved: apps.filter(a => a.status === 'Approved').length,
          pending: apps.filter(a => a.status === 'submitted' || a.status === 'in-progress').length
        }
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error fetching Principal payload.' });
  }
};

const approveApp = async (req, res) => {
  const { appId, comment } = req.body;
  const adminId = req.user.id;

  try {
    await supabase.from('department_status')
      .update({ status: 'Cleared', flag_reason: comment || 'Final Principal clearance granted.', actioned_by: adminId, last_updated: new Date() })
      .eq('application_id', appId)
      .eq('department', 'Principal');

    const certificateHash = crypto.randomBytes(32).toString('hex');

    await supabase.from('applications')
      .update({
        current_stage: 'completed',
        status: 'Approved',
        cert_status: 'Ready',
        admin_notes: `Cert-Hash: ${certificateHash}`
      })
      .eq('id', appId);

    await supabase.from('application_history').insert([{
      application_id: appId, actor: adminId, role: 'principal', action: 'approved',
      comment: `Principal Approved. Cert: ${certificateHash.substring(0, 8)}...`
    }]);

    await supabase.from('notifications').insert([{
      to_role: 'student', application_id: appId,
      message: JSON.stringify({ type: 'approval', title: 'Graduation Approved', description: 'The Principal has approved your application. Your graduation certificate is ready to download.' }),
      is_read: false
    }]);

    res.status(200).json({ success: true, certificateHash });
  } catch (err) {
    res.status(500).json({ message: 'Error mapping principal approval' });
  }
};

const flagApp = async (req, res) => {
  const { appId, comment } = req.body;
  const adminId = req.user.id;

  try {
    await supabase.from('department_status')
      .update({ status: 'Action Required', flag_reason: comment, actioned_by: adminId, last_updated: new Date() })
      .eq('application_id', appId)
      .eq('department', 'Principal');

    await supabase.from('application_history').insert([{
      application_id: appId, actor: adminId, role: 'principal', action: 'flagged',
      comment: `Principal Flagged: ${comment}`
    }]);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error flagging application' });
  }
};

const undoDecision = async (req, res) => {
  const { appId } = req.body;
  try {
    await supabase.from('department_status')
      .update({ status: 'Pending', flag_reason: '' })
      .eq('application_id', appId)
      .eq('department', 'Principal');
    await supabase.from('applications')
      .update({ status: 'submitted', cert_status: 'Not Ready', current_stage: 'principal' })
      .eq('id', appId);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ message: 'Err' });
  }
};

const markNotificationRead = async (req, res) => {
  const { id } = req.body;
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ message: 'Err' });
  }
};

const markAllRead = async (req, res) => {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('to_role', 'principal');
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ message: 'Err' });
  }
};

module.exports = {
  getPrincipalSync,
  approveApp,
  flagApp,
  undoDecision,
  markNotificationRead,
  markAllRead
};
