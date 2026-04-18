import React, { useState } from 'react';
import { useLab } from '../../context/LabContext';
import { format } from 'date-fns';
import { Search, Filter, ArrowUpDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

export function PendingClearances() {
  const { labStudents, approveStudent, flagStudent } = useLab();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [daysFilter, setDaysFilter] = useState('');
  const [itemsFilter, setItemsFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('oldest');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quickApproveId, setQuickApproveId] = useState<string | null>(null);

  const pendingList = labStudents.filter(s => s.status === 'Pending').filter(s => {
    if (searchTerm && !s.name.toLowerCase().includes(searchTerm.toLowerCase()) && !s.rollNo.includes(searchTerm)) return false;
    if (branchFilter && s.branch !== branchFilter) return false;
    
    const days = Math.floor((new Date().getTime() - new Date(s.submittedAt).getTime()) / (1000 * 3600 * 24));
    if (daysFilter === 'overdue' && days <= 2) return false;
    if (daysFilter === 'fresh' && days > 2) return false;

    const allClear = s.equipment.labManual === 'Returned' && s.equipment.equipmentKit === 'Returned' && 
                     s.equipment.safetyDeposit === 'Returned' && s.equipment.labCard === 'Returned';
                     
    if (itemsFilter === 'pending' && allClear) return false;
    if (itemsFilter === 'returned' && !allClear) return false;

    return true;
  }).sort((a, b) => {
    const aTime = new Date(a.submittedAt).getTime();
    const bTime = new Date(b.submittedAt).getTime();
    return sortOrder === 'oldest' ? aTime - bTime : bTime - aTime;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === pendingList.length && pendingList.length > 0) setSelectedIds([]);
    else setSelectedIds(pendingList.map(s => s.id));
  };

  const executeQuickApprove = () => {
    if (quickApproveId) {
      approveStudent(quickApproveId, 'Quick Approved from Queue');
      setQuickApproveId(null);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-[#121212] pb-6">
        <div>
          <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter mb-2">Pending Applications</h1>
          <p className="font-bold opacity-50 uppercase tracking-widest text-sm">
             Evaluate and verify Lab conditions prior to forwarding to Stage 2.
          </p>
        </div>
        <div className="bg-[#121212] text-white font-black text-lg px-4 py-2 border-4 border-[#121212] shadow-[4px_4px_0px_0px_#F0C020]">
          {pendingList.length} IN QUEUE
        </div>
      </div>

      <div className="bg-white border-4 border-[#121212] p-4 flex flex-col xl:flex-row gap-4 shadow-[4px_4px_0px_0px_#121212]">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
          <input 
            type="text" 
            placeholder="Search Name or Roll No..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#F9F9F9] border-2 border-[#121212] p-3 pl-10 font-bold uppercase tracking-widest text-xs outline-none focus:bg-white"
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-4">
          <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="bg-[#F9F9F9] border-2 border-[#121212] p-3 font-bold uppercase tracking-widest text-xs outline-none focus:bg-white flex-1 md:w-40">
            <option value="">All Branches</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Tech">Information Tech</option>
          </select>
          
          <select value={daysFilter} onChange={e => setDaysFilter(e.target.value)} className="bg-[#F9F9F9] border-2 border-[#121212] p-3 font-bold uppercase tracking-widest text-xs outline-none focus:bg-white flex-1 md:w-40">
            <option value="">All Wait Times</option>
            <option value="fresh">Fresh (0-2 Days)</option>
            <option value="overdue">Overdue (&gt;2 Days)</option>
          </select>
          
          <select value={itemsFilter} onChange={e => setItemsFilter(e.target.value)} className="bg-[#F9F9F9] border-2 border-[#121212] p-3 font-bold uppercase tracking-widest text-xs outline-none focus:bg-white flex-1 md:w-48 text-[#1040C0]">
            <option value="">All Item Status</option>
            <option value="returned">All Returned</option>
            <option value="pending">Items Pending</option>
          </select>

          <button onClick={() => setSortOrder(prev => prev === 'oldest' ? 'newest' : 'oldest')} className="bg-[#121212] text-white px-4 py-3 flex items-center gap-2 font-black uppercase text-xs tracking-widest hover:bg-[#1040C0] transition-colors">
            <ArrowUpDown className="w-4 h-4" /> {sortOrder === 'oldest' ? 'Oldest First' : 'Newest First'}
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-[#F0C020] border-4 border-[#121212] p-4 flex items-center justify-between sticky top-[80px] z-20 shadow-[8px_8px_0px_#121212]">
          <span className="font-black text-sm uppercase tracking-widest">{selectedIds.length} Applicants Selected</span>
          <div className="flex gap-4">
             <button className="px-4 py-2 border-2 border-[#121212] bg-[#121212] text-white font-black uppercase tracking-widest text-xs hover:bg-[#1040C0]">
               Batch Approve
             </button>
             <button className="px-4 py-2 border-2 border-[#121212] bg-white font-black uppercase tracking-widest text-xs hover:bg-white/80">
               Batch Flag
             </button>
          </div>
        </div>
      )}

      <div className="border-4 border-[#121212] bg-white shadow-[8px_8px_0px_0px_#121212] overflow-x-auto relative min-h-[400px]">
        {pendingList.length > 0 ? (
          <table className="w-full text-left font-bold text-xs">
            <thead className="bg-[#121212] text-white uppercase tracking-widest text-[10px]">
              <tr>
                <th className="p-4 text-center w-12">
                   <input type="checkbox" className="accent-[#1040C0] w-4 h-4" checked={selectedIds.length === pendingList.length && pendingList.length > 0} onChange={handleSelectAll} />
                </th>
                <th className="p-4">Student Info</th>
                <th className="p-4">Submission Context</th>
                <th className="p-4">Lab Items Status</th>
                <th className="p-4">Docs</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#121212]">
              {pendingList.map(s => {
                 const days = Math.floor((new Date().getTime() - new Date(s.submittedAt).getTime()) / (1000 * 3600 * 24));
                 const isOverdue = days > 2;
                 const allClear = s.equipment.labManual === 'Returned' && s.equipment.equipmentKit === 'Returned' && 
                                  s.equipment.safetyDeposit === 'Returned' && s.equipment.labCard === 'Returned';

                 return (
                   <tr key={s.id} className={`hover:bg-[#F9F9F9] ${isOverdue ? 'border-l-4 border-l-[#D02020]' : ''}`}>
                      <td className="p-4 text-center">
                         <input type="checkbox" className="accent-[#1040C0] w-4 h-4" checked={selectedIds.includes(s.id)} onChange={() => {
                           setSelectedIds(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])
                         }} />
                      </td>
                      <td className="p-4">
                         <div className="font-black uppercase tracking-tight text-sm">{s.name}</div>
                         <div className="text-[10px] font-mono opacity-80 mt-1">{s.rollNo}</div>
                         <div className="text-[10px] uppercase tracking-widest opacity-50 mt-1">{s.branch}</div>
                      </td>
                      <td className="p-4">
                         <div className="mb-2 uppercase opacity-80">{format(new Date(s.submittedAt), 'MMMM dd')}</div>
                         <div className="flex items-center gap-2">
                           <span className="bg-[#F0F0F0] px-2 py-1 text-[10px] border border-[#121212]">{days} Days</span>
                           {isOverdue && <span className="bg-[#D02020] text-white px-2 py-1 text-[10px] uppercase tracking-widest">OVERDUE</span>}
                         </div>
                      </td>
                      <td className="p-4 uppercase tracking-widest text-[10px]">
                         {allClear ? (
                           <span className="bg-[#121212] text-white px-3 py-1.5 inline-block">All Returned</span>
                         ) : (
                           <span className="bg-[#D02020] text-white px-3 py-1.5 inline-block">Items Pending</span>
                         )}
                      </td>
                      <td className="p-4">
                         <div className="w-8 h-8 rounded-full border-2 border-[#121212] flex items-center justify-center bg-[#F9F9F9]">
                           {s.documents.length}
                         </div>
                      </td>
                      <td className="p-4 pr-6">
                         <div className="flex justify-end gap-3 items-center relative">
                            {quickApproveId === s.id ? (
                               <div className="absolute right-0 bg-white border-4 border-[#121212] shadow-[4px_4px_0px_#121212] p-4 flex flex-col gap-3 z-30 min-w-[200px]">
                                  <span className="font-black text-xs uppercase tracking-widest whitespace-nowrap">Forward to HOD?</span>
                                  <div className="flex gap-2 w-full">
                                    <button onClick={() => setQuickApproveId(null)} className="flex-1 py-1 bg-[#F9F9F9] border-2 border-[#121212] text-[10px] font-bold uppercase transition-colors hover:bg-gray-200">Cancel</button>
                                    <button onClick={executeQuickApprove} className="flex-1 py-1 bg-[#121212] text-white border-2 border-[#121212] text-[10px] font-bold uppercase hover:bg-black">Confirm</button>
                                  </div>
                               </div>
                            ) : null}
                            <button onClick={() => setQuickApproveId(s.id)} disabled={!allClear} className="font-black uppercase tracking-widest text-[10px] px-3 py-2 border-2 text-[#121212] border-transparent hover:border-[#121212] disabled:opacity-30 disabled:hover:border-transparent transition-all">
                              Quick Approve
                            </button>
                            <button onClick={() => navigate(`/lab/review/${s.id}`)} className="bg-[#121212] text-white font-black uppercase tracking-widest text-[10px] px-4 py-2 border-2 border-[#121212] hover:bg-[#1040C0] transition-colors whitespace-nowrap">
                              Open Profile
                            </button>
                         </div>
                      </td>
                   </tr>
                 )
              })}
            </tbody>
          </table>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F0FFE0] text-[#121212]">
            <CheckCircle2 className="w-16 h-16 opacity-40 mb-4 text-[#2E8B57]" />
            <h3 className="font-black text-2xl uppercase tracking-tighter">You are all caught up</h3>
            <p className="font-bold text-sm uppercase tracking-widest opacity-60">No pending lab clearances</p>
          </div>
        )}
      </div>

    </div>
  );
}
