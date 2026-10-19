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

export const AdminLayout: React.FC = () => {
  const { admin, adminLogout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <header className="h-16 bg-white border-b border-[#D9E4F2] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#4B5563] hover:bg-[#F8FAFD] rounded-lg border border-[#D9E4F2]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block">
                Earn Sheet Administration
              </span>
              <span className="text-sm font-bold text-[#111827] block">
                Light-Mode Control Panel
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-[#F8FAFD] px-3 py-1.5 rounded-lg border border-[#D9E4F2] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-[#111827]">Live Database Synchronized</span>
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
