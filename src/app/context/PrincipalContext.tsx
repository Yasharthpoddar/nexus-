import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { Application, AuthNotification } from './AuthorityContext';

interface PrincipalState {
  profile: { name: string, role: string, department: string };
  pendingApps: Application[];
  reviewedApps: Application[];
  notifications: AuthNotification[];
  stats: any;
  loading: boolean;
  approveApplication: (id: string, comment?: string) => Promise<void>;
  flagApplication: (id: string, comment: string) => Promise<void>;
  undoDecision: (id: string) => Promise<void>;
  generateCertificate: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PrincipalContext = createContext<PrincipalState | undefined>(undefined);

// Safe parser: handles both plain-string messages (new pipeline) and legacy JSON blobs
function parseNotification(n: any): AuthNotification {
  let payload: { type?: string; title?: string; description?: string } = {};
  try {
    const parsed = JSON.parse(n.message);
    if (typeof parsed === 'object' && parsed !== null) {
      payload = parsed;
    } else {
      payload = { type: 'system', title: 'Notification', description: String(parsed) };
    }
  } catch {
    payload = { type: 'system', title: 'Notification', description: n.message || '' };
  }
  return {
    id: n.id,
    type: (payload.type as AuthNotification['type']) || 'system',
    title: payload.title || 'Notification',
    description: payload.description || n.message || '',
    timestamp: n.created_at,   // keep raw ISO — let UI components format as needed
    read: n.is_read
  };
}

export function PrincipalProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState({
    name: 'Dr. Vandana Rao',
    role: 'Principal',
    department: 'Institution Apex'
  });

  const [pendingApps, setPendingApps] = useState<Application[]>([]);
  const [reviewedApps, setReviewedApps] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<AuthNotification[]>([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchSyncData = async () => {
    // Accept users with role=admin and sub_role=principal, or direct role=principal
    if (!currentUser || (currentUser.sub_role !== 'principal' && currentUser.role !== 'principal')) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('nexus_token');
      const { data } = await axios.get('/api/principal/sync', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const resData = data.data;

      setProfile({
        name: currentUser.name,
        role: 'Principal',
        department: 'Institution Apex'
      });

      const mapExtState = (s: string) =>
        s === 'Cleared' ? 'Approved' : s === 'Action Required' ? 'Flagged' : s;

      setPendingApps((resData.pendingApps || []).map((a: any) => ({ ...a, status: mapExtState(a.status) })));
      setReviewedApps((resData.reviewedApps || []).map((a: any) => ({ ...a, status: mapExtState(a.status) })));
      setNotifications((resData.notifications || []).map(parseNotification));
      setStats(resData.stats || {});

    } catch (err) {
      console.error('Failed to sync principal data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSyncData(); }, [currentUser]);

  const refresh = async () => { setLoading(true); await fetchSyncData(); };

  const approveApplication = async (id: string, comment?: string) => {
    const token = localStorage.getItem('nexus_token');
    await axios.post('/api/principal/approve', { appId: id, comment }, { headers: { Authorization: `Bearer ${token}` } });
    fetchSyncData();
  };

  const flagApplication = async (id: string, comment: string) => {
    const token = localStorage.getItem('nexus_token');
    await axios.post('/api/principal/flag', { appId: id, comment }, { headers: { Authorization: `Bearer ${token}` } });
    fetchSyncData();
  };

  const undoDecision = async (id: string) => {
    const token = localStorage.getItem('nexus_token');
    await axios.post('/api/principal/undo', { appId: id }, { headers: { Authorization: `Bearer ${token}` } });
    fetchSyncData();
  };

  const generateCertificate = async (_id: string) => {
    // Certificates auto-generate via pipeline on document approval — no manual trigger needed
  };

  const markNotificationRead = async (id: string) => {
    const token = localStorage.getItem('nexus_token');
    try {
      await axios.post('/api/principal/notifications/read', { id }, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch { /* silently fail */ }
  };

  const markAllRead = async () => {
    const token = localStorage.getItem('nexus_token');
    try {
      await axios.post('/api/principal/notifications/read-all', {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* silently fail */ }
  };

  return (
    <PrincipalContext.Provider value={{
      profile, pendingApps, reviewedApps, notifications, stats, loading, refresh,
      approveApplication, flagApplication, undoDecision, generateCertificate,
      markNotificationRead, markAllRead
    }}>
      {children}
    </PrincipalContext.Provider>
  );
}

export function usePrincipal() {
  const context = useContext(PrincipalContext);
  if (context === undefined) {
    throw new Error('usePrincipal must be used within a PrincipalProvider');
  }
  return context;
}
