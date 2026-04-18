import React, { useState } from 'react';
import { usePrincipal } from '../../context/PrincipalContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router';
import { format } from 'date-fns';
import { 
  Search, Filter, ChevronDown, Zap, X,
  Clock, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DocumentQueue } from '../../components/DocumentQueue';

export function PendingApps() {
  const { pendingApps, approveApplication, flagApplication } = usePrincipal();
  const { currentUser } = useAuth();
  const basePath = `/principal`;
  
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  
  const [confirmModal, setConfirmModal] = useState<{type: 'approve' | 'flag', ids: string[]} | null>(null);

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const selectAll = () => {
    if(selected.length === filteredApps.length) setSelected([]);
    else setSelected(filteredApps.map(a => a.id));
  };

  const filteredApps = pendingApps.filter(a =>
    (a.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.rollNo || '').toLowerCase().includes(search.toLowerCase())
  );

  const executeBatch = () => {
    if(!confirmModal) return;
    confirmModal.ids.forEach(id => {
      if(confirmModal.type === 'approve') approveApplication(id);
      else flagApplication(id, 'Batch flagged by Principal');
    });
    setSelected([]);
    setConfirmModal(null);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 relative pb-32">
      
      <div>
        <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tight mb-2">Pending Queue</h1>
        <p className="text-lg font-medium opacity-80">Review, flag, or approve student clearance requests.</p>
      </div>

      {/* Document Verification Queue */}
      <DocumentQueue stage="principal" portalPrefix="/principal" title="Document Verification Queue" />

      {/* Application Clearance Queue */}
      <div className="border-t-4 border-[#121212] pt-8">
        <h2 className="font-black text-xl uppercase tracking-tight mb-6">Application Clearance Queue</h2>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
         <div className="relative flex-1">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
           <input 
             type="text" 
             placeholder="Search by Name or Roll No..." 
             className="w-full p-4 pl-12 font-bold uppercase text-sm tracking-wide bg-white border-4 border-[#121212] outline-none focus:border-[#1040C0]"
             value={search}
             onChange={e => setSearch(e.target.value)}
           />
         </div>
         <button className="px-6 py-4 bg-white border-4 border-[#121212] font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-[#F0C020] transition-colors">
            <Filter className="w-4 h-4" /> Filter <ChevronDown className="w-4 h-4" />
         </button>
      </div>

      {filteredApps.length === 0 ? (
         <div className="bg-white border-4 border-[#121212] flex flex-col items-center justify-center p-20 shadow-[8px_8px_0px_0px_#121212] text-center">
            <div className="w-24 h-24 bg-[#E0E0E0] rounded-full border-4 border-[#121212] mb-6 flex items-center justify-center">
               <Award className="w-10 h-10 opacity-30" />
            </div>
            <h2 className="font-black text-2xl uppercase tracking-tight text-[#1040C0] mb-2">You're all caught up!</h2>
            <p className="font-bold opacity-60 uppercase text-xs tracking-widest">No pending applications in your queue.</p>
         </div>
      ) : (
         <div className="space-y-4">
           {/* Header Select All */}
           <div className="flex items-center gap-4 px-6 py-2">
             <label className="flex items-center gap-3 cursor-pointer">
               <input 
                 type="checkbox" 
                 checked={filteredApps.length > 0 && selected.length === filteredApps.length}
                 onChange={selectAll}
                 className="w-5 h-5 border-2 border-[#121212] accent-[#121212] cursor-pointer" 
               />
               <span className="font-bold text-xs uppercase tracking-widest opacity-60">Select All</span>
             </label>
           </div>

           {/* Cards */}
           {filteredApps.map(app => {
             const isStale = app.daysWaiting >= 2;
             const docCount = (app as any).documents?.length;
             return (
               <div key={app.id} className={`bg-white border-4 transition-all flex flex-col lg:flex-row items-start lg:items-center p-5 md:p-6 gap-6 ${
                 isStale ? 'border-[#D02020]' : 'border-[#121212]'
               } ${selected.includes(app.id) ? 'shadow-[4px_4px_0px_0px_#121212] -translate-y-1' : ''}`}>
                 
                 <div className="flex items-center gap-4">
                   <input 
                     type="checkbox" 
                     checked={selected.includes(app.id)}
                     onChange={() => toggleSelect(app.id)}
                     className="w-5 h-5 border-2 border-[#121212] accent-[#121212] cursor-pointer mt-1 lg:mt-0" 
                   />
                 </div>

                 <div className="flex-1 flex flex-col">
                   <div className="flex items-center gap-3 mb-1">
                      <span className="font-black text-2xl uppercase tracking-tight leading-none">{app.studentName}</span>
                      {isStale && <span className="px-2 py-0.5 bg-[#D02020] text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3"/> Overdue</span>}
                   </div>
                   <p className="font-bold text-xs uppercase tracking-widest opacity-60 mb-3">
                     {app.rollNo} &bull; {app.branch} &apos;{app.batch.substring(2)}{docCount ? ` \u2022 ${docCount} Docs` : ''}
                   </p>
                   <p className="bg-[#E0E0E0] text-[#121212] px-2 py-1 w-max font-bold text-[10px] border border-[#121212] uppercase tracking-widest">
                      Submitted {format(new Date(app.submissionDate), 'MMM d')}
                   </p>
                 </div>

                 <div className="flex flex-wrap lg:flex-nowrap w-full lg:w-auto gap-3">
                   <button 
                     onClick={() => setConfirmModal({ type: 'approve', ids: [app.id] })}
                     className="flex-1 lg:flex-none px-6 py-4 bg-white text-[#121212] border-2 border-[#121212] font-black uppercase text-xs tracking-widest hover:bg-[#1040C0] hover:text-white hover:border-[#1040C0] transition-colors flex items-center justify-center gap-2"
                   >
                     <Zap className="w-4 h-4" /> Quick Approve
                   </button>
                   <Link 
                     to={`${basePath}/review/${app.id}`}
                     className="flex-1 lg:flex-none px-8 py-4 bg-[#121212] text-white border-2 border-[#121212] font-black uppercase text-xs tracking-widest hover:bg-[#F0C020] hover:text-[#121212] hover:border-[#F0C020] transition-colors text-center"
                   >
                     Review Detail
                   </Link>
                 </div>
               </div>
             )
           })}
         </div>
      )}

      {/* Floating Batch Action Bar */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-0 right-0 z-40 flex justify-center px-4"
          >
            <div className="bg-[#121212] border-4 border-[#F0C020] text-white p-4 shadow-[8px_8px_0px_0px_#121212] flex items-center justify-between gap-8 md:gap-16">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-[#1040C0] text-white flex items-center justify-center font-black">{selected.length}</div>
                 <span className="font-bold uppercase text-xs tracking-widest hidden md:block">Applications Selected</span>
               </div>
               
               <div className="flex gap-4">
                 <button 
                   onClick={() => setConfirmModal({ type: 'flag', ids: selected })}
                   className="px-6 py-3 border-2 border-[#D02020] text-[#D02020] font-black uppercase text-xs tracking-widest hover:bg-[#D02020] hover:text-white transition-colors"
                 >
                   Flag Selected
                 </button>
                 <button 
                   onClick={() => setConfirmModal({ type: 'approve', ids: selected })}
                   className="px-6 py-3 bg-[#F0C020] text-[#121212] font-black uppercase text-xs tracking-widest hover:bg-white transition-colors"
                 >
                   Approve Selected
                 </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          >
             <div className={`bg-white border-4 border-[#121212] w-full max-w-md shadow-[12px_12px_0px_0px_${confirmModal.type === 'approve' ? '#1040C0' : '#D02020'}] flex flex-col`}>
                <div className={`p-6 border-b-4 border-[#121212] flex justify-between items-center ${confirmModal.type === 'approve' ? 'bg-[#1040C0] text-white' : 'bg-[#D02020] text-white'}`}>
                  <h3 className="font-black uppercase tracking-tight text-xl">Confirm {confirmModal.type === 'approve' ? 'Approval' : 'Flagging'}</h3>
                  <button onClick={() => setConfirmModal(null)}><X className="w-6 h-6" /></button>
                </div>
                <div className="p-8">
                   <p className="font-medium text-lg leading-relaxed mb-8">
                     Are you sure you want to <strong>{confirmModal.type}</strong> {confirmModal.ids.length === 1 ? 'this application' : `these ${confirmModal.ids.length} applications`}? 
                     {confirmModal.type === 'approve' ? ' This will forward them to the next authority.' : ' The students will be notified to take action.'}
                   </p>
                   
                   <div className="flex gap-4">
                     <button onClick={() => setConfirmModal(null)} className="flex-1 py-4 border-2 border-[#121212] font-black text-xs uppercase tracking-widest hover:bg-[#F0F0F0]">Cancel</button>
                     <button onClick={executeBatch} className={`flex-1 py-4 border-2 border-[#121212] font-black text-xs uppercase tracking-widest text-white transition-all ${confirmModal.type === 'approve' ? 'bg-[#1040C0] shadow-[4px_4px_0px_0px_#121212] hover:-translate-y-1' : 'bg-[#D02020] shadow-[4px_4px_0px_0px_#121212] hover:-translate-y-1'}`}>
                       Confirm
                     </button>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
