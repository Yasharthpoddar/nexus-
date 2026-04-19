const cron = require('node-cron');
const supabase = require('../db/config');
const { sendNudgeEmail } = require('./emailService');

async function processNudges() {
  console.log('[CRON] Starting Nudge Processing...');
  
  try {
    // 1. Fetch pending documents that have been in the queue
    const { data: documents, error: docsErr } = await supabase
      .from('documents')
      .select('id, current_stage, status, date, overall_status')
      .in('overall_status', ['pending', 'in_progress']);
      
    if (docsErr) throw docsErr;

    // Filter documents older than 2 days
    const staleDocuments = (documents || []).filter(doc => {
      if (!doc.date) return false;
      const docDate = new Date(doc.date);
      const diffTime = Math.abs(new Date() - docDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 2; // Older than 2 days
    });

    if (staleDocuments.length === 0) {
      console.log('[CRON] No stale documents found. Nudge process complete.');
      return;
    }

    // Group stale items by stage
    const staleCountsByStage = {
      lab: 0,
      hod: 0,
      principal: 0
    };
    staleDocuments.forEach(doc => {
      if (staleCountsByStage[doc.current_stage] !== undefined) {
        staleCountsByStage[doc.current_stage]++;
      }
    });

    console.log(`[CRON] Detected stale documents: LAB(${staleCountsByStage.lab}), HOD(${staleCountsByStage.hod}), PRINCIPAL(${staleCountsByStage.principal})`);

    // 2. Map stages to the authorities responsible
    const roleMapping = {
      lab: ['lab-incharge'], // users with sub_role = lab-incharge or role = lab-incharge
      hod: ['hod'],
      principal: ['principal']
    };

    // 3. For each stage with stale documents, find the authorities and send nudges
    for (const [stage, count] of Object.entries(staleCountsByStage)) {
      if (count > 0) {
        // Query users with these roles/sub_roles
        const targetRoles = roleMapping[stage];
        const { data: authorities, error: authErr } = await supabase
          .from('users')
          .select('id, email, name, role, sub_role')
          .neq('role', 'student');
        
        if (!authErr && authorities) {
          const matchingAuths = authorities.filter(u => 
            targetRoles.includes(u.sub_role) || targetRoles.includes(u.role)
          );

          for (const auth of matchingAuths) {
            // Nudge log record checking - only send once a day max
            const todayStart = new Date();
            todayStart.setHours(0,0,0,0);

            // Fetch previous nudges to this user today to avoid spamming
            const { data: logs, error: logsErr } = await supabase
              .from('nudge_logs')
              .select('id')
              .eq('to_user_id', auth.id)
              .gte('sent_at', todayStart.toISOString());
            
            // Allow sending if no nudge_logs table yet or no logs today
            if (logsErr || !logs || logs.length === 0) {
              const success = await sendNudgeEmail(
                auth.email, 
                `Pending Approvals Alert`, 
                { pendingCount: count }
              );

              if (success && !logsErr) {
                // Ignore errors if table doesn't exist
                await supabase.from('nudge_logs').insert([{
                  to_user_id: auth.id,
                  stage: stage,
                  document_count: count,
                  sent_at: new Date().toISOString()
                }]);
              }
              console.log(`[CRON] Nudge sent to ${auth.email} (Stage: ${stage}, Items: ${count})`);
            } else {
              console.log(`[CRON] Skipping nudge for ${auth.email} - already sent today.`);
            }
          }
        }
      }
    }

  } catch (err) {
    console.error('[CRON] Error during nudge processing:', err);
  }
}

function initCronJobs() {
  console.log('✓ Scheduled Cron Jobs initialized');
  // Schedule 1: 9:00 AM IST (Which is 03:30 UTC)
  cron.schedule('30 3 * * *', () => {
    processNudges();
  });

  // Schedule 2: 6:00 PM IST (Which is 12:30 UTC)
  cron.schedule('30 12 * * *', () => {
    processNudges();
  });
}

module.exports = { initCronJobs, processNudges };
