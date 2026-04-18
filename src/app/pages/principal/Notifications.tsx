import React, { useState } from 'react';
import { usePrincipal } from '../../context/PrincipalContext';
import { AuthNotification } from '../../context/AuthorityContext';
import { Link, useNavigate } from 'react-router';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, FileInput, AlertTriangle, Link as LinkIcon, Settings, CheckCheck
} from 'lucide-react';

export function Notifications() {
  const { notifications, markNotificationRead, markAllRead } = usePrincipal();
  const [filter, setFilter] = useState<'All' | 'New Submissions' | 'Stale Alerts' | 'System'>('All');
  const navigate = useNavigate();

  const handleNotificationClick = (n: AuthNotification) => {
    if(!n.read) markNotificationRead(n.id);
    if(n.link) navigate(n.link);
  };

  const filtered = notifications.filter(n => {
     if(filter === 'All') return true;
     if(filter === 'New Submissions') return n.type === 'submission';
     if(filter === 'Stale Alerts') return n.type === 'stale';
     if(filter === 'System') return n.type === 'system' || n.type === 'chain';
     return true;
  });

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-[#121212] pb-6 gap-4">
        <div>
           <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tight mb-2">Notifications</h1>
           <p className="text-lg font-medium opacity-80">Track activity, system alerts, and overdue reviews.</p>
        </div>
        <button 
           onClick={markAllRead}
           className="font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#121212] hover:bg-[#F0C020] transition-colors shrink-0"
        >
           <CheckCheck className="w-4 h-4" /> Mark all read
        </button>
      </div>

      <div className="flex gap-4 border-b-2 border-[#E0E0E0] overflow-x-auto">
        {['All', 'New Submissions', 'Stale Alerts', 'System'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f as any)}
            className={`font-black uppercase text-sm tracking-widest pb-3 border-b-4 transition-colors whitespace-nowrap px-2 ${filter === f ? 'border-[#1040C0] text-[#1040C0]' : 'border-transparent opacity-50 hover:opacity-100'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
           <div className="text-center py-20 opacity-50 font-black uppercase text-xl">Queue Empty</div>
        ) : filtered.map(notif => {
           let Icon = Bell;
           let iColor = 'bg-gray-200 text-gray-600 border-gray-400';
           
           if(notif.type === 'submission') { Icon = FileInput; iColor = 'bg-[#1040C0]/10 text-[#1040C0] border-[#1040C0]'; }
           if(notif.type === 'stale') { Icon = AlertTriangle; iColor = 'bg-[#D02020]/10 text-[#D02020] border-[#D02020]'; }
           if(notif.type === 'chain') { Icon = LinkIcon; iColor = 'bg-green-100 text-green-700 border-green-700'; }
           if(notif.type === 'system') { Icon = Settings; iColor = 'bg-[#121212]/10 text-[#121212] border-[#121212]'; }

           return (
             <div 
               key={notif.id}
               onClick={() => handleNotificationClick(notif)}
               className={`bg-white border-2 p-5 flex flex-col md:flex-row gap-4 transition-all cursor-pointer hover:shadow-md ${
                 notif.read ? 'border-[#E0E0E0] opacity-80 hover:opacity-100' : 'border-[#121212] shadow-[4px_4px_0px_0px_#121212]'
               }`}
             >
               {!notif.read && <div className="absolute w-2 h-2 rounded-full bg-[#1040C0] -ml-2 mt-4" />}
               
               <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 ${iColor}`}>
                  <Icon className="w-5 h-5" />
               </div>
               
               <div className="flex-1">
                 <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-black uppercase tracking-tight text-lg ${!notif.read ? '' : 'opacity-80'}`}>{notif.title}</h3>
                    <span className="font-bold text-[10px] uppercase tracking-widest opacity-50 whitespace-nowrap">{formatDistanceToNow(new Date(notif.timestamp))} ago</span>
                 </div>
                 <p className="font-medium text-sm leading-relaxed max-w-2xl">{notif.description}</p>
                 
                 {notif.type === 'stale' && notif.link && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleNotificationClick(notif); }}
                      className="mt-4 px-6 py-2 bg-[#D02020] text-white font-black uppercase text-[10px] tracking-widest hover:bg-[#121212] transition-colors"
                    >
                      Review Now
                    </button>
                 )}
               </div>
             </div>
           )
        })}
      </div>

    </div>
  );
}
