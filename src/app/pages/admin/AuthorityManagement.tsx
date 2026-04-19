import React, { useState } from 'react';
import { Link } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { 
  Plus, Send, Mail, CheckCircle2, ShieldCheck, X, AlertCircle, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

export function AuthorityManagement() {
  const { authorities, addAuthority, deleteAuthority } = useAdmin();
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({ name: '', email: '', role: 'Lab In-charge', department: 'Library', password: '' });

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      // Map display label -> sub_role value the backend expects
      const subRoleMap: Record<string, string> = {
        'Lab In-charge': 'lab-incharge',
        'HOD': 'hod',
        'Principal': 'principal',
      };
      await addAuthority({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: subRoleMap[formData.role] || 'lab-incharge',
        department: formData.department,
      });
      setModalOpen(false);
      setFormData({ name: '', email: '', role: 'Lab In-charge', department: 'Library', password: '' });
      triggerToast('Authority Account Created & Live in Database');
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Registration failed. Email may already exist.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10 pb-32">
       
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-[#121212] pb-6">
          <div>
            <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter mb-2">Authority Management</h1>
            <p className="font-bold opacity-50 uppercase tracking-widest text-sm">Provision access and monitor departmental Service Level Agreements.</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="bg-[#121212] text-white px-6 py-4 font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-black border-4 border-[#121212] transition-colors shadow-[4px_4px_0px_0px_#F0C020]">
             <Plus className="w-5 h-5" /> Add Authority
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {authorities.map(auth => (
             <div key={auth.id} className="border-4 border-[#121212] bg-white p-6 shadow-[8px_8px_0px_0px_#121212] flex flex-col relative group">
                <div className={`absolute top-0 right-0 w-4 h-4 border-l-4 border-b-4 border-[#121212] ${auth.isOnline ? 'bg-[#1040C0]' : 'bg-[#E0E0E0]'}`} title={auth.isOnline ? 'Online' : 'Offline'} />
                
                <div className="flex gap-4 items-center mb-6">
                   <div className="w-16 h-16 bg-[#F0C020] border-4 border-[#121212] rounded-full flex items-center justify-center font-black text-xl uppercase tracking-tighter shrink-0">
                      {auth.name.split(' ').map(n=>n[0]).join('')}
                   </div>
                   <div>
                      <h2 className="font-black text-xl tracking-tight uppercase leading-none mb-1 line-clamp-1">{auth.name}</h2>
                      <span className={`font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 inline-block border-2 ${auth.role==='Principal' ? 'border-[#121212] bg-[#121212] text-white' : auth.role==='HOD' ? 'border-[#1040C0] text-[#1040C0]' : 'border-[#121212]'}`}>
                         {auth.role}
                      </span>
                   </div>
                </div>

                <div className="flex flex-col gap-2 mb-6 text-sm font-bold opacity-80 border-l-2 border-[#121212] pl-3">
                   <p className="uppercase tracking-widest text-[#1040C0]">{auth.department}</p>
                   <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {auth.email}</p>
                </div>

                <div className="flex gap-4 mb-8">
                   <div className="flex-1 flex flex-col">
                      <span className="font-black text-2xl tracking-tighter text-[#D02020]">{auth.pendingCount}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Pending Apps</span>
                   </div>
                   <div className="flex-1 flex flex-col text-right">
                      <span className="font-black text-2xl tracking-tighter">{auth.reviewedCount}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Reviewed Mon</span>
                   </div>
                </div>

                <div className="flex gap-2 mt-auto">
                   <Link to={`/admin/authorities/${auth.id}`} className="flex-1 text-center py-3 border-2 border-[#121212] font-black uppercase tracking-widest text-[10px] hover:bg-[#121212] hover:text-white transition-colors">
                      View Activity
                   </Link>
                   <button onClick={() => triggerToast(`Nudge email sent to ${auth.name}`)} className="flex-1 text-center py-3 border-2 border-[#121212] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-1 hover:bg-[#F0F0F0]">
                      <Send className="w-3 h-3" /> Nudge
                   </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Permanently remove authority account for ${auth.name}? This cannot be undone.`)) {
                          deleteAuthority(auth.id);
                        }
                      }}
                      className="px-4 py-3 bg-[#D02020] text-white border-2 border-[#D02020] hover:bg-black hover:border-black transition-colors flex items-center justify-center"
                      title="Delete Authority Account"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                </div>
             </div>
          ))}
       </div>

       {/* Add Authority Modal */}
       <AnimatePresence>
         {modalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white border-4 border-[#121212] w-full max-w-[500px] shadow-[16px_16px_0px_0px_#121212] overflow-hidden flex flex-col">
                 <div className="bg-[#121212] text-white p-6 flex justify-between items-center">
                    <h2 className="font-black text-xl uppercase tracking-widest flex items-center gap-3"><ShieldCheck className="w-6 h-6 text-[#F0C020]"/> Provision Access</h2>
                    <button onClick={() => setModalOpen(false)} className="hover:text-[#F0C020] transition-colors"><X className="w-6 h-6" /></button>
                 </div>
                 <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Full Name</label>
                      <input required type="text" className="w-full p-3 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-bold text-sm focus:bg-white" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">College Email</label>
                      <input required type="email" className="w-full p-3 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-bold text-sm focus:bg-white" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Role</label>
                         <select className="w-full p-3 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-bold text-xs uppercase tracking-widest" value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})}>
                           <option>Lab In-charge</option><option>HOD</option><option>Principal</option>
                         </select>
                       </div>
                       <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Department</label>
                         <select className="w-full p-3 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-bold text-xs uppercase tracking-widest" value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})}>
                           <option>Library</option><option>Computer Science</option><option>Hostel</option><option>Sports</option><option>Accounts</option>
                         </select>
                       </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Temporary Password</label>
                      <input required type="text" className="w-full p-3 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-mono text-sm focus:bg-white" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} />
                    </div>

                    {formError && (
                      <div className="flex items-center gap-3 bg-[#D02020]/10 border-2 border-[#D02020] p-3">
                        <AlertCircle className="w-4 h-4 text-[#D02020] shrink-0" />
                        <p className="font-bold text-xs text-[#D02020] uppercase tracking-wide">{formError}</p>
                      </div>
                    )}

                    <button type="submit" disabled={submitting} className="w-full mt-4 bg-[#121212] text-white py-4 font-black uppercase tracking-widest hover:bg-[#F0C020] hover:text-[#121212] transition-colors border-4 border-transparent hover:border-[#121212] disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitting ? 'Creating...' : 'Create Authority Account'}
                    </button>
                 </form>
              </motion.div>
           </div>
         )}
       </AnimatePresence>

       <Toast message={toastMsg} visible={showToast} />
    </div>
  );
}
