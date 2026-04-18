import React, { useState } from 'react';
import { useLab } from '../../context/LabContext';
import { format } from 'date-fns';
import { CheckCircle2, AlertCircle, Eye, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router';

export function ReviewedApplications() {
  const { labStudents, undoDecision } = useLab();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'All' | 'Approved' | 'Flagged'>('All');
  
  const reviewedList = labStudents.filter(s => s.status !== 'Pending');
  const displayList = reviewedList.filter(s => activeTab === 'All' ? true : s.status === activeTab).sort((a,b) => {
    return new Date(b.decisionDate || '').getTime() - new Date(a.decisionDate || '').getTime();
  });

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 pb-32">
       
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-[#121212] pb-6">
        <div>
          <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter mb-2">Decision Ledger</h1>
          <p className="font-bold opacity-50 uppercase tracking-widest text-sm">
             Historical record of all Stage 1 authorizations and rejections.
          </p>
        </div>
      </div>

      <div className="flex border-4 border-[#121212] bg-[#F9F9F9] p-2 gap-2 max-w-lg">
         {['All', 'Approved', 'Flagged'].map(tab => (
           <button 
             key={tab}
             onClick={() => setActiveTab(tab as any)} 
             className={`flex-1 py-3 font-black text-xs uppercase tracking-widest border-2 transition-colors ${activeTab === tab ? 'bg-[#121212] text-white border-[#121212]' : 'border-transparent text-[#121212] hover:border-[#121212]/30'}`}
           >
             {tab}
           </button>
         ))}
      </div>

      <div className="border-4 border-[#121212] bg-white shadow-[8px_8px_0px_0px_#121212] overflow-x-auto min-h-[400px]">
         <table className="w-full text-left font-bold text-xs">
            <thead className="bg-[#121212] text-white uppercase tracking-widest text-[10px]">
              <tr>
                <th className="p-4">Student Reference</th>
                <th className="p-4">Decision</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4 max-w-[200px]">Lab Status Log</th>
                <th className="p-4 text-right pr-6">Action Menu</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#121212]">
              {displayList.map(s => {
                 const isWithin24H = (new Date().getTime() - new Date(s.decisionDate || '').getTime()) < (24 * 60 * 60 * 1000);

                 return (
                   <tr key={s.id} className="hover:bg-[#F9F9F9]">
                      <td className="p-4">
                         <div className="font-black uppercase tracking-tight text-sm line-clamp-1">{s.name}</div>
                         <div className="text-[10px] font-mono opacity-80 mt-1">{s.rollNo}</div>
                         <div className="text-[10px] uppercase tracking-widest opacity-50 mt-1">{s.branch}</div>
                      </td>
                      <td className="p-4">
                         {s.status === 'Approved' ? (
                           <div className="flex items-center gap-2 text-[#1040C0]"><CheckCircle2 className="w-4 h-4" /> <span className="font-black uppercase tracking-widest text-[10px]">APPROVED</span></div>
                         ) : (
                           <div className="flex items-center gap-2 text-[#D02020]"><AlertCircle className="w-4 h-4" /> <span className="font-black uppercase tracking-widest text-[10px]">FLAGGED</span></div>
                         )}
                      </td>
                      <td className="p-4 opacity-80 uppercase tracking-widest text-[10px]">
                         {format(new Date(s.decisionDate || ''), 'MMM dd, yyyy')}<br/>
                         <span className="opacity-60">{format(new Date(s.decisionDate || ''), 'HH:mm')}</span>
                      </td>
                      <td className="p-4 max-w-[200px] align-top">
                         <div className="line-clamp-2 text-[10px] opacity-80 font-medium">
                           {s.decisionComment}
                         </div>
                      </td>
                      <td className="p-4 pr-6 text-right space-x-2">
                         <div className="flex justify-end gap-2 isolate relative">
                           <button onClick={() => navigate(`/lab/review/${s.id}`)} className="p-2 border-2 border-[#121212] hover:bg-[#121212] hover:text-white transition-colors" title="Read Only View">
                             <Eye className="w-4 h-4" />
                           </button>
                           
                           {isWithin24H ? (
                             <button onClick={() => undoDecision(s.id)} className="px-3 py-2 border-2 border-[#D02020] text-[#D02020] hover:bg-[#D02020] hover:text-white transition-colors font-black uppercase tracking-widest text-[10px] flex items-center gap-1">
                               Undo Decision
                             </button>
                           ) : (
                             <button disabled className="px-3 py-2 border-2 border-[#121212]/20 text-[#121212]/30 font-black uppercase tracking-widest text-[10px] cursor-not-allowed group">
                               Undo <span className="hidden group-hover:inline ml-1 normal-case font-normal">(Expired)</span>
                             </button>
                           )}
                         </div>
                      </td>
                   </tr>
                 )
              })}
              {displayList.length === 0 && (
                <tr>
                   <td colSpan={5} className="p-10 text-center font-black uppercase tracking-widest text-sm opacity-40">
                     No recorded decisions found.
                   </td>
                </tr>
              )}
            </tbody>
         </table>
      </div>

    </div>
  );
}
