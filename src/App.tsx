import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { UserLayout } from './components/user/UserLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { MaintenancePage } from './components/common/MaintenancePage';
import { api } from './api/client';

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
import { NotificationsPage } from './pages/user/NotificationsPage';
import { ProfilePage } from './pages/user/ProfilePage';

// Admin Panel App
import { AdminApp } from './AdminApp';

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
  const [publicSettings, setPublicSettings] = React.useState<any>(null);
  const [maintenanceTriggered, setMaintenanceTriggered] = React.useState(false);
  const [maintenanceDetails, setMaintenanceDetails] = React.useState<any>(null);

  const checkMaintenance = React.useCallback(() => {
    if (window.location.pathname.startsWith('/adminpanal')) return;

    api
      .getPublicSettings({ bypassCache: true })
      .then((settings) => {
        setPublicSettings(settings);
        if (settings?.maintenanceMode) {
          setMaintenanceTriggered(true);
        } else {
          setMaintenanceTriggered(false);
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    checkMaintenance();

    const interval = setInterval(checkMaintenance, 20000);

    const handleMaintenanceEvent = (e: any) => {
      setMaintenanceTriggered(true);
      if (e?.detail) {
        setMaintenanceDetails(e.detail);
      }
      checkMaintenance();
    };

    window.addEventListener('royal_maintenance_triggered', handleMaintenanceEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('royal_maintenance_triggered', handleMaintenanceEvent);
    };
  }, [checkMaintenance]);

  const isAdminRoute = window.location.pathname.startsWith('/adminpanal');

  if ((maintenanceTriggered || publicSettings?.maintenanceMode) && !isAdminRoute) {
    const mergedSettings = {
      ...publicSettings,
      maintenanceTitle: maintenanceDetails?.title || publicSettings?.maintenanceTitle,
      maintenanceMessage: maintenanceDetails?.message || publicSettings?.maintenanceMessage,
      maintenanceExpectedEnd: maintenanceDetails?.expectedEnd || publicSettings?.maintenanceExpectedEnd,
    };
    return <MaintenancePage settings={mergedSettings} onRefresh={checkMaintenance} />;
  }

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
          <Route path="referrals" element={<Navigate to="/app" replace />} />
          <Route path="activity" element={<Navigate to="/app/wallet" replace />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Admin Panel Native Routes */}
        <Route path="/adminpanal/*" element={<AdminApp />} />
        <Route path="/adminpanal" element={<AdminApp />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};
