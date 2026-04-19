import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

export type ApplicationStatus = 'Pending' | 'Cleared' | 'Action Required' | 'Approved' | 'Flagged';

export interface Application {
  id: string;
  studentName: string;
  rollNo: string;
  branch: string;
  batch: string;
  email: string;
  submissionDate: string;
  daysWaiting: number;
  status: ApplicationStatus;
  documents: { id: string, name: string, type: string, size: string, isVerified: boolean, date: string }[];
  history: { id: string, actor: string, role: string, action: string, comment?: string, date: string }[];
  decisionComment?: string;
  decisionDate?: string;
}

export interface AuthNotification {
  id: string;
  type: 'submission' | 'stale' | 'chain' | 'system' | 'approval' | 'rejection';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

interface AuthorityState {
  profile: { name: string, role: string, department: string };
  pendingApps: Application[];
  reviewedApps: Application[];
  notifications: AuthNotification[];
  loading: boolean;
  approveApplication: (id: string, comment?: string) => Promise<void>;
  flagApplication: (id: string, comment: string) => Promise<void>;
  batchAction: (ids: string[], action: 'Approve' | 'Flag') => Promise<void>;
  undoDecision: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  toggleDocumentVerification: (appId: string, docId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthorityContext = createContext<AuthorityState | undefined>(undefined);

export function AuthorityProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState({
    name: 'Prof. Anita Sharma',
    role: 'HOD',
    department: 'Computer Science'
  });

  const [pendingApps, setPendingApps] = useState<Application[]>([]);
  const [reviewedApps, setReviewedApps] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<AuthNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSyncData = async () => {
    // Accept both: admin users with sub_role=hod, AND users with role=hod
    if (!currentUser) {
      setLoading(false);
      return;
    }
    const isHodUser = currentUser.sub_role === 'hod' || currentUser.role === 'hod';
    if (!isHodUser) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('nexus_token');
      const { data } = await axios.get('/api/hod/sync', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const resData = data.data;

      setProfile({
        name: currentUser.name,
        role: 'HOD',
        department: 'Computer Science'
      });

      // Map Cleared/Action Required to Approved/Flagged for UI visual parity
      const mapExtState = (s: string) => s === 'Cleared' ? 'Approved' : s === 'Action Required' ? 'Flagged' : s;

      setPendingApps(resData.pendingApps.map((a: any) => ({ ...a, status: mapExtState(a.status) })));
      setReviewedApps(resData.reviewedApps.map((a: any) => ({ ...a, status: mapExtState(a.status) })));

      // Parse notifications — backend sends raw DB rows; map to AuthNotification shape
      const rawNotifs: any[] = resData.notifications || [];
      const mapped: AuthNotification[] = rawNotifs.map((n: any) => {
        let parsed: any = {};
        try { 
          parsed = typeof n.message === 'string' ? JSON.parse(n.message) : n.message; 
          if (typeof parsed !== 'object' || parsed === null) parsed = {};
        } catch { parsed = {}; }
        return {
          id: n.id,
          type: parsed?.type || 'system',
          title: parsed?.title || 'Notification',
          description: parsed?.description || (typeof n.message === 'string' ? n.message : ''),
          timestamp: n.created_at || new Date().toISOString(),
          read: n.is_read || false,
        };
      });
      setNotifications(mapped);

    } catch (err) {
      console.error('Failed to sync hod data', err);
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

  const approveApplication = async (id: string, comment?: string) => {
    const token = localStorage.getItem('nexus_token');
    await axios.post('/api/hod/approve', { appId: id, comment }, { headers: { Authorization: `Bearer ${token}` }});
    fetchSyncData();
  };

  const flagApplication = async (id: string, comment: string) => {
    const token = localStorage.getItem('nexus_token');
    await axios.post('/api/hod/flag', { appId: id, comment }, { headers: { Authorization: `Bearer ${token}` }});
    fetchSyncData();
  };

  // Batch: fan out to individual calls (same as Principal — avoids needing a separate batch endpoint)
  const batchAction = async (ids: string[], action: 'Approve' | 'Flag') => {
    const token = localStorage.getItem('nexus_token');
    const hdrs = { Authorization: `Bearer ${token}` };
    await Promise.all(ids.map(id =>
      action === 'Approve'
        ? axios.post('/api/hod/approve', { appId: id, comment: 'Batch approved by HOD' }, { headers: hdrs })
        : axios.post('/api/hod/flag',    { appId: id, comment: 'Batch flagged by HOD'   }, { headers: hdrs })
    ));
    fetchSyncData();
  };

  const undoDecision = async (id: string) => {
    const token = localStorage.getItem('nexus_token');
    await axios.post('/api/hod/undo', { appId: id }, { headers: { Authorization: `Bearer ${token}` }});
    fetchSyncData();
  };

  const markNotificationRead = async (id: string) => {
    const token = localStorage.getItem('nexus_token');
    await axios.post('/api/hod/notifications/read', { notifId: id }, { headers: { Authorization: `Bearer ${token}` }});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    const token = localStorage.getItem('nexus_token');
    // Mark all unread notifications read via individual calls (no bulk endpoint needed)
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n =>
      axios.post('/api/hod/notifications/read', { notifId: n.id }, { headers: { Authorization: `Bearer ${token}` }})
    ));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleDocumentVerification = async (appId: string, docId: string) => {
    const token = localStorage.getItem('nexus_token');
    await axios.post('/api/hod/document/verify', { docId }, { headers: { Authorization: `Bearer ${token}` }});
    fetchSyncData();
  };

  return (
    <AuthorityContext.Provider value={{
      profile, pendingApps, reviewedApps, notifications, loading, refresh,
      approveApplication, flagApplication, batchAction, undoDecision,
      markNotificationRead, markAllRead, toggleDocumentVerification
    }}>
      {children}
    </AuthorityContext.Provider>
  );
}

export function useAuthority() {
  const context = useContext(AuthorityContext);
  if (context === undefined) {
    throw new Error('useAuthority must be used within an AuthorityProvider');
  }
  return context;
}
