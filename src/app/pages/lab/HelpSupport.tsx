import React, { useState } from 'react';
import { ChevronDown, MessageSquare, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export function HelpSupport() {
  const [open, setOpen] = useState<number | null>(0);
  const [ticketSent, setTicketSent] = useState(false);

  const faqs = [
    { q: "What is my role in the clearance chain?", a: "As the Lab In-charge, you serve as Stage 1. No student application can progress to the HOD unless you verify their lab conditions manually and authorize their application." },
    { q: "How do I use the equipment tracker?", a: "Navigate to the Equipment Tracker page. You can click on individual cell statuses to toggle between 'Returned' and 'Pending'. The summary engine will auto-calculate clearances." },
    { q: "Can I undo an approval after 24 hours?", a: "No. The system enforces a hard 24-hour Time To Live (TTL) limitation on reverting authorized parameters to maintain chain integrity." },
    { q: "What happens after I approve a student?", a: "The application node is immediately handed off to the Stage 2 cache (HOD Desk), and the student dashboard updates to reflect this progression." },
    { q: "How do I flag a student without rejecting them fully?", a: "Flagging is essentially a soft-reject mapping. You attach a comment, and the student's status changes to Flagged, notifying them to resolve the dispute and re-trigger the workflow." }
  ];

  const handleTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSent(true);
    setTimeout(() => setTicketSent(false), 3000);
  };

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto space-y-10 pb-32">
      <div className="border-b-4 border-[#121212] pb-6">
        <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter mb-2">Protocol Architecture FAQ</h1>
        <p className="font-bold opacity-50 uppercase tracking-widest text-sm">
           System behaviors and structural operational guidelines for Stage 1 authorities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        <div className="flex flex-col gap-4">
          {faqs.map((faq, i) => (
             <div key={i} className="border-4 border-[#121212] bg-white group">
                <button 
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full p-4 flex items-center justify-between font-black text-xs md:text-sm uppercase tracking-widest text-left"
                >
                  {faq.q}
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-[#F9F9F9] border-t-2 border-[#121212]">
                       <div className="p-4 font-bold text-sm leading-relaxed opacity-80">
                         {faq.a}
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          ))}
        </div>

        <div className="border-4 border-[#121212] bg-[#F0C020] p-6 md:p-8 shadow-[8px_8px_0px_#121212] sticky top-24">
           <h3 className="font-black text-2xl md:text-3xl uppercase tracking-tighter mb-2">System Outage?</h3>
           <p className="font-bold text-xs uppercase tracking-widest opacity-80 mb-6">File a direct ticket to DevOps core.</p>

           {ticketSent ? (
             <div className="flex flex-col items-center justify-center p-8 bg-[#121212] text-white border-2 border-[#121212] text-center">
               <AlertCircle className="w-10 h-10 mb-4 text-[#F0C020]" />
               <p className="font-black text-xl tracking-tighter uppercase mb-1">Ticket Injected</p>
               <p className="text-[10px] font-mono tracking-widest opacity-80">REF: NX-LAB-201</p>
             </div>
           ) : (
             <form onSubmit={handleTicket} className="flex flex-col gap-4 bg-white p-4 md:p-6 border-4 border-[#121212]">
                <div className="font-black uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Anomaly Report
                </div>
                <input required type="text" placeholder="Component ID / Error Type" className="w-full bg-[#F9F9F9] border-2 border-[#121212] p-3 font-bold text-sm outline-none" />
                <textarea required placeholder="Describe the structural failure..." className="w-full bg-[#F9F9F9] border-2 border-[#121212] p-3 font-bold text-sm outline-none resize-none h-24" />
                <button type="submit" className="w-full py-4 bg-[#121212] text-white font-black uppercase tracking-widest text-xs hover:bg-[#1040C0] transition-colors border-2 border-[#121212]">
                  Send Diagnostic Ping
                </button>
             </form>
           )}
        </div>
      </div>
    </div>
  );
}
