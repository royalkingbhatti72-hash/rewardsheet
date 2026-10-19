import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { UserLayout } from './components/user/UserLayout';

// Public pages (lazy-loaded on demand)
const LandingPage = lazy(() => import('./pages/public/LandingPage').then((m) => ({ default: m.LandingPage })));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const LoginPage = lazy(() => import('./pages/public/LoginPage').then((m) => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import('./pages/public/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const TermsPage = lazy(() => import('./pages/public/TermsPage').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/public/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));

// User pages (lazy-loaded on demand)
const DashboardPage = lazy(() => import('./pages/user/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const TasksPage = lazy(() => import('./pages/user/TasksPage').then((m) => ({ default: m.TasksPage })));
const TaskDetailPage = lazy(() => import('./pages/user/TaskDetailPage').then((m) => ({ default: m.TaskDetailPage })));
const SpinPage = lazy(() => import('./pages/user/SpinPage').then((m) => ({ default: m.SpinPage })));
const WalletPage = lazy(() => import('./pages/user/WalletPage').then((m) => ({ default: m.WalletPage })));
const DepositsPage = lazy(() => import('./pages/user/DepositsPage').then((m) => ({ default: m.DepositsPage })));
const WithdrawalsPage = lazy(() => import('./pages/user/WithdrawalsPage').then((m) => ({ default: m.WithdrawalsPage })));
const ReferralsPage = lazy(() => import('./pages/user/ReferralsPage').then((m) => ({ default: m.ReferralsPage })));
const NotificationsPage = lazy(() => import('./pages/user/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const ProfilePage = lazy(() => import('./pages/user/ProfilePage').then((m) => ({ default: m.ProfilePage })));

// Minimal smooth fallback placeholder
const RouteFallback: React.FC = () => (
  <div className="w-full min-h-[50vh] flex flex-col items-center justify-center space-y-3">
    <div className="w-8 h-8 border-3 border-[#168BFF]/20 border-t-[#FFD45A] rounded-full animate-spin" />
    <span className="text-[11px] font-semibold text-slate-400">Loading...</span>
  </div>
);

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

export const App: React.FC = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
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
    </Suspense>
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
