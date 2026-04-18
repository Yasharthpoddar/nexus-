import React, { useState } from 'react';
import { 
  Download, FileText, CheckCircle2 
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

export function Reports() {
  const [dateRange, setDateRange] = useState('This Month');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const stats = [
    { label: 'Total Applications', value: 3412 },
    { label: 'Cleared', value: 1845 },
    { label: 'Pending', value: 1202 },
    { label: 'Rejected', value: 365 },
    { label: 'Avg Clearance Time', value: '8.4d' },
    { label: 'Certificates Issued', value: 312 }
  ];

  const branchData = [
    { branch: 'Computer Science', total: 420, cleared: 380, pending: 30, blocked: 10, rate: 90 },
    { branch: 'Information Tech', total: 315, cleared: 270, pending: 40, blocked: 5, rate: 85 },
    { branch: 'Mechanical', total: 290, cleared: 150, pending: 120, blocked: 20, rate: 51 },
    { branch: 'Civil', total: 223, cleared: 180, pending: 33, blocked: 10, rate: 80 }
  ];

  const deptData = [
    { dept: 'Library', avgDays: 1.2, pending: 42, reqRate: '2%' },
    { dept: 'Laboratory', avgDays: 4.5, pending: 812, reqRate: '15%' },
    { dept: 'Accounts', avgDays: 0.5, pending: 12, reqRate: '1%' },
    { dept: 'HOD Computer Science', avgDays: 2.1, pending: 154, reqRate: '5%' },
    { dept: 'Sports', avgDays: 3.2, pending: 301, reqRate: '8%' },
    { dept: 'Hostel', avgDays: 5.8, pending: 412, reqRate: '22%' }
  ];

  const handleExport = (type: string) => {
    setToastMsg(`Export to ${type} prepared.`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10 pb-32">
       
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-[#121212] pb-6">
          <div>
            <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter mb-2">System Reports</h1>
            <p className="font-bold opacity-50 uppercase tracking-widest text-sm">Macro analytics covering volume and department-level bottlenecks.</p>
          </div>
          <div className="flex gap-2 bg-[#F9F9F9] border-4 border-[#121212] p-1">
             {['This Month', 'Last Month', 'Custom Range'].map(r => (
               <button 
                 key={r}
                 onClick={()=>setDateRange(r)}
                 className={`px-4 py-2 font-black uppercase text-[10px] tracking-widest transition-colors ${dateRange===r ? 'bg-[#121212] text-white shadow-inner' : 'hover:bg-[#E0E0E0]'}`}
               >
                 {r}
               </button>
             ))}
          </div>
       </div>

       {/* Six Stats */}
       <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {stats.map((s,i) => (
             <div key={i} className="border-4 border-[#121212] bg-white p-5 flex flex-col shadow-[4px_4px_0px_0px_#121212]">
                <p className="font-black text-3xl md:text-5xl tracking-tighter mb-1">{s.value}</p>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-60 mt-auto">{s.label}</p>
             </div>
          ))}
       </div>

       <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          
          {/* Branch Breakdown */}
          <div className="flex flex-col gap-4">
             <h2 className="font-black text-2xl uppercase tracking-tighter">Branch-wise Breakdown</h2>
             <div className="border-4 border-[#121212] bg-white shadow-[8px_8px_0px_0px_#121212] overflow-x-auto h-full">
                <table className="w-full text-left font-bold text-xs min-w-[600px]">
                  <thead className="bg-[#121212] text-white uppercase tracking-widest text-[10px]">
                    <tr><th className="p-4">Branch</th><th className="p-4">Total</th><th className="p-4">Cleared</th><th className="p-4">Pend/Block</th><th className="p-4">Completion</th></tr>
                  </thead>
                  <tbody className="divide-y-2 divide-[#121212]">
                     {branchData.map((b,i) => (
                       <tr key={i} className="hover:bg-[#F9F9F9]">
                          <td className="p-4 uppercase">{b.branch}</td>
                          <td className="p-4">{b.total}</td>
                          <td className="p-4">{b.cleared}</td>
                          <td className="p-4 text-[#D02020]">{b.pending} / {b.blocked}</td>
                          <td className="p-4">
                             <div className="flex items-center gap-3">
                                <div className="flex-1 h-3 bg-[#E0E0E0] border-2 border-[#121212] w-24 overflow-hidden relative">
                                   <div className="absolute top-0 left-0 bottom-0 bg-[#121212]" style={{ width: `${b.rate}%` }} />
                                </div>
                                <span className="font-black text-[10px] uppercase">{b.rate}%</span>
                             </div>
                          </td>
                       </tr>
                     ))}
                  </tbody>
                </table>
             </div>
          </div>

          {/* Department Bottlenecks */}
          <div className="flex flex-col gap-4">
             <h2 className="font-black text-2xl uppercase tracking-tighter">Departmental Bottlenecks</h2>
             <div className="border-4 border-[#121212] bg-white shadow-[8px_8px_0px_0px_#121212] overflow-x-auto h-full">
                <table className="w-full text-left font-bold text-xs min-w-[500px]">
                   <thead className="bg-[#121212] text-white uppercase tracking-widest text-[10px]">
                     <tr><th className="p-4">Department</th><th className="p-4">Average TTL</th><th className="p-4">Vol. Pending</th><th className="p-4">Rejection Rate</th></tr>
                   </thead>
                   <tbody className="divide-y-2 divide-[#121212]">
                      {deptData.map((d,i) => (
                        <tr key={i} className={d.avgDays > 3 ? 'bg-[#FFF3CD]' : 'hover:bg-[#F9F9F9]'}>
                           <td className="p-4 uppercase">{d.dept}</td>
                           <td className={`p-4 font-black text-sm ${d.avgDays > 3 ? 'text-[#D02020]' : ''}`}>{d.avgDays}d</td>
                           <td className="p-4">{d.pending}</td>
                           <td className="p-4">{d.reqRate}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
       </div>

       {/* Export Row */}
       <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t-4 border-[#121212]">
          <button onClick={()=>handleExport('CSV')} className="flex-1 bg-white border-4 border-[#121212] shadow-[4px_4px_0px_0px_#121212] p-6 font-black uppercase text-sm flex items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#121212] transition-all">
             <FileText className="w-6 h-6" /> Export Master CSV
          </button>
          <button onClick={()=>handleExport('PDF')} className="flex-1 bg-[#121212] text-white border-4 border-[#121212] shadow-[4px_4px_0px_0px_#F0C020] p-6 font-black uppercase text-sm flex items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#F0C020] transition-all">
             <Download className="w-6 h-6" /> Export PDF Summary
          </button>
       </div>

       <Toast message={toastMsg} visible={showToast} />
    </div>
  );
}
