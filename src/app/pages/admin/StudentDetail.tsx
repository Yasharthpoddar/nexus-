import React, { useState, useEffect } from 'react';
import { useAdmin, DeptStatus } from '../../context/AdminContext';
import { useParams, Link } from 'react-router';
import { format } from 'date-fns';
import { 
  ArrowLeft, ShieldAlert, ShieldCheck, 
  FileBadge, FileText, CheckCircle2,
  XCircle, Copy
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

export function StudentDetail() {
  const { id } = useParams();
  const { students, toggleStudentBlock, overrideDepartmentStatus, updateAdminNotes } = useAdmin();
  const student = students.find(s => s.id === id);

  const [localNotes, setLocalNotes] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if(student) setLocalNotes(student.adminNotes || '');
  }, [student]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  if(!student) return <div className="p-10 font-black text-2xl uppercase">Student not found</div>;

  const handleSaveNotes = () => {
    updateAdminNotes(student.id, localNotes);
    triggerToast('Notes saved successfully');
  };

  const handleOverride = (deptId: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    overrideDepartmentStatus(student.id, deptId, e.target.value as DeptStatus);
    triggerToast('Override saved.');
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10 pb-32">
       
       <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest opacity-60 mb-8">
         <Link to="/admin/dashboard" className="hover:underline">Admin</Link> &gt; 
         <Link to="/admin/students" className="hover:underline">Student Management</Link> &gt; 
         <span className="text-[#121212] opacity-100">{student.name}</span>
       </div>

       {/* Top Profile Strip */}
       <div className="border-4 border-[#121212] bg-white shadow-[8px_8px_0px_0px_#121212] p-6 lg:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative">
          
          <button 
             onClick={() => toggleStudentBlock(student.id)}
             className={`absolute top-6 right-6 lg:static flex items-center gap-2 px-6 py-3 font-black uppercase text-xs tracking-widest transition-colors ${student.isBlocked ? 'bg-[#D02020] text-white border-4 border-[#D02020] hover:bg-black hover:border-black' : 'bg-white text-[#D02020] border-4 border-[#D02020] hover:bg-[#D02020] hover:text-white'}`}
          >
             {student.isBlocked ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
             {student.isBlocked ? 'Unblock Student' : 'Block Student'}
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
             <div className="w-24 h-24 bg-[#F0C020] border-4 border-[#121212] rounded-full flex items-center justify-center font-black text-3xl uppercase tracking-tighter shrink-0">
                {student.name.split(' ').map(n=>n[0]).join('')}
             </div>
             <div>
                <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter mb-2">{student.name}</h1>
                <div className="flex flex-wrap gap-4 font-bold text-xs uppercase tracking-widest opacity-80">
                   <span className="bg-[#F9F9F9] border-2 border-[#121212] px-2 py-1">{student.rollNo}</span>
                   <span className="bg-[#F9F9F9] border-2 border-[#121212] px-2 py-1">{student.branch} '{student.batch.substring(2)}</span>
                   <span className="flex items-center gap-2"><MailIcon /> {student.email}</span>
                   <span className="flex items-center gap-2"><PhoneIcon /> {student.phone}</span>
                </div>
             </div>
          </div>
       </div>

       {/* Clearance Heatmap */}
       <div>
         <h2 className="font-black text-2xl uppercase tracking-tighter mb-6 flex items-center gap-4">
            Clearance Status Override <span className="text-xs opacity-50 tracking-widest">({student.departments.length} Nodes)</span>
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {student.departments.map(dept => (
              <div key={dept.id} className="border-4 border-[#121212] bg-white p-5 flex flex-col">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-black text-lg uppercase tracking-tight">{dept.name}</p>
                      <p className="font-bold text-[10px] uppercase tracking-widest opacity-60">Auth: {dept.authority}</p>
                    </div>
                 </div>
                 
                 <div className="mt-auto pt-4 border-t-2 border-[#121212] flex flex-col gap-2">
                    <label className="font-bold text-[10px] uppercase tracking-widest opacity-80">Manual Override</label>
                    <select 
                      value={dept.status}
                      onChange={(e) => handleOverride(dept.id, e)}
                      className={`w-full p-2 border-2 border-[#121212] outline-none font-black text-xs uppercase tracking-widest cursor-pointer transition-colors ${dept.status === 'Cleared' ? 'bg-[#121212] text-white' : dept.status === 'Blocked' ? 'bg-[#D02020] text-white' : 'bg-white text-[#121212]'}`}
                    >
                       <option value="Cleared">Cleared</option>
                       <option value="Pending">Pending</option>
                       <option value="Blocked">Blocked</option>
                    </select>
                    <p className="font-bold text-[10px] uppercase tracking-widest opacity-40 text-right mt-1">
                      Updated {format(new Date(dept.lastUpdated), 'MMM dd, HH:mm')}
                    </p>
                 </div>
              </div>
            ))}
         </div>
       </div>

       <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          
          {/* Internal Notes */}
          <div className="flex flex-col gap-4">
             <h2 className="font-black text-2xl uppercase tracking-tighter">Admin Internal Notes</h2>
             <textarea 
               value={localNotes}
               onChange={e=>setLocalNotes(e.target.value)}
               className="w-full h-48 p-4 bg-[#F9F9F9] border-2 border-[#121212] outline-none focus:border-[#1040C0] font-mono text-sm leading-relaxed"
               placeholder="Type persistence notes here..."
             />
             <button 
               onClick={handleSaveNotes}
               className="bg-[#121212] text-white font-black uppercase text-xs tracking-widest px-6 py-4 border-4 border-transparent hover:shadow-[4px_4px_0px_0px_#1040C0] hover:-translate-y-1 transition-all self-start"
             >
               Save Note
             </button>
          </div>

          {/* Payment History */}
          <div className="flex flex-col gap-4">
             <h2 className="font-black text-2xl uppercase tracking-tighter">Payment Ledger</h2>
             {student.payments.length === 0 ? (
               <div className="border-4 border-[#121212] border-dashed p-10 flex flex-col items-center justify-center text-center opacity-50">
                 <FileText className="w-10 h-10 mb-2" />
                 <p className="font-black uppercase tracking-widest text-sm">No Payments Recorded</p>
               </div>
             ) : (
               <div className="border-4 border-[#121212] bg-white overflow-hidden shadow-[4px_4px_0px_0px_#121212]">
                 <table className="w-full text-left">
                   <thead className="bg-[#121212] text-white font-black uppercase tracking-widest text-[10px]">
                     <tr><th className="p-3">Date</th><th className="p-3">Dept</th><th className="p-3">Amount</th><th className="p-3 text-right">Receipt</th></tr>
                   </thead>
                   <tbody className="divide-y-2 divide-[#121212] font-bold text-xs">
                     {student.payments.map((p,i) => (
                       <tr key={i}>
                         <td className="p-3">{p.date}</td>
                         <td className="p-3 uppercase">{p.dept}</td>
                         <td className="p-3">{p.amount}</td>
                         <td className="p-3 text-right">
                            <button className="text-[#1040C0] flex items-center gap-1 justify-end w-full group hover:underline">
                              {p.receiptNo} <Copy className="w-3 h-3 group-hover:scale-110" />
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
       </div>

       <Toast message={toastMsg} visible={showToast} />
    </div>
  );
}

const MailIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const PhoneIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
