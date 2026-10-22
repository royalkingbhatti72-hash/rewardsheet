import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  Sparkles,
  RefreshCw,
  MessageCircle,
  Send,
  Lock,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

interface MaintenancePageProps {
  settings?: {
    siteName?: string;
    supportWhatsapp?: string;
    supportTelegram?: string;
    supportEmail?: string;
    maintenanceTitle?: string;
    maintenanceMessage?: string;
    maintenanceExpectedEnd?: string | null;
  };
  onRefresh?: () => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ settings, onRefresh }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
    totalMs: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
    totalMs: 0,
  });

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      if (!settings?.maintenanceExpectedEnd) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, totalMs: 0 });
        return;
      }

      const target = new Date(settings.maintenanceExpectedEnd).getTime();
      const now = Date.now();
      const diff = target - now;

      if (isNaN(target) || diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, totalMs: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isPast: false,
        totalMs: diff,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [settings?.maintenanceExpectedEnd]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  const formattedTargetDate = settings?.maintenanceExpectedEnd
    ? (() => {
        try {
          const d = new Date(settings.maintenanceExpectedEnd);
          if (isNaN(d.getTime())) return null;
          return d.toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        } catch {
          return null;
        }
      })()
    : null;

  const siteName = settings?.siteName || 'Earn Street';
  const title = settings?.maintenanceTitle || 'System Maintenance & Core Upgrade';
  const message =
    settings?.maintenanceMessage ||
    'We are currently upgrading server systems and verifying database ledgers to deliver enhanced speed and reliability. Services will resume shortly.';

  return (
    <div className="min-h-screen bg-[#020712] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-[#1459E8]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-xl w-full mx-auto relative z-10 space-y-6 text-center">
        {/* Brand Icon & Pulsing Halo */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#1459E8] via-[#1E40AF] to-[#FFD45A] p-0.5 shadow-2xl shadow-[#1459E8]/40 animate-pulse">
            <div className="w-full h-full bg-[#04132F] rounded-[22px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[#1459E8]/20 to-transparent pointer-events-none" />
              <ShieldAlert className="w-12 h-12 text-[#FFD45A]" />
            </div>
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-[#020712]" />
          </span>
        </div>

        {/* Title & Badge */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Scheduled Maintenance In Progress</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {siteName} • {title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            {message}
          </p>
        </div>

        {/* Countdown Timer Block */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#071739]/80 border border-[#1459E8]/30 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-700/60 pb-2.5">
            <span className="flex items-center gap-1.5 font-bold text-slate-200">
              <Clock className="w-4 h-4 text-[#FFD45A]" />
              <span>Estimated Reopening Countdown</span>
            </span>
            {formattedTargetDate && (
              <span className="text-[11px] font-mono text-slate-400">
                Target: <strong className="text-white">{formattedTargetDate}</strong>
              </span>
            )}
          </div>

          {!timeLeft.isPast && timeLeft.totalMs > 0 ? (
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              <div className="p-2.5 sm:p-3 rounded-xl bg-[#020B20] border border-[#1E3A8A]/50">
                <span className="block text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                  Days
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-[#020B20] border border-[#1E3A8A]/50">
                <span className="block text-xl sm:text-2xl font-black text-[#FFD45A] font-mono tracking-tight">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                  Hours
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-[#020B20] border border-[#1E3A8A]/50">
                <span className="block text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                  Minutes
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-[#020B20] border border-[#1E3A8A]/50">
                <span className="block text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight animate-pulse">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                  Seconds
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span className="font-semibold">
                Finalizing system verification & security checks. Reopening any moment!
              </span>
            </div>
          )}

          {/* Security & Cold Storage Guarantee */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>
              All member account balances, pending tasks, and withdrawals are safe & intact.
            </span>
          </div>
        </div>

        {/* Support & Action Buttons */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            {settings?.supportWhatsapp && (
              <a
                href={`https://wa.me/${settings.supportWhatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-slate-950" />
                <span>WhatsApp Support</span>
              </a>
            )}

            {settings?.supportTelegram && (
              <a
                href={settings.supportTelegram}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs transition-all shadow-md active:scale-95"
              >
                <Send className="w-4 h-4 fill-white" />
                <span>Telegram Community</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#FFD45A]' : ''}`} />
              <span>{refreshing ? 'Checking Status...' : 'Check Status Now'}</span>
            </button>
          </div>
        </div>

        {/* Discreet Admin Link */}
        <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500">
          <span>Are you a platform administrator? </span>
          <a
            href="/adminpanal"
            className="text-slate-400 hover:text-[#FFD45A] inline-flex items-center gap-0.5 font-semibold transition-colors"
          >
            <Lock className="w-3 h-3" />
            <span>Admin Portal</span>
            <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
