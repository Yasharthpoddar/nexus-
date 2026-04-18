import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  UploadCloud, File, RefreshCw, Eye, AlertTriangle, CheckCircle2, X,
  Download, Loader2, ChevronRight, RotateCcw, Shield, FileCheck
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface DocType {
  id: string; name: string; code: string;
  requires_lab: boolean; requires_hod: boolean; requires_principal: boolean;
  generates_certificate: boolean; description?: string;
}

interface VerificationEntry {
  id: string; stage: string; status: string; comment?: string;
  requested_changes?: string; actioned_at?: string;
  users?: { id: string; name: string; sub_role: string };
}

interface PipelineDocument {
  id: string; name: string; doc_type: string; doc_type_code: string;
  current_stage: string; overall_status: string; status: string;
  resubmission_count: number; rejected_at_stage: string | null;
  date: string; storage_path: string | null; file_path: string | null;
  certificate_id: string | null;
  document_types: DocType | null;
  document_verifications: VerificationEntry[];
  verificationPath: string[];
  completedStages: string[];
  totalStages: number; completedCount: number; progressPercent: number;
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function stageLabel(s: string) {
  const map: Record<string, string> = { lab: 'Lab', hod: 'HOD', principal: 'Principal', completed: 'Done' };
  return map[s] || s;
}

function pathTagline(dt: DocType): string {
  const parts: string[] = [];
  if (dt.requires_lab) parts.push('Lab');
  if (dt.requires_hod) parts.push('HOD');
  if (dt.requires_principal) parts.push('Principal');
  const route = parts.join(' → ');
  return `${route}${dt.generates_certificate ? ' — Auto-certified' : ''}`;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export function DocumentVault() {
  const { currentUser } = useAuth();
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [documents, setDocuments] = useState<PipelineDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedTypeCode, setSelectedTypeCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<PipelineDocument | null>(null);
  const [resubmitDocId, setResubmitDocId] = useState<string | null>(null);
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [resubmitting, setResubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resubmitRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem('nexus_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    try {
      const [typesRes, docsRes] = await Promise.all([
        axios.get('/api/documents/types', { headers }),
        axios.get('/api/documents/mine', { headers })
      ]);
      setDocTypes(typesRes.data.documentTypes || []);
      setDocuments(docsRes.data.documents || []);
    } catch (e) { console.error('Vault fetch error', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-poll every 30s so document status updates (approval/rejection) appear without manual refresh
  useEffect(() => {
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, [fetchData]);

  /* ── Upload ──────────────────────────────────────────────────────────────── */
  const handleUpload = async (file: File) => {
    setError(''); setSuccess('');
    if (!selectedTypeCode) { setError('Select a document type first.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File exceeds 10 MB limit.'); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('doc_type_code', selectedTypeCode);
      fd.append('name', file.name);

      await axios.post('/api/documents/upload', fd, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(`"${file.name}" uploaded successfully.`);
      setSelectedTypeCode('');
      await fetchData();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Upload failed.');
    } finally { setUploading(false); }
  };

  /* ── Resubmit ────────────────────────────────────────────────────────────── */
  const handleResubmit = async () => {
    if (!resubmitDocId || !resubmitFile) return;
    setResubmitting(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', resubmitFile);
      await axios.post(`/api/documents/${resubmitDocId}/resubmit`, fd, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Document resubmitted for review.');
      setResubmitDocId(null); setResubmitFile(null);
      await fetchData();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Resubmission failed.');
    } finally { setResubmitting(false); }
  };

  const handleCertDownload = async (docId: string) => {
    try {
      const resp = await axios.get(`/api/documents/${docId}/certificate`, {
        headers, responseType: 'blob'
      });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement('a'); a.href = url; a.download = `certificate-${docId}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch { setError('Certificate not available yet.'); }
  };

  /* ── Drag / Drop ─────────────────────────────────────────────────────────── */
  const onDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === 'dragenter' || e.type === 'dragover'); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]); };
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); };

  /* ── Status Pill ─────────────────────────────────────────────────────────── */
  const statusPill = (doc: PipelineDocument) => {
    const s = doc.overall_status;
    const base = 'px-3 py-1 border-2 font-black text-[10px] uppercase tracking-widest inline-flex items-center gap-1.5';
    if (s === 'approved' && doc.certificate_id) return <span className={`${base} bg-[#121212] text-white border-[#121212]`}><Download className="w-3 h-3" /> Cert Ready</span>;
    if (s === 'approved') return <span className={`${base} bg-[#121212] text-white border-[#121212]`}><CheckCircle2 className="w-3 h-3" /> Verified</span>;
    if (s === 'needs_resubmission') return <span className={`${base} text-[#D02020] border-[#D02020] bg-[#D02020]/5`}><AlertTriangle className="w-3 h-3" /> Needs Resubmission</span>;
    if (s === 'in_progress') return <span className={`${base} text-[#1040C0] border-[#1040C0] bg-[#1040C0]/5`}><Loader2 className="w-3 h-3 animate-spin" /> In Progress</span>;
    return <span className={`${base} text-gray-500 border-gray-300 bg-gray-50`}>Pending</span>;
  };

  /* ── Mini Pipeline Stepper ───────────────────────────────────────────────── */
  const PipelineStepper = ({ doc }: { doc: PipelineDocument }) => {
    const path = doc.verificationPath || ['lab'];
    const completed = doc.completedStages || [];
    const isRejected = doc.overall_status === 'needs_resubmission';
    const isDone = doc.overall_status === 'approved';

    return (
      <div className="flex items-center gap-1 mt-3">
        {path.map((stage, i) => {
          const isCompleted = completed.includes(stage);
          const isCurrent = doc.current_stage === stage && !isDone;
          const isRejectedHere = isRejected && doc.rejected_at_stage === stage;

          return (
            <React.Fragment key={stage}>
              {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
              <div className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                isRejectedHere ? 'border-[#D02020] bg-[#D02020]/10 text-[#D02020]' :
                isCompleted ? 'border-[#121212] bg-[#121212] text-white' :
                isCurrent ? 'border-[#1040C0] bg-[#1040C0]/10 text-[#1040C0]' :
                'border-gray-200 bg-gray-50 text-gray-400'
              }`}>
                {isRejectedHere && <X className="w-3 h-3" />}
                {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                {isCurrent && !isRejectedHere && <Loader2 className="w-3 h-3 animate-spin" />}
                {stageLabel(stage)}
              </div>
            </React.Fragment>
          );
        })}
        {isDone && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
            <div className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-2 border-[#F0C020] bg-[#F0C020]/20 text-[#121212]">
              <Shield className="w-3 h-3" /> Complete
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-[#1040C0]" />
    </div>
  );

  const selectedDocType = docTypes.find(d => d.code === selectedTypeCode);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 pb-20">
      <div>
        <h1 className="font-black text-3xl md:text-5xl uppercase tracking-tight mb-2">Document Vault</h1>
        <p className="text-lg font-medium opacity-80">Upload, track, and manage all clearance documents through the verification pipeline.</p>
      </div>

      {/* ── Alerts ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-3 bg-[#D02020]/10 border-2 border-[#D02020] text-[#D02020] font-bold text-xs flex items-center gap-2 uppercase">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="p-3 bg-[#121212]/5 border-2 border-[#121212] text-[#121212] font-bold text-xs flex items-center gap-2 uppercase">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
          <button onClick={() => setSuccess('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Upload Section ──────────────────────────────────────────────────── */}
      <div className="bg-white border-4 border-[#121212] p-6 shadow-[4px_4px_0px_0px_#121212] flex flex-col md:flex-row gap-6">
        <div className="md:w-2/5 flex flex-col justify-start space-y-4">
          <div>
            <label className="font-black uppercase text-xs tracking-widest mb-2 block">1. Select Document Type</label>
            <select
              value={selectedTypeCode}
              onChange={(e) => setSelectedTypeCode(e.target.value)}
              className="w-full border-2 border-[#121212] p-3 font-bold uppercase text-sm outline-none focus:border-4 transition-all bg-[#F0F0F0]"
            >
              <option value="">-- Choose Type --</option>
              {docTypes.map(dt => (
                <option key={dt.code} value={dt.code}>{dt.name}</option>
              ))}
            </select>
          </div>

          {/* Smart type info card */}
          {selectedDocType && (
            <div className="bg-[#F9F9F9] border-2 border-[#121212] p-4 space-y-2">
              <h4 className="font-black text-sm uppercase tracking-tight">{selectedDocType.name}</h4>
              <div className="flex items-center gap-1 flex-wrap">
                {selectedDocType.requires_lab && <span className="text-[10px] font-black uppercase bg-[#121212] text-white px-2 py-0.5">Lab</span>}
                {selectedDocType.requires_hod && <><ChevronRight className="w-3 h-3 text-gray-400" /><span className="text-[10px] font-black uppercase bg-[#1040C0] text-white px-2 py-0.5">HOD</span></>}
                {selectedDocType.requires_principal && <><ChevronRight className="w-3 h-3 text-gray-400" /><span className="text-[10px] font-black uppercase bg-[#F0C020] text-[#121212] px-2 py-0.5">Principal</span></>}
              </div>
              {selectedDocType.generates_certificate && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#1040C0] flex items-center gap-1 mt-1">
                  <FileCheck className="w-3 h-3" /> Auto-generates certificate on approval
                </p>
              )}
            </div>
          )}
        </div>

        <div className="md:w-3/5">
          <label className="font-black uppercase text-xs tracking-widest mb-2 block">2. Upload File</label>
          <div
            className={`w-full border-4 border-dashed transition-all flex flex-col items-center justify-center p-8 relative ${
              dragActive ? 'border-[#1040C0] bg-[#1040C0]/5' : 'border-[#121212] bg-[#F9F9F9] hover:bg-[#F0F0F0]'
            } ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
            onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={onChange} />
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 mb-4 animate-spin text-[#1040C0]" />
                <p className="font-black uppercase text-sm tracking-widest">Uploading & Processing...</p>
              </div>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 mb-4 text-[#121212]" strokeWidth={2} />
                <p className="font-black text-lg uppercase tracking-tight mb-1 text-center">Drag & Drop or Click to Browse</p>
                <p className="text-sm font-medium opacity-60 text-center">PDF, JPEG, PNG, DOC (Max 10 MB)</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Document Grid ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="font-black text-2xl uppercase tracking-tight mb-6 flex items-center gap-2">
          <span className="w-4 h-4 bg-[#1040C0] inline-block border-2 border-[#121212]" />
          My Documents
          <span className="text-sm font-bold bg-[#F0F0F0] px-2 py-0.5 ml-2 border border-[#121212]">{documents.length}</span>
        </h2>

        {documents.length === 0 ? (
          <div className="p-10 border-4 border-[#121212] border-dashed text-center">
            <p className="font-bold uppercase tracking-widest opacity-50">No documents uploaded yet. Use the form above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {documents.map((doc) => {
              const isRejected = doc.overall_status === 'needs_resubmission';
              const rejectionEntry = isRejected
                ? (doc.document_verifications || []).filter(v => v.status === 'rejected').pop()
                : null;

              return (
                <div key={doc.id} className={`bg-white border-4 p-5 flex flex-col justify-between transition-all hover:shadow-[4px_4px_0px_0px_#121212] ${
                  isRejected ? 'border-[#D02020]' : doc.overall_status === 'approved' ? 'border-[#121212]' : 'border-[#121212]'
                }`}>
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2.5 bg-[#F0F0F0] border-2 border-[#121212]">
                        <File className="w-5 h-5" />
                      </div>
                      {statusPill(doc)}
                    </div>

                    <h3 className="font-black uppercase tracking-tight line-clamp-1 mb-1" title={doc.name}>{doc.name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">{doc.doc_type}</p>

                    {/* Resubmission count badge */}
                    {doc.resubmission_count > 0 && (
                      <span className="text-[10px] font-black uppercase bg-[#F0C020]/20 border border-[#F0C020] px-2 py-0.5 inline-flex items-center gap-1 mb-2">
                        <RotateCcw className="w-3 h-3" /> Resubmission {doc.resubmission_count}
                      </span>
                    )}

                    {/* Pipeline Stepper */}
                    <PipelineStepper doc={doc} />

                    {/* Rejection callout */}
                    {isRejected && rejectionEntry && (
                      <div className="mt-3 p-3 bg-[#D02020]/5 border-2 border-[#D02020]">
                        <p className="text-[10px] font-black text-[#D02020] uppercase tracking-widest mb-1">
                          Rejected at {stageLabel(doc.rejected_at_stage || '')} Stage
                        </p>
                        {rejectionEntry.requested_changes && (
                          <p className="text-sm font-medium text-[#121212] leading-snug">
                            "{rejectionEntry.requested_changes}"
                          </p>
                        )}
                        {rejectionEntry.comment && (
                          <p className="text-xs font-medium text-gray-500 mt-1">{rejectionEntry.comment}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-4 border-t-2 border-[#F0F0F0] flex gap-2">
                    {isRejected ? (
                      resubmitDocId === doc.id ? (
                        <div className="flex-1 space-y-2">
                          <input ref={resubmitRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => { if (e.target.files?.[0]) setResubmitFile(e.target.files[0]); }} />
                          <button onClick={() => resubmitRef.current?.click()}
                            className="w-full p-2 border-2 border-dashed border-[#1040C0] bg-[#1040C0]/5 text-[#1040C0] font-bold text-xs uppercase text-center">
                            {resubmitFile ? `✓ ${resubmitFile.name}` : 'Click to select revised file'}
                          </button>
                          <div className="flex gap-2">
                            <button onClick={() => { setResubmitDocId(null); setResubmitFile(null); }}
                              className="flex-1 py-2 border-2 border-[#121212] font-bold text-xs uppercase">Cancel</button>
                            <button onClick={handleResubmit} disabled={!resubmitFile || resubmitting}
                              className="flex-1 py-2 bg-[#1040C0] text-white border-2 border-[#121212] font-bold text-xs uppercase disabled:opacity-40 flex items-center justify-center gap-1">
                              {resubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />} Resubmit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setResubmitDocId(doc.id)}
                          className="flex-1 bg-[#D02020] text-white py-2 border-2 border-[#121212] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-700">
                          <RotateCcw className="w-3 h-3" /> Resubmit Document
                        </button>
                      )
                    ) : (
                      <>
                        <button onClick={() => setPreviewDoc(doc)}
                          className="flex-1 bg-white py-2 border-2 border-[#121212] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#F0F0F0]">
                          <Eye className="w-3 h-3" /> History
                        </button>
                        {doc.certificate_id && (
                          <button onClick={() => handleCertDownload(doc.id)}
                            className="px-4 bg-[#121212] text-white border-2 border-[#121212] font-bold text-xs uppercase flex items-center gap-1 hover:bg-[#1040C0] transition-colors">
                            <Download className="w-3 h-3" /> PDF
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── History Modal ──────────────────────────────────────────────────── */}
      {previewDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setPreviewDoc(null)} />
          <div className="relative bg-white w-full max-w-2xl border-4 border-[#121212] max-h-[85vh] flex flex-col">
            <div className="bg-[#121212] text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5" />
                <h2 className="font-black text-sm uppercase tracking-widest">{previewDoc.name} — Verification Trail</h2>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="hover:bg-white/20 p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <PipelineStepper doc={previewDoc} />
              <div className="space-y-3 mt-4">
                {(previewDoc.document_verifications || []).map((v, i) => (
                  <div key={v.id || i} className={`p-3 border-2 ${
                    v.status === 'approved' ? 'border-[#121212] bg-[#F9F9F9]' :
                    v.status === 'rejected' ? 'border-[#D02020] bg-[#D02020]/5' :
                    'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-xs uppercase tracking-widest">{stageLabel(v.stage)} — {v.status}</span>
                      {v.actioned_at && <span className="text-[10px] font-mono opacity-60">{new Date(v.actioned_at).toLocaleDateString('en-IN')}</span>}
                    </div>
                    {v.users && <p className="text-xs font-medium opacity-70">By: {v.users.name}</p>}
                    {v.comment && <p className="text-xs mt-1 italic">"{v.comment}"</p>}
                    {v.requested_changes && <p className="text-xs mt-1 text-[#D02020] font-bold">Changes: {v.requested_changes}</p>}
                  </div>
                ))}
                {(previewDoc.document_verifications || []).length === 0 && (
                  <p className="text-sm font-bold text-center opacity-50 uppercase py-8">No verification actions recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
