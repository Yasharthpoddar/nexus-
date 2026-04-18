import React, { useState } from 'react';
import { usePrincipal } from '../../context/PrincipalContext';
import { Download, Calendar, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';

export function Reports() {
  const { reviewedApps, pendingApps } = usePrincipal();
  const [range, setRange] = useState('This Month');

  const totalProcessed = reviewedApps.length;
  const approved = reviewedApps.filter(a => a.status === 'Approved').length;
  const rejected = reviewedApps.filter(a => a.status === 'Flagged').length;
  const totalReceived = totalProcessed + pendingApps.length;

  const mockChartData = [
    { week: 'Week 1', received: 45, approved: 30 },
    { week: 'Week 2', received: 60, approved: 55 },
    { week: 'Week 3', received: 35, approved: 40 },
    { week: 'Week 4', received: 80, approved: 65 },
  ];
  
  const maxVal = 100;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-[#121212] pb-6 gap-4">
        <div>
           <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tight mb-2">Department Reports</h1>
           <p className="text-lg font-medium opacity-80">Analytics and clearance performance for Computer Science.</p>
        </div>
        <div className="flex items-center gap-4">
           <select 
              value={range} 
              onChange={e => setRange(e.target.value)}
              className="p-3 border-2 border-[#121212] font-bold uppercase text-xs tracking-widest outline-none bg-white focus:border-[#1040C0]"
           >
              <option>This Month</option>
              <option>Last Month</option>
              <option>Current Semester</option>
           </select>
           <button 
             onClick={() => alert('Report exported as CSV.')}
             className="font-black uppercase text-xs tracking-widest flex items-center gap-2 px-6 py-3.5 bg-[#121212] text-white border-2 border-[#121212] hover:bg-[#1040C0] hover:border-[#1040C0] transition-colors"
           >
             <Download className="w-4 h-4" /> Export CSV
           </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <StatBox title="Total Received" val={totalReceived} />
         <StatBox title="Total Approved" val={approved} />
         <StatBox title="Total Flagged" val={rejected} />
         <StatBox title="Avg Decision Time" val="1.4 days" />
      </div>

      {/* Bar Chart Mock */}
      <div className="bg-white border-4 border-[#121212] shadow-[8px_8px_0px_0px_#121212] p-8">
         <h2 className="font-black text-xl uppercase tracking-tight mb-8 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-[#1040C0]" /> Applications Volume
         </h2>
         
         <div className="flex flex-col h-[300px]">
           {/* y-axis lines mock */}
           <div className="relative flex-1 border-l-4 border-b-4 border-[#121212] flex items-end justify-around pb-0">
             
             {/* grid lines */}
             <div className="absolute w-full border-t-2 border-dashed border-[#E0E0E0] bottom-[25%]" />
             <div className="absolute w-full border-t-2 border-dashed border-[#E0E0E0] bottom-[50%]" />
             <div className="absolute w-full border-t-2 border-dashed border-[#E0E0E0] bottom-[75%]" />
             
             {mockChartData.map((d, i) => (
               <div key={i} className="relative z-10 flex gap-2 items-end h-full w-[15%] group">
                  <div 
                    className="w-1/2 bg-[#121212] hover:opacity-80 transition-opacity" 
                    style={{height: `${(d.received/maxVal)*100}%`}} 
                    title={`Received: ${d.received}`}
                  />
                  <div 
                    className="w-1/2 bg-[#1040C0] hover:opacity-80 transition-opacity" 
                    style={{height: `${(d.approved/maxVal)*100}%`}} 
                    title={`Approved: ${d.approved}`}
                  />
               </div>
             ))}
           </div>
           
           {/* x-axis labels */}
           <div className="flex justify-around pt-4 uppercase font-bold text-[10px] tracking-widest opacity-60">
             {mockChartData.map((d, i) => <span key={i}>{d.week}</span>)}
           </div>
         </div>
         
         <div className="flex justify-center gap-8 mt-6">
            <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><div className="w-3 h-3 bg-[#121212]"/> Received</div>
            <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"><div className="w-3 h-3 bg-[#1040C0]"/> Approved</div>
         </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border-4 border-[#121212] overflow-x-auto">
         <div className="p-6 border-b-4 border-[#121212] bg-[#F9F9F9]">
           <h3 className="font-black text-lg uppercase tracking-tight text-[#121212]">Student Breakdown</h3>
         </div>
         <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-[#121212] text-white">
                 <th className="p-4 font-bold text-[10px] uppercase tracking-widest pl-6">Student</th>
                 <th className="p-4 font-bold text-[10px] uppercase tracking-widest">Submitted</th>
                 <th className="p-4 font-bold text-[10px] uppercase tracking-widest">Decision</th>
                 <th className="p-4 font-bold text-[10px] uppercase tracking-widest">Time Taken</th>
                 <th className="p-4 font-bold text-[10px] uppercase tracking-widest">Comment Length</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#121212]">
               {reviewedApps.map((app) => (
                 <tr key={app.id} className="hover:bg-[#F0F0F0]">
                    <td className="p-4 pl-6">
                       <p className="font-bold uppercase">{app.studentName}</p>
                       <p className="font-mono text-xs opacity-50">{app.rollNo}</p>
                    </td>
                    <td className="p-4 font-mono text-xs">{format(new Date(app.submissionDate), 'dd/MM/yyyy')}</td>
                    <td className="p-4 font-bold text-[10px] uppercase tracking-widest">
                       <span className={app.status === 'Approved' ? 'text-[#1040C0]' : 'text-[#D02020]'}>{app.status}</span>
                    </td>
                    <td className="p-4 font-medium text-sm">~ 2 days</td>
                    <td className="p-4 font-medium text-sm opacity-60">{app.decisionComment ? app.decisionComment.length + ' chars' : 'None'}</td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>

    </div>
  );
}

function StatBox({title, val}: {title: string, val: string | number}) {
  return (
    <div className="bg-white border-4 border-[#121212] p-6 shadow-[4px_4px_0px_0px_#121212]">
      <p className="font-black text-3xl md:text-5xl tracking-tight mb-2 leading-none">{val}</p>
      <p className="font-bold text-[10px] uppercase tracking-widest opacity-60">{title}</p>
    </div>
  )
}
