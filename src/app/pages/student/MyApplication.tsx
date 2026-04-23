import React, { useState } from 'react';
import { useNexus, Department } from '../../context/NexusContext';
import { 
  CheckCircle, 
  Circle, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Send,
  X,
  Paperclip,
  Flame
} from 'lucide-react';
import { safeDate, safeID } from '../../utils/formatters';

export function MyApplication() {
  const { profile, departments, application, notifications, documents, dues } = useNexus();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [respondModal, setRespondModal] = useState<Department | null>(null);

  // Derive global application states
  const libStatus  = departments.find(d => d.id === 'lib')?.status;
  const labStatus  = departments.find(d => d.id === 'lab')?.status;
  const hodStatus  = departments.find(d => d.id === 'hod')?.status;
  const prinStatus = departments.find(d => d.id === 'prin')?.status;

  const steps = [
    { 
      label: 'Submitted', 
      status: application ? 'Completed' : 'Pending', 
      date: safeDate(application?.created_at), 
      person: profile.name 
    },
    { 
      label: 'Laboratory', 
      status: labStatus === 'Cleared' ? 'Completed' : application ? 'In Progress' : 'Pending', 
      date: labStatus === 'Cleared' ? safeDate(departments.find(d => d.id === 'lab')?.lastUpdated) : '-', 
      person: 'Lab Authority' 
    },
    { 
      label: 'Library', 
      status: libStatus === 'Cleared' ? 'Completed' : labStatus === 'Cleared' ? 'In Progress' : 'Pending', 
      date: libStatus === 'Cleared' ? safeDate(departments.find(d => d.id === 'lib')?.lastUpdated) : '-', 
      person: 'Librarian' 
    },
    { 
      label: 'HOD', 
      status: hodStatus === 'Cleared' ? 'Completed' : libStatus === 'Cleared' ? 'In Progress' : 'Pending', 
      date: hodStatus === 'Cleared' ? safeDate(departments.find(d => d.id === 'hod')?.lastUpdated) : '-', 
      person: 'Dept. Head' 
    },
    { 
      label: 'Principal', 
      status: prinStatus === 'Cleared' ? 'Completed' : hodStatus === 'Cleared' ? 'In Progress' : 'Pending', 
      date: prinStatus === 'Cleared' ? safeDate(departments.find(d => d.id === 'prin')?.lastUpdated) : '-', 
      person: 'Principal' 
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'Cleared') return <span className="inline-block px-3 py-1 bg-[#1040C0] text-white font-bold text-xs uppercase tracking-wider border-2 border-[#121212]">Cleared</span>;
    if (status === 'Pending') return <span className="inline-block px-3 py-1 bg-[#F0C020] text-[#121212] font-bold text-xs uppercase tracking-wider border-2 border-[#121212]">Pending</span>;
    if (status === 'Action Required') return <span className="inline-block px-3 py-1 bg-[#D02020] text-white font-bold text-xs uppercase tracking-wider border-2 border-[#121212]">Action Reqd</span>;
    return <span className="inline-block px-3 py-1 bg-[#E0E0E0] text-[#121212] font-bold text-xs uppercase tracking-wider border-2 border-[#121212]">Unknown</span>;
  };

  const handleRespondSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Response submitted to ${respondModal?.name}`);
    setRespondModal(null);
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">
      
      {/* Page Header */}
      <div>
        <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tight mb-2">Track Application</h1>
        <p className="text-lg font-medium opacity-80">
          Application ID: {application?.id ? `NX-${safeID(application.id)}` : 'NX-PENDING'}
        </p>
      </div>

      {/* Stepper */}
      <div className="bg-white border-4 border-[#121212] p-6 md:p-8 shadow-[4px_4px_0px_0px_#121212]">
        <h2 className="font-black text-xl uppercase tracking-tight mb-8">Chain of Approval</h2>
        
        <div className="relative">
          <div className="absolute top-5 left-8 right-8 h-2 bg-[#E0E0E0] border-y-2 border-[#121212] hidden md:block" />
          <div className="flex flex-col md:flex-row justify-between relative gap-8 md:gap-0">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-row md:flex-col items-center md:w-1/4 relative z-10 gap-4 md:gap-3">
                <div className={`w-12 h-12 rounded-full border-4 border-[#121212] flex items-center justify-center shrink-0 transition-colors ${
                  step.status === 'Completed' ? 'bg-[#1040C0] text-white' :
                  step.status === 'In Progress' ? 'bg-[#F0C020] text-[#121212]' : 'bg-white text-[#E0E0E0]'
                }`}>
                  {step.status === 'Completed' ? <CheckCircle className="w-6 h-6" /> : 
                   step.status === 'In Progress' ? <Circle className="w-6 h-6 animate-pulse" /> : 
                   <Circle className="w-6 h-6 opacity-30" />}
                </div>
                <div className="text-left md:text-center">
                  <p className={`font-black uppercase tracking-tight text-sm md:text-base leading-tight mb-1 ${step.status === 'Completed' ? 'text-[#1040C0]' : step.status === 'In Progress' ? 'text-[#121212]' : 'text-gray-400'}`}>{step.label}</p>
                  <p className="font-bold text-[10px] uppercase tracking-widest opacity-60 bg-[#F0F0F0] inline-block px-1 mb-1">{step.status}</p>
                  <p className="text-sm font-medium opacity-80">{step.person}</p>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">{step.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* ── CLEARANCE HEATMAP ─────────────────────────────────────────────── */}
      {(() => {
        // Column metrics — the "variables" measured per department
        const METRICS = ['Documents', 'Dues', 'Equipment', 'Verification', 'Clearance'];

        // Map status → base score 0-4  (drives colour intensity)
        const baseScore = (status: string) =>
          status === 'Cleared'         ? 4 :
          status === 'Action Required' ? 0 :
          2; // Pending

        // Generate live cell values based on concrete application data metrics mapped directly from the backend context
        const seeded = (dept: typeof departments[0], colIndex: number): number => {
          const metricStr = METRICS[colIndex];
          
          // Dues Metric: Checks global `dues` tracking list against the specific departmental ID
          if (metricStr === 'Dues') {
            const hasPendingDue = dues?.some(d => 
              d.department.toLowerCase() === dept.name.toLowerCase() && 
              d.status !== 'Paid'
            );
            return hasPendingDue ? 0 : 4; 
          }
          
          // Documents Metric: Maps global document vault verified statuses into the structural score
          if (metricStr === 'Documents') {
            const hasDocProblem = documents?.some(d => d.status === 'Rejected');
            const allDocsVerified = documents?.length > 0 && documents.every(d => d.status === 'Verified');
            if (hasDocProblem) return 0;
            if (allDocsVerified) return 4;
            return documents?.length > 0 ? 2 : 1; 
          }
          
          // Equipment Metric: Restricts heavy evaluation weighting to lab and sports authority figures
          if (metricStr === 'Equipment') {
            if (dept.name.toLowerCase().includes('lab') || dept.name.toLowerCase().includes('sport')) {
               return dept.status === 'Cleared' ? 4 : dept.status === 'Action Required' ? 0 : 2;
            }
            return 4; // Not applicable gets full pass score
          }
          
          // Baseline evaluations pass directly through departmental status boundaries
          return dept.status === 'Cleared' ? 4 : dept.status === 'Action Required' ? 0 : 2;
        };

        // Colour ramp: 0=red, 2=yellow, 4=green (matches reference image)
        const cellColor = (val: number): string => {
          if (val <= 1)   return `rgba(${200 + val * 20},${60  + val * 60},20,1)`;   // red → orange
          if (val <= 2)   return `rgba(220,${140 + (val-1)*60},20,1)`;              // orange → yellow
          if (val <= 3)   return `rgba(${200 - (val-2)*80},${180 + (val-2)*30},40,1)`; // yellow → light-green
          return              `rgba(30,${130 + (val-3)*60},50,1)`;                  // green
        };

        // Generate structural rows if application isn't submitted yet. 
        // This acts as a projection grid to map live Document/Dues status before submission.
        const activeDepartments = departments && departments.length > 0 ? departments : [
          { id: 'lib', name: 'Library', authority: 'Librarian', status: 'Pending', note: '', lastUpdated: '' },
          { id: 'hostel', name: 'Hostel', authority: 'Warden', status: 'Pending', note: '', lastUpdated: '' },
          { id: 'acc', name: 'Accounts', authority: 'Accountant', status: 'Pending', note: '', lastUpdated: '' },
          { id: 'sports', name: 'Sports', authority: 'Director', status: 'Pending', note: '', lastUpdated: '' },
          { id: 'lab', name: 'Laboratory', authority: 'Lab In-charge', status: 'Pending', note: '', lastUpdated: '' },
          { id: 'place', name: 'Placement', authority: 'Placement Officer', status: 'Pending', note: '', lastUpdated: '' },
        ];

        const totalCleared = activeDepartments.filter(d => d.status === 'Cleared').length;
        const totalDept = activeDepartments.length;
        const pct = totalDept ? Math.round(totalCleared / totalDept * 100) : 0;

        return (
          <div className="bg-white border-4 border-[#121212] shadow-[4px_4px_0px_0px_#121212] overflow-hidden flex flex-col min-h-[300px]">
            {/* Header */}
            <div className="bg-[#121212] text-white p-5 border-b-4 border-[#121212] flex items-center justify-between shrink-0">
              <h2 className="font-black text-xl uppercase tracking-tight flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#F0C020]" /> Clearance Heatmap
              </h2>
              <span className="font-mono text-sm opacity-70">
                {(!departments || departments.length === 0) ? 'PRE-SUBMISSION TRACKING' : `${totalCleared} / ${totalDept} cleared`}
              </span>
            </div>

            <div className="p-6 md:p-8 flex-1">
                {/* Progress strip */}
                <div className="flex items-center gap-4 mb-8">
                  <span className="font-black text-xs uppercase tracking-widest opacity-50 shrink-0">Progress</span>
                  <div className="flex-1 h-4 border-2 border-[#121212] bg-[#F0F0F0] overflow-hidden">
                    <div
                      className="h-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: pct === 100 ? '#10A35A' : pct > 50 ? '#7ABF40' : pct > 20 ? '#F0C020' : '#D02020'
                      }}
                    />
                  </div>
                  <span className="font-black text-lg tracking-tighter shrink-0"
                    style={{ color: pct === 100 ? '#10A35A' : pct > 50 ? '#1040C0' : '#D02020' }}>
                    {pct}%
                  </span>
                </div>

                {/* Matrix + legend side-by-side */}
                <div className="flex gap-6 items-start overflow-x-auto">

                  {/* Y-axis label */}
                  <div className="flex flex-col justify-around shrink-0 self-stretch pt-8 pb-0 gap-0">
                    {activeDepartments.map((dept, idx) => (
                      <div
                        key={`${dept.id}-${idx}`}
                        className="flex items-center justify-end pr-3 font-black text-[11px] uppercase tracking-widest"
                        style={{ height: '52px', color: '#121212', opacity: 0.75 }}
                      >
                        {dept.name}
                      </div>
                    ))}
                  </div>

                  {/* Main matrix */}
                  <div className="flex flex-col flex-1 min-w-0">
                    {/* Column headers */}
                    <div className="flex mb-1">
                      {METRICS.map(m => (
                        <div key={m} className="flex-1 text-center font-black text-[10px] uppercase tracking-widest pb-2 opacity-60"
                          style={{ minWidth: 50 }}>
                          {m}
                        </div>
                      ))}
                    </div>

                    {/* Rows */}
                    {activeDepartments.map((dept, idx) => (
                      <div key={`${dept.id}-${idx}`} className="flex mb-1 group relative">
                        {METRICS.map((m, ci) => {
                          const val = seeded(dept, ci);
                          const bg  = cellColor(val);
                          const score = val.toFixed(1);
                          return (
                            <div
                              key={m}
                              className="flex-1 flex items-center justify-center border border-white text-[10px] font-black transition-transform hover:scale-105 cursor-default relative"
                              style={{ height: 52, background: bg, minWidth: 50 }}
                              title={`${dept.name} › ${m}: ${score}`}
                            >
                              {/* Value label */}
                              <span
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-[9px] font-black"
                                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                                {score}
                              </span>
                            </div>
                          );
                        })}

                        {/* Row hover tooltip */}
                        {dept.note && (
                          <div className="absolute left-0 -top-8 bg-[#121212] text-white text-[10px] font-bold uppercase px-3 py-1.5 border-l-4 border-[#F0C020] z-20 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {dept.note}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* X-axis column labels (rotated) */}
                    <div className="flex mt-2">
                      {METRICS.map(m => (
                        <div key={m} className="flex-1 flex justify-center" style={{ minWidth: 50 }}>
                          <span
                            className="font-bold text-[10px] uppercase tracking-widest opacity-50"
                            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 56 }}>
                            {m}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legend: gradient scale + status keys */}
                  <div className="shrink-0 flex flex-col gap-6 pl-4 border-l-2 border-[#E0E0E0]">

                    {/* Gradient bar */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-black text-[10px] uppercase tracking-widest opacity-60 mb-1">Score</span>
                      <div
                        className="w-4 border border-[#ccc]"
                        style={{
                          height: 120,
                          background: 'linear-gradient(to bottom, #1A8A32, #7ABF40, #F0C020, #E06020, #C82020)',
                          borderRadius: 2
                        }}
                      />
                      <div className="flex flex-col justify-between text-[10px] font-black opacity-60" style={{ height: 120 }}>
                        {['4', '3', '2', '1', '0'].map(v => (
                          <span key={v}>{v}</span>
                        ))}
                      </div>
                    </div>

                    {/* Status legend */}
                    <div className="flex flex-col gap-2">
                      <span className="font-black text-[10px] uppercase tracking-widest opacity-60 mb-1">Status</span>
                      {[
                        { color: '#10A35A', label: 'Cleared' },
                        { color: '#F0C020', label: 'Pending' },
                        { color: '#D02020', label: 'Action Req.' },
                      ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-2">
                          <span className="w-3 h-3 border border-[#121212] shrink-0" style={{ background: color }} />
                          <span className="font-bold text-[10px] uppercase tracking-widest opacity-70">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
        );
      })()}

      {/* Department Breakdown Table */}
      <div className="bg-white border-4 border-[#121212] shadow-[4px_4px_0px_0px_#121212] overflow-hidden">
        <div className="bg-[#121212] text-white p-5 border-b-4 border-[#121212]">
          <h2 className="font-black text-xl uppercase tracking-tight">Department Summary</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F0F0F0] border-b-4 border-[#121212]">
                <th className="p-4 font-black uppercase text-sm tracking-widest border-r-2 border-[#E0E0E0]">Department</th>
                <th className="p-4 font-black uppercase text-sm tracking-widest border-r-2 border-[#E0E0E0]">Authority</th>
                <th className="p-4 font-black uppercase text-sm tracking-widest border-r-2 border-[#E0E0E0]">Status</th>
                <th className="p-4 font-black uppercase text-sm tracking-widest w-12 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {departments && departments.length > 0 ? (
                departments.map((dept, idx) => (
                  <React.Fragment key={`${dept.id}-${idx}`}>
                    <tr 
                      className={`border-b-2 border-[#E0E0E0] hover:bg-[#F9F9F9] transition-colors cursor-pointer ${expandedRow === dept.id ? 'bg-[#F9F9F9]' : ''}`}
                      onClick={() => setExpandedRow(expandedRow === dept.id ? null : dept.id)}
                    >
                      <td className="p-4 font-black uppercase tracking-tight border-r-2 border-[#E0E0E0]">{dept.name}</td>
                      <td className="p-4 font-medium opacity-80 border-r-2 border-[#E0E0E0] whitespace-nowrap">{dept.authority}</td>
                      <td className="p-4 border-r-2 border-[#E0E0E0]">{getStatusBadge(dept.status)}</td>
                      <td className="p-4 text-center">
                        {expandedRow === dept.id ? <ChevronUp className="w-5 h-5 mx-auto" /> : <ChevronDown className="w-5 h-5 mx-auto opacity-50" />}
                      </td>
                    </tr>
                    
                    {expandedRow === dept.id && (
                      <tr className="bg-[#F9F9F9] border-b-2 border-[#121212]">
                        <td colSpan={4} className="p-0">
                          <div className="p-6 border-l-8 border-[#121212] m-4 bg-white shadow-[2px_2px_0px_0px_#121212]">
                            <p className="font-black uppercase text-xs tracking-widest mb-2 opacity-60">Latest Comment</p>
                            <p className="font-medium text-lg leading-relaxed mb-4">"{dept.note}"</p>
                            
                            {dept.status === 'Action Required' && (
                              <div className="pt-4 border-t-2 border-[#E0E0E0] flex items-center justify-between">
                                <p className="text-sm font-bold text-[#D02020] flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4" /> This department requires action.
                                </p>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setRespondModal(dept); }} 
                                  className="bg-[#121212] text-white px-4 py-2 font-bold uppercase text-xs tracking-widest hover:bg-[#D02020] transition-colors flex items-center gap-2"
                                >
                                  Respond <Send className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center bg-gray-50">
                    <p className="font-bold uppercase tracking-widest text-gray-400">
                      No department data available
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white border-4 border-[#121212] shadow-[4px_4px_0px_0px_#121212]">
         <div className="bg-[#F0C020] border-b-4 border-[#121212] p-5">
           <h2 className="font-black text-xl uppercase tracking-tight">Application Timeline</h2>
         </div>
         <div className="p-6 md:p-8 space-y-6">
            {notifications.slice(0, 5).map((log, i) => {
              const dt = new Date(log.time);
              const isValid = !isNaN(dt.getTime());
              const dateStr = isValid ? dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : log.time;
              const timeStr = isValid ? dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
              return (
                <div key={log.id} className="flex gap-4 items-start">
                  <div className="text-right w-24 md:w-32 shrink-0 pt-1">
                    <p className="font-bold text-xs uppercase tracking-widest opacity-60">{safeDate(log.time)}</p>
                  </div>
                  <div className="w-2 rounded-full border-2 border-[#121212] bg-[#F0F0F0] mt-1.5 h-2 shrink-0 relative">
                    {i < Math.min(notifications.length, 5) - 1 && <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-[#E0E0E0] -z-10" />}
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-tight text-[#121212]">{log.title}</p>
                    <p className="font-medium text-sm mt-0.5 opacity-80">{log.description}</p>
                  </div>
                </div>
              );
            })}
            {notifications.length === 0 && (
              <p className="opacity-50 font-bold uppercase tracking-widest text-center py-4">No activity log found.</p>
            )}
         </div>
      </div>

      {/* Respond Modal */}
      {respondModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setRespondModal(null)} />
          <div className="relative bg-white w-full max-w-lg border-4 border-[#121212] shadow-[8px_8px_0px_0px_#121212] p-0 flex flex-col">
            <div className="bg-[#D02020] text-white p-4 border-b-4 border-[#121212] flex justify-between items-center">
              <h2 className="font-black text-lg uppercase tracking-tight">Respond to {respondModal.name}</h2>
              <button onClick={() => setRespondModal(null)}><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleRespondSubmit} className="p-6 flex flex-col gap-6">
              <div>
                <p className="font-black uppercase text-xs tracking-widest mb-2">Original Reason</p>
                <p className="font-medium p-3 bg-[#F0F0F0] border-2 border-[#E0E0E0]">{respondModal.note}</p>
              </div>

              <div>
                <label className="font-black uppercase text-xs tracking-widest mb-2 block">Your Message</label>
                <textarea 
                  className="w-full border-2 border-[#121212] p-3 font-medium outline-none focus:border-4 transition-all"
                  rows={4}
                  placeholder="Explain your action..."
                  required
                />
              </div>

              <div>
                <label className="font-black uppercase text-xs tracking-widest mb-2 block">Attach Proof (Optional)</label>
                <div className="w-full border-2 border-dashed border-[#121212] p-4 flex flex-col items-center justify-center bg-[#F9F9F9] hover:bg-[#F0F0F0] cursor-pointer transition-colors">
                   <Paperclip className="w-6 h-6 mb-2 opacity-50" />
                   <p className="font-bold text-sm uppercase opacity-70">Click to upload document</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setRespondModal(null)} className="flex-1 py-3 font-bold uppercase tracking-wider border-2 border-[#121212] hover:bg-[#F0F0F0]">Cancel</button>
                <button type="submit" className="flex-1 py-3 font-black uppercase tracking-wider bg-[#1040C0] text-white border-2 border-[#121212] hover:bg-blue-800">Submit Response</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
