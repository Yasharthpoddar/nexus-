import { Routes, Route } from 'react-router';
import LandingPage from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { NexusProvider } from './context/NexusContext';
import { AuthorityProvider } from './context/AuthorityContext';

// Student Space
import { StudentLayout } from './layouts/StudentLayout';
import { Dashboard } from './pages/student/Dashboard';
import { MyApplication } from './pages/student/MyApplication';
import { DocumentVault } from './pages/student/DocumentVault';
import { Payments } from './pages/student/Payments';
import { Notifications } from './pages/student/Notifications';
import { DigitalLocker } from './pages/student/DigitalLocker';
import { HelpSupport } from './pages/student/HelpSupport';

// Authority Space
import { AuthorityLayout } from './layouts/AuthorityLayout';
import { Dashboard as AuthDashboard } from './pages/authority/Dashboard';
import { PendingApps } from './pages/authority/PendingApps';
import { ReviewApp } from './pages/authority/ReviewApp';
import { ReviewedApps } from './pages/authority/ReviewedApps';
import { Notifications as AuthNotifications } from './pages/authority/Notifications';
import { Reports } from './pages/authority/Reports';
import { HelpSupport as AuthHelpSupport } from './pages/authority/HelpSupport';

// Admin Space
import { AdminProvider } from './context/AdminContext';
import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard as AdminDashboard } from './pages/admin/Dashboard';
import { StudentManagement } from './pages/admin/StudentManagement';
import { StudentDetail } from './pages/admin/StudentDetail';
import { CsvUpload } from './pages/admin/CsvUpload';
import { CertificateGenerator } from './pages/admin/CertificateGenerator';
import { AuthorityManagement } from './pages/admin/AuthorityManagement';
import { AuthorityDetail } from './pages/admin/AuthorityDetail';
import { Reports as AdminReports } from './pages/admin/Reports';
import { Settings as AdminSettings } from './pages/admin/Settings';
import { HelpSupport as AdminHelpSupport } from './pages/admin/HelpSupport';

// Lab Space
import { LabProvider } from './context/LabContext';
import { LabLayout } from './layouts/LabLayout';
import { Dashboard as LabDashboard } from './pages/lab/Dashboard';
import { PendingClearances as LabPending } from './pages/lab/PendingClearances';
import { ReviewApplication as LabReview } from './pages/lab/ReviewApplication';
import { ReviewedApplications as LabReviewed } from './pages/lab/ReviewedApplications';
import { EquipmentTracker } from './pages/lab/EquipmentTracker';
import { Notifications as LabNotifications } from './pages/lab/Notifications';
import { HelpSupport as LabHelpSupport } from './pages/lab/HelpSupport';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      
      {/* Student App Route Container */}
      <Route element={
        <NexusProvider>
          <StudentLayout />
        </NexusProvider>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/application" element={<MyApplication />} />
        <Route path="/documents" element={<DocumentVault />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/locker" element={<DigitalLocker />} />
        <Route path="/help" element={<HelpSupport />} />
      </Route>

      {/* Authority Portal App Route Container */}
      <Route element={
        <AuthorityProvider>
          <AuthorityLayout />
        </AuthorityProvider>
      }>
        <Route path="/authority/dashboard" element={<AuthDashboard />} />
        <Route path="/authority/pending" element={<PendingApps />} />
        <Route path="/authority/review/:id" element={<ReviewApp />} />
        <Route path="/authority/reviewed" element={<ReviewedApps />} />
        <Route path="/authority/notifications" element={<AuthNotifications />} />
        <Route path="/authority/reports" element={<Reports />} />
        <Route path="/authority/help" element={<AuthHelpSupport />} />
      </Route>

      {/* Admin Portal App Route Container */}
      <Route element={
        <AdminProvider>
          <AdminLayout />
        </AdminProvider>
      }>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<StudentManagement />} />
        <Route path="/admin/students/:id" element={<StudentDetail />} />
        <Route path="/admin/csv" element={<CsvUpload />} />
        <Route path="/admin/certificates" element={<CertificateGenerator />} />
        <Route path="/admin/authorities" element={<AuthorityManagement />} />
        <Route path="/admin/authorities/:id" element={<AuthorityDetail />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/help" element={<AdminHelpSupport />} />
      </Route>

      {/* Lab Portal App Route Container */}
      <Route element={
        <LabProvider>
          <LabLayout />
        </LabProvider>
      }>
        <Route path="/lab/dashboard" element={<LabDashboard />} />
        <Route path="/lab/pending" element={<LabPending />} />
        <Route path="/lab/review/:id" element={<LabReview />} />
        <Route path="/lab/reviewed" element={<LabReviewed />} />
        <Route path="/lab/equipment" element={<EquipmentTracker />} />
        <Route path="/lab/notifications" element={<LabNotifications />} />
        <Route path="/lab/help" element={<LabHelpSupport />} />
      </Route>
    </Routes>
  );
}
