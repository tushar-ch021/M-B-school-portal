import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import LoadingSpinner from './components/common/LoadingSpinner';
import { Toaster } from 'react-hot-toast';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const NewAdmission = lazy(() => import('./pages/NewAdmission'));
const AdmissionPreview = lazy(() => import('./pages/AdmissionPreview'));
const StudentProfilePage = lazy(() => import('./pages/StudentProfilePage'));
const IDCards = lazy(() => import('./pages/IDCards'));
const TransferCertificates = lazy(() => import('./pages/TransferCertificates'));
const FeeManagement = lazy(() => import('./pages/FeeManagement'));
const RemovedStudents = lazy(() => import('./pages/RemovedStudents'));
const StudentAttendance = lazy(() => import('./pages/StudentAttendance'));
const StaffAttendance = lazy(() => import('./pages/StaffAttendance'));
const Certificates = lazy(() => import('./pages/Certificates'));

const App = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        {/* Global Notifications Alert Handler */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#fff',
              color: '#1b3a6b',
              fontSize: '13px',
              fontWeight: '500',
              border: '1px solid #e7f0fa',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }
          }}
        />

        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <LoadingSpinner />
          </div>
        }>
          <Routes>
            {/* Public Credentials Portal */}
            <Route path="/login" element={<Login />} />

            {/* Secure Admin Operations Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="attendance/student" element={<StudentAttendance />} />
              <Route path="attendance/staff" element={<StaffAttendance />} />
              <Route path="certificates" element={<Certificates />} />
              <Route path="students/removed" element={<RemovedStudents />} />
              <Route path="admission/new" element={<NewAdmission />} />
              <Route path="admission/preview/:id" element={<AdmissionPreview />} />
              <Route path="students/profile/:id" element={<StudentProfilePage />} />
              <Route path="id-cards" element={<IDCards />} />
              <Route path="tc" element={<TransferCertificates />} />
              <Route path="fees" element={<FeeManagement />} />
            </Route>

            {/* Default Route redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
