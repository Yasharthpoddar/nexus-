import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useParams, Link } from 'react-router';
import { subDays, format } from 'date-fns';
import { 
  Send, AlertCircle, MessageSquare, ChevronDown
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export function AuthorityDetail() {
  const { id } = useParams();
  const { authorities } = useAdmin();
  const auth = authorities.find(a => a.id === id);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  if(!auth) return <div className="p-10 font-black text-2xl uppercase">Authority not found</div>;

  const mockActivity = [
    { id: 'a1', student: 'Hritani Joshi', rollNo: '21CS088', submitted: subDays(new Date(), 2), decision: 'Approved', decided: subDays(new Date(), 1), days: 1, comment: 'All lab equipment returned correctly.' },
    { id: 'a2', student: 'Rohan Patil', rollNo: '21CS042', submitted: subDays(new Date(), 5), decision: 'Rejected', decided: subDays(new Date(), 4), days: 1, comment: 'Pending dues for advanced network lab. Please clear the hardware fee.' },
    { id: 'a3', student: 'Fatima Khan', rollNo: '21CS019', submitted: subDays(new Date(), 6), decision: 'Approved', decided: subDays(new Date(), 4), days: 2, comment: 'Verify doc was blurry but roll number matched internal registry.' }
  ];

  const staleApps = [
    { id: 's1', student: 'Priya Mehta', rollNo: '21CS031', days: 3 },
    { id: 's2', student: 'Arjun Nair', rollNo: '21CS067', days: 4 }
  ];

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10 pb-32">
       
       <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest opacity-60 mb-8">
         <Link to="/admin/dashboard" className="hover:underline">Admin</Link> &gt; 
         <Link to="/admin/authorities" className="hover:underline">Authority Management</Link> &gt; 
         <span className="text-[#121212] opacity-100">{auth.name}</span>
       </div>

       {/* Top Profile Card */}
       <div className="border-4 border-[#121212] bg-white shadow-[8px_8px_0px_0px_#121212] p-6 lg:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
             <div className="w-24 h-24 bg-[#F0C020] border-4 border-[#121212] rounded-full flex items-center justify-center font-black text-3xl uppercase tracking-tighter shrink-0">
                {auth.name.split(' ').map(n=>n[0]).join('')}
             </div>
             <div>
                <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter mb-2">{auth.name}</h1>
                <div className="flex flex-wrap gap-4 font-bold text-[10px] uppercase tracking-widest opacity-80">
                   <span className={`border-2 px-2 py-1 ${auth.role==='Principal' ? 'border-[#121212] bg-[#121212] text-white' : auth.role==='HOD' ? 'border-[#1040C0] text-[#1040C0]' : 'border-[#121212]'}`}>
                      {auth.role}
                   </span>
                   <span className="bg-[#F9F9F9] border-2 border-[#121212] px-2 py-1">{auth.department}</span>
                   <span className="bg-[#F9F9F9] border-2 border-[#121212] px-2 py-1">{auth.email}</span>
                   <span className="bg-[#F9F9F9] border-2 border-[#121212] px-2 py-1">Since {auth.joined.substring(0,4)}</span>
                </div>
             </div>
          </div>
       </div>

       {/* Performance Row */}
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="border-4 border-[#121212] bg-white p-5 flex flex-col shadow-[4px_4px_0px_0px_#121212]">
             <p className="font-black text-4xl tracking-tighter mb-1 text-[#1040C0]">{auth.reviewedCount}</p>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-auto">Apps Processed Node</p>
          </div>
          <div className="border-4 border-[#D02020] bg-white p-5 flex flex-col shadow-[4px_4px_0px_0px_#D02020]">
             <p className="font-black text-4xl tracking-tighter mb-1 text-[#D02020]">{auth.pendingCount}</p>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-auto">Currently Pending</p>
          </div>
          <div className="border-4 border-[#121212] bg-white p-5 flex flex-col shadow-[4px_4px_0px_0px_#121212]">
             <p className="font-black text-4xl tracking-tighter mb-1">{auth.avgTimeDays}d</p>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-auto">Avg Response Time</p>
          </div>
       </div>

       {/* Stale Warn */}
       {staleApps.length > 0 && (
         <div className="border-4 border-[#D02020] bg-[#FFF3CD] p-6 shadow-[8px_8px_0px_0px_#D02020] flex flex-col gap-4">
            <h2 className="font-black text-xl uppercase tracking-tighter text-[#D02020] flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> SLA Violation Warning ({staleApps.length} Apps)
            </h2>
            <div className="flex flex-col gap-2">
               {staleApps.map(s => (
                 <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#D02020]/20 pb-2">
                    <span className="font-bold text-sm uppercase tracking-widest text-[#D02020]">{s.student} ({s.rollNo}) — Waiting {s.days} Days</span>
                    <button onClick={()=>alert(`Nudge sent for ${s.student}`)} className="bg-[#D02020] text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black w-max mt-2 sm:mt-0">
                      <Send className="w-3 h-3" /> Execute Nudge
                    </button>
                 </div>
               ))}
            </div>
         </div>
       )}

       {/* Audit Table */}
       <div className="border-4 border-[#121212] bg-white shadow-[8px_8px_0px_0px_#121212] overflow-x-auto">
          <div className="p-6 border-b-4 border-[#121212] bg-[#F9F9F9]">
             <h2 className="font-black text-xl uppercase tracking-tighter">Node Action Ledger (Last 30 Days)</h2>
          </div>
          <div className="min-w-[800px]">
             {mockActivity.map((act) => (
               <div key={act.id} className="border-b-2 border-[#121212] flex flex-col">
                  {/* Row */}
                  <div 
                    className="flex items-center p-4 cursor-pointer hover:bg-[#F9F9F9] transition-colors"
                    onClick={() => setExpandedId(expandedId === act.id ? null : act.id)}
                  >
                     <div className="flex-1 font-black uppercase tracking-tight text-sm px-2 text-left">{act.student}</div>
                     <div className="flex-1 font-mono uppercase text-sm px-2 text-left">{act.rollNo}</div>
                     <div className="flex-1 px-2 text-left">
                        <span className={`font-black text-[10px] uppercase tracking-widest px-2 py-1 ${act.decision==='Approved' ? 'bg-[#121212] text-white' : 'bg-[#D02020] text-white'}`}>
                          {act.decision}
                        </span>
                     </div>
                     <div className="flex-1 font-bold text-xs uppercase tracking-widest opacity-60 px-2 text-left">
                        {format(act.decided, 'MMM dd')} ({act.days}d)
                     </div>
                     <div className="w-10 flex justify-center opacity-40 px-2">
                        <ChevronDown className={`w-5 h-5 transition-transform ${expandedId === act.id ? 'rotate-180' : ''}`} />
                     </div>
                  </div>
                  {/* Expanded */}
                  <AnimatePresence>
                    {expandedId === act.id && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-[#F0F0F0] border-t-2 border-[#121212]/10">
                         <div className="p-4 pl-6 flex items-start gap-3">
                            <MessageSquare className="w-4 h-4 mt-1 opacity-50 shrink-0" />
                            <p className="font-mono text-xs leading-relaxed opacity-80 max-w-2xl">{act.comment}</p>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
             ))}
          </div>
       </div>

    </div>
  );
}
