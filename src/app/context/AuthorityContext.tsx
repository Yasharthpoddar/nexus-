import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
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

  const getRoute = () => {
    const role = currentUser?.sub_role?.toLowerCase() || currentUser?.role?.toLowerCase();
    if (role === 'principal') return '/api/principal';
    if (role === 'librarian') return '/api/library';
    if (role === 'lab-incharge') return '/api/lab';
    return '/api/hod'; // Default to HOD
  };

  const fetchSyncData = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const route = getRoute();

    try {
      const { data } = await api.get(`${route}/sync`);
      
      const resData = data.data;

      setProfile({
        name: currentUser.name,
        role: currentUser.sub_role || 'Authority',
        department: currentUser.department || 'Academic'
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
    await api.post(`${getRoute()}/approve`, { appId: id, comment });
    fetchSyncData();
  };

  const flagApplication = async (id: string, comment: string) => {
    await api.post(`${getRoute()}/flag`, { appId: id, comment });
    fetchSyncData();
  };

  // Batch: fan out to individual calls (same as Principal — avoids needing a separate batch endpoint)
  const batchAction = async (ids: string[], action: 'Approve' | 'Flag') => {
    const route = getRoute();
    await Promise.all(ids.map(id =>
      action === 'Approve'
        ? api.post(`${route}/approve`, { appId: id, comment: 'Batch approved' })
        : api.post(`${route}/flag`,    { appId: id, comment: 'Batch flagged'   })
    ));
    fetchSyncData();
  };

  const undoDecision = async (id: string) => {
    await api.post(`${getRoute()}/undo`, { appId: id });
    fetchSyncData();
  };

  const markNotificationRead = async (id: string) => {
    await api.post(`${getRoute()}/notifications/read`, { notifId: id });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    const route = getRoute();
    // Mark all unread notifications read via individual calls (no bulk endpoint needed)
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n =>
      api.post(`${route}/notifications/read`, { notifId: n.id })
    ));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleDocumentVerification = async (appId: string, docId: string) => {
    await api.post(`${getRoute()}/document/verify`, { docId });
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
