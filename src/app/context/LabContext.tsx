import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

export interface EquipmentStatus {
  labManual: 'Returned' | 'Pending';
  equipmentKit: 'Returned' | 'Pending';
  safetyDeposit: 'Returned' | 'Pending';
  labCard: 'Returned' | 'Pending';
}

export interface LabStudent {
  id: string;
  rollNo: string;
  name: string;
  branch: string;
  batch: string;
  email: string;
  submittedAt: string;
  status: 'Pending' | 'Cleared' | 'Action Required' | 'Approved' | 'Flagged';
  decisionDate?: string;
  decisionComment?: string;
  documents: { name: string; type: string; verified: boolean }[];
  equipment: EquipmentStatus;
}

interface ActivityEvent {
  id: string;
  type: 'approved' | 'flagged' | 'nudge' | 'submission' | 'equipment';
  title: string;
  timestamp: string;
}

interface LabContextType {
  profile: any;
  labStudents: LabStudent[];
  activities: ActivityEvent[];
  loading: boolean;
  approveStudent: (id: string, notes: string) => Promise<void>;
  flagStudent: (id: string, comment: string, notes: string) => Promise<void>;
  toggleEquipmentStatus: (id: string, key: keyof EquipmentStatus) => Promise<void>;
  executeBulkReturn: (ids: string[]) => Promise<void>;
  undoDecision: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

export const LabProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  
  const [profile, setProfile] = useState<any>({
    name: 'Lab Admin', role: 'Lab In-charge', department: 'Computer Science', initials: 'L'
  });
  
  const [labStudents, setLabStudents] = useState<LabStudent[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSyncData = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    const isLabUser = currentUser.sub_role === 'lab-incharge' || currentUser.role === 'lab-incharge';
    if (!isLabUser) {
      setLoading(false);
      return;
    }


    try {
      const token = localStorage.getItem('nexus_token');
      const { data } = await axios.get('/api/lab/sync', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const resData = data.data;

      setProfile({
        name: currentUser.name,
        email: currentUser.email,
        role: 'Lab In-charge',
        department: 'Computer Science',
        initials: currentUser.name.substring(0, 2).toUpperCase()
      });

      setLabStudents(
        resData.labStudents.map((s: any) => ({
          ...s,
          // Convert database 'Cleared' back to 'Approved' to match the legacy dashboard visual engine without breaking the UI states
          status: s.status === 'Cleared' ? 'Approved' : s.status === 'Action Required' ? 'Flagged' : s.status
        }))
      );
      setActivities(resData.activities);
    } catch (err) {
      console.error('Failed to sync lab data', err);
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

  const approveStudent = async (id: string, notes: string) => {
    const token = localStorage.getItem('nexus_token');
    await axios.post('/api/lab/approve', { appId: id, notes }, { headers: { Authorization: `Bearer ${token}` }});
    fetchSyncData();
  };

  const flagStudent = async (id: string, comment: string, notes: string) => {
    const token = localStorage.getItem('nexus_token');
    await axios.post('/api/lab/flag', { appId: id, comment, notes }, { headers: { Authorization: `Bearer ${token}` }});
    fetchSyncData();
  };

  const toggleEquipmentStatus = async (id: string, key: keyof EquipmentStatus) => {
    const token = localStorage.getItem('nexus_token');
    await axios.post('/api/lab/equipment', { appId: id, key }, { headers: { Authorization: `Bearer ${token}` }});
    fetchSyncData();
  };

  const executeBulkReturn = async (ids: string[]) => {
    const token = localStorage.getItem('nexus_token');
    await axios.post('/api/lab/equipment/bulk', { ids }, { headers: { Authorization: `Bearer ${token}` }});
    fetchSyncData();
  };

  const undoDecision = async (id: string) => {
     const token = localStorage.getItem('nexus_token');
     await axios.post('/api/lab/undo', { appId: id }, { headers: { Authorization: `Bearer ${token}` }});
     fetchSyncData();
  };

  return (
    <LabContext.Provider value={{
      profile, labStudents, activities, loading, refresh,
      approveStudent, flagStudent, toggleEquipmentStatus, executeBulkReturn, undoDecision
    }}>
      {children}
    </LabContext.Provider>
  );
};

export const useLab = () => {
  const context = useContext(LabContext);
  if (!context) throw new Error('useLab must be used within LabProvider');
  return context;
};
