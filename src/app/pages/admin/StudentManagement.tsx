import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Link } from 'react-router';
import { 
  Search, Filter, ShieldOff, Download, UserX, X
} from 'lucide-react';

export function StudentManagement() {
  const { students, toggleStudentBlock } = useAdmin();
  
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [batchFilter, setBatchFilter] = useState('');
  
  const [selected, setSelected] = useState<string[]>([]);

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
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 pb-32">
      
      <div>
        <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter mb-2">Student Management</h1>
        <p className="font-bold opacity-50 uppercase tracking-widest text-sm">Control clearance overrides and bulk operations.</p>
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
                         onClick={() => toggleStudentBlock(s.id)}
                         className={`px-4 py-2 font-black uppercase tracking-widest text-[10px] transition-colors border-2 ${s.isBlocked ? 'border-[#121212] bg-[#121212] text-white' : 'border-[#D02020] text-[#D02020] hover:bg-[#D02020] hover:text-white'}`}
                       >
                         {s.isBlocked ? 'Unblock' : 'Block'}
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
