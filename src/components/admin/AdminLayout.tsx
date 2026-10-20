import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Layers,
  CheckSquare,
  FileCheck2,
  Disc,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Share2,
  Receipt,
  Megaphone,
  BarChart3,
  Settings,
  History as HistoryIcon,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/adminpanal/users': {
    title: 'Member Management',
    subtitle: 'View member accounts, reset passwords with audit logging, and perform balance adjustments.',
  },
  '/adminpanal/dashboard': {
    title: 'Administrative Overview',
    subtitle: 'System performance, user metrics, real-time platform activity and summary.',
  },
  '/adminpanal/levels': {
    title: 'Level Management',
    subtitle: 'Configure tier progression rules, completion rewards, and prerequisite thresholds.',
  },
  '/adminpanal/tasks': {
    title: 'Task Management',
    subtitle: 'Create, edit, organize tasks and manage task configuration.',
  },
  '/adminpanal/submissions': {
    title: 'Task Verification Desk',
    subtitle: 'Review proof submissions, verify transactions, and approve member progress.',
  },
  '/adminpanal/spin': {
    title: 'Spin Wheel & Prize Management',
    subtitle: 'Configure lucky wheel prizes, probabilities, and approve milestone spin wins.',
  },
  '/adminpanal/deposits': {
    title: 'Deposit Management',
    subtitle: 'Verify inbound account deposits, bank receipts, and credit balances.',
  },
  '/adminpanal/withdrawals': {
    title: 'Withdrawal Management',
    subtitle: 'Process and disburse withdrawal requests according to level withdrawal quota.',
  },
  '/adminpanal/wallets': {
    title: 'Balance Management Desk',
    subtitle: 'Manual balance and credit point adjustments with audit logging.',
  },
  '/adminpanal/referrals': {
    title: 'Referral Program Management',
    subtitle: 'Track affiliate trees, referral earnings, and reward tiers.',
  },
  '/adminpanal/transactions': {
    title: 'Financial Transactions Ledger',
    subtitle: 'Comprehensive audit trail of all platform financial movements.',
  },
  '/adminpanal/announcements': {
    title: 'Announcement Management',
    subtitle: 'Publish platform notices, alerts, and system broadcast banners.',
  },
  '/adminpanal/reports': {
    title: 'Financial Reports & Intelligence',
    subtitle: 'System cash flow analytics, profit and loss, and transaction metrics.',
  },
  '/adminpanal/settings': {
    title: 'Website Settings',
    subtitle: 'Platform parameters, payment accounts, system rules, and configurations.',
  },
  '/adminpanal/activity-logs': {
    title: 'Administrative Audit Trail',
    subtitle: 'Tamper-proof record of all admin activities and changes.',
  },
};

export const AdminLayout: React.FC = () => {
  const { admin, adminLogout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useBodyScrollLock(sidebarOpen);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const currentPath = location.pathname;
  const matchedPage = Object.entries(PAGE_TITLES).find(([path]) =>
    currentPath === path || (path !== '/adminpanal' && currentPath.startsWith(path))
  );
  const pageInfo = matchedPage ? matchedPage[1] : {
    title: 'Earn Sheet Administration',
    subtitle: 'Light-Mode Control Panel',
  };

  const menuItems = [
    { label: 'Dashboard', path: '/adminpanal/dashboard', icon: LayoutDashboard },
    { label: 'Users', path: '/adminpanal/users', icon: Users },
    { label: 'Levels', path: '/adminpanal/levels', icon: Layers },
    { label: 'Tasks', path: '/adminpanal/tasks', icon: CheckSquare },
    { label: 'Submissions', path: '/adminpanal/submissions', icon: FileCheck2 },
    { label: 'Spin Wheel', path: '/adminpanal/spin', icon: Disc },
    { label: 'Deposits', path: '/adminpanal/deposits', icon: ArrowDownLeft },
    { label: 'Withdrawals', path: '/adminpanal/withdrawals', icon: ArrowUpRight },
    { label: 'Balance Adjustments', path: '/adminpanal/wallets', icon: Wallet },
    { label: 'Referrals', path: '/adminpanal/referrals', icon: Share2 },
    { label: 'Transactions', path: '/adminpanal/transactions', icon: Receipt },
    { label: 'Announcements', path: '/adminpanal/announcements', icon: Megaphone },
    { label: 'Reports', path: '/adminpanal/reports', icon: BarChart3 },
    { label: 'Website Settings', path: '/adminpanal/settings', icon: Settings },
    { label: 'Audit Logs', path: '/adminpanal/activity-logs', icon: HistoryIcon },
  ];

  const handleLogout = () => {
    adminLogout();
    navigate('/adminpanal');
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] text-[#111827] flex font-sans antialiased">
      {/* Desktop Sidebar (240px) */}
      <aside className="hidden lg:flex w-60 bg-white border-r border-[#D9E4F2] flex-col flex-shrink-0 z-30">
        {/* Brand Header */}
        <div className="h-16 border-b border-[#D9E4F2] px-6 flex items-center justify-between bg-white">
          <Link to="/adminpanal/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-sm shadow-[#2563EB]/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-[#111827] block">
                ROYAL ADMIN
              </span>
              <span className="text-[10px] text-[#6B7280] font-medium block -mt-1">
                Management Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/adminpanal/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#EAF2FF] text-[#2563EB]'
                    : 'text-[#4B5563] hover:bg-[#F8FAFD] hover:text-[#111827]'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-[#6B7280]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin User Footer Profile */}
        <div className="p-3 border-t border-[#D9E4F2] bg-[#F8FAFD]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#2563EB]/10 text-[#2563EB] font-bold text-xs flex items-center justify-center">
                {admin?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#111827] truncate">{admin?.username || 'Admin'}</p>
                <p className="text-[10px] text-[#6B7280] truncate">{admin?.role || 'Super Admin'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-[#6B7280] hover:text-red-600 rounded-md hover:bg-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col z-10 shadow-2xl">
            <div className="h-16 border-b border-[#D9E4F2] px-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-[#2563EB]" />
                <span className="font-bold text-sm text-[#111827]">ROYAL ADMIN</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/adminpanal/dashboard' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                      isActive ? 'bg-[#EAF2FF] text-[#2563EB]' : 'text-[#4B5563] hover:bg-[#F8FAFD]'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-[#D9E4F2]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-50 text-red-600 font-semibold text-xs border border-red-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 sm:h-18 bg-white border-b border-[#D9E4F2] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#4B5563] hover:bg-[#F8FAFD] rounded-lg border border-[#D9E4F2] flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-[#111827] truncate">
                {pageInfo.title}
              </h1>
              <p className="text-[11px] sm:text-xs text-[#6B7280] truncate max-w-xl hidden sm:block">
                {pageInfo.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2 bg-[#F8FAFD] px-3 py-1.5 rounded-lg border border-[#D9E4F2] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-[#111827]">Live Synchronized</span>
            </div>
            <Link
              to="/app"
              target="_blank"
              className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
            >
              View User App <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
