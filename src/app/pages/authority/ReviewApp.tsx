import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAuthority } from '../../context/AuthorityContext';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { 
  ChevronRight, ArrowLeft, CheckCircle2, AlertOctagon,
  FileText, ExternalLink, Paperclip, MessageSquare, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { safeDate } from '../../utils/formatters';

export function ReviewApp() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pendingApps, reviewedApps, approveApplication, flagApplication, toggleDocumentVerification } = useAuthority();
  const { currentUser } = useAuth();
  
  const role = currentUser?.sub_role?.toLowerCase() || 'hod';
  const basePath = role === 'principal' ? '/principal' : role === 'librarian' ? '/library' : '/hod';

  const application = pendingApps.find(a => a.id === id) || reviewedApps.find(a => a.id === id);
  
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<{type: 'approve'|'flag', msg: string}|null>(null);

  if (!application) {
    return <div className="p-10 font-black uppercase text-xl">Application not found</div>;
  }

  const isDecided = application.status !== 'Pending';

  // Audit G1: Sequential Logic
  const deptStatuses = application.departmentStatuses || {};
  const isLabCleared  = deptStatuses.lab === 'Cleared';
  const isLibCleared  = deptStatuses.lib === 'Cleared';
  const isHodCleared  = deptStatuses.hod === 'Cleared';

  let canApprove = true;
  let blockingDept = '';

  if (role === 'hod') {
    if (!isLabCleared) { canApprove = false; blockingDept = 'Laboratory'; }
    else if (!isLibCleared) { canApprove = false; blockingDept = 'Library'; }
  } else if (role === 'principal') {
    if (!isLabCleared) { canApprove = false; blockingDept = 'Laboratory'; }
    else if (!isLibCleared) { canApprove = false; blockingDept = 'Library'; }
    else if (!isHodCleared) { canApprove = false; blockingDept = 'HOD'; }
  }
  // Lab and Library (Librarian) are the starting gates, so they are never blocked by others.

  const handleDecision = (type: 'approve' | 'flag') => {
    if (type === 'flag' && !comment.trim()) {
      setError('A comment is required when flagging or rejecting.');
      return;
    }
    
    // Process logic
    if (type === 'approve') approveApplication(application.id, comment);
    else flagApplication(application.id, comment);

    // Show toast and redirect
    setShowToast({
       type,
       msg: type === 'approve' ? 'Application approved & forwarded.' : 'Application flagged. Student notified.'
    });

    setTimeout(() => {
      navigate(`${basePath}/pending`);
    }, 2000);
  };

  const selectedDocument = (application.documents || []).find(d => d.id === activeDoc);

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 relative">
      
      {/* Toast Overlay */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-[#121212] border-4 border-white text-white p-6 flex items-center gap-4 shadow-[8px_8px_0px_0px_white]"
          >
            {showToast.type === 'approve' ? <CheckCircle2 className="text-[#1040C0] w-8 h-8" /> : <AlertOctagon className="text-[#D02020] w-8 h-8" />}
            <span className="font-black uppercase text-lg tracking-tight">{showToast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb */}
      <div className="font-bold text-[10px] uppercase tracking-widest opacity-60 flex items-center gap-2 mb-2">
        <Link to={`${basePath}/dashboard`} className="hover:underline hover:text-[#1040C0]">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={`${basePath}/pending`} className="hover:underline hover:text-[#1040C0]">Pending</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#121212]">Review {application.studentName}</span>
      </div>

      {/* Header Panel */}
      <div className="bg-white border-4 border-[#121212] shadow-[8px_8px_0px_0px_#121212] p-6 lg:p-8 flex flex-col lg:flex-row gap-8 justify-between relative overflow-hidden">
         {/* Status watermark */}
         {isDecided && (
           <div className={`absolute -right-10 top-10 font-black uppercase text-8xl opacity-5 pointer-events-none transform rotate-12 ${application.status === 'Approved' ? 'text-[#1040C0]' : 'text-[#D02020]'}`}>
             {application.status}
           </div>
         )}

         <div className="flex gap-6 z-10">
            <div className="w-16 h-16 bg-[#F0F0F0] border-2 border-[#121212] flex items-center justify-center shrink-0">
               <span className="font-black text-xl text-[#121212]">
                  {application.studentName.split(' ').map(n=>n[0]).join('').substring(0,2)}
               </span>
            </div>
            
            <div>
               <div className="flex items-center gap-4 mb-2">
                 <h1 className="font-black text-3xl uppercase tracking-tight">{application.studentName}</h1>
                 {isDecided && (
                    <span className={`px-2 py-1 border-2 font-bold uppercase text-[10px] tracking-widest ${application.status === 'Approved' ? 'bg-[#1040C0] text-white border-[#1040C0]' : 'bg-[#D02020] text-white border-[#D02020]'}`}>
                       {application.status}
                    </span>
                 )}
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm">
                  <p className="font-bold opacity-60">Roll No:</p> <p className="font-mono">{application.rollNo}</p>
                  <p className="font-bold opacity-60">Branch:</p> <p className="font-mono">{application.branch} '{application.batch.substring(2)}</p>
                  <p className="font-bold opacity-60">Email:</p> <p className="font-mono">{application.email}</p>
                  <p className="font-bold opacity-60">Submitted:</p> <p className="font-mono">{safeDate(application.submissionDate)}</p>
               </div>
            </div>
         </div>

         {/* Chain Stepper */}
         <div className="z-10 bg-[#F9F9F9] border-2 border-[#121212] p-4 lg:w-72 shrink-0">
            <p className="font-bold text-[10px] uppercase tracking-widest mb-4 opacity-70">Approval Progression</p>
            <div className="flex items-center justify-between relative px-2">
               <div className="absolute top-2.5 left-4 right-4 h-0.5 bg-[#E0E0E0] -z-10" />
               
               <div className="flex flex-col items-center gap-1">
                 <div className={`w-5 h-5 rounded-full border-2 border-[#121212] flex items-center justify-center shrink-0 ${isLabCleared ? 'bg-[#1040C0]' : 'bg-white'}`}>
                   {isLabCleared && <CheckCircle2 className="w-3 h-3 text-white" />}
                 </div>
                 <span className="font-bold text-[8px] uppercase tracking-widest">Lab</span>
               </div>

               <div className="flex flex-col items-center gap-1">
                 <div className={`w-5 h-5 rounded-full border-2 border-[#121212] flex items-center justify-center shrink-0 ${isLibCleared ? 'bg-[#1040C0]' : 'bg-white'}`}>
                   {isLibCleared && <CheckCircle2 className="w-3 h-3 text-white" />}
                 </div>
                 <span className="font-bold text-[8px] uppercase tracking-widest">Library</span>
               </div>

               <div className="flex flex-col items-center gap-1">
                 <div className={`w-5 h-5 rounded-full border-2 border-[#121212] flex items-center justify-center shrink-0 ${isHodCleared ? 'bg-[#1040C0]' : 'bg-white'}`}>
                   {isHodCleared && <CheckCircle2 className="w-3 h-3 text-white" />}
                 </div>
                 <span className="font-bold text-[8px] uppercase tracking-widest">HOD</span>
               </div>

               <div className="flex flex-col items-center gap-1">
                 <div className={`w-5 h-5 rounded-full border-2 border-[#121212] flex items-center justify-center shrink-0 ${application.status === 'Cleared' ? 'bg-[#10A040]' : 'bg-white'}`}>
                   {application.status === 'Cleared' && <CheckCircle2 className="w-3 h-3 text-white" />}
                 </div>
                 <span className="font-bold text-[8px] uppercase tracking-widest">Prin</span>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Documents */}
        <div className="xl:col-span-2 flex flex-col gap-6">
           
           {/* Document Grid */}
           <div className="bg-white border-4 border-[#121212] p-6 shadow-[4px_4px_0px_0px_#121212]">
              <h2 className="font-black text-xl uppercase tracking-tight flex items-center gap-2 mb-6">
                 <span className="w-3 h-3 bg-[#1040C0] inline-block" /> Student Documents
              </h2>
              
              {application.documents.length === 0 ? (
                 <p className="font-medium opacity-60 text-sm">No documents attached to this application.</p>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {application.documents.map(doc => (
                     <div 
                       key={doc.id} 
                       onClick={() => setActiveDoc(doc.id)}
                       className={`border-2 p-4 cursor-pointer transition-colors flex flex-col $${activeDoc === doc.id ? 'border-[#1040C0] bg-[#1040C0]/5' : 'border-[#121212] hover:bg-[#F0F0F0]'}`}
                     >
                        <div className="flex justify-between items-start mb-4">
                           <div className="bg-[#121212] text-white px-2 py-1 font-bold text-[10px] uppercase tracking-widest inline-block">{doc.type}</div>
                           {!isDecided && (
                             <label className="flex items-center gap-2 hover:opacity-100 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                <input 
                                  type="checkbox" 
                                  checked={doc.isVerified}
                                  onChange={() => toggleDocumentVerification(application.id, doc.id)}
                                  className="w-4 h-4 accent-[#1040C0]" 
                                />
                                <span className={`font-bold text-[10px] uppercase tracking-widest ${doc.isVerified ? 'text-[#1040C0]' : 'opacity-50'}`}>
                                  {doc.isVerified ? 'Verified' : 'Verify'}
                                </span>
                             </label>
                           )}
                           {isDecided && doc.isVerified && <CheckCircle2 className="w-5 h-5 text-[#1040C0]" />}
                        </div>
                        <p className="font-black tracking-tight line-clamp-1 mb-1">{doc.name}</p>
                        <p className="font-mono text-xs opacity-50">{doc.size} • Uploaded {safeDate(doc.date)}</p>
                     </div>
                   ))}
                 </div>
              )}
           </div>

           {/* Preview Panel */}
           {activeDoc && selectedDocument && (
             <div className="bg-[#F0F0F0] border-4 border-[#121212] h-[500px] flex flex-col p-2 shadow-[4px_4px_0px_0px_#121212]">
                <div className="bg-[#121212] text-white p-3 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                     <FileText className="w-5 h-5 opacity-50" />
                     <span className="font-bold text-sm tracking-widest uppercase">{selectedDocument.name}</span>
                  </div>
                  <button className="text-white hover:text-[#F0C020] transition-colors"><ExternalLink className="w-5 h-5" /></button>
                </div>
                {/* Mock Viewer */}
                <div className="flex-1 bg-white m-2 border-2 border-dashed border-[#121212] flex items-center justify-center flex-col text-center p-8">
                   <div className="w-32 h-40 bg-[#F9F9F9] border-2 border-[#121212] shadow-[6px_6px_0px_0px_#E0E0E0] flex flex-col relative mb-6">
                      <div className="h-6 border-b-2 border-[#121212]" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <FileText className="w-16 h-16" />
                      </div>
                   </div>
                   <p className="font-black text-xl uppercase tracking-tight">PDF Preview Sandbox</p>
                   <p className="font-medium text-sm opacity-60 mt-2 max-w-sm">
                     In a live environment, the actual document renders here via a secure iframe to prevent downloads.
                   </p>
                </div>
             </div>
           )}

        </div>

        {/* RIGHT COLUMN: Actions & History */}
        <div className="xl:col-span-1 flex flex-col gap-8">
           
           {/* Decision Box */}
           {!isDecided ? (
             <div className="bg-white border-4 border-[#121212] shadow-[4px_4px_0px_0px_#1040C0] flex flex-col">
                <div className="p-6 border-b-4 border-[#121212] bg-[#1040C0] text-white text-center">
                   <h2 className="font-black text-2xl uppercase tracking-tight">Authority Decision</h2>
                </div>
                
                <div className="p-6 flex flex-col gap-4">
                   <div className="flex flex-col">
                     <label className="font-bold uppercase text-[10px] tracking-widest mb-2 flex justify-between">
                       <span>Comment / Reason</span>
                       {error && <span className="text-[#D02020] animate-pulse">Required for rejection</span>}
                     </label>
                     <textarea 
                        rows={4}
                        placeholder="Add your note here..."
                        value={comment}
                        onChange={e => {setComment(e.target.value); setError('');}}
                        className={`w-full p-4 border-2 font-medium text-sm outline-none bg-[#F9F9F9] focus:bg-white transition-colors ${error ? 'border-[#D02020]' : 'border-[#121212]'}`} 
                     />
                   </div>

                   <button className="flex items-center gap-2 font-bold uppercase text-xs tracking-widest opacity-60 hover:opacity-100 transition-opacity w-max">
                     <Paperclip className="w-4 h-4" /> Attach File
                   </button>

                   <div className="flex flex-col md:flex-row xl:flex-col gap-4 mt-4 pt-6 border-t-2 border-[#121212]">
                      <button 
                        onClick={() => handleDecision('flag')}
                        className="flex-1 py-4 border-4 border-[#D02020] text-[#D02020] font-black uppercase tracking-widest hover:bg-[#D02020] hover:text-white transition-colors"
                      >
                        Reject / Flag
                      </button>
                      <button 
                        onClick={() => handleDecision('approve')}
                        disabled={!canApprove}
                        className={`flex-1 py-4 border-4 font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-3 ${
                          canApprove 
                          ? 'border-[#1040C0] bg-[#1040C0] text-white hover:bg-white hover:text-[#1040C0] hover:shadow-[4px_4px_0px_0px_#1040C0]' 
                          : 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-70'
                        }`}
                      >
                        {!canApprove && <Lock className="w-4 h-4" />}
                        {canApprove ? 'Approve Clearance' : `Waiting for ${blockingDept}`}
                      </button>
                   </div>
                </div>
             </div>
           ) : (
             <div className="bg-[#121212] border-4 border-[#121212] shadow-[4px_4px_0px_0px_#E0E0E0] text-white flex flex-col p-8 text-center relative overflow-hidden">
                <CheckCircle2 className="w-16 h-16 text-[#F0C020] mx-auto mb-4" />
                <h2 className="font-black text-2xl uppercase tracking-tight mb-2">Decision Recorded</h2>
                <p className="font-medium opacity-80 text-sm mb-6">
                  This application was marked as <strong className="text-[#F0C020]">{application.status}</strong> on {application.decisionDate && safeDate(application.decisionDate)}.
                </p>
                {application.decisionComment && (
                   <div className="bg-white/10 p-4 border-l-4 border-[#F0C020] text-left">
                     <p className="font-bold uppercase text-[10px] tracking-widest mb-1 text-[#F0C020]">Your Comment</p>
                     <p className="font-medium text-sm leading-relaxed">{application.decisionComment}</p>
                   </div>
                )}
             </div>
           )}

           {/* History Tracker */}
           <div className="bg-white border-4 border-[#121212] p-6">
              <h3 className="font-black text-lg uppercase tracking-tight mb-6 flex items-center gap-2">
                 <span className="w-3 h-3 bg-[#F0C020] inline-block" /> Audit Trail
              </h3>
              
              <div className="relative border-l-2 border-[#121212] ml-3 pl-6 space-y-8 py-2">
                 {application.history.slice().reverse().map((hist, i) => (
                   <div key={hist.id} className="relative">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 border-2 border-[#121212] bg-[#121212]" />
                      <div className="flex justify-between items-start mb-1 gap-2">
                         <span className="font-black uppercase tracking-tight text-sm">{hist.action}</span>
                         <span className="font-mono text-[10px] opacity-50 shrink-0">{safeDate(hist.date)}</span>
                      </div>
                      <p className="font-bold text-[10px] uppercase tracking-widest opacity-60 mb-2">{hist.actor} • {hist.role}</p>
                      {hist.comment && (
                         <div className="bg-[#F9F9F9] p-3 border-2 border-[#121212] text-sm font-medium flex gap-3 mt-2">
                           <MessageSquare className="w-4 h-4 mt-0.5 opacity-50 shrink-0" />
                           <p>"{hist.comment}"</p>
                         </div>
                      )}
                   </div>
                 ))}
              </div>
           </div>

        </div>

      </div>

    </div>
  );
}
