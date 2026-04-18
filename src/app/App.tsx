import { Routes, Route } from 'react-router';
import LandingPage from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { ProtectedRoute } from './components/ProtectedRoute';
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

// Principal Space
import { PrincipalProvider } from './context/PrincipalContext';
import { PrincipalLayout } from './layouts/PrincipalLayout';
import { Dashboard as PrinDashboard } from './pages/principal/Dashboard';
import { PendingApps as PrinPendingApps } from './pages/principal/PendingApps';
import { ReviewApp as PrinReviewApp } from './pages/principal/ReviewApp';
import { ReviewedApps as PrinReviewedApps } from './pages/principal/ReviewedApps';
import { Notifications as PrinNotifications } from './pages/principal/Notifications';
import { Reports as PrinReports } from './pages/principal/Reports';
import { HelpSupport as PrinHelpSupport } from './pages/principal/HelpSupport';
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
import { VerifyDocument as LabVerifyDocument } from './pages/lab/VerifyDocument';

// Document Verify Pages (HOD + Principal)
import { VerifyDocument as HodVerifyDocument } from './pages/authority/VerifyDocument';
import { VerifyDocument as PrinVerifyDocument } from './pages/principal/VerifyDocument';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      
      {/* Student App Route Container */}
      <Route element={
        <ProtectedRoute allowedRoles={['student']}>
          <NexusProvider>
            <StudentLayout />
          </NexusProvider>
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/application" element={<MyApplication />} />
        <Route path="/documents" element={<DocumentVault />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/locker" element={<DigitalLocker />} />
        <Route path="/help" element={<HelpSupport />} />
      </Route>

      {/* HOD Portal Route Container */}
      <Route element={
        <ProtectedRoute allowedSubRoles={['hod']}>
          <AuthorityProvider>
            <AuthorityLayout />
          </AuthorityProvider>
        </ProtectedRoute>
      }>
        <Route path="/hod/dashboard" element={<AuthDashboard />} />
        <Route path="/hod/pending" element={<PendingApps />} />
        <Route path="/hod/review/:id" element={<ReviewApp />} />
        <Route path="/hod/verify/:id" element={<HodVerifyDocument />} />
        <Route path="/hod/reviewed" element={<ReviewedApps />} />
        <Route path="/hod/notifications" element={<AuthNotifications />} />
        <Route path="/hod/reports" element={<Reports />} />
        <Route path="/hod/help" element={<AuthHelpSupport />} />
      </Route>

      {/* Principal Portal Route Container */}
      <Route element={
        <ProtectedRoute allowedSubRoles={['principal']}>
          <PrincipalProvider>
            <PrincipalLayout />
          </PrincipalProvider>
        </ProtectedRoute>
      }>
        <Route path="/principal/dashboard" element={<PrinDashboard />} />
        <Route path="/principal/pending" element={<PrinPendingApps />} />
        <Route path="/principal/review/:id" element={<PrinReviewApp />} />
        <Route path="/principal/verify/:id" element={<PrinVerifyDocument />} />
        <Route path="/principal/reviewed" element={<PrinReviewedApps />} />
        <Route path="/principal/certificates" element={<PrinReviewedApps />} />
        <Route path="/principal/institution" element={<PrinReports />} />
        <Route path="/principal/notifications" element={<PrinNotifications />} />
        <Route path="/principal/reports" element={<PrinReports />} />
        <Route path="/principal/help" element={<PrinHelpSupport />} />
      </Route>

      {/* Admin Portal App Route Container */}
      <Route element={
        <ProtectedRoute allowedSubRoles={['admin']}>
          <AdminProvider>
            <AdminLayout />
          </AdminProvider>
        </ProtectedRoute>
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
        <ProtectedRoute allowedSubRoles={['lab-incharge']}>
          <LabProvider>
            <LabLayout />
          </LabProvider>
        </ProtectedRoute>
      }>
        <Route path="/lab/dashboard" element={<LabDashboard />} />
        <Route path="/lab/pending" element={<LabPending />} />
        <Route path="/lab/review/:id" element={<LabReview />} />
        <Route path="/lab/verify/:id" element={<LabVerifyDocument />} />
        <Route path="/lab/reviewed" element={<LabReviewed />} />
        <Route path="/lab/equipment" element={<EquipmentTracker />} />
        <Route path="/lab/notifications" element={<LabNotifications />} />
        <Route path="/lab/help" element={<LabHelpSupport />} />
      </Route>
    </Routes>
  );
}
