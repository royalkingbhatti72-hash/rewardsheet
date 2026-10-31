import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from './context/AdminAuthContext';
import { AdminLayout } from './components/admin/AdminLayout';

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
import { AdminReferralCodesPage } from './pages/admin/AdminReferralCodesPage';
import { AdminTransactionsPage } from './pages/admin/AdminTransactionsPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminActivityLogsPage } from './pages/admin/AdminActivityLogsPage';

const ProtectedAdminRoute: React.FC = () => {
  const { admin, loading: isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1459E8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/adminpanal/login" replace />;
  }

  return <AdminLayout />;
};

export const AdminApp: React.FC = () => {
  const { admin } = useAdminAuth();

  const adminRoutes = (
    <>
      <Route path="login" element={admin ? <Navigate to="/adminpanal/dashboard" replace /> : <AdminLoginPage />} />
      <Route index element={admin ? <Navigate to="/adminpanal/dashboard" replace /> : <AdminLoginPage />} />

      {/* Admin Protected Routes */}
      <Route element={<ProtectedAdminRoute />}>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:userId" element={<AdminUserDetailPage />} />
        <Route path="levels" element={<AdminLevelsPage />} />
        <Route path="tasks" element={<AdminTasksPage />} />
        <Route path="submissions" element={<AdminSubmissionsPage />} />
        <Route path="deposits" element={<AdminDepositsPage />} />
        <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
        <Route path="wallets" element={<AdminWalletsPage />} />
        <Route path="spin" element={<AdminSpinPage />} />
        <Route path="referrals" element={<AdminReferralsPage />} />
        <Route path="referral-codes" element={<AdminReferralCodesPage />} />
        <Route path="transactions" element={<AdminTransactionsPage />} />
        <Route path="announcements" element={<AdminAnnouncementsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="activity-logs" element={<AdminActivityLogsPage />} />
      </Route>
    </>
  );

  return (
    <Routes>
      {/* If mounted at root in standalone mode */}
      <Route path="/adminpanal/*">
        {adminRoutes}
      </Route>
      <Route path="/adminpanal">
        {adminRoutes}
      </Route>

      {/* Direct relative routes (when mounted inside App.tsx at /adminpanal/*) */}
      {adminRoutes}

      {/* Top-level aliases for direct navigation */}
      <Route path="/dashboard" element={<Navigate to="/adminpanal/dashboard" replace />} />
      <Route path="/users" element={<Navigate to="/adminpanal/users" replace />} />
      <Route path="/referral-codes" element={<Navigate to="/adminpanal/referral-codes" replace />} />
      <Route path="/tasks" element={<Navigate to="/adminpanal/tasks" replace />} />
      <Route path="/submissions" element={<Navigate to="/adminpanal/submissions" replace />} />
      <Route path="/deposits" element={<Navigate to="/adminpanal/deposits" replace />} />
      <Route path="/withdrawals" element={<Navigate to="/adminpanal/withdrawals" replace />} />
      <Route path="/wallets" element={<Navigate to="/adminpanal/wallets" replace />} />
      <Route path="/spin" element={<Navigate to="/adminpanal/spin" replace />} />
      <Route path="/referrals" element={<Navigate to="/adminpanal/referrals" replace />} />
      <Route path="/transactions" element={<Navigate to="/adminpanal/transactions" replace />} />
      <Route path="/settings" element={<Navigate to="/adminpanal/settings" replace />} />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/adminpanal/dashboard" replace />} />
    </Routes>
  );
};
