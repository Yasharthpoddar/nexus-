import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  CheckCircle2, X, ChevronRight, Loader2, Shield, FileText,
  User, Clock, AlertTriangle, Send, ArrowLeft, RotateCcw, FileCheck
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface VerificationEntry {
  id: string; stage: string; status: string; comment?: string;
  requested_changes?: string; actioned_at?: string;
  users?: { id: string; name: string; role?: string; sub_role?: string };
}

interface PipelineDocument {
  id: string; name: string; doc_type: string; doc_type_code: string;
  current_stage: string; overall_status: string; status: string;
  resubmission_count: number; rejected_at_stage: string | null;
  date: string; file_path: string | null;
  document_types: any;
  applications?: { id: string; user_id: string; users?: any };
}

interface Props {
  stage: 'lab' | 'hod' | 'principal';
  portalPrefix: string; // e.g. '/lab', '/hod', '/principal'
}

const stageLabel = (s: string) => ({ lab: 'Lab In-charge', hod: 'HOD', principal: 'Principal', completed: 'Completed' }[s] || s);

const CHECKLISTS: Record<string, { label: string; items: string[] }> = {
  lab_manual:       { label: 'Lab Manual Verification', items: ['Manual is complete', 'All pages present and legible', 'Student signature on every page', 'Lab instructor endorsement'] },
  equipment_return: { label: 'Equipment Return Verification', items: ['All items listed on form', 'Quantities match inventory records', 'Condition noted for each item', 'Lab card returned'] },
  library_receipt:  { label: 'Library Clearance', items: ['No outstanding books', 'Receipt is genuine and signed', 'Fine amount matches records'] },
  id_card:          { label: 'ID Card Verification', items: ['ID card is returned', 'Card is not damaged', 'Photo matches records'] },
  dept_noc:         { label: 'Departmental NOC Verification', items: ['Department seal present', 'Authorized signature present', 'No pending obligations listed'] },
  academic_clearance: { label: 'Academic Clearance', items: ['All coursework completed', 'No grade disputes pending', 'Faculty advisor sign-off'] },
  hostel_clearance: { label: 'Hostel Clearance', items: ['Room vacated and cleaned', 'Key returned', 'No damage charges pending', 'Mess dues cleared'] },
  sports_noc:       { label: 'Sports NOC', items: ['Equipment returned', 'No pending sports fees', 'Coach sign-off'] },
  final_no_dues:    { label: 'Final No Dues', items: ['All departments cleared', 'All fines paid', 'Library clear', 'Lab clear', 'Hostel clear'] },
  bonafide:         { label: 'Bonafide Request', items: ['Student identity verified', 'Enrollment records match', 'Purpose of certificate verified'] },
};


/* ─── Document Preview ──────────────────────────────────────────────────────── */
function DocumentPreview({ documentId, docName }: { documentId: string; docName: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let objectUrl: string | null = null;

    const fetchPreview = async () => {
      try {
        const token = localStorage.getItem('nexus_token');
        const response = await fetch(`/api/documents/preview/${documentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`${response.status}`);
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
        setLoadState('ready');
      } catch {
        setLoadState('error');
      }
    };

    fetchPreview();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [documentId]);

  const openDirect = () =>
    window.open(`/api/documents/preview/${documentId}`, '_blank');

  if (loadState === 'loading') return (
    <div className="border-4 border-[#121212] bg-[#F9F9F9] flex items-center justify-center" style={{ height: '600px' }}>
      <p className="font-black text-xs uppercase tracking-widest opacity-50">Loading preview…</p>
    </div>
  );

  if (loadState === 'error' || !previewUrl) return (
    <div className="border-4 border-[#D02020] bg-[#D02020]/5 flex flex-col items-center justify-center gap-3" style={{ height: '600px' }}>
      <p className="font-black text-xs uppercase tracking-widest text-[#D02020]">Could not load preview.</p>
      <button
        onClick={openDirect}
        className="border-2 border-[#D02020] text-[#D02020] font-black text-xs uppercase tracking-widest px-4 py-2 hover:bg-[#D02020] hover:text-white transition-colors"
      >
        Open in new tab →
      </button>
    </div>
  );

  return (
    <div className="border-4 border-[#121212]">
      <iframe
        src={previewUrl}
        style={{ width: '100%', height: '600px', border: 'none', display: 'block' }}
        title={`Preview — ${docName}`}
      />
      <div className="border-t-2 border-[#121212] px-4 py-2 flex justify-between items-center bg-white">
        <span className="text-[11px] font-bold uppercase tracking-widest opacity-50">PDF Preview</span>
        <button
          onClick={() => previewUrl && window.open(previewUrl, '_blank')}
          className="text-[11px] font-black uppercase tracking-widest border-2 border-[#121212] px-3 py-1 bg-white hover:bg-[#F0C020] transition-colors"
        >
          Open full screen
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export function DocumentVerifyPage({ stage, portalPrefix }: Props) {

  const { id: documentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [doc, setDoc] = useState<PipelineDocument | null>(null);
  const [history, setHistory] = useState<VerificationEntry[]>([]);
  const [verificationPath, setVerificationPath] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [requestedChanges, setRequestedChanges] = useState('');
  const [checkState, setCheckState] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('nexus_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchDocument = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/documents/${documentId}/history`, { headers });
      setDoc(data.document);
      setHistory(data.history || []);
      setVerificationPath(data.verificationPath || []);

      // Initialize checklist
      const code = data.document?.doc_type_code || '';
      const cl = CHECKLISTS[code];
      if (cl) {
        const init: Record<string, boolean> = {};
        cl.items.forEach(item => { init[item] = false; });
        setCheckState(init);
      }
    } catch { setError('Failed to load document.'); }
    finally { setLoading(false); }
  }, [documentId]);

  useEffect(() => { fetchDocument(); }, [fetchDocument]);

  /* ── Actions ─────────────────────────────────────────────────────────────── */
  const handleApprove = async () => {
    setError(''); setSubmitting(true);
    try {
      await axios.post(`/api/documents/${documentId}/approve`, { comment }, { headers });
      setSuccess('Document approved successfully.');
      setTimeout(() => navigate(`${portalPrefix}/pending`), 1500);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Approval failed.');
    } finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!requestedChanges.trim()) { setError('Please specify what changes are required.'); return; }
    setError(''); setSubmitting(true);
    try {
      await axios.post(`/api/documents/${documentId}/reject`, { comment, requestedChanges }, { headers });
      setSuccess('Document rejected. Student has been notified.');
      setTimeout(() => navigate(`${portalPrefix}/pending`), 1500);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Rejection failed.');
    } finally { setSubmitting(false); }
  };

  /* ── Prior Approvals (read-only cards for hod/principal) ─────────────────── */
  const priorApprovals = history.filter(h => h.status === 'approved');
  const stagesBeforeCurrent = verificationPath.slice(0, verificationPath.indexOf(stage));
  const priorStageApprovals = priorApprovals.filter(p => stagesBeforeCurrent.includes(p.stage));

  const checklist = CHECKLISTS[doc?.doc_type_code || ''];
  const allChecked = checklist ? checklist.items.every(item => checkState[item]) : true;

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-[#1040C0]" />
    </div>
  );

  if (!doc) return (
    <div className="p-10 text-center">
      <p className="font-black text-xl uppercase">Document not found</p>
      <button onClick={() => navigate(`${portalPrefix}/pending`)} className="mt-4 underline font-bold text-sm">← Back to queue</button>
    </div>
  );

  const student = (doc as any).applications?.users || {};

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 pb-20">
      {/* Back */}
      <button onClick={() => navigate(`${portalPrefix}/pending`)}
        className="flex items-center gap-2 font-black text-sm uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
        <ArrowLeft className="w-4 h-4" /> Back to Queue
      </button>

      {/* Title */}
      <div className="border-b-4 border-[#121212] pb-4">
        <h1 className="font-black text-3xl md:text-4xl uppercase tracking-tight mb-1">Document Verification</h1>
        <p className="font-bold text-sm uppercase tracking-widest opacity-60">
          Stage: {stageLabel(stage)} — Review & Decision
        </p>
      </div>

      {/* Alerts */}
      {error && <div className="p-3 border-2 border-[#D02020] bg-[#D02020]/10 text-[#D02020] font-bold text-xs uppercase flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}<button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button></div>}
      {success && <div className="p-3 border-2 border-[#121212] bg-[#121212]/5 font-bold text-xs uppercase flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{success}</div>}

      {/* Student Info Strip */}
      <div className="bg-white border-4 border-[#121212] p-5 shadow-[4px_4px_0px_0px_#121212] flex flex-wrap gap-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#F0C020] border-2 border-[#121212] flex items-center justify-center font-black text-lg">
            {(student.name || 'S')[0]}
          </div>
          <div>
            <p className="font-black uppercase tracking-tight">{student.name || 'Student'}</p>
            <p className="text-xs font-mono opacity-70">{student.roll_number || '—'}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Branch</p>
          <p className="font-black text-sm uppercase">{student.branch || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Batch</p>
          <p className="font-black text-sm uppercase">{student.batch || '—'}</p>
        </div>
        {doc.resubmission_count > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Resubmissions</p>
            <p className="font-black text-sm uppercase text-[#D02020] flex items-center gap-1"><RotateCcw className="w-3 h-3" /> {doc.resubmission_count}</p>
          </div>
        )}
      </div>

      {/* Document Type + Path */}
      <div className="bg-white border-4 border-[#121212] p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Document</p>
            <h3 className="font-black text-xl uppercase tracking-tight">{doc.name}</h3>
            <p className="font-bold text-sm opacity-70">{doc.doc_type}</p>
          </div>
          <div className="p-3 bg-[#F0F0F0] border-2 border-[#121212]">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Full Path Visualization */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {verificationPath.map((s, i) => {
            const isApproved = priorApprovals.some(p => p.stage === s);
            const isCurrent = s === stage;
            return (
              <React.Fragment key={s}>
                {i > 0 && <ChevronRight className="w-4 h-4 text-gray-300" />}
                <div className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest border-2 ${
                  isApproved ? 'bg-[#121212] text-white border-[#121212]' :
                  isCurrent ? 'bg-[#1040C0] text-white border-[#1040C0] ring-2 ring-[#1040C0]/30' :
                  'bg-gray-100 text-gray-400 border-gray-200'
                }`}>
                  {isApproved && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                  {isCurrent && <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />}
                  {stageLabel(s)}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Prior Stage Approvals (read-only cards) */}
      {priorStageApprovals.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-black text-sm uppercase tracking-widest opacity-60">Prior Approvals</h3>
          {priorStageApprovals.map((p, i) => (
            <div key={p.id || i} className="bg-[#F9F9F9] border-2 border-[#121212] p-4 flex items-start gap-4">
              <div className="w-10 h-10 bg-[#121212] text-white flex items-center justify-center flex-shrink-0 border-2 border-[#121212]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-sm uppercase tracking-tight">{stageLabel(p.stage)} — Approved</span>
                  {p.actioned_at && <span className="text-[10px] font-mono opacity-60">{new Date(p.actioned_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                </div>
                <p className="text-xs opacity-70">By: {p.users?.name || 'System'} ({p.users?.sub_role || p.users?.role || '—'})</p>
                {p.comment && <p className="text-xs italic mt-1 opacity-80">"{p.comment}"</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Preview */}
      <DocumentPreview documentId={documentId!} docName={doc.name} />

      {/* Checklist */}
      {checklist && doc.current_stage === stage && (
        <div className="bg-white border-4 border-[#121212] p-5 shadow-[4px_4px_0px_0px_#121212]">
          <h3 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#1040C0]" /> {checklist.label}
          </h3>
          <div className="space-y-2">
            {checklist.items.map(item => (
              <label key={item} className="flex items-center gap-3 p-2 hover:bg-[#F9F9F9] cursor-pointer transition-colors">
                <input type="checkbox" checked={checkState[item] || false}
                  onChange={() => setCheckState(prev => ({ ...prev, [item]: !prev[item] }))}
                  className="w-5 h-5 accent-[#1040C0] border-2 border-[#121212] flex-shrink-0" />
                <span className={`font-bold text-sm ${checkState[item] ? 'opacity-100' : 'opacity-60'}`}>{item}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Decision Panel */}
      {doc.current_stage === stage && !success && (
        <div className="bg-white border-4 border-[#121212] p-6 shadow-[8px_8px_0px_0px_#121212] space-y-5">
          <h3 className="font-black text-lg uppercase tracking-tight border-b-2 border-[#121212] pb-3">Your Decision</h3>

          <div>
            <label className="font-black text-xs uppercase tracking-widest block mb-2">Comment (optional)</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} placeholder="Add a note..."
              className="w-full border-2 border-[#121212] p-3 font-medium text-sm outline-none focus:border-[#1040C0] bg-[#F9F9F9]" />
          </div>

          <div>
            <label className="font-black text-xs uppercase tracking-widest block mb-2">Requested Changes (required for rejection)</label>
            <textarea value={requestedChanges} onChange={e => setRequestedChanges(e.target.value)} rows={3}
              placeholder="Specify what the student needs to fix..."
              className="w-full border-2 border-[#121212] p-3 font-medium text-sm outline-none focus:border-[#D02020] bg-[#F9F9F9]" />
          </div>

          <div className="flex gap-4 pt-2">
            <button onClick={handleReject} disabled={submitting}
              className="flex-1 py-3 border-4 border-[#D02020] text-[#D02020] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-[#D02020] hover:text-white transition-colors disabled:opacity-40">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Reject
            </button>
            <button onClick={handleApprove} disabled={submitting || !allChecked}
              className="flex-1 py-3 bg-[#121212] text-white border-4 border-[#121212] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-[#1040C0] transition-colors disabled:opacity-40">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Approve & Forward
            </button>
          </div>
          {!allChecked && checklist && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#D02020] text-center">Complete all checklist items before approving.</p>
          )}
        </div>
      )}
    </div>
  );
}
