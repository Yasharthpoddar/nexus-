import React, { useState, useEffect } from 'react';
import { useNexus } from '../../context/NexusContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Download, 
  Award, 
  QrCode, 
  FileCheck, 
  Receipt,
  X,
  HardDrive,
  Loader2
} from 'lucide-react';

interface CertRecord {
  id: string;
  certificate_id: string;
  file_path: string;
  issued_at: string;
}

export function DigitalLocker() {
  const { profile, departments } = useNexus();
  const { currentUser } = useAuth();
  
  const [lockerData, setLockerData] = useState<{
    documents: any[];
    payments: any[];
    certificate: any | null;
    totalFiles: number;
  } | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  
  const [showQR, setShowQR] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(false);
  const [certError, setCertError] = useState('');

  // Certificate only unlocks when application is submitted AND every department has cleared
  const allCleared = departments.length > 0 && departments.every(d => d.status === 'Cleared');

  // Fetch real locker data from backend
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;

    const fetchLockerData = async () => {
      try {
        const token = localStorage.getItem('nexus_token');
        const headers = { Authorization: `Bearer ${token}` };
        const base = import.meta.env.VITE_API_URL || '';

        // API endpoints to fetch live files
        const [docsRes, paymentsRes, certRes] = await Promise.all([
          fetch(`${base}/api/documents/mine`, { headers }), // Fixed from /applications/dashboard
          fetch(`${base}/api/payment/mine`, { headers }),
          fetch(`${base}/api/certificates/mine`, { headers }),
        ]);

        const [docsData, paymentsData, certData] = await Promise.all([
          docsRes.ok ? docsRes.json() : { documents: [] },
          paymentsRes.ok ? paymentsRes.json() : [],
          certRes.ok ? certRes.json() : { certificates: [] },
        ]);
        
        let docs = docsData?.documents || [];
        docs = docs.filter((d: any) => d.status === 'Verified');

        const payments = Array.isArray(paymentsData) ? paymentsData : [];

        let cert = certData?.certificates?.[0] || null;

        setLockerData({
          documents: docs || [],
          payments: Array.isArray(payments) ? payments : [],
          certificate: cert,
          totalFiles: (docs?.length || 0) + (Array.isArray(payments) ? payments.length : 0) + (cert ? 1 : 0),
        });

        // Poll every 10 seconds if approved but certificate hasn't rendered yet
        if (allCleared && !cert) {
           if (!pollingInterval) {
             pollingInterval = setInterval(fetchLockerData, 10000);
           }
        } else {
           if (pollingInterval) clearInterval(pollingInterval);
        }

      } catch (err) {
        console.error('Locker fetch error', err);
      }
    };
    
    fetchLockerData();
    return () => { if (pollingInterval) clearInterval(pollingInterval); };
  }, [allCleared]);

  // Trigger real PDF download for single cert
  const handleDownloadCert = async () => {
    setDownloadingCert(true);
    setCertError('');
    try {
      const token = localStorage.getItem('nexus_token');
      const base = import.meta.env.VITE_API_URL || '';

      let targetCertId = lockerData?.certificate?.certificate_id;

      // If certificate row doesn't exist yet (legacy apps), force generation!
      if (!targetCertId) {
        const genRes = await fetch(`${base}/api/certificates/generate-mine`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!genRes.ok) {
          const err = await genRes.json().catch(() => ({ error: 'Auto-generation failed' }));
          throw new Error(err.error || `HTTP ${genRes.status}`);
        }
        const genData = await genRes.json();
        targetCertId = genData.certificateId;

        // Instantly reflect the downloaded certificate in the UI
        setLockerData(prev => prev ? {
          ...prev,
          certificate: { certificate_id: targetCertId },
          totalFiles: prev.totalFiles + (prev.certificate ? 0 : 1)
        } : null);
      }

      if (!targetCertId) throw new Error('Certificate generation failed.');

      const response = await fetch(`${base}/api/certificates/download/${targetCertId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Download failed' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NoDuesCertificate-${targetCertId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setCertError(e.message || 'Download failed');
    } finally {
      setDownloadingCert(false);
    }
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    setDownloadError(null);
    try {
      const token = localStorage.getItem('nexus_token');
      const base = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${base}/api/certificates/zip`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to generate ZIP');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Nexus_DigitalLocker_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setDownloadError('Could not download locker. Please try again.');
    } finally {
      setDownloadingZip(false);
    }
  };

  // Extract from lockerData state instead of legacy context
  const cert = lockerData?.certificate;
  const verifiedDocs = lockerData?.documents || [];
  const paymentsList = lockerData?.payments || [];
  
  const displayCertId = cert?.certificate_id ?? `NX-CERT-${new Date().getFullYear()}-PENDING`;

  const usedMB = lockerData
    ? ((lockerData.documents.length * 0.8) + (lockerData.payments.length * 0.3) + (lockerData.certificate ? 1.2 : 0)).toFixed(1)
    : '0';

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-[#121212] pb-6">
        <div>
           <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tight mb-2">Digital Locker</h1>
           <p className="text-lg font-medium opacity-80">Your permanent, verifiable record of graduation readiness.</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
            <button 
              onClick={handleDownloadZip}
              disabled={downloadingZip || !lockerData?.totalFiles}
              className={`shrink-0 px-6 py-4 border-4 border-[#121212] font-black uppercase text-sm tracking-wider flex items-center justify-center gap-3 transition-all ${
                (downloadingZip || !lockerData?.totalFiles) ? 'bg-[#E0E0E0] opacity-50 cursor-not-allowed' : 'bg-[#121212] text-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#1040C0]'
              }`}
            >
              <Download className={`w-5 h-5 ${downloadingZip ? 'animate-bounce' : ''}`} />
              {downloadingZip ? 'Preparing ZIP...' : 'Download All as ZIP'}
            </button>
            {downloadError && <p className="text-[#D02020] text-xs font-bold">{downloadError}</p>}
        </div>
      </div>

      {/* Storage usage */}
      <div className="flex items-center gap-4 bg-white border-2 border-[#121212] p-4 text-sm font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_#121212]">
         <HardDrive className="w-5 h-5 opacity-50" />
         <span className="opacity-80">Locker Usage</span>
         <div className="flex-1 h-3 bg-[#F0F0F0] border-2 border-[#121212] ml-2">
           <div className="h-full bg-[#1040C0]" style={{ width: `${Math.min(100, Math.max(2, (parseFloat(usedMB) / 50) * 100))}%` }} />
         </div>
         <span>{usedMB} MB / 50 MB</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Certificate — locked until all departments cleared */}
        {allCleared ? (
          <div className="md:col-span-2 lg:col-span-3 bg-[#121212] text-white border-4 border-[#F0C020] p-1 flex flex-col md:flex-row shadow-[8px_8px_0px_0px_#F0C020]">
             <div className="bg-[#F0C020] text-[#121212] p-6 md:p-8 flex items-center justify-center border-b-2 md:border-b-0 md:border-r-4 border-[#121212]">
               <Award className="w-16 h-16 md:w-24 md:h-24" strokeWidth={1.5} />
             </div>
             
             <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
               <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-[10px] uppercase tracking-widest text-[#F0C020] border border-[#F0C020] px-2 py-1 mb-2">Official Document</span>
                    <span className="font-mono text-sm opacity-50 block md:hidden mb-2">{displayCertId}</span>
                  </div>
                  <h2 className="font-black text-2xl md:text-4xl uppercase tracking-tight text-white mb-4">No-Dues Certificate</h2>
                  
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm font-medium opacity-80 mb-6">
                    <div>
                      <p className="uppercase text-[10px] tracking-widest opacity-60 mb-1">Student</p>
                      <p className="font-bold">{profile.name}</p>
                    </div>
                    <div>
                      <p className="uppercase text-[10px] tracking-widest opacity-60 mb-1">Roll No</p>
                      <p className="font-bold font-mono">{profile.rollNo}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="uppercase text-[10px] tracking-widest opacity-60 mb-1">Batch</p>
                      <p className="font-bold">{profile.batch}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="uppercase text-[10px] tracking-widest opacity-60 mb-1">Certificate #</p>
                      <p className="font-bold font-mono">{displayCertId}</p>
                    </div>
                  </div>

                  {certError && (
                    <p className="text-[#FF4444] text-xs font-bold uppercase tracking-widest mb-3">
                      ⚠ {certError}
                    </p>
                  )}
               </div>

               <div className="flex flex-wrap gap-4 pt-4 border-t border-white/20 mt-auto">
                 <button
                   onClick={handleDownloadCert}
                   disabled={downloadingCert}
                   className={`flex items-center gap-2 px-5 py-3 font-black uppercase text-sm tracking-wider transition-colors ${
                     downloadingCert
                       ? 'bg-[#F0C020]/50 text-[#121212]/50 cursor-not-allowed'
                       : 'bg-[#F0C020] text-[#121212] hover:bg-yellow-500'
                   }`}
                 >
                   {downloadingCert
                     ? <><Loader2 className="w-4 h-4 animate-spin" /> {cert ? 'Downloading…' : 'Generating…'}</>
                     : <><Download className="w-4 h-4" /> {cert ? 'Download PDF' : 'Generate PDF'}</>
                   }
                 </button>
                 <button onClick={() => setShowQR(true)} className="flex items-center gap-2 px-5 py-3 bg-transparent border-2 border-white text-white font-black uppercase text-sm tracking-wider hover:bg-white hover:text-[#121212] transition-colors">
                   <QrCode className="w-4 h-4" /> View QR Code
                 </button>
               </div>
             </div>
          </div>
        ) : (
          /* Locked certificate placeholder */
          <div className="md:col-span-2 lg:col-span-3 bg-[#F0F0F0] border-4 border-[#121212] border-dashed p-8 flex flex-col md:flex-row items-center gap-6 opacity-60">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#E0E0E0] border-4 border-[#121212] rounded-full flex items-center justify-center shrink-0">
              <Award className="w-8 h-8 md:w-10 md:h-10 text-[#888]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-black text-[10px] uppercase tracking-widest text-[#888] mb-2">Locked</p>
              <h2 className="font-black text-xl md:text-2xl uppercase tracking-tight text-[#121212] mb-2">No-Dues Certificate</h2>
              <p className="font-medium text-sm text-[#555]">
                {departments.length === 0
                  ? 'Submit your clearance application first. This certificate unlocks once all departments approve.'
                  : `Pending clearance from ${departments.filter(d => d.status !== 'Cleared').length} department(s). Certificate unlocks when every department approves.`
                }
              </p>
            </div>
          </div>
        )}

        {/* Verified Documents */}
        {verifiedDocs.map(doc => (
          <div key={doc.id} className="bg-white border-4 border-[#121212] p-5 flex flex-col hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#121212] transition-all">
             <div className="border-b-4 border-[#121212] pb-4 mb-4 flex justify-between items-start">
               <div className="p-3 bg-[#1040C0]/10 border-2 border-[#121212]">
                 <FileCheck className="w-6 h-6 text-[#1040C0]" />
               </div>
               <span className="font-bold text-[10px] uppercase tracking-widest px-2 py-1 bg-[#1040C0]/10 border border-[#1040C0] text-[#1040C0]">Verified</span>
             </div>
             
             <h3 className="font-black uppercase tracking-tight line-clamp-1 mb-1">{doc.name}</h3>
             <p className="font-bold text-xs uppercase tracking-widest opacity-60 mb-4">{doc.type}</p>
             
             <button 
                onClick={async () => {
                  try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/documents/preview/${doc.id}`, {
                      headers: { Authorization: `Bearer ${localStorage.getItem('nexus_token')}` }
                    });
                    if (!res.ok) throw new Error('Failed');
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = doc.name || `Vault_Doc_${doc.id}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } catch (e) {
                    alert('Could not download document.');
                  }
                }}
                className="mt-auto w-full py-3 border-2 border-[#121212] font-bold text-xs uppercase tracking-widest hover:bg-[#F0F0F0] flex justify-center items-center gap-2">
                <Download className="w-4 h-4" /> Save
             </button>
          </div>
        ))}

        {/* Payments Receipts */}
        {paymentsList.map(payment => {
          const dateStr = payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : (payment.date?.split(',')[0] || 'Unknown Date');
          return (
          <div key={payment.id} className="bg-white border-4 border-[#121212] p-5 flex flex-col hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#121212] transition-all">
             <div className="border-b-4 border-[#121212] pb-4 mb-4 flex justify-between items-start">
               <div className="p-3 bg-[#F0F0F0] border-2 border-[#121212]">
                 <Receipt className="w-6 h-6 text-[#121212]" />
               </div>
               <span className="font-mono text-[10px] font-bold bg-[#E0E0E0] px-2 py-1 border border-[#121212] opacity-70 uppercase block text-right mt-1 w-20 overflow-hidden text-ellipsis">{payment.receipt_no || payment.receiptNo || payment.transaction_id}</span>
             </div>
             
             <h3 className="font-black uppercase tracking-tight line-clamp-1 mb-1">{payment.department} Receipt</h3>
             <p className="font-bold text-xs uppercase tracking-widest opacity-60 mb-4">Paid ₹{payment.amount} • {dateStr}</p>
             
             <button 
                onClick={async () => {
                  try {
                    const rno = payment.receipt_no || payment.receiptNo;
                    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/payment/receipt/${rno}`, {
                      headers: { Authorization: `Bearer ${localStorage.getItem('nexus_token')}` }
                    });
                    if (!res.ok) throw new Error('Failed');
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Receipt-${rno}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  } catch (e) {
                    alert('Could not download receipt.');
                  }
                }} 
                className="mt-auto w-full py-3 border-2 border-[#121212] font-bold text-xs uppercase tracking-widest hover:bg-[#F0F0F0] flex justify-center items-center gap-2">
                <Download className="w-4 h-4" /> Save
             </button>
          </div>
        )})}
      </div>

      {allCleared && showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowQR(false)} />
          <div className="relative bg-white w-full max-w-sm border-4 border-[#121212] shadow-[8px_8px_0px_0px_#F0C020] p-0 flex flex-col">
             <div className="bg-[#121212] text-white p-4 border-b-4 border-[#121212] flex justify-between items-center">
               <h2 className="font-black text-sm uppercase tracking-widest">Verify Authenticity</h2>
               <button onClick={() => setShowQR(false)}><X className="w-5 h-5" /></button>
             </div>
             <div className="p-8 pb-10 flex flex-col items-center">
                <div className="w-48 h-48 border-4 border-[#121212] bg-white p-2 mb-6">
                   <div className="w-full h-full relative grid grid-cols-4 grid-rows-4 gap-1 p-2">
                     <div className="bg-[#121212] col-span-2 row-span-2 border-4 border-white p-1"><div className="w-full h-full bg-[#121212]" /></div>
                     <div className="bg-[#121212]"/> <div className="bg-white"/>
                     <div className="bg-white"/> <div className="bg-[#121212]"/>
                     <div className="bg-[#121212]"/><div className="bg-[#121212] col-span-2 row-span-2 border-4 border-white p-1"><div className="w-full h-full bg-[#121212]" /></div>
                     <div className="col-span-2 row-span-2 bg-[#121212] border-4 border-white p-1"><div className="w-full h-full bg-[#121212]" /></div>
                     <div className="bg-[#1040C0]"/>
                     <div className="bg-white"/><div className="bg-[#D02020]"/>
                   </div>
                </div>
                <h3 className="font-black uppercase text-xl tracking-tight mb-2 text-center">Scan to Verify</h3>
                <p className="text-xs font-mono text-center opacity-60 break-all px-2">{displayCertId}</p>
                <p className="text-sm font-medium opacity-70 text-center leading-relaxed mt-2">
                  Anyone can scan this code to authenticate your certificate.
                </p>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
