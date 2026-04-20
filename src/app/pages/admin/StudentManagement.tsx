import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Link } from 'react-router';
import { 
  Search, ShieldOff, Download, UserX, X, Plus, ShieldCheck, AlertCircle, Trash2, FileUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function StudentManagement() {
  const { students, toggleStudentBlock, addStudent, deleteStudent, bulkAddStudents } = useAdmin();
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [batchFilter, setBatchFilter] = useState('');
  
  const [selected, setSelected] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Student Form State
  const [formData, setFormData] = useState({
    name: '', rollNo: '', branch: 'CSE', batch: '2025', phone: '',
    email: '', pass: ''
  });

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await addStudent({
        name: formData.name,
        email: formData.email,
        password: formData.pass,
        rollNo: formData.rollNo,
        branch: formData.branch,
        batch: formData.batch,
      });
      setModalOpen(false);
      setFormData({ name: '', rollNo: '', branch: 'CSE', batch: '2025', phone: '', email: '', pass: '' });
      triggerToast('Student account created and live in database.');
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Registration failed. Email may already exist.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rawLines = text.split(/\r?\n/).filter(l => l.trim() !== "");
      if (rawLines.length < 2) {
        triggerToast('CSV file is empty or missing data.');
        return;
      }

      // Smarter CSV parser for quoted fields and varied delimiters
      const parseCSVLine = (line: string) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else cur += char;
        }
        result.push(cur.trim());
        return result.map(v => v.replace(/^"|"$/g, ''));
      };

      const parsedStudents = rawLines.slice(1).map(line => {
        const cols = parseCSVLine(line);
        if (cols.length < 4) return null; // Basic check, UID might be missing in some lines

        return {
          email: cols[1],
          name: cols[2],
          rollNo: cols[3],
          branch: cols[4] || 'General',
          batch: cols[5] || '2025'
        };
      }).filter(h => h && h.email);

      if (parsedStudents.length === 0) {
        triggerToast('No valid student records found in CSV. Check column order.');
        return;
      }

      alert(`Found ${parsedStudents.length} student records in CSV. Starting bulk upload...`);
      setSubmitting(true);
      let totalCreated = 0;
      let totalFailed = 0;
      const CHUNK_SIZE = 100;

      try {
        for (let i = 0; i < parsedStudents.length; i += CHUNK_SIZE) {
          const chunk = parsedStudents.slice(i, i + CHUNK_SIZE);
          const result = await bulkAddStudents(chunk);
          
          totalCreated += result.results?.created || 0;
          totalFailed += result.results?.failed || 0;
          
          if (result.results?.errors?.length > 0) {
            console.warn(`Batch ${i} has errors:`, result.results.errors);
          }

          triggerToast(`Progress: ${Math.min(i + CHUNK_SIZE, parsedStudents.length)}/${parsedStudents.length} students...`);
        }
        
        if (totalCreated > 0) {
          triggerToast(`Upload Successful! Added/Updated ${totalCreated} students.`);
          if (totalFailed > 0) {
            triggerToast(`${totalFailed} records were skipped/errored. See console.`);
            const firstError = result.results?.errors?.[0]?.errors?.[0]?.error;
            if (firstError) alert(`Note: Some records failed. Example error: ${firstError}`);
          }
        } else {
          const firstError = result.results?.errors?.[0]?.errors?.[0]?.error;
          triggerToast(`Upload finished: 0 new students added.`);
          if (firstError) alert(`Critical Error: ${firstError}`);
        }
      } catch (err: any) {
        console.error("Bulk upload fatal error:", err);
        triggerToast(`Upload failed: ${err.response?.data?.message || err.message}`);
      } finally {
        setSubmitting(false);
        if(fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Filtering
  const filtered = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = branchFilter ? s.branch === branchFilter : true;
    const matchesBatch = batchFilter ? s.batch === batchFilter : true;
    
    let matchesStatus = true;
    const isCleared = s.certStatus === 'Ready to Issue' || s.certStatus === 'Already Issued';
    if(statusFilter === 'Cleared') matchesStatus = isCleared;
    if(statusFilter === 'Pending') matchesStatus = !isCleared && !s.isBlocked;
    if(statusFilter === 'Blocked') matchesStatus = s.isBlocked;

    return matchesSearch && matchesBranch && matchesBatch && matchesStatus;
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const selectAll = () => {
    if(selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map(s => s.id));
  };

  const handleBulkBlock = () => {
    selected.forEach(id => toggleStudentBlock(id, true));
    setSelected([]);
  };

  const clearFilters = () => {
    setSearch('');
    setBranchFilter('');
    setStatusFilter('All');
    setBatchFilter('');
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 pb-32 relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-10 right-10 bg-white border-4 border-[#121212] shadow-[8px_8px_0px_0px_#121212] px-6 py-4 font-black uppercase tracking-widest text-sm z-50 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#1040C0]" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-[#121212] pb-6">
        <div>
          <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter mb-2">Student Management</h1>
          <p className="font-bold opacity-50 uppercase tracking-widest text-sm">Control clearance overrides and bulk operations.</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={submitting}
            className="bg-white text-[#121212] px-6 py-4 font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-[#F9F9F9] border-4 border-[#121212] transition-colors shadow-[4px_4px_0px_0px_#121212] disabled:opacity-50"
          >
             <FileUp className="w-5 h-5" /> Bulk Upload CSV
          </button>
          <button onClick={() => setModalOpen(true)} className="bg-[#121212] text-white px-6 py-4 font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-black border-4 border-[#121212] transition-colors shadow-[4px_4px_0px_0px_#F0C020]">
             <Plus className="w-5 h-5" /> Create New Student
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
           <input 
             type="text" 
             placeholder="Search by Name or Roll No..." 
             className="w-full p-4 pl-12 bg-[#F9F9F9] border-2 border-[#121212] outline-none focus:border-[#1040C0] font-black uppercase text-sm tracking-wide"
             value={search} onChange={e=>setSearch(e.target.value)}
           />
        </div>
        
        <select className="p-4 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-bold uppercase text-xs tracking-widest min-w-[150px]" value={branchFilter} onChange={e=>setBranchFilter(e.target.value)}>
           <option value="">All Branches</option>
           <option>CSE</option><option>IT</option><option>ECE</option><option>Mechanical</option><option>Civil</option>
        </select>

        <select className="p-4 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-bold uppercase text-xs tracking-widest min-w-[150px]" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
           <option>All Status</option><option>Cleared</option><option>Pending</option><option>Blocked</option>
        </select>

        <select className="p-4 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-bold uppercase text-xs tracking-widest min-w-[150px]" value={batchFilter} onChange={e=>setBatchFilter(e.target.value)}>
           <option value="">All Batches</option>
           <option>2024</option><option>2025</option><option>2026</option>
        </select>
      </div>

      {/* Bulk Action Bar */}
      {selected.length > 0 && (
        <div className="bg-[#121212] text-white p-4 border-4 border-[#F0C020] shadow-[4px_4px_0px_0px_#121212] flex items-center justify-between sticky top-20 z-20">
           <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-[#1040C0] font-black flex items-center justify-center">{selected.length}</div>
             <span className="font-bold uppercase tracking-widest text-xs">Students Selected</span>
           </div>
           <div className="flex gap-4">
             <button onClick={handleBulkBlock} className="flex items-center gap-2 px-6 py-3 border-2 border-[#D02020] text-[#D02020] font-black uppercase text-xs tracking-widest hover:bg-[#D02020] hover:text-white transition-colors">
               <ShieldOff className="w-4 h-4" /> Block Selected
             </button>
             <button onClick={() => alert('Exporting...')} className="flex items-center gap-2 px-6 py-3 border-2 border-white font-black uppercase text-xs tracking-widest hover:bg-white hover:text-[#121212] transition-colors">
               <Download className="w-4 h-4" /> Export Selected
             </button>
           </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="border-4 border-[#121212] bg-white p-20 flex flex-col items-center shadow-[4px_4px_0px_0px_#121212] text-center">
           <UserX className="w-16 h-16 opacity-20 mb-4" />
           <p className="font-black text-2xl uppercase tracking-tighter mb-4">No students found</p>
           <button onClick={clearFilters} className="bg-[#121212] text-white px-6 py-3 font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-black">
             <X className="w-4 h-4" /> Clear Filters
           </button>
        </div>
      ) : (
        <div className="border-4 border-[#121212] bg-white shadow-[8px_8px_0px_0px_#121212] overflow-x-auto">
          <table className="w-full text-left min-w-[1000px] border-collapse">
            <thead>
              <tr className="bg-[#121212] text-white">
                <th className="p-4 pl-6 text-center w-12">
                   <input type="checkbox" className="w-4 h-4 accent-[#1040C0]" checked={selected.length === filtered.length && filtered.length > 0} onChange={selectAll} />
                </th>
                <th className="p-4 font-black uppercase tracking-widest text-xs">Name</th>
                <th className="p-4 font-black uppercase tracking-widest text-xs">Roll No</th>
                <th className="p-4 font-black uppercase tracking-widest text-xs">Course</th>
                <th className="p-4 font-black uppercase tracking-widest text-xs">Clearance Status</th>
                <th className="p-4 font-black uppercase tracking-widest text-xs">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#121212]">
              {filtered.map(s => {
                const isCleared = s.certStatus === 'Ready to Issue' || s.certStatus === 'Already Issued';
                const statusPillClass = s.isBlocked 
                   ? 'bg-[#D02020] text-white' 
                   : (isCleared ? 'bg-[#121212] text-white' : 'bg-white text-[#121212] border-2 border-[#121212]');
                
                const statusLabel = s.isBlocked ? 'Blocked' : (isCleared ? 'Cleared' : 'Pending');

                return (
                  <tr key={s.id} className={`${selected.includes(s.id) ? 'bg-[#F0C020]/20' : 'hover:bg-[#F9F9F9]'}`}>
                    <td className="p-4 pl-6 text-center">
                       <input type="checkbox" className="w-4 h-4 accent-[#1040C0]" checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} />
                    </td>
                    <td className="p-4">
                       <p className="font-black text-lg tracking-tight uppercase leading-none">{s.name}</p>
                    </td>
                    <td className="p-4 font-mono text-sm uppercase">{s.rollNo}</td>
                    <td className="p-4">
                       <span className="font-bold text-xs uppercase tracking-widest bg-[#F9F9F9] border-2 border-[#121212] px-2 py-1">{s.branch} '{s.batch.substring(2)}</span>
                    </td>
                    <td className="p-4">
                       <span className={`font-black text-[10px] uppercase tracking-widest px-2 py-1 ${statusPillClass}`}>
                          {statusLabel}
                       </span>
                    </td>
                    <td className="p-4 flex gap-2">
                       <Link 
                         to={`/admin/students/${s.id}`}
                         className="px-4 py-2 border-2 border-[#121212] font-black uppercase tracking-widest text-[10px] bg-white hover:bg-[#121212] hover:text-white transition-colors"
                       >
                         View
                       </Link>
                       <button 
                         onClick={() => {
                           if (window.confirm(`Are you absolutely sure you want to permanently delete data for ${s.name}? This action cannot be undone.`)) {
                             deleteStudent(s.id);
                           }
                         }}
                         className="px-4 py-2 font-black uppercase tracking-widest text-[10px] bg-[#D02020] text-white border-2 border-[#D02020] hover:bg-black hover:border-black transition-colors flex items-center justify-center"
                         title="Permanently Delete Student Data"
                       >
                         <Trash2 className="w-3 h-3" />
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create New Student Modal */}
      <AnimatePresence>
         {modalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white border-4 border-[#121212] w-full max-w-[600px] shadow-[16px_16px_0px_0px_#121212] overflow-hidden flex flex-col max-h-[90vh]">
                 <div className="bg-[#121212] text-white p-6 flex justify-between items-center shrink-0">
                    <h2 className="font-black text-xl uppercase tracking-widest flex items-center gap-3"><ShieldCheck className="w-6 h-6 text-[#F0C020]"/> Register New Student</h2>
                    <button onClick={() => setModalOpen(false)} className="hover:text-[#F0C020] transition-colors"><X className="w-6 h-6" /></button>
                 </div>
                 <form onSubmit={handleCreateStudent} className="p-6 md:p-8 flex flex-col gap-6 overflow-y-auto">
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Full Name</label>
                         <input required type="text" className="w-full p-3 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-bold text-sm focus:bg-white" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
                       </div>
                       <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Roll / Enrollment No</label>
                         <input type="text" className="w-full p-3 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-bold text-sm focus:bg-white uppercase" value={formData.rollNo} onChange={e=>setFormData({...formData, rollNo: e.target.value})} />
                       </div>

                       <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Branch</label>
                         <select className="w-full p-3 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-bold text-xs uppercase tracking-widest" value={formData.branch} onChange={e=>setFormData({...formData, branch: e.target.value})}>
                           <option>CSE</option><option>IT</option><option>ECE</option><option>Mechanical</option><option>Civil</option>
                         </select>
                       </div>
                       <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Pass Year (Batch)</label>
                         <select className="w-full p-3 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-bold text-xs uppercase tracking-widest" value={formData.batch} onChange={e=>setFormData({...formData, batch: e.target.value})}>
                           <option>2024</option><option>2025</option><option>2026</option><option>2027</option>
                         </select>
                       </div>

                       <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">College Email</label>
                         <input required type="email" placeholder="student@college.edu" className="w-full p-3 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-bold text-sm focus:bg-white" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} />
                       </div>
                       <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Temporary Password</label>
                         <input required minLength={6} type="text" className="w-full p-3 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-mono text-sm focus:bg-white" value={formData.pass} onChange={e=>setFormData({...formData, pass: e.target.value})} />
                       </div>
                     </div>

                     {formError && (
                       <div className="flex items-center gap-3 bg-[#D02020]/10 border-2 border-[#D02020] p-3">
                         <AlertCircle className="w-4 h-4 text-[#D02020] shrink-0" />
                         <p className="font-bold text-xs text-[#D02020] uppercase tracking-wide">{formError}</p>
                       </div>
                     )}

                     <button type="submit" disabled={submitting} className="w-full mt-4 bg-[#121212] text-white py-4 font-black uppercase tracking-widest hover:bg-[#F0C020] hover:text-[#121212] transition-colors border-4 border-transparent hover:border-[#121212] disabled:opacity-50 disabled:cursor-not-allowed">
                       {submitting ? 'Creating...' : 'Create Student Account'}
                     </button>
                 </form>
              </motion.div>
           </div>
         )}
      </AnimatePresence>

    </div>
  );
}
