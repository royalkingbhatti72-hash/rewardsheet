import React, { useState, useEffect } from 'react';
import {
  Crown,
  Disc,
  Sparkles,
  Gift,
  Coins,
  Trophy,
  History as HistoryIcon,
  AlertCircle,
  CheckCircle2,
  Lock,
  Volume2,
  VolumeX,
  ArrowRight,
  RefreshCw,
  ChevronRight,
  X,
  Info,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

const DEFAULT_FALLBACK_PRIZES = [
  { id: 'p1', displayLabel: 'PKR 50', name: 'PKR 50', prizeType: 'CASH', monetaryValue: 50, color: '#1459E8' },
  { id: 'p2', displayLabel: 'PKR 100', name: 'PKR 100', prizeType: 'CASH', monetaryValue: 100, color: '#792BFF' },
  { id: 'p3', displayLabel: 'Alto Car', name: 'Suzuki Alto Car', prizeType: 'PHYSICAL', monetaryValue: 2500000, color: '#059669', icon: 'car' },
  { id: 'p4', displayLabel: 'PKR 500', name: 'PKR 500', prizeType: 'CASH', monetaryValue: 500, color: '#DC2626' },
  { id: 'p5', displayLabel: 'PKR 1,000', name: 'PKR 1,000', prizeType: 'CASH', monetaryValue: 1000, color: '#0284C7' },
  { id: 'p6', displayLabel: 'PKR 5,000 Mega', name: 'PKR 5,000', prizeType: 'CASH', monetaryValue: 500, color: '#D97706' },
  { id: 'p7', displayLabel: 'Expensive Watch', name: 'Expensive Watch', prizeType: 'PHYSICAL', monetaryValue: 45000, color: '#4F46E5', icon: 'watch' },
  { id: 'p8', displayLabel: 'iPhone 15 Pro', name: 'iPhone 15 Pro', prizeType: 'PHYSICAL', monetaryValue: 350000, color: '#EAB308', icon: 'smartphone' },
];

const getPrizeProductImage = (prize: any) => {
  if (!prize) return null;
  if (prize.imageUrl) return prize.imageUrl;
  if (prize.image) return prize.image;

  const type = (prize.prizeType || '').toUpperCase();
  const name = (prize.name || '').toLowerCase();
  const label = (prize.displayLabel || '').toLowerCase();
  const icon = (prize.icon || '').toLowerCase();

  // Suzuki Alto Car (replaces 250)
  if (name.includes('alto') || label.includes('alto') || name.includes('car') || label.includes('car') || icon.includes('car') || label.includes('250')) {
    return '/images/spin/product-car.svg';
  }
  // iPhone 15 Pro / Smartphone
  if (name.includes('iphone') || label.includes('iphone') || name.includes('phone') || label.includes('phone') || icon.includes('phone') || icon.includes('mobile')) {
    return '/images/spin/product-smartphone.svg';
  }
  // Expensive Watch
  if (name.includes('watch') || label.includes('watch') || icon.includes('watch') || icon.includes('clock')) {
    return '/images/spin/product-watch.svg';
  }
  // Cash jackpot
  if (type === 'CASH' || name.includes('pkr') || label.includes('pkr') || icon === 'coins') {
    return '/images/spin/product-cash.svg';
  }
  // Physical gift / general physical product
  if (type === 'PHYSICAL' || name.includes('gift') || label.includes('gift') || icon.includes('gift')) {
    return '/images/spin/product-gift.svg';
  }
  return null;
};

// Enlarged, high-impact font sizes for bold casino excitement
const getFormattedWheelText = (rawLabel: string) => {
  const label = (rawLabel || '').trim();
  if (!label) return { line1: '', line2: null, fontSize: '4.0' };

  if (label.includes(' ') && label.length > 5) {
    const words = label.split(' ');
    if (words.length === 2) {
      const maxLen = Math.max(words[0].length, words[1].length);
      const fs = maxLen > 10 ? '3.0' : maxLen > 7 ? '3.5' : '4.0';
      return { line1: words[0], line2: words[1], fontSize: fs };
    }
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(' ');
    const line2 = words.slice(mid).join(' ');
    const maxLen = Math.max(line1.length, line2.length);
    const fs = maxLen > 10 ? '2.9' : maxLen > 7 ? '3.4' : '3.8';
    return { line1, line2, fontSize: fs };
  }

  const fs = label.length > 10 ? '3.3' : label.length > 7 ? '3.8' : '4.4';
  return { line1: label, line2: null, fontSize: fs };
};

// Synthesize pleasant casino audio clicks using Web Audio API
const playTick = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (_) {}
};

const playFanfare = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.55);
    });
  } catch (_) {}
};

export const SpinPage: React.FC = () => {
  const { refreshUser } = useAuth();
  const cachedSpin = api.getCachedData<any>('/spin/status');
  const [spinData, setSpinData] = useState<any>(cachedSpin);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [wonPrize, setWonPrize] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeLedPhase, setActiveLedPhase] = useState(0);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Prevent background scrolling when rules modal is open
  useBodyScrollLock(showRulesModal);

  // Blinking casino rim lights
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLedPhase((p) => (p + 1) % 2);
    }, 450);
    return () => clearInterval(interval);
  }, []);

  const loadSpinStatus = (silent = false) => {
    if (!silent) setIsSyncing(true);
    api
      .getSpinStatus()
      .then((res) => {
        setSpinData(res);
        setError(null);
      })
      .catch((err) => {
        if (!spinData) setError(err.message || 'Failed to load spin wheel');
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  useEffect(() => {
    loadSpinStatus(!!spinData);
  }, []);

  // Realtime Live Update Listener (Zero Reload Strategy)
  useEffect(() => {
    const handleLiveEvent = (e: any) => {
      const type = e.detail?.type;
      if (type === 'spin' || type === 'notification' || type === 'command' || type === 'all') {
        api.invalidateCache('/spin');
        loadSpinStatus(true);
        setLiveNotice('⚡ Instant Sync: Spin entitlements updated live!');
        setTimeout(() => setLiveNotice(null), 4500);
      }
    };

    window.addEventListener('royal_live_update', handleLiveEvent);
    return () => {
      window.removeEventListener('royal_live_update', handleLiveEvent);
    };
  }, []);

  const handleSpin = async () => {
    if (isSpinning || !spinData?.isEligible || spinData?.remainingSpins <= 0) return;

    setError(null);
    setWonPrize(null);
    setIsSpinning(true);

    try {
      const res = await api.playSpin();
      const prizes = (spinData?.prizes && spinData.prizes.length > 0) ? spinData.prizes : DEFAULT_FALLBACK_PRIZES;
      const prizeCount = prizes.length;
      const segmentAngle = 360 / prizeCount;

      const prizeIndex = res.prizeIndex >= 0 ? res.prizeIndex : 0;
      const extraRotations = 360 * 6;
      const targetAngle = extraRotations + (360 - (prizeIndex * segmentAngle + segmentAngle / 2));

      setRotationDegrees((prev) => prev + targetAngle);

      // Sound ticks during deceleration
      if (soundEnabled) {
        let tickCount = 0;
        const tickInterval = setInterval(() => {
          tickCount++;
          playTick();
          if (tickCount > 28) clearInterval(tickInterval);
        }, 120);
      }

      // 4.5 seconds for wheel deceleration
      setTimeout(async () => {
        setIsSpinning(false);
        setWonPrize(res.prize);

        if (soundEnabled) {
          playFanfare();
        }

        confetti({
          particleCount: 130,
          spread: 85,
          origin: { y: 0.6 },
          colors: ['#FFD45A', '#1459E8', '#22D3EE', '#792BFF', '#FFFFFF'],
        });

        await refreshUser();
        loadSpinStatus(true);
      }, 4500);
    } catch (err: any) {
      setIsSpinning(false);
      setError(err.message || 'Spin failed');
    }
  };

  const {
    remainingSpins = 0,
    isEligible = false,
    pendingMilestone = false,
    prizes: backendPrizes = [],
    history = [],
  } = spinData || {};

  const rawPrizes = backendPrizes && backendPrizes.length > 0 ? backendPrizes : DEFAULT_FALLBACK_PRIZES;
  const prizes = rawPrizes.map((p: any) => {
    const nameLower = (p.name || '').toLowerCase();
    const labelLower = (p.displayLabel || '').toLowerCase();
    if (nameLower.includes('250') || labelLower.includes('250') || nameLower.includes('alto') || labelLower.includes('alto')) {
      return { ...p, displayLabel: 'Alto Car', name: 'Suzuki Alto Car', prizeType: 'PHYSICAL', monetaryValue: 2500000, color: '#059669', icon: 'car' };
    }
    if (nameLower.includes('watch') || labelLower.includes('watch')) {
      return { ...p, displayLabel: 'Expensive Watch', name: 'Expensive Watch', prizeType: 'PHYSICAL', monetaryValue: 45000, color: '#4F46E5', icon: 'watch' };
    }
    if (nameLower.includes('phone') || labelLower.includes('phone') || nameLower.includes('iphone') || labelLower.includes('iphone')) {
      return { ...p, displayLabel: 'iPhone 15 Pro', name: 'iPhone 15 Pro', prizeType: 'PHYSICAL', monetaryValue: 350000, color: '#EAB308', icon: 'smartphone' };
    }
    return p;
  });
  const segmentAngle = 360 / (prizes.length || 1);

  // 24 LED casino lights around the bezel
  const ledBulbs = Array.from({ length: 24 });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Realtime Live Update Toast */}
      {liveNotice && (
        <div className="p-3 bg-gradient-to-r from-emerald-600/30 via-emerald-500/20 to-teal-600/30 border border-emerald-400/50 rounded-2xl text-emerald-200 text-xs flex items-center justify-center gap-2.5 max-w-md mx-auto shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-[#FFD45A] animate-spin" />
          <span className="font-bold">{liveNotice}</span>
        </div>
      )}

      {/* Clean Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <span>Daily Fortune Wheel</span>
            <Crown className="w-6 h-6 text-[#FFD45A]" />
          </h1>
          <p className="text-xs text-slate-400">Spin the wheel to win verified instant rewards & bumper gifts</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#FFD45A]" />
                <span>Sound ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span>Sound OFF</span>
              </>
            )}
          </button>
          <div className="px-4 py-2 bg-[#FFD45A]/15 border border-[#FFD45A]/40 rounded-xl text-xs font-bold text-[#FFD45A] flex items-center gap-1.5">
            <span>Available Spins: </span>
            <strong className="text-base text-white ml-0.5">{remainingSpins}</strong>
            {isSyncing && <RefreshCw className="w-3 h-3 text-[#FFD45A] animate-spin ml-1" />}
          </div>
        </div>
      </div>

      {/* Milestone Spin Under Review Banner */}
      {pendingMilestone && (
        <div className="p-4 bg-gradient-to-r from-[#FFD45A]/15 via-[#0B2248] to-[#1264F5]/20 border border-[#FFD45A]/50 rounded-2xl text-slate-200 text-xs max-w-3xl mx-auto shadow-lg backdrop-blur-md">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#FFD45A] uppercase tracking-wider text-[11px]">
                Milestone Free Spin Under Review
              </span>
              <span className="bg-[#FFD45A]/20 text-[#FFD45A] text-[10px] font-bold px-2 py-0.5 rounded-full">
                Task Milestone
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              You completed a milestone assignment! Administration is currently preparing your exclusive prize allocation. Once approved, your wheel spin unlocks automatically in real time without reloading!
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/15 border border-red-500/50 rounded-2xl text-red-300 text-sm flex items-center gap-3 max-w-xl mx-auto shadow-lg backdrop-blur-md">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Winner Celebration Modal Banner */}
      {wonPrize && (
        <div className="p-8 rounded-3xl border-2 border-[#FFD45A] bg-gradient-to-br from-[#0B1E48] via-[#04132F] to-[#020B20] text-center space-y-4 animate-in fade-in zoom-in duration-300 max-w-xl mx-auto shadow-2xl shadow-[#FFD45A]/30 relative overflow-hidden">
          <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden shadow-2xl border-2 border-[#FFD45A] bg-black">
            <img
              src="/images/spin/spin-jackpot-treasure.jpg"
              alt="Won Prize"
              className="w-full h-full object-cover animate-pulse"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFD45A]/20 border border-[#FFD45A] text-[#FFD45A] rounded-full text-xs font-bold uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5" />
            <span>Winner Announcement</span>
          </div>
          <h2 className="text-3xl font-black text-white">Congratulations! 🎉</h2>
          <div className="p-4 bg-[#FFD45A]/10 border border-[#FFD45A]/30 rounded-2xl">
            <p className="text-2xl font-black text-[#FFD45A]">{wonPrize.name}</p>
            <p className="text-xs text-slate-200 mt-1.5 font-medium leading-relaxed">
              {wonPrize.prizeType === 'CASH'
                ? `PKR ${wonPrize.monetaryValue.toLocaleString()} aap ke wallet balance mein sath sath add kar diya gaya hai!`
                : `Mubarak ho! Ye bumper prize (${wonPrize.name}) Level 10 mukammal karne ke baad VIP courier ke zariye aap ke address par deliver kiya jayega.`}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/wallet"
              className="px-6 py-2.5 bg-[#1459E8] hover:bg-[#1048bf] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg"
            >
              <span>View Wallet Balance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* The 3D Casino Wheel Main Stage (Enlarged with Casino Vibes) */}
      <div className="relative rounded-3xl p-4 sm:p-10 md:p-12 flex flex-col items-center justify-center bg-gradient-to-b from-[#0B1E48]/80 via-[#04132F] to-[#020B20] border border-[#214B91]/50 shadow-2xl overflow-hidden">
        {/* Glow backdrop aura */}
        <div className="absolute w-[450px] h-[450px] bg-[#1459E8]/25 rounded-full blur-3xl pointer-events-none -top-10" />
        <div className="absolute w-[450px] h-[450px] bg-[#FFD45A]/20 rounded-full blur-3xl pointer-events-none -bottom-10" />

        {/* Realistic Pointer Needle at Top (Enlarged) */}
        <div className="relative z-30 -mb-8 sm:-mb-9 flex flex-col items-center">
          <div
            className={`w-14 h-18 sm:w-16 sm:h-22 relative transition-transform duration-100 ${
              isSpinning ? 'rotate-[-4deg] scale-105' : 'rotate-0'
            }`}
          >
            <img
              src="/images/spin/spin-golden-pointer.svg"
              alt="Golden Pointer Needle"
              className="w-full h-full object-contain filter drop-shadow-[0_12px_18px_rgba(0,0,0,0.9)] drop-shadow-[0_0_18px_rgba(255,212,90,0.8)]"
            />
          </div>
        </div>

        {/* Outer Casino Bezel with 24 Blinking LED Bulbs (Enlarged from 420px to 480px) */}
        <div className="relative w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] md:w-[480px] md:h-[480px] rounded-full p-4 sm:p-5 flex items-center justify-center bg-gradient-to-b from-[#FFE58F] via-[#B8860B] to-[#78590A] shadow-[0_0_60px_rgba(255,212,90,0.45),inset_0_0_25px_rgba(0,0,0,0.85)] border-4 border-[#FFD45A]">
          {/* LED Bulbs placed circularly */}
          {ledBulbs.map((_, i) => {
            const angle = (i * 360) / ledBulbs.length;
            const isLightOn = (i + activeLedPhase) % 2 === 0;
            return (
              <div
                key={i}
                className="absolute w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all duration-300"
                style={{
                  top: `calc(50% - 6px + ${48 * Math.sin((angle * Math.PI) / 180)}%)`,
                  left: `calc(50% - 6px + ${48 * Math.cos((angle * Math.PI) / 180)}%)`,
                  backgroundColor: isLightOn ? '#FFD45A' : '#1459E8',
                  boxShadow: isLightOn
                    ? '0 0 12px #FFD45A, 0 0 22px #FFD45A'
                    : '0 0 10px #22D3EE',
                }}
              />
            );
          })}

          {/* Inner Golden Rim Frame */}
          <div className="w-full h-full rounded-full p-2 bg-[#020B20] border-2 border-[#FFE58F]/60 shadow-[inset_0_0_25px_rgba(0,0,0,0.9)] relative flex items-center justify-center overflow-hidden">
            {/* The Rotating Wheel SVG */}
            <svg
              className="w-full h-full rounded-full shadow-2xl transition-transform duration-[4500ms] cubic-bezier(0.12, 0.95, 0.22, 1)"
              viewBox="0 0 100 100"
              style={{ transform: `rotate(${rotationDegrees}deg)` }}
            >
              <defs>
                <radialGradient id="royalWheelGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0B1E48" />
                  <stop offset="85%" stopColor="#020B20" />
                  <stop offset="100%" stopColor="#000000" />
                </radialGradient>
                <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="0.8" floodColor="#FFD45A" floodOpacity="0.8" />
                </filter>
              </defs>

              {prizes.map((p: any, idx: number) => {
                const startAngle = idx * segmentAngle;
                const endAngle = (idx + 1) * segmentAngle;
                const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
                const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);
                const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                // Mid angle for text label and icon placement
                const midAngle = startAngle + segmentAngle / 2;
                const rad = (Math.PI * (midAngle - 90)) / 180;

                // Center of text label placed at r=36.5 (wide outer region)
                const tx = 50 + 36.5 * Math.cos(rad);
                const ty = 50 + 36.5 * Math.sin(rad);

                // Picture of product placed at r=22 (enlarged for prominent visual vibe)
                const ix = 50 + 22 * Math.cos(rad);
                const iy = 50 + 22 * Math.sin(rad);
                const productImg = getPrizeProductImage(p);

                // Segment color schemes
                const segmentStyles = [
                  { fill: '#1459E8', text: '#FFFFFF' },
                  { fill: '#792BFF', text: '#FFFFFF' },
                  { fill: '#059669', text: '#FFFFFF' },
                  { fill: '#DC2626', text: '#FFFFFF' },
                  { fill: '#0284C7', text: '#FFFFFF' },
                  { fill: '#D97706', text: '#020B20' },
                  { fill: '#4F46E5', text: '#FFFFFF' },
                  { fill: '#EAB308', text: '#020B20' },
                ];
                const currentStyle = segmentStyles[idx % segmentStyles.length];
                const wheelText = getFormattedWheelText(p.displayLabel || p.name);

                return (
                  <g key={p.id || idx}>
                    <path
                      d={pathData}
                      fill={p.color || currentStyle.fill}
                      stroke="#FFD45A"
                      strokeWidth="0.8"
                    />

                    {/* Enlarged Product Image (12x12 instead of 7.5x7.5 for maximum visual impact) */}
                    {productImg && (
                      <image
                        href={productImg}
                        xlinkHref={productImg}
                        x={ix - 6}
                        y={iy - 6}
                        width="12"
                        height="12"
                        preserveAspectRatio="xMidYMid meet"
                        transform={`rotate(${midAngle}, ${ix}, ${iy})`}
                        style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.95))' }}
                      />
                    )}

                    {/* Enlarged, Bold Wheel Prize Display Text */}
                    <text
                      x={tx}
                      y={ty}
                      fill={currentStyle.text}
                      fontSize={wheelText.fontSize}
                      fontWeight="900"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.95))"
                      transform={`rotate(${midAngle}, ${tx}, ${ty})`}
                    >
                      {wheelText.line2 ? (
                        <>
                          <tspan x={tx} dy="-1.5">{wheelText.line1}</tspan>
                          <tspan x={tx} dy="3.5">{wheelText.line2}</tspan>
                        </>
                      ) : (
                        wheelText.line1
                      )}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* 3D Realistic Gold Center Medallion (Enlarged) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-full overflow-hidden border-4 border-[#FFD45A] shadow-[0_0_30px_rgba(255,212,90,0.85)] bg-[#020B20] relative flex items-center justify-center">
                <img
                  src="/images/spin/spin-gold-center-hub.jpg"
                  alt="Royal Crown Hub"
                  className="w-full h-full object-cover scale-110"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Spin Button & Status */}
        <div className="text-center space-y-4 mt-8 z-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#020B20]/90 border border-[#214B91] rounded-full text-xs text-slate-300">
            <span>Remaining Daily Spins:</span>
            <strong className="text-[#FFD45A] font-black text-sm">{remainingSpins}</strong>
          </div>

          <div>
            {isEligible && remainingSpins > 0 ? (
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className="group relative px-12 py-5 bg-gradient-to-r from-[#FFD45A] via-yellow-400 to-[#FFD45A] hover:from-yellow-400 hover:to-amber-300 active:scale-95 text-[#020B20] font-black text-lg rounded-2xl shadow-[0_0_35px_rgba(255,212,90,0.5)] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3 mx-auto cursor-pointer"
              >
                {isSpinning ? (
                  <>
                    <span className="w-6 h-6 border-3 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span className="tracking-wide">SPINNING FORTUNE...</span>
                  </>
                ) : (
                  <>
                    <Disc className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="tracking-wide">SPIN NOW & WIN</span>
                  </>
                )}
              </button>
            ) : pendingMilestone ? (
              <div className="px-8 py-4 bg-[#FFD45A]/10 border border-[#FFD45A]/40 text-[#FFD45A] rounded-2xl text-xs font-semibold max-w-md mx-auto shadow-lg flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span>Milestone spin under review. Unlocks automatically live when approved.</span>
              </div>
            ) : (
              <div className="px-8 py-4 bg-[#0B2248]/80 border border-[#1459E8]/40 text-slate-300 rounded-2xl text-xs font-semibold max-w-md mx-auto shadow-lg flex items-center justify-center gap-2 text-center">
                <Lock className="w-4 h-4 text-[#FFD45A] flex-shrink-0" />
                <span>Har level complete karne par 1 Free Spin milta hai. Azafi spin hasil karne ke liye 24 hours mein 3 friends invite karein.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terms & Conditions / Rules Footer Trigger (Below rewards products) */}
      <div className="pt-2 pb-6 flex justify-center">
        <button
          onClick={() => setShowRulesModal(true)}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#FFD45A]/15 via-[#0B2248] to-[#1459E8]/20 hover:from-[#FFD45A]/25 hover:to-[#1459E8]/30 border border-[#FFD45A]/50 text-[#FFD45A] transition-all shadow-lg active:scale-95 cursor-pointer group backdrop-blur-md"
        >
          <Info className="w-4 h-4 text-[#FFD45A] group-hover:rotate-12 transition-transform" />
          <span>Terms & Conditions / Prize Rules (Touch Karein)</span>
          <ChevronRight className="w-4 h-4 text-[#FFD45A]/70 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Recent Won Prizes History */}
      {history && history.length > 0 && (
        <div className="rounded-2xl bg-[#07132B]/70 border border-[#162E5B] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HistoryIcon className="w-4 h-4 text-[#FFD45A]" />
              <span>Your Spin History</span>
            </h3>
            <span className="text-xs text-slate-400">{history.length} records</span>
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map((item: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-[#0B2248]/50 border border-[#162E5B]/50 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">{item.prize?.name || 'Spin Prize'}</span>
                </div>
                <span className="text-slate-400">
                  {new Date(item.spunAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Terms & Conditions Modal (Touch / Tap Popup) */}
      {showRulesModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto overscroll-contain"
          onClick={() => setShowRulesModal(false)}
        >
          <div
            className="bg-gradient-to-b from-[#0B1E48] via-[#04132F] to-[#020B20] border-2 border-[#FFD45A] rounded-3xl max-w-lg w-full max-h-[90dvh] overflow-y-auto overscroll-contain p-6 sm:p-7 shadow-[0_0_50px_rgba(255,212,90,0.35)] space-y-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FFD45A] via-[#1459E8] to-[#FFD45A]" />

            <div className="flex items-center justify-between border-b border-[#214B91]/50 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#FFD45A]/20 border border-[#FFD45A] flex items-center justify-center text-[#FFD45A] shadow-md">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Terms & Conditions & Prize Rules</h3>
                  <p className="text-[11px] text-slate-300">Qawaneen, inaamat delivery & policy details</p>
                </div>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formal Paragraph Design Document Content */}
            <div className="space-y-4 text-xs leading-relaxed text-slate-300 pr-1">
              {/* Introduction Paragraph */}
              <p className="text-[11.5px] text-slate-400 leading-relaxed border-b border-[#214B91]/40 pb-3">
                Ye rasmi sharaait aur qawaneen Earn Sheet platform par Daily Fortune Wheel se jeete gaye cash inaamat aur physical bumper prizes ki taqseem, verification aur delivery ke nizam ko wazeh karte hain. Spin mein hissa lete waqt tamam arkaan in sharaait ke paband hain.
              </p>

              {/* Clause 1: Instant Cash */}
              <div className="space-y-1">
                <h4 className="font-bold text-white text-[13px] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#10D6A0]/20 text-[#10D6A0] text-[10px] font-black flex items-center justify-center flex-shrink-0">1</span>
                  <span>Instant Cash Rewards &amp; Wallet Crediting</span>
                </h4>
                <p className="text-slate-300 pl-7 leading-relaxed">
                  Wheel se jeete gaye tamam cash amounts (<strong>PKR 50, PKR 100, PKR 500, PKR 1,000, aur PKR 5,000</strong>) spin mukammal hone ke foran baad <strong>sath sath aap ke account wallet balance mein add</strong> kar diye jaate hain. Cash rewards ke liye kisi qisam ki manual claim ya lambay intizar ki zaroorat nahi hoti; raqam foran aap ke balance mein show ho jaati hai aur platform withdrawal quota ke mutabiq withdrawable hoti hai.
                </p>
              </div>

              {/* Clause 2: Luxury Bumper Gifts */}
              <div className="space-y-1">
                <h4 className="font-bold text-white text-[13px] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FFD45A]/20 text-[#FFD45A] text-[10px] font-black flex items-center justify-center flex-shrink-0">2</span>
                  <span>Luxury Bumper Physical Prizes: Car, Mobile &amp; Watch</span>
                </h4>
                <p className="text-slate-300 pl-7 leading-relaxed">
                  Tamam physical bumper inaamat—jin mein <strong>Suzuki Alto Car, Apple iPhone 15 Pro, aur Expensive Luxury Watch</strong> shamil hain—platform ke grand tier completion inaamat hain. Platform rules ke mutabiq ye physical inaamat client ko <strong className="text-[#FFD45A] underline">Level 10 ke tamam marahil mukammal (complete) karne ke baad</strong> deliver kiye jayenge. Level 10 complete hone ke baad company ki dispatch team aap ke registered address par insured VIP courier ke zariye inaam rawana karegi.
                </p>
              </div>

              {/* Clause 3: Spin Allocation & Referrals */}
              <div className="space-y-1">
                <h4 className="font-bold text-white text-[13px] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#2478FF]/20 text-[#22D3EE] text-[10px] font-black flex items-center justify-center flex-shrink-0">3</span>
                  <span>Daily Spin Allocation &amp; Referral Program</span>
                </h4>
                <p className="text-slate-300 pl-7 leading-relaxed">
                  Har registered member ko har tier level mukammal karne par <strong>1 Free Spin</strong> faraham kiya jata hai. Is ke ilawa, arkaan 24 ghante ke doran apne referral code se 3 active doston ko invite karwa kar azafi bonus spins hasil kar sakte hain. Task milestone assignments complete hone par admin approval ke baad special spins foran live unlock ho jaate hain.
                </p>
              </div>

              {/* Clause 4: Fair Play & Security */}
              <div className="space-y-1">
                <h4 className="font-bold text-white text-[13px] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black flex items-center justify-center flex-shrink-0">4</span>
                  <span>Fair Play, Anti-Tampering &amp; Cryptographic Audit</span>
                </h4>
                <p className="text-slate-300 pl-7 leading-relaxed">
                  Har member ke liye strictly ek (1) tasdeeq shuda account istemal karne ki ijazat hai. Multiple accounts banana, fake referrals generate karna ya automated bot scripts ka istemal sakht mana hai. Har spin ka result automated cryptographic audit trail mein mehfooz hota hai taake 100% transparency aur barabari barqarar rahay.
                </p>
              </div>

              {/* Clause 5: Verification & Delivery Protocol */}
              <div className="space-y-1">
                <h4 className="font-bold text-white text-[13px] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black flex items-center justify-center flex-shrink-0">5</span>
                  <span>Physical Delivery &amp; Identity Verification Protocol</span>
                </h4>
                <p className="text-slate-300 pl-7 leading-relaxed">
                  Physical inaamat ki delivery se qabl member ka valid CNIC (National Identity Card) aur phone contact verify kiya jata hai taake inaam asal haqdar tak puhanche. Dispatch hone ke foran baad VIP courier tracking number member ke dashboard par faraham kiya jayega.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full py-3 bg-gradient-to-r from-[#FFD45A] to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg active:scale-98 cursor-pointer"
              >
                Samajh Gaya / Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
