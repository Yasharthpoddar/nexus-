import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  Search, FileBadge, Download, CheckCircle2, QrCode, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function CertificateGenerator() {
  const { students, issueCertificate } = useAdmin();
  
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [selected, setSelected] = useState<string[]>([]);
  const [previewCert, setPreviewCert] = useState<any>(null);

  const eligibleStudents = students.filter(s => s.certStatus === 'Ready to Issue' || s.certStatus === 'Already Issued');

  const filtered = eligibleStudents.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = branchFilter ? s.branch === branchFilter : true;
    const matchesStatus = statusFilter === 'All' ? true : s.certStatus === statusFilter;
    return matchesSearch && matchesBranch && matchesStatus;
  });

  const generateBulk = () => {
    selected.forEach(id => issueCertificate(id));
    setSelected([]);
  };

  const CertificateModal = () => (
    <AnimatePresence>
      {previewCert && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        >
          <div className="bg-white border-8 border-[#121212] w-full max-w-[800px] relative shadow-[16px_16px_0px_0px_#F0C020]">
             
             {/* Header Header */}
             <div className="bg-[#121212] text-white p-8 flex justify-between items-center border-b-8 border-[#F0C020]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#F0C020] rounded-full flex items-center justify-center text-[#121212] font-black text-2xl tracking-tighter shadow-inner">
                    NU
                  </div>
                  <div>
                    <h2 className="font-black text-2xl uppercase tracking-widest">Nexus University</h2>
                    <p className="font-bold text-[10px] tracking-widest uppercase opacity-80">Automated Clearance Protocol</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm uppercase opacity-50">CERT NO.</p>
                  <p className="font-black text-lg tracking-widest">{previewCert.certificateNo}</p>
                </div>
             </div>

             {/* Body */}
             <div className="p-12 text-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-white to-[#F9F9F9]">
                <p className="font-black text-sm uppercase tracking-widest opacity-60 mb-8 border-b-2 border-dashed border-[#121212] pb-6">This certifies that</p>
                <h1 className="font-black text-4xl md:text-6xl uppercase tracking-tighter mb-4">{previewCert.name}</h1>
                <p className="font-bold text-sm uppercase tracking-widest opacity-80 mb-10 max-w-sm mx-auto leading-relaxed">
                  has successfully cleared all departmental dues and completed the requirements for the
                </p>
                
                <div className="inline-block border-4 border-[#121212] px-8 py-3 bg-[#F9F9F9] shadow-[4px_4px_0px_0px_#121212] mb-12 transform -rotate-1">
                  <p className="font-black text-xl uppercase tracking-widest">{previewCert.branch} BATCH OF '{previewCert.batch.substring(2)}</p>
                </div>

                <div className="flex justify-between items-end border-t-4 border-[#121212] pt-6 relative">
                   <div className="text-left font-bold text-[10px] uppercase tracking-widest space-y-1">
                      <p>Roll Number: <span className="font-black ml-2 text-sm">{previewCert.rollNo}</span></p>
                      <p>Date Issued: <span className="font-black ml-2 text-sm">{previewCert.issueDate?.substring(0,10)}</span></p>
                   </div>
                   
                   {/* QR Placeholder */}
                   <div className="w-24 h-24 border-4 border-[#121212] bg-[#F0F0F0] flex items-center justify-center relative translate-y-2">
                     <QrCode className="w-16 h-16 opacity-30" />
                     {/* Issued Stamp */}
                     <div className="absolute inset-0 flex items-center justify-center rotate-[-15deg]">
                       <div className="border-4 border-[#D02020] text-[#D02020] px-3 py-1 font-black text-[10px] uppercase tracking-widest bg-white shadow-[2px_2px_0px_0px_#D02020]">
                         OFFICIAL
                       </div>
                     </div>
                   </div>
                </div>
             </div>

             {/* Action bar relative to modal */}
             <div className="absolute -top-14 right-0 flex gap-4">
                <button className="bg-white border-4 border-[#121212] text-[#121212] px-4 py-2 font-black uppercase text-xs hover:bg-[#121212] hover:text-white flex items-center gap-2">
                   <Download className="w-4 h-4" /> Download PDF
                </button>
                <button onClick={() => setPreviewCert(null)} className="w-10 h-10 bg-[#D02020] border-4 border-[#121212] text-white flex items-center justify-center hover:bg-black">
                   <X className="w-5 h-5" />
                </button>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 pb-32">
      
      <div>
        <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter mb-2">Certificate Generator</h1>
        <p className="font-bold opacity-50 uppercase tracking-widest text-sm">Issue and manage final clearance certificates.</p>
      </div>

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
        <select className="p-4 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-bold uppercase text-xs tracking-widest" value={branchFilter} onChange={e=>setBranchFilter(e.target.value)}>
           <option value="">All Branches</option>
           <option>CSE</option><option>IT</option>
        </select>
        <select className="p-4 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-bold uppercase text-xs tracking-widest" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
           <option>All Status</option><option>Ready to Issue</option><option>Already Issued</option>
        </select>
      </div>

      {selected.length > 0 && (
        <div className="bg-[#121212] text-white p-4 border-4 border-[#F0C020] shadow-[4px_4px_0px_0px_#121212] flex items-center justify-between sticky top-20 z-20">
           <span className="font-bold uppercase tracking-widest text-xs ml-2">{selected.length} Ready Selected</span>
           <button onClick={generateBulk} className="flex items-center gap-2 px-6 py-3 border-2 border-[#F0C020] text-[#F0C020] font-black uppercase text-xs tracking-widest hover:bg-[#F0C020] hover:text-[#121212] transition-colors">
             <FileBadge className="w-4 h-4" /> Generate Selected Certificates
           </button>
        </div>
      )}

      <div className="border-4 border-[#121212] bg-white shadow-[8px_8px_0px_0px_#121212] overflow-x-auto">
         <table className="w-full text-left min-w-[900px] border-collapse">
           <thead>
             <tr className="bg-[#121212] text-white">
               <th className="p-4 pl-6 text-center w-12">
                  <input type="checkbox" className="accent-[#F0C020]" />
               </th>
               <th className="p-4 font-black uppercase tracking-widest text-xs">Name</th>
               <th className="p-4 font-black uppercase tracking-widest text-xs">Roll No</th>
               <th className="p-4 font-black uppercase tracking-widest text-xs text-center">Clearance Status</th>
               <th className="p-4 font-black uppercase tracking-widest text-xs text-center">Cert Status</th>
               <th className="p-4 font-black uppercase tracking-widest text-xs text-right pr-6">Action</th>
             </tr>
           </thead>
           <tbody className="divide-y-2 divide-[#121212]">
             {filtered.map(s => (
               <tr key={s.id} className={`${selected.includes(s.id) ? 'bg-[#F0C020]/20' : 'hover:bg-[#F9F9F9]'}`}>
                 <td className="p-4 pl-6 text-center">
                    <input 
                      type="checkbox" 
                      className="accent-[#F0C020]" 
                      disabled={s.certStatus === 'Already Issued'} 
                      checked={selected.includes(s.id)} 
                      onChange={()=>setSelected(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p,s.id])} 
                    />
                 </td>
                 <td className="p-4 font-black tracking-tight">{s.name}</td>
                 <td className="p-4 font-mono text-sm uppercase">{s.rollNo}</td>
                 <td className="p-4 text-center">
                    <span className="bg-[#121212] text-white font-black text-[10px] uppercase tracking-widest px-2 py-1 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#F0C020]" /> All Cleared
                    </span>
                 </td>
                 <td className="p-4 text-center">
                    <span className={`font-bold text-[10px] uppercase tracking-widest px-2 py-1 ${s.certStatus === 'Already Issued' ? 'border-2 border-[#1040C0] text-[#1040C0]' : 'border-2 border-[#121212]'}`}>
                       {s.certStatus}
                    </span>
                 </td>
                 <td className="p-4 pr-6 flex gap-2 justify-end">
                    {s.certStatus === 'Ready to Issue' ? (
                       <button onClick={()=>issueCertificate(s.id)} className="px-4 py-2 bg-[#121212] text-white font-black uppercase text-[10px] tracking-widest hover:bg-black">
                         Issue Certificate
                       </button>
                    ) : (
                       <>
                         <button className="px-3 py-2 border-2 border-[#121212] bg-white font-black uppercase text-[10px] hover:bg-[#F0F0F0]">
                           <Download className="w-4 h-4" />
                         </button>
                         <button onClick={()=>setPreviewCert(s)} className="px-4 py-2 border-2 border-[#121212] bg-white font-black uppercase text-[10px] tracking-widest hover:bg-[#121212] hover:text-white">
                           View
                         </button>
                       </>
                    )}
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
      </div>

      <CertificateModal />
    </div>
  );
}
