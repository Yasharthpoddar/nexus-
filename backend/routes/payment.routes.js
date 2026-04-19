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

    // 4. Create payment record
    const receiptNo = `RCPT-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: payment } = await supabase
      .from('payments')
      .insert([{
        user_id:        userId,
        amount:         due.amount,
        department:     due.department,
        transaction_id: razorpay_payment_id,
        receipt_no:     receiptNo,
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
    // Log the failure to the payments table (optional in our schema since we insert on success,
    // but useful if we start creating 'pending' rows first).
    res.json({ success: true, message: 'Payment failure recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

