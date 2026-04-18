# Nexus: The Automated Clearance Protocol System Documentation

This document serves as the comprehensive architectural and functional blueprint for the **Nexus Clearance Protocol**, a React-based brutalist-styled dashboard orchestrating college graduation clearance flows. 

You can upload this document directly into Claude as a foundational training set to continue development or build backend architectures.

---

## 1. Core Architecture
- **Framework**: Vite + React 18+ (Typescript)
- **Styling**: Vanilla TailwindCSS with a distinct *Brutalist* aesthetic (`border-4`, high-contrast #121212 and #F0C020, hard shadows).
- **State Management**: React Context API divided strictly by role domain (Auth, Admin, Lab, Authority, Nexus/Student).
- **Persistence**: `localStorage` JSON injection simulating a live database environment for user testing without a backend.
- **Routing**: React Router with `<ProtectedRoute>` role-barrier enforcement.

---

## 2. Platform Workflows

### 2.1 Authentication Workflow (Centralized)
- Users input credentials via the Landing Page `AuthPage.tsx`.
- The `AuthContext` queries a hybrid data model:
  1. Immutable `mockUsers.ts` (Core root admin/authority accounts).
  2. Mutable `localStorage` lists (Dynamic students and authorities configured by the Admin portal).
- Upon validation, users are dispatched to highly isolated nested contexts (`/student`, `/hod`, `/lab`, `/admin`).

### 2.2 Student Application Flow
1. **Initiation**: Student views digital dashboard. They can track the "Clearance Pathway" progress bar.
2. **Action**: The student manages their Documents (Vault) and clears physical/financial dues with respective branches.
3. **Tracking**: The UI updates reflecting multi-stage approval from external authority dashboards.

### 2.3 Lab Assistant Workflow
1. **Evaluation**: Lab In-Charge monitors `PendingClearances.tsx` UI queue.
2. **Audit Action**: Opens specific profiles to evaluate physical inventories (Lab Manual, Kit returned, etc.). Dials a strict "Verification Checklist".
3. **Decision**: Quick Approves (forward to HOD) or Flags (returning to student).

### 2.4 Authority Workflow (HOD & Principal)
1. **Evaluation**: HOD inherits Lab-approved clearances.
2. **Audit**: Analyzes documents via the `ReviewApplication` screen. Marks documents as visually verified.
3. **Progression**: The HOD forwards to the final tier, the Principal. The Principal holds ultimate sign-off capacity.

### 2.5 Admin Control Room Flow
1. **Creation**: Admin creates new authoritative IDs or Student accounts via `/admin/students` or `/admin/authorities`.
2. **Overrides**: Possesses absolute global execution rights to instantly clear a node or force-block a student profile.
3. **Reports**: Compiles systemic metrics and generates PDF Certificates.

---

## 3. Database Schema (Typescript interfaces translatable to Prisma/SQL)

### 3.1 Authentication Root Entity (`Core User`)
```typescript
interface UserConfig {
  id: string; // Internal User ID
  name: string;
  email: string; // Auth key
  pass: string; // Auth key
  role: 'student' | 'admin' | 'hod' | 'principal' | 'lab-incharge'; // Strict Enums
}
```

### 3.2 Global Admin Space State
```typescript
export interface AdminStudent {
  id: string;
  name: string;
  rollNo: string;
  branch: string; // Computer Science, IT, etc.
  batch: string;
  email: string;
  phone: string;
  enrollmentDate: string;
  isBlocked: boolean; // Overridden directly by admin
  departments: DepartmentNode[]; // The Clearance Pathway Matrix
  documents: { id: string, name: string, type: string, date: string, status: 'Verified' | 'Rejected' | 'Pending' }[];
  payments: { id: string, date: string, dept: string, amount: string, receiptNo: string, status: string }[];
  adminNotes: string;
  certStatus: 'Ready to Issue' | 'Already Issued' | 'Not Ready';
}

export interface DepartmentNode {
  id: string;
  name: string;
  authority: string;
  status: 'Cleared' | 'Pending' | 'Blocked';
  lastUpdated: string;
}
```

### 3.3 Lab Context Operations
```typescript
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
  status: 'Pending' | 'Approved' | 'Flagged';
  documents: { name: string; type: string; verified: boolean }[];
  equipment: EquipmentStatus;
}
```

### 3.4 Authority Queues (HOD & Principal)
```typescript
export type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Flagged';

export interface Application {
  id: string;
  studentName: string;
  rollNo: string;
  branch: string;
  batch: string;
  submissionDate: string;
  daysWaiting: number;
  status: ApplicationStatus;
  documents: { id: string, name: string, type: string, size: string, isVerified: boolean, date: string }[];
  history: { id: string, actor: string, role: string, action: string, comment?: string, date: string }[];
  decisionComment?: string;
  decisionDate?: string;
}
```

---

## 4. UI/UX Design System Notes
- **Fonts**: `font-sans` with aggressive `font-black` headings and `uppercase tracking-widest` sub-headings.
- **Grids**: Brutalist modular grid-box rendering via standard `border-4 border-[#121212]`.
- **Transitions**: Heavy `lucide-react` adoption fused with `motion/react` `<AnimatePresence>` for instantaneous responsive feedback.
- **Color Pallet**:
  - Base Layout: `#F0F0F0`
  - High Contrast Wire: `#121212` (Pitch Black)
  - Primary Action / Highlight: `#F0C020` (Safety Yellow)
  - Accent / Authority: `#1040C0` (Vibrant Blue)
  - Destructive / Flag: `#D02020` (Bright Crimson)

## 5. Development Next Steps for Claude
If continuing this project, the immediate next goals for an AI assistant should be:
1. Translate these Typescript Interfaces strictly into a `schema.prisma` backend.
2. Rip out `localStorage` JSON ingestion and map `axios/tRPC` endpoints directly inside the `React Context Provider` initializers.
3. Formulate JWT-based cookie tracking rather than the generic mock `currentUser` array passing.
