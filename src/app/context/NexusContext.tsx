import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';
import { safeDate } from '../utils/formatters';

export type UserProfile = {
  name: string;
  rollNo: string;
  batch: string;
  branch: string;
  avatar: string;
};

export type DepartmentStatus = 'Cleared' | 'Pending' | 'Action Required' | 'Not Submitted';

export type Department = {
  id: string;
  name: string;
  authority: string;
  status: DepartmentStatus;
  note: string;
  lastUpdated: string;
};

export type Notification = {
  id: string;
  type: 'approval' | 'rejection' | 'payment' | 'system';
  title: string;
  description: string;
  time: string;
  read: boolean;
};

export type Payment = {
  id: string;
  department: string;
  amount: number;
  date: string;
  receiptNo: string;
  status: string;
  type: 'fine' | 'deposit' | 'repair';
};

export type Due = {
  id: string;
  department: string;
  reason: string;
  amount: number;
  dueDate: string;
};

export type Document = {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  status: 'Verified' | 'Under Review' | 'Rejected';
  rejectionReason?: string;
};

type NexusContextType = {
  profile: UserProfile;
  application: any;
  departments: Department[];
  notifications: Notification[];
  documents: Document[];
  dues: Due[];
  payments: Payment[];
  loading: boolean;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  payDue: (id: string) => Promise<void>;
  uploadDocument: (doc: Document) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const NexusContext = createContext<NexusContextType | undefined>(undefined);

export function NexusProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Student', rollNo: 'N/A', batch: '2021-2025', branch: 'Computer Science', avatar: 'S'
  });
  const [application, setApplication] = useState<any>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dues, setDues] = useState<Due[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);


  const fetchSyncData = async () => {
    if (!currentUser || currentUser.role !== 'student') {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('http://127.0.0.1:5006/api/applications/mine');
      
      const appData = data.application;

      if (!appData) {
        setApplication(null);
        setDepartments([]);
        setLoading(false);
        return;
      }

      setProfile({
        name: currentUser.name,
        rollNo: currentUser.roll_number || 'N/A',
        batch: currentUser.batch || '2021-2025',
        branch: currentUser.programme || 'Unknown',
        avatar: currentUser.name.substring(0, 2).toUpperCase()
      });

      setApplication(appData);

      setDepartments(
        appData.departments.map((d: any) => ({
          id: d.id,
          name: d.department,
          authority: d.authority,
          status: d.status,
          note: d.flag_reason || '',
          lastUpdated: safeDate(d.last_updated)
        }))
      );

      setDocuments(
        appData.documents.map((d: any) => ({
          id: d.id,
          name: d.name,
          type: d.doc_type,
          size: '—',
          date: safeDate(d.created_at),
          status: d.status
        }))
      );

      setDues(
        appData.dueFlags.map((d: any) => ({
          id: d.id,
          department: d.department,
          reason: d.reason,
          amount: Number(d.amount),
          dueDate: safeDate(d.created_at)
        }))
      );

      setPayments(
        appData.payments.map((p: any) => ({
          id: p.id,
          department: p.department,
          amount: Number(p.amount),
          date: safeDate(p.paid_at),
          receiptNo: p.receipt_no,
          status: p.status,
          type: p.department.toLowerCase().includes('library') ? 'fine' : 'repair'
        }))
      );

      setNotifications(
        (appData.notifications || []).map((n: any) => {
          let payload: any = {};
          try {
            payload = JSON.parse(n.message);
          } catch {
            payload = { type: 'system', title: 'Notification', description: n.message };
          }
          return {
            id: n.id,
            type: payload.type || 'system',
            title: payload.title || 'Notification',
            description: payload.description || n.message,
            time: safeDate(n.created_at),
            read: n.is_read
          };
        })
      );

    } catch (err) {
      console.error('Failed to sync student data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncData();
  }, [currentUser]);

  const refresh = async () => {
    setLoading(true);
    await fetchSyncData();
  };

  const markNotificationRead = async (id: string) => {
    await api.post('/api/student/notifications/read', { notifId: id });
    fetchSyncData();
  };
  
  const markAllNotificationsRead = async () => {
    await api.post('/api/student/notifications/read-all');
    fetchSyncData();
  };

  const payDue = async (id: string) => {
    await api.post('/api/student/pay', { dueId: id });
    fetchSyncData();
  };

  const uploadDocument = async (doc: Document) => {
    // This is a legacy method, DocumentVault uses /api/documents/upload
    await api.post('/api/documents/upload', { name: doc.name, doc_type_code: doc.type });
    fetchSyncData();
  };

  const deleteDocument = async (id: string) => {
    // Legacy / Internal cleanup
    await api.delete(`/api/documents/${id}`);
    fetchSyncData();
  };

  return (
    <NexusContext.Provider
      value={{
        profile,
        application,
        departments,
        notifications,
        documents,
        dues,
        payments,
        loading,
        markNotificationRead,
        markAllNotificationsRead,
        payDue,
        uploadDocument,
        deleteDocument,
        refresh
      }}
    >
      {children}
    </NexusContext.Provider>
  );
}

export function useNexus() {
  const context = useContext(NexusContext);
  if (context === undefined) {
    throw new Error('useNexus must be used within a NexusProvider');
  }
  return context;
}
