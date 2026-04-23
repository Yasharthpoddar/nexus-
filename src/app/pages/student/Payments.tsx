import React, { useState } from 'react';
import { useNexus, Due, Payment } from '../../context/NexusContext';
import { 
  ArrowRight, 
  WalletCards, 
  CheckCircle2, 
  Download,
  Receipt,
  X,
  Loader2,
  ShieldCheck,
  Zap
} from 'lucide-react';
import api from '../../api';
import { safeDate } from '../../utils/formatters';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Load Razorpay script dynamically
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function Payments() {
  const { profile, dues, payments, refresh } = useNexus();
  const [processing, setProcessing]           = useState(false);
  const [successReceipt, setSuccessReceipt]   = useState<Payment | null>(null);
  const [viewReceipt, setViewReceipt]         = useState<Payment | null>(null);
  const [errorMsg, setErrorMsg]               = useState<string | null>(null);

  // ── Razorpay checkout ──────────────────────────────────────────────────────
  const handlePayNow = async (due: Due) => {
    setErrorMsg(null);
    const loaded = await loadRazorpayScript();
    if (!loaded) { setErrorMsg('Could not load Razorpay SDK. Check your internet connection.'); return; }

    setProcessing(true);

    try {
      // 1. Create order on backend
      const orderRes = await api.post('/api/payment/create-order', { dueId: due.id });
      const order = orderRes.data;
      setProcessing(false);

      // 2. Open Razorpay checkout
      const options = {
        key:         order.keyId,
        amount:      order.amount,          // paise
        currency:    order.currency,
        name:        'Nexus Clearance Portal',
        description: `${order.department} — ${order.reason}`,
        order_id:    order.orderId,
        prefill: {
          name:  profile.name,
          email: '', // fill from auth if available
        },
        theme: { color: '#1040C0' },

        handler: async (response: any) => {
          setProcessing(true);
          try {
            const verifyRes = await api.post('/api/payment/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              dueId:               order.dueId,
            });

            const result = verifyRes.data;

            // Show success receipt and refresh context
            setSuccessReceipt({
              id:         result.payment?.id || '',
              department: order.department,
              amount:     due.amount,
              date:       safeDate(new Date()),
              receiptNo:  result.receiptNo,
              status:     'Completed',
              type:       due.department.toLowerCase().includes('library') ? 'fine' : 'repair',
            });
            await refresh();
          } catch (err: any) {
            setErrorMsg(`Verification failed: ${err.message}`);
          } finally {
            setProcessing(false);
          }
        },

        modal: {
          ondismiss: () => setProcessing(false),
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', async (resp: any) => {
        try {
          await api.post('/api/payment/failed', {
            razorpay_order_id: order.orderId,
            error_description: resp.error?.description || 'Unknown error',
          });
        } catch (e) {} // silent failed log
        setErrorMsg(`Payment failed: ${resp.error?.description || 'Unknown error'}`);
        setProcessing(false);
      });
      rzp.open();

    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
      setProcessing(false);
    }
  };

  // ── Receipt component ──────────────────────────────────────────────────────
  const ReceiptView = ({ payment, onClose }: { payment: Payment; onClose: () => void }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md border-4 border-[#121212] shadow-[8px_8px_0px_0px_#121212]">
        <div className="bg-[#121212] text-white p-4 flex justify-between items-center">
          <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Receipt {payment.receiptNo}
          </h2>
          <button onClick={onClose} className="hover:text-[#D02020]"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-8 relative">
          <div className="absolute top-8 right-8 w-24 h-24 border-4 border-[#D02020] text-[#D02020] rounded-full flex items-center justify-center font-black text-xl uppercase tracking-widest opacity-20 -rotate-12 select-none pointer-events-none">Paid</div>
          
          <div className="text-center mb-8 border-b-2 border-dashed border-[#E0E0E0] pb-6">
            <div className="w-16 h-16 bg-[#10A35A] rounded-full mx-auto flex items-center justify-center mb-4 border-4 border-[#121212]">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-black text-2xl uppercase tracking-tight text-[#121212]">₹{payment.amount}</h3>
            <p className="font-bold text-xs uppercase tracking-widest opacity-60 mt-1">Payment Successful via Razorpay</p>
          </div>

          <div className="space-y-4 font-medium text-sm">
            <div className="flex justify-between border-b border-[#E0E0E0] pb-2">
              <span className="opacity-60">Student</span>
              <span className="font-bold">{profile.name} ({profile.rollNo})</span>
            </div>
            <div className="flex justify-between border-b border-[#E0E0E0] pb-2">
              <span className="opacity-60">Department</span>
              <span className="font-bold">{payment.department}</span>
            </div>
            <div className="flex justify-between border-b border-[#E0E0E0] pb-2">
              <span className="opacity-60">Receipt No</span>
              <span className="font-bold font-mono">{payment.receiptNo}</span>
            </div>
            <div className="flex justify-between border-b border-[#E0E0E0] pb-2">
              <span className="opacity-60">Date &amp; Time</span>
              <span className="font-bold whitespace-nowrap">{payment.date}</span>
            </div>
          </div>

          <div className="mt-6 p-3 bg-[#F9F9F9] border-2 border-[#E0E0E0] flex items-center gap-3">
            <img src="https://razorpay.com/favicon.ico" alt="Razorpay" className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Secured by Razorpay</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">

      {/* Header */}
      <div>
        <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tight mb-2">Payments &amp; Dues</h1>
        <p className="text-lg font-medium opacity-80">Clear all pending financial holds safely and instantly via Razorpay.</p>
      </div>

      {/* Processing overlay */}
      {processing && (
        <div className="fixed inset-0 z-[70] bg-black/70 flex flex-col items-center justify-center gap-6">
          <Loader2 className="w-14 h-14 text-white animate-spin" />
          <p className="font-black text-white text-lg uppercase tracking-widest">Processing Payment...</p>
          <p className="text-white/50 text-sm">Do not close this window</p>
        </div>
      )}

      {/* Error strip */}
      {errorMsg && (
        <div className="border-4 border-[#D02020] bg-[#D02020]/10 p-4 flex items-center justify-between">
          <span className="font-black text-xs uppercase tracking-widest text-[#D02020]">⚠ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)}><X className="w-4 h-4 text-[#D02020]" /></button>
        </div>
      )}

      {/* Dues Section */}
      <div>
        <h2 className="font-black text-2xl uppercase tracking-tight mb-6 flex items-center gap-2">
          <span className="w-4 h-4 bg-[#D02020] inline-block border-2 border-[#121212]" />
          Action Required
        </h2>

        {dues.length === 0 ? (
          <div className="bg-[#10A35A]/10 border-4 border-[#10A35A] p-8 flex items-center justify-center">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-[#10A35A] mx-auto mb-4" />
              <h3 className="font-black text-xl uppercase tracking-tight text-[#10A35A]">All Dues Cleared</h3>
              <p className="font-bold text-sm mt-1 opacity-80">You have no pending payments.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dues.map((due) => (
              <div key={due.id} className="bg-white border-4 border-[#121212] flex flex-col hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#121212] transition-all duration-200">
                <div className="p-5 border-b-4 border-[#121212] flex justify-between items-start">
                  <div>
                    <p className="font-bold text-xs uppercase tracking-widest opacity-60 mb-1">{due.department}</p>
                    <h3 className="font-black text-3xl tracking-tight">₹{due.amount}</h3>
                  </div>
                  <div className="p-3 bg-[#F0F0F0] border-2 border-[#121212]">
                    <WalletCards className="w-6 h-6" />
                  </div>
                </div>
                <div className="p-5 flex-1">
                  <p className="font-medium text-sm mb-4">Reason: <span className="font-bold">{due.reason}</span></p>
                  <div className="inline-block px-2 py-1 bg-[#D02020]/10 text-[#D02020] border-2 border-[#D02020] font-bold text-xs uppercase tracking-wider">
                    Due: {due.dueDate}
                  </div>
                </div>
                <button
                  onClick={() => handlePayNow(due)}
                  className="w-full py-4 bg-[#1040C0] text-white border-t-4 border-[#121212] font-black uppercase text-sm tracking-wider flex justify-center items-center gap-3 hover:bg-[#0A30A0] transition"
                >
                  <Zap className="w-4 h-4" />
                  Pay via Razorpay
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Razorpay badge */}
      <div className="flex items-center gap-3 justify-end opacity-60">
        <ShieldCheck className="w-4 h-4" />
        <span className="font-bold text-xs uppercase tracking-widest">Payments secured by</span>
        <span className="font-black text-xs tracking-widest" style={{ color: '#3395FF' }}>Razorpay</span>
      </div>

      {/* Payment History */}
      <div>
        <h2 className="font-black text-2xl uppercase tracking-tight mb-6 flex items-center gap-2">
          <span className="w-4 h-4 bg-[#121212] inline-block border-2 border-[#121212]" />
          Payment History
        </h2>

        <div className="bg-white border-4 border-[#121212] overflow-hidden shadow-[4px_4px_0px_0px_#121212]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#121212] text-white">
                  <th className="p-4 font-black uppercase text-xs tracking-widest border-r-2 border-[#121212]/20">Date</th>
                  <th className="p-4 font-black uppercase text-xs tracking-widest border-r-2 border-[#121212]/20">Department</th>
                  <th className="p-4 font-black uppercase text-xs tracking-widest border-r-2 border-[#121212]/20">Amount</th>
                  <th className="p-4 font-black uppercase text-xs tracking-widest border-r-2 border-[#121212]/20">Receipt No</th>
                  <th className="p-4 font-black uppercase text-xs tracking-widest border-r-2 border-[#121212]/20">Status</th>
                  <th className="p-4 font-black uppercase text-xs tracking-widest w-24"></th>
                </tr>
              </thead>
              <tbody className="font-medium text-sm">
                {payments.map(payment => (
                  <tr key={payment.id} className="border-b-2 border-[#E0E0E0] hover:bg-[#F0F0F0]">
                    <td className="p-4 border-r-2 border-[#E0E0E0]">{safeDate(payment.date)}</td>
                    <td className="p-4 font-bold uppercase tracking-tight border-r-2 border-[#E0E0E0]">{payment.department}</td>
                    <td className="p-4 border-r-2 border-[#E0E0E0] font-bold">₹{payment.amount}</td>
                    <td className="p-4 border-r-2 border-[#E0E0E0] uppercase text-xs tracking-wider opacity-70 font-mono">{payment.receiptNo}</td>
                    <td className="p-4 border-r-2 border-[#E0E0E0]">
                      <span className="inline-block px-2 py-1 bg-[#10A35A]/10 text-[#10A35A] font-bold text-[10px] uppercase tracking-wider border-2 border-[#10A35A]">
                        {payment.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => setViewReceipt(payment)} className="font-bold uppercase text-[10px] tracking-widest hover:underline text-[#1040C0]">
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest">No payment records yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Success Receipt */}
      {successReceipt && <ReceiptView payment={successReceipt} onClose={() => setSuccessReceipt(null)} />}
      {/* View History Receipt */}
      {viewReceipt && <ReceiptView payment={viewReceipt} onClose={() => setViewReceipt(null)} />}

    </div>
  );
}
