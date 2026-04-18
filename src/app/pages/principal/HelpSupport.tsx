import React, { useState } from 'react';
import { 
  HelpCircle, ChevronDown, ChevronUp, LifeBuoy,
  Send, CheckCircle2
} from 'lucide-react';

export function HelpSupport() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const faqs = [
    {
      q: "How do I approve multiple applications at once?",
      a: "Navigate to the 'Pending Applications' page. Use the checkboxes on the left side of the table rows to select multiple students. A bold action bar will appear at the bottom of the screen allowing you to 'Approve Selected'."
    },
    {
      q: "Can I undo a rejection after it's processed?",
      a: "Yes, you have a 24-hour window to undo any decision (approve or flag). Go to 'Reviewed Applications' and click the undo icon. After 24 hours, the decision is permanently logged in the audit trail."
    },
    {
      q: "What happens after I approve an application?",
      a: "The application is immediately forwarded to the next authority in the chain. If you are the Principal (final step), your approval automatically triggers the generation of the student's digital No-Dues Certificate."
    },
    {
      q: "How do stale application nudges work?",
      a: "If an application sits in your queue for more than 48 hours without action, the system automatically sends a reminder email and surfaces a high-priority alert in your notifications panel."
    },
    {
      q: "Who do I contact for a technical issue?",
      a: "You can reach the Nexus IT Admins via the ticketing system below, or for urgent server-down scenarios, call the campus direct IT line at extension '8800'."
    }
  ];

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSubmitted(true);
    setTimeout(() => setTicketSubmitted(false), 5000);
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">
      
      <div>
        <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tight mb-2">Help & Support</h1>
        <p className="text-lg font-medium opacity-80">Authority guidelines and IT support hub.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: FAQs */}
        <div className="lg:col-span-2 space-y-10">
          
          <div>
            <h2 className="font-black text-2xl uppercase tracking-tight mb-6 flex items-center gap-2">
              <span className="w-4 h-4 bg-[#F0C020] inline-block border-2 border-[#121212]" />
              Authority FAQ
            </h2>
            <div className="bg-white border-4 border-[#121212] shadow-[4px_4px_0px_0px_#121212] divide-y-4 divide-[#121212]">
              {faqs.map((faq, i) => (
                <div key={i}>
                  <button 
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-6 flex items-center justify-between hover:bg-[#F9F9F9] transition-colors text-left"
                  >
                    <span className="font-black md:text-lg uppercase tracking-tight pr-4">{faq.q}</span>
                    {openFaq === i ? <ChevronUp className="w-6 h-6 shrink-0" /> : <ChevronDown className="w-6 h-6 shrink-0 opacity-50" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-6 py-5 bg-[#F0F0F0] border-t-4 border-[#121212]">
                      <p className="font-medium leading-relaxed opacity-90">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Ticketing */}
        <div className="lg:col-span-1 border-4 border-[#121212] bg-[#121212] text-white shadow-[8px_8px_0px_0px_#D02020] flex flex-col h-max relative overflow-hidden">
          
          {ticketSubmitted ? (
             <div className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <CheckCircle2 className="w-16 h-16 text-[#F0C020] mb-4" />
                <h3 className="font-black text-xl uppercase tracking-tight mb-2">Ticket Submitted</h3>
                <p className="font-medium opacity-80 text-sm">Your ticket <strong className="text-[#F0C020]">#NX-A-309</strong> has been raised. IT Support will respond shortly.</p>
             </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b-4 border-[#D02020] bg-white text-[#121212]">
                <h2 className="font-black text-xl uppercase tracking-tight flex items-center gap-2">
                   Contact Nexus Admin
                </h2>
              </div>
              
              <form onSubmit={handleTicketSubmit} className="p-6 flex flex-col gap-6">
                 <div>
                   <label className="font-bold uppercase text-[10px] tracking-widest opacity-70 mb-2 block">Issue Type</label>
                   <select className="w-full p-4 bg-[#121212] border-2 border-white/30 font-bold uppercase text-xs tracking-widest outline-none focus:border-white transition-colors" required>
                     <option value="">Select Category</option>
                     <option>System Bug</option>
                     <option>Role Permission Error</option>
                     <option>Report Analytics Issue</option>
                     <option>Other</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="font-bold uppercase text-[10px] tracking-widest opacity-70 mb-2 block">Description</label>
                   <textarea rows={6} className="w-full p-4 bg-[#121212] border-2 border-white/30 text-sm outline-none focus:border-white font-medium" placeholder="Describe the issue specifically..." required />
                 </div>
                 
                 <button type="submit" className="w-full py-4 bg-[#D02020] border-2 border-white font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-white hover:text-[#D02020] transition-colors mt-auto">
                   Submit Ticket <Send className="w-4 h-4" />
                 </button>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
