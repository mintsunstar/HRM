import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { ToastContainer } from '@/components/common/Toast';
import { useAuthStore } from '@/store/authStore';
import { Login } from '@/pages/Login';
import { NotFoundPage, ForbiddenPage } from '@/pages/ErrorPages';
import { Dashboard } from '@/pages/Dashboard';
import { Employees } from '@/pages/Employees';
import { Attendances } from '@/pages/Attendances';
import { Reports } from '@/pages/Reports';
import { ActivityLogs } from '@/pages/ActivityLogs';
import { Settings } from '@/pages/Settings';
import { MyAccount } from '@/pages/MyAccount';

function RootRedirect() {
  // 루트 경로로 접근한 경우 항상 로그인 페이지로 리다이렉트
  // (사용자가 명시적으로 로그인을 원하는 경우를 위해)
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter basename="/HRM">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute minLevel={2}>
              <Layout>
                <Navigate to="/admin/dashboard" replace />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute minLevel={2}>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute minLevel={2}>
              <Layout>
                <Employees />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/employees/add"
          element={
            <ProtectedRoute minLevel={2}>
              <Layout>
                <Employees />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/attendances"
          element={
            <ProtectedRoute minLevel={2}>
              <Layout>
                <Attendances />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute minLevel={2}>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/activity-logs"
          element={
            <ProtectedRoute minLevel={2}>
              <Layout>
                <ActivityLogs />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute minLevel={1}>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/my-account"
          element={
            <ProtectedRoute minLevel={2}>
              <Layout>
                <MyAccount />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;

