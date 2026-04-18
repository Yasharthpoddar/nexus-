import React, { useState } from 'react';
import { usePrincipal } from '../../context/PrincipalContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router';
import { format, differenceInHours } from 'date-fns';
import { 
  Search, Filter, ExternalLink, Download, 
  RotateCcw, X, CheckCircle2, AlertOctagon, Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ReviewedApps() {
  const { reviewedApps, undoDecision } = usePrincipal();
  const { currentUser } = useAuth();
  const basePath = `/principal`;
  
  const [activeTab, setActiveTab] = useState<'All'|'Approved'|'Rejected'>('All');
  const [search, setSearch] = useState('');
  const [undoModal, setUndoModal] = useState<string | null>(null);

  const filteredApps = reviewedApps.filter(a => {
    const matchesTab = activeTab === 'All' 
       || (activeTab === 'Approved' && a.status === 'Approved') 
       || (activeTab === 'Rejected' && a.status === 'Flagged');
    const matchesSearch = a.studentName.toLowerCase().includes(search.toLowerCase()) 
       || a.rollNo.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleUndo = () => {
    if(undoModal) {
      undoDecision(undoModal);
      setUndoModal(null);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-20">
      
      <div>
        <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tight mb-2">Decision History</h1>
        <p className="text-lg font-medium opacity-80">Archive of all your processed applications.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-6 justify-between border-b-4 border-[#121212] pb-6">
        <div className="flex gap-4">
          {['All', 'Approved', 'Rejected'].map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`font-black uppercase text-sm tracking-widest pb-2 border-b-4 transition-colors ${activeTab === t ? 'border-[#1040C0] text-[#1040C0]' : 'border-transparent opacity-50 hover:opacity-100'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex w-full md:w-auto gap-4">
           <div className="relative flex-1 md:w-64">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
             <input 
               type="text" 
               placeholder="Search archive..." 
               className="w-full py-3 px-4 pl-10 font-bold uppercase text-xs tracking-wide bg-white border-4 border-[#121212] outline-none focus:border-[#1040C0]"
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
           </div>
           <button className="px-4 bg-white border-4 border-[#121212] flex justify-center items-center hover:bg-[#F0C020]">
              <Filter className="w-5 h-5" />
           </button>
        </div>
      </div>

      {filteredApps.length === 0 ? (
         <div className="bg-white border-4 border-[#121212] p-20 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_0px_#121212]">
            <Archive className="w-16 h-16 opacity-20 mb-4" />
            <p className="font-black text-xl uppercase tracking-tight opacity-50">No records found matching criteria.</p>
         </div>
      ) : (
         <div className="bg-white border-4 border-[#121212] shadow-[8px_8px_0px_0px_#121212] overflow-x-auto">
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-[#121212] text-white">
                  <th className="p-4 font-bold text-xs uppercase tracking-widest pl-6">Student</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-widest">Branch</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-widest">Decision</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-widest">Date / Comment</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-widest pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-4 divide-[#121212]">
                {filteredApps.map(app => {
                   const isApproved = app.status === 'Approved';
                   const hoursSince = app.decisionDate ? differenceInHours(new Date(), new Date(app.decisionDate)) : 25;
                   const canUndo = hoursSince <= 24;

                   return (
                     <tr key={app.id} className="hover:bg-[#F9F9F9] transition-colors group">
                        <td className="p-4 pl-6">
                           <p className="font-black uppercase tracking-tight text-lg">{app.studentName}</p>
                           <p className="font-mono text-xs opacity-60">{app.rollNo}</p>
                        </td>
                        <td className="p-4">
                           <p className="font-bold text-sm uppercase tracking-widest">{app.branch}</p>
                           <p className="font-bold text-[10px] uppercase tracking-widest opacity-60">Batch '{app.batch.substring(2)}</p>
                        </td>
                        <td className="p-4">
                           <div className={`flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest w-max px-2 py-1 border-2 ${isApproved ? 'border-[#1040C0] text-[#1040C0] bg-[#1040C0]/10' : 'border-[#D02020] text-[#D02020] bg-[#D02020]/10'}`}>
                             {isApproved ? <CheckCircle2 className="w-4 h-4"/> : <AlertOctagon className="w-4 h-4"/>}
                             {app.status}
                           </div>
                        </td>
                        <td className="p-4 max-w-[250px]">
                           <p className="font-bold text-[10px] uppercase tracking-widest opacity-60 mb-1">{app.decisionDate ? format(new Date(app.decisionDate), 'MMM d, yyyy') : 'Unknown'}</p>
                           <p className="font-medium text-xs line-clamp-2" title={app.decisionComment}>{app.decisionComment}</p>
                        </td>
                        <td className="p-4 pr-6">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => alert('Summary PDF downloaded.')} className="w-10 h-10 border-2 border-[#121212] flex items-center justify-center hover:bg-[#121212] hover:text-white transition-colors" title="Download Summary">
                                 <Download className="w-4 h-4" />
                              </button>
                              <Link to={`${basePath}/review/${app.id}`} className="w-10 h-10 border-2 border-[#121212] flex items-center justify-center hover:bg-[#121212] hover:text-white transition-colors" title="View Details">
                                 <ExternalLink className="w-4 h-4" />
                              </Link>
                              <button 
                                onClick={() => canUndo && setUndoModal(app.id)}
                                disabled={!canUndo}
                                className="w-10 h-10 border-2 border-[#121212] flex items-center justify-center hover:bg-[#F0C020] transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed" 
                                title={canUndo ? "Undo Decision (Within 24h)" : "Undo window expired"}
                              >
                                 <RotateCcw className="w-4 h-4" />
                              </button>
                           </div>
                        </td>
                     </tr>
                   )
                })}
              </tbody>
            </table>
         </div>
      )}

      {/* Undo Modal */}
      <AnimatePresence>
        {undoModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          >
             <div className={`bg-white border-4 border-[#121212] w-full max-w-md shadow-[12px_12px_0px_0px_#F0C020] flex flex-col`}>
                <div className={`p-6 border-b-4 border-[#121212] bg-[#121212] text-white flex justify-between items-center`}>
                  <h3 className="font-black uppercase tracking-tight text-xl">Undo Decision</h3>
                  <button onClick={() => setUndoModal(null)}><X className="w-6 h-6" /></button>
                </div>
                <div className="p-8">
                   <div className="flex items-center gap-4 mb-6 p-4 bg-[#F0C020]/20 border-2 border-[#F0C020]">
                      <RotateCcw className="w-8 h-8 text-[#121212] shrink-0" />
                      <p className="font-bold text-sm leading-snug">Are you sure you want to reopen this application? The student will be notified of the status change.</p>
                   </div>
                   
                   <div className="flex gap-4">
                     <button onClick={() => setUndoModal(null)} className="flex-1 py-4 border-2 border-[#121212] font-black text-xs uppercase tracking-widest hover:bg-[#F0F0F0]">Cancel</button>
                     <button onClick={handleUndo} className="flex-1 py-4 bg-[#F0C020] border-2 border-[#121212] font-black text-xs uppercase tracking-widest text-[#121212] hover:bg-[#121212] hover:text-[#F0C020] transition-colors">
                       Confirm Undo
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
