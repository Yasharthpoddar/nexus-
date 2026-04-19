const express   = require('express');
const router    = express.Router();
const Razorpay  = require('razorpay');
const crypto    = require('crypto');
const { requireAuth } = require('../middleware/auth.middleware');
const supabase  = require('../db/config');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── POST /api/payment/create-order ───────────────────────────────────────────
// Creates a Razorpay order for a given due_id.
router.post('/create-order', requireAuth, async (req, res) => {
  const { dueId } = req.body;
  const userId    = req.user.id;

  try {
    // Look up the due
    const { data: due, error } = await supabase
      .from('dues_flags')
      .select('*')
      .eq('id', dueId)
      .eq('user_id', userId)
      .eq('is_paid', false)
      .single();

    if (error || !due) {
      return res.status(404).json({ error: 'Due not found or already paid' });
    }

    // Create Razorpay order (amount in paise)
    const order = await razorpay.orders.create({
      amount:   Math.round(due.amount * 100),
      currency: 'INR',
      receipt:  `nexus_due_${dueId.slice(0, 10)}`,
      notes: {
        due_id:     dueId,
        user_id:    userId,
        department: due.department,
        reason:     due.reason,
      },
    });

    res.json({
      orderId:   order.id,
      amount:    order.amount,
      currency:  order.currency,
      keyId:     process.env.RAZORPAY_KEY_ID,
      dueId,
      department: due.department,
      reason:     due.reason,
    });
  } catch (err) {
    console.error('[payment/create-order]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/payment/verify ─────────────────────────────────────────────────
// Verifies Razorpay signature, marks due paid, creates payment record.
router.post('/verify', requireAuth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dueId } = req.body;
  const userId = req.user.id;

  try {
    // 1. Verify HMAC signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed: invalid signature' });
    }

    // 2. Fetch the due
    const { data: due } = await supabase
      .from('dues_flags')
      .select('*')
      .eq('id', dueId)
      .single();

    if (!due) return res.status(404).json({ error: 'Due not found' });

    // 3. Mark due as paid
    await supabase.from('dues_flags').update({ is_paid: true }).eq('id', dueId);

    // 4. Create payment record and generate receipt
    const receiptNo = `RCPT-${Math.floor(1000 + Math.random() * 9000)}`;
    const { generatePaymentReceipt } = require('../services/pdfGenerator');
    
    let receiptPath = null;
    try {
      receiptPath = await generatePaymentReceipt(
        { receiptNo, department: due.department, amount: due.amount, paymentId: razorpay_payment_id, paidAt: new Date() },
        { name: req.user.name, rollNumber: req.user.roll_number }
      );
    } catch (e) {
      console.error('Failed to generate receipt PDF inline:', e);
    }
    
    const { data: payment } = await supabase
      .from('payments')
      .insert([{
        user_id:        userId,
        amount:         due.amount,
        department:     due.department,
        transaction_id: razorpay_payment_id,
        receipt_no:     receiptNo,
        receipt_path:   receiptPath,
        status:         'Completed',
      }])
      .select('*')
      .single();

    // 5. Notify student
    const { data: apps } = await supabase.from('applications').select('id').eq('user_id', userId).limit(1);
    if (apps?.[0]) {
      await supabase.from('notifications').insert([{
        to_role:        'student',
        application_id: apps[0].id,
        message: JSON.stringify({
          type:        'payment',
          title:       'Payment Successful',
          description: `₹${due.amount} paid to ${due.department}. Receipt: ${receiptNo}`,
        }),
        is_read: false,
      }]);
    }

    res.json({ success: true, payment, receiptNo });
  } catch (err) {
    console.error('[payment/verify]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/payment/failed ───────────────────────────────────────────────────
// Called if Razorpay payment fails or is dismissed.
router.post('/failed', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, error_description } = req.body;
    res.json({ success: true, message: 'Payment failure recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/payments/mine ───────────────────────────────────────────────────
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'Completed')
      .order('paid_at', { ascending: false });
    
    if (error) throw error;
    res.json(payments || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/payments/receipt/:receiptNo ──────────────────────────────────────
router.get('/receipt/:receiptNo', requireAuth, async (req, res) => {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('receipt_path')
      .eq('receipt_no', req.params.receiptNo)
      .eq('user_id', req.user.id)
      .single();
      
    if (error || !payment) return res.status(404).json({ error: 'Receipt not found' });
    
    const receiptPath = payment.receipt_path;
    if (!receiptPath || !require('fs').existsSync(receiptPath)) {
      return res.status(404).json({ error: 'Receipt file not found' });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt-${req.params.receiptNo}.pdf`);
    res.sendFile(require('path').resolve(receiptPath));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/payments/admin/backfill-receipts ───────────────────────────────
router.post('/admin/backfill-receipts', requireAuth, async (req, res) => {
  if (req.user.sub_role !== 'admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  
  try {
    const { data: payments } = await supabase
      .from('payments')
      .select('*, users(name, roll_number)');
      
    let fixed = 0;
    const errors = [];
    const { generatePaymentReceipt } = require('../services/pdfGenerator');
    
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
        } catch (err) {
          errors.push(`Payment ${p.id}: ${err.message}`);
        }
      }
    }
    res.json({ fixed, errors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

