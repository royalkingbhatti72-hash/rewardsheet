import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Share2,
  Copy,
  CheckCircle2,
  Crown,
  TrendingUp,
  UserCheck,
  Gift,
  QrCode,
  Sparkles,
  ShieldCheck,
  Award,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Send,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Info,
  Percent,
  Zap,
  Target,
  Flame,
  Check,
} from 'lucide-react';
import { api } from '../../api/client';

export const ReferralsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'QUALIFIED' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [calculatorCount, setCalculatorCount] = useState<number>(10);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    api
      .getReferrals()
      .then(setData)
      .catch((err) => console.error('Failed to load referrals:', err))
      .finally(() => setLoading(false));
  }, []);

  const referralCode = data?.referralCode || 'ROYALVIP';
  const rewardPerReferral = data?.rewardPerReferral || 250;
  const totalReferrals = data?.totalReferrals || 0;
  const qualifiedReferrals = data?.qualifiedReferrals || 0;
  const pendingReferrals = Math.max(0, totalReferrals - qualifiedReferrals);
  const totalEarned = data?.totalEarned || 0;
  const rawReferrals = data?.referrals || [];

  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    referralLink
  )}&color=020B20&bgcolor=FFD45A&margin=8`;

  // Copy helpers
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Social sharing handlers
  const shareMessage = `👑 Join Earn Sheet with my exclusive invite code ${referralCode} and start earning instant cash commissions on daily tasks! Register here: ${referralLink}`;

  const shareViaWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const shareViaTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(
        `Join Earn Sheet with code ${referralCode} and earn daily cash!`
      )}`,
      '_blank'
    );
  };

  const shareViaFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      '_blank'
    );
  };

  const shareViaNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Earn Sheet VIP Invitation',
          text: `Join Earn Sheet using my code ${referralCode} and earn cash!`,
          url: referralLink,
        });
      } catch (err) {
        // Ignored if cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  // Ambassador Tier Calculation
  const tiers = [
    {
      id: 'BRONZE',
      name: 'Bronze Ambassador',
      min: 0,
      target: 5,
      badge: '🥉',
      color: 'from-amber-700 to-amber-900',
      border: 'border-amber-600/40',
      text: 'text-amber-300',
      bonus: `PKR ${rewardPerReferral.toLocaleString()} / referral`,
      perk: 'Standard referral commission on all partners',
    },
    {
      id: 'SILVER',
      name: 'Silver Ambassador',
      min: 6,
      target: 15,
      badge: '🥈',
      color: 'from-slate-400 to-slate-600',
      border: 'border-slate-300/40',
      text: 'text-slate-200',
      bonus: '+ Free Royal Milestone Spin',
      perk: '1 Free Milestone Spin on reaching 10 qualified partners',
    },
    {
      id: 'GOLD',
      name: 'Gold Ambassador',
      min: 16,
      target: 30,
      badge: '🥇',
      color: 'from-yellow-500 to-amber-600',
      border: 'border-[#FFD45A]/50',
      text: 'text-[#FFD45A]',
      bonus: 'PKR 5,000 Milestone Bonus + VIP Fast Payouts',
      perk: 'Priority withdrawal approval & high-tier ambassador perks',
    },
  ];

  const currentTierIndex = useMemo(() => {
    if (totalReferrals >= 16) return 2;
    if (totalReferrals >= 6) return 1;
    return 0;
  }, [totalReferrals]);

  const currentTier = tiers[currentTierIndex];
  const nextTier = tiers[currentTierIndex + 1] || null;

  const progressToNext = useMemo(() => {
    if (!nextTier) return 100;
    const prevMax = currentTier.min;
    const range = nextTier.target - prevMax;
    const done = totalReferrals - prevMax;
    return Math.min(100, Math.max(0, Math.round((done / range) * 100)));
  }, [totalReferrals, currentTier, nextTier]);

  // Conversion Rate
  const conversionRate = totalReferrals > 0
    ? Math.round((qualifiedReferrals / totalReferrals) * 100)
    : 0;

  // Filtered & Searched Referrals
  const filteredReferrals = useMemo(() => {
    return rawReferrals.filter((ref: any) => {
      // Status filter
      if (activeFilter === 'QUALIFIED' && ref.qualifyingStatus !== 'QUALIFIED') return false;
      if (activeFilter === 'PENDING' && ref.qualifyingStatus === 'QUALIFIED') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = ref.name?.toLowerCase().includes(query);
        const phoneMatch = ref.maskedPhone?.toLowerCase().includes(query);
        return nameMatch || phoneMatch;
      }
      return true;
    });
  }, [rawReferrals, activeFilter, searchQuery]);

  // Earnings calculation for calculator widget
  const estimatedEarnings = calculatorCount * rewardPerReferral;
  const estimatedSpins = Math.floor(calculatorCount / 5);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-[#1459E8]/30 border-t-[#FFD45A] rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400 tracking-wide">Loading Royal Referral Network...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-7 pb-12">
      {/* ======================================================== */}
      {/* 1. HERO HEADER */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#04132F] via-[#020B20] to-[#04132F] border border-[#FFD45A]/30 p-6 sm:p-8 shadow-2xl shadow-[#1459E8]/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFD45A]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#1459E8]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#FFD45A]/15 border border-[#FFD45A]/40 px-3.5 py-1 rounded-full text-xs font-bold text-[#FFD45A]">
              <Crown className="w-3.5 h-3.5" />
              <span>Royal VIP Ambassador Program</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Royal Referral Network
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Invite friends and build your financial kingdom. Earn{' '}
              <strong className="text-[#FFD45A] font-bold">
                PKR {rewardPerReferral.toLocaleString()} instant cash
              </strong>{' '}
              for every qualified partner who joins under your royal banner.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-[#071B3A]/90 border border-[#173C73] px-3.5 py-2 rounded-2xl flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#10D6A0]" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block font-medium">Payout Speed</span>
                <span className="text-xs font-bold text-white">Instant Credit</span>
              </div>
            </div>
            <div className="bg-[#071B3A]/90 border border-[#173C73] px-3.5 py-2 rounded-2xl flex items-center gap-2">
              <Award className="w-4 h-4 text-[#FFD45A]" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block font-medium">Your Tier</span>
                <span className="text-xs font-bold text-[#FFD45A]">{currentTier.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ROYAL SHARE & QR VIP CARD */}
      {/* ======================================================== */}
      <div className="royal-card p-6 sm:p-8 rounded-3xl border border-[#FFD45A]/40 bg-gradient-to-b from-[#071B3A] to-[#041228] shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Left Column: Link, Code & Social Buttons */}
          <div className="flex-1 w-full space-y-5">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFD45A] flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> Your Personal Invitation Link
              </span>
              <p className="text-xs text-slate-300">
                Share this link or your unique code. All registrations will be instantly linked to your account.
              </p>
            </div>

            {/* Referral Link Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Full Referral Link
              </label>
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <div className="flex-1 bg-[#020B20] border border-[#173C73] rounded-2xl px-4 py-3 text-xs text-white font-mono truncate select-all flex items-center">
                  {referralLink}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FFD45A] to-amber-400 text-[#020B20] font-black text-xs shadow-lg hover:shadow-[#FFD45A]/30 transition-all flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer active:scale-95"
                >
                  {copiedLink ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-900" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Referral Code Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-[#020B20] border border-[#173C73] rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Referral Code
                  </span>
                  <span className="text-base font-black text-[#FFD45A] font-mono tracking-wider">
                    {referralCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-xl bg-[#071B3A] border border-[#214B91] hover:border-[#FFD45A]/50 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-[#10D6A0]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#FFD45A]" />
                  )}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="bg-[#020B20] border border-[#173C73] rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Per Qualified Partner
                  </span>
                  <span className="text-base font-black text-[#10D6A0]">
                    +PKR {rewardPerReferral.toLocaleString()}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-[#10D6A0]/15 flex items-center justify-center text-[#10D6A0]">
                  <Gift className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Quick 1-Click Social Shares */}
            <div className="space-y-2 pt-2 border-t border-[#173C73]/50">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Instant 1-Click Social Sharing
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={shareViaWhatsApp}
                  className="bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={shareViaTelegram}
                  className="bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/40 text-[#229ED9] px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram</span>
                </button>

                <button
                  type="button"
                  onClick={shareViaFacebook}
                  className="bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/40 text-[#1877F2] px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Facebook</span>
                </button>

                <button
                  type="button"
                  onClick={shareViaNative}
                  className="bg-[#FFD45A]/15 hover:bg-[#FFD45A]/25 border border-[#FFD45A]/40 text-[#FFD45A] px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>More Apps</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Royal QR Code Display */}
          <div className="w-full lg:w-72 flex-shrink-0 flex flex-col items-center text-center p-5 rounded-2xl bg-[#020B20]/90 border border-[#FFD45A]/30 space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#FFD45A] uppercase tracking-wider">
              <QrCode className="w-4 h-4 text-[#FFD45A]" />
              <span>Royal QR Invite</span>
            </div>

            <div className="relative p-2.5 bg-[#FFD45A] rounded-2xl shadow-xl shadow-[#FFD45A]/10 border-2 border-[#FFD45A]">
              <img
                src={qrCodeUrl}
                alt="Referral QR Code"
                className="w-44 h-44 rounded-xl object-contain block"
              />
            </div>

            <p className="text-[11px] text-slate-400 max-w-[200px] leading-snug">
              Point any mobile camera at this QR code to register instantly.
            </p>

            <a
              href={qrCodeUrl}
              download="Royal-Referral-QR.png"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-[#22D3EE] hover:underline flex items-center gap-1 mt-1"
            >
              <span>Download QR Image</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. AMBASSADOR PROGRESSION & TIER MILESTONES */}
      {/* ======================================================== */}
      <div className="royal-card p-6 sm:p-7 rounded-3xl border border-[#173C73] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FFD45A]" /> Ambassador Progression Tiers
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Unlock higher rewards, milestone cash bonuses, and free royal spins as your network expands.
            </p>
          </div>

          {nextTier && (
            <div className="bg-[#020B20] px-3.5 py-1.5 rounded-xl border border-[#173C73] text-xs font-semibold text-slate-300 flex items-center gap-2">
              <span>Next Tier:</span>
              <span className="text-[#FFD45A] font-bold">{nextTier.name}</span>
              <span className="text-[10px] text-slate-400">
                ({totalReferrals}/{nextTier.target} invites)
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400">
              Tier Progress ({totalReferrals} invites)
            </span>
            <span className="text-[#FFD45A] font-bold">{progressToNext}% to Next Rank</span>
          </div>
          <div className="w-full h-3 bg-[#020B20] rounded-full overflow-hidden border border-[#173C73]">
            <div
              className="h-full bg-gradient-to-r from-[#1459E8] via-[#22D3EE] to-[#FFD45A] rounded-full transition-all duration-700 ease-out shadow-lg"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
        </div>

        {/* Tier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          {tiers.map((t, idx) => {
            const isCurrent = idx === currentTierIndex;
            const isCompleted = idx < currentTierIndex;
            const isLocked = idx > currentTierIndex;

            return (
              <div
                key={t.id}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                  isCurrent
                    ? 'bg-[#071B3A] border-[#FFD45A]/60 shadow-lg shadow-[#FFD45A]/10 ring-1 ring-[#FFD45A]/40'
                    : isCompleted
                    ? 'bg-[#05152F] border-emerald-500/40 opacity-90'
                    : 'bg-[#030E22] border-[#173C73]/40 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{t.badge}</span>
                    <h3 className={`text-xs font-black uppercase tracking-wider ${t.text}`}>
                      {t.name}
                    </h3>
                  </div>
                  {isCurrent && (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-[#FFD45A]/20 border border-[#FFD45A]/50 text-[#FFD45A] px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> Achieved
                    </span>
                  )}
                  {isLocked && (
                    <span className="text-[9px] font-semibold text-slate-500 bg-[#020B20] px-2 py-0.5 rounded-full border border-slate-700">
                      Locked
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-[11px] font-bold text-white">{t.bonus}</p>
                  <p className="text-[10px] text-slate-400 leading-snug">{t.perk}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#173C73]/40 text-[10px] font-semibold text-slate-400">
                  Target: {t.min === 0 ? '1 - 5' : t.min === 6 ? '6 - 15' : '16+'} Qualified Invites
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. PERFORMANCE STATS CARDS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="royal-card p-4 sm:p-5 rounded-2xl border border-[#173C73] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Network Size
            </span>
            <Users className="w-4 h-4 text-[#22D3EE]" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white block">
            {totalReferrals}
          </span>
          <span className="text-[10px] text-slate-400 block">Total registered members</span>
        </div>

        <div className="royal-card p-4 sm:p-5 rounded-2xl border border-[#173C73] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Qualified Partners
            </span>
            <UserCheck className="w-4 h-4 text-[#10D6A0]" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-[#10D6A0] block">
            {qualifiedReferrals}
          </span>
          <span className="text-[10px] text-slate-400 block">Active task completers</span>
        </div>

        <div className="royal-card p-4 sm:p-5 rounded-2xl border border-[#173C73] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Total Commissions
            </span>
            <Crown className="w-4 h-4 text-[#FFD45A]" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-[#FFD45A] block">
            PKR {totalEarned.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block">Credited to cash balance</span>
        </div>

        <div className="royal-card p-4 sm:p-5 rounded-2xl border border-[#173C73] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Success Rate
            </span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-purple-300 block">
            {conversionRate}%
          </span>
          <span className="text-[10px] text-slate-400 block">Partner activation ratio</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. INTERACTIVE EARNINGS CALCULATOR */}
      {/* ======================================================== */}
      <div className="royal-card p-6 sm:p-7 rounded-3xl border border-[#1459E8]/40 bg-gradient-to-r from-[#071B3A] to-[#04132F] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#FFD45A]" /> Royal Earnings Projection Calculator
            </h2>
            <p className="text-xs text-slate-300">
              Drag the slider to see how much cash and perks you can earn by sharing Earn Sheet.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Potential Cash Payout</span>
            <span className="text-xl sm:text-2xl font-black text-[#10D6A0]">
              PKR {estimatedEarnings.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span>Invite Target: <strong className="text-[#FFD45A] text-sm">{calculatorCount} Partners</strong></span>
            <span className="text-slate-400">Max: 100 Partners</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={calculatorCount}
            onChange={(e) => setCalculatorCount(parseInt(e.target.value, 10))}
            className="w-full h-2.5 bg-[#020B20] rounded-lg appearance-none cursor-pointer accent-[#FFD45A] border border-[#173C73]"
          />
        </div>

        {/* Calculated Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-[#020B20]/80 p-3.5 rounded-2xl border border-[#173C73] text-left">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Direct Referral Cash</span>
            <span className="text-sm font-black text-[#FFD45A]">PKR {estimatedEarnings.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Credited immediately</span>
          </div>
          <div className="bg-[#020B20]/80 p-3.5 rounded-2xl border border-[#173C73] text-left">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Milestone Spin Tickets</span>
            <span className="text-sm font-black text-[#22D3EE]">+{estimatedSpins} Free Spins</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Win up to PKR 50,000</span>
          </div>
          <div className="bg-[#020B20]/80 p-3.5 rounded-2xl border border-[#173C73] text-left">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Projected Ambassador Rank</span>
            <span className="text-sm font-black text-emerald-400">
              {calculatorCount >= 16 ? 'Gold VIP Ambassador' : calculatorCount >= 6 ? 'Silver Ambassador' : 'Bronze Ambassador'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Full royalty prestige</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. HOW IT WORKS 3-STEP SYSTEM */}
      {/* ======================================================== */}
      <div className="royal-card p-6 sm:p-7 rounded-3xl border border-[#173C73] space-y-4">
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FFD45A]" /> How Royal Referrals Work
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#020B20] border border-[#173C73] space-y-2 relative">
            <div className="w-8 h-8 rounded-xl bg-[#1459E8]/20 border border-[#1459E8]/40 text-[#2478FF] flex items-center justify-center font-black text-sm">
              1
            </div>
            <h3 className="text-xs font-bold text-white">Share Your Link / QR</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Send your personal link or display your Royal QR code to friends, social media, and messaging groups.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#020B20] border border-[#173C73] space-y-2 relative">
            <div className="w-8 h-8 rounded-xl bg-[#FFD45A]/20 border border-[#FFD45A]/40 text-[#FFD45A] flex items-center justify-center font-black text-sm">
              2
            </div>
            <h3 className="text-xs font-bold text-white">Partner Registers & Plays</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Your partner signs up with your code and starts completing their daily tasks and tiers on the platform.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#020B20] border border-[#173C73] space-y-2 relative">
            <div className="w-8 h-8 rounded-xl bg-[#10D6A0]/20 border border-[#10D6A0]/40 text-[#10D6A0] flex items-center justify-center font-black text-sm">
              3
            </div>
            <h3 className="text-xs font-bold text-white">Instant Cash Commission</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Earn PKR {rewardPerReferral.toLocaleString()} bonus directly credited to your cash wallet with 100% withdrawal eligibility!
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 7. REFERRED PARTNERS DIRECTORY */}
      {/* ======================================================== */}
      <div className="royal-card p-6 sm:p-7 rounded-3xl border border-[#173C73] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#2478FF]" /> Your Referred Partners Directory
            </h2>
            <p className="text-xs text-slate-300">
              Complete list of members registered under your network with real-time verification and reward status.
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-[#1459E8] text-white shadow-md'
                  : 'bg-[#020B20] text-slate-400 border border-[#173C73] hover:text-white'
              }`}
            >
              All ({totalReferrals})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('QUALIFIED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'QUALIFIED'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-[#020B20] text-slate-400 border border-[#173C73] hover:text-white'
              }`}
            >
              Qualified ({qualifiedReferrals})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-[#020B20] text-slate-400 border border-[#173C73] hover:text-white'
              }`}
            >
              Pending ({pendingReferrals})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search partners by name or masked phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-[#020B20] border border-[#173C73] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFD45A]/50 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Partners Table / Cards */}
        {filteredReferrals.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-[#173C73]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#020B20] text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-[#173C73]">
                  <th className="py-3 px-4">Partner</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#173C73]/40 bg-[#071B3A]/40">
                {filteredReferrals.map((r: any) => {
                  const isQualified = r.qualifyingStatus === 'QUALIFIED';
                  const initials = (r.name || 'Member')
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1459E8] to-[#22D3EE] flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{r.name}</span>
                            <span className="text-[10px] text-slate-400">ID #{r.id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{r.maskedPhone}</td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(r.registeredAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                            isQualified
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                          }`}
                        >
                          {isQualified ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>QUALIFIED</span>
                            </>
                          ) : (
                            <>
                              <Info className="w-3 h-3 text-amber-400" />
                              <span>PENDING ACTIVATION</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black whitespace-nowrap">
                        {isQualified ? (
                          <span className="text-[#10D6A0]">+PKR {r.rewardAmount.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Awaiting Tasks</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4 rounded-2xl bg-[#020B20]/60 border border-[#173C73] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#1459E8]/10 border border-[#1459E8]/30 text-[#22D3EE] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">
                {searchQuery || activeFilter !== 'ALL'
                  ? 'No matching partners found'
                  : 'No partners in your network yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || activeFilter !== 'ALL'
                  ? 'Try adjusting your search keywords or filter to find what you are looking for.'
                  : `Start inviting friends and earn PKR ${rewardPerReferral.toLocaleString()} bonus on every qualified partner!`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD45A] to-amber-400 text-[#020B20] font-black text-xs shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Your Referral Link</span>
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 8. AMBASSADOR FAQ & RULES ACCORDION */}
      {/* ======================================================== */}
      <div className="royal-card p-6 sm:p-7 rounded-3xl border border-[#173C73] space-y-4">
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#10D6A0]" /> Referral Program Guidelines & FAQ
        </h2>

        <div className="space-y-2.5">
          {[
            {
              q: 'When does a referred partner become "Qualified"?',
              a: 'A partner becomes qualified once they register using your referral link/code and complete initial tasks in Level 1. As soon as they complete the qualification criteria, PKR 250 is instantly credited to your wallet.',
            },
            {
              q: 'Is there any limit to how many people I can invite?',
              a: 'No! There is absolutely no limit. You can invite unlimited partners and continue earning PKR 250 per partner, plus milestone bonuses at 5, 15, and 30 referrals.',
            },
            {
              q: 'Can I withdraw my referral earnings immediately?',
              a: 'Yes, all referral commissions are credited directly as real cash balance in your Royal Wallet and can be withdrawn through JazzCash or EasyPaisa according to standard withdrawal limits.',
            },
            {
              q: 'What is the policy regarding multiple accounts or self-referrals?',
              a: 'Self-referrals, fake registrations, and running multiple accounts from the same device/IP are strictly prohibited by our anti-fraud security engine. Violators risk account suspension and forfeiture of bonus balances.',
            },
          ].map((item, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[#173C73] bg-[#020B20] overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-white hover:text-[#FFD45A] transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#FFD45A] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-[#173C73]/40 pt-2.5">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReferralsPage;
