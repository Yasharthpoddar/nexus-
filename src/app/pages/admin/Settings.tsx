import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  CheckCircle2, ArrowUp, ArrowDown, Save
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

export function Settings() {
  const { settings, updateSettingsToggle, updatePipelineOrder } = useAdmin();
  
  const [localPipeline, setLocalPipeline] = useState([...settings.pipelineOrder]);
  const [localTpl, setLocalTpl] = useState({ ...settings.templates });
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const moveUp = (index: number) => {
    if(index === 0) return;
    const n = [...localPipeline];
    [n[index-1], n[index]] = [n[index], n[index-1]];
    setLocalPipeline(n);
  };

  const moveDown = (index: number) => {
    if(index === localPipeline.length-1) return;
    const n = [...localPipeline];
    [n[index+1], n[index]] = [n[index], n[index+1]];
    setLocalPipeline(n);
  };

  const handleSavePipeline = () => {
    updatePipelineOrder(localPipeline);
    triggerToast('Pipeline Configuration Saved');
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10 pb-32">
       
       <div className="border-b-4 border-[#121212] pb-6">
          <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tighter mb-2">System Settings</h1>
          <p className="font-bold opacity-50 uppercase tracking-widest text-sm">Configure core clearance parameters and notification templates.</p>
       </div>

       <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          
          <div className="flex flex-col gap-10">
             {/* Configuration */}
             <div className="border-4 border-[#121212] bg-white p-8 lg:p-10 shadow-[8px_8px_0px_0px_#121212] flex flex-col gap-8">
                <h2 className="font-black text-2xl uppercase tracking-tighter border-b-4 border-[#121212] pb-4">Configuration Toggles</h2>
                
                <div className="flex flex-col gap-6 font-bold text-xs uppercase tracking-widest">
                   
                   <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span>Email Nudges</span>
                        <span className="text-[10px] opacity-50">Automated 48h SLA reminders</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-0.5 border-2 border-[#121212] ${settings.emailNudgeActive ? 'bg-[#121212] text-white' : 'bg-white'}`}>{settings.emailNudgeActive ? 'Active' : 'Offline'}</span>
                        <button onClick={()=>updateSettingsToggle('emailNudgeActive')} className={`w-12 h-6 border-2 border-[#121212] relative transition-colors ${settings.emailNudgeActive ? 'bg-[#121212]' : 'bg-[#E0E0E0]'}`}>
                           <div className={`w-4 h-4 bg-white border-2 border-[#121212] absolute top-0.5 transition-all ${settings.emailNudgeActive ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                   </div>

                   <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span>Payment Gateway</span>
                        <span className="text-[10px] opacity-50">Accepting Dues Integrations</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-0.5 border-2 border-[#121212] ${settings.paymentGatewayActive ? 'bg-[#1040C0] text-white' : 'bg-white'}`}>{settings.paymentGatewayActive ? 'Active' : 'Offline'}</span>
                        <button onClick={()=>updateSettingsToggle('paymentGatewayActive')} className={`w-12 h-6 border-2 border-[#121212] relative transition-colors ${settings.paymentGatewayActive ? 'bg-[#121212]' : 'bg-[#E0E0E0]'}`}>
                           <div className={`w-4 h-4 bg-white border-2 border-[#121212] absolute top-0.5 transition-all ${settings.paymentGatewayActive ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                   </div>

                   <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span>QR Verification URL</span>
                        <span className="text-[10px] opacity-50">Live cert scans enabled</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-0.5 border-2 border-[#121212] ${settings.qrServiceOnline ? 'bg-[#121212] text-white' : 'bg-white'}`}>{settings.qrServiceOnline ? 'Active' : 'Offline'}</span>
                        <button onClick={()=>updateSettingsToggle('qrServiceOnline')} className={`w-12 h-6 border-2 border-[#121212] relative transition-colors ${settings.qrServiceOnline ? 'bg-[#121212]' : 'bg-[#E0E0E0]'}`}>
                           <div className={`w-4 h-4 bg-white border-2 border-[#121212] absolute top-0.5 transition-all ${settings.qrServiceOnline ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                   </div>

                </div>
             </div>

             {/* Pipeline Map */}
             <div className="border-4 border-[#121212] bg-[#F9F9F9] p-8 lg:p-10 shadow-[8px_8px_0px_0px_#121212] flex flex-col gap-6">
                <h2 className="font-black text-2xl uppercase tracking-tighter border-b-4 border-[#121212] pb-4">Pipeline Protocol Flow</h2>
                <p className="font-bold text-xs uppercase tracking-widest opacity-60">Adjust the hierarchy sequence in which a student's application moves.</p>
                
                <div className="flex flex-col gap-2">
                   {localPipeline.map((dept, i) => (
                     <div key={dept} className="flex items-center justify-between bg-white border-2 border-[#121212] p-3">
                        <div className="flex items-center gap-4">
                           <span className="font-black text-xl tracking-tighter opacity-20 w-4">{i+1}</span>
                           <span className="font-black text-sm uppercase tracking-widest">{dept}</span>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={()=>moveUp(i)} disabled={i===0} className="p-1 border-2 border-[#121212] bg-white hover:bg-[#121212] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#121212] transition-colors"><ArrowUp className="w-4 h-4"/></button>
                           <button onClick={()=>moveDown(i)} disabled={i===localPipeline.length-1} className="p-1 border-2 border-[#121212] bg-white hover:bg-[#121212] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#121212] transition-colors"><ArrowDown className="w-4 h-4"/></button>
                        </div>
                     </div>
                   ))}
                </div>

                <button onClick={handleSavePipeline} className="bg-[#121212] text-white px-6 py-4 font-black uppercase text-xs tracking-widest mt-4">Save Order Schema</button>
             </div>
          </div>

          {/* Templates */}
          <div className="border-4 border-[#121212] bg-white p-8 lg:p-10 shadow-[8px_8px_0px_0px_#121212] flex flex-col gap-8 h-max">
             <h2 className="font-black text-2xl uppercase tracking-tighter border-b-4 border-[#121212] pb-4">Notification Templates</h2>
             
             <div className="flex flex-col gap-4">
                <label className="font-black uppercase tracking-widest text-[10px]">Approval Notification</label>
                <textarea 
                  className="w-full h-32 p-4 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-mono text-sm"
                  value={localTpl.approval} onChange={e=>setLocalTpl({...localTpl, approval: e.target.value})}
                />
                <button onClick={()=>triggerToast('Approval Template Saved')} className="px-4 py-3 bg-white border-2 border-[#121212] font-black uppercase text-[10px] tracking-widest hover:bg-[#121212] hover:text-white self-start"><Save className="w-4 h-4 inline mr-2"/> Save Template</button>
             </div>

             <div className="border-t-2 border-[#121212]/10 my-2" />

             <div className="flex flex-col gap-4">
                <label className="font-black uppercase tracking-widest text-[10px]">Rejection/Flag Notification</label>
                <textarea 
                  className="w-full h-32 p-4 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-mono text-sm"
                  value={localTpl.rejection} onChange={e=>setLocalTpl({...localTpl, rejection: e.target.value})}
                />
                <button onClick={()=>triggerToast('Rejection Template Saved')} className="px-4 py-3 bg-white border-2 border-[#121212] font-black uppercase text-[10px] tracking-widest hover:bg-[#121212] hover:text-white self-start"><Save className="w-4 h-4 inline mr-2"/> Save Template</button>
             </div>

             <div className="border-t-2 border-[#121212]/10 my-2" />

             <div className="flex flex-col gap-4">
                <label className="font-black uppercase tracking-widest text-[10px]">Overdue SLA Nudge</label>
                <textarea 
                  className="w-full h-32 p-4 bg-[#F9F9F9] border-2 border-[#121212] outline-none font-mono text-sm"
                  value={localTpl.nudge} onChange={e=>setLocalTpl({...localTpl, nudge: e.target.value})}
                />
                <button onClick={()=>triggerToast('Nudge Template Saved')} className="px-4 py-3 bg-white border-2 border-[#121212] font-black uppercase text-[10px] tracking-widest hover:bg-[#121212] hover:text-white self-start"><Save className="w-4 h-4 inline mr-2"/> Save Template</button>
             </div>
          </div>
          
       </div>

       <Toast message={toastMsg} visible={showToast} />
    </div>
  );
}
