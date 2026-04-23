import React, { useState } from 'react';
import { useNexus, Department } from '../../context/NexusContext';
import { Link, useNavigate } from 'react-router';
import { 
  Upload, 
  CreditCard, 
  WalletCards, 
  FileText, 
  ChevronRight,
  Clock,
  ArrowRight,
  Award,
  X
} from 'lucide-react';
import { format } from 'date-fns';

export function Dashboard() {
  const { profile, departments, notifications, documents, loading } = useNexus();
  const navigate = useNavigate();
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-8 border-[#F0F0F0] border-t-[#1040C0] rounded-full animate-spin"></div>
          <p className="font-black uppercase tracking-widest text-[#121212]">Initializing Nexus...</p>
        </div>
      </div>
    );
  }

  const isActiveApp = departments && departments.length > 0;
  
  // Audit B2: Cleared count calculated exactly as requested
  const clearedCount = isActiveApp ? departments.filter(d => d.status === 'Cleared').length : 0;
  const totalCount = isActiveApp ? departments.length : 6; // Default to 6 departments
  const progressPercent = totalCount > 0 ? Math.round((clearedCount / totalCount) * 100) : 0;
  
  // Audit B4: Certificate banner only when ALL 6 departments cleared
  const allCleared = isActiveApp && totalCount === 6 && departments.every(d => d.status === 'Cleared');

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Cleared': return 'bg-[#10A040] text-white'; // Audit B3: Green
      case 'Pending': return 'bg-[#F0C020] text-[#121212]'; // Audit B3: Yellow
      case 'Blocked': return 'bg-[#D02020] text-white'; // Audit B3: Red
      default: return 'bg-[#E0E0E0] text-[#121212]'; // Audit B3: Gray
    }
  };

  const getStatusDot = (status: string) => {
    switch(status) {
      case 'Cleared': return 'bg-[#1040C0]';
      case 'Pending': return 'bg-[#F0C020]';
      case 'Action Required': return 'bg-[#D02020]';
      default: return 'bg-[#121212]';
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 relative">
      {/* Detail Slide-in Panel */}
      {selectedDept && (
        <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white border-l-4 border-[#121212] shadow-[-8px_0px_0px_0px_rgba(0,0,0,0.1)] z-50 transform transition-transform p-6 flex flex-col">
          <div className="flex justify-between items-center mb-8 border-b-4 border-[#121212] pb-4">
            <h3 className="font-black text-2xl uppercase tracking-tight">{selectedDept.name} Detail</h3>
            <button onClick={() => setSelectedDept(null)} className="hover:bg-[#F0F0F0] p-2 border-2 border-transparent hover:border-[#121212] transition-colors rounded">
              <X className="w-6 h-6" strokeWidth={3} />
            </button>
          </div>
          
          <div className="space-y-6 flex-1">
            <div>
              <p className="font-bold text-xs uppercase tracking-widest opacity-60 mb-1">Status</p>
              <div className={`inline-flex items-center gap-2 px-3 py-1 font-bold text-sm uppercase tracking-wider border-2 border-[#121212] ${getStatusColor(selectedDept.status)}`}>
                <span className={`w-2 h-2 rounded-full bg-white`}></span>
                {selectedDept.status}
              </div>
            </div>
            
            <div>
              <p className="font-bold text-xs uppercase tracking-widest opacity-60 mb-1">Authority</p>
              <p className="font-bold text-lg">{selectedDept.authority}</p>
            </div>

            <div className="p-4 border-2 border-[#121212] bg-[#F0F0F0]">
              <p className="font-bold text-xs uppercase tracking-widest mb-2">Note from Authority</p>
              <p className="font-medium text-[#121212] leading-relaxed">"{selectedDept.note}"</p>
            </div>

            <div>
              <p className="font-bold text-xs uppercase tracking-widest opacity-60 mb-2">Suggested Action</p>
              {selectedDept.status === 'Action Required' && selectedDept.name === 'Library' && (
                <button onClick={() => { setSelectedDept(null); navigate('/payments'); }} className="w-full py-4 px-6 bg-[#D02020] text-white border-4 border-[#121212] font-black uppercase text-sm flex items-center justify-between hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#121212] transition-all">
                  <span>Pay Fine</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
              {selectedDept.status === 'Action Required' && selectedDept.name === 'Hostel' && (
                <button onClick={() => { setSelectedDept(null); navigate('/payments'); }} className="w-full py-4 px-6 bg-[#D02020] text-white border-4 border-[#121212] font-black uppercase text-sm flex items-center justify-between hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#121212] transition-all">
                  <span>Pay Repair Dues</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
              {selectedDept.status === 'Pending' && (
                <p className="text-sm italic font-medium opacity-70">No action needed. Awaiting authority sign-off.</p>
              )}
              {selectedDept.status === 'Cleared' && (
                <p className="text-sm italic font-medium text-[#1040C0]">Department successfully cleared.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dimmed Background Overlay when panel open */}
      {selectedDept && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSelectedDept(null)} />
      )}

      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-black text-3xl md:text-5xl tracking-tight mb-2 uppercase">
            Welcome back, {profile.name ? profile.name.split(' ')[0] : 'Student'} 👋
          </h1>
          <p className="text-lg font-medium opacity-80">
            {format(new Date(), 'EEEE, MMMM do, yyyy')} • Your graduation clearance is in progress.
          </p>
        </div>
      </div>

      {allCleared && (
        <div className="w-full bg-[#1040C0] text-white border-4 border-[#121212] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[8px_8px_0px_0px_#121212]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#F0C020] border-4 border-[#121212] rounded-full flex items-center justify-center flex-shrink-0">
              <Award className="w-8 h-8 text-[#121212]" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-black text-2xl uppercase tracking-tight">🎓 All departments cleared!</h2>
              <p className="font-medium mt-1">Your Digital No-Dues Certificate is ready to download.</p>
            </div>
          </div>
          <Link to="/locker" className="shrink-0">
            <button className="bg-[#F0C020] text-[#121212] px-8 py-4 border-4 border-[#121212] font-black uppercase tracking-wider hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#121212] transition-all">
              Download Certificate
            </button>
          </Link>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-white p-6 md:p-8 border-4 border-[#121212] shadow-[4px_4px_0px_0px_#121212]">
        <div className="flex items-center justify-between mb-4">
          <p className="font-black uppercase text-xl md:text-2xl tracking-tight">
            {clearedCount || 0} of {totalCount || 6} Departments
          </p>
          <span className="font-black text-3xl text-[#1040C0]">{progressPercent || 0}%</span>
        </div>
        <div className="h-8 md:h-10 w-full bg-[#E0E0E0] border-4 border-[#121212] relative overflow-hidden">
          <div 
            className="h-full bg-[#1040C0] border-r-4 border-[#121212] transition-all duration-1000 ease-out" 
            style={{ width: `${progressPercent}%` }} 
          />
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
        
        {/* Heatmap & Quick Actions */}
        <div className="lg:col-span-2 space-y-10">
          <div>
            <h2 className="font-black text-2xl uppercase mb-6 tracking-tight flex items-center gap-2">
              <span className="w-4 h-4 bg-[#D02020] inline-block border-2 border-[#121212]" />
              Current Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isActiveApp && (
                <div className="col-span-1 md:col-span-2 border-8 border-[#121212] p-10 bg-white shadow-[8px_8px_0px_0px_#121212] flex flex-col items-center justify-center text-center space-y-6">
                   <div className="w-20 h-20 bg-[#F0F0F0] border-4 border-[#121212] rounded-full flex items-center justify-center">
                      <FileText className="w-10 h-10 opacity-30" />
                   </div>
                   <div>
                     <h3 className="font-black text-2xl uppercase tracking-tight">No Active Application</h3>
                     <p className="font-bold opacity-60 uppercase text-xs tracking-widest mt-2">Start your graduation clearance process now</p>
                   </div>
                   <button 
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('nexus_token');
                        await axios.post('/api/applications/submit', {}, { headers: { Authorization: `Bearer ${token}` } });
                        window.location.reload();
                      } catch (err) {
                        alert('Failed to submit application. Please contact admin.');
                      }
                    }}
                    className="bg-[#1040C0] text-white px-10 py-5 border-4 border-[#121212] font-black uppercase tracking-wider hover:translate-y-[-4px] hover:shadow-[4px_4px_0px_0px_#121212] transition-all"
                   >
                     Submit New Application
                   </button>
                </div>
              )}

              {isActiveApp && departments.map((dept) => (
                <div 
                  key={`dept-${dept.id}`}
                  onClick={() => setSelectedDept(dept)}
                  className="bg-white border-2 border-[#121212] hover:border-4 hover:shadow-[4px_4px_0px_0px_#121212] transition-all cursor-pointer p-5 flex flex-col justify-between min-h-[140px]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-xl uppercase tracking-tight">{dept.name}</h3>
                      <p className="text-xs font-bold uppercase opacity-60 tracking-widest mt-1">{dept.authority}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-[#121212] flex items-center justify-center shrink-0">
                       <ChevronRight className="w-5 h-5 opacity-50" />
                    </div>
                  </div>
                  
                  <div>
                    <div className={`inline-flex items-center gap-2 px-2 py-0.5 border-2 border-[#121212] mb-2 font-bold text-[10px] uppercase tracking-wider ${getStatusColor(dept.status)}`}>
                        {dept.status}
                    </div>
                    <p className="text-sm font-medium line-clamp-1 opacity-80" title={dept.note}>{dept.note}</p>
                  </div>
                </div>
              ))}

              {documents.map((doc) => (
                <div 
                  key={`doc-${doc.id}`}
                  className="bg-white border-2 border-[#121212] hover:border-4 hover:shadow-[4px_4px_0px_0px_#121212] transition-all p-5 flex flex-col justify-between min-h-[140px]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-xl uppercase tracking-tight">{doc.name}</h3>
                      <p className="text-xs font-bold uppercase opacity-60 tracking-widest mt-1">Uploaded Document • {doc.type}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className={`inline-flex items-center gap-2 px-2 py-0.5 border-2 border-[#121212] mb-2 font-bold text-[10px] uppercase tracking-wider ${
                      doc.status === 'Verified' ? 'bg-[#1040C0] text-white' : 
                      doc.status === 'Rejected' ? 'bg-[#D02020] text-white' : 
                      'bg-[#F0C020] text-[#121212]'
                    }`}>
                        {doc.status}
                    </div>
                    <p className="text-sm font-medium line-clamp-1 opacity-80">Added on {doc.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-black text-2xl uppercase mb-6 tracking-tight flex items-center gap-2">
              <span className="w-4 h-4 bg-[#F0C020] inline-block border-2 border-[#121212]" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: 'Upload Docs', icon: Upload, path: '/documents', color: 'bg-white' },
                { title: 'Pay Dues', icon: CreditCard, path: '/payments', color: 'bg-[#F0C020]' },
                { title: 'Safe Locker', icon: WalletCards, path: '/locker', color: 'bg-[#1040C0] text-white' },
                { title: 'Track Status', icon: FileText, path: '/application', color: 'bg-white' },
              ].map((action, i) => (
                <Link key={i} to={action.path}>
                  <div className={`aspect-square border-4 border-[#121212] ${action.color} flex flex-col items-center justify-center p-4 hover:translate-y-[-4px] hover:shadow-[4px_4px_0px_0px_#121212] transition-all text-center`}>
                    <action.icon className="w-8 h-8 mb-3" strokeWidth={2.5} />
                    <span className="font-black text-sm uppercase tracking-wide leading-tight">{action.title}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity & Documents */}
        <div className="lg:col-span-1 space-y-8">
          {/* Documents Widget */}
          {documents && documents.length > 0 && (
            <div className="bg-white border-4 border-[#121212] shadow-[4px_4px_0px_0px_#121212]">
              <div className="bg-[#121212] text-white p-5 border-b-4 border-[#121212] flex justify-between items-center">
                <h2 className="font-black text-xl uppercase tracking-tight">Recent Docs</h2>
                <span className="font-bold text-sm bg-white text-[#121212] px-2 py-0.5 rounded-full">{documents.length}</span>
              </div>
              <div className="p-4 space-y-3">
                {documents.slice(0, 3).map((doc) => (
                  <div key={doc.id} className="p-3 border-2 border-[#121212] bg-[#F0F0F0] flex justify-between items-center hover:-translate-y-1 transition-all">
                    <div>
                      <p className="font-black uppercase tracking-tight text-sm">{doc.name}</p>
                      <p className="font-bold text-[10px] uppercase text-[#1040C0] tracking-widest">{doc.type}</p>
                    </div>
                    <span className="font-bold text-[10px] uppercase border border-[#121212] bg-white px-2 py-0.5">
                      {doc.status}
                    </span>
                  </div>
                ))}
                <Link to="/documents" className="block text-center font-bold text-xs uppercase tracking-widest text-[#1040C0] hover:underline pt-2">
                  View All Documents
                </Link>
              </div>
            </div>
          )}

          {/* Activity Widget */}
          <div className="bg-white border-4 border-[#121212] shadow-[4px_4px_0px_0px_#121212]">
            <div className="bg-[#121212] text-white p-5 border-b-4 border-[#121212]">
              <h2 className="font-black text-xl uppercase tracking-tight">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="relative border-l-4 border-[#E0E0E0] ml-4 md:ml-6 space-y-8">
                {notifications.slice(0, 5).map((noti, i) => (
                  <div key={noti.id} className="relative pl-6 md:pl-8">
                    <div className={`absolute -left-[14px] top-1 w-6 h-6 rounded-full border-4 border-[#121212] ${
                      noti.type === 'approval' ? 'bg-[#1040C0]' :
                      noti.type === 'rejection' ? 'bg-[#D02020]' :
                      noti.type === 'payment' ? 'bg-[#F0C020]' : 'bg-white'
                    }`} />
                    <p className="font-bold text-xs text-gray-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3" />
                      {noti.time !== 'Invalid Date' ? noti.time : '—'}
                    </p>
                    <p className="font-bold text-md leading-tight mb-1 text-[#121212]">{noti.title}</p>
                    <p className="text-sm font-medium opacity-80">{noti.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
