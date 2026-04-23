import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

export type DeptStatus = 'Cleared' | 'Pending' | 'Action Required' | 'Blocked';
export type CertStatus = 'Ready to Issue' | 'Already Issued' | 'Not Ready' | 'Ready';

export interface DepartmentNode { id: string; name: string; authority: string; status: DeptStatus; lastUpdated: string; }
export interface AdminStudent {
  id: string; name: string; rollNo: string; branch: string; batch: string; email: string; phone: string;
  enrollmentDate: string; isBlocked: boolean; departments: DepartmentNode[]; documents: any[]; payments: any[];
  adminNotes: string; certStatus: CertStatus; certificateNo?: string; issueDate?: string;
}
export interface AuthorityNode {
  id: string; name: string; role: string; department: string; email: string; joined: string;
  pendingCount: number; reviewedCount: number; avgTimeDays: number; isOnline: boolean;
}
export interface SystemSettings { databaseOnline: boolean; emailNudgeActive: boolean; paymentGatewayActive: boolean; qrServiceOnline: boolean; pipelineOrder: string[]; templates: any; }
export interface CsvHistory { id: string; timestamp: string; filename: string; department: string; rows: number; flagged: number; }

interface AdminState {
  profile: { name: string, email: string };
  students: AdminStudent[];
  authorities: AuthorityNode[];
  settings: SystemSettings;
  csvHistory: CsvHistory[];
  notifications: any[];
  loading: boolean;
  toggleStudentBlock: (id: string, blocked?: boolean) => Promise<void>;
  overrideDepartmentStatus: (studentId: string, deptId: string, status: DeptStatus) => Promise<void>;
  updateAdminNotes: (id: string, notes: string) => Promise<void>;
  issueCertificate: (studentId: string) => Promise<void>;
  updateSettingsToggle: (key: keyof Omit<SystemSettings, 'pipelineOrder'|'templates'>) => void;
  updatePipelineOrder: (order: string[]) => void;
  addAuthority: (auth: any) => Promise<void>;
  addStudent: (stu: any) => Promise<void>;
  bulkAddStudents: (students: any[]) => Promise<any>;
  addCsvUpload: (fileData: any) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  deleteAuthority: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminContext = createContext<AdminState | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  
  const [profile, setProfile] = useState({ name: 'Nexus Admin', email: 'admin@nexus.edu' });
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [authorities, setAuthorities] = useState<AuthorityNode[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    databaseOnline: true, emailNudgeActive: false, paymentGatewayActive: true, qrServiceOnline: true,
    pipelineOrder: ['library', 'laboratory', 'accounts', 'hod', 'principal'],
    templates: { approval: '', rejection: '', nudge: '' }
  });
  const [csvHistory, setCsvHistory] = useState<CsvHistory[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSyncData = async () => {
    const effectiveRole = currentUser?.sub_role || currentUser?.role;
    if (!currentUser || effectiveRole !== 'admin') { setLoading(false); return; }
    try {
      const { data } = await api.get('/api/admin/sync');
      const res = data.data;
      setProfile({ name: currentUser.name, email: currentUser.email });
      setAuthorities(res.authorities);
      setSettings(res.settings);
      setCsvHistory(res.csvHistory);
      
      const mappedStudents = res.students.map((s: any) => ({
         ...s,
         certStatus: s.certStatus === 'Ready' || s.certStatus === 'Ready to Issue' ? 'Ready to Issue' : s.certStatus
      }));
      setStudents(mappedStudents);

    } catch (err) { console.error('Admin Sync Failed', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchSyncData(); }, [currentUser]);

  const refresh = async () => { setLoading(true); await fetchSyncData(); };

  const toggleStudentBlock = async (id: string, blocked?: boolean) => {
    await api.post('/api/admin/students/block', { id, blocked });
    fetchSyncData();
  };

  const overrideDepartmentStatus = async (studentId: string, deptName: string, status: DeptStatus) => {
    // Map Action Required -> Action Required. Frontend sends Pending / Cleared / Blocked.
    await api.post('/api/admin/students/override', { studentId, deptName, status });
    fetchSyncData();
  };

  const updateAdminNotes = async (id: string, notes: string) => {
    await api.post('/api/admin/students/notes', { id, notes });
    fetchSyncData();
  };

  const issueCertificate = async (studentId: string) => {
    await api.post('/api/admin/certificates/issue', { studentId });
    fetchSyncData();
  };

  const updateSettingsToggle = (key: keyof Omit<SystemSettings, 'pipelineOrder'|'templates'>) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updatePipelineOrder = (order: string[]) => setSettings(p => ({ ...p, pipelineOrder: order }));

  const addAuthority = async (auth: any) => {
    await api.post('/api/auth/register', {
      name: auth.name,
      email: auth.email,
      password: auth.password,
      role: auth.role, // already mapped to sub_role value by component (e.g. 'lab-incharge')
    });
    fetchSyncData();
  };

  const addStudent = async (stu: any) => {
    await api.post('/api/auth/register', {
      name: stu.name,
      email: stu.email,
      password: stu.password,
      role: 'student',
      branch: stu.branch,
      batch: stu.batch,
      rollNo: stu.rollNo || null
    });
    fetchSyncData();
  };

  const bulkAddStudents = async (students: any[]) => {
    const { data } = await api.post('/api/admin/students/bulk', { students });
    fetchSyncData();
    return data;
  };

  // addCsvUpload: called by CsvUpload.tsx AFTER the real upload already succeeded.
  // Just update local history state — no backend call needed here.
  const addCsvUpload = async ({ filename, department, rows, flagged: flaggedCount }: any) => {
    const entry: CsvHistory = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      filename: filename || 'dues_batch.csv',
      department,
      rows: rows ?? 0,
      flagged: flaggedCount ?? 0,
    };
    setCsvHistory(prev => [entry, ...prev]);
  };

  const deleteStudent = async (id: string) => {
    await api.delete(`/api/admin/students/${id}`);
    fetchSyncData();
  };

  const deleteAuthority = async (id: string) => {
    await api.delete(`/api/admin/authorities/${id}`);
    fetchSyncData();
  };

  return (
    <AdminContext.Provider value={{
      profile, students, authorities, settings, csvHistory, notifications, loading, refresh,
      toggleStudentBlock, overrideDepartmentStatus, updateAdminNotes, issueCertificate,
      updateSettingsToggle, updatePipelineOrder, addAuthority, addStudent, bulkAddStudents, addCsvUpload, deleteStudent, deleteAuthority
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) throw new Error('useAdmin must be used within an AdminProvider');
  return context;
}
