import React, { useState } from 'react';
import { Bell, Clock, FileText, CheckCircle2, ChevronDown } from 'lucide-react';
import { format, subHours, subDays } from 'date-fns';

export function Notifications() {
  const [activeTab, setActiveTab] = useState('All');
  
  const notifs = [
    { id: 1, type: 'Stale Alerts', title: 'Action Required: Hritani Joshi is overdue (>3 days)', time: subHours(new Date(), 2), read: false },
    { id: 2, type: 'HOD Updates', title: 'HOD finalized clearance for Priya Mehta. Application closed.', time: subHours(new Date(), 5), read: true },
    { id: 3, type: 'New Submissions', title: 'Arjun Nair submitted their clearance parameters for Lab.', time: subHours(new Date(), 10), read: false },
    { id: 4, type: 'System', title: 'System maintenance scheduled for Jun 10, 02:00 AM', time: subDays(new Date(), 1), read: true },
    { id: 5, type: 'HOD Updates', title: 'HOD dropped Rohan Patil back to Stage 1. Re-evaluation required.', time: subDays(new Date(), 2), read: false },
  ];

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-[#121212] pb-6">
        <div>
          <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter mb-2">Notification Router</h1>
        </div>
        <button className="text-xs font-black uppercase tracking-widest text-[#1040C0] hover:underline">Mark all as read</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {['All', 'New Submissions', 'Stale Alerts', 'HOD Updates', 'System'].map(t => (
           <button 
             key={t}
             onClick={() => setActiveTab(t)}
             className={`px-4 py-2 border-2 border-[#121212] font-black uppercase tracking-widest text-[10px] transition-colors ${activeTab === t ? 'bg-[#121212] text-white' : 'bg-white text-[#121212] hover:bg-[#F9F9F9]'}`}
           >
             {t}
           </button>
        ))}
      </div>

      <div className="flex flex-col space-y-4">
         {notifs.filter(n => activeTab === 'All' || n.type === activeTab).map(n => (
           <div key={n.id} className={`border-4 border-[#121212] bg-white p-5 flex items-start gap-4 transition-all shadow-[4px_4px_0px_#121212] ${!n.read ? 'border-l-8 border-l-[#1040C0]' : 'opacity-80'}`}>
              <div className="shrink-0 mt-1">
                 {n.type === 'Stale Alerts' && <Clock className="w-6 h-6 text-[#D02020]" />}
                 {n.type === 'HOD Updates' && <CheckCircle2 className="w-6 h-6 text-[#1040C0]" />}
                 {n.type === 'New Submissions' && <FileText className="w-6 h-6 text-[#121212]" />}
                 {n.type === 'System' && <Bell className="w-6 h-6 text-[#F0C020]" />}
              </div>
              <div className="flex-1">
                 <div className="flex items-center justify-between mb-2">
                   <span className="font-black text-[10px] uppercase tracking-widest bg-[#F9F9F9] border-2 border-[#121212] px-2 py-0.5">{n.type}</span>
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{format(n.time, 'MMM dd, HH:mm')}</span>
                 </div>
                 <p className="font-bold text-sm leading-snug">{n.title}</p>
                 {n.type === 'Stale Alerts' && (
                   <button className="mt-4 px-4 py-2 bg-[#121212] text-white font-black uppercase text-[10px] tracking-widest">Review Now</button>
                 )}
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
