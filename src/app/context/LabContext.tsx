import React, { createContext, useContext, useState, ReactNode } from 'react';
import { subDays, subHours } from 'date-fns';

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
  status: 'Pending' | 'Approved' | 'Flagged';
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
  approveStudent: (id: string, notes: string) => void;
  flagStudent: (id: string, comment: string, notes: string) => void;
  toggleEquipmentStatus: (id: string, key: keyof EquipmentStatus) => void;
  executeBulkReturn: (ids: string[]) => void;
  undoDecision: (id: string) => void;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

export const LabProvider = ({ children }: { children: ReactNode }) => {
  const profile = {
    name: 'Dr. Rajesh Mehta',
    email: 'lab.mehta@college.edu',
    role: 'Lab In-charge',
    department: 'Computer Science',
    initials: 'DM'
  };

  const [labStudents, setLabStudents] = useState<LabStudent[]>([
    {
      id: 'APP-101', rollNo: '21CS088', name: 'Hritani Joshi', branch: 'Computer Science', batch: '2025', email: '21cs088@college.edu',
      submittedAt: subDays(new Date(), 3).toISOString(), status: 'Pending',
      documents: [{ name: 'Clearance_Form.pdf', type: 'PDF', verified: false }],
      equipment: { labManual: 'Pending', equipmentKit: 'Returned', safetyDeposit: 'Returned', labCard: 'Returned' }
    },
    {
      id: 'APP-102', rollNo: '21CS042', name: 'Rohan Patil', branch: 'Computer Science', batch: '2025', email: '21cs042@college.edu',
      submittedAt: subDays(new Date(), 1).toISOString(), status: 'Pending',
      documents: [{ name: 'Lab_Dues_Receipt.pdf', type: 'Receipt', verified: false }],
      equipment: { labManual: 'Returned', equipmentKit: 'Returned', safetyDeposit: 'Returned', labCard: 'Returned' }
    },
    {
      id: 'APP-103', rollNo: '21CS031', name: 'Priya Mehta', branch: 'Computer Science', batch: '2025', email: 'priya.m@college.edu',
      submittedAt: new Date().toISOString(), status: 'Pending',
      documents: [{ name: 'Final_Project_Signoff.pdf', type: 'PDF', verified: false }],
      equipment: { labManual: 'Returned', equipmentKit: 'Returned', safetyDeposit: 'Returned', labCard: 'Returned' }
    },
    {
      id: 'APP-104', rollNo: '21CS067', name: 'Arjun Nair', branch: 'Computer Science', batch: '2025', email: 'arjun.n@college.edu',
      submittedAt: subDays(new Date(), 4).toISOString(), status: 'Pending',
      documents: [{ name: 'Clearance_Form.pdf', type: 'PDF', verified: false }],
      equipment: { labManual: 'Returned', equipmentKit: 'Pending', safetyDeposit: 'Returned', labCard: 'Returned' }
    },
    {
      id: 'APP-105', rollNo: '21CS019', name: 'Fatima Khan', branch: 'Computer Science', batch: '2025', email: 'fatima.k@college.edu',
      submittedAt: subDays(new Date(), 2).toISOString(), status: 'Pending',
      documents: [{ name: 'Clearance_Form.pdf', type: 'PDF', verified: false }],
      equipment: { labManual: 'Returned', equipmentKit: 'Returned', safetyDeposit: 'Pending', labCard: 'Returned' }
    },
    // Adding placeholder rows
    ...Array.from({length: 9}).map((_, i) => ({
      id: `APP-20${i}`, rollNo: `21CS10${i}`, name: `Dummy Student ${i}`, branch: 'Computer Science', batch: '2025', email: `dummy${i}@college.edu`,
      submittedAt: subDays(new Date(), Math.floor(Math.random() * 5)).toISOString(), status: 'Pending' as any,
      documents: [{ name: 'Clearance_Form.pdf', type: 'PDF', verified: false }],
      equipment: { labManual: 'Returned', equipmentKit: 'Returned', safetyDeposit: 'Returned', labCard: 'Returned' } as any
    }))
  ]);

  const [activities, setActivities] = useState<ActivityEvent[]>([
    { id: '1', type: 'approved', title: 'Approved Raj Sharma', timestamp: subHours(new Date(), 2).toISOString() },
    { id: '2', type: 'equipment', title: 'Rohan Patil returned Equip Kit', timestamp: subHours(new Date(), 4).toISOString() },
    { id: '3', type: 'submission', title: 'New submission from Priya Mehta', timestamp: subHours(new Date(), 5).toISOString() },
    { id: '4', type: 'flagged', title: 'Flagged Arjun Nair (Kit Due)', timestamp: subDays(new Date(), 1).toISOString() },
    { id: '5', type: 'nudge', title: 'System Nudge: 3 Overdue pending', timestamp: subDays(new Date(), 2).toISOString() }
  ]);

  const approveStudent = (id: string, notes: string) => {
    setLabStudents(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'Approved', decisionDate: new Date().toISOString(), decisionComment: 'Approved via Checklist' } : s
    ));
    setActivities(prev => [{ id: Date.now().toString(), type: 'approved', title: `Approved App ${id}`, timestamp: new Date().toISOString() }, ...prev]);
  };

  const flagStudent = (id: string, comment: string, notes: string) => {
    setLabStudents(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'Flagged', decisionDate: new Date().toISOString(), decisionComment: comment } : s
    ));
    setActivities(prev => [{ id: Date.now().toString(), type: 'flagged', title: `Flagged App ${id}`, timestamp: new Date().toISOString() }, ...prev]);
  };

  const toggleEquipmentStatus = (id: string, key: keyof EquipmentStatus) => {
    setLabStudents(prev => prev.map(s => {
      if (s.id !== id) return s;
      const current = s.equipment[key];
      return {
        ...s,
        equipment: {
          ...s.equipment,
          [key]: current === 'Returned' ? 'Pending' : 'Returned'
        }
      };
    }));
  };

  const executeBulkReturn = (ids: string[]) => {
    setLabStudents(prev => prev.map(s => {
      if (!ids.includes(s.id)) return s;
      return {
        ...s,
        equipment: { labManual: 'Returned', equipmentKit: 'Returned', safetyDeposit: 'Returned', labCard: 'Returned' }
      };
    }));
  };

  const undoDecision = (id: string) => {
    // Only undo if within 24h mock check (the UI will check, but we just reset here)
    setLabStudents(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'Pending', decisionDate: undefined, decisionComment: undefined } : s
    ));
  };

  return (
    <LabContext.Provider value={{
      profile, labStudents, activities,
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
