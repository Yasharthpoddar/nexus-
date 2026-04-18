import React from 'react';
import { useLab } from '../../context/LabContext';
import { format } from 'date-fns';
import { ArrowRight, Clock, CheckCircle2, AlertCircle, FileText, MonitorSmartphone } from 'lucide-react';
import { useNavigate } from 'react-router';

export function Dashboard() {
  const { profile, labStudents, activities } = useLab();
  const navigate = useNavigate();

  const pendingCount = labStudents.filter(s => s.status === 'Pending').length;
  const approvedCount = labStudents.filter(s => s.status === 'Approved').length;
  const flaggedCount = labStudents.filter(s => s.status === 'Flagged').length;
  
  const stats = [
    { label: 'Awaiting Your Review', value: pendingCount },
    { label: 'Approved This Month', value: 38 }, // Mapped from requirements explicitly
    { label: 'Flagged This Month', value: 6 },
    { label: 'Avg Decision Time', value: '1.2 days' }
  ];

  const pendingQueue = labStudents.filter(s => s.status === 'Pending').slice(0, 5);

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10 pb-32">
      
      {/* Welcome Strip */}
      <div className="border-b-4 border-[#121212] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter mb-2">Welcome back, {profile.name}</h1>
          <p className="font-bold opacity-50 uppercase tracking-widest text-sm">
            You are Stage 1 of the clearance chain. Your approval unlocks the HOD review.
          </p>
        </div>
        <span className="font-bold text-xs uppercase tracking-widest bg-[#121212] text-white px-3 py-1.5 whitespace-nowrap">
          {format(new Date(), 'MMM dd, yyyy')}
        </span>
      </div>

      {/* Stage Indicator Banner */}
      <div className="border-4 border-[#121212] bg-[#F0C020] p-4 flex flex-col md:flex-row items-center gap-4 justify-center shadow-[4px_4px_0px_0px_#121212]">
         <div className="font-black uppercase tracking-widest text-sm md:mr-8">Approval Chain:</div>
         
         <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
            <div className="bg-[#121212] text-white font-black uppercase text-[10px] md:text-xs tracking-widest px-4 py-2 border-2 border-[#121212] shadow-[2px_2px_0px_0px_white]">
              Lab In-charge (YOU)
            </div>
            <ArrowRight className="w-5 h-5 opacity-60" />
            <div className="bg-white text-[#121212] font-black uppercase text-[10px] md:text-xs tracking-widest px-4 py-2 border-2 border-[#121212]">
              HOD Review
            </div>
            <ArrowRight className="w-5 h-5 opacity-60" />
            <div className="bg-white text-[#121212] font-black uppercase text-[10px] md:text-xs tracking-widest px-4 py-2 border-2 border-[#121212]">
              Principal Review
            </div>
         </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="border-4 border-[#121212] shadow-[4px_4px_0px_0px_#121212] bg-white p-5 flex flex-col">
            <p className="font-black text-4xl tracking-tighter mb-1">{s.value}</p>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-60 mt-auto leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout: Pending Queue & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        <div className="lg:col-span-2 space-y-4">
           <div className="flex justify-between items-end">
              <h2 className="font-black text-2xl uppercase tracking-tighter">Priority Queue</h2>
              <button onClick={() => navigate('/lab/pending')} className="text-xs font-black uppercase tracking-widest text-[#1040C0] hover:underline hover:-translate-y-0.5 transition-transform">
                View All {pendingCount}
              </button>
           </div>
           
           <div className="border-4 border-[#121212] bg-white shadow-[8px_8px_0px_0px_#121212] overflow-x-auto">
             <table className="w-full text-left font-bold text-xs">
               <thead className="bg-[#121212] text-white uppercase tracking-widest text-[10px]">
                 <tr>
                   <th className="p-3">Student Name</th>
                   <th className="p-3">Branch</th>
                   <th className="p-3">Days Waiting</th>
                   <th className="p-3 text-center">Lab Items</th>
                   <th className="p-3 pr-4 text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y-2 divide-[#121212]">
                 {pendingQueue.length > 0 ? pendingQueue.map(s => {
                    const days = Math.floor((new Date().getTime() - new Date(s.submittedAt).getTime()) / (1000 * 3600 * 24));
                    const isOverdue = days > 2;
                    const allClear = s.equipment.labManual === 'Returned' && s.equipment.equipmentKit === 'Returned' && 
                                     s.equipment.safetyDeposit === 'Returned' && s.equipment.labCard === 'Returned';

                    return (
                      <tr key={s.id} className={`hover:bg-[#F9F9F9] ${isOverdue ? 'bg-[#FFF3CD]' : ''}`}>
                        <td className="p-3">
                          <div className="uppercase line-clamp-1">{s.name}</div>
                          <div className="text-[10px] font-mono opacity-60 mt-0.5">{s.rollNo}</div>
                        </td>
                        <td className="p-3 uppercase text-[10px] md:text-xs">
                          {s.branch.slice(0,10)}.
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                             <span>{days} Days</span>
                             {isOverdue && <span className="bg-[#D02020] text-white text-[10px] px-1.5 py-0.5 tracking-widest">OVERDUE</span>}
                          </div>
                        </td>
                        <td className="p-3 text-center text-[10px] uppercase tracking-widest">
                          {allClear ? (
                            <span className="bg-[#121212] text-white px-2 py-1">All Returned</span>
                          ) : (
                            <span className="bg-[#D02020] text-white px-2 py-1 flex items-center justify-center gap-1 w-max mx-auto">
                              Items Pending
                            </span>
                          )}
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <button onClick={() => navigate(`/lab/review/${s.id}`)} className="px-3 py-1.5 border-2 border-[#121212] font-black uppercase tracking-widest text-[10px] hover:bg-[#121212] hover:text-white transition-colors whitespace-nowrap">
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                 }) : (
                   <tr>
                     <td colSpan={5} className="p-8 text-center bg-[#F0F0F0]">
                       <CheckCircle2 className="w-10 h-10 mx-auto opacity-20 mb-2" />
                       <p className="uppercase tracking-widest text-xs opacity-50">Queue is empty</p>
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

        <div className="space-y-4 flex flex-col">
          <h2 className="font-black text-2xl uppercase tracking-tighter">Recent Activity</h2>
          <div className="flex-1 border-4 border-[#121212] bg-[#F9F9F9] shadow-[4px_4px_0px_0px_#121212] p-4 flex flex-col gap-4 overflow-y-auto max-h-[400px]">
             {activities.slice(0,5).map(act => (
               <div key={act.id} className="flex gap-3 justify-center">
                 <div className="mt-1 shrink-0">
                    {act.type === 'approved' && <CheckCircle2 className="w-5 h-5 text-[#1040C0]" />}
                    {act.type === 'flagged' && <AlertCircle className="w-5 h-5 text-[#D02020]" />}
                    {act.type === 'equipment' && <MonitorSmartphone className="w-5 h-5 text-[#121212]" />}
                    {act.type === 'submission' && <FileText className="w-5 h-5 text-[#121212]" />}
                    {act.type === 'nudge' && <Clock className="w-5 h-5 text-[#F0C020]" />}
                 </div>
                 <div className="flex flex-col gap-1">
                   <span className="font-bold text-xs uppercase tracking-widest">{act.title}</span>
                   <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{format(new Date(act.timestamp), 'MMM dd, HH:mm')}</span>
                 </div>
               </div>
             ))}
             {activities.length === 0 && <div className="m-auto text-[10px] font-black uppercase tracking-widest opacity-30 text-center">No recent activity</div>}
          </div>
        </div>

      </div>

    </div>
  );
}
