import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Link } from 'react-router';
import { format } from 'date-fns';
import { 
  Users, UploadCloud, FileBadge, BarChart2,
  CheckCircle2, AlertTriangle, ArrowRight, Activity
} from 'lucide-react';

export function Dashboard() {
  const { profile, settings, students, authorities } = useAdmin();

  // Mock macro metrics matching user prompt
  const stats = [
    { label: 'Total Students', value: 1248 },
    { label: 'Pending Clearances', value: 87 },
    { label: 'Certificates Issued', value: 312 },
    { label: 'Authorities Online', value: authorities.filter(a=>a.isOnline).length }
  ];

  const pendingStudents = students.filter(s => s.certStatus !== 'Already Issued');

  const activities = [
    { text: 'Certificate NXR-3112 Issued', time: '10m ago', type: 'cert' },
    { text: 'CSV Upload: library_dues_june.csv', time: '1h ago', type: 'system' },
    { text: 'Student Rohan Patil blocked (Library)', time: '3h ago', type: 'alert' },
    { text: 'Prof. Sharma approved 12 applications', time: '5h ago', type: 'auth' },
    { text: 'Payment RC-822 received for Temp Dues', time: '1d ago', type: 'pay' },
    { text: 'Automated nudge sent to 3 authorities', time: '1d ago', type: 'system' }
  ];

  const actions = [
    { title: 'Manage Students', path: '/admin/students', icon: <Users className="w-8 h-8 mb-4" /> },
    { title: 'Upload CSV', path: '/admin/csv', icon: <UploadCloud className="w-8 h-8 mb-4" /> },
    { title: 'Generate Certificate', path: '/admin/certificates', icon: <FileBadge className="w-8 h-8 mb-4" /> },
    { title: 'View Reports', path: '/admin/reports', icon: <BarChart2 className="w-8 h-8 mb-4" /> }
  ];

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10">
      
      {/* Welcome Strip */}
      <div className="flex flex-col gap-2 border-b-4 border-[#121212] pb-6">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter">Welcome back, {profile.name.split(' ')[0]}</h1>
          <span className="font-bold text-xs uppercase tracking-widest bg-[#121212] text-white px-3 py-1.5">{format(new Date(), 'MMM dd, yyyy')}</span>
        </div>
        <p className="font-black opacity-40 uppercase tracking-widest text-sm">System overview for today.</p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
         {stats.map((s, i) => (
           <div key={i} className="border-4 border-[#121212] shadow-[4px_4px_0px_0px_#121212] bg-white p-5 flex flex-col">
              <p className="font-black text-4xl tracking-tighter mb-1">{s.value}</p>
              <p className="text-xs font-black uppercase tracking-widest opacity-60 mt-auto">{s.label}</p>
           </div>
         ))}
      </div>

      {/* System Health Strip */}
      <div className="flex flex-wrap gap-4 items-center">
         <span className="font-black uppercase tracking-tight text-sm mr-2 flex items-center gap-2"><Activity className="w-4 h-4" /> System Health:</span>
         <HealthPill label="Database" active={settings.databaseOnline} />
         <HealthPill label="Email Nudge" active={settings.emailNudgeActive} />
         <HealthPill label="Payment Gateway" active={settings.paymentGatewayActive} />
         <HealthPill label="QR Service" active={settings.qrServiceOnline} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
         
         {/* Pending Table Main */}
         <div className="xl:col-span-2 flex flex-col gap-6">
            <h2 className="font-black text-2xl uppercase tracking-tighter">Pending Clearances</h2>
            <div className="border-4 border-[#121212] bg-white shadow-[8px_8px_0px_0px_#121212] overflow-x-auto">
               <table className="w-full text-left min-w-[700px] border-collapse">
                 <thead>
                   <tr className="bg-[#121212] text-white">
                      <th className="p-4 font-black text-xs uppercase tracking-widest">Student Name</th>
                      <th className="p-4 font-black text-xs uppercase tracking-widest">Roll No</th>
                      <th className="p-4 font-black text-xs uppercase tracking-widest">Branch</th>
                      <th className="p-4 font-black text-xs uppercase tracking-widest text-center">Days Waiting</th>
                      <th className="p-4 font-black text-xs uppercase tracking-widest text-right pr-6">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y-2 divide-[#121212]">
                   {pendingStudents.slice(0, 5).map(s => {
                     // Calculate fake days waiting from lastUpdated of the pending department
                     const pendingDepts = s.departments.filter(d => d.status === 'Pending');
                     const daysWaiting = pendingDepts.length ? Math.floor(Math.random() * 5) : 0;
                     const isStale = daysWaiting > 2;

                     return (
                       <tr key={s.id} className={`${isStale ? 'bg-[#FFF3CD]' : 'hover:bg-[#F9F9F9]'} transition-colors`}>
                         <td className="p-4 font-black tracking-tight">{s.name}</td>
                         <td className="p-4 font-mono text-sm uppercase">{s.rollNo}</td>
                         <td className="p-4 font-bold text-xs uppercase tracking-widest opacity-80">{s.branch}</td>
                         <td className="p-4 text-center">
                            {daysWaiting === 0 ? '-' : <span className={`font-black text-sm ${isStale ? 'text-[#D02020]' : ''}`}>{daysWaiting}d</span>}
                         </td>
                         <td className="p-4 pr-6 text-right">
                           <Link 
                             to={`/admin/students/${s.id}`}
                             className="border-2 border-[#121212] font-black text-xs uppercase tracking-widest px-3 py-1.5 hover:bg-[#121212] hover:text-white transition-colors"
                           >
                             View
                           </Link>
                         </td>
                       </tr>
                     )
                   })}
                 </tbody>
               </table>
            </div>
            
            {/* Quick Actions Array */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {actions.map((act, i) => (
                <Link 
                  key={i}
                  to={act.path}
                  className="border-4 border-[#121212] shadow-[4px_4px_0px_0px_#121212] bg-white p-5 flex flex-col items-center justify-center text-center hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#F0C020] transition-all group"
                >
                   <div className="group-hover:scale-110 transition-transform text-[#1040C0]">{act.icon}</div>
                   <span className="font-black text-xs uppercase tracking-widest">{act.title}</span>
                </Link>
              ))}
            </div>

         </div>

         {/* Activity Sidebar */}
         <div className="xl:col-span-1 border-4 border-[#121212] bg-[#121212] text-white p-6 shadow-[8px_8px_0px_0px_#F0C020] flex flex-col">
            <h2 className="font-black text-2xl uppercase tracking-tighter mb-8 text-[#F0C020]">Recent Activity</h2>
            <div className="flex-1 flex flex-col gap-6 ml-4 border-l-2 border-white/20 pl-6 py-2 relative">
               {activities.map((act, i) => (
                 <div key={i} className="relative">
                    <div className={`absolute -left-[31px] top-1 w-3 h-3 border-2 border-white ${act.type === 'alert' ? 'bg-[#D02020]' : act.type === 'cert' ? 'bg-[#F0C020]' : 'bg-[#1040C0]'}`} />
                    <p className="font-bold text-sm mb-1">{act.text}</p>
                    <p className="font-bold text-[10px] uppercase tracking-widest opacity-50">{act.time}</p>
                 </div>
               ))}
            </div>
            <Link to="/admin/reports" className="mt-8 font-black text-xs uppercase tracking-widest text-[#F0C020] hover:text-white flex items-center gap-2">
              Full System Log <ArrowRight className="w-3 h-3" />
            </Link>
         </div>

      </div>

    </div>
  );
}

function HealthPill({label, active}: {label: string, active: boolean}) {
  return (
    <div className={`border-2 border-[#121212] px-3 py-1 text-[10px] font-black uppercase tracking-widest ${active ? 'bg-[#1040C0] text-white' : 'bg-[#D02020] text-white'}`}>
       {label}: {active ? 'Online' : 'Offline'}
    </div>
  )
}
