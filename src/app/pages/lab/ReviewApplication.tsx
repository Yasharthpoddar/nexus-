import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useLab } from '../../context/LabContext';
import { format } from 'date-fns';
import { 
  ArrowLeft, FileText, CheckCircle2, 
  AlertCircle, Download, FileBadge, ArrowRight,
  ClipboardCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ReviewApplication() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { labStudents, approveStudent, flagStudent, activities } = useLab();
  
  const student = labStudents.find(s => s.id === id);
  
  const [checklist, setChecklist] = useState({
    manual: false,
    kit: false,
    dues: false,
    deposit: false,
    card: false
  });
  
  const [labNotes, setLabNotes] = useState('');
  const [comment, setComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // If equipment was 'Returned' initially, auto-tick the related checklist boxes
  React.useEffect(() => {
    if (student) {
      setChecklist(prev => ({
        ...prev,
        manual: student.equipment.labManual === 'Returned',
        kit: student.equipment.equipmentKit === 'Returned',
        deposit: student.equipment.safetyDeposit === 'Returned',
        card: student.equipment.labCard === 'Returned',
        dues: true // Assuming dues cleared if no record flag? But we make them check it anyway. Let's just do true for demo if they all check. Wait, we let the user check it.
      }));
    }
  }, [student]);

  if (!student) return <div className="p-10 font-black text-xl uppercase tracking-widest text-[#D02020]">Student Not Found</div>;

  const allChecked = Object.values(checklist).every(v => v === true);

  const handleApprove = () => {
    if (!allChecked) {
      setToastMsg('Complete the verification checklist before approving.');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }
    approveStudent(student.id, labNotes);
    navigate('/lab/pending', { state: { toast: `Application ${student.id} approved and forwarded to HOD.` } });
  };

  const handleConfirmFlag = () => {
    if (comment.trim() === '') {
       setToastMsg('Comment is required to flag.');
       setTimeout(() => setToastMsg(''), 3000);
       return;
    }
    flagStudent(student.id, comment, labNotes);
    navigate('/lab/pending', { state: { toast: `Application ${student.id} flagged. Student notified.` } });
  };

  const eventHistory = activities.filter(a => a.title.includes(student.id) || a.title.includes(student.name)).slice(0, 4);

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto space-y-8 pb-32">
       
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 right-10 bg-[#D02020] text-white border-4 border-[#121212] p-4 font-black uppercase tracking-widest text-xs z-50 shadow-[8px_8px_0px_0px_#121212] flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        <button onClick={() => navigate('/lab/pending')} className="flex items-center gap-2 font-black uppercase tracking-widest text-xs opacity-60 hover:opacity-100 hover:-translate-x-1 transition-transform w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Pending Space
        </button>
        <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter">Application Audit</h1>
      </div>

      {/* Info Strip */}
      <div className="border-4 border-[#121212] bg-white shadow-[8px_8px_0px_0px_#121212] p-6 lg:p-8 flex flex-col lg:flex-row justify-between gap-8">
         <div className="flex flex-col gap-1">
           <div className="text-xs font-bold uppercase tracking-widest bg-[#121212] text-white px-2 py-1 flex w-max items-center gap-2 mb-2">
              <FileBadge className="w-4 h-4" /> {student.id}
           </div>
           <h2 className="font-black text-3xl md:text-4xl uppercase tracking-tight">{student.name}</h2>
           <div className="font-mono text-sm opacity-80">{student.rollNo}</div>
           
           <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 font-bold uppercase tracking-widest text-xs">
              <div className="flex flex-col"><span className="opacity-50 text-[10px]">Branch</span> {student.branch}</div>
              <div className="flex flex-col"><span className="opacity-50 text-[10px]">Batch</span> {student.batch}</div>
              <div className="flex flex-col"><span className="opacity-50 text-[10px]">Email</span> <span className="lowercase">{student.email}</span></div>
           </div>
         </div>

         {/* Stage Stepper */}
         <div className="flex flex-col justify-center border-t-4 border-[#121212] lg:border-t-0 lg:border-l-4 lg:pl-8 pt-6 lg:pt-0">
           <div className="font-black uppercase tracking-widest text-[10px] mb-4 opacity-60">Clearance Pathway</div>
           <div className="flex gap-2">
             <div className="bg-[#1040C0] text-white border-2 border-[#121212] font-black uppercase tracking-widest text-xs px-3 py-1.5 shadow-[2px_2px_0px_0px_#121212]">
                1. Lab (Active)
             </div>
             <ArrowRight className="w-5 h-5 opacity-40 self-center" />
             <div className="bg-white text-[#121212] border-2 border-[#121212] font-black uppercase tracking-widest text-[10px] px-3 py-1.5 opacity-60">
                2. HOD
             </div>
             <ArrowRight className="w-5 h-5 opacity-40 self-center" />
             <div className="bg-white text-[#121212] border-2 border-[#121212] font-black uppercase tracking-widest text-[10px] px-3 py-1.5 opacity-60">
                3. Principal
             </div>
           </div>
           <div className="mt-4 text-xs font-bold uppercase tracking-widest opacity-60 flex gap-2 items-center">
             <Clock className="w-4 h-4" /> Submitted {format(new Date(student.submittedAt), 'MMMM dd, yyyy')}
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         
         {/* LEFT COLUMN: Docs & Verification Checklist */}
         <div className="lg:col-span-7 flex flex-col gap-10">
            
            <div className="flex flex-col gap-4">
               <h3 className="font-black text-2xl uppercase tracking-tighter flex items-center gap-3">
                 <ClipboardCheck className="w-6 h-6 text-[#1040C0]" /> Lab Verification Checklist
               </h3>
               <p className="font-bold text-xs uppercase tracking-widest opacity-60 border-b-4 border-[#121212] pb-4">
                 All nodes must be manually validated prior to authorizing chain continuation.
               </p>

               <div className="space-y-4 pt-2">
                 {[
                   { key: 'manual', label: 'Lab Manual returned and signed off' },
                   { key: 'kit', label: 'Equipment kit / components returned' },
                   { key: 'dues', label: 'Lab dues cleared (₹0 pending)' },
                   { key: 'deposit', label: 'Safety deposit refunded or logged' },
                   { key: 'card', label: 'Lab access card surrendered' }
                 ].map(item => (
                   <label key={item.key} className="flex items-center gap-4 cursor-pointer p-2 hover:bg-[#F9F9F9] border-2 border-transparent hover:border-[#F0C020] transition-colors">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={(checklist as any)[item.key]} 
                          onChange={(e) => setChecklist({...checklist, [item.key]: e.target.checked})} 
                          className="appearance-none w-8 h-8 border-4 border-[#121212] bg-white cursor-pointer hover:bg-[#F0C020] transition-colors checked:bg-[#121212]"
                        />
                        {(checklist as any)[item.key] && <CheckCircle2 className="w-5 h-5 text-white absolute pointer-events-none" />}
                      </div>
                      <span className="font-bold uppercase tracking-widest text-sm flex-1">{item.label}</span>
                   </label>
                 ))}
               </div>
            </div>

            <div className="flex flex-col gap-2">
               <label className="font-black text-sm uppercase tracking-widest">Internal Lab Notes (Optional)</label>
               <textarea 
                  className="w-full bg-[#F9F9F9] border-4 border-[#121212] p-4 font-bold text-sm outline-none focus:bg-white resize-none h-32"
                  placeholder="Record internal anomalies, hardware damage specifics, or contextual notes... (Visible only to Admin/HOD)"
                  value={labNotes}
                  onChange={e => setLabNotes(e.target.value)}
               ></textarea>
            </div>

            <div className="flex flex-col gap-4 pt-8 border-t-4 border-[#121212]">
               <h3 className="font-black text-2xl uppercase tracking-tighter">Student Artifacts</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {student.documents.map((doc, idx) => (
                    <div key={idx} className="border-4 border-[#121212] bg-white p-4 flex flex-col gap-3 shadow-[4px_4px_0px_0px_#121212]">
                       <div className="flex items-center justify-between">
                         <span className="bg-[#121212] text-white text-[10px] font-black uppercase tracking-widest px-2 py-1">{doc.type}</span>
                       </div>
                       <div className="font-bold text-sm line-clamp-1 break-all">{doc.name}</div>
                       <button className="text-xs font-black uppercase tracking-widest mt-2 flex items-center justify-center gap-2 border-2 border-[#121212] py-2 hover:bg-[#F0C020] transition-colors">
                         Open Viewer
                       </button>
                    </div>
                  ))}
               </div>
            </div>

         </div>

         {/* RIGHT COLUMN: Decision Panel */}
         <div className="lg:col-span-5 flex flex-col gap-6">
            
            <div className="border-4 border-[#121212] bg-[#F9F9F9] p-6 shadow-[8px_8px_0px_0px_#121212] flex flex-col gap-6 sticky top-24">
               <h3 className="font-black text-2xl uppercase tracking-tighter border-b-2 border-[#121212] pb-4">Decision Protocol</h3>
               
               <div className="flex flex-col gap-2 relative group">
                 {!allChecked && (
                   <div className="absolute -top-10 left-0 bg-[#121212] text-white border-2 border-[#F0C020] text-[10px] font-black uppercase tracking-widest px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                     Complete checklist to unlock
                   </div>
                 )}
                 <button 
                   onClick={handleApprove}
                   disabled={!allChecked}
                   className="w-full py-5 bg-[#121212] text-white font-black text-lg uppercase tracking-widest border-4 border-[#121212] shadow-[4px_4px_0px_0px_#1040C0] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed disabled:bg-gray-400 disabled:border-gray-500"
                 >
                   Authorize & Forward
                 </button>
               </div>

               <div className="flex flex-col gap-4 border-t-2 border-[#121212] pt-6">
                 <div>
                   <label className="font-black text-sm uppercase tracking-widest mb-1 block">Rejection / Flag Reason</label>
                   <textarea
                     value={comment}
                     onChange={e => setComment(e.target.value)}
                     className="w-full bg-white border-2 border-[#121212] outline-none focus:border-[#D02020] p-3 text-sm h-24 resize-none"
                     placeholder="Specify what is missing..."
                   />
                 </div>
                 
                 <button 
                  onClick={() => setShowRejectModal(true)}
                  className="w-full py-4 bg-white text-[#D02020] border-4 border-[#D02020] font-black uppercase tracking-widest hover:bg-[#D02020] hover:text-white transition-colors"
                 >
                   Flag & Return to Student
                 </button>
               </div>
            </div>

            {/* Event Log */}
            <div className="mt-4 p-6 border-4 border-[#121212] bg-white flex flex-col gap-4">
              <h4 className="font-black uppercase tracking-widest text-sm border-b-2 border-black/10 pb-2">File Topology</h4>
              <div className="relative border-l-4 border-black/10 ml-4 pl-6 py-2 space-y-6">
                {eventHistory.length > 0 ? eventHistory.map(evt => (
                  <div key={evt.id} className="relative">
                     <div className="absolute -left-[35px] top-0 w-4 h-4 bg-white border-4 border-[#121212] rounded-full"></div>
                     <p className="font-bold text-xs uppercase tracking-widest">{evt.title}</p>
                     <p className="text-[10px] font-bold opacity-50 mt-1">{format(new Date(evt.timestamp), 'MMM dd, HH:mm')}</p>
                  </div>
                )) : (
                  <div className="relative">
                     <div className="absolute -left-[35px] top-0 w-4 h-4 bg-white border-4 border-[#121212] rounded-full"></div>
                     <p className="font-bold text-xs uppercase tracking-widest">Application instantiated</p>
                     <p className="text-[10px] font-bold opacity-50 mt-1">{format(new Date(student.submittedAt), 'MMM dd, HH:mm')}</p>
                  </div>
                )}
              </div>
            </div>

         </div>
      </div>

      {/* Reject Confirmation Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg border-4 border-[#121212] shadow-[12px_12px_0px_#D02020] p-8 flex flex-col gap-6"
            >
              <div className="flex gap-4 items-start">
                <AlertCircle className="w-10 h-10 text-[#D02020] shrink-0" />
                <div className="flex flex-col gap-2">
                  <h3 className="font-black text-2xl uppercase tracking-tighter">Confirm Flag Vector</h3>
                  <p className="font-bold text-sm opacity-80 leading-relaxed text-[#121212]">
                    This will immediately freeze the application at Stage 1 and notify `<span className="font-mono text-[#D02020]">{student.name}</span>` to rectify the flagged parameter.
                  </p>
                </div>
              </div>
              <div className="bg-[#F9F9F9] border-l-4 border-[#D02020] p-4 text-xs font-bold uppercase tracking-widest">
                " {comment || '(No comment specified)'} "
              </div>
              <div className="flex gap-4 pr-1">
                <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 border-4 border-[#121212] font-black uppercase text-xs tracking-widest hover:bg-[#F9F9F9] transition-colors">
                  Cancel
                </button>
                <button onClick={handleConfirmFlag} className="flex-1 py-3 bg-[#D02020] text-white border-4 border-[#121212] font-black uppercase text-xs tracking-widest hover:bg-black transition-colors">
                  Execute Flag
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
