import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { UserLayout } from './components/user/UserLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';

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

// User Protected Route Guard
const ProtectedUserRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#04132F] flex flex-col items-center justify-center text-slate-300">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-400">Loading Session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <UserLayout />;
};

const AdminRedirect: React.FC = () => {
  React.useEffect(() => {
    if (window.location.hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname)) {
      window.location.href = `${window.location.protocol}//${window.location.hostname}:5050/adminpanal`;
    } else {
      window.location.href = 'https://www.retardedbackend.online/';
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

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
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
        <Route path="/adminpanal/*" element={<AdminRedirect />} />
        <Route path="/adminpanal" element={<AdminRedirect />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};
