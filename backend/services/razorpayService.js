/*
RAZORPAY TEST SETUP:
1. Go to https://dashboard.razorpay.com/app/signup (free)
2. Skip business verification — test mode works immediately
3. Go to Settings > API Keys > Generate Test Key
4. Copy Key ID (starts with rzp_test_) and Key Secret
5. Paste into backend .env as RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
6. Paste Key ID into frontend .env as VITE_RAZORPAY_KEY_ID
7. Restart both servers
8. Test card: 4111 1111 1111 1111 | Any future expiry | Any CVV | OTP: 1234
9. No real money is charged in test mode
*/

const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createOrder(amount, currency = 'INR', receipt, notes = {}) {
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt,
    notes,
    payment_capture: 1,
  });
  return order;
}

function verifyPaymentSignature(orderId, paymentId, signature) {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}

module.exports = { createOrder, verifyPaymentSignature };
