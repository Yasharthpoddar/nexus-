import React, { useState } from 'react';
import { useLab, EquipmentStatus } from '../../context/LabContext';
import { CheckCircle2, Download, Search, CheckSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export function EquipmentTracker() {
  const { labStudents, toggleEquipmentStatus, executeBulkReturn } = useLab();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState('');

  const displayList = labStudents.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTracked = labStudents.length;
  const itemsAllReturned = labStudents.filter(s => 
    s.equipment.labManual === 'Returned' && 
    s.equipment.equipmentKit === 'Returned' && 
    s.equipment.safetyDeposit === 'Returned' && 
    s.equipment.labCard === 'Returned'
  ).length;
  const itemsPending = totalTracked - itemsAllReturned;
  const overdueReturns = labStudents.filter(s => 
    (s.equipment.labManual === 'Pending' || s.equipment.equipmentKit === 'Pending' || s.equipment.safetyDeposit === 'Pending' || s.equipment.labCard === 'Pending') && 
    (new Date().getTime() - new Date(s.submittedAt).getTime()) / (1000 * 3600 * 24) > 2
  ).length;

  const handleToggle = (id: string, key: keyof EquipmentStatus) => {
    toggleEquipmentStatus(id, key);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === displayList.length && displayList.length > 0) setSelectedIds([]);
    else setSelectedIds(displayList.map(s => s.id));
  };

  const handleBulkReturn = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Mark ALL equipment returned for ${selectedIds.length} selected students?`)) {
      executeBulkReturn(selectedIds);
      setSelectedIds([]);
      setToastMsg('All items marked as returned for selected.');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handleExport = () => {
    setToastMsg('Export prepared. Downloading CSV...');
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10 pb-32">
       
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 right-10 bg-[#121212] text-white border-4 border-[#F0C020] p-4 font-black uppercase tracking-widest text-xs z-50 shadow-[8px_8px_0px_0px_#121212] flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-[#F0C020]" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-b-4 border-[#121212] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter mb-2">Lab Equipment Return Tracker</h1>
          <p className="font-bold opacity-50 uppercase tracking-widest text-sm">
            Track which students have returned lab items. This data feeds into the clearance checklist.
          </p>
        </div>
        <button onClick={handleExport} className="px-6 py-3 bg-white border-4 border-[#121212] font-black uppercase tracking-widest text-xs hover:bg-[#F9F9F9] flex items-center gap-2 whitespace-nowrap shadow-[4px_4px_0px_0px_#121212] hover:translate-y-1 hover:shadow-none transition-all">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="border-4 border-[#121212] bg-white p-5 shadow-[4px_4px_0px_0px_#121212] flex flex-col">
           <p className="font-black text-4xl tracking-tighter mb-1">{totalTracked}</p>
           <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-auto">Total Tracked</p>
        </div>
        <div className="border-4 border-[#121212] bg-white p-5 shadow-[4px_4px_0px_0px_#121212] flex flex-col">
           <p className="font-black text-4xl tracking-tighter mb-1 text-[#1040C0]">{itemsAllReturned}</p>
           <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-auto">Items All Returned</p>
        </div>
        <div className="border-4 border-[#121212] bg-[#F9F9F9] p-5 shadow-[4px_4px_0px_0px_#121212] flex flex-col">
           <p className="font-black text-4xl tracking-tighter mb-1 text-[#D02020]">{itemsPending}</p>
           <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-auto">Students with Pending</p>
        </div>
        <div className="border-4 border-[#D02020] bg-[#FFF3CD] p-5 shadow-[4px_4px_0px_0px_#121212] flex flex-col">
           <p className="font-black text-4xl tracking-tighter mb-1 text-[#D02020]">{overdueReturns}</p>
           <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-auto">Overdue Returns</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#F9F9F9] border-4 border-[#121212] p-2">
            <div className="relative w-full md:w-96">
               <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
               <input 
                 type="text" 
                 placeholder="SEARCH NAME OR ROLL NO" 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full bg-white border-2 border-[#121212] p-3 pl-10 font-black uppercase tracking-widest text-xs outline-none focus:border-[#1040C0]"
               />
            </div>
            
            {selectedIds.length > 0 && (
               <button onClick={handleBulkReturn} className="w-full md:w-auto px-6 py-3 bg-[#121212] text-white border-2 border-[#121212] font-black uppercase tracking-widest text-xs hover:bg-[#1040C0] flex items-center justify-center gap-2">
                 <CheckSquare className="w-4 h-4" /> Mark All Returned ({selectedIds.length})
               </button>
            )}
         </div>

         <div className="border-4 border-[#121212] bg-white shadow-[8px_8px_0px_0px_#121212] overflow-x-auto">
            <table className="w-full text-left font-bold text-xs">
              <thead className="bg-[#121212] text-white uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="p-3 text-center w-12">
                     <input type="checkbox" className="accent-[#1040C0] w-4 h-4" checked={selectedIds.length === displayList.length && displayList.length > 0} onChange={handleSelectAll} />
                  </th>
                  <th className="p-3">Student Info</th>
                  <th className="p-3 text-center border-l-2 border-[#121212]/20">Lab Manual</th>
                  <th className="p-3 text-center border-l-2 border-[#121212]/20">Equip Kit</th>
                  <th className="p-3 text-center border-l-2 border-[#121212]/20">Safety Dep</th>
                  <th className="p-3 text-center border-l-2 border-[#121212]/20">Lab Card</th>
                  <th className="p-3 text-right">Overall Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#121212]">
                {displayList.map(s => {
                   const allClear = s.equipment.labManual === 'Returned' && s.equipment.equipmentKit === 'Returned' && 
                                    s.equipment.safetyDeposit === 'Returned' && s.equipment.labCard === 'Returned';
                   return (
                     <tr key={s.id} className="hover:bg-[#F9F9F9]">
                        <td className="p-3 text-center">
                           <input type="checkbox" className="accent-[#1040C0] w-4 h-4" checked={selectedIds.includes(s.id)} onChange={() => {
                             setSelectedIds(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])
                           }} />
                        </td>
                        <td className="p-3 border-r-2 border-[#121212]/10 w-64 pb-4">
                           <div className="font-black uppercase tracking-tight text-sm line-clamp-1">{s.name}</div>
                           <div className="text-[10px] font-mono opacity-80 mt-1">{s.rollNo}</div>
                           <div className="text-[10px] uppercase tracking-widest opacity-50 mt-1">{s.branch}</div>
                        </td>
                        
                        {/* Equipment Columns - Clickable */}
                        {(['labManual', 'equipmentKit', 'safetyDeposit', 'labCard'] as (keyof EquipmentStatus)[]).map(key => (
                          <td key={key} className="p-3 text-center align-middle border-r-2 border-[#121212]/10 cursor-pointer hover:bg-[#F0C020]/20 transition-colors" onClick={() => handleToggle(s.id, key)}>
                             {s.equipment[key] === 'Returned' ? (
                               <div className="bg-[#121212] text-white text-[10px] uppercase font-black tracking-widest px-2 py-1 mx-auto w-max shadow-[2px_2px_0px_0px_#121212]">
                                 Returned
                               </div>
                             ) : (
                               <div className="bg-[#D02020] text-white text-[10px] uppercase font-black tracking-widest px-2 py-1 mx-auto w-max shadow-[2px_2px_0px_0px_#121212]">
                                 Pending
                               </div>
                             )}
                          </td>
                        ))}

                        <td className="p-3 text-right">
                           {allClear ? (
                             <span className="font-black uppercase text-xs tracking-widest bg-[#121212] text-white px-3 py-1.5 border-2 border-[#121212]">All Clear</span>
                           ) : (
                             <span className="font-black uppercase text-xs tracking-widest bg-[#D02020] text-white px-3 py-1.5 border-2 border-[#D02020]">Items Pending</span>
                           )}
                        </td>
                     </tr>
                   )
                })}
                {displayList.length === 0 && (
                   <tr>
                     <td colSpan={7} className="p-8 text-center text-xs font-black opacity-50 uppercase tracking-widest">
                       No students found matching your search.
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
         </div>
      </div>

    </div>
  );
}
