import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

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
    name: 'Student', rollNo: 'N/A', batch: '2021–2025', branch: 'Computer Science', avatar: 'S'
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
      const token = localStorage.getItem('nexus_token');
      const { data } = await axios.get('/api/student/sync', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const resData = data.data;

      // Map raw backend schema to frontend structural interface
      setProfile({
        name: currentUser.name,
        rollNo: currentUser.roll_number || 'N/A',
        batch: currentUser.batch || '2021-2025',
        branch: currentUser.programme || 'Unknown',
        avatar: currentUser.name.substring(0, 2).toUpperCase()
      });

      setApplication(resData.application);

      const mapDeptId = (name: string) => {
        if (name.includes('Libra')) return 'lib';
        if (name.includes('Lab')) return 'lab';
        if (name.includes('Acc')) return 'acc';
        if (name.includes('HOD')) return 'hod';
        if (name.includes('Prin')) return 'prin';
        if (name.includes('Sport')) return 'spo';
        if (name.includes('Hostel')) return 'hos';
        return name;
      };

      setDepartments(
        resData.departments.map((d: any) => ({
          id: mapDeptId(d.department),
          name: d.department,
          authority: d.authority,
          status: d.status,
          note: d.flag_reason || '',
          lastUpdated: d.last_updated || new Date().toISOString()
        }))
      );

      setDocuments(
        resData.documents.map((d: any) => ({
          id: d.id,
          name: d.name,
          type: d.doc_type,
          size: '1.2 MB', // Mocking size
          date: new Date(d.date).toLocaleDateString(),
          status: d.status
        }))
      );

      setNotifications(
        resData.notifications.map((n: any) => {
          // Notifications can be either legacy JSON blobs or new plain-text pipeline messages.
          // Always try JSON first, fall back to treating the message as a plain string.
          let payload: { type?: string; title?: string; description?: string } = {};
          try {
            const parsed = JSON.parse(n.message);
            // Confirm it's actually a notification object, not a random string
            if (typeof parsed === 'object' && parsed !== null) {
              payload = parsed;
            } else {
              payload = { type: 'system', title: 'Notification', description: String(parsed) };
            }
          } catch {
            // Plain string message — use it as the description directly
            payload = { type: 'system', title: 'Notification', description: n.message || '' };
          }
          return {
            id: n.id,
            type: payload.type || 'system',
            title: payload.title || 'Notification',
            description: payload.description || n.message || '',
            time: new Date(n.created_at).toLocaleDateString(),
            read: n.is_read
          };
        })
      );

      setDues(
        resData.dues.filter((d: any) => !d.is_paid).map((d: any) => ({
          id: d.id,
          department: d.department,
          reason: d.reason,
          amount: d.amount,
          dueDate: new Date().toLocaleDateString()
        }))
      );

      setPayments(
        resData.payments.map((p: any) => ({
          id: p.id,
          department: p.department,
          amount: p.amount,
          date: new Date(p.paid_at).toLocaleString(),
          receiptNo: p.receipt_no,
          status: p.status,
          type: p.department.toLowerCase().includes('library') ? 'fine' : 'repair'
        }))
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
    const token = localStorage.getItem('nexus_token');
    await axios.post('/api/student/notifications/read', { notifId: id }, { headers: { Authorization: `Bearer ${token}` }});
    fetchSyncData();
  };
  
  const markAllNotificationsRead = async () => {
    const token = localStorage.getItem('nexus_token');
    await axios.post('/api/student/notifications/read-all', {}, { headers: { Authorization: `Bearer ${token}` }});
    fetchSyncData();
  };

  const payDue = async (id: string) => {
    const token = localStorage.getItem('nexus_token');
    await axios.post('/api/student/pay', { dueId: id }, { headers: { Authorization: `Bearer ${token}` }});
    fetchSyncData();
  };

  const uploadDocument = async (doc: Document) => {
    const token = localStorage.getItem('nexus_token');
    await axios.post('/api/student/document', { name: doc.name, doc_type: doc.type, size: doc.size }, { headers: { Authorization: `Bearer ${token}` }});
    fetchSyncData();
  };

  const deleteDocument = async (id: string) => {
    const token = localStorage.getItem('nexus_token');
    await axios.delete(`/api/student/document/${id}`, { headers: { Authorization: `Bearer ${token}` }});
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
