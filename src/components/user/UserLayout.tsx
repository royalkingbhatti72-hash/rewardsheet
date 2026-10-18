import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Crown,
  Home,
  CheckSquare,
  Disc,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Bell,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

export const UserLayout: React.FC = () => {
  const { user, wallet, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);

  useEffect(() => {
    // Fetch notifications unread count and announcements
    api.getNotifications()
      .then((res) => setUnreadCount(res.unreadCount || 0))
      .catch(() => {});

    api.getAnnouncements()
      .then((res) => {
        if (res.announcements && res.announcements.length > 0) {
          setAnnouncement(res.announcements[0].content);
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  const navItems = [
    { label: 'Dashboard', path: '/app', icon: Home },
    { label: 'Tasks & Levels', path: '/app/tasks', icon: CheckSquare },
    { label: 'Royal Spin', path: '/app/spin', icon: Disc, badge: 'Win PKR' },
    { label: 'Wallet', path: '/app/wallet', icon: Wallet },
    { label: 'Deposit', path: '/app/deposits', icon: ArrowDownLeft },
    { label: 'Withdraw', path: '/app/withdrawals', icon: ArrowUpRight },
    { label: 'Referrals', path: '/app/referrals', icon: Users },
    { label: 'Notifications', path: '/app/notifications', icon: Bell, badgeCount: unreadCount },
    { label: 'Profile', path: '/app/profile', icon: UserIcon },
  ];

  const bottomNavItems = [
    { label: 'Home', path: '/app', icon: Home },
    { label: 'Tasks', path: '/app/tasks', icon: CheckSquare },
    { label: 'Spin', path: '/app/spin', icon: Disc },
    { label: 'Withdraw', path: '/app/withdrawals', icon: ArrowUpRight },
    { label: 'Profile', path: '/app/profile', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-[#04132F] text-slate-100 flex flex-col selection:bg-[#1459E8] selection:text-white">
      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-[#020B20]/95 backdrop-blur-md border-b border-[#214B91]/50 px-3 sm:px-5 lg:px-6 py-2 sm:py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <Link to="/app" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1459E8] to-[#FFD45A] p-0.5 shadow-md shadow-[#1459E8]/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#04132F] rounded-[6px] flex items-center justify-center">
                <Crown className="w-4 h-4 text-[#FFD45A]" />
              </div>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-[#FFD45A] bg-clip-text text-transparent block leading-tight">
                EARN SHEET
              </span>
              <span className="block text-[8px] sm:text-[9px] text-[#22D3EE] font-bold tracking-wider uppercase leading-none">
                Official
              </span>
            </div>
          </Link>

          {/* Center Desktop Quick Nav */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#04132F]/80 p-0.5 rounded-lg border border-[#214B91]/40">
            {navItems.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#1459E8] text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-3 h-3" />
                  {item.label}
                  {item.badge && (
                    <span className="bg-[#FFD45A] text-[#020B20] text-[8px] font-bold px-1 py-0.2 rounded-full leading-none">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions: CP Box, PKR Box, Notifications & Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Credit Points (CP) Box - Compact & smaller text size */}
            <Link
              to="/app/tasks"
              className="flex items-center gap-1.5 bg-[#061633] hover:bg-[#071B3A] border border-[#22D3EE]/30 hover:border-[#22D3EE]/60 rounded-lg px-2 sm:px-2.5 py-1 transition-all group shadow-2xs"
              title="Credit Points (CP)"
            >
              <div className="w-4 h-4 rounded-md bg-[#22D3EE]/15 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-2.5 h-2.5 text-[#22D3EE]" />
              </div>
              <div className="flex items-center gap-1 leading-none text-left">
                <span className="text-[8px] sm:text-[9px] text-[#A6C4FF] font-semibold uppercase">CP:</span>
                <span className="text-[10px] sm:text-xs font-bold text-[#22D3EE]">
                  {(wallet?.creditPoints || 0).toLocaleString()}
                </span>
              </div>
            </Link>

            {/* Wallet Balance (PKR) Box - Compact & smaller text size */}
            <Link
              to="/app/wallet"
              className="flex items-center gap-1.5 bg-[#061633] hover:bg-[#071B3A] border border-[#FFD45A]/30 hover:border-[#FFD45A]/60 rounded-lg px-2 sm:px-2.5 py-1 transition-all group shadow-2xs"
              title="PKR Available Balance"
            >
              <div className="w-4 h-4 rounded-md bg-[#FFD45A]/15 flex items-center justify-center flex-shrink-0">
                <Crown className="w-2.5 h-2.5 text-[#FFD45A]" />
              </div>
              <div className="flex items-center gap-1 leading-none text-left">
                <span className="text-[8px] sm:text-[9px] text-slate-400 font-semibold uppercase">PKR:</span>
                <span className="text-[10px] sm:text-xs font-bold text-[#FFD45A]">
                  {(wallet?.availableBalance || 0).toLocaleString()}
                </span>
              </div>
            </Link>

            {/* Notification Bell */}
            <Link
              to="/app/notifications"
              className="relative p-1.5 rounded-lg bg-[#061633] border border-[#214B91]/50 text-slate-300 hover:text-white hover:border-[#2478FF] transition-all"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#020B20] animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* User Logout Button */}
            <button
              onClick={() => logout()}
              className="hidden sm:flex items-center gap-1 p-1.5 px-2 rounded-lg bg-[#061633] border border-[#214B91]/50 text-slate-300 hover:text-red-400 hover:border-red-500/50 transition-all text-[11px] font-medium"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Logout</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg bg-[#061633] border border-[#214B91]/50 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#020B20]/95 backdrop-blur-xl flex flex-col p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-6 border-b border-[#214B91]/50">
            <div className="flex items-center gap-2.5">
              <Crown className="w-6 h-6 text-[#FFD45A]" />
              <span className="font-extrabold text-lg text-white">EARN SHEET</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg bg-white/5 text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="py-4">
            <div className="p-3 bg-[#04132F] rounded-xl border border-[#214B91] mb-4">
              <p className="text-xs text-slate-400">Logged in as</p>
              <p className="font-bold text-white text-base">{user?.name}</p>
              <p className="text-xs text-[#22D3EE] font-mono">{user?.phone}</p>
              <div className="mt-2 pt-2 border-t border-[#214B91]/50 flex justify-between items-center text-xs">
                <span className="text-slate-300">Wallet Balance:</span>
                <span className="text-[#FFD45A] font-bold text-sm">
                  PKR {(wallet?.availableBalance || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-[#214B91]/50 text-slate-200 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-[#2478FF]" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-auto pt-4 border-t border-[#214B91]/50">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 font-semibold text-sm hover:bg-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-28 md:pb-16 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#020B20]/95 backdrop-blur-lg border-t border-[#214B91]/60 px-2 py-2 flex items-center justify-around shadow-2xl">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive ? 'text-[#FFD45A]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 bg-[#FFD45A] rounded-full shadow-sm shadow-[#FFD45A]" />
              )}
              <item.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium mt-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
