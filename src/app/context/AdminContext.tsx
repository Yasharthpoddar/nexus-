import React, { createContext, useContext, useState } from 'react';
import { formatDistanceToNow, subDays, subHours } from 'date-fns';

export type DeptStatus = 'Cleared' | 'Pending' | 'Blocked';
export type CertStatus = 'Ready to Issue' | 'Already Issued' | 'Not Ready';

export interface DepartmentNode {
  id: string;
  name: string;
  authority: string;
  status: DeptStatus;
  lastUpdated: string;
}

export interface AdminStudent {
  id: string;
  name: string;
  rollNo: string;
  branch: string;
  batch: string;
  email: string;
  phone: string;
  enrollmentDate: string;
  isBlocked: boolean;
  departments: DepartmentNode[];
  documents: { id: string, name: string, type: string, date: string, status: 'Verified' | 'Rejected' | 'Pending' }[];
  payments: { id: string, date: string, dept: string, amount: string, receiptNo: string, status: string }[];
  adminNotes: string;
  certStatus: CertStatus;
  certificateNo?: string;
  issueDate?: string;
}

export interface AuthorityNode {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  joined: string;
  pendingCount: number;
  reviewedCount: number;
  avgTimeDays: number;
  isOnline: boolean;
}

export interface SystemSettings {
  databaseOnline: boolean;
  emailNudgeActive: boolean;
  paymentGatewayActive: boolean;
  qrServiceOnline: boolean;
  pipelineOrder: string[];
  templates: { approval: string, rejection: string, nudge: string };
}

export interface CsvHistory {
  id: string;
  timestamp: string;
  filename: string;
  department: string;
  rows: number;
  flagged: number;
}

interface AdminState {
  profile: { name: string, email: string };
  students: AdminStudent[];
  authorities: AuthorityNode[];
  settings: SystemSettings;
  csvHistory: CsvHistory[];
  notifications: any[];
  toggleStudentBlock: (id: string, blocked?: boolean) => void;
  overrideDepartmentStatus: (studentId: string, deptId: string, status: DeptStatus) => void;
  updateAdminNotes: (id: string, notes: string) => void;
  issueCertificate: (studentId: string) => void;
  updateSettingsToggle: (key: keyof Omit<SystemSettings, 'pipelineOrder'|'templates'>) => void;
  updatePipelineOrder: (order: string[]) => void;
  addAuthority: (auth: any) => void;
  addCsvUpload: (csv: any) => void;
}

const AdminContext = createContext<AdminState | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [profile] = useState({ name: 'Nexus Admin', email: 'admin@nexus.edu' });

  const getMockDepartments = (isCleared = false) => [
    { id: 'lib', name: 'Library', authority: 'Librarian', status: isCleared ? 'Cleared' : 'Pending' as DeptStatus, lastUpdated: subDays(new Date(), 4).toISOString() },
    { id: 'lab', name: 'Laboratory', authority: 'Lab In-charge', status: isCleared ? 'Cleared' : 'Pending' as DeptStatus, lastUpdated: subDays(new Date(), 3).toISOString() },
    { id: 'acc', name: 'Accounts', authority: 'Fin Officer', status: isCleared ? 'Cleared' : 'Pending' as DeptStatus, lastUpdated: subDays(new Date(), 2).toISOString() },
    { id: 'hod', name: 'HOD', authority: 'Prof. Anita Sharma', status: isCleared ? 'Cleared' : 'Pending' as DeptStatus, lastUpdated: subDays(new Date(), 2).toISOString() },
    { id: 'pri', name: 'Principal', authority: 'Dr. Vivek', status: isCleared ? 'Cleared' : 'Pending' as DeptStatus, lastUpdated: subDays(new Date(), 1).toISOString() },
    { id: 'spo', name: 'Sports', authority: 'Sports Dir', status: isCleared ? 'Cleared' : 'Pending' as DeptStatus, lastUpdated: subDays(new Date(), 5).toISOString() },
    { id: 'hos', name: 'Hostel', authority: 'Warden', status: isCleared ? 'Cleared' : 'Pending' as DeptStatus, lastUpdated: subDays(new Date(), 6).toISOString() }
  ];

  const [students, setStudents] = useState<AdminStudent[]>([
    {
      id: 'STU-001', name: 'Hritani Joshi', rollNo: '21CS088', branch: 'CSE', batch: '2025', email: 'hritani.joshi@college.edu', phone: '+91 9876543210', enrollmentDate: '2021-08-15',
      isBlocked: false, departments: getMockDepartments(true), adminNotes: '', certStatus: 'Ready to Issue',
      documents: [{ id: 'd1', name: 'IDCard.pdf', type: 'ID', date: '2025-01-10', status: 'Verified' }],
      payments: [{ id: 'p1', date: '2025-01-12', dept: 'Library', amount: '₹150', receiptNo: 'RC-9921', status: 'Paid' }]
    },
    {
      id: 'STU-002', name: 'Rohan Patil', rollNo: '21CS042', branch: 'CSE', batch: '2025', email: 'rohan.patil@college.edu', phone: '+91 9876543211', enrollmentDate: '2021-08-15',
      isBlocked: true, departments: getMockDepartments(false).map(d => d.id === 'lib' ? {...d, status: 'Blocked'} : d), adminNotes: 'Refuses to return Library Books.', certStatus: 'Not Ready',
      documents: [], payments: []
    },
    {
      id: 'STU-003', name: 'Priya Mehta', rollNo: '21CS031', branch: 'CSE', batch: '2025', email: 'priya.mehta@college.edu', phone: '+91 9876544410', enrollmentDate: '2021-08-15',
      isBlocked: false, departments: getMockDepartments(false), adminNotes: '', certStatus: 'Not Ready', documents: [], payments: []
    },
    {
      id: 'STU-004', name: 'Arjun Nair', rollNo: '21CS067', branch: 'CSE', batch: '2025', email: 'arjun.nair@college.edu', phone: '+91 9872243210', enrollmentDate: '2021-08-15',
      isBlocked: false, departments: getMockDepartments(false), adminNotes: '', certStatus: 'Not Ready', documents: [], payments: []
    },
    {
      id: 'STU-005', name: 'Fatima Khan', rollNo: '21CS019', branch: 'CSE', batch: '2025', email: 'fatima.khan@college.edu', phone: '+91 9811543210', enrollmentDate: '2021-08-15',
      isBlocked: false, departments: getMockDepartments(false), adminNotes: '', certStatus: 'Not Ready', documents: [], payments: []
    },
    {
      id: 'STU-006', name: 'Vikram Singh', rollNo: '21CS055', branch: 'IT', batch: '2025', email: 'vikram.s@college.edu', phone: '+91 9876541111', enrollmentDate: '2021-08-15',
      isBlocked: false, departments: getMockDepartments(true), adminNotes: '', certStatus: 'Already Issued', certificateNo: 'NEX-25-055', issueDate: subDays(new Date(), 2).toISOString(),
      documents: [], payments: []
    },
    {
      id: 'STU-007', name: 'Aisha Gupta', rollNo: '21CS011', branch: 'ECE', batch: '2025', email: 'aisha.g@college.edu', phone: '+91 9876541122', enrollmentDate: '2021-08-15',
      isBlocked: false, departments: getMockDepartments(false), adminNotes: '', certStatus: 'Not Ready', documents: [], payments: []
    },
    {
      id: 'STU-008', name: 'Karan Malhotra', rollNo: '21CS028', branch: 'Mechanical', batch: '2025', email: 'karan.m@college.edu', phone: '+91 9876541133', enrollmentDate: '2021-08-15',
      isBlocked: false, departments: getMockDepartments(false), adminNotes: '', certStatus: 'Not Ready', documents: [], payments: []
    }
  ]);

  const [authorities, setAuthorities] = useState<AuthorityNode[]>([
    { id: 'AUTH-1', name: 'Prof. Anita Sharma', role: 'HOD', department: 'Computer Science', email: 'anita.sharma@nexus.edu', joined: '2020-04-10', pendingCount: 15, reviewedCount: 300, avgTimeDays: 1.4, isOnline: true },
    { id: 'AUTH-2', name: 'Dr. Mehta', role: 'Lab In-charge', department: 'Computer Science', email: 'mehta@nexus.edu', joined: '2019-01-15', pendingCount: 42, reviewedCount: 890, avgTimeDays: 2.1, isOnline: false },
    { id: 'AUTH-3', name: 'The Principal', role: 'Principal', department: 'Super Admin', email: 'principal@nexus.edu', joined: '2015-08-01', pendingCount: 5, reviewedCount: 4000, avgTimeDays: 0.5, isOnline: true }
  ]);

  const [settings, setSettings] = useState<SystemSettings>({
    databaseOnline: true,
    emailNudgeActive: true,
    paymentGatewayActive: true,
    qrServiceOnline: true,
    pipelineOrder: ['Library', 'Laboratory', 'Accounts', 'Sports', 'Hostel', 'HOD', 'Principal'],
    templates: {
      approval: "Dear Student,\n\nYour graduation clearance for [Department] has been approved.",
      rejection: "Dear Student,\n\nYour application was flagged by [Department] due to: [Reason].",
      nudge: "Action Required:\n\nYou have pending clearing applications exceeding the 48h SLA limit."
    }
  });

  const [csvHistory, setCsvHistory] = useState<CsvHistory[]>([
    { id: 'CSV-1', timestamp: subHours(new Date(), 26).toISOString(), filename: 'library_dues_june.csv', department: 'Library', rows: 312, flagged: 42 },
    { id: 'CSV-2', timestamp: subDays(new Date(), 3).toISOString(), filename: 'hostel_pending_q2.csv', department: 'Hostel', rows: 58, flagged: 31 },
    { id: 'CSV-3', timestamp: subDays(new Date(), 6).toISOString(), filename: 'lab_manual_dues.csv', department: 'Laboratory', rows: 204, flagged: 14 }
  ]);

  const [notifications] = useState([{ id: 'n1', read: false }]); // Just for badge

  const updateCertStatus = (stu: AdminStudent) => {
    if(stu.certStatus === 'Already Issued') return stu;
    const allCleared = stu.departments.every(d => d.status === 'Cleared');
    return { ...stu, certStatus: allCleared ? 'Ready to Issue' : 'Not Ready' as CertStatus };
  };

  const toggleStudentBlock = (id: string, forceBlock?: boolean) => {
    setStudents(prev => prev.map(s => {
      if(s.id === id) {
        return { ...s, isBlocked: forceBlock !== undefined ? forceBlock : !s.isBlocked };
      }
      return s;
    }));
  };

  const overrideDepartmentStatus = (studentId: string, deptId: string, status: DeptStatus) => {
    setStudents(prev => prev.map(s => {
      if(s.id === studentId) {
        const nd = s.departments.map(d => d.id === deptId ? { ...d, status, lastUpdated: new Date().toISOString() } : d);
        return updateCertStatus({ ...s, departments: nd });
      }
      return s;
    }));
  };

  const updateAdminNotes = (id: string, notes: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, adminNotes: notes } : s));
  };

  const issueCertificate = (studentId: string) => {
    setStudents(prev => prev.map(s => {
      if(s.id === studentId) {
        return { ...s, certStatus: 'Already Issued', issueDate: new Date().toISOString(), certificateNo: `NEX-C-${Math.floor(Math.random()*10000)}` };
      }
      return s;
    }));
  };

  const updateSettingsToggle = (key: keyof Omit<SystemSettings, 'pipelineOrder'|'templates'>) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as any] }));
  };

  const updatePipelineOrder = (order: string[]) => {
    setSettings(prev => ({ ...prev, pipelineOrder: order }));
  };

  const addAuthority = (auth: any) => {
    const newAuth: AuthorityNode = {
      id: `AUTH-${Date.now()}`,
      name: auth.name,
      role: auth.role,
      department: auth.department,
      email: auth.email,
      joined: new Date().toISOString(),
      pendingCount: 0,
      reviewedCount: 0,
      avgTimeDays: 0,
      isOnline: false
    };
    setAuthorities(prev => [...prev, newAuth]);
  };

  const addCsvUpload = (csv: any) => {
    const newCsv: CsvHistory = {
      id: `CSV-${Date.now()}`,
      timestamp: new Date().toISOString(),
      filename: csv.filename,
      department: csv.department,
      rows: csv.rows,
      flagged: csv.flagged
    };
    setCsvHistory(prev => [newCsv, ...prev]);
  };

  return (
    <AdminContext.Provider value={{
      profile, students, authorities, settings, csvHistory, notifications,
      toggleStudentBlock, overrideDepartmentStatus, updateAdminNotes,
      issueCertificate, updateSettingsToggle, updatePipelineOrder, addAuthority, addCsvUpload
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
};
