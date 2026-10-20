import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Crown,
  Home,
  CheckSquare,
  Disc,
  ArrowUpRight,
  Clock,
  HelpCircle,
  Users,
  Wallet,
  Coins,
  Star,
  Gift,
  Copy,
  Check,
  TrendingUp,
  User as UserIcon,
  Sparkles,
  ChevronRight,
  X,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Mail,
  Shield,
  Lock,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

export const DashboardPage: React.FC = () => {
  const { user, wallet: authWallet, updateWallet } = useAuth();
  const navigate = useNavigate();

  const fallbackDashboard = {
    wallet: authWallet || {
      availableBalance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      creditPoints: 0,
    },
    levelProgress: {
      currentLevelNumber: 1,
      levelTitle: 'Apprentice Tier',
      approvedTasksCount: 0,
    },
    recentTransactions: [],
    recentSubmissions: [],
  };

  const cachedDashboard = api.getCachedData<any>('/user/dashboard');
  const [data, setData] = useState<any>(() => {
    if (cachedDashboard) {
      return {
        ...cachedDashboard,
        wallet: authWallet || cachedDashboard.wallet || fallbackDashboard.wallet,
      };
    }
    return fallbackDashboard;
  });
  const [loading, setLoading] = useState(!cachedDashboard && !authWallet);
  const [copiedLink, setCopiedLink] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Prevent background scrolling while help modal is active
  useBodyScrollLock(helpModalOpen);

  useEffect(() => {
    api
      .getDashboard()
      .then((res: any) => {
        setData(res);
        if (res?.wallet) {
          updateWallet(res.wallet);
        }
      })
      .catch((err) => console.error('Dashboard load failed:', err))
      .finally(() => setLoading(false));
  }, []);

  // Realtime Live Update Listener (Zero Reload Strategy)
  useEffect(() => {
    const handleLiveEvent = (e: any) => {
      const type = e.detail?.type;
      const payload = e.detail?.payload;

      // Targeted direct update for wallet changes without refetching entire dashboard
      if (type === 'wallet' && payload) {
        setData((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            wallet: { ...prev.wallet, ...payload },
          };
        });
        updateWallet(payload);
        return;
      }

      if (type === 'task' || type === 'command' || type === 'all' || type === 'refresh') {
        api.invalidateCache('/user/dashboard');
        api
          .getDashboard()
          .then((res: any) => {
            setData(res);
            if (res?.wallet) {
              updateWallet(res.wallet);
            }
          })
          .catch(() => {});
      }
    };
    window.addEventListener('royal_live_update', handleLiveEvent);
    return () => {
      window.removeEventListener('royal_live_update', handleLiveEvent);
    };
  }, []);

  const handleCopyReferral = () => {
    if (!user?.referralCode) return;
    const link = `${window.location.origin}/register?ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const {
    levelProgress,
    recentTransactions = [],
    recentSubmissions = [],
  } = data || {};

  // Level calculations (strictly 10 tasks per level)
  const currentLevelNumber = levelProgress?.currentLevelNumber || 1;
  const levelTitle = levelProgress?.levelTitle || 'Apprentice Tier';
  const approvedTasksCount = levelProgress?.approvedTasksCount || 0;
  const remainingTasksInLevel = Math.max(0, 10 - approvedTasksCount);
  const progressPercent = Math.min(100, Math.round((approvedTasksCount / 10) * 100));

  // Available balance & Credit points - single source of truth across TopNav and Dashboard
  const currentWallet = data?.wallet || authWallet;
  const availableBalance = currentWallet?.availableBalance ?? (authWallet?.availableBalance || 0);
  const creditPoints = currentWallet?.creditPoints ?? (authWallet?.creditPoints || 0);

  // Withdrawal Eligibility & Level Quota (10% of total balance on every level completion)
  const completedLevelsCount =
    data?.withdrawalEligibility?.completedLevelsCount ??
    levelProgress?.completedLevelsCount ??
    (currentLevelNumber > 1 ? currentLevelNumber - 1 : 0);
  const eligibleWithdrawalPercent =
    data?.withdrawalEligibility?.eligiblePercent ?? (completedLevelsCount >= 1 ? 10 : 0);
  const maxWithdrawableAmount =
    data?.withdrawalEligibility?.maxWithdrawableAmount ??
    Math.floor((availableBalance * eligibleWithdrawalPercent) / 100);

  // Member ID formatting
  const memberId = user?.id ? `RR${user.id.slice(-8).toUpperCase()}` : 'RR00000000';
  const referralLink = `${window.location.origin}/register?ref=${user?.referralCode || ''}`;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Toast Notification for Copied Link */}
      {copiedLink && (
        <div className="fixed top-5 right-5 z-50 bg-[#10D6A0] text-[#020B20] px-4 py-2.5 rounded-2xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Referral Link Copied to Clipboard!</span>
        </div>
      )}

      {/* Main Container Layout: Left Sidebar (Desktop) + Right Dashboard Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ========================================================
            A. LEFT SIDEBAR (Desktop Only: hidden on mobile)
            Matches Option reference: Dark navy, active blue glow
            ======================================================== */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 rounded-3xl bg-[#03102B] border border-[#173C73] p-5 space-y-6 shadow-2xl sticky top-20">
          {/* Royal Rewards Logo Branding */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#315BFF] to-[#FFD45A] p-0.5 shadow-lg shadow-[#315BFF]/30">
              <div className="w-full h-full bg-[#04132F] rounded-[14px] flex items-center justify-center">
                <Crown className="w-5 h-5 text-[#FFD45A]" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white leading-none">
                EARN STREET
              </h2>
              <span className="text-[10px] font-bold text-[#22D3EE] tracking-wider uppercase">
                Premier Platform
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 flex-1">
            {/* 1. Home (Active with bright blue & glow) */}
            <Link
              to="/app"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#315BFF] text-white font-bold text-xs shadow-lg shadow-[#315BFF]/40 border border-[#3978FF] transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            {/* 2. Tasks */}
            <Link
              to="/app/tasks"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[#B7C6E4] hover:text-white hover:bg-[#071B3A] font-semibold text-xs border border-transparent hover:border-[#173C73] transition-all group"
            >
              <CheckSquare className="w-4 h-4 text-[#3978FF] group-hover:scale-110 transition-transform" />
              <span>Tasks</span>
            </Link>

            {/* 3. Spin */}
            <Link
              to="/app/spin"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[#B7C6E4] hover:text-white hover:bg-[#071B3A] font-semibold text-xs border border-transparent hover:border-[#173C73] transition-all group"
            >
              <Disc className="w-4 h-4 text-[#592BFF] group-hover:scale-110 transition-transform" />
              <span>Spin</span>
            </Link>

            {/* 4. Withdraw */}
            <Link
              to="/app/withdrawals"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[#B7C6E4] hover:text-white hover:bg-[#071B3A] font-semibold text-xs border border-transparent hover:border-[#173C73] transition-all group"
            >
              <ArrowUpRight className="w-4 h-4 text-[#22D3EE] group-hover:scale-110 transition-transform" />
              <span>Withdraw</span>
            </Link>

            {/* 5. History */}
            <Link
              to="/app/wallet"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[#B7C6E4] hover:text-white hover:bg-[#071B3A] font-semibold text-xs border border-transparent hover:border-[#173C73] transition-all group"
            >
              <Clock className="w-4 h-4 text-[#FFD45A] group-hover:scale-110 transition-transform" />
              <span>History</span>
            </Link>

            {/* 6. Help Center */}
            <button
              onClick={() => setHelpModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#B7C6E4] hover:text-white hover:bg-[#071B3A] font-semibold text-xs border border-transparent hover:border-[#173C73] transition-all group text-left"
            >
              <HelpCircle className="w-4 h-4 text-[#10D6A0] group-hover:scale-110 transition-transform" />
              <span>Help Center</span>
            </button>

            {/* 7. Invite Friends */}
            <Link
              to="/app/referrals"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[#B7C6E4] hover:text-white hover:bg-[#071B3A] font-semibold text-xs border border-transparent hover:border-[#173C73] transition-all group"
            >
              <Users className="w-4 h-4 text-[#FFD45A] group-hover:scale-110 transition-transform" />
              <span>Invite Friends</span>
            </Link>
          </nav>

          {/* Sidebar Mini Promo Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#071B3A] to-[#04132F] border border-[#173C73] text-center space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#FFD45A]/15 border border-[#FFD45A]/30 flex items-center justify-center mx-auto text-[#FFD45A]">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <h4 className="text-xs font-bold text-white">Earn Daily Royal Spins</h4>
            <p className="text-[10px] text-[#B7C6E4] leading-relaxed">
              Complete level milestones to unlock free wheel spins!
            </p>
            <Link
              to="/app/tasks"
              className="inline-block w-full py-1.5 px-3 rounded-xl bg-[#1264F5] hover:bg-[#315BFF] text-white text-[11px] font-bold transition-all"
            >
              Start Tasks
            </Link>
          </div>
        </aside>

        {/* ========================================================
            RIGHT DASHBOARD CONTENT AREA
            Mobile + Desktop responsive dashboard modules
            ======================================================== */}
        <main className="flex-1 w-full min-w-0 space-y-6">
          {/* ========================================================
              C. USER PROFILE SUMMARY & TOP HEADER CONTROLS
              Avatar, User Name, Member ID, Level + Balance & Notifications
              ======================================================== */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#071B3A] border border-[#173C73] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* User Avatar + Name + ID + Level */}
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#315BFF] via-[#7B2CFF] to-[#FFD45A] p-0.5 shadow-md">
                  <div className="w-full h-full bg-[#04132F] rounded-[14px] flex items-center justify-center font-black text-white text-lg">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-[#FFD45A] border-2 border-[#04132F] flex items-center justify-center text-[#020B20]">
                  <Crown className="w-3 h-3" />
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                    {user?.name || 'Royal Member'}
                  </h1>
                  <span className="text-[10px] font-bold text-[#FFD45A] bg-[#FFD45A]/15 border border-[#FFD45A]/30 px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-[#B7C6E4] font-mono font-medium">
                  Member ID: <span className="text-[#22D3EE] font-bold">{memberId}</span>
                </p>
                <div className="flex items-center gap-1.5 text-xs text-[#FFD45A] font-bold pt-0.5">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Level {currentLevelNumber}</span>
                  <span className="text-slate-400 font-normal">• {levelTitle}</span>
                </div>
              </div>
            </div>

            {/* Quick Profile Actions */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <Link
                to="/app/profile"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#061633] border border-[#173C73] text-xs font-semibold text-[#B7C6E4] hover:text-white hover:border-[#3978FF] transition-all"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>My Profile</span>
              </Link>
            </div>
          </div>

          {/* ========================================================
              D. BALANCE AND CREDIT POINTS (Two Summary Cards)
              Total Balance (PKR) + Credit Points (Pts)
              ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Balance Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0B2248] via-[#071B3A] to-[#04132F] border border-[#173C73] shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD45A]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#FFD45A]/15 transition-all" />

              <div className="mb-2">
                <span className="text-xs font-bold text-[#B7C6E4] uppercase tracking-wider">
                  Total Balance
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black text-[#FFD45A] tracking-tight">
                  PKR {availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="text-[10px] font-bold text-[#10D6A0] bg-[#10D6A0]/15 border border-[#10D6A0]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Withdrawable Quota: {eligibleWithdrawalPercent}% (PKR {maxWithdrawableAmount.toLocaleString()})
                  </span>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[#173C73]/40 flex items-center justify-between text-xs">
                <Link
                  to="/app/withdrawals"
                  className="font-bold text-[#22D3EE] hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Withdraw Funds</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
                <Link
                  to="/app/deposits"
                  className="font-bold text-[#B7C6E4] hover:text-[#FFD45A] transition-colors"
                >
                  Deposit
                </Link>
              </div>
            </div>

            {/* Credit Points Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0B2248] via-[#071B3A] to-[#04132F] border border-[#173C73] shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#315BFF]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#315BFF]/15 transition-all" />

              <div className="mb-2">
                <span className="text-xs font-bold text-[#B7C6E4] uppercase tracking-wider">
                  Credit Points
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {creditPoints.toLocaleString()} <span className="text-base font-bold text-[#22D3EE]">Pts</span>
                </h3>
                <p className="text-xs font-semibold text-[#10D6A0]">
                  100 pts per complete level
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-[#173C73]/40 flex items-center justify-between text-xs">
                <Link
                  to="/app/tasks"
                  className="font-bold text-[#22D3EE] hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Earn More Points</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
                <span className="text-[11px] text-[#8194B7] font-medium">Rank Tier {currentLevelNumber}</span>
              </div>
            </div>
          </div>

          {/* ========================================================
              E. QUICK-ACTION CARDS (Tasks, Spin, Withdraw, History)
              Four prominent cards with specific accents
              ======================================================== */}
          <div>
            <h3 className="text-xs font-bold text-[#B7C6E4] uppercase tracking-wider mb-3 px-1">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* 1. Tasks Card (Blue Accent) */}
              <Link
                to="/app/tasks"
                className="p-4 sm:p-5 rounded-2xl bg-[#071B3A] border border-[#173C73] hover:border-[#315BFF] transition-all flex flex-col justify-between group shadow-lg hover:shadow-[#315BFF]/20 transform hover:-translate-y-0.5"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#315BFF]/20 border border-[#315BFF]/40 flex items-center justify-center text-[#3978FF] group-hover:scale-110 transition-transform mb-3">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white group-hover:text-[#3978FF] transition-colors">
                    Tasks
                  </h4>
                  <p className="text-[11px] text-[#B7C6E4] font-medium">Complete & Earn</p>
                </div>
              </Link>

              {/* 2. Spin Card (Purple Accent) */}
              <Link
                to="/app/spin"
                className="p-4 sm:p-5 rounded-2xl bg-[#071B3A] border border-[#173C73] hover:border-[#592BFF] transition-all flex flex-col justify-between group shadow-lg hover:shadow-[#592BFF]/20 transform hover:-translate-y-0.5"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#592BFF]/20 border border-[#592BFF]/40 flex items-center justify-center text-[#7B2CFF] group-hover:scale-110 transition-transform mb-3">
                  <Disc className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white group-hover:text-[#7B2CFF] transition-colors">
                    Spin
                  </h4>
                  <p className="text-[11px] text-[#B7C6E4] font-medium">Win Exciting Rewards</p>
                </div>
              </Link>

              {/* 3. Withdraw Card (Teal Accent) */}
              <Link
                to="/app/withdrawals"
                className="p-4 sm:p-5 rounded-2xl bg-[#071B3A] border border-[#173C73] hover:border-[#22D3EE] transition-all flex flex-col justify-between group shadow-lg hover:shadow-[#22D3EE]/20 transform hover:-translate-y-0.5"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#22D3EE]/15 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE] group-hover:scale-110 transition-transform mb-3">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white group-hover:text-[#22D3EE] transition-colors">
                    Withdraw
                  </h4>
                  <p className="text-[11px] text-[#B7C6E4] font-medium">Get Your Rewards</p>
                </div>
              </Link>

              {/* 4. History Card (Gold Accent) */}
              <Link
                to="/app/wallet"
                className="p-4 sm:p-5 rounded-2xl bg-[#071B3A] border border-[#173C73] hover:border-[#FFD45A] transition-all flex flex-col justify-between group shadow-lg hover:shadow-[#FFD45A]/20 transform hover:-translate-y-0.5"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#FFD45A]/15 border border-[#FFD45A]/30 flex items-center justify-center text-[#FFD45A] group-hover:scale-110 transition-transform mb-3">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white group-hover:text-[#FFD45A] transition-colors">
                    History
                  </h4>
                  <p className="text-[11px] text-[#B7C6E4] font-medium">View Records</p>
                </div>
              </Link>
            </div>
          </div>

          {/* ========================================================
              F. WELCOME & REWARDS BANNER
              "Welcome to Royal Rewards! Complete tasks, earn rewards and unlock new levels."
              Tagline: "Small Steps, Big Rewards" | Button: "View Tasks"
              ======================================================== */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0B2248] via-[#1264F5] to-[#071B3A] border border-[#173C73] shadow-2xl relative overflow-hidden">
            {/* Glow / Background Artwork Elements */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#FFD45A]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-[#7B2CFF]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#020B20]/60 border border-[#FFD45A]/40 text-[#FFD45A] text-xs font-black shadow-sm">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Small Steps, Big Rewards</span>
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                  Welcome to Earn Street!
                </h2>

                <p className="text-xs sm:text-sm text-[#B7C6E4] leading-relaxed">
                  Complete tasks sequentially, earn verified PKR rewards, and unlock higher prestige tiers for larger bonuses.
                </p>
              </div>

              {/* View Tasks CTA Button */}
              <div className="flex-shrink-0">
                <Link
                  to="/app/tasks"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#FFD45A] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#FFD45A] text-[#020B20] text-xs sm:text-sm font-black shadow-xl shadow-[#FFD45A]/30 transform hover:scale-[1.03] transition-all"
                >
                  <Crown className="w-4 h-4" />
                  <span>View Tasks</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* ========================================================
              G. LEVEL PROGRESS CARD (Strict 10-Task Level System)
              Level X Progress | X / 10 Tasks Approved | Y Tasks Remaining
              ======================================================== */}
          <div className="p-5 sm:p-7 rounded-3xl bg-[#071B3A] border border-[#173C73] shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-[#10D6A0] bg-[#10D6A0]/15 border border-[#10D6A0]/30 px-2.5 py-0.5 rounded-full">
                    {eligibleWithdrawalPercent}% Withdrawal Quota Unlocked
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Tier Ascent Status
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-[#061633] px-3.5 py-2 rounded-xl border border-[#173C73] text-left">
                  <span className="text-[10px] text-[#8194B7] block font-medium uppercase">
                    Tasks Approved
                  </span>
                  <span className="text-sm font-black text-white">
                    {approvedTasksCount} / 10
                  </span>
                </div>
                <div className="bg-[#061633] px-3.5 py-2 rounded-xl border border-[#173C73] text-left">
                  <span className="text-[10px] text-[#8194B7] block font-medium uppercase">
                    Remaining
                  </span>
                  <span className="text-sm font-black text-[#FFD45A]">
                    {remainingTasksInLevel} Tasks
                  </span>
                </div>
              </div>
            </div>

            {/* Real Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-[#B7C6E4]">
                <span>Progress Percentage</span>
                <span className="font-bold text-white">{progressPercent}%</span>
              </div>
              <div className="w-full h-3 bg-[#061633] rounded-full overflow-hidden border border-[#173C73]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#315BFF] via-[#22D3EE] to-[#FFD45A] transition-all duration-500 shadow-md"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Level Action Footer */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-[#173C73]/40">
              <p className="text-[#B7C6E4]">
                {completedLevelsCount === 0
                  ? `Complete Level ${currentLevelNumber} tasks to unlock 10% account balance withdrawal and claim the PKR Level Reward!`
                  : `Level ${currentLevelNumber} In Progress • Complete this level to claim the PKR Level Reward and withdraw 10% of your account balance!`}
              </p>
              <Link
                to="/app/tasks"
                className="inline-flex items-center gap-1.5 font-bold text-[#22D3EE] hover:text-white transition-colors self-start sm:self-auto"
              >
                <span>Continue Level {currentLevelNumber} Tasks</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* ========================================================
              H. RECENT ACTIVITY & I. INVITE FRIENDS (Two Column Grid)
              ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* H. Recent Activity Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#071B3A] border border-[#173C73] shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FFD45A]" />
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Recent Activity
                  </h3>
                </div>
                <Link
                  to="/app/wallet"
                  className="text-xs font-bold text-[#22D3EE] hover:underline"
                >
                  View All
                </Link>
              </div>

              {recentTransactions && recentTransactions.length > 0 ? (
                <div className="space-y-2.5">
                  {recentTransactions.slice(0, 5).map((tx: any) => {
                    const isCredit = tx.amount > 0;
                    return (
                      <div
                        key={tx.id}
                        className="p-3 rounded-2xl bg-[#061633] border border-[#173C73]/60 flex items-center justify-between gap-3 text-xs transition-all hover:border-[#3978FF]/40"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isCredit
                                ? 'bg-[#10D6A0]/15 text-[#10D6A0] border border-[#10D6A0]/30'
                                : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                            }`}
                          >
                            {isCredit ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate max-w-[180px] sm:max-w-[220px]">
                              {tx.reason || tx.transactionType}
                            </p>
                            <p className="text-[10px] text-[#8194B7] mt-0.5">
                              {new Date(tx.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span
                            className={`font-black block text-xs ${
                              isCredit ? 'text-[#10D6A0]' : 'text-slate-300'
                            }`}
                          >
                            {isCredit ? '+' : ''}PKR {Math.abs(tx.amount).toLocaleString()}
                          </span>
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-md ${
                              tx.status === 'COMPLETED'
                                ? 'bg-[#10D6A0]/15 text-[#10D6A0]'
                                : 'bg-[#FFD45A]/15 text-[#FFD45A]'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : recentSubmissions && recentSubmissions.length > 0 ? (
                <div className="space-y-2.5">
                  {recentSubmissions.slice(0, 5).map((sub: any) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-2xl bg-[#061633] border border-[#173C73]/60 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="font-bold text-white truncate">{sub.task?.title}</p>
                        <p className="text-[10px] text-[#8194B7] mt-0.5">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sub.status === 'APPROVED'
                            ? 'bg-[#10D6A0]/15 text-[#10D6A0]'
                            : sub.status === 'REJECTED'
                            ? 'bg-[#EF4444]/15 text-[#EF4444]'
                            : 'bg-[#1264F5]/15 text-[#22D3EE]'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-[#061633] border border-[#173C73]/40 space-y-1.5">
                  <Clock className="w-6 h-6 text-[#8194B7] mx-auto" />
                  <p className="text-xs font-bold text-slate-300">No activity recorded yet</p>
                  <p className="text-[11px] text-[#8194B7]">
                    Complete Task 1 in Level 1 to earn your first reward!
                  </p>
                </div>
              )}
            </div>

            {/* I. Invite Friends Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0B2248] via-[#071B3A] to-[#04132F] border border-[#173C73] shadow-xl space-y-4 relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FFD45A] to-[#F59E0B] p-0.5 shadow-md flex items-center justify-center">
                    <div className="w-full h-full bg-[#020B20] rounded-[14px] flex items-center justify-center text-[#FFD45A]">
                      <Gift className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#22D3EE] bg-[#22D3EE]/15 border border-[#22D3EE]/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#22D3EE]" /> Active Program
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Referral Link
                  </h3>
                </div>

                {/* Referral Link Box with Copy Action */}
                <div className="p-3 rounded-2xl bg-[#061633] border border-[#173C73] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#22D3EE] font-mono truncate select-all flex-1">
                    {referralLink}
                  </span>
                  <button
                    onClick={handleCopyReferral}
                    className="p-1.5 rounded-xl bg-[#1264F5] hover:bg-[#315BFF] text-white transition-all flex items-center gap-1 text-[11px] font-bold px-2.5 flex-shrink-0"
                    title="Copy Link"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Bottom Invite CTA */}
              <div className="pt-2">
                <Link
                  to="/app/referrals"
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#FFD45A] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#FFD45A] text-[#020B20] text-xs font-black shadow-lg shadow-[#FFD45A]/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01]"
                >
                  <Users className="w-4 h-4" />
                  <span>Invite 3 Friends (Extra Spin)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================
          HELP CENTER MODAL
          Interactive help modal when user clicks Help Center
          ======================================================== */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#020B20]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in overflow-y-auto overscroll-contain">
          <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto overscroll-contain rounded-3xl bg-[#071B3A] border border-[#173C73] p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#173C73]/50 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#10D6A0]/15 border border-[#10D6A0]/30 flex items-center justify-center text-[#10D6A0]">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Royal Help Center</h3>
                  <p className="text-[11px] text-[#B7C6E4]">Support & common inquiries</p>
                </div>
              </div>
              <button
                onClick={() => setHelpModalOpen(false)}
                className="p-2 rounded-xl bg-[#061633] text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#B7C6E4]">
              <div className="p-3.5 rounded-2xl bg-[#061633] border border-[#173C73]/60 space-y-1">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10D6A0]" />
                  How do tasks work?
                </h4>
                <p className="leading-relaxed">
                  Tasks are completed sequentially across 10 levels. After completing a task, submit confirmation for admin review. Once approved, your PKR reward is credited and the next task unlocks.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#061633] border border-[#173C73]/60 space-y-1">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-[#FFD45A]" />
                  How do withdrawals work?
                </h4>
                <p className="leading-relaxed">
                  Go to the Withdraw page, select your preferred payment channel (EasyPaisa / JazzCash / Bank), enter your details, and submit. Funds are processed after admin confirmation.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#061633] border border-[#173C73]/60 space-y-1">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-[#22D3EE]" />
                  How do I unlock Level 2?
                </h4>
                <p className="leading-relaxed">
                  All 10 tasks in Level 1 must be approved by the administrator before Level 2 unlocks. Each tier follows the same rule up to Level 10.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={() => setHelpModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#1264F5] hover:bg-[#315BFF] text-white text-xs font-bold transition-all shadow-md"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
