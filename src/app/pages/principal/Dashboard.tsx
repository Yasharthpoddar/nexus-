import React from 'react';
import { usePrincipal } from '../../context/PrincipalContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router'; 
import { 
  Clock, CheckCircle, AlertTriangle, ChevronRight, 
  Activity, ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';

export function Dashboard() {
  const { profile, pendingApps, reviewedApps } = usePrincipal();
  const { currentUser } = useAuth();
  const basePath = `/principal`;

  const totalPending = pendingApps.length;
  // Let's pretend anything solved today checks the date. Since mock data generates right now we can just assume 5:
  const approvedToday = reviewedApps.filter(a => a.status === 'Approved').length; 
  const flags = reviewedApps.filter(a => a.status === 'Flagged').length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      
      {/* Welcome Bar */}
      <div className="bg-[#121212] text-white p-6 md:p-8 flex items-center justify-between border-b-8 border-[#1040C0]">
        <div>
           <p className="font-bold text-xs uppercase tracking-widest opacity-70 mb-2">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
           <h2 className="font-black text-3xl md:text-4xl uppercase tracking-tight">Welcome back, {profile.name.split(' ')[1] || profile.name} 👋</h2>
           <p className="font-medium text-lg opacity-90 mt-2">You have <span className="font-black text-[#F0C020]">{totalPending}</span> applications waiting for review.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Pending Review" value={totalPending.toString()} icon={<Clock />} color="text-[#121212]" bg="bg-white" />
        <StatCard title="Approved Today" value={approvedToday.toString()} icon={<CheckCircle />} color="text-[#1040C0]" bg="bg-white" />
        <StatCard title="Flagged / Rejected" value={flags.toString()} icon={<AlertTriangle />} color="text-[#D02020]" bg="bg-white" />
        <StatCard title="Avg Review Time" value="1.4d" icon={<Activity />} color="text-[#121212]" bg="bg-[#F0C020]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Main Queue Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b-4 border-[#121212] pb-4">
             <h3 className="font-black text-2xl uppercase tracking-tight">Priority Queue</h3>
             <Link to={`${basePath}/pending`} className="font-bold text-xs uppercase tracking-widest text-[#1040C0] hover:underline flex items-center gap-1">
               View All <ArrowUpRight className="w-4 h-4" />
             </Link>
          </div>

          <div className="space-y-4">
             {pendingApps.slice(0, 5).map((app) => {
               const isStale = app.daysWaiting >= 2;
               return (
                 <div key={app.id} className={`bg-white border-2 hover:border-[#121212] transition-colors p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
                   isStale ? 'border-l-8 border-l-[#D02020] border-[#D02020]/20 bg-[#D02020]/5' : 'border-[#121212]'
                 }`}>
                   <div className="flex-1 flex flex-col">
                     <div className="flex items-center gap-3 mb-1">
                        <span className="font-black text-lg uppercase tracking-tight leading-none">{app.studentName}</span>
                        {isStale && <span className="px-2 py-0.5 bg-[#D02020] text-white text-[10px] font-bold uppercase tracking-widest" title="An automated email nudge has been sent to you.">Overdue</span>}
                     </div>
                     <p className="font-bold text-xs uppercase tracking-widest opacity-60 mb-2">{app.rollNo} • {app.branch} '{app.batch.substring(2)}</p>
                     <p className={`text-xs font-semibold ${isStale ? 'text-[#D02020]' : 'text-gray-500'}`}>
                        Submitted: {format(new Date(app.submissionDate), 'MMM d')} <span className="opacity-50">({app.daysWaiting} days ago)</span>
                     </p>
                   </div>
                   
                   <Link 
                     to={`${basePath}/review/${app.id}`}
                     className="shrink-0 px-6 py-3 bg-[#121212] text-white font-black uppercase text-xs tracking-widest text-center hover:bg-[#1040C0] transition-colors flex items-center justify-center gap-2"
                   >
                     Review <ChevronRight className="w-4 h-4" />
                   </Link>
                 </div>
               );
             })}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-10">
          
          {/* Quick visual distribution */}
          <div>
            <h3 className="font-black text-xl uppercase tracking-tight mb-6 flex items-center gap-2">
               <span className="w-3 h-3 bg-[#121212] inline-block" /> Queue Status
            </h3>
            <div className="bg-white border-4 border-[#121212] p-6 shadow-[4px_4px_0px_0px_#121212]">
               <div className="h-6 flex mb-6 border-2 border-[#121212]">
                 <div className="bg-[#121212]" style={{width: `${(totalPending/20)*100}%`}} title="Pending" />
                 <div className="bg-[#1040C0]" style={{width: `${(approvedToday/20)*100}%`}} title="Approved" />
                 <div className="bg-[#D02020]" style={{width: `${(flags/20)*100}%`}} title="Flagged" />
                 <div className="bg-[#F0F0F0] flex-1" />
               </div>
               <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest"><span className="flex items-center gap-2"><div className="w-3 h-3 bg-[#121212]" /> Pending</span> <span>{totalPending}</span></div>
                 <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest"><span className="flex items-center gap-2"><div className="w-3 h-3 bg-[#1040C0]" /> Approved</span> <span>{approvedToday}</span></div>
                 <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest opacity-50"><span className="flex items-center gap-2"><div className="w-3 h-3 bg-[#D02020]" /> Rejected</span> <span>{flags}</span></div>
               </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="font-black text-xl uppercase tracking-tight mb-6 flex items-center gap-2">
               <span className="w-3 h-3 bg-[#F0C020] inline-block" /> Recent Activity
            </h3>
            <div className="bg-transparent border-l-2 border-[#121212] ml-4 pl-6 space-y-8 py-2 relative">
               <ActivityItem msg="You approved Aisha Gupta's application" time="2h ago" type="approve" />
               <ActivityItem msg="Automated nudge sent for 2 stale applications" time="5h ago" type="system" />
               <ActivityItem msg="Karan Malhotra's application flagged" time="1 day ago" type="flag" />
               <ActivityItem msg="Priya Mehta submitted documents" time="1 day ago" type="submit" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function StatCard({title, value, icon, color, bg}: any) {
  return (
    <div className={`${bg} border-4 border-[#121212] p-5 flex flex-col shadow-[4px_4px_0px_0px_#121212]`}>
       <div className={`p-2 bg-white/50 border-2 border-[#121212] w-max mb-4 ${color}`}>
         {icon}
       </div>
       <p className="font-black text-3xl tracking-tight mb-1">{value}</p>
       <p className="font-bold text-[10px] uppercase tracking-widest opacity-70">{title}</p>
    </div>
  )
}

function ActivityItem({msg, time, type}: any) {
  let indicator = "bg-[#121212]";
  if(type === 'approve') indicator = "bg-[#1040C0]";
  if(type === 'flag') indicator = "bg-[#D02020]";
  if(type === 'system') indicator = "bg-[#F0C020]";

  return (
    <div className="relative">
       <div className={`absolute -left-[31px] top-1 w-3 h-3 border-2 border-[#121212] ${indicator}`} />
       <p className="font-bold text-sm leading-snug mb-1">{msg}</p>
       <p className="font-bold text-[10px] uppercase tracking-widest opacity-50">{time}</p>
    </div>
  )
}
