import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Common Components
import { Layout } from './components/common/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { AvailableExams } from './pages/student/AvailableExams';
import { ExamInstructions } from './pages/student/ExamInstructions';
import { SystemReadiness } from './pages/student/SystemReadiness';
import { ExamTaking } from './pages/student/ExamTaking';
import { SubmissionConfirmation } from './pages/student/SubmissionConfirmation';
import { StudentResult } from './pages/student/StudentResult';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { ExamCreateEdit } from './pages/faculty/ExamCreateEdit';
import { QuestionBank } from './pages/faculty/QuestionBank';
import { ExamPreview } from './pages/faculty/ExamPreview';
import { LiveExamMonitoring } from './pages/faculty/LiveExamMonitoring';
import { FacultyReports } from './pages/faculty/FacultyReports';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { CourseSubjectManagement } from './pages/admin/CourseSubjectManagement';
import { ExamScheduling } from './pages/admin/ExamScheduling';
import { SecurityMonitoring } from './pages/admin/SecurityMonitoring';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { SystemAnalytics } from './pages/admin/SystemAnalytics';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Distraction-Minimized Exam Interface (Standalone full viewport) */}
            <Route
              path="/exam/:id/take"
              element={
                <ProtectedRoute>
                  <ExamTaking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exam/:id/submitted"
              element={
                <ProtectedRoute>
                  <SubmissionConfirmation />
                </ProtectedRoute>
              }
            />

            {/* Standard Dashboard Layout Shell */}
            <Route element={<Layout />}>
              {/* Profile & Settings */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Student Portal */}
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/exams"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <AvailableExams />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/exam/:id/instructions"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <ExamInstructions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/exam/:id/readiness"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <SystemReadiness />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/results/:sessionId"
                element={
                  <ProtectedRoute>
                    <StudentResult />
                  </ProtectedRoute>
                }
              />

              {/* Faculty Portal */}
              <Route
                path="/faculty/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                    <FacultyDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/faculty/exams/create"
                element={
                  <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                    <ExamCreateEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/faculty/exams/edit/:id"
                element={
                  <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                    <ExamCreateEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/faculty/question-bank"
                element={
                  <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                    <QuestionBank />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/faculty/exam/:id/preview"
                element={
                  <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                    <ExamPreview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/faculty/exam/:id/monitor"
                element={
                  <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                    <LiveExamMonitoring />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/faculty/reports"
                element={
                  <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                    <FacultyReports />
                  </ProtectedRoute>
                }
              />

              {/* Admin Portal */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/courses"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <CourseSubjectManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/schedule"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <ExamScheduling />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/security"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <SecurityMonitoring />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY']}>
                    <SystemAnalytics />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch-All within layout */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

export default App;
