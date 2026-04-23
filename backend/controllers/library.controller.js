const supabase = require('../db/config');

const getLibrarySync = async (req, res) => {
  try {
    const { data: apps, error } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        submitted_at,
        current_stage,
        users ( name, roll_number, branch, email ),
        department_status ( status, flag_reason, department ),
        dues_flags ( id, amount, department, is_paid )
      `);

    if (error) return res.status(500).json({ error: error.message });

    const libraryApps = apps.filter(app => 
      app.department_status && app.department_status.some(d => d.department === 'Library')
    ).map(app => {
      const dept = app.department_status.find(d => d.department === 'Library');
      const libraryDues = (app.dues_flags || []).filter(due => due.department === 'Library');
      
      return {
        id: app.id,
        rollNo: app.users.roll_number,
        name: app.users.name,
        branch: app.users.branch,
        email: app.users.email,
        submittedAt: app.submitted_at,
        status: dept.status,
        dues: libraryDues,
        allDuesPaid: libraryDues.every(d => d.is_paid)
      };
    });

    res.status(200).json({
      success: true,
      data: { libraryStudents: libraryApps }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error fetching Library payload.' });
  }
};

const approveStudent = async (req, res) => {
  const { appId, notes } = req.body;
  const adminId = req.user.id;

  try {
    // Audit Check: Ensure Library Dues are paid
    const { data: dues } = await supabase
      .from('dues_flags')
      .select('is_paid')
      .eq('application_id', appId)
      .eq('department', 'Library');

    const hasUnpaid = dues?.some(d => !d.is_paid);
    if (hasUnpaid) {
      return res.status(403).json({ error: 'Cannot clear: Student has unpaid Library fines.' });
    }

    await supabase.from('department_status')
      .update({ 
        status: 'Cleared', 
        flag_reason: notes || 'No dues in Library records.', 
        actioned_by: adminId, 
        last_updated: new Date() 
      })
      .eq('application_id', appId)
      .eq('department', 'Library');

    await supabase.from('application_history').insert([{
      application_id: appId,
      actor: adminId,
      role: 'librarian',
      action: 'approved',
      comment: 'Library Cleared'
    }]);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error approving Library clearance' });
  }
};

const flagStudent = async (req, res) => {
  const { appId, comment } = req.body;
  const adminId = req.user.id;

  try {
    await supabase.from('department_status')
      .update({ status: 'Blocked', flag_reason: comment, actioned_by: adminId, last_updated: new Date() })
      .eq('application_id', appId)
      .eq('department', 'Library');

    await supabase.from('application_history').insert([{
      application_id: appId,
      actor: adminId,
      role: 'librarian',
      action: 'flagged',
      comment: `Library Blocked: ${comment}`
    }]);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error flagging' });
  }
};

module.exports = {
  getLibrarySync,
  approveStudent,
  flagStudent
};
