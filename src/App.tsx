import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useAdminAuth } from './context/AdminAuthContext';
import { UserLayout } from './components/user/UserLayout';
import { AdminLayout } from './components/admin/AdminLayout';

// Public pages
import { LandingPage } from './pages/public/LandingPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { LoginPage } from './pages/public/LoginPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { TermsPage } from './pages/public/TermsPage';
import { PrivacyPage } from './pages/public/PrivacyPage';

// User pages
import { DashboardPage } from './pages/user/DashboardPage';
import { TasksPage } from './pages/user/TasksPage';
import { TaskDetailPage } from './pages/user/TaskDetailPage';
import { SpinPage } from './pages/user/SpinPage';
import { WalletPage } from './pages/user/WalletPage';
import { DepositsPage } from './pages/user/DepositsPage';
import { WithdrawalsPage } from './pages/user/WithdrawalsPage';
import { ReferralsPage } from './pages/user/ReferralsPage';
import { NotificationsPage } from './pages/user/NotificationsPage';
import { ProfilePage } from './pages/user/ProfilePage';

// Admin pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage';
import { AdminLevelsPage } from './pages/admin/AdminLevelsPage';
import { AdminTasksPage } from './pages/admin/AdminTasksPage';
import { AdminSubmissionsPage } from './pages/admin/AdminSubmissionsPage';
import { AdminDepositsPage } from './pages/admin/AdminDepositsPage';
import { AdminWithdrawalsPage } from './pages/admin/AdminWithdrawalsPage';
import { AdminWalletsPage } from './pages/admin/AdminWalletsPage';
import { AdminSpinPage } from './pages/admin/AdminSpinPage';
import { AdminReferralsPage } from './pages/admin/AdminReferralsPage';
import { AdminTransactionsPage } from './pages/admin/AdminTransactionsPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminActivityLogsPage } from './pages/admin/AdminActivityLogsPage';

// User Protected Route Guard
const ProtectedUserRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#04132F] flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Authenticating Earn Sheet Session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <UserLayout />;
};

// Admin Protected Route Guard
const ProtectedAdminRoute: React.FC = () => {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F8FC] flex flex-col items-center justify-center text-slate-600">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Verifying Administrative Privileges...</p>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/adminpanal" replace />;
  }

  return <AdminLayout />;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* User Protected Routes */}
      <Route path="/app" element={<ProtectedUserRoute />}>
        <Route index element={<DashboardPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/:taskId" element={<TaskDetailPage />} />
        <Route path="spin" element={<SpinPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="deposits" element={<DepositsPage />} />
        <Route path="withdrawals" element={<WithdrawalsPage />} />
        <Route path="referrals" element={<ReferralsPage />} />
        <Route path="activity" element={<Navigate to="/app/wallet" replace />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Panel relocation handler */}
      <Route
        path="/adminpanal/*"
        element={
          <AdminRedirect />
        }
      />
      <Route
        path="/adminpanal"
        element={
          <AdminRedirect />
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const AdminRedirect: React.FC = () => {
  React.useEffect(() => {
    if (window.location.hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname)) {
      window.location.href = `${window.location.protocol}//${window.location.hostname}:5050/adminpanal`;
    } else {
      window.location.href = 'https://backend-two-lilac-79.vercel.app/';
    }
  }, []);
  return (
    <div className="min-h-screen bg-[#020712] flex items-center justify-center text-slate-200">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#1459E8]/30 border-t-[#FFD45A] rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-300 font-semibold tracking-wide">Connecting to Royal Admin Control Panel...</p>
      </div>
    </div>
  );
};
