import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import {
  Search, FileText, ChevronRight, Loader2, CheckCircle2,
  RotateCcw, ArrowUpDown, Eye
} from 'lucide-react';

interface Props {
  stage: 'lab' | 'hod' | 'principal';
  portalPrefix: string;
  title?: string;
}

const stageLabel = (s: string) => ({ lab: 'Lab', hod: 'HOD', principal: 'Principal' }[s] || s);

export function DocumentQueue({ stage, portalPrefix, title }: Props) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('oldest');

  const token = localStorage.getItem('nexus_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchPending = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/documents/pending/${stage}`, { headers });
      setDocuments(data.documents || []);
    } catch (e) { console.error('Document queue fetch error', e); }
    finally { setLoading(false); }
  }, [stage]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  // Auto-poll every 30 seconds so newly-approved docs appear without manual refresh
  useEffect(() => {
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  const filtered = documents
    .filter(d => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const student = d.applications?.users;
      return (
        d.name?.toLowerCase().includes(term) ||
        d.doc_type?.toLowerCase().includes(term) ||
        student?.name?.toLowerCase().includes(term) ||
        student?.roll_number?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      const aT = new Date(a.date || 0).getTime();
      const bT = new Date(b.date || 0).getTime();
      return sortOrder === 'oldest' ? aT - bT : bT - aT;
    });

  if (loading) return (
    <div className="flex items-center justify-center h-[40vh]">
      <Loader2 className="w-8 h-8 animate-spin text-[#1040C0]" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-black text-xl uppercase tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1040C0]" />
            {title || 'Document Verification Queue'}
          </h2>
          <p className="text-xs font-bold uppercase tracking-widest opacity-50 mt-1">
            Documents awaiting {stageLabel(stage)} approval
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-[#121212] text-white font-black text-sm px-4 py-2 border-2 border-[#121212]">
            {filtered.length} PENDING
          </div>
          <button
            onClick={fetchPending}
            title="Refresh queue"
            className="p-2 border-2 border-[#121212] hover:bg-[#F0C020] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
          <input type="text" placeholder="Search student, document..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#F9F9F9] border-2 border-[#121212] p-2.5 pl-9 font-bold uppercase tracking-widest text-[10px] outline-none focus:bg-white" />
        </div>
        <button onClick={() => setSortOrder(p => p === 'oldest' ? 'newest' : 'oldest')}
          className="bg-[#121212] text-white px-4 py-2.5 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest hover:bg-[#1040C0] transition-colors">
          <ArrowUpDown className="w-3 h-3" /> {sortOrder === 'oldest' ? 'Oldest First' : 'Newest First'}
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="border-4 border-[#121212] border-dashed p-10 text-center bg-[#F0FFE0]">
          <CheckCircle2 className="w-12 h-12 mx-auto opacity-30 text-[#2E8B57] mb-3" />
          <p className="font-black text-lg uppercase tracking-tight">All caught up</p>
          <p className="text-xs font-bold uppercase tracking-widest opacity-50">No documents pending {stageLabel(stage)} review.</p>
        </div>
      ) : (
        <div className="border-4 border-[#121212] bg-white shadow-[4px_4px_0px_0px_#121212] overflow-x-auto">
          <table className="w-full text-left font-bold text-xs">
            <thead className="bg-[#121212] text-white uppercase tracking-widest text-[10px]">
              <tr>
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Document</th>
                <th className="p-3.5">Path</th>
                <th className="p-3.5 text-center">Resubs</th>
                <th className="p-3.5 text-right pr-5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#121212]">
              {filtered.map(doc => {
                const student = doc.applications?.users || {};
                const path = doc.verificationPath || [];
                const completed = doc.completedStages || [];

                return (
                  <tr key={doc.id} className="hover:bg-[#F9F9F9] transition-colors">
                    <td className="p-3.5">
                      <div className="font-black uppercase tracking-tight text-sm">{student.name || 'Unknown'}</div>
                      <div className="text-[10px] font-mono opacity-70 mt-0.5">{student.roll_number || '—'}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-black uppercase text-sm tracking-tight">{doc.doc_type || doc.name}</div>
                      <div className="text-[10px] opacity-60 mt-0.5">{doc.name}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1">
                        {path.map((s: string, i: number) => (
                          <React.Fragment key={s}>
                            {i > 0 && <ChevronRight className="w-2.5 h-2.5 text-gray-300" />}
                            <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase border ${
                              completed.includes(s) ? 'bg-[#121212] text-white border-[#121212]' :
                              doc.current_stage === s ? 'bg-[#1040C0]/10 text-[#1040C0] border-[#1040C0]' :
                              'bg-gray-50 text-gray-400 border-gray-200'
                            }`}>{stageLabel(s)}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      {doc.resubmission_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[#D02020] font-black">
                          <RotateCcw className="w-3 h-3" /> {doc.resubmission_count}
                        </span>
                      ) : (
                        <span className="opacity-30">0</span>
                      )}
                    </td>
                    <td className="p-3.5 pr-5">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => navigate(`${portalPrefix}/verify/${doc.id}`)}
                          className="bg-[#121212] text-white font-black uppercase tracking-widest text-[10px] px-4 py-2 border-2 border-[#121212] hover:bg-[#1040C0] transition-colors whitespace-nowrap flex items-center gap-1.5">
                          <Eye className="w-3 h-3" /> View & Verify
                        </button>
                      </div>
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
