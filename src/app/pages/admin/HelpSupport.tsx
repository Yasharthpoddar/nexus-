import React, { useState } from 'react';
import { 
  ChevronDown, Send, Settings, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

function Toast({ message, visible }: { message: string, visible: boolean }) {
  return (
    <AnimatePresence>
       {visible && (
         <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-10 right-10 bg-white border-4 border-[#121212] shadow-[8px_8px_0px_0px_#121212] px-6 py-4 font-black uppercase tracking-widest text-sm z-50 flex items-center gap-3">
             <CheckCircle2 className="w-5 h-5 text-[#1040C0]" /> {message}
         </motion.div>
       )}
    </AnimatePresence>
  )
}

export function HelpSupport() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const faqs = [
    { q: "How do I reset a student's clearance?", a: "Navigate to Student Management -> View Student. Under the Clearance Status Heatmap, you can manually override any department status to 'Pending' or 'Blocked'. Click Save Override to execute the reset." },
    { q: "How do I add a new authority?", a: "Go to Authority Management and click the Add Authority button. Fill in the required credentials and provision their role matrix. They will receive a temporary password via their college email." },
    { q: "What happens if a CSV has errors?", a: "The system will parse the valid rows and reject the corrupt ones. A detailed structural error log will be available in the Upload History Ledger beneath the drop zone." },
    { q: "How does the QR verification work?", a: "Each certificate generated houses a unique encrypted hash tied to the student's blockchain identity. Scanning the QR via any standard mobile device cross-checks the hash with our live production database." },
    { q: "Can I undo a certificate once issued?", a: "Yes, but this requires an absolute manual override. You must block the student out of the protocol timeline and manually invalidate the certificate ID in the root terminal. This will flag the QR code as invalid." },
    { q: "How do I change the approval chain order?", a: "Under System Settings -> Pipeline Protocol Flow, you can natively reposition the hierarchy using the sorting constraints. Save the Order Schema to immediately redirect live traffic." }
  ];

  const handleTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMsg('Ticket NX-ADMIN-501 Raised');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10 pb-32">
       
       <div className="border-b-4 border-[#121212] pb-6">
          <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter mb-2 flex items-center gap-4">
             <ShieldAlert className="w-10 h-10 text-[#F0C020] hidden sm:block" /> Administrator Support
          </h1>
          <p className="font-bold opacity-50 uppercase tracking-widest text-sm">Documentation and direct protocol ticketing for infrastructure bugs.</p>
       </div>

       <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          
          {/* FAQ */}
          <div className="flex flex-col gap-6">
             <h2 className="font-black text-2xl uppercase tracking-tighter text-[#121212]">Frequently Asked Questions</h2>
             
             <div className="flex flex-col border-t-2 border-[#121212]">
                {faqs.map((f, i) => {
                  const isOpen = openFaq === i;
                  return (
                    <div key={i} className="border-b-2 border-[#121212] flex flex-col">
                       <button 
                         onClick={() => setOpenFaq(isOpen ? null : i)}
                         className={`p-5 flex justify-between items-center text-left transition-colors ${isOpen ? 'bg-[#F0F0F0]' : 'bg-white hover:bg-[#F9F9F9]'}`}
                       >
                          <span className="font-black uppercase tracking-tight text-sm pr-4">{f.q}</span>
                          <ChevronDown className={`w-5 h-5 shrink-0 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                       </button>
                       <AnimatePresence>
                         {isOpen && (
                           <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-[#F0F0F0]">
                              <div className="p-5 pt-0">
                                 <p className="font-mono text-sm leading-relaxed border-l-2 border-[#121212] pl-4 opacity-80">
                                    {f.a}
                                 </p>
                              </div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                    </div>
                  )
                })}
             </div>
          </div>

          {/* Contact Core */}
          <div className="flex flex-col gap-6">
             <h2 className="font-black text-2xl uppercase tracking-tighter">Anthropic Developer Support</h2>
             <div className="border-4 border-[#121212] bg-white shadow-[8px_8px_0px_0px_#121212] p-8 lg:p-10 flex flex-col gap-8">
                
                <div className="flex flex-wrap gap-4 items-center">
                   <div className="w-16 h-16 bg-[#121212] flex items-center justify-center text-white"><Settings className="w-8 h-8" /></div>
                   <div>
                     <p className="font-black text-xl uppercase tracking-widest">NEXUS CORE OPS</p>
                     <a href="mailto:support@nexus.edu" className="font-bold text-xs uppercase tracking-widest opacity-60 hover:underline">devops@nexus-protocol.io</a>
                   </div>
                </div>

                <form onSubmit={handleTicket} className="flex flex-col gap-6 border-t-4 border-[#121212] pt-8">
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Issue Classification</label>
                      <select required className="w-full p-4 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-bold text-xs uppercase tracking-widest">
                         <option value="">Select Severity Domain</option>
                         <option>Database Sync Failure</option>
                         <option>Node Pipeline Crash</option>
                         <option>Certificate Cryptography Error</option>
                         <option>Authentication Bypass</option>
                         <option>Other DevOps Request</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Detailed Output / Trace</label>
                      <textarea required minLength={20} className="w-full h-32 p-4 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-mono text-sm" placeholder="Paste your error logs or operational notes here..."></textarea>
                   </div>
                   <button type="submit" className="w-full bg-[#121212] text-white p-5 font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black border-4 border-[#121212] hover:border-[#F0C020] transition-colors">
                      Execute Override Ticket <Send className="w-4 h-4 ml-1" />
                   </button>
                </form>

             </div>
          </div>

       </div>

       <Toast message={toastMsg} visible={showToast} />
    </div>
  );
}
