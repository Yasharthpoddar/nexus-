const supabase = require('./db/config');
const { generatePaymentReceipt } = require('./services/pdfGenerator');

async function backfill() {
  const { data: payments } = await supabase
    .from('payments')
    .select('*, users(name, roll_number)');
    
  let fixed = 0;
  const errors = [];
  
  for (const p of (payments || [])) {
    if (p.status === 'Completed' && !p.receipt_path) {
      try {
        const receiptNo = p.receipt_no || `NX-PAY-${p.id.slice(0,6)}`;
        const receiptPath = await generatePaymentReceipt(
          { receiptNo, department: p.department, amount: p.amount, paymentId: p.transaction_id, paidAt: p.paid_at },
          { name: p.users?.name, rollNumber: p.users?.roll_number }
        );
        await supabase.from('payments').update({ receipt_path: receiptPath, receipt_no: receiptNo }).eq('id', p.id);
        fixed++;
        console.log(`✅ Fixed payment ${p.id}`);
      } catch (err) {
        errors.push(`Payment ${p.id}: ${err.message}`);
      }
    }
  }
  console.log(`Backfill complete. Fixed: ${fixed}, Errors: ${errors.length}`);
  if (errors.length) console.log(errors);
}

backfill().catch(console.error);
