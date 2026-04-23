const supabase = require('../db/config');

const getLabSync = async (req, res) => {
  try {
    // 1. Fetch Students
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
        equipment_status ( lab_manual, equipment_kit, safety_deposit, lab_card ),
        documents ( name, doc_type, status )
      `);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Filter to applications that actually exist in the Laboratory queue
    const labApps = apps.filter(app => 
      app.department_status && app.department_status.some(d => d.department === 'Laboratory')
    ).map(app => {
      const dept = app.department_status.find(d => d.department === 'Laboratory');
      const eq = app.equipment_status && app.equipment_status.length > 0 ? app.equipment_status[0] : {
        lab_manual: 'Pending', equipment_kit: 'Pending', safety_deposit: 'Pending', lab_card: 'Pending'
      };

      return {
        id: app.id,
        rollNo: app.users.roll_number,
        name: app.users.name,
        branch: app.users.branch,
        batch: app.users.batch,
        email: app.users.email,
        submittedAt: app.submitted_at,
        status: dept.status,
        decisionDate: null, 
        decisionComment: dept.flag_reason,
        documents: app.documents.map(d => ({ name: d.name, type: d.doc_type, verified: d.status === 'Verified' })),
        equipment: {
          labManual: eq.lab_manual,
          equipmentKit: eq.equipment_kit,
          safetyDeposit: eq.safety_deposit,
          labCard: eq.lab_card
        }
      };
    });

    // 2. Fetch Activities History
    const { data: hist } = await supabase.from('application_history')
      .select('*')
      .eq('role', 'lab-incharge')
      .order('date', { ascending: false });

    res.status(200).json({
      success: true,
      data: {
        labStudents: labApps,
        activities: (hist || []).map(h => ({
          id: h.id,
          type: h.action,
          title: h.comment,
          timestamp: h.date
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error fetching sync payload.' });
  }
};

const approveStudent = async (req, res) => {
  const { appId, notes } = req.body;
  const adminId = req.user.id;

  try {
    // Audit F1: Check if all documents for this application are verified
    const { data: docs } = await supabase
      .from('documents')
      .select('status')
      .eq('application_id', appId);

    const allVerified = docs?.every(d => d.status === 'Verified');
    if (!allVerified && (docs?.length || 0) > 0) {
      return res.status(403).json({ error: 'Cannot approve: Some documents are still pending verification.' });
    }

    // Audit F3: Sync equipment status on approval
    await supabase.from('equipment_status')
      .update({ 
        lab_manual: 'Returned', 
        equipment_kit: 'Returned', 
        safety_deposit: 'Returned', 
        lab_card: 'Returned',
        updated_at: new Date()
      })
      .eq('application_id', appId);

    await supabase.from('department_status')
      .update({ status: 'Cleared', flag_reason: notes || 'Lab documents and equipment verified.', actioned_by: adminId, last_updated: new Date() })
      .eq('application_id', appId)
      .eq('department', 'Laboratory');

    await supabase.from('application_history').insert([{
      application_id: appId,
      actor: adminId,
      role: 'lab-incharge',
      action: 'approved',
      comment: `Lab Cleared & Equipment Auto-Returned`
    }]);

    // Push process to HOD (next stage)
    await supabase.from('applications').update({ current_stage: 'hod' }).eq('id', appId);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[lab/approve]', err);
    res.status(500).json({ error: 'Internal Server Error during Lab approval.' });
  }
};

const flagStudent = async (req, res) => {
  const { appId, comment, notes } = req.body;
  const adminId = req.user.id;

  try {
    await supabase.from('department_status')
      .update({ status: 'Blocked', flag_reason: notes || comment, actioned_by: adminId, last_updated: new Date() })
      .eq('application_id', appId)
      .eq('department', 'Laboratory');

    await supabase.from('application_history').insert([{
      application_id: appId,
      actor: adminId,
      role: 'lab-incharge',
      action: 'flagged',
      comment: `Lab Blocked: ${comment}`
    }]);

    await supabase.from('notifications').insert([{
      to_role: 'student',
      user_id: null,
      application_id: appId,
      title: 'Action Required: Laboratory',
      message: notes || comment,
      is_read: false
    }]);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error flagging' });
  }
};

const toggleEquipment = async (req, res) => {
  const { appId, key } = req.body;
  
  try {
    const { data: eqArray } = await supabase.from('equipment_status').select('*').eq('application_id', appId);
    if (!eqArray || eqArray.length === 0) return res.status(404).json({ message: 'Eq not found' });
    
    // Map JS camelCase key to DB snake_case column
    const dbKeyMap = {
      labManual: 'lab_manual',
      equipmentKit: 'equipment_kit',
      safetyDeposit: 'safety_deposit',
      labCard: 'lab_card'
    };
    const dbCol = dbKeyMap[key];
    if (!dbCol) return res.status(400).json({ message: 'Invalid column' });

    const currentStatus = eqArray[0][dbCol];
    const newStatus = currentStatus === 'Returned' ? 'Pending' : 'Returned';

    await supabase.from('equipment_status').update({ [dbCol]: newStatus }).eq('application_id', appId);
    
    await supabase.from('application_history').insert([{
      application_id: appId, actor: req.user.id, role: 'lab-incharge', action: 'equipment', comment: `Toggled ${key} to ${newStatus}`
    }]);

    res.status(200).json({ success: true, newStatus });
  } catch (e) {
    res.status(500).json({ message: 'Error' });
  }
};

const executeBulk = async (req, res) => {
  const { ids } = req.body;
  try {
    await supabase.from('equipment_status').update({
      lab_manual: 'Returned',
      equipment_kit: 'Returned',
      safety_deposit: 'Returned',
      lab_card: 'Returned'
    }).in('application_id', ids);

    res.status(200).json({ success: true });
  } catch(e) { res.status(500).json({ message: 'Err' }); }
};

const undoDecision = async (req, res) => {
  const { appId } = req.body;
  try {
    await supabase.from('department_status')
      .update({ status: 'Pending', flag_reason: '' })
      .eq('application_id', appId)
      .eq('department', 'Laboratory');

    res.status(200).json({ success: true });
  } catch(e) { res.status(500).json({ message: 'Err' }); }
};

module.exports = {
  getLabSync,
  approveStudent,
  flagStudent,
  toggleEquipment,
  executeBulk,
  undoDecision
};
