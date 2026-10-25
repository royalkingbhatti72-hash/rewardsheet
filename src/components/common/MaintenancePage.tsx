import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

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

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ settings }) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    hasTarget: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    hasTarget: false,
  });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );

      if (settings?.maintenanceExpectedEnd) {
        const target = new Date(settings.maintenanceExpectedEnd).getTime();
        const diff = target - now.getTime();

        if (!isNaN(target) && diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          setTimeLeft({
            days,
            hours,
            minutes,
            seconds,
            hasTarget: true,
          });
          return;
        }
      }

      setTimeLeft({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        hasTarget: false,
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [settings?.maintenanceExpectedEnd]);

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

  return (
    <div className="min-h-screen bg-[#020712] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[#1459E8]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-lg w-full mx-auto relative z-10 space-y-8 text-center">
        <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
          Platform is under maintenance
        </h1>

        {timeLeft.hasTarget ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              <div className="p-3 sm:p-4 rounded-xl bg-[#071739]/80 border border-[#1459E8]/30">
                <span className="block text-2xl sm:text-3xl font-black text-white font-mono">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                  Days
                </span>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-[#071739]/80 border border-[#1459E8]/30">
                <span className="block text-2xl sm:text-3xl font-black text-[#FFD45A] font-mono">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                  Hours
                </span>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-[#071739]/80 border border-[#1459E8]/30">
                <span className="block text-2xl sm:text-3xl font-black text-white font-mono">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                  Minutes
                </span>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-[#071739]/80 border border-[#1459E8]/30">
                <span className="block text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                  Seconds
                </span>
              </div>
            </div>

            {formattedTargetDate && (
              <div className="text-xs sm:text-sm font-mono text-slate-400">
                Time: <strong className="text-white">{formattedTargetDate}</strong>
              </div>
            )}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#071739]/80 border border-[#1459E8]/30 text-slate-300 font-mono text-base sm:text-lg">
            <Clock className="w-5 h-5 text-[#FFD45A]" />
            <span>Time: {formattedTargetDate || currentTime}</span>
          </div>
        )}
      </div>
    </div>
  );
};
