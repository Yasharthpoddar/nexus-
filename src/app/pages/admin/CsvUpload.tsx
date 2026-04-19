import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  UploadCloud, FileText, CheckCircle2, 
  Download, FileSpreadsheet, ListChecks
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface DueRecord {
  id: string;
  user_id: string;
  department: string;
  amount: number;
  reason: string;
  is_paid: boolean;
  created_at: string;
  users?: { name: string; roll_number: string; branch?: string };
}

export function CsvUpload() {
  const { csvHistory, addCsvUpload } = useAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile]         = useState<File | null>(null);
  const [dept, setDept]         = useState('Library');
  const [dragActive, setDragActive]   = useState(false);
  const [processing, setProcessing]   = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{ inserted: number; errors: number; flagged: number } | null>(null);

  const [flagged, setFlagged] = useState<DueRecord[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  // ── Fetch flagged students from backend ──────────────────────────────────────
  const fetchFlaggedStudents = useCallback(async () => {
    try {
      const token = localStorage.getItem('nexus_token');
      const res   = await fetch(`${API_BASE}/api/dues/flagged`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setFlagged(data.dues || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchFlaggedStudents();
    const interval = setInterval(fetchFlaggedStudents, 30000);
    return () => clearInterval(interval);
  }, [fetchFlaggedStudents]);

  // ── File validation ──────────────────────────────────────────────────────────
  const handleFileSelect = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Only .csv files are accepted');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds 5 MB limit');
      return;
    }
    setFile(f);
    setUploadError(null);
    setUploadResult(null);
  };

  // ── Drag handlers ────────────────────────────────────────────────────────────
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  // ── Upload button ────────────────────────────────────────────────────────────
  const handleProcess = async () => {
    if (!file) { setUploadError('Please select a CSV file first'); return; }
    setProcessing(true);
    setUploadError(null);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('department', dept);

      const token = localStorage.getItem('nexus_token');
      const res   = await fetch(`${API_BASE}/api/dues/upload-csv`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const result = await res.json();
      setUploadResult({ inserted: result.inserted, errors: result.errors, flagged: result.flagged });
      setFile(null);
      addCsvUpload({ filename: file.name, department: dept, rows: result.inserted + result.errors, flagged: result.flagged });
      fetchFlaggedStudents();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // ── Mark paid via backend ────────────────────────────────────────────────────
  const markPaid = async (ids: string[]) => {
    const token = localStorage.getItem('nexus_token');
    for (const id of ids) {
      try {
        await fetch(`${API_BASE}/api/dues/${id}/pay`, {
          method:  'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
        // Optimistic UI update — flip is_paid locally
        setFlagged(prev => prev.map(f => f.id === id ? { ...f, is_paid: true } : f));
      } catch { /* silent — table will show stale */ }
    }
    setSelected([]);
  };

  // ── Derived state ────────────────────────────────────────────────────────────
  const handleZoneClick = () => { if (!file) fileInputRef.current?.click(); };
  const activeFlagged   = flagged.filter(f => !f.is_paid);
  const allSelected     = selected.length === activeFlagged.length && activeFlagged.length > 0;
  const handleSelectAll = () => { allSelected ? setSelected([]) : setSelected(activeFlagged.map(f => f.id)); };

  const stats = [
    { label: 'Total Students', value: 1248 },
    { label: 'Flagged Blocked', value: activeFlagged.length },
    { label: 'Dues Resolved Today', value: flagged.filter(f => f.is_paid).length },
    { label: 'Last Upload', value: csvHistory[0] ? formatDistanceToNow(new Date(csvHistory[0].timestamp)) + ' ago' : 'Never' },
  ];

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10 pb-32">
      
      <div className="border-b-4 border-[#121212] pb-6">
        <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter mb-2">CSV Upload and Dues Reconciliation</h1>
        <p className="font-bold opacity-50 uppercase tracking-widest text-sm">Upload department-wise flat files to flag students with pending dues.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
         {stats.map((s, i) => (
           <div key={i} className="border-4 border-[#121212] shadow-[4px_4px_0px_0px_#121212] bg-white p-5 flex flex-col">
              <p className="font-black text-4xl tracking-tighter mb-1">{s.value}</p>
              <p className="text-xs font-black uppercase tracking-widest opacity-60 mt-auto">{s.label}</p>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
         
         {/* Upload Zone */}
          <div className="flex flex-col gap-4">
            <h2 className="font-black text-2xl uppercase tracking-tighter">Payload Injector</h2>
            <div 
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={handleZoneClick}
              className={`border-4 border-dashed p-10 flex flex-col items-center justify-center text-center transition-colors min-h-[300px] ${!file ? 'cursor-pointer' : ''} ${dragActive ? 'border-[#1040C0] bg-[#1040C0]/10' : file ? 'border-[#121212] bg-white' : 'border-[#121212] bg-[#F9F9F9] hover:bg-white'}`}
            >
               {file ? (
                 <>
                   <FileSpreadsheet className="w-16 h-16 text-[#1040C0] mb-4" />
                   <p className="font-black text-xl tracking-tight uppercase mb-2 break-all">{file.name}</p>
                   <p className="font-bold text-xs uppercase tracking-widest opacity-60 mb-6">{(file.size / 1024).toFixed(1)} KB Ready</p>
                   <button onClick={(e)=>{ e.stopPropagation(); setFile(null); setUploadResult(null); }} className="text-xs font-black uppercase tracking-widest text-[#D02020] hover:underline hover:-translate-y-0.5 transition-transform">Remove File</button>
                 </>
               ) : (
                 <>
                   <UploadCloud className="w-16 h-16 opacity-40 mb-4" />
                   <p className="font-black text-xl tracking-tight uppercase mb-2">Drop your CSV here</p>
                   <button onClick={() => fileInputRef.current?.click()} className="text-sm font-bold opacity-60 hover:opacity-100 hover:underline mb-4">or click to browse</button>
                   <div className="font-bold text-[10px] uppercase tracking-widest opacity-40">
                     <p>Accepted .csv only | Max 5MB</p>
                     <p className="mt-1">Required columns: Roll No, Name, Amount Due</p>
                   </div>
                 </>
               )}
               <input type="file" className="hidden" ref={fileInputRef} accept=".csv" onChange={(e) => { if(e.target.files?.[0]) { handleFileSelect(e.target.files[0]); e.target.value = ''; } }} />
            </div>

            {/* Error strip */}
            {uploadError && (
              <div className="border-2 border-[#D02020] bg-[#D02020]/10 p-3 font-black text-xs uppercase tracking-widest text-[#D02020]">
                ⚠ {uploadError}
              </div>
            )}

            {/* Success strip */}
            {uploadResult && (
              <div className="border-2 border-[#121212] bg-[#F0C020]/20 p-3 font-black text-xs uppercase tracking-widest text-[#121212] flex gap-6">
                <span>✓ {uploadResult.inserted} students flagged</span>
                {uploadResult.errors > 0 && <span className="text-[#D02020]">✗ {uploadResult.errors} rows skipped</span>}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
               <select className="flex-1 p-4 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-bold uppercase tracking-widest text-xs" value={dept} onChange={e=>setDept(e.target.value)}>
                  <option value="Library">Library</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Sports">Sports</option>
                  <option value="Accounts">Accounts</option>
               </select>
               <button
                 disabled={!file || processing}
                 onClick={handleProcess}
                 className="flex-1 bg-[#121212] text-white font-black uppercase tracking-widest text-xs border-2 border-[#121212] disabled:opacity-50 hover:bg-[#1040C0] hover:border-[#1040C0] transition-colors flex items-center justify-center gap-2"
               >
                 {processing ? 'Processing...' : 'Upload and Process'}
               </button>
               <button disabled={!file} className="hidden sm:flex px-6 border-2 border-[#121212] font-black uppercase tracking-widest text-xs bg-white text-[#121212] disabled:opacity-50 hover:bg-[#F9F9F9] items-center justify-center">
                 Preview File
               </button>
            </div>
            <a href="#" className="font-black text-[10px] uppercase tracking-widest text-[#1040C0] hover:underline self-end">Download CSV Template</a>
         </div>

         {/* Flagged Table */}
         <div className="flex flex-col gap-4">
            <h2 className="font-black text-2xl uppercase tracking-tighter">Flagged Students Action Desk</h2>
            {selected.length > 0 && (
              <div className="bg-[#121212] text-white p-3 border-4 border-[#F0C020] flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-widest ml-2">{selected.length} Selected</span>
                <button onClick={() => markPaid(selected)} className="px-4 py-2 border-2 border-white font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-[#121212] flex items-center gap-2">
                  <ListChecks className="w-3 h-3" /> Mark Selected as Paid
                </button>
              </div>
            )}
            <div className="border-4 border-[#121212] bg-white shadow-[8px_8px_0px_0px_#121212] overflow-x-auto h-full">
               <table className="w-full text-left font-bold text-xs">
                 <thead className="bg-[#121212] text-white uppercase tracking-widest text-[10px]">
                   <tr>
                     <th className="p-3 text-center">
                        <input type="checkbox" className="accent-[#1040C0]" checked={allSelected} onChange={handleSelectAll} />
                     </th>
                     <th className="p-3">Roll No</th><th className="p-3">Name</th><th className="p-3">Due</th><th className="p-3">Dept</th><th className="p-3">Status</th><th className="p-3 pr-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y-2 divide-[#121212]">
                   {flagged.length === 0 ? (
                     <tr><td colSpan={7} className="p-6 text-center font-bold uppercase tracking-widest opacity-40">No flagged students</td></tr>
                   ) : flagged.map(f => {
                     const statusLabel = f.is_paid ? 'Paid' : 'Blocked';
                     return (
                       <tr key={f.id} className={`${selected.includes(f.id) ? 'bg-[#F0C020]/20' : 'hover:bg-[#F9F9F9]'} ${f.is_paid ? 'opacity-40' : ''}`}>
                         <td className="p-3 text-center">
                           <input type="checkbox" className="accent-[#1040C0]" disabled={f.is_paid} checked={selected.includes(f.id)} onChange={()=>setSelected(p=>p.includes(f.id)?p.filter(x=>x!==f.id):[...p,f.id])} />
                         </td>
                         <td className="p-3 font-mono">{f.users?.roll_number ?? '—'}</td>
                         <td className="p-3 uppercase">{f.users?.name ?? '—'}</td>
                         <td className="p-3 text-[#D02020]">₹{f.amount}</td>
                         <td className="p-3 opacity-60">{f.department}</td>
                         <td className="p-3 text-[10px] uppercase tracking-widest">
                           <span className={`px-2 py-0.5 ${f.is_paid ? 'bg-[#121212] text-white' : 'bg-[#D02020] text-white'}`}>{statusLabel}</span>
                         </td>
                         <td className="p-3 pr-4 flex gap-2 justify-end">
                           {!f.is_paid && (
                             <button onClick={()=>markPaid([f.id])} className="px-2 py-1 bg-[#121212] text-white text-[10px] uppercase tracking-widest hover:bg-[#1040C0]">Paid</button>
                           )}
                           <button className="px-2 py-1 border-2 border-[#121212] text-[10px] uppercase tracking-widest">View</button>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
            </div>
         </div>
      </div>

      {/* Upload History */}
      <div>
         <h2 className="font-black text-2xl uppercase tracking-tighter mb-4">Upload History Ledger</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {csvHistory.map(h => (
              <div key={h.id} className="border-4 border-[#121212] bg-[#F9F9F9] p-5 shadow-[4px_4px_0px_0px_#121212] flex flex-col gap-3">
                 <div className="flex items-center gap-3 font-black text-sm uppercase tracking-widest break-all">
                   <FileText className="w-5 h-5 shrink-0 opacity-40" /> {h.filename}
                 </div>
                 <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                   <span className="bg-white border-2 border-[#121212] px-2 py-0.5">{format(new Date(h.timestamp), 'MMM dd, HH:mm')}</span>
                   <span className="bg-white border-2 border-[#121212] px-2 py-0.5 text-[#1040C0]">{h.department}</span>
                 </div>
                 <div className="flex gap-4 mt-2">
                   <div className="flex flex-col">
                     <span className="font-black text-2xl tracking-tighter">{h.rows}</span>
                     <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Total Rows</span>
                   </div>
                   <div className="flex flex-col text-[#D02020]">
                     <span className="font-black text-2xl tracking-tighter">{h.flagged}</span>
                     <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Flagged</span>
                   </div>
                 </div>
                 <a href="#" className="font-black text-[10px] uppercase tracking-widest text-right hover:underline mt-auto pt-2 border-t-2 border-[#121212] flex items-center justify-end gap-1">
                   Download Log <Download className="w-3 h-3" />
                 </a>
              </div>
            ))}
         </div>
      </div>

    </div>
  );
}
